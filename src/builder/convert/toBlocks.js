/* =====================================================================
   DisFuse Builder content → block editor blocks
   ---------------------------------------------------------------------
   The way back from ./fromBlocks.js: turns `{ commands, events,
   variables }` (a DisFuse Builder template) into blocks a block editor
   project can import, so one template works in both kinds of project.
   Nothing is saved; this only builds Blockly's JSON.

     commands  → "add slash command" / "add context menu" blocks in a
                 "create slash commands" block, and a section per
                 command (and per subcommand) inside "when a slash
                 command is received" / "when a context menu is clicked"
     events    → the event's hat (buttons, menus and forms with an ID get
                 an `if` on the ID, as the block editor does it)
     steps     → the step's block (src/elements), inputs by name
     values    → the same, or the block that reads an event's or a
                 step's value, a variable, or a command's option

   CHECKED BY CONVERTING BACK
   --------------------------
   The block editor and the builder don't line up everywhere, so every
   command, subcommand and event is converted back with fromBlocks.js
   and compared with what it started as. Where the blocks would do
   exactly the same thing, they're kept. Where they wouldn't (a step with
   no block like it, a setting a block can't hold), that one command or
   event becomes a code block holding the JavaScript the builder writes
   for it, so it still works exactly the same. The report says which.

   Command settings the block editor has no blocks for (translations,
   minimum and maximum values, suggestions, user installs) are left out,
   and the report says so too.

   WHAT THE CALLER PASSES IN
   -------------------------
   The same Blockly adapter as fromBlocks.js
   (Pages/Workspace/editor/blockAdapter.js), which this uses to read a
   block's inputs and fields and to find the block that reads a value.

   Plain JavaScript with explicit `.js` imports, so the check script can
   run it in Node.
   ===================================================================== */

