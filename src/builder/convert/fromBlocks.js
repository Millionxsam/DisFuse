/* =====================================================================
   Block editor project → DisFuse Builder project
   ---------------------------------------------------------------------
   Turns the saved workspaces of a block editor project into the
   `{ commands, events, variables }` a DisFuse Builder project saves, so
   a copy of the project can be made as a builder project. Nothing is
   written anywhere: this only builds the data, and the caller decides
   what to do with it.

   HOW BLOCKS BECOME STEPS
   -----------------------
   Every element is defined together with its blocks (src/elements),
   so most blocks map on their own: an event hat becomes an event, a
   stacked block becomes a step, a round block becomes a value. Their
   inputs carry over by name (an element's block names its inputs after
   the element's), and the few that don't line up are described in
   ./rules.js.

   Values that only exist inside an event ("the deleted message") or
   inside a step's section ("the sent message") become references to
   what that event or step provides: `blockOf` says which value a block
   reads. Blocks it doesn't know are matched by comparing the
   JavaScript they generate with each provided value's `code`.

   Things that work differently in the builder:

     - Commands. The "create slash commands" blocks become commands on
       the Commands page, and "when a slash command is received" is
       split: `if (name of the command = "ping")` sections are moved
       into the ping command. Whatever wasn't for one command stays in a
       "When a slash command is used" event, so it still runs. Buttons,
       menus and forms are split into one event per ID the same way.
     - Functions. The builder has none, so a function's steps are
       copied to every place it's called.
     - Blocks from Workshop packs become the pack's own steps, values
       and events, as long as the catalog passed in has the pack
       (catalog/packs.js adds both kinds), so they stay linked to it.
       BlockBuddy blocks, and blocks from a pack that isn't loaded, are
       left out with anything inside them.

   WHAT THE CALLER PASSES IN
   -------------------------
   This folder never imports Blockly. What only Blockly can answer comes
   from a small adapter (see Pages/Workspace/editor/convertToBuilder.js):

     blocks.source(type)   "builtin" | "pack" | "blockbuddy" | "missing"
                          (a "pack" block the catalog has a step for is
                          converted like a built-in one)
     blocks.shape(block)   { inputs: { [name]: "value"|"statement" }, output, previous }
     blocks.code(block)    the JavaScript a value block generates, with
                           its inputs left empty; null if it can't say

   Plain JavaScript with explicit `.js` imports, so the check script can
   run it in Node.
   ===================================================================== */

import { acceptsValues } from "../catalog/define.js";
import { blockOf, blocksOfElement } from "../../elements/index.js";
import { FLOW_CONTEXTS } from "../catalog/contexts.js";
import { newId as randomId } from "../model/ids.js";
import { LIMITS } from "../model/rules.js";
import {
  extraState,
  pingsOf,
  fieldValue,
  inputBlock,
  isDisabled,
  looseName,
  parseWorkspaceData,
  partNames,
  stackFrom,
  statementStack,
  textLiteral,
  walkBlocks,
} from "./blockJson.js";
import { readCommandDeclarations, COMMAND_CONTAINERS } from "./commands.js";
import { DISPATCHERS, residualStack, specialize, dispatchNames, guardBlock } from "./dispatch.js";
import { BLOCK_RULES, EVENT_SETTINGS, STATEMENT_RULES, VALUE_RULES } from "./rules.js";

/** Literal blocks: what's typed into them, and as what. */
const LITERAL_BLOCKS = {
  text: { field: "TEXT", kind: "text" },
  text_multiline: { field: "TEXT", kind: "text" },
  math_number: { field: "NUM", kind: "number" },
  logic_boolean: { field: "BOOL", kind: "boolean" },
  colour_picker: { field: "COLOUR", kind: "colour" },
};

const PROCEDURE_DEFS = new Set(["procedures_defnoreturn", "procedures_defreturn"]);

/* ---------------------------------------------------------------------
   Comparing generated code
   --------------------------------------------------------------------- */

