/* =====================================================================
   Blocks from element definitions
   ---------------------------------------------------------------------
   Every DisFuse block is made from its element (src/elements): its look
   from `block.text` and `block.parts`, its code from the element's own
   `code(ctx)`, run with a ctx read from the block. That ctx mirrors the
   builder's (builder/codegen/context.js):

     ctx.input(key)   the code for an input: the block in a value input
                      (or the input's default when it's empty), or the
                      field's value as a literal
     ctx.raw(key)     a field's value, or the typed value of a text,
                      number or true/false block in a value input
     ctx.has / code / isValue / visible / enabled
     ctx.branch(key)  the code of a statement input
     ctx.hasBranch(key)
     ctx.group(key)   the items of a group (item blocks, or ADD0, ADD1...)
     ctx.message(key) the options object of a Components V2 message
     ctx.modal(key)   the form a block builds
     ctx.children()   a component's children
     ctx.allowedMentions(legacy)  the `allowedMentions` option for a
                      message the block sends (see ./pings.js)
     ctx.block / ctx.generator / ctx.Order   for code only a block has
   ===================================================================== */

import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "./restrictions.js";
import { mutatorMixin, mutatorOptionsBlock, setShadow, withPingsField } from "./createMutator.ts";
import { PINGS_MUTATOR_FIELD, allowedMentions, markPingsLegacyTypes } from "./pings.js";
import { ALLOWED_MENTIONS } from "./generatorUtils.js";
import { isComponentLoop } from "./componentLoopTypes.js";
import { componentList } from "./componentLoops.js";
import { listenerCode } from "../../elements/define.js";
import {
  inputVisible,
  literalCode,
  literalPresent,
  localSuffix,
  str,
  wrap,
} from "../../builder/codegen/context.js";
import { typeList } from "../../builder/catalog/types.js";

/* ---------------------------------------------------------------------
   Parts
   --------------------------------------------------------------------- */

const VALUE_CHECKS = { text: "String", number: "Number", boolean: "Boolean", colour: "Colour" };

/** The inputs a block's keys refer to. */
export function inputsOf(spec) {
  const el = spec.element;
  if (spec.role === "item" && spec.branch)
    return el.branches?.find((b) => b.key === spec.branch)?.inputs ?? [];
  if (spec.role === "item")
    return (
      el[el.kind === "event" ? "settings" : el.kind === "component" ? "fields" : "inputs"]?.find(
        (i) => i.key === spec.group,
      )?.fields ?? []
    );
  if (spec.role === "value") return [];
  if (el.kind === "event") return el.settings ?? [];
  if (el.kind === "component") return el.fields ?? [];
  return el.inputs ?? [];
}

function defaultPart(spec, key) {
  const inputDef = inputsOf(spec).find((i) => i.key === key);
  if (inputDef) {
    switch (inputDef.kind) {
      case "text":
      case "number":
      case "boolean":
      case "colour":
        return { part: "value", check: VALUE_CHECKS[inputDef.kind] };
      case "slot": {
        const accepts = typeList(inputDef.accepts);
        return {
          part: "value",
          check: accepts.includes(null) ? null : accepts.length === 1 ? accepts[0] : accepts,
        };
      }
      case "multi":
        return { part: "value", check: null };
      case "dropdown":
        return { part: "dropdown", options: inputDef.options.map((o) => [o.label, o.value]) };
      case "code":
        return { part: "multiline", value: inputDef.default ?? "" };
      case "variable":
        return { part: "variable", value: "item" };
      default:
        return { part: "statement", check: null };
    }
  }
  if (spec.role !== "value" && spec.role !== "item") {
    const branch = spec.element.branches?.find((b) => b.key === key);
    if (branch) return { part: "statement", check: null };
  }
  if (key === spec.children) return { part: "statement", check: null };
  return null;
}

/** What `key` is on this block: { part, name, ... }, or null when it isn't one. */
export function partOf(spec, key) {
  const override = spec.parts[key];
  const base = defaultPart(spec, key);
  if (!override && !base) return null;
  const part = { ...(override?.part && override.part !== base?.part ? {} : base), ...override };
  if (!part.part) throw new Error(`${spec.type}: "${key}" needs a part kind`);
  return { ...part, key, name: part.name ?? key };
}