import { acceptsValues } from "../catalog/define.js";
import { FLOW_CONTEXTS } from "../catalog/contexts.js";
import { Generator } from "../codegen/context.js";
import { DEFAULT_PINGS } from "../codegen/message.js";
import { commandFlows, eventCode, variableNames } from "../codegen/generate.js";
import { parseTemplateContent } from "../model/templates.js";
import { looseName } from "./blockJson.js";
import { DISPATCHERS } from "./dispatch.js";
import { BlockConverter, normaliseCode } from "./fromBlocks.js";
import { BLOCK_RULES, EVENT_SETTINGS } from "./rules.js";
import { blockOf, blocksOfElement } from "../../elements/index.js";

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** A Blockly-style block id. */
function randomBlockId() {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%()*+,-./:;=?@[]^_`{|}~";
  let id = "";
  for (let i = 0; i < 20; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
  return id;
}

/** Thrown when something has no block that does the same; the flow then becomes code. */
class NoBlock extends Error {}
const noBlock = (what) => {
  throw new NoBlock(what);
};

/** discord.js option readers by option type, as `slash_getoption` names them. */
const OPTION_GETTERS = { 3: "String", 4: "Integer", 5: "Boolean", 6: "User", 7: "Channel", 8: "Role", 9: "Mentionable", 10: "Number", 11: "Attachment" };

/** The "when … is used" events whose ID setting the block editor checks with an `if`. */
const DISPATCH_EVENTS = Object.fromEntries(
  Object.entries(DISPATCHERS)
    .filter(([, d]) => d.kind === "event")
    .map(([hat, d]) => [d.event, { hat, ...d }]),
);

/** Loops whose loop variable is the value their section provides (rules.js loopBranch). */
const LOOP_VARIABLES = { controls_forEach: { key: "item", name: "item" }, controls_for: { key: "number", name: "i" } };

/* ---------------------------------------------------------------------
   Comparing flows (for the check by converting back)
   --------------------------------------------------------------------- */

function sortedJson(value) {
  if (Array.isArray(value)) return `[${value.map(sortedJson).join(",")}]`;
  if (isObject(value))
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${sortedJson(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function sameValue(a, b) {
  return sortedJson(a) === sortedJson(b);
}

/**
 * A flow in a form two flows can be compared in: ids gone (steps are
 * numbered in order instead), variables and options by name, inputs left
 * at their default dropped, empty optional sections dropped.
 */
class Canon {
  constructor(catalog, { variableName, optionName }) {
    this.catalog = catalog;
    this.variableName = variableName;
    this.optionName = optionName;
    this.actionIndex = new Map();
  }

  index(actions) {
    for (const action of actions ?? []) {
      if (!action) continue;
      this.actionIndex.set(action.id, this.actionIndex.size);
      for (const branch of Object.values(action.branches ?? {}))
        for (const entry of Array.isArray(branch) ? branch : []) {
          if (Array.isArray(entry?.actions)) this.index(entry.actions);
          else this.index([entry]);
        }
    }
  }

  flow(actions) {
    this.index(actions);
    return (actions ?? []).map((action) => this.action(action));
  }

  action(action) {
    const def = this.catalog.actions.get(action?.type);
    const out = { type: action?.type, inputs: this.inputs(def?.inputs ?? [], action?.inputs), branches: {} };
    if (action?.disabled) out.disabled = true;
    for (const branchDef of def?.branches ?? []) {
      const list = action?.branches?.[branchDef.key];
      if (branchDef.repeat) {
        const items = Array.isArray(list) ? list : [];
        if (items.length)
          out.branches[branchDef.key] = items.map((item) => ({
            inputs: this.inputs(branchDef.inputs ?? [], item?.inputs),
            actions: (item?.actions ?? []).map((a) => this.action(a)),
          }));
        continue;
      }
      if (branchDef.optional && !(Array.isArray(list) && list.length)) continue;
      out.branches[branchDef.key] = (Array.isArray(list) ? list : []).map((a) => this.action(a));
    }
    return out;
  }

  inputs(defs, values = {}) {
    const out = {};
    for (const inputDef of defs) {
      const value = values?.[inputDef.key];
      if (!value) continue;
      if (value.ref) {
        out[inputDef.key] = { ref: this.ref(value.ref) };
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(value, "literal")) continue;
      const literal = this.literal(inputDef, value.literal);
      const fallback = this.literal(inputDef, inputDef.default);
      if (sameValue(literal, fallback)) continue;
      if (inputDef.kind === "text" && literal === "" && fallback === undefined) continue;
      out[inputDef.key] = { literal };
    }
    return out;
  }

  literal(inputDef, literal) {
    switch (inputDef.kind) {
      case "number": {
        if (literal === undefined || literal === null || literal === "") return undefined;
        const n = Number(literal);
        return Number.isFinite(n) ? n : undefined;
      }
      case "boolean":
        return literal === true || literal === "true" || literal === "TRUE";
      case "multi":
        return Array.isArray(literal) ? [...literal].map(String).sort() : [];
      case "group":
        return (Array.isArray(literal) ? literal : []).map((item) => this.inputs(inputDef.fields ?? [], item?.inputs));
      case "message":
        return {
          components: (literal?.components ?? []).map((c) => this.component(c)),
          files: (literal?.files ?? []).map((file) => this.inputs(FILE_FIELDS, file?.inputs)),
        };
      case "modal":
        return {
          inputs: this.inputs(MODAL_FIELDS_FOR_CANON, literal?.inputs),
          components: (literal?.components ?? []).map((c) => this.component(c)),
        };
      case "text":
      case "code":
      case "colour":
        return literal === undefined || literal === null ? literal : String(literal);
      default:
        return literal;
    }
  }

  component(component) {
    const def = this.catalog.components.get(component?.type);
    return {
      type: component?.type,
      inputs: this.inputs(def?.fields ?? [], component?.inputs),
      ...(def?.children ? { children: (component?.children ?? []).map((c) => this.component(c)) } : {}),
    };
  }

  ref(ref) {
    switch (ref?.kind) {
      case "value": {
        const def = this.catalog.values.get(ref.type);
        return { kind: "value", type: ref.type, inputs: this.inputs(def?.inputs ?? [], ref.inputs) };
      }
      case "variable":
        return { kind: "variable", name: String(this.variableName(ref.id) ?? ref.id).toLowerCase() };
      case "option":
        return { kind: "option", name: this.optionName(ref.id) ?? ref.id, ...(ref.as ? { as: ref.as } : {}) };
      case "branch":
        return { kind: "branch", action: this.actionIndex.get(ref.action) ?? ref.action, branch: ref.branch, key: ref.key };
      default:
        return ref;
    }
  }
}

const FILE_FIELDS = [
  { kind: "text", key: "source", default: "" },
  { kind: "text", key: "name", default: "" },
  { kind: "boolean", key: "spoiler", default: false },
];
const MODAL_FIELDS_FOR_CANON = [
  { kind: "text", key: "title", default: "" },
  { kind: "text", key: "customId", default: "" },
];

/* =====================================================================
   The converter
   ===================================================================== */

export class BuilderToBlocks {
  /**
   * @param {object} catalog  the catalog, with the Workshop packs the content uses
   * @param {object} blocks   the Blockly adapter (see the top of this file)
   * @param {object} [options]
   * @param {() => string} [options.newBlockId]
   */
  constructor(catalog, blocks, { newBlockId = randomBlockId } = {}) {
    this.catalog = catalog;
    this.blocks = blocks;
    this.newBlockId = newBlockId;
    this.partsCache = new Map();
    this.codeIndex = null;
    this.report = { native: [], code: [], lost: [], notes: [] };
  }

  /* ---- What only Blockly knows ---------------------------------------- */

  /**
   * A block type's inputs and fields, or null if Blockly doesn't know it
   * or it writes no code.
   */
  parts(type, extraState) {
    const key = `${type}|${JSON.stringify(extraState ?? null)}`;
    if (!this.partsCache.has(key)) {
      let parts = null;
      try {
        if (this.blocks.source(type) !== "missing") parts = this.blocks.parts({ type, ...(extraState !== undefined ? { extraState } : {}) });
      } catch {
        parts = null;
      }
      if (parts && parts.generates === false) parts = null;
      this.partsCache.set(key, parts);
    }
    return this.partsCache.get(key);
  }

  /** Round blocks with nothing to plug in, by the code they write: what reads a provided value. */
  blocksByCode(code) {
    if (!this.codeIndex) {
      this.codeIndex = new Map();
      for (const type of this.blocks.types?.() ?? []) {
        const parts = this.parts(type);
        if (!parts?.output || Object.values(parts.inputs).includes("value")) continue;
        let generated = null;
        try {
          generated = this.blocks.code({ type });
        } catch {
          generated = null;
        }
        if (!generated) continue;
        const normal = normaliseCode(generated);
        if (!this.codeIndex.has(normal)) this.codeIndex.set(normal, []);
        this.codeIndex.get(normal).push(type);
      }
    }
    return this.codeIndex.get(normaliseCode(code)) ?? [];
  }

  /* ---- Building block JSON ------------------------------------------------ */

  node(type, { fields, inputs, extraState } = {}) {
    const block = { type, id: this.newBlockId() };
    if (fields && Object.keys(fields).length) block.fields = fields;
    if (inputs && Object.keys(inputs).length) block.inputs = inputs;
    if (extraState !== undefined) block.extraState = extraState;
    return block;
  }

  /** Blocks chained one under the other; the first, or null. */
  chain(list) {
    let next = null;
    for (let i = list.length - 1; i >= 0; i--) {
      const block = list[i];
      let last = block;
      while (last.next?.block) last = last.next.block;
      if (next) last.next = { block: next };
      next = block;
    }
    return next;
  }

  text(value) {
    return this.node("text", { fields: { TEXT: String(value ?? "") } });
  }

  /** The block for a literal typed into an input. */
  literalBlock(inputDef, literal) {
    switch (inputDef.kind) {
      case "number":
        return this.node("math_number", { fields: { NUM: Number(literal) || 0 } });
      case "boolean":
        return this.node("logic_boolean", { fields: { BOOL: literal === true || literal === "true" ? "TRUE" : "FALSE" } });
      case "colour":
        return this.node("colour_picker", { fields: { COLOUR: String(literal || inputDef.default || "#000000") } });
      case "multi":
        return this.text((Array.isArray(literal) ? literal : []).join(","));
      case "text":
      case "code":
      case "dropdown":
        return this.text(literal);
      default:
        return noBlock(`a ${inputDef.kind} input`);
    }
  }

  /* ---- Names ---------------------------------------------------------- */

  /** The field or input of a block that holds a definition's input. */
  partName(parts, key, rule) {
    const mapped = rule?.inputs?.[key];
    if (typeof mapped === "string") return mapped;
    const names = [...Object.keys(parts.fields), ...Object.keys(parts.inputs)];
    const blockNames = this.blockNamesOf?.[key];
    if (blockNames && names.includes(blockNames)) return blockNames;
    return names.find((n) => n === key) ?? names.find((n) => looseName(n) === looseName(key)) ?? null;
  }

  /* =====================================================================
     Inputs
     ===================================================================== */

  /**
   * Puts one input's value on a block: into a field, or as a block in a
   * value input. Fields always get a value, so the block holds the
   * builder's default rather than its own.
   */
  fillInput(block, parts, def, inputDef, value, scope, rule) {
    const mapped = rule?.inputs?.[inputDef.key];
    if (mapped && typeof mapped !== "string") {
      /* A rule that turns the block's parts into this input another way.
         Leaving it at its default is the only safe way back. */
      if (value !== undefined && !(isObject(mapped) && "literal" in mapped && sameValue(mapped.literal, value?.literal)))
        noBlock(`"${inputDef.key}" of ${block.type}`);
      return;
    }

    const name = this.partName(parts, inputDef.key, rule);
    if (!name) {
      if (value === undefined) return;
      return noBlock(`"${inputDef.key}" of ${block.type}`);
    }

    const field = parts.fields[name];
    if (field) {
      if (inputDef.kind === "variable") {
        const variable = value?.ref?.kind === "variable" ? this.variables.get(value.ref.id) : null;
        if (!variable) return noBlock("a variable");
        block.fields = { ...block.fields, [name]: { id: variable.id } };
        return;
      }
      if (value?.ref) return noBlock(`a value in "${inputDef.key}"`);
      const literal = value && "literal" in value ? value.literal : inputDef.default;
      block.fields = { ...block.fields, [name]: this.fieldValue(field, inputDef, literal, rule?.values?.[inputDef.key]) };
      return;
    }

    if (parts.inputs[name] !== "value") {
      if (value === undefined) return;
      return noBlock(`"${inputDef.key}" of ${block.type}`);
    }
    if (value === undefined) return;

    let child;
    if (value.ref) {
      if (!acceptsValues(inputDef) && inputDef.kind !== "variable") return noBlock(`a value in "${inputDef.key}"`);
      child = this.valueBlock(value.ref, scope, inputDef);
    } else {
      const map = rule?.values?.[inputDef.key];
      child = this.literalBlock(inputDef, map ? invert(map, value.literal) : value.literal);
    }
    block.inputs = { ...block.inputs, [name]: { block: child } };
  }

  fieldValue(field, inputDef, literal, valueMap) {
    const value = valueMap ? invert(valueMap, literal) : literal;
    switch (field.kind) {
      case "checkbox":
        return value === true || value === "true" || value === "TRUE" ? "TRUE" : "FALSE";
      case "number":
        return Number(value) || 0;
      case "dropdown": {
        const text = String(value ?? "");
        const options = field.options ?? [];
        const found = options.find((o) => o === text) ?? options.find((o) => String(o).toLowerCase() === text.toLowerCase());
        if (found === undefined) return noBlock(`"${text}" in a dropdown`);
        return found;
      }
      default:
        return Array.isArray(value) ? value.join(",") : String(value ?? "");
    }
  }

  /* =====================================================================
     Values
     ===================================================================== */

  valueBlock(ref, scope, inputDef) {
    switch (ref?.kind) {
      case "variable": {
        const variable = this.variables.get(ref.id);
        if (!variable) return noBlock("a deleted variable");
        return this.node("variables_get", { fields: { VAR: { id: variable.id } } });
      }

      case "option": {
        const option = scope.options?.get(ref.id);
        const getter = option ? (ref.as === "member" && option.type === 6 ? "Member" : OPTION_GETTERS[option.type]) : null;
        if (!getter) return noBlock("an option");
        return this.node("slash_getoption", { fields: { type: getter }, inputs: { name: { block: this.text(option.name) } } });
      }

      case "event": {
        const value = scope.eventDef?.values?.find((v) => v.key === ref.key);
        if (!value) return noBlock("an event's value");
        return this.providedNode(value, blockTypesOf(scope.eventDef, { values: true }), scope.eventDef.valuesBlock);
      }

      case "branch": {
        const loop = scope.loops?.get(ref.action);
        if (loop && loop.key === ref.key) return this.node("variables_get", { fields: { VAR: { id: loop.variable.id } } });
        const owner = scope.owners?.get(ref.action);
        const branch = owner?.def.branches?.find((b) => b.key === ref.branch);
        const value = branch?.provides?.find((p) => p.key === ref.key);
        if (!value) return noBlock("a step's value");
        return this.providedNode({ ...value, code: value.code.replaceAll("@@", "") }, blockTypesOf(owner.def, { values: true }), branch.valuesBlock);
      }

      case "input": {
        const owner = this.catalog.values.get(ref.source) ?? this.catalog.actions.get(ref.source);
        const value = owner?.inputs?.find((i) => i.key === ref.input)?.provides?.find((p) => p.key === ref.key);
        if (!value) return noBlock("an input's value");
        return this.providedNode(value, blockTypesOf(owner, { values: true }));
      }

      case "value": {
        if (ref.type === "text_value") return this.text(ref.inputs?.TEXT?.literal ?? "");
        const def = this.catalog.values.get(ref.type);
        if (!def) return noBlock(`the value "${ref.type}"`);
        if (def.id === "text_join" || def.id === "list_create") return this.addsBlock(def, ref, scope);
        let lastError = null;
        for (const type of blockTypesOf(def)) {
          const parts = this.parts(type);
          if (!parts?.output) continue;
          try {
            return this.fromDef(type, parts, def, def.inputs, ref.inputs ?? {}, scope);
          } catch (error) {
            if (!(error instanceof NoBlock)) throw error;
            lastError = error;
          }
        }
        throw lastError ?? new NoBlock(`the value "${def.label}"`);
      }

      default:
        return noBlock("a value");
    }
  }

  /** The block that reads a value an event, step or input provides. */
  providedBlockType(value, types) {
    if (value.block) return value.block;
    const found = this.blocksByCode(value.code);
    if (!found.length) return noBlock(`"${value.label}"`);
    return found.find((type) => types.includes(type)) ?? found[0];
  }

  /** The block for a provided value: its own, or the owner's block that picks it from a dropdown. */
  providedNode(value, types, valuesBlock) {
    if (!value.block && valuesBlock) {
      const option = Object.entries(valuesBlock.pick.keys ?? {}).find(([, key]) => key === value.key)?.[0] ?? value.key;
      return this.node(valuesBlock.type, { fields: { [valuesBlock.pick.field]: option } });
    }
    return this.node(this.providedBlockType(value, types));
  }

  /** "join text" and "make a list": one `ADDn` input per item. */
  addsBlock(def, ref, scope) {
    const group = def.inputs[0];
    const field = group.fields[0];
    const items = ref.inputs?.[group.key]?.literal ?? group.default ?? [];
    const type = def.blocks[0];
    const block = this.node(type, { extraState: { itemCount: items.length } });
    items.forEach((item, i) => {
      const value = item?.inputs?.[field.key];
      if (!value) return;
      const child = value.ref ? this.valueBlock(value.ref, scope, field) : this.literalBlock(field, value.literal);
      block.inputs = { ...block.inputs, [`ADD${i}`]: { block: child } };
    });
    return block;
  }

  /** A block for a definition, its inputs filled in by name. */
  fromDef(type, parts, def, inputDefs, values, scope) {
    const rule = BLOCK_RULES[type] ?? {};
    const block = this.node(type);
    this.blockNamesOf = def.blockNames ?? null;
    try {
      for (const inputDef of inputDefs) this.fillInput(block, parts, def, inputDef, values?.[inputDef.key], scope, rule);
    } finally {
      this.blockNamesOf = null;
    }
    return block;
  }

  /* =====================================================================
     Steps
     ===================================================================== */

  stack(actions, scope) {
    return this.chain((actions ?? []).map((action) => this.actionBlock(action, scope)));
  }

  actionBlock(action, scope) {
    const def = this.catalog.actions.get(action?.type);
    if (!def) return noBlock(`the step "${action?.type}"`);

    let block;
    if (def.id === "logic_if") block = this.ifBlock(action, def, scope);
    else {
      let lastError = null;
      for (const type of blockTypesOf(def)) {
        const parts = this.parts(type);
        if (!parts || parts.output || !parts.previous || !stacksAnywhere(parts)) continue;
        try {
          block = this.stepBlock(type, parts, action, def, scope);
          break;
        } catch (error) {
          if (!(error instanceof NoBlock)) throw error;
          lastError = error;
        }
      }
      if (!block) throw lastError ?? new NoBlock(`the step "${def.label}"`);
    }
    if (action.disabled) block.enabled = false;
    return block;
  }

  stepBlock(type, parts, action, def, scope) {
    const rule = BLOCK_RULES[type] ?? {};
    const owners = new Map(scope.owners);
    owners.set(action.id, { def, type });
    const inner = { ...scope, owners };

    const loop = LOOP_VARIABLES[type];
    if (loop) {
      const variable = this.addVariable(loop.name);
      inner.loops = new Map(scope.loops);
      inner.loops.set(action.id, { key: loop.key, variable });
    }

    const message = def.inputs.find((i) => i.kind === "message");
    const block = this.fromDef(
      type,
      parts,
      def,
      def.inputs.filter((i) => i !== message),
      action.inputs,
      inner,
    );
    if (loop) block.fields = { ...block.fields, VAR: { id: inner.loops.get(action.id).variable.id } };

    if (message) {
      if (parts.inputs.components !== "statement") return noBlock(`the message of ${type}`);
      const spec = action.inputs?.[message.key]?.literal ?? { components: [], files: [] };
      if (spec.files?.length) return noBlock("attached files");
      const components = this.componentStack(spec.components ?? [], inner);
      if (components) block.inputs = { ...block.inputs, components: { block: components } };
      /* A block starts out pinging only people, like the message builder.
         Other pings are kept in the block's "allowed pings" option. */
      const pings = { ...DEFAULT_PINGS, ...(spec.pings ?? {}) };
      if (pings.roles || pings.everyone || !pings.users)
        block.extraState = `<mutation pings="true" ping_users="${pings.users}" ping_roles="${pings.roles}" ping_everyone="${pings.everyone}"></mutation>`;
    }

    const statements = Object.keys(parts.inputs).filter((name) => parts.inputs[name] === "statement");
    const used = new Set(message ? ["components", "files"] : []);
    for (const branchDef of def.branches) {
      const list = action.branches?.[branchDef.key];
      if (branchDef.repeat) {
        if (Array.isArray(list) && list.length) return noBlock(`"${branchDef.label}" of ${type}`);
        continue;
      }
      let name = typeof rule.branches?.[branchDef.key] === "string" ? rule.branches[branchDef.key] : undefined;
      if (typeof rule.branches?.[branchDef.key] === "function" && !LOOP_VARIABLES[type]) return noBlock(`"${branchDef.label}" of ${type}`);
      if (name === undefined) name = statements.find((s) => s === branchDef.key) ?? statements.find((s) => looseName(s) === looseName(branchDef.key));
      if (name === undefined && LOOP_VARIABLES[type]) name = branchDef.key;
      if (name === undefined) {
        const plain = def.branches.filter((b) => !b.repeat);
        const free = statements.filter((s) => !used.has(s) && !def.branches.some((b) => looseName(b.key) === looseName(s)));
        if (plain.length === 1 && free.length === 1) name = free[0];
      }
      if (!name || parts.inputs[name] !== "statement") {
        if (Array.isArray(list) && list.length) return noBlock(`"${branchDef.label}" of ${type}`);
        continue;
      }
      used.add(name);
      const body = this.stack(list ?? [], inner);
      if (body) block.inputs = { ...block.inputs, [name]: { block: body } };
    }
    return block;
  }

  ifBlock(action, def, scope) {
    const owners = new Map(scope.owners);
    owners.set(action.id, { def, type: "controls_if" });
    const inner = { ...scope, owners };
    const conditionDef = def.inputs.find((i) => i.key === "condition");
    const elseifs = Array.isArray(action.branches?.elseif) ? action.branches.elseif : [];
    const hasElse = Array.isArray(action.branches?.else);
    const block = this.node("controls_if", { extraState: { ...(elseifs.length ? { elseIfCount: elseifs.length } : {}), ...(hasElse ? { hasElse: true } : {}) } });
    if (!elseifs.length && !hasElse) delete block.extraState;
    const inputs = {};
    const condition = (value) => (value?.ref ? this.valueBlock(value.ref, inner, conditionDef) : value && "literal" in value ? this.literalBlock(conditionDef, value.literal) : null);

    const first = condition(action.inputs?.condition);
    if (first) inputs.IF0 = { block: first };
    const then = this.stack(action.branches?.then ?? [], inner);
    if (then) inputs.DO0 = { block: then };
    elseifs.forEach((item, i) => {
      const cond = condition(item?.inputs?.condition);
      if (cond) inputs[`IF${i + 1}`] = { block: cond };
      const body = this.stack(item?.actions ?? [], inner);
      if (body) inputs[`DO${i + 1}`] = { block: body };
    });
    if (hasElse) {
      const body = this.stack(action.branches.else, inner);
      if (body) inputs.ELSE = { block: body };
    }
    if (Object.keys(inputs).length) block.inputs = inputs;
    return block;
  }

  /* ---- Messages ------------------------------------------------------- */

  componentStack(components, scope) {
    return this.chain(components.map((component) => this.componentBlock(component, scope)));
  }

  componentBlock(component, scope) {
    const def = this.catalog.components.get(component?.type);
    if (!def) return noBlock(`the message part "${component?.type}"`);
    let lastError = null;
    for (const type of blockTypesOf(def)) {
      const parts = this.parts(type);
      if (!parts) continue;
      try {
        const rule = BLOCK_RULES[type] ?? {};
        const block = this.fromDef(type, parts, def, def.fields, component.inputs ?? {}, scope);
        if (def.children) {
          const children = component.children ?? [];
          if (rule.child) {
            if (children.length > 1) return noBlock("a message part with more than one piece inside");
            if (children.length) block.inputs = { ...block.inputs, [rule.child]: { block: this.componentBlock(children[0], scope) } };
          } else if (children.length) {
            const statement = Object.keys(parts.inputs).find((name) => parts.inputs[name] === "statement");
            if (!statement) return noBlock(`the pieces inside ${type}`);
            block.inputs = { ...block.inputs, [statement]: { block: this.componentStack(children, scope) } };
          }
        }
        return block;
      } catch (error) {
        if (!(error instanceof NoBlock)) throw error;
        lastError = error;
      }
    }
    throw lastError ?? new NoBlock(`the message part "${def.label}"`);
  }

  /* =====================================================================
     Variables
     ===================================================================== */

  addVariable(name) {
    const base = String(name || "variable");
    let candidate = base;
    for (let n = 2; this.variableByName.has(candidate.toLowerCase()); n++) candidate = `${base}${n}`;
    const variable = { name: candidate, id: this.newBlockId() };
    this.variableByName.set(candidate.toLowerCase(), variable);
    this.blockVariables.push(variable);
    return variable;
  }

  /* =====================================================================
     The whole template
     ===================================================================== */

  run(rawContent) {
    const content = parseTemplateContent(rawContent);
    this.content = content;
    this.variables = new Map();
    this.variableByName = new Map();
    this.blockVariables = [];
    for (const variable of content.variables) {
      const made = this.addVariable(variable.name);
      this.variables.set(variable.id, made);
    }

    /* Code blocks use the names the block editor gives the variables, so
       they share them with the blocks around them. */
    this.codeNames = variableNames(content.variables);
    try {
      const names = this.blocks.variableNames?.(this.blockVariables.map((v) => v.name));
      if (names?.length === this.blockVariables.length)
        content.variables.forEach((variable, i) => this.codeNames.set(variable.id, names[i]));
    } catch {
      /* the builder's own names, then */
    }
    this.gen = new Generator(this.catalog, { variables: this.codeNames });
    this.rawSetup = false;

    const tops = [];
    const commandBlocks = this.commands(content.commands);
    tops.push(...commandBlocks);
    for (const [index, event] of content.events.entries()) {
      const block = this.event(event, index);
      if (block) tops.push(block);
    }

    if (this.rawSetup) {
      const setup = this.setupCode();
      if (setup) tops.unshift(this.node("javascript_raw_float", { fields: { CODE: setup } }));
    }

    /* One under the other, roughly as tall as each is. */
    let y = 0;
    for (const block of tops) {
      block.x = 0;
      block.y = y;
      y += 80 + countBlocks(block) * 48;
    }

    return {
      data: {
        blocks: { languageVersion: 0, blocks: tops },
        ...(this.blockVariables.length ? { variables: this.blockVariables.map(({ name, id }) => ({ name, id })) } : {}),
      },
      report: this.report,
    };
  }

  /** The top-of-the-file code that code blocks need (helpers, packages, a pack's setup). */
  setupCode() {
    const parts = [];
    /* The block editor only declares variables its blocks use. */
    const names = [...new Set(this.codeNames.values())];
    if (names.length) parts.push(`var ${names.join(", ")};`);
    for (const dep of this.gen.dependencies.values()) {
      if (dep.code === "") continue;
      if (dep.code) parts.push(dep.code);
      else {
        const name = dep.package.replace(/[-.@/]/g, "_").replace(/^(\d)/, "_$1");
        parts.push(`globalThis.${name} ??= require(${JSON.stringify(dep.package)});`);
      }
    }
    parts.push(...this.gen.setup.values());
    return parts.join("\n\n");
  }

  /* ---- The check by converting back ---------------------------------- */

  /** Converts some blocks back to the builder, as fromBlocks.js would. */
  convertBack(topBlocks) {
    const converter = new BlockConverter(this.catalog, this.blocks);
    const workspace = {
      name: "check",
      data: { blocks: { blocks: structuredClone(topBlocks) }, variables: this.blockVariables.map(({ name, id }) => ({ name, id })) },
    };
    return converter.run([workspace]).builder;
  }

  /**
   * A Canon for one side of a comparison: `variables` is that side's
   * variable list (the template's, or what converting back made).
   */
  canon(options = new Map(), variables = this.content.variables) {
    const names = new Map(variables.map((v) => [v.id, v.name]));
    return new Canon(this.catalog, { variableName: (id) => names.get(id) ?? null, optionName: (id) => options.get(id) ?? null });
  }

  /* ---- Events ---------------------------------------------------------- */

  event(event, index) {
    const def = this.catalog.events.get(event.type);
    const where = event.label || def?.label || `Event ${index + 1}`;
    let block = null;
    if (def) {
      try {
        block = this.eventBlock(event, def);
        const back = this.convertBack([block]);
        const converted = back.events.length === 1 ? back.events[0] : null;
        const same =
          converted &&
          converted.type === event.type &&
          (converted.enabled !== false) === (event.enabled !== false) &&
          sameValue(this.canon(new Map(), back.variables).inputs(def.settings, converted.settings), this.canon().inputs(def.settings, event.settings)) &&
          sameValue(this.canon(new Map(), back.variables).flow(converted.actions), this.canon().flow(event.actions ?? []));
        if (!same) block = null;
      } catch (error) {
        if (!(error instanceof NoBlock)) throw error;
        block = null;
      }
    }
    if (block) {
      this.report.native.push(where);
      return block;
    }

    this.report.code.push(where);
    this.rawSetup = true;
    const code = eventCode(this.gen, this.catalog, event, index);
    const raw = this.node("javascript_raw_float", { fields: { CODE: code } });
    if (event.enabled === false) raw.enabled = false;
    return raw;
  }

  eventBlock(event, def) {
    const scope = { eventDef: def, options: new Map(), owners: new Map(), loops: new Map() };
    const body = this.stack(event.actions ?? [], scope);
    const dispatch = DISPATCH_EVENTS[def.id];

    if (dispatch) {
      const id = event.settings?.[dispatch.setting]?.literal;
      const set = this.canon().inputs(def.settings, event.settings);
      if (Object.keys(set).some((key) => key !== dispatch.setting)) return noBlock("an event setting");
      const hat = this.node(dispatch.hat);
      const filtered = typeof id === "string" && id.length ? this.ifEquals(this.node(dispatch.nameTypes[0]), id, body) : body;
      if (filtered) hat.inputs = { [this.firstStatement(dispatch.hat)]: { block: filtered } };
      return this.withEnabled(hat, event);
    }

    let lastError = null;
    const candidates = (blockTypesOf(def)).filter((type) => {
      const parts = this.parts(type);
      return parts && !parts.output && !parts.previous;
    });
    /* A hat that implies some settings only fits when they're the event's. */
    const fits = (type) =>
      Object.entries(EVENT_SETTINGS[type] ?? {}).every(([key, literal]) => {
        const inputDef = def.settings.find((s) => s.key === key);
        const value = event.settings?.[key];
        const actual = value && "literal" in value ? value.literal : inputDef?.default;
        return sameValue(actual, literal);
      });
    for (const type of candidates.filter(fits)) {
      try {
        const parts = this.parts(type);
        const fixed = EVENT_SETTINGS[type] ?? {};
        const hat = this.fromDef(
          type,
          parts,
          def,
          def.settings.filter((s) => !(s.key in fixed)),
          event.settings ?? {},
          scope,
        );
        const statement = this.firstStatement(type);
        if (def.packBody === "next") {
          if (body) hat.next = { block: body };
        } else if (body) {
          if (!statement) return noBlock("the event's steps");
          hat.inputs = { ...hat.inputs, [statement]: { block: body } };
        }
        return this.withEnabled(hat, event);
      } catch (error) {
        if (!(error instanceof NoBlock)) throw error;
        lastError = error;
      }
    }
    throw lastError ?? new NoBlock(`the event "${def.label}"`);
  }

  withEnabled(block, item) {
    if (item.enabled === false) block.enabled = false;
    return block;
  }

  firstStatement(type) {
    const parts = this.parts(type);
    return Object.keys(parts?.inputs ?? {}).find((name) => parts.inputs[name] === "statement") ?? null;
  }

  /** `if (reader = "text") { body }` */
  ifEquals(reader, text, body) {
    const condition = this.node("logic_compare", { fields: { OP: "EQ" }, inputs: { A: { block: reader }, B: { block: this.text(text) } } });
    return this.node("controls_if", { inputs: { IF0: { block: condition }, ...(body ? { DO0: { block: body } } : {}) } });
  }

  /* ---- Commands ------------------------------------------------------- */

  commands(commands) {
    if (!commands.length) return [];
    const declarations = [];
    const slash = [];
    const menus = [];

    for (const command of commands) {
      const kind = command.kind ?? "slash";
      declarations.push(kind === "slash" ? this.slashDeclaration(command) : this.menuDeclaration(command));
      const options = new Map();
      const flows = commandFlows(command).map(({ group, sub, flow }) => {
        const readable = kind === "slash" ? (flow.options ?? []).filter((o) => o.type !== 1 && o.type !== 2) : [];
        for (const option of readable) options.set(option.id, option);
        return { group, sub, flow, options: new Map(readable.map((o) => [o.id, o])) };
      });
      (kind === "slash" ? slash : menus).push({ command, flows });
    }

    const container = this.node("misc_createcontainer_global", { inputs: { code: { block: this.chain(declarations) } } });
    const hats = [container];
    for (const [list, hatType, nameType] of [
      [slash, "slash_received", "slash_name"],
      [menus, "contextMenu_received", "contextMenu_name"],
    ]) {
      if (!list.length) continue;
      const sections = list.map(({ command, flows }) => this.ifEquals(this.node(nameType), command.name, this.commandBody(command, flows)));
      hats.push(this.node(hatType, { inputs: { event: { block: this.chain(sections) } } }));
    }

    this.checkCommands(hats, slash, menus);
    return hats;
  }

  /** A command's blocks: its own steps, or a section per subcommand. */
  commandBody(command, flows) {
    if (flows.length === 1 && !flows[0].sub) return this.flowBlocks(command, flows[0]);
    const groups = new Map();
    const sections = [];
    for (const entry of flows) {
      const section = this.ifEquals(this.optionReader("Subcommand"), entry.sub.name, this.flowBlocks(command, entry));
      if (!entry.group) sections.push(section);
      else {
        if (!groups.has(entry.group.name)) groups.set(entry.group.name, []);
        groups.get(entry.group.name).push(section);
      }
    }
    for (const [name, list] of groups) sections.push(this.ifEquals(this.optionReader("SubcommandGroup"), name, this.chain(list)));
    return this.chain(sections);
  }

  optionReader(type) {
    return this.node("slash_getoption", { fields: { type } });
  }

  /** One flow's blocks; `entry.raw` is set if it can't be done with blocks. */
  flowBlocks(command, entry) {
    if (entry.raw) return this.rawFlow(command, entry);
    try {
      const scope = { eventDef: null, options: entry.options, owners: new Map(), loops: new Map() };
      entry.native = this.stack(entry.flow.actions ?? [], scope);
      return entry.native;
    } catch (error) {
      if (!(error instanceof NoBlock)) throw error;
      entry.raw = true;
      return this.rawFlow(command, entry);
    }
  }

  rawFlow(command, entry) {
    const kind = command.kind ?? "slash";
    const scope = this.gen.scopeFor({
      kind: entry.sub ? "subcommand" : kind,
      actions: entry.flow.actions ?? [],
      contexts: FLOW_CONTEXTS[kind] ?? FLOW_CONTEXTS.slash,
      options: kind === "slash" ? [...entry.options.values()] : [],
    });
    this.rawSetup = true;
    const code = this.gen.flowCode(entry.flow.actions ?? [], scope, commandWhere(command, entry));
    return code.trim() ? this.node("javascript_raw", { fields: { CODE: code } }) : null;
  }

  /**
   * Converts the commands back, and turns any flow that doesn't come out
   * the same into code. The handler blocks are rebuilt in place.
   */
  checkCommands(hats, slash, menus) {
    const back = this.convertBack(hats);
    const all = [...slash, ...menus];
    let changed = false;

    for (const { command, flows } of all) {
      const kind = command.kind ?? "slash";
      const converted = back.commands.find((c) => c.kind === kind && c.name === command.name);
      this.noteLostSettings(command, converted);
      for (const entry of flows) {
        if (entry.raw) continue;
        const where = commandWhere(command, entry);
        const flow = converted ? commandFlows(converted).find((f) => (f.group?.name ?? null) === (entry.group?.name ?? null) && (f.sub?.name ?? null) === (entry.sub?.name ?? null)) : null;
        const names = new Map();
        for (const option of entry.options.values()) names.set(option.id, option.name);
        for (const option of (flow?.flow.options ?? []).filter((o) => o.type !== 1 && o.type !== 2)) names.set(option.id, option.name);
        const same = flow && sameValue(this.canon(names, back.variables).flow(flow.flow.actions), this.canon(names).flow(entry.flow.actions));
        if (same) this.report.native.push(where);
        else {
          entry.raw = true;
          changed = true;
        }
      }
      for (const entry of flows) if (entry.raw) this.report.code.push(commandWhere(command, entry));
    }

    if (!changed) return;
    /* Rebuild the handlers with the code blocks in. */
    const handlers = [
      [slash, "slash_received", "slash_name"],
      [menus, "contextMenu_received", "contextMenu_name"],
    ];
    let index = 1;
    for (const [list, , nameType] of handlers) {
      if (!list.length) continue;
      const sections = list.map(({ command, flows }) => this.ifEquals(this.node(nameType), command.name, this.commandBody(command, flows)));
      hats[index].inputs = { event: { block: this.chain(sections) } };
      index += 1;
    }
  }

  noteLostSettings(command, converted) {
    const lost = new Set();
    const label = (command.kind ?? "slash") === "slash" ? `/${command.name}` : command.name;
    if (!converted) {
      this.report.lost.push(`${label}: the command couldn't be added`);
      return;
    }
    const has = (map) => Object.values(map ?? {}).some((v) => String(v ?? "").trim());
    if (has(command.nameLocalizations) || has(command.descriptionLocalizations)) lost.add("translations");
    if ((command.integrationTypes ?? []).includes("UserInstall")) lost.add("user installs");
    if ((command.contexts ?? []).includes("PrivateChannel")) lost.add("group DMs");
    const walk = (options) => {
      for (const option of options ?? []) {
        if (has(option.nameLocalizations) || has(option.descriptionLocalizations)) lost.add("translations");
        if (option.autocomplete) lost.add("suggestions");
        if ([option.minValue, option.maxValue, option.minLength, option.maxLength].some((v) => v !== null && v !== undefined && v !== ""))
          lost.add("minimums and maximums");
        if (option.channelTypes?.length) lost.add("channel types");
        walk(option.options);
      }
    };
    walk(command.options);
    if (lost.size) this.report.lost.push(`${label}: ${[...lost].join(", ")}`);
  }

  slashDeclaration(command) {
    const perms = cleanList(command.defaultMemberPermissions);
    const options = this.optionBlocks(command.options ?? [], "command");
    const dm = (command.contexts ?? ["Guild", "BotDM"]).includes("BotDM");
    const inputs = {
      name: { block: this.text(command.name) },
      dsc: { block: this.text(command.description || command.name) },
      dm: { block: this.literalBlock({ kind: "boolean" }, dm) },
    };
    if (command.nsfw) inputs.nsfw = { block: this.literalBlock({ kind: "boolean" }, true) };
    if (perms.length) inputs.perms = { block: this.permissionsBlock(perms) };
    if (options) inputs.options = { block: options };
    const mutation = `<mutation nsfw="${Boolean(command.nsfw)}" dm="true" perms="${perms.length > 0}" options="${Boolean(options)}"></mutation>`;
    return this.node("slash_create_mutator", { extraState: mutation, inputs });
  }

  permissionsBlock(perms) {
    const one = (perm) => this.node("misc_permission", { fields: { permission: perm } });
    if (perms.length === 1) return one(perms[0]);
    const list = this.node("lists_create_with", { extraState: { itemCount: perms.length } });
    list.inputs = Object.fromEntries(perms.map((perm, i) => [`ADD${i}`, { block: one(perm) }]));
    return list;
  }

  menuDeclaration(command) {
    return this.node("contextMenu_create", {
      fields: { type: command.kind === "user" ? "Discord.ApplicationCommandType.User" : "Discord.ApplicationCommandType.Message" },
      inputs: {
        name: { block: this.text(command.name) },
        dms: { block: this.literalBlock({ kind: "boolean" }, (command.contexts ?? ["Guild", "BotDM"]).includes("BotDM")) },
      },
    });
  }

  optionBlocks(options) {
    return this.chain(
      options.map((option) => {
        const inputs = {
          name: { block: this.text(option.name) },
          dsc: { block: this.text(option.description || option.name) },
        };
        if (option.type === 1) {
          const inner = this.optionBlocks(option.options ?? []);
          if (inner) inputs.options = { block: inner };
          return this.node("slash_addsubcommand", { inputs });
        }
        if (option.type === 2) {
          const inner = this.optionBlocks(option.options ?? []);
          if (inner) inputs.subcommands = { block: inner };
          return this.node("slash_addsubcommandgroup", { inputs });
        }
        inputs.required = { block: this.literalBlock({ kind: "boolean" }, Boolean(option.required)) };
        const choices = this.chain(
          (option.choices ?? []).map((choice) =>
            this.node("slash_addchoice", {
              inputs: {
                name: { block: this.text(choice.name) },
                /* Discord wants numbers for a number option's choices, and
                   this input only takes text blocks, so a number is written
                   as code. */
                value: {
                  block:
                    option.type === 3
                      ? this.text(choice.value)
                      : this.node("javascript_raw_value", { fields: { CODE: String(Number(choice.value) || 0) } }),
                },
              },
            }),
          ),
        );
        if (choices) inputs.choices = { block: choices };
        return this.node("slash_addoption", { fields: { type: String(option.type) }, inputs });
      }),
    );
  }
}