/** Code with spacing, quotes, `await`, outer brackets and `@@` evened out. */
export function normaliseCode(code) {
  let out = String(code ?? "")
    .replaceAll("@@", "")
    .replace(/\bawait\s+/g, "")
    .replace(/'/g, '"')
    .replace(/\s+/g, "")
    .replace(/;+$/, "")
    .replace(/\(([A-Za-z_$][\w$]*)\)(?=[.?[])/g, "$1");
  while (/^\((.*)\)$/.test(out) && balanced(out.slice(1, -1))) out = out.slice(1, -1);
  return out;
}

function balanced(code) {
  let depth = 0;
  for (const char of code) {
    if (char === "(") depth += 1;
    else if (char === ")" && --depth < 0) return false;
  }
  return depth === 0;
}

/** `githubUserInformation.login` and `githubUser_abc.login` both become `$.login`. */
function withoutHead(code) {
  return /^[A-Za-z_$][\w$]*[.?[]/.test(code) ? code.replace(/^[A-Za-z_$][\w$]*/, "$") : null;
}

/** The provided value whose code matches, or null when none or several do. */
export function matchProvided(code, provided = []) {
  if (!code) return null;
  const wanted = normaliseCode(code);
  const exact = provided.filter((p) => normaliseCode(p.code) === wanted);
  if (exact.length === 1) return exact[0].key;
  if (exact.length > 1) return null;
  const head = withoutHead(wanted);
  if (!head) return null;
  const loose = provided.filter((p) => withoutHead(normaliseCode(p.code)) === head);
  return loose.length === 1 ? loose[0].key : null;
}

/* ---------------------------------------------------------------------
   The report
   --------------------------------------------------------------------- */

function newReport() {
  return {
    workspaces: 0,
    blocks: 0,
    /** Blocks from Workshop packs that couldn't be kept (and blocks inside them). */
    packBlocks: 0,
    /** Blocks from Workshop packs that became the pack's own steps. */
    packSteps: 0,
    /** BlockBuddy blocks (and blocks inside them). */
    blockBuddyBlocks: 0,
    /** Blocks this editor doesn't know: a pack that isn't installed, usually. */
    unknownBlocks: 0,
    /** label → count, for built-in blocks with nothing like them in the builder. */
    unsupported: {},
    /** label → count, for steps where something couldn't be carried over. */
    partial: {},
    /** One-off notes, written for the person reading them. */
    notes: [],
  };
}

/* =====================================================================
   The converter
   ===================================================================== */

export class BlockConverter {
  /**
   * @param {object} catalog  the catalog (../catalog/index.js), with the
   *   Workshop packs the project uses added (catalog/packs.js)
   * @param {object} blocks   the adapter described at the top of this file
   * @param {object} [options]
   * @param {() => string} [options.newId]
   */
  constructor(catalog, blocks, { newId = randomId, trace = null } = {}) {
    this.catalog = catalog;
    /** For the check script: [{ type, what }] for everything not carried over whole. */
    this.trace = trace;
    this.blocks = blocks;
    this.newId = newId;
    this.report = newReport();

    /* block type → definition, by the blocks each definition is made of */
    this.byBlock = { events: new Map(), actions: new Map(), values: new Map(), components: new Map() };
    for (const kind of Object.keys(this.byBlock))
      for (const def of catalog[kind].values())
        for (const type of blockTypesOf(def)) if (!this.byBlock[kind].has(type)) this.byBlock[kind].set(type, def);

    /* A pack's provided values are blocks of their own in the block
       editor (catalog/packs.js packValueBlockType). */
    this.packValueBlocks = new Set();
    for (const def of [...catalog.events.values(), ...catalog.actions.values()]) {
      if (!def.pack) continue;
      for (const value of def.values ?? []) if (value.block) this.packValueBlocks.add(value.block);
      for (const branch of def.branches ?? []) for (const value of branch.provides ?? []) if (value.block) this.packValueBlocks.add(value.block);
    }

    /* Values with no inputs, by their code, to recognise context blocks
       ("member who ran the command") that no definition lists. */
    this.valuesByCode = new Map();
    for (const def of catalog.values.values()) {
      if (def.inputs.length || def.pack) continue;
      try {
        const code = normaliseCode(def.code({}));
        if (code && !this.valuesByCode.has(code)) this.valuesByCode.set(code, def);
      } catch {
        /* needs a real ctx; not a context value */
      }
    }

    this.variableNames = new Map(); // block editor variable id → name
    this.variables = new Map(); // lower-case name → builder variable
    this.procedures = new Map(); // lower-case name → definition block
    this.commands = [];
    this.commandNames = new Map(); // command id → names its handlers may check for
    this.flowStacks = new Map(); // command id → blocks for its flow, in order
    this.events = [];
    this.absorbed = new Set(); // block ids already used up (command declarations)
    this.shapes = new Map();
    this.codes = new Map();
    this.noted = new Set();
  }

  /* ---- Reporting --------------------------------------------------- */

  note(text) {
    if (this.noted.has(text)) return;
    this.noted.add(text);
    this.report.notes.push(text);
  }

  /** A readable name for a block type: its builder step's label if it has one. */
  labelOf(type) {
    for (const kind of ["actions", "values", "events", "components"]) {
      const def = this.byBlock[kind].get(type);
      if (def) return def.label;
    }
    return String(type)
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase());
  }

  unsupported(block) {
    this.trace?.push({ type: block.type, what: "unsupported" });
    const label = this.labelOf(block.type);
    this.report.unsupported[label] = (this.report.unsupported[label] ?? 0) + 1;
  }

  partial(def, block, what = "") {
    this.trace?.push({ type: block?.type, what: `partial ${what}`.trim() });
    const label = def?.label ?? this.labelOf(block?.type);
    this.report.partial[label] = (this.report.partial[label] ?? 0) + 1;
  }

  /** Counts a block (and what's inside it) that's being left out on purpose. */
  skip(block, source) {
    let count = 0;
    walkBlocks({ ...block, next: undefined }, () => (count += 1));
    if (source === "pack") this.report.packBlocks += count;
    else if (source === "blockbuddy") this.report.blockBuddyBlocks += count;
    else this.report.unknownBlocks += count;
  }

  /**
   * "builtin" for DisFuse's own blocks, and for Workshop pack blocks the
   * catalog has a step, value or event for; anything else is left out.
   */
  sourceOf(type) {
    let source;
    try {
      source = this.blocks.source(type) ?? "missing";
    } catch {
      source = "missing";
    }
    if (source === "pack" && this.isPackStep(type)) return "builtin";
    return source;
  }

  isPackStep(type) {
    if (this.packValueBlocks.has(type)) return true;
    return ["events", "actions", "values"].some((kind) => Boolean(this.byBlock[kind].get(type)?.pack));
  }

  /* ---- What only Blockly knows --------------------------------------- */

  shapeOf(block) {
    const key = `${block.type}|${JSON.stringify(block.extraState ?? null)}`;
    if (!this.shapes.has(key)) {
      let shape = null;
      try {
        shape = this.blocks.shape(block);
      } catch {
        shape = null;
      }
      this.shapes.set(key, shape ?? { inputs: {}, output: false, previous: false, unknown: true });
    }
    return this.shapes.get(key);
  }

  /** The names of a block's statement inputs that hold something. */
  statementInputs(block) {
    const shape = this.shapeOf(block);
    if (!shape.unknown) return Object.keys(block.inputs ?? {}).filter((name) => shape.inputs[name] === "statement");
    /* Blockly couldn't say: an input holding a stack of steps is one. */
    return Object.keys(block.inputs ?? {}).filter((name) => {
      const child = block.inputs[name]?.block;
      return child && (child.next || this.byBlock.actions.has(child.type) || STATEMENT_RULES[child.type]);
    });
  }

  isValueBlock(block) {
    return Boolean(this.shapeOf(block).output);
  }

  /** The code of a value block on its own, for matching. Only for blocks with nothing plugged in. */
  codeOf(block) {
    const filled = Object.values(block.inputs ?? {}).some((slot) => slot?.block);
    if (filled) return null;
    const key = `${block.type}|${JSON.stringify(block.fields ?? {})}|${JSON.stringify(block.extraState ?? null)}`;
    if (!this.codes.has(key)) {
      let code = null;
      try {
        code = this.blocks.code(block);
      } catch {
        code = null;
      }
      this.codes.set(key, code);
    }
    return this.codes.get(key);
  }

  /* ---- Variables ------------------------------------------------------ */

  /** The builder variable for a name, made the first time it's needed. */
  variable(name) {
    let clean = String(name ?? "").trim().slice(0, LIMITS.variableNameLength).trim();
    if (!clean) clean = "variable";
    const key = clean.toLowerCase();
    if (!this.variables.has(key)) {
      if (this.variables.size >= LIMITS.variables) return null;
      this.variables.set(key, { id: this.newId(), name: clean });
    }
    return this.variables.get(key);
  }

  /** A variable field's saved value (`{ id }`, or an id) → its name. */
  variableNameOf(raw) {
    if (raw && typeof raw === "object") return this.variableNames.get(raw.id) ?? raw.name ?? null;
    if (typeof raw === "string") return this.variableNames.get(raw) ?? null;
    return null;
  }

  variableRef(raw) {
    const name = this.variableNameOf(raw);
    if (!name) return null;
    const variable = this.variable(name);
    return variable ? { kind: "variable", id: variable.id } : null;
  }

  /* =====================================================================
     The whole project
     ===================================================================== */

  run(workspaces = []) {
    const tops = [];
    for (const workspace of workspaces) {
      const { blocks, variables } = parseWorkspaceData(workspace?.data);
      this.report.workspaces += 1;
      for (const variable of variables)
        if (variable?.id && variable.name !== undefined) this.variableNames.set(variable.id, String(variable.name));
      for (const block of blocks) if (block?.type) tops.push({ block, workspace: workspace?.name ?? "" });
    }

    for (const { block } of tops)
      walkBlocks(block, (inner) => {
        this.report.blocks += 1;
        if (this.isPackStep(inner.type)) this.report.packSteps += 1;
      });

    /* Variables first, in the order the block editor lists them. */
    for (const name of this.variableNames.values()) this.variable(name);

    /* Functions, so calls anywhere can find them. */
    for (const { block } of tops)
      if (PROCEDURE_DEFS.has(block.type) && this.sourceOf(block.type) === "builtin") {
        const name = String(fieldValue(block, "NAME") ?? "").toLowerCase();
        if (name && !this.procedures.has(name)) this.procedures.set(name, block);
      }

    /* Commands, wherever they're declared. */
    for (const { block } of tops) {
      walkBlocks(block, (inner) => {
        if (!COMMAND_CONTAINERS.has(inner.type) || this.absorbed.has(inner.id)) return;
        if (this.sourceOf(inner.type) !== "builtin") return;
        this.absorbed.add(inner.id);
        readCommandDeclarations(inner, this);
      });
    }

    const startup = [];
    for (const { block } of tops) this.topBlock(block, startup);

    for (const command of this.commands) this.buildCommandFlows(command);

    if (this.report.packSteps)
      this.note("Blocks from Workshop packs were copied as the same packs' steps, so they still come from the pack.");

    if (startup.length) {
      const def = this.catalog.events.get("bot_ready");
      const scope = this.eventScope(def);
      const actions = this.convertStack(startup, scope);
      if (actions.length) {
        this.addEvent(def, { label: "Blocks that weren't in an event", actions });
        this.note(
          'Blocks that weren\'t inside an event ran as soon as the bot started, so they were put in a "When the bot starts" event.',
        );
      }
    }

    return {
      builder: {
        commands: this.commands,
        events: this.events,
        variables: [...this.variables.values()],
      },
      report: this.report,
    };
  }

  /** A block sitting on its own on a workspace. */
  topBlock(block, startup) {
    const source = this.sourceOf(block.type);
    if (source !== "builtin") return this.skip(block, source);
    if (PROCEDURE_DEFS.has(block.type) || block.type === "procedures_mutatorcontainer") return;
    if (COMMAND_CONTAINERS.has(block.type)) return;
    if (block.type === "main_token") return;
    if (block.type === "db_create") return this.note("Databases are made for you the first time a step uses them, so \"create database\" blocks were left out.");

    const dispatcher = DISPATCHERS[block.type];
    if (dispatcher) return this.dispatchHat(block, dispatcher);

    /* "When slash command named ... is received" moves into that command
       when the name is typed in and the command is made here. */
    if (block.type === "slash_received_named") {
      const name = textLiteral(inputBlock(block, "name"));
      const commands = typeof name === "string" ? this.dispatchTargets(DISPATCHERS.slash_received).get(name) : null;
      if (commands?.length) {
        const stack = this.bodyOf(block);
        for (const command of commands) this.flowStacks.get(command.id).push({ stack, disabled: isDisabled(block) });
        return;
      }
    }

    const eventDef = this.byBlock.events.get(block.type);
    const shape = this.shapeOf(block);
    if (eventDef?.pack && !shape.output && !shape.previous) return this.packHat(block, eventDef, startup);
    if (eventDef && !shape.output && !shape.previous) return this.eventHat(block, eventDef);

    if (shape.output) return; /* a loose round block does nothing */

    if (!shape.previous && !this.byBlock.actions.has(block.type) && !STATEMENT_RULES[block.type]) {
      /* A hat this converter doesn't know. */
      this.unsupported(block);
      return;
    }

    /* "Start bot with token" on its own is the old way of logging in;
       a builder project logs in with the project's token by itself. */
    const stack = stackFrom(block).filter((inner) => inner.type !== "main_botStart");
    if (stack.length < stackFrom(block).length)
      this.note('"Start bot with token" was left out. Builder projects log in with the bot token in the project\'s settings.');
    startup.push(...stack);
  }

  /* =====================================================================
     Events
     ===================================================================== */

  eventScope(def, extra = {}) {
    return {
      flow: "event",
      eventDef: def,
      contexts: new Set(def?.provides ?? []),
      options: new Map(),
      bindings: [],
      named: { embeds: new Map(), polls: new Map() },
      procedures: [],
      hoist: null,
      ...extra,
    };
  }

  /** The statement input holding a hat's steps. */
  bodyOf(block) {
    const statements = this.statementInputs(block);
    return statements.length ? statementStack(block, statements[0]) : [];
  }

  /** An event's settings, from the hat's own fields and inputs. */
  eventSettings(def, block, scope) {
    const settings = {};
    const fixed = EVENT_SETTINGS[block.type] ?? {};
    for (const inputDef of def.settings) {
      if (Object.prototype.hasOwnProperty.call(fixed, inputDef.key)) {
        settings[inputDef.key] = { literal: fixed[inputDef.key] };
        continue;
      }
      const value = this.inputFromBlock(def, inputDef, block, scope);
      if (value !== undefined) settings[inputDef.key] = value;
    }
    return settings;
  }

  addEvent(def, { label = "", settings = {}, actions = [], enabled = true }) {
    if (this.events.length >= LIMITS.events) {
      this.note(`Builder projects can have up to ${LIMITS.events} events, so some events were left out.`);
      return null;
    }
    const event = {
      id: this.newId(),
      type: def.id,
      label: String(label).slice(0, LIMITS.eventLabelLength),
      settings,
      actions,
      enabled,
      created: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  eventHat(block, def, { stack = null, settings: extraSettings = {}, label = "" } = {}) {
    const scope = this.eventScope(def);
    const settings = { ...this.eventSettings(def, block, scope), ...extraSettings };
    const actions = this.convertStack(stack ?? this.bodyOf(block), scope);
    /* A pack's event can do something with no steps in it (its own code). */
    if (!actions.length && !def.pack) return null;
    return this.addEvent(def, { label, settings, actions, enabled: !isDisabled(block) });
  }

  /**
   * An event from a Workshop pack. A block pack's hat with no section of
   * its own runs the blocks stacked under it as its steps (see
   * catalog/blockPacks.js); with a section, anything stacked under it
   * ran at the top of the bot, so it goes with the other loose blocks.
   */
  packHat(block, def, startup) {
    const rest = stackFrom(block).slice(1);
    if (def.packBody === "next") return this.eventHat(block, def, { stack: rest });
    startup.push(...rest);
    return this.eventHat(block, def, { stack: def.packBody === "none" ? [] : null });
  }

  /* =====================================================================
     Hats that handle several commands, buttons, menus or forms
     ===================================================================== */

  dispatchHat(block, dispatcher) {
    const def = this.catalog.events.get(dispatcher.event);
    const body = this.bodyOf(block);
    const targets = this.dispatchTargets(dispatcher);
    const mentioned = dispatchNames(body, dispatcher).filter((name) => targets.has(name));

    if (!mentioned.length) return this.eventHat(block, def, { stack: body });

    for (const name of mentioned) {
      const stack = specialize(body, dispatcher, name);
      if (!stack.length) continue;
      const target = targets.get(name);
      if (dispatcher.kind === "command")
        for (const command of target) this.flowStacks.get(command.id).push({ stack, disabled: isDisabled(block) });
      else
        this.eventHat(block, def, {
          stack,
          settings: { [dispatcher.setting]: { literal: name } },
        });
    }

    /* What runs for everything else, kept as it was. */
    const rest = residualStack(body, dispatcher, mentioned);
    if (rest.length) this.eventHat(block, def, { stack: [guardBlock(dispatcher, mentioned, rest)] });
  }

  /** What each name in a dispatching hat can be moved into. */
  dispatchTargets(dispatcher) {
    const targets = new Map();
    if (dispatcher.kind === "command") {
      for (const command of this.commands) {
        if (!dispatcher.commandKinds.includes(command.kind)) continue;
        for (const name of this.commandNames.get(command.id) ?? [command.name]) {
          const list = targets.get(name) ?? [];
          if (!list.includes(command)) list.push(command);
          targets.set(name, list);
        }
      }
      return targets;
    }
    /* Buttons, menus and forms: any ID can have an event of its own. */
    return { has: (name) => typeof name === "string" && name.length > 0 && name.length <= 100, get: () => null };
  }

  /* =====================================================================
     Commands
     ===================================================================== */

  /**
   * Adds a command declared in the block editor (see ./commands.js).
   * `typedName` is its name as typed there, which is what its handler
   * checks for, even when the name had to be cleaned up.
   */
  addCommand(command, typedName = command.name) {
    this.commands.push(command);
    this.flowStacks.set(command.id, []);
    this.commandNames.set(command.id, new Set([command.name, String(typedName)]));
  }

  commandScope(command, kind, options = []) {
    return {
      flow: kind,
      eventDef: null,
      command,
      contexts: new Set(FLOW_CONTEXTS[command.kind] ?? FLOW_CONTEXTS.slash),
      options: new Map(options.map((option) => [option.name.toLowerCase(), option])),
      bindings: [],
      named: { embeds: new Map(), polls: new Map() },
      procedures: [],
      hoist: null,
    };
  }

  buildCommandFlows(command) {
    const parts = this.flowStacks.get(command.id) ?? [];
    const subs = [];
    for (const option of command.options ?? []) {
      if (option.type === 1) subs.push({ group: null, sub: option });
      if (option.type === 2) for (const sub of option.options ?? []) if (sub.type === 1) subs.push({ group: option, sub });
    }

    const convert = (scope, transform) => {
      const actions = [];
      for (const { stack, disabled } of parts) {
        const blocks = transform ? transform(stack) : stack;
        const converted = this.convertStack(blocks, scope);
        if (disabled) for (const action of converted) action.disabled = true;
        actions.push(...converted);
      }
      return actions;
    };

    if (!subs.length) {
      const valueOptions = (command.options ?? []).filter((o) => o.type !== 1 && o.type !== 2);
      command.actions = convert(this.commandScope(command, command.kind, valueOptions));
      return;
    }

    /* A command with subcommands only runs each subcommand's steps, so
       every subcommand gets the steps meant for it. */
    for (const { group, sub } of subs) {
      const valueOptions = (sub.options ?? []).filter((o) => o.type !== 1 && o.type !== 2);
      sub.actions = convert(this.commandScope(command, "subcommand", valueOptions), (stack) =>
        specialize(stack, DISPATCHERS.__subcommand, { group: group?.name ?? null, sub: sub.name }),
      );
    }
  }

  /* =====================================================================
     Steps
     ===================================================================== */

  convertStack(blocks, scope) {
    const out = [];
    for (const block of blocks) out.push(...this.convertStatement(block, scope));
    return out;
  }

  convertStatement(block, scope) {
    if (!block?.type) return [];
    const source = this.sourceOf(block.type);
    if (source !== "builtin") {
      this.skip(block, source);
      return [];
    }
    if (this.absorbed.has(block.id) || COMMAND_CONTAINERS.has(block.type) || block.type === "main_token" || block.type === "db_create") return [];

    const hoist = [];
    const inner = { ...scope, hoist };
    let actions;

    const rule = STATEMENT_RULES[block.type];
    if (rule) actions = rule(block, inner, this) ?? [];
    else {
      const def = this.byBlock.actions.get(block.type);
      if (def) actions = [this.buildAction(def, block, inner)];
      else if (this.isValueBlock(block)) actions = [];
      else {
        this.unsupported(block);
        actions = [];
      }
    }

    if (isDisabled(block)) for (const action of actions) action.disabled = true;
    return [...hoist, ...actions];
  }

  /** The id the next action will get, for rules that need it before building. */
  newAction(def) {
    const branches = {};
    for (const branch of def.branches ?? []) if (!branch.optional) branches[branch.key] = [];
    return { id: this.newId(), type: def.id, inputs: {}, branches };
  }

  /**
   * One step from one block, with its inputs and sections.
   * `rule` (from ./rules.js) covers what doesn't line up by name.
   */
  buildAction(def, block, scope, rule = BLOCK_RULES[block.type] ?? {}) {
    const action = this.newAction(def);
    const used = new Set(rule.ignore ?? []);
    const lost = [];

    for (const inputDef of def.inputs) {
      const value = this.inputFromBlock(def, inputDef, block, scope, { rule, used, owner: action });
      if (value === null) lost.push(inputDef.key);
      else if (value !== undefined) action.inputs[inputDef.key] = value;
    }

    const statements = this.statementInputs(block);
    for (const branchDef of def.branches) {
      if (rule.branches && typeof rule.branches[branchDef.key] === "function") {
        const result = rule.branches[branchDef.key](block, scope, this, action, used);
        if (result !== undefined) action.branches[branchDef.key] = result;
        continue;
      }
      if (branchDef.repeat) continue;

      let name = rule.branches?.[branchDef.key];
      if (name === undefined) name = statements.find((s) => s === branchDef.key) ?? statements.find((s) => looseName(s) === looseName(branchDef.key));
      if (name === undefined) {
        const plain = def.branches.filter((b) => !b.repeat);
        const free = statements.filter((s) => !used.has(s) && !def.branches.some((b) => looseName(b.key) === looseName(s)));
        if (plain.length === 1 && free.length === 1) name = free[0];
      }
      if (!name) continue;
      used.add(name);

      const stack = statementStack(block, name);
      if (branchDef.optional && !stack.length) continue;
      action.branches[branchDef.key] = this.convertStack(stack, this.branchScope(scope, def, action, branchDef));
    }

    const left = this.leftovers(block, used);
    if (left.length || lost.length) this.partial(def, block, [...lost.map((k) => `lost ${k}`), ...left.map((n) => `unused ${n}`)].join(", "));
    if (rule.after) rule.after(action, block, scope, this);
    return action;
  }

  /**
   * The inputs of a block that held something nothing used. Fields
   * aren't counted: the ones nothing maps to are modes the builder
   * expresses another way.
   */
  leftovers(block, used) {
    const shape = this.shapeOf(block);
    return Object.keys(block.inputs ?? {}).filter((name) => {
      if (used.has(name)) return false;
      return shape.inputs[name] === "statement" ? statementStack(block, name).length > 0 : Boolean(block.inputs[name]?.block);
    });
  }

  /** The scope inside a step's section: what it provides, and the contexts it adds. */
  branchScope(scope, def, action, branchDef) {
    const bindings = [...scope.bindings];
    if (branchDef.provides?.length)
      bindings.push({
        owner: def.id,
        types: blockTypesOf(def),
        provides: branchDef.provides,
        ref: (key) => ({ kind: "branch", action: action.id, branch: branchDef.key, key }),
      });
    const contexts = new Set(scope.contexts);
    for (const context of branchDef.contexts ?? []) contexts.add(context);
    return { ...scope, bindings, contexts };
  }

  /* =====================================================================
     Inputs
     ===================================================================== */

  /** Which field or input of a block feeds a definition's input. */
  partFor(block, key) {
    const names = partNames(block);
    return names.find((n) => n === key) ?? names.find((n) => looseName(n) === looseName(key)) ?? null;
  }

  /**
   * The saved value for one input of a definition, read from a block.
   * Undefined to leave the input at its default; null when the block had
   * something there that couldn't be kept.
   */
  inputFromBlock(def, inputDef, block, scope, { rule = BLOCK_RULES[block.type] ?? {}, used = new Set(), owner = null } = {}) {
    const key = inputDef.key;
    const mapped = rule.inputs?.[key];

    if (typeof mapped === "function") return mapped(block, scope, this, { def, inputDef, used, owner });
    if (mapped && typeof mapped === "object" && "literal" in mapped) return { literal: mapped.literal };

    const name = typeof mapped === "string" ? mapped : this.partFor(block, key);
    if (!name) return undefined;
    used.add(name);

    if (block.fields && Object.prototype.hasOwnProperty.call(block.fields, name))
      return this.fieldInput(inputDef, block.fields[name], rule.values?.[key]);

    if (this.shapeOf(block).inputs[name] === "statement" && !["group", "message", "modal"].includes(inputDef.kind))
      return undefined;

    const child = inputBlock(block, name);
    return this.valueInput(inputDef, child, this.inputScope(scope, def, inputDef), rule.values?.[key]);
  }

  /** Values an input provides only inside itself ("current item" in a filter). */
  inputScope(scope, def, inputDef) {
    if (!inputDef.provides?.length) return scope;
    return {
      ...scope,
      bindings: [
        ...scope.bindings,
        {
          owner: def.id,
          types: blockTypesOf(def),
          provides: inputDef.provides,
          ref: (key) => ({ kind: "input", source: def.id, input: inputDef.key, key }),
        },
      ],
    };
  }

  /** A field's value as an input value. */
  fieldInput(inputDef, raw, valueMap) {
    if (inputDef.kind === "variable") {
      const ref = this.variableRef(raw);
      return ref ? { ref } : null;
    }
    let value = raw;
    if (valueMap && Object.prototype.hasOwnProperty.call(valueMap, String(raw))) value = valueMap[String(raw)];
    const literal = this.coerce(inputDef, value, typeof value === "boolean" ? "boolean" : "field");
    return literal === undefined ? null : { literal };
  }

  /**
   * A literal for an input kind, or undefined if it doesn't fit (the
   * caller then uses a value instead, or gives up).
   * `from` is what kind of thing it came from: a "text", "number",
   * "boolean" or "colour" block, or a "field".
   */
  coerce(inputDef, value, from) {
    switch (inputDef.kind) {
      case "text":
      case "code": {
        /* A number or true/false block in an input that takes anything
           stays a number (5, not "5"), which needs a value. */
        if ((from === "number" || from === "boolean") && inputDef.kind === "text") {
          const accepts = inputDef.accepts ?? ["String"];
          if (accepts.includes(null) || accepts.some((t) => t !== "String")) return undefined;
        }
        return String(value ?? "");
      }
      case "number": {
        if (from === "boolean") return undefined;
        const text = String(value ?? "").trim();
        if (!text.length) return undefined;
        const n = Number(text);
        return Number.isFinite(n) ? n : undefined;
      }
      case "boolean":
        if (value === true || value === false) return value;
        if (from === "field" || from === "boolean") {
          const text = String(value).toUpperCase();
          if (text === "TRUE") return true;
          if (text === "FALSE") return false;
        }
        return undefined;
      case "colour":
        return from === "colour" || from === "field" || from === "text" ? String(value ?? "") : undefined;
      case "dropdown": {
        const options = inputDef.options ?? [];
        const text = String(value ?? "");
        const found = options.find((o) => o.value === text) ?? options.find((o) => o.value.toLowerCase() === text.toLowerCase());
        return found ? found.value : undefined;
      }
      case "multi": {
        const list = Array.isArray(value) ? value : [value];
        const allowed = new Set((inputDef.options ?? []).map((o) => o.value));
        return list.map(String).filter((v) => allowed.has(v));
      }
      default:
        return undefined;
    }
  }

  /** What a value input holds, as an input value for `inputDef`. */
  valueInput(inputDef, child, scope, valueMap) {
    if (!child) return undefined;
    const source = this.sourceOf(child.type);
    if (source !== "builtin") {
      this.skip(child, source);
      return null;
    }
    if (isDisabled(child)) return undefined;

    if (inputDef.kind === "variable") {
      const ref = child.type === "variables_get" ? this.variableRef(fieldValue(child, "VAR")) : null;
      return ref ? { ref } : null;
    }

    const literalBlock = LITERAL_BLOCKS[child.type];
    if (literalBlock) {
      let raw = fieldValue(child, literalBlock.field);
      if (valueMap && Object.prototype.hasOwnProperty.call(valueMap, String(raw))) raw = valueMap[String(raw)];
      const literal = this.coerce(inputDef, raw, literalBlock.kind);
      if (literal !== undefined) return { literal };
    }

    if (inputDef.kind === "dropdown" || inputDef.kind === "multi" || !acceptsValues(inputDef)) {
      const constant = this.constantOf(child, inputDef, valueMap);
      if (constant !== undefined) {
        const literal = this.coerce(inputDef, constant, Array.isArray(constant) ? "field" : "field");
        if (literal !== undefined) return { literal };
      }
      return null;
    }

    const ref = this.valueRef(child, scope);
    return ref ? { ref } : null;
  }

  /**
   * A fixed value read out of a block, for inputs that can't take a
   * value: a permission block in a permission dropdown, a list of them
   * in a multi-choice, plain text where only typing is allowed.
   */
  constantOf(block, inputDef, valueMap) {
    if (!block) return undefined;
    const map = (v) => (valueMap && Object.prototype.hasOwnProperty.call(valueMap, String(v)) ? valueMap[String(v)] : v);
    const text = textLiteral(block);
    if (text !== null) return inputDef.kind === "multi" ? text.split(",").map((t) => map(t.trim())).filter(Boolean) : map(text);
    if (LITERAL_BLOCKS[block.type]) return map(fieldValue(block, LITERAL_BLOCKS[block.type].field));
    if (block.type === "lists_create_with") {
      const items = [];
      for (const [name] of Object.entries(block.inputs ?? {}))
        if (/^ADD\d+$/.test(name)) {
          const value = this.constantOf(inputBlock(block, name), { ...inputDef, kind: "dropdown" }, valueMap);
          if (value !== undefined) items.push(value);
        }
      return inputDef.kind === "multi" ? items : items[0];
    }
    /* A block whose only job is to pick from a list (a permission, a
       channel type): its single dropdown is the value. */
    const fields = Object.values(block.fields ?? {}).filter((v) => typeof v === "string");
    if (fields.length === 1 && !Object.keys(block.inputs ?? {}).length) {
      const value = map(fields[0]);
      return inputDef.kind === "multi" ? [value] : value;
    }
    return undefined;
  }

  /* =====================================================================
     Values
     ===================================================================== */

  /** A value block as a value reference, or null if there's nothing like it. */
  valueRef(block, scope) {
    if (!block?.type) return null;
    const source = this.sourceOf(block.type);
    if (source !== "builtin") {
      this.skip(block, source);
      return null;
    }
    if (isDisabled(block)) return null;

    const rule = VALUE_RULES[block.type];
    if (rule) {
      const result = rule(block, scope, this);
      if (result !== undefined) return result;
    }

    const provided = this.providedRef(block, scope);
    if (provided) return provided;

    const def = this.byBlock.values.get(block.type);
    if (def) return this.valueFromDef(def, block, scope);

    const byCode = this.codeOf(block);
    if (byCode) {
      const match = this.valuesByCode.get(normaliseCode(byCode));
      if (match) return { kind: "value", type: match.id, inputs: {} };
    }

    if (this.byBlock.events.has(block.type) || this.byBlock.actions.has(block.type)) {
      /* A value that only exists inside one event or step, used outside it. */
      this.trace?.push({ type: block.type, what: `outside its owner (${scope.flow})` });
      this.note(
        `"${this.labelOf(block.type)}" was used outside the event or step it belongs to, so it was left out there.`,
      );
      return null;
    }

    this.unsupported(block);
    return null;
  }

  valueFromDef(def, block, scope, rule = BLOCK_RULES[block.type] ?? {}) {
    const inputs = {};
    const used = new Set(rule.ignore ?? []);
    const lost = [];
    for (const inputDef of def.inputs) {
      const value = this.inputFromBlock(def, inputDef, block, scope, { rule, used });
      if (value === null) lost.push(inputDef.key);
      else if (value !== undefined) inputs[inputDef.key] = value;
    }
    const left = this.leftovers(block, used);
    if (lost.length || left.length) this.partial(def, block, [...lost.map((k) => `lost ${k}`), ...left.map((n) => `unused ${n}`)].join(", "));
    return { kind: "value", type: def.id, inputs };
  }

  /** A value an enclosing step, input or event provides. */
  providedRef(block, scope) {
    if (this.packValueBlocks.has(block.type)) {
      for (let i = scope.bindings.length - 1; i >= 0; i--) {
        const found = scope.bindings[i].provides?.find((p) => p.block === block.type);
        if (found) return scope.bindings[i].ref(found.key);
      }
      const value = scope.eventDef?.values?.find((v) => v.block === block.type);
      if (value) return { kind: "event", key: value.key };
      return null;
    }

    for (let i = scope.bindings.length - 1; i >= 0; i--) {
      const binding = scope.bindings[i];
      if (binding.match) {
        const ref = binding.match(block);
        if (ref) return ref;
        continue;
      }
      const exact = exactKey(block, binding.owner, binding.provides);
      if (exact) return binding.ref(exact);
      const listed = binding.types?.includes(block.type);
      const found = matchProvided(this.codeOf(block), binding.provides);
      if (found && (listed || !this.byBlock.values.has(block.type))) return binding.ref(found);
    }

    const def = scope.eventDef;
    if (def?.values?.length) {
      const exact = exactKey(block, def.id, def.values);
      if (exact) return { kind: "event", key: exact };
      const listed = blockTypesOf(def).includes(block.type);
      const found = matchProvided(this.codeOf(block), def.values);
      if (found && (listed || !this.byBlock.values.has(block.type))) return { kind: "event", key: found };
    }
    return null;
  }

  /* =====================================================================
     Messages and forms
     ===================================================================== */

  /** A message builder piece from a component block, or null. */
  component(block, scope, family = "message") {
    const source = this.sourceOf(block.type);
    if (source !== "builtin") {
      this.skip(block, source);
      return [];
    }
    if (isDisabled(block)) return [];

    /* The builder's messages can't repeat pieces in a loop, so a loop's
       pieces are kept once. */
    if (/^controls_|^loop_/.test(block.type) || this.byBlock.actions.get(block.type)?.category === "loops") {
      this.note("Loops inside a message were removed. The pieces inside them were kept once.");
      const out = [];
      for (const name of this.statementInputs(block))
        for (const child of statementStack(block, name)) out.push(...this.component(child, scope, family));
      return out;
    }

    const def = this.byBlock.components.get(block.type);
    if (!def || def.family !== family) {
      this.unsupported(block);
      return [];
    }

    const rule = BLOCK_RULES[block.type] ?? {};
    const piece = { id: this.newId(), type: def.id, inputs: {} };
    const used = new Set(rule.ignore ?? []);
    for (const inputDef of def.fields) {
      const value = this.inputFromBlock(def, inputDef, block, scope, { rule, used });
      if (value !== null && value !== undefined) piece.inputs[inputDef.key] = value;
    }
    if (def.children) {
      const children = [];
      if (rule.child) {
        used.add(rule.child);
        const child = inputBlock(block, rule.child);
        if (child) children.push(...this.component(child, scope, family));
      } else
        for (const name of this.statementInputs(block)) {
          used.add(name);
          for (const child of statementStack(block, name)) children.push(...this.component(child, scope, family));
        }
      piece.children = children;
    }
    if (rule.after) rule.after(piece, block, scope, this);
    return [piece];
  }

  /** A message: pieces from a statement input, and files from another. */
  messageFrom(block, scope, { components = "components", files = "files" } = {}) {
    const spec = { components: [], files: [], pings: pingsOf(block) };
    for (const child of statementStack(block, components)) spec.components.push(...this.component(child, scope));
    if (files) spec.files = this.filesFrom(statementStack(block, files), scope);
    return spec;
  }

  /** Files to attach, from "add file" blocks. */
  filesFrom(blocks, scope) {
    const files = [];
    const fields = {
      source: { kind: "text", key: "source", accepts: ["String"], default: "" },
      name: { kind: "text", key: "name", accepts: ["String"], default: "" },
    };
    for (const block of blocks) {
      if (this.sourceOf(block.type) !== "builtin") {
        this.skip(block, this.sourceOf(block.type));
        continue;
      }
      const path = inputBlock(block, "path") ?? inputBlock(block, "file") ?? inputBlock(block, "url");
      if (!path) continue;
      const item = { id: this.newId(), inputs: {} };
      const source = this.valueInput(fields.source, path, scope);
      if (source) item.inputs.source = source;
      const name = this.valueInput(fields.name, inputBlock(block, "name"), scope);
      if (name) item.inputs.name = name;
      files.push(item);
    }
    return files;
  }

  /** A text piece showing a value or some text. */
  textPiece(content) {
    const def = this.catalog.components.get("msg_text");
    return { id: this.newId(), type: def.id, inputs: content ? { content } : {} };
  }

  /* =====================================================================
     Building blocks for rules
     ===================================================================== */

  /** A value reference for some typed text. */
  textRef(text) {
    return { kind: "value", type: "text_value", inputs: { TEXT: { literal: String(text ?? "") } } };
  }

  /** "prefix" + value + "suffix" as one text value (or plain text when it's all typed). */
  joinText(parts) {
    const pieces = parts.filter((part) => part !== undefined && part !== null && part !== "");
    if (pieces.length === 1 && typeof pieces[0] !== "string") return pieces[0];
    if (pieces.every((part) => typeof part === "string" || part.literal !== undefined))
      return { literal: pieces.map((part) => (typeof part === "string" ? part : String(part.literal))).join("") };
    return {
      ref: {
        kind: "value",
        type: "text_join",
        inputs: {
          parts: {
            literal: pieces.map((part) => ({
              id: this.newId(),
              inputs: { part: typeof part === "string" ? { literal: part } : part },
            })),
          },
        },
      },
    };
  }

  /** An input value for a value block, read as text (for message text and the like). */
  textInput(block, scope) {
    return this.valueInput({ kind: "text", key: "text", accepts: ["String"], default: "" }, block, scope) ?? undefined;
  }

  /** Converts a list of block editor values into the `ADDn` items of a group. */
  groupFromAdds(block, scope, def, groupKey, fieldKey, used = new Set()) {
    const groupDef = def.inputs.find((i) => i.key === groupKey);
    const fieldDef = groupDef.fields.find((f) => f.key === fieldKey);
    const count = Number(extraState(block).itemCount ?? extraState(block).items ?? 0);
    const indexes = new Set();
    for (const name of Object.keys(block.inputs ?? {})) {
      const match = /^ADD(\d+)$/.exec(name);
      if (match) {
        indexes.add(Number(match[1]));
        used.add(name);
      }
    }
    const total = Math.max(count, indexes.size ? Math.max(...indexes) + 1 : 0);
    const items = [];
    for (let i = 0; i < total; i++) {
      const value = this.valueInput(fieldDef, inputBlock(block, `ADD${i}`), scope);
      items.push({ id: this.newId(), inputs: value ? { [fieldKey]: value } : {} });
    }
    return { literal: items };
  }

  /** Items of a group from blocks stacked in a statement input. */
  groupFromStack(blocks, scope, groupDef, ownerDef) {
    const items = [];
    for (const child of blocks) {
      if (this.sourceOf(child.type) !== "builtin") {
        this.skip(child, this.sourceOf(child.type));
        continue;
      }
      const item = { id: this.newId(), inputs: {} };
      const rule = BLOCK_RULES[child.type] ?? {};
      for (const fieldDef of groupDef.fields) {
        const value = this.inputFromBlock(ownerDef, fieldDef, child, scope, { rule });
        if (value !== null && value !== undefined) item.inputs[fieldDef.key] = value;
      }
      items.push(item);
    }
    return { literal: items };
  }
}

/**
 * Converts a block editor project.
 *
 * @param {object} args
 * @param {Array<{ name?: string, data: string|object }>} args.workspaces  every workspace
 * @param {object} args.catalog  the catalog, with the project's Workshop packs
 * @param {object} args.blocks   the Blockly adapter (see the top of this file)
 * @param {() => string} [args.newId]
 * @returns {{ builder: { commands, events, variables }, report: object }}
 */
export function convertBlockProject({ workspaces, catalog, blocks, newId, trace }) {
  return new BlockConverter(catalog, blocks, { newId, trace }).run(workspaces);
}

/** The block types a definition converts from: an element's blocks, or a pack step's own. */
function blockTypesOf(def) {
  const own = def.blocks ?? [];
  if (def.pack) return own;
  const related = blocksOfElement(def.id);
  return related.length ? [...new Set([...own, ...related])] : own;
}

/** The key of the value a provided-value block reads, when it belongs to `owner`. */
function exactKey(block, owner, provides) {
  const info = blockOf(block.type);
  if (info?.role !== "value" || !info.value || !owner) return null;
  const owners = [info.element?.id, ...(info.spec.also ?? [])];
  if (!owners.includes(owner)) return null;
  let key = info.value.key;
  if (info.value.pick) {
    const raw = block.fields?.[info.value.pick.field];
    key = info.value.pick.keys[raw] ?? raw;
  }
  return provides?.some((p) => p.key === key) ? key : null;
}