/** Where every input key is on the block, including inputs a mutator adds. */
function placedKeys(spec) {
  const keys = new Set();
  for (const line of spec.text)
    for (const token of tokens(line)) if (token.key) keys.add(token.key);
  for (const field of spec.mutator?.fields ?? []) keys.add(field.key ?? field.name);
  for (const [key, part] of Object.entries(spec.parts)) if (part.part === "item") keys.add(key);
  return keys;
}

/* ---------------------------------------------------------------------
   The look
   --------------------------------------------------------------------- */

function tokens(line) {
  const out = [];
  const re = /\{("(?:[^"\\]|\\.)*"|[^{}]+)\}/g;
  let last = 0;
  let match;
  while ((match = re.exec(line))) {
    if (match.index > last) out.push({ text: line.slice(last, match.index) });
    const inner = match[1];
    if (inner.startsWith('"')) out.push({ label: JSON.parse(inner) });
    else out.push({ key: inner.trim() });
    last = re.lastIndex;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out;
}

/**
 * The block's Blockly inputs, in order:
 *   { type: "dummy" | "value" | "statement", name, part, fields: [...] }
 */
export function layoutOf(spec) {
  const out = [];
  let pending = [];
  const flush = (type, part) => {
    out.push({ type, name: part?.name, part, fields: pending });
    pending = [];
  };
  const lines = [...spec.text];
  const isEvent =
    (spec.element.kind === "event" && spec.role === "main") ||
    (spec.role === "variant" && spec.element.kind === "event");
  let bodyPlaced = false;

  for (const line of lines) {
    const list = tokens(line);
    if (!list.length) {
      flush("dummy");
      continue;
    }
    for (const token of list) {
      if (token.text !== undefined) {
        const text = token.text.trim();
        if (text) pending.push({ kind: "label", text });
      } else if (token.label !== undefined) pending.push({ kind: "label", text: token.label });
      else if (isEvent && token.key === "body") {
        bodyPlaced = true;
        flush("statement", bodyPart(spec));
      } else {
        const part = partOf(spec, token.key);
        if (!part) throw new Error(`${spec.type}: "{${token.key}}" isn't an input, branch or part`);
        if (part.part === "value" || part.part === "statement" || part.part === "dummy")
          flush(part.part, part);
        else if (part.part === "fixed")
          throw new Error(`${spec.type}: "${token.key}" is fixed and can't be shown`);
        else pending.push({ kind: "field", part });
      }
    }
    if (pending.length) flush("dummy");
  }
  if (pending.length) flush("dummy");
  if (isEvent && !bodyPlaced) flush("statement", bodyPart(spec));
  return out;
}

function bodyPart(spec) {
  return {
    part: "statement",
    name: spec.body?.name ?? "code",
    check: spec.body?.check ?? null,
    key: "body",
  };
}

function makeField(part) {
  switch (part.part) {
    case "dropdown": {
      const field = new Blockly.FieldDropdown(
        typeof part.options === "function" ? part.options : part.options.map((o) => [...o]),
        part.validator,
      );
      if (part.value !== undefined) field.setValue(part.value);
      return field;
    }
    case "checkbox":
      return new Blockly.FieldCheckbox(part.value ?? "FALSE", part.validator);
    case "text":
      return new Blockly.FieldTextInput(part.value ?? "", part.validator);
    case "multiline":
      return new Blockly.FieldMultilineInput(part.value ?? "", part.validator);
    case "number":
      return new Blockly.FieldNumber(
        part.value ?? 0,
        part.min,
        part.max,
        part.precision,
        part.validator,
      );
    case "colour":
      return new Blockly.FieldColour(part.value ?? "#ff0000", part.validator);
    case "variable":
      return new Blockly.FieldVariable(
        part.value ?? "item",
        part.validator,
        part.types,
        part.defaultType,
      );
    case "label":
      return new Blockly.FieldLabel(part.text ?? "", part.class);
    case "image":
      return new Blockly.FieldImage(part.src, part.width, part.height, part.alt ?? "");
    case "field":
      return part.field(Blockly);
    default:
      throw new Error(`Unknown part "${part.part}"`);
  }
}

function appendLayout(block, layout, spec) {
  for (const item of layout) {
    let input;
    if (item.type === "value") input = block.appendValueInput(item.name);
    else if (item.type === "statement") input = block.appendStatementInput(item.name);
    else input = block.appendDummyInput(item.name);
    if (item.part && item.type !== "dummy" && item.part.check !== undefined)
      input.setCheck(item.part.check);
    if (item.part?.align) input.setAlign({ LEFT: -1, CENTRE: 0, RIGHT: 1 }[item.part.align]);
    for (const field of item.fields) {
      if (field.kind === "label") input.appendField(field.text);
      else input.appendField(makeField(field.part), field.part.name);
    }
    if (item.type === "value" && (item.part?.shadow || spec.mutator))
      setShadow(input, item.part.check);
  }
}

/* ---------------------------------------------------------------------
   Shape
   --------------------------------------------------------------------- */

function connectionCheck(value) {
  return value === undefined ? null : value;
}

function outputOf(spec) {
  if (spec.output !== undefined) return spec.output;
  if (spec.role === "item") return false;
  if (spec.role === "value") {
    if (spec.value.pick) return null;
    const type = typeList(spec.value.type);
    return type.includes(null) ? null : type.length === 1 ? type[0] : type;
  }
  if (spec.element.kind === "value" || spec.element.shape === "value") {
    const out = typeList(spec.element.output);
    return out.includes(null) ? null : out.length === 1 ? out[0] : out;
  }
  return false;
}

function statementOf(spec, which) {
  const value = spec[which];
  if (value !== undefined) return value;
  if (spec.role === "value" || spec.role === "item") return false;
  const kind = spec.element.kind === "block" ? spec.element.shape : spec.element.kind;
  return kind === "action" ? "default" : false;
}

/* ---------------------------------------------------------------------
   ctx
   --------------------------------------------------------------------- */

const LITERAL_BLOCKS = {
  text: { field: "TEXT", kind: "text" },
  text_multiline: { field: "TEXT", kind: "text" },
  math_number: { field: "NUM", kind: "number" },
  logic_boolean: { field: "BOOL", kind: "boolean" },
  colour_picker: { field: "COLOUR", kind: "colour" },
};

const LITERAL_KINDS = new Set(["text", "code", "colour", "number", "boolean", "dropdown", "multi", "group", "message", "modal"]);

/** A literal for an input kind from a field or literal block's value. */
function coerce(inputDef, value, part) {
  if (part?.map && Object.prototype.hasOwnProperty.call(part.map, String(value)))
    value = part.map[String(value)];
  switch (inputDef?.kind) {
    case "boolean":
      return value === true || String(value).toUpperCase() === "TRUE";
    case "number": {
      const n = Number(value);
      return Number.isFinite(n) ? n : inputDef.default;
    }
    default:
      return value;
  }
}

let uidCounter = 0;

function stackOf(block, name) {
  const out = [];
  let child = block.getInputTargetBlock(name);
  while (child) {
    if (child.isEnabled() && !child.isInsertionMarker()) out.push(child);
    child = child.getNextBlock();
  }
  return out;
}

function makeCtx(spec, block, generator, partsOverride) {
  const inputDefs = inputsOf(spec);
  const byKey = new Map(inputDefs.map((d) => [d.key, d]));
  const placed = placedKeys(spec);
  const resolved = new Map();
  const part = (key) => {
    if (partsOverride?.[key]) return partsOverride[key];
    if (!resolved.has(key)) {
      let p = partOf(spec, key);
      if (p && p.part !== "fixed" && !placed.has(key) && spec.element.builder !== false)
        p = { part: "fixed", key, name: key, value: p.value };
      if (!p)
        p =
          spec.element.builder === false
            ? { part: "value", key, name: key }
            : { part: "fixed", key, name: key };
      resolved.set(key, p);
    }
    return resolved.get(key);
  };
  /* A part with no builder input (block-only blocks) reads as Blockly
     would: valueToCode, getFieldValue, statementToCode. */
  const need = (key) => {
    const def = byKey.get(key);
    if (def) return def;
    if (!spec.parts[key] && (spec.element.builder !== false || spec.role !== "main"))
      throw new Error(`"${spec.type}" has no input called "${key}"`);
    return { key, kind: "block" };
  };
  const fixedValue = (def, p) => (p.value !== undefined ? p.value : def.default);
  const child = (p) => (block.getInput(p.name) ? block.getInputTargetBlock(p.name) : null);
  const literalOfChild = (def, target, p) => {
    const literal = LITERAL_BLOCKS[target.type];
    if (literal) return coerce(def, target.getFieldValue(literal.field), p);
    /* A block that only picks from a list (a permission) in a dropdown input. */
    if ((def.kind === "dropdown" || def.kind === "multi") && !target.inputList.some((i) => i.connection)) {
      const fields = target.inputList
        .flatMap((i) => i.fieldRow)
        .filter((f) => f.name && f.EDITABLE && !f.referencesVariables?.());
      if (fields.length === 1) return coerce(def, fields[0].getValue(), p);
    }
    return undefined;
  };
  const scaled = (p, code) => (p.scale ? `(${code} * ${p.scale})` : code);

  const raw = (key) => {
    const def = need(key);
    const p = part(key);
    if (def.kind === "block")
      return p.part === "value" || p.part === "statement" ? undefined : block.getFieldValue(p.name);
    if (p.part === "fixed")
      return p.when ? ctx.has(p.when) : typeof p.value === "function" ? p.value(ctx) : fixedValue(def, p);
    if (p.part === "value") {
      const target = child(p);
      if (!target) return def.default;
      return literalOfChild(def, target, p);
    }
    if (p.part === "statement" || p.part === "dummy") return def.default;
    if (!block.getField(p.name)) return def.default;
    if (p.part === "variable") return block.getField(p.name).getText();
    return coerce(def, block.getFieldValue(p.name), p);
  };

  /* A branch held by an item block in a statement input (switch's "default"). */
  const branchHolder = (key) => {
    const itemSpec = itemSpecs.get(`${spec.element.id}:${key}`);
    const branch = spec.element.branches?.find((b) => b.key === key);
    if (!itemSpec || !branch || branch.repeat) return null;
    const p = part(key);
    const holder = stackOf(block, p.part === "item" ? p.input : p.name).find((item) => item.type === itemSpec.type);
    return { block: holder ?? null, body: itemSpec.body?.name ?? itemSpec.body ?? "code" };
  };

  const ctx = {
    id: block.id,
    uid: (uidCounter++).toString(36),
    flow: { kind: "blocks", contexts: new Set(), eventId: null },
    project: null,
    block,
    generator,
    Order,
    str,
    wrap,
    local: (name) => `${name}${localSuffix(block.id)}`,
    raw,

    field: (name) => block.getFieldValue(name),

    input(key) {
      const def = need(key);
      const p = part(key);
      if (def.kind === "block")
        return p.part === "value"
          ? generator.valueToCode(block, p.name, Order.ATOMIC)
          : p.part === "statement"
            ? generator.statementToCode(block, p.name)
            : str(block.getFieldValue(p.name) ?? "");
      if (def.kind === "variable" && p.part === "variable") {
        const field = block.getField(p.name);
        return field ? generator.getVariableName(field.getValue()) : "undefined";
      }
      if (p.part === "value") {
        const target = child(p);
        const code = target ? generator.valueToCode(block, p.name, Order.NONE) : "";
        if (!code) return literalCode(def, def.default);
        const accepts = typeList(def.accepts);
        const check = target.outputConnection?.getCheck();
        if (
          def.kind === "text" &&
          !accepts.includes(null) &&
          check &&
          !check.some((type) => accepts.includes(type))
        )
          return `String(${code})`;
        return wrap(scaled(p, code));
      }
      if (p.part === "fixed") return literalCode(def, raw(key));
      return scaled(p, literalCode(def, raw(key)));
    },

    code(key) {
      if (need(key).kind === "block") return ctx.input(key);
      return ctx.has(key) ? ctx.input(key) : "";
    },

    has(key) {
      const def = need(key);
      const p = part(key);
      if (def.kind === "block")
        return p.part === "value"
          ? Boolean(block.getInputTargetBlock(p.name))
          : p.part === "statement"
            ? stackOf(block, p.name).length > 0
            : Boolean(block.getFieldValue(p.name));
      if (p.part === "value") {
        if (!block.getInput(p.name)) return false;
        const target = child(p);
        if (!target) return false;
        const literal = literalOfChild(def, target);
        return literal === undefined || !LITERAL_KINDS.has(def.kind) ? true : literalPresent(def, literal);
      }
      if (def.kind === "variable") return Boolean(block.getField(p.name));
      if (p.part === "statement") return stackOf(block, p.name).length > 0;
      return literalPresent(def, raw(key));
    },

    isValue(key) {
      const def = need(key);
      const p = part(key);
      if (p.part !== "value") return false;
      const target = child(p);
      return Boolean(target) && literalOfChild(def, target) === undefined;
    },

    visible(key) {
      return inputVisible(need(key), raw);
    },

    enabled(key) {
      const branch = spec.element.branches?.find((b) => b.key === key);
      if (branch) return Boolean(block.getInput(part(key).name));
      const p = part(key);
      if (p.part === "fixed") return ctx.has(key);
      return Boolean(block.getInput(p.name) || block.getField(p.name)) && ctx.has(key);
    },

    branch(key) {
      const holder = branchHolder(key);
      if (holder) return holder.block ? generator.statementToCode(holder.block, holder.body) : "";
      const name = part(key).name;
      return block.getInput(name) ? generator.statementToCode(block, name) : "";
    },

    hasBranch(key) {
      const holder = branchHolder(key);
      if (holder) return Boolean(holder.block);
      const p = part(key);
      if (!block.getInput(p.name)) return false;
      const branch = spec.element.branches?.find((b) => b.key === key);
      if (!branch?.optional || spec.mutator?.fields?.some((f) => (f.key ?? f.name) === key))
        return true;
      return stackOf(block, p.name).length > 0;
    },

    items(key) {
      const itemSpec = itemSpecs.get(`${spec.element.id}:${key}`);
      if (!itemSpec) return [];
      const p = part(key);
      const body = itemSpec.body?.name ?? itemSpec.body ?? "code";
      return stackOf(block, p.part === "item" ? p.input : p.name)
        .filter((item) => item.type === itemSpec.type)
        .map((item, index) => ({
          ...itemCtx(itemSpec, item, generator, null, index),
          valueCode: makeCtx(itemSpec, item, generator).code,
          code: generator.statementToCode(item, body),
        }));
    },

    group(key) {
      const def = need(key);
      const p = part(key);
      if (p.adds) {
        const items = [];
        for (let i = 0; block.getInput(`${p.adds}${i}`); i++) {
          const field = def.fields[0];
          items.push(
            itemCtx(
              spec,
              block,
              generator,
              {
                [field.key]: { part: "value", key: field.key, name: `${p.adds}${i}`, check: null },
              },
              i,
            ),
          );
        }
        return items;
      }
      const itemSpec = itemSpecs.get(`${spec.element.id}:${key}`);
      return stackOf(block, p.name)
        .filter((item) => !itemSpec || item.type === itemSpec.type)
        .map((item, index) => itemCtx(itemSpec, item, generator, null, index));
    },

    message(key, options = {}) {
      return blockMessage(ctx, block, generator, part(key), options);
    },

    allowedMentions(legacy = ALLOWED_MENTIONS) {
      return allowedMentions(block, legacy);
    },

    modal(key) {
      const p = part(key);
      const target = p.part === "value" ? child(p) : null;
      if (!target) return "null";
      return generator.valueToCode(block, p.name, Order.NONE) || "null";
    },

    children() {
      return componentChildren(block, generator, part(spec.children).name);
    },
  };
  return ctx;
}

function itemCtx(spec, block, generator, parts, index) {
  const inner = makeCtx(spec, block, generator, parts);
  return {
    index,
    id: block.id,
    input: inner.input,
    raw: inner.raw,
    has: inner.has,
    isValue: inner.isValue,
    code: inner.code,
    block,
  };
}

/** A component's children: one expression each, or the whole list built at runtime when a loop is in it. */
export function componentChildren(block, generator, name) {
  const input = block.getInput(name);
  if (input && input.type === Blockly.inputs.inputTypes.VALUE) {
    const code = generator.valueToCode(block, name, Order.NONE);
    return code ? [code] : [];
  }
  const stack = stackOf(block, name);
  if (stack.some(isComponentLoop)) {
    const list = componentList(block, generator, name);
    return [`...${list.expression}`];
  }
  return stack
    .map((item) => generator.blockToCode(item, true))
    .map((code) =>
      (Array.isArray(code) ? code[0] : String(code ?? "")).trim().replace(/,$/, "").trim(),
    )
    .filter(Boolean);
}

/**
 * A Components V2 message read from a send/reply block: its components
 * from `part.components` (default "components") and files from
 * `part.files` (default "files"), as the builder's message code builds it.
 */
function blockMessage(ctx, block, generator, part, options) {
  const components = componentChildren(block, generator, part.components ?? "components");
  const parts = [`components: [\n${components.join(",\n")}\n]`];
  const filesName = part.files === false ? null : (part.files ?? "files");
  if (filesName && block.getInput(filesName)) {
    const files = generator.statementToCode(block, filesName).trim().replace(/,$/, "");
    if (files) parts.push(`files: [${files}]`);
  }
  let flags = "Discord.MessageFlags.IsComponentsV2";
  if (options.ephemeral && options.ephemeral !== "false")
    flags +=
      options.ephemeral === "true"
        ? " | Discord.MessageFlags.Ephemeral"
        : ` | (${options.ephemeral} ? Discord.MessageFlags.Ephemeral : 0)`;
  const mentions = allowedMentions(block, ALLOWED_MENTIONS);
  if (mentions) parts.push(mentions);
  parts.push(`flags: ${flags}`);
  return `{\n${parts.join(",\n")}\n}`;
}

/* ---------------------------------------------------------------------
   Code
   --------------------------------------------------------------------- */

const SIMPLE =
  /^(?:[A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*|-?\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|true|false|null|undefined)$/;

/* Helpers the block editor's export already adds to the bot itself
   (functions/updateCode.js), so a block mustn't add them again. */
const EXPORT_HELPERS = new Set(["disfuseDashboard", "disfuseTimeOfDay"]);

function useSetup(element, generator) {
  for (const item of element.setup ?? [])
    if (!EXPORT_HELPERS.has(item.key)) generator.definitions_[`element_${item.key}`] = item.code;
}

/** The values an element provides where a value block reads them from. */
function providedValues(element, where) {
  if (where.kind === "event") return element.values ?? [];
  if (where.kind === "input") return (element.inputs ?? []).flatMap((i) => i.provides ?? []);
  const own = element.branches?.find((b) => b.key === where.branch)?.provides ?? [];
  return [...own, ...(element.branches ?? []).flatMap((b) => b.provides ?? [])];
}

/** The enclosing block a provided value belongs to. */
function ownerOf(block, types) {
  let current = block.getSurroundParent();
  while (current) {
    if (types.includes(current.type)) return current;
    current = current.getSurroundParent();
  }
  return null;
}

function generatorFor(spec) {
  const el = spec.element;
  const code = spec.code ?? el.code;

  if (spec.role === "value") {
    return function (block) {
      const providers = [el, ...(spec.also ?? []).map((id) => elementsById.get(id)).filter(Boolean)];
      const owner = ownerOf(block, providers.flatMap((p) => p.blocks));
      const provider = (owner && providers.find((p) => p.blocks.includes(owner.type))) ?? el;
      let key = spec.value.key;
      if (spec.value.pick) {
        const option = block.getFieldValue(spec.value.pick.field);
        key = spec.value.pick.keys[option] ?? option;
      }
      const found = providedValues(provider, spec.value.where).find((v) => v.key === key);
      const code = found?.code ?? spec.value.code ?? "undefined";
      const value = code.replaceAll("@@", owner ? localSuffix(owner.id) : "");
      return [value, SIMPLE.test(value) ? Order.ATOMIC : Order.NONE];
    };
  }

  if (spec.role === "item" && !spec.code) return () => "";

  if (el.kind === "event") {
    return function (block, generator) {
      useSetup(el, generator);
      const ctx = makeCtx(spec, block, generator);
      const body = generator.statementToCode(block, bodyPart(spec).name);
      return (spec.code ? spec.code(ctx, body) : listenerCode(el, ctx, body)) + "\n";
    };
  }

  const shape =
    outputOf(spec) !== false ? "value" : el.kind === "component" ? "component" : "statement";
  return function (block, generator) {
    useSetup(el, generator);
    const ctx = makeCtx(spec, block, generator);
    let result;
    try {
      result = code(ctx);
    } catch (error) {
      console.error(`[blocks] ${spec.type}:`, error);
      result = shape === "value" ? "undefined" : "";
    }
    if (Array.isArray(result)) return result;
    result = String(result ?? "");
    if (shape === "value") return [result, SIMPLE.test(result.trim()) ? Order.ATOMIC : Order.NONE];
    if (shape === "component") return result.trim() ? `${result.trim().replace(/,$/, "")},\n` : "";
    return result && !result.endsWith("\n") ? result + "\n" : result;
  };
}

/* ---------------------------------------------------------------------
   Registering
   --------------------------------------------------------------------- */

const itemSpecs = new Map();
const elementsById = new Map();

function definitionFor(spec) {
  const layout = () => layoutOf(spec);
  const output = outputOf(spec);
  const previous = statementOf(spec, "previous");
  const next = statementOf(spec, "next");

  const definition = {
    init() {
      if (spec.colour != null) this.setColour(spec.colour);
      if (spec.style) this.setStyle(spec.style);
      if (spec.mutator) this.setInputsInline(false);
      appendLayout(this, layout(), spec);
      if (output !== false) this.setOutput(true, connectionCheck(output));
      if (previous !== false) this.setPreviousStatement(true, connectionCheck(previous));
      if (next !== false) this.setNextStatement(true, connectionCheck(next));
      if (spec.inline !== undefined) this.setInputsInline(spec.inline);
      if (spec.tooltip !== undefined) this.setTooltip(spec.tooltip);
      if (spec.helpUrl !== undefined) this.setHelpUrl(spec.helpUrl);
      if (spec.deletable !== undefined) this.setDeletable(spec.deletable);
      if (spec.movable !== undefined) this.setMovable(spec.movable);
      if (spec.editable !== undefined) this.setEditable(spec.editable);
      if (spec.mutator) this.initMutator_();
      spec.init?.call(this, this, Blockly);
    },
  };
  if (spec.mutator) Object.assign(definition, mutatorMixin(spec.mutator));
  if (spec.mixin)
    Object.assign(definition, typeof spec.mixin === "function" ? spec.mixin(Blockly) : spec.mixin);
  return definition;
}

/**
 * Gives a block that sends a message the "allowed pings" option: every
 * block of an element with a message input, and any block with
 * `pings: true`. A block with a mutator gets it as one more option; one
 * without gets a mutator with just that option (see ./pings.js).
 */
function addPings(spec) {
  const sendsMessage = (spec.element?.inputs ?? []).some((i) => i.kind === "message");
  if (spec.pings === false || !(spec.pings || spec.mutator?.pings || (sendsMessage && (spec.role === "main" || spec.role === "variant")))) return;
  if (spec.mutator) {
    spec.mutator = { ...spec.mutator, fields: withPingsField(spec.mutator.fields, true) };
    return;
  }
  spec.mutator = { options: `${spec.type}_pings_options`, fields: [PINGS_MUTATOR_FIELD] };
  markPingsLegacyTypes([spec.type]);
}

/** Registers the blocks of every element given (see src/elements). */
export function registerElements(elements) {
  for (const element of elements) if (element.builder !== false) elementsById.set(element.id, element);
  const specs = elements.flatMap((element) => element.blockly ?? []);
  for (const spec of specs)
    if (spec.role === "item") itemSpecs.set(`${spec.element.id}:${spec.branch ?? spec.group}`, spec);
  for (const spec of specs) addPings(spec);
  for (const spec of specs) {
    Blockly.Blocks[spec.type] = definitionFor(spec);
    javascriptGenerator.forBlock[spec.type] = generatorFor(spec);
    if (spec.mutator) mutatorOptionsBlock(spec.mutator, spec.colour);
    if (spec.restrictions?.length) createRestrictions([spec.type], spec.restrictions);
  }
  return specs;
}