/** A stacked block that goes in any section, not only inside one particular block. */
function stacksAnywhere(parts) {
  const check = parts.previousCheck;
  return !check || !check.length || check.includes("default");
}

function invert(map, value) {
  const found = Object.entries(map).find(([, builderValue]) => String(builderValue) === String(value));
  return found ? found[0] : value;
}

function cleanList(list) {
  return (Array.isArray(list) ? list : []).filter((item) => typeof item === "string" && item);
}

function commandWhere(command, entry) {
  const base = (command.kind ?? "slash") === "slash" ? `/${command.name}` : command.name;
  return [base, entry.group?.name, entry.sub?.name].filter(Boolean).join(" ");
}

function countBlocks(block) {
  let count = 0;
  const visit = (current) => {
    if (!current) return;
    count += 1;
    for (const slot of Object.values(current.inputs ?? {})) visit(slot?.block);
    visit(current.next?.block);
  };
  visit(block);
  return count;
}

/**
 * Converts a DisFuse Builder template's content into block editor blocks.
 *
 * @param {object} args
 * @param {string|object} args.content  `{ commands, events, variables }`
 * @param {object} args.catalog  the catalog, with the Workshop packs the content uses
 * @param {object} args.blocks   the Blockly adapter
 * @param {() => string} [args.newBlockId]
 * @returns {{ data: { blocks: { blocks: object[] }, variables?: object[] }, report: { native: string[], code: string[], lost: string[], notes: string[] } }}
 *   `report.code` lists the commands and events that became code blocks,
 *   `report.lost` the command settings the block editor has no blocks for
 */
export function convertBuilderToBlocks({ content, catalog, blocks, newBlockId }) {
  return new BuilderToBlocks(catalog, blocks, { newBlockId }).run(content);
}

/**
 * The block types a definition can become: its own first, then the rest
 * of its element's (with `values`, also the blocks reading its values).
 */
function blockTypesOf(def, { values = false } = {}) {
  if (!def) return [];
  const own = def.blocks ?? [];
  if (def.pack) return own;
  const related = blocksOfElement(def.id).filter((type) => {
    const role = blockOf(type)?.role;
    return values || (role !== "value" && role !== "item");
  });
  return [...new Set([...own, ...related])];
}
