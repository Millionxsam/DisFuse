/* =====================================================================
   DisFuse elements: one definition, both editors
   ---------------------------------------------------------------------
   Every event, step, value and message/form piece is defined once here,
   and that one definition makes both the DisFuse Builder element and the
   block editor's block:

     createEvent      a trigger ("when a message is sent") and its hat block
     createAction     a step ("send a message") and its stacking block
     createValue      something that produces a value ("the bot's ping")
                      and its round block
     createComponent  a piece of a message or form, and its block
     createBlock      a block with no builder element (making slash
                      commands, retired blocks...)

   `group({ category, colour })` gives the same functions with a category
   (and block colour) filled in, so a module of related elements says it
   once.

   THE BUILDER SIDE
   ----------------
   label, description, category, icon, inputs, branches, output, code...
   exactly as the builder has always had them (see the docs on each
   function below). `code(ctx)` is the code for both editors: the block
   editor runs the same function with a ctx read from the block (see
   src/blocks/lib/registerElements.js).

   THE BLOCK SIDE
   --------------
   `block` describes the block. Leave it out (or `false`) for an element
   with no block; give an array for an element several blocks become
   (the first is the one made from the element):

     block: {
       type: "main_presence",               the block's type, never changed
       text: ["set the presence of the bot", "status: {status}", "AFK: {afk}"],
       colour: "#FF6E33",
       inline: true,                        setInputsInline (left unset when missing)
       parts: { status: { options: [["online", "online"], ...] } },
     }

   `text` is the block's look, one line per Blockly input. `{key}` puts
   the input, branch or part with that key there. A value or statement
   input ends the Blockly input it's in; whatever text and fields come
   before it are its label. A line with no value or statement input is a
   dummy input. `{"text"}` is a label written exactly (spaces kept).

   Each input becomes a part of the block by its kind: text, number,
   boolean, colour and slot inputs are value inputs (checked "String",
   "Number", "Boolean", "Colour" and the slot's types), dropdowns are
   dropdown fields, branches and group/message/modal inputs are
   statement inputs. `parts[key]` changes that, or adds a part the
   builder doesn't have:

     { part: "value", check }               a value input
     { part: "statement", check }           a statement input
     { part: "dummy" }                      a named dummy input
     { part: "dropdown", options }          [label, value] pairs
     { part: "checkbox", value: "TRUE" }
     { part: "text" | "multiline", value }  a text field
     { part: "number", value, min, max, precision }
     { part: "colour", value }
     { part: "variable", value }            a variable field
     { part: "label", text }                a named label
     { part: "image", src, width, height, alt }
     { part: "field", field: (Blockly) => new Field() }   anything else
     { part: "fixed", value }               not on the block: the block
                                            always means this value
     name:   the part's name on the block, when it isn't the key
     map:    { [blockValue]: builderValue } for a dropdown whose values
             differ (built-in blocks only; a DisFuse block's values are
             the element's)
     scale:  block value × scale = builder value (milliseconds on the
             block, seconds in the builder: 1 / 1000)
     shadow: the toolbox's shadow for this input is created by the block

   Everything else on `block` is optional: tooltip, helpUrl, style,
   output / previous / next (connection checks; `false` for none),
   body (an event's statement input: { name, check }), children (a
   component's statement input name), mutator (createMutatorBlock
   options), restrictions, init(block, Blockly) and
   mixin(Blockly) => ({ ...methods }) for anything Blockly-only, and
   code(ctx) when the block's code has to differ from the element's.
   `pings: true` gives a block that sends a message the "allowed pings"
   option (every block of an element with a message input has it;
   `pings: false` turns that off). Its code reads it with
   `ctx.allowedMentions()`. See src/blocks/lib/pings.js.
   `builtin: true` marks one of Blockly's own blocks: the element
   converts from and to it, but it isn't defined here.
   `fields: { NAME: value }` on a builtin block says which of its field
   values make it this element, when several elements share the block.

   A group input, or a repeat or optional branch, can be made of blocks
   of their own inside a statement input of the block (switch cases,
   object keys): `block: { type, text, ... }` on the group or branch
   describes that item block (a branch's item block names its own
   statement input with `body`). The parent places it with
   `parts: { [key]: { part: "item", input: "<statement input>" } }` when
   another key's statement input holds it.

   Values a step, input or event provides ("the created channel") take a
   `block` too, the round block that reads them. A branch or event can
   instead have one `valuesBlock` whose dropdown picks which of its
   values to read: `{ type, text, pick: "info" }`, where the dropdown's
   values are the values' keys (or `pick: { field, keys: { [option]: key } }`).
   `also: [elementId]` on either lists other elements that provide the
   same values, for a block that can go inside any of them.

   This module has no imports outside src and uses explicit `.js`
   extensions, so the check scripts can load it in Node. It never imports
   Blockly: the builder's bundle doesn't include it.
   ===================================================================== */

import { CATEGORY_BY_ID } from "../builder/catalog/categories.js";
import { ANY, typeList } from "../builder/catalog/types.js";

/* ---------------------------------------------------------------------
   Inputs
   --------------------------------------------------------------------- */

const INPUT_KINDS = new Set([
  "text",
  "number",
  "boolean",
  "dropdown",
  "multi",
  "colour",
  "slot",
  "code",
  "group",
  "message",
  "modal",
  "variable",
]);

/** Kinds whose box can be swapped for a value. Dropdowns never can. */
const VALUE_KINDS = new Set(["text", "number", "boolean", "colour", "slot"]);

function normaliseOptions(options = []) {
  return options.map((option) =>
    Array.isArray(option)
      ? { label: String(option[0]), value: String(option[1]) }
      : { label: String(option.label), value: String(option.value) },
  );
}

function makeInput(kind, key, label, extra = {}) {
  return { kind, key, label, ...extra };
}

/**
 * Input builders. Every one takes (key, label, options).
 *
 * Common options on any input:
 *   help         one line of help shown under the input
 *   placeholder  placeholder text for boxes
 *   optional     may be left empty (the code gets "null" / "" / default)
 *   showIf       { otherKey: value | value[] } — only shown (and only
 *                generated) when another input's literal matches, e.g.
 *                `showIf: { style: "Link" }`
 */
export const input = {
  /**
   * A text box by default; a value can replace it. Accepts text, and
   * anything with a sensible text form (numbers, members as mentions).
   * @param {object} [o] { default: "", multiline, placeholder, maxLength }
   */
  text: (key, label, o = {}) =>
    makeInput("text", key, label, {
      accepts: o.accepts ?? ["String"],
      default: o.default ?? "",
      ...o,
    }),

  /** A number box by default; a value can replace it. { default, min, max, step, integer, optional } */
  number: (key, label, o = {}) =>
    makeInput("number", key, label, {
      accepts: o.accepts ?? ["Number"],
      /* An optional number starts empty (a limit nobody set), not at 0. */
      default: o.default ?? (o.optional ? undefined : 0),
      ...o,
    }),

  /** A checkbox by default; a true/false value can replace it. { default } */
  boolean: (key, label, o = {}) =>
    makeInput("boolean", key, label, {
      accepts: o.accepts ?? ["Boolean"],
      default: o.default ?? false,
      ...o,
    }),

  /**
   * A fixed list of choices. Values can never go here (same rule as the
   * block editor's dropdown fields).
   * @param {Array<[label, value]|{label, value}>} options
   */
  dropdown: (key, label, options, o = {}) => {
    const normalised = normaliseOptions(options);
    return makeInput("dropdown", key, label, {
      options: normalised,
      default: o.default ?? normalised[0]?.value ?? "",
      ...o,
    });
  },

  /** Several choices from a fixed list. `ctx.raw(key)` is an array. */
  multi: (key, label, options, o = {}) =>
    makeInput("multi", key, label, {
      options: normaliseOptions(options),
      default: o.default ?? [],
      ...o,
    }),

  /** A color picker by default; a value can replace it. */
  colour: (key, label, o = {}) =>
    makeInput("colour", key, label, {
      accepts: o.accepts ?? ["Colour", "String"],
      default: o.default ?? "#5865F2",
      ...o,
    }),

  /**
   * A slot that only takes a value: a member, a channel, a list...
   * There is no box to type into.
   * @param {string|string[]|null} accepts the type(s) it takes; ANY for anything
   */
  slot: (key, label, accepts, o = {}) =>
    makeInput("slot", key, label, { accepts: typeList(accepts), ...o }),

  /**
   * Raw JavaScript typed by the user (the "run code" actions). The text
   * goes into the bot as-is. { default, language: "javascript" }
   */
  code: (key, label, o = {}) => makeInput("code", key, label, { default: o.default ?? "", ...o }),

  /**
   * A repeatable list of small forms: poll answers, menu options, object
   * keys. Each item has the given `fields` (any input kinds except group,
   * message and modal). `ctx.group(key)` gives one ctx per item.
   * { itemLabel: "Answer", minItems, maxItems }
   *
   * On a block, a group is a statement input holding one item block per
   * item (`block: { type, text, ... }` describes the item block, made
   * with the group's fields as its inputs), or Blockly's own "+" inputs
   * (`adds: "ADD"`: ADD0, ADD1... each holding one item's `fields[0]`).
   */
  group: (key, label, fields, o = {}) =>
    makeInput("group", key, label, { fields, default: [], ...o }),

  /**
   * The message builder: a full Components V2 message with a live
   * preview. `ctx.message(key)` gives the options object for send/reply.
   * { files: true } to allow attaching files.
   */
  message: (key, label, o = {}) => makeInput("message", key, label, { files: true, ...o }),

  /** The form (modal) builder. `ctx.modal(key)` gives a ModalBuilder expression. */
  modal: (key, label, o = {}) => makeInput("modal", key, label, { ...o }),

  /**
   * Which variable to use, for steps that change a variable ("Set
   * variable"). Shows a variable picker, not the value picker.
   * `ctx.input(key)` is the variable's name in the code, so it can be
   * assigned to: `${ctx.input("variable")} = ...`.
   */
  variable: (key, label, o = {}) => makeInput("variable", key, label, { ...o }),
};

/*
   Any value-taking input can also PROVIDE values that only exist inside
   it, for inputs that are evaluated once per item:

     input.boolean("method", "Keep items where", {
       provides: [{ key: "item", label: "Current item", type: ANY, code: "filterItem" }],
     })

   "Current item" is then offered only while filling in that input.
*/

/** Can a value be put into this input instead of its box? */
export function acceptsValues(inputDef) {
  if (inputDef.allowValues === false) return false;
  return VALUE_KINDS.has(inputDef.kind);
}

/* ---------------------------------------------------------------------
   Shared validation
   --------------------------------------------------------------------- */

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

function fail(def, message) {
  throw new Error(`[elements] ${def?.id ?? def?.type ?? "(no id)"}: ${message}`);
}

function checkCommon(def, what) {
  if (!def || typeof def !== "object") fail(def, `${what} must be an object`);
  if (!ID_PATTERN.test(def.id ?? ""))
    fail(def, "id must be lowercase letters, numbers and underscores, starting with a letter");
  if (!def.label) fail(def, "label is required");
}

function checkCategory(def) {
  if (!CATEGORY_BY_ID[def.category])
    fail(def, `unknown category "${def.category}" (see builder/catalog/categories.js)`);
}

function checkInputs(def, inputs = [], where = "inputs") {
  const seen = new Set();
  for (const item of inputs) {
    if (!item || !INPUT_KINDS.has(item.kind))
      fail(def, `${where}: "${item?.key}" has an unknown kind "${item?.kind}"`);
    if (!item.key) fail(def, `${where}: every input needs a key`);
    if (seen.has(item.key)) fail(def, `${where}: duplicate key "${item.key}"`);
    seen.add(item.key);
    if (!item.label) fail(def, `${where}: "${item.key}" needs a label`);
    if (item.provides) checkProvided(def, item.provides, `${where}.${item.key} provides`);
    if ((item.kind === "dropdown" || item.kind === "multi") && !item.options?.length)
      fail(def, `${where}: dropdown "${item.key}" has no options`);
    if (item.kind === "group") {
      for (const field of item.fields ?? [])
        if (["group", "message", "modal"].includes(field.kind))
          fail(def, `${where}: group "${item.key}" cannot contain ${field.kind} inputs`);
      checkInputs(def, item.fields, `${where}.${item.key}`);
    }
  }
}

function normaliseDependencies(deps = []) {
  return deps.map((dep) => (typeof dep === "string" ? { package: dep } : dep));
}

function normaliseSetup(setup) {
  if (!setup) return [];
  const list = Array.isArray(setup) ? setup : [setup];
  return list.map((item) => (typeof item === "string" ? { key: item, code: item } : item));
}

function checkProvided(def, provided = [], where) {
  for (const value of provided) {
    if (!value.key || !value.label || typeof value.code !== "string")
      fail(def, `${where}: every provided value needs key, label and code`);
    if (value.type === undefined)
      fail(def, `${where}: "${value.key}" needs a type (use ANY/null for anything)`);
  }
}

/* ---------------------------------------------------------------------
   Builder definitions
   ---------------------------------------------------------------------
   The builder's own objects, as the builder has always read them. The
   create* functions below make these and the blocks together; Workshop
   packs (builder/catalog/packs.js) make them on their own.
   --------------------------------------------------------------------- */

/**
 * A trigger.
 *
 * @param {object} def
 * @param {string} def.id
 * @param {string} def.label         "When a message is sent"
 * @param {string} def.description   one plain sentence
 * @param {string} def.category      see categories.js
 * @param {string} [def.group]
 * @param {string} [def.icon]        Font Awesome class
 * @param {string} [def.listen]      code for the event name, e.g.
 *                                   `Discord.Events.MessageCreate` or `"messagePinned"`
 * @param {string[]} [def.params]    listener parameter names, e.g. ["message"]
 * @param {boolean} [def.once]       `client.once` instead of `client.on`
 * @param {string[]} [def.provides]  contexts it provides (contexts.js)
 * @param {Array} [def.values]       values only available inside this event:
 *                                   { key, label, type, code, description?, block? }
 * @param {Array} [def.settings]     inputs shown on the event's page (not in
 *                                   the builder), e.g. a custom ID filter
 * @param {(ctx) => string} [def.prelude]  code run first in the handler,
 *                                   usually guards (`if (...) return;`)
 * @param {(ctx, body: string) => string} [def.wrap]  replaces the whole
 *                                   listener; for events that aren't a
 *                                   plain `client.on`
 * @param {Array} [def.dependencies] npm packages: "axios" or { package, code }
 * @param {string|Array} [def.setup] top-level code emitted once
 */
export function defineEvent(def) {
  checkCommon(def, "event");
  checkCategory(def);
  if (!def.wrap && !def.listen) fail(def, "needs `listen` (or `wrap`)");
  checkInputs(def, def.settings, "settings");
  checkProvided(def, def.values, "values");
  return {
    ...def,
    kind: "event",
    blocks: def.blocks ?? [],
    params: def.params ?? [],
    provides: def.provides ?? [],
    values: def.values ?? [],
    settings: def.settings ?? [],
    dependencies: normaliseDependencies(def.dependencies),
    setup: normaliseSetup(def.setup),
  };
}

/**
 * A step.
 *
 * @param {object} def
 * @param {string[]} [def.requires]  contexts it needs
 * @param {Array} [def.inputs]
 * @param {Array} [def.branches]     sections other actions go into:
 *   { key, label, description?,
 *     provides?: [{ key, label, type, code, block? }]  values usable inside it,
 *     contexts?: string[]                       contexts it adds inside it,
 *     optional?: true                           user turns it on (e.g. "otherwise"),
 *     inline?: true                             its steps run right there, not in a
 *                                               callback (if/else, loops). Only inline
 *                                               branches pass the "loop" context on, so
 *                                               "Stop repeating" can't end up in a callback
 *                                               where `break` wouldn't compile.
 *     repeat?: true, inputs?: [...], itemLabel  a list of sections, each with
 *                                               its own inputs (else-if, switch cases) }
 * @param {(ctx) => string} def.code  statement code
 * @param {string} [def.sentence]    short summary with {inputKey} placeholders,
 *                                   shown on a collapsed card
 * @param {string} [def.special]     "message" | "modal" | ... : a hint that the
 *                                   card needs the wide editor
 * @param {boolean} [def.terminal]   nothing after it runs (stop, return)
 * @param {"message"|"update"|"form"} [def.answers]  it's the first answer to an
 *                                    interaction, which can only happen once
 *                                    (see model/replies.js)
 * @param {boolean} [def.afterAnswer] it needs the interaction answered first
 *                                    (edit, delete, follow up)
 */
export function defineAction(def) {
  checkCommon(def, "action");
  checkCategory(def);
  if (typeof def.code !== "function") fail(def, "code(ctx) is required");
  checkInputs(def, def.inputs);
  const branchKeys = new Set();
  for (const branch of def.branches ?? []) {
    if (!branch.key || !branch.label) fail(def, "every branch needs key and label");
    if (branchKeys.has(branch.key)) fail(def, `duplicate branch "${branch.key}"`);
    branchKeys.add(branch.key);
    checkProvided(def, branch.provides, `branch ${branch.key}`);
    if (branch.repeat) checkInputs(def, branch.inputs, `branch ${branch.key}`);
  }
  return {
    ...def,
    kind: "action",
    blocks: def.blocks ?? [],
    requires: def.requires ?? [],
    inputs: def.inputs ?? [],
    branches: (def.branches ?? []).map((branch) => ({
      provides: [],
      contexts: [],
      inputs: [],
      ...branch,
    })),
    dependencies: normaliseDependencies(def.dependencies),
    setup: normaliseSetup(def.setup),
  };
}

/**
 * Something that produces a value.
 *
 * @param {object} def
 * @param {string|string[]|null} def.output  type(s) it produces; ANY for unknown
 * @param {string[]} [def.requires]
 * @param {Array} [def.inputs]
 * @param {(ctx) => string} def.code  an expression
 */
export function defineValue(def) {
  checkCommon(def, "value");
  checkCategory(def);
  if (typeof def.code !== "function") fail(def, "code(ctx) is required");
  if (def.output === undefined) fail(def, "output is required (use ANY/null for anything)");
  checkInputs(def, def.inputs);
  return {
    ...def,
    kind: "value",
    blocks: def.blocks ?? [],
    output: typeList(def.output),
    requires: def.requires ?? [],
    inputs: def.inputs ?? [],
    dependencies: normaliseDependencies(def.dependencies),
    setup: normaliseSetup(def.setup),
  };
}

/**
 * A piece of a message or of a form.
 *
 * @param {object} def
 * @param {"message"|"modal"} def.family   which builder it belongs to
 * @param {string[]} def.placement  where it can go. Message: "root",
 *   "container", "row", "gallery", "options". Form: "modal", "label".
 * @param {Array} [def.fields]      inputs edited in the component's panel
 * @param {object} [def.children]   { accepts: placement key, label, min, max }
 *   — what can go inside it (a container holds "container" pieces, a row
 *   holds "row" pieces, a select menu holds "options")
 * @param {(ctx) => string} def.code  a discord.js builder expression.
 *   `ctx.children()` is the list of child expressions.
 * @param {(p) => object} [def.preview]  the component as Discord's API
 *   would deliver it, for the live preview. `p.text(key)` / `p.raw(key)`
 *   give display values; `p.children()` the children's previews.
 * @param {number} [def.weight]  how many components it counts as (default 1)
 */
export function defineComponent(def) {
  checkCommon(def, "component");
  if (!["message", "modal"].includes(def.family)) fail(def, 'family must be "message" or "modal"');
  if (!Array.isArray(def.placement) || !def.placement.length) fail(def, "placement is required");
  if (typeof def.code !== "function") fail(def, "code(ctx) is required");
  checkInputs(def, def.fields, "fields");
  return {
    ...def,
    kind: "component",
    blocks: def.blocks ?? [],
    fields: def.fields ?? [],
    children: def.children ?? null,
    weight: def.weight ?? 1,
    dependencies: normaliseDependencies(def.dependencies),
    setup: normaliseSetup(def.setup),
  };
}

/* ---------------------------------------------------------------------
   Blocks
   --------------------------------------------------------------------- */

const SPEC_KEYS = new Set([
  "type",
  "text",
  "colour",
  "inline",
  "tooltip",
  "helpUrl",
  "style",
  "output",
  "previous",
  "next",
  "parts",
  "body",
  "children",
  "mutator",
  "restrictions",
  "init",
  "mixin",
  "code",
  "builtin",
  "fields",
  "pick",
  "also",
  "deletable",
  "movable",
  "editable",
  "pings",
]);

function blockList(block) {
  if (!block) return [];
  return Array.isArray(block) ? block : [block];
}

/**
 * The statement input that holds a component's children, when its block
 * doesn't name it with `children`: its one statement part. Without it,
 * `ctx.children()` reads no input and the component is built empty
 * (a container with no components, which Discord rejects).
 */
function childrenInput(raw, owner, role) {
  if (!owner?.children || (role !== "main" && role !== "variant")) return undefined;
  const statements = Object.entries(raw.parts ?? {}).filter(([, p]) => p.part === "statement");
  if (statements.length !== 1)
    fail(owner, `block ${raw.type}: name the input that holds the children with \`children\``);
  return statements[0][0];
}

/**
 * A block description, with what it belongs to filled in.
 * `role` is "main" (made from the element), "variant" (another block
 * that becomes the same element), "value" (reads a provided value) or
 * "item" (one item of a group input).
 */
function blockSpec(raw, owner, role, defaults, extra = {}) {
  if (!raw || typeof raw !== "object") fail(owner, "a block must be an object");
  if (!raw.type) fail(owner, "every block needs a type");
  for (const key of Object.keys(raw))
    if (!SPEC_KEYS.has(key)) fail(owner, `block ${raw.type}: unknown property "${key}"`);
  return {
    colour: defaults.colour,
    ...raw,
    children: raw.children ?? childrenInput(raw, owner, role),
    parts: raw.parts ?? {},
    text: raw.text === undefined ? [] : Array.isArray(raw.text) ? raw.text : [raw.text],
    role,
    ...extra,
  };
}

/** Provided values with a block: each gets `block` (its type) and a spec. */
function providedBlocks(list, owner, defaults, specs, where) {
  return (list ?? []).map((value) => {
    if (!value.block) return value;
    const raw = typeof value.block === "string" ? { type: value.block } : value.block;
    if (raw.builtin) return { ...value, block: raw.type };
    specs.push(
      blockSpec(raw, owner, "value", defaults, {
        value: { key: value.key, type: value.type, code: value.code, where },
      }),
    );
    return { ...value, block: raw.type };
  });
}

/**
 * A block that reads any one of `list`, picked by its dropdown:
 * `pick: "info"` (the dropdown's values are the values' keys) or
 * `pick: { field: "info", keys: { [dropdownValue]: key } }`.
 */
function valuesBlock(raw, list, owner, defaults, specs, where) {
  if (!raw) return undefined;
  const pick =
    typeof raw.pick === "string" ? { field: raw.pick, keys: {} } : { keys: {}, ...raw.pick };
  if (!pick.field) fail(owner, `valuesBlock ${raw.type} needs pick`);
  const { pick: _pick, ...spec } = raw;
  specs.push(blockSpec(spec, owner, "value", defaults, { value: { where, pick, list } }));
  return { type: raw.type, pick };
}

/** Group inputs whose items are blocks of their own. */
function groupBlocks(inputs, owner, defaults, specs) {
  return (inputs ?? []).map((item) => {
    if (item.kind !== "group" || !item.block?.type) return item;
    if (!item.block.builtin)
      specs.push(blockSpec(item.block, owner, "item", defaults, { group: item.key }));
    return {
      ...item,
      block: { ...item.block, mixin: undefined, init: undefined, code: undefined },
    };
  });
}

/**
 * Splits a definition into its builder part and its blocks.
 * `defaults` come from group().
 */
function element(kind, raw, defaults, defineBuilder) {
  const def = { category: defaults.category, ...raw };
  const { block, builder = true, ...rest } = def;
  const blocks = blockList(block);
  const specs = [];

  const main = blocks.map((spec, i) =>
    spec.builtin
      ? { ...spec, role: i ? "variant" : "main" }
      : blockSpec(spec, def, i ? "variant" : "main", defaults),
  );
  for (const spec of main) if (!spec.builtin) specs.push(spec);

  if (kind === "event") {
    rest.values = providedBlocks(rest.values, def, defaults, specs, { kind: "event" });
    rest.valuesBlock = valuesBlock(rest.valuesBlock, rest.values, def, defaults, specs, {
      kind: "event",
    });
  }
  if (rest.branches)
    rest.branches = rest.branches.map((branch) => {
      const where = { kind: "branch", branch: branch.key };
      const provides = providedBlocks(branch.provides, def, defaults, specs, where);
      if (branch.block && !branch.block.builtin)
        specs.push(blockSpec(branch.block, def, "item", defaults, { branch: branch.key }));
      return {
        ...branch,
        provides,
        valuesBlock: valuesBlock(branch.valuesBlock, provides, def, defaults, specs, where),
        ...(branch.block ? { block: { type: branch.block.type, body: branch.block.body } } : {}),
      };
    });
  const inputKey = kind === "component" ? "fields" : kind === "event" ? "settings" : "inputs";
  if (rest[inputKey]) {
    rest[inputKey] = groupBlocks(rest[inputKey], def, defaults, specs).map((item) =>
      item.provides
        ? {
            ...item,
            provides: providedBlocks(item.provides, def, defaults, specs, {
              kind: "input",
              input: item.key,
            }),
          }
        : item,
    );
  }

  const types = main.map((spec) => spec.type);
  const result = builder
    ? defineBuilder({ ...rest, blocks: types, block: types[0] ?? null })
    : { ...rest, kind, builder: false, blocks: types, block: types[0] ?? null };

  /* The blocks need the element as it ends up (inputs normalised), but
     shouldn't be enumerable: the builder copies definitions around. */
  for (const spec of specs) spec.element = result;
  Object.defineProperty(result, "blockly", { value: specs, enumerable: false });
  Object.defineProperty(result, "builtins", {
    value: main.filter((spec) => spec.builtin),
    enumerable: false,
  });
  return result;
}

/** An event and its hat block. See defineEvent for the builder side. */
export function createEvent(def, defaults = {}) {
  return element("event", def, defaults, defineEvent);
}

/** A step and its stacking block. See defineAction for the builder side. */
export function createAction(def, defaults = {}) {
  return element("action", def, defaults, defineAction);
}

/** A value and its round block. See defineValue for the builder side. */
export function createValue(def, defaults = {}) {
  return element("value", def, defaults, defineValue);
}

/** A message or form piece and its block. See defineComponent for the builder side. */
export function createComponent(def, defaults = {}) {
  return element("component", def, defaults, defineComponent);
}

/**
 * A block with no builder element: the "create slash commands" blocks,
 * retired blocks, and the like. Takes what a block takes (type, text,
 * parts...) plus `inputs`, `branches` and `code(ctx)` like an element,
 * and `output` / `previous` / `next` for its shape.
 *
 * `element: "id"` says which builder element it converts to, for a
 * block that isn't defined with that element.
 */
export function createBlock(def, defaults = {}) {
  const spec = {};
  const rest = {};
  for (const [key, value] of Object.entries(def)) (SPEC_KEYS.has(key) ? spec : rest)[key] = value;
  const kind =
    def.output !== undefined && def.output !== false
      ? "value"
      : def.previous !== undefined && def.previous !== false
        ? "action"
        : "block";
  const result = {
    id: def.type,
    kind: "block",
    shape: kind,
    builder: false,
    label: def.label ?? def.type,
    inputs: rest.inputs ?? [],
    branches: (rest.branches ?? []).map((branch) => ({
      provides: [],
      contexts: [],
      inputs: [],
      ...branch,
    })),
    code: def.code,
    element: rest.element ?? null,
    dependencies: normaliseDependencies(rest.dependencies),
    setup: normaliseSetup(rest.setup),
    blocks: [def.type],
    block: def.type,
  };
  const specs = [blockSpec({ ...spec, code: undefined }, result, "main", defaults)];
  for (const spec of specs) spec.element = result;
  Object.defineProperty(result, "blockly", { value: specs, enumerable: false });
  return result;
}

/**
 * The create* functions with defaults filled in: `category` for the
 * builder's pickers and `colour` for the blocks.
 *
 *   const { event, action, value, component, block } = group({ category: "bot", colour: "#FF6E33" });
 */
export function group(defaults) {
  return {
    event: (def) => createEvent(def, defaults),
    action: (def) => createAction(def, defaults),
    value: (def) => createValue(def, defaults),
    component: (def) => createComponent(def, defaults),
    block: (def) => createBlock(def, defaults),
  };
}

/**
 * The code for an event's listener, with its body: `client.on(...)` or
 * the event's own wrapper. Shared by the builder's generator and the
 * event's block.
 */
export function listenerCode(def, ctx, body) {
  const prelude = def.prelude ? String(def.prelude(ctx) ?? "") : "";
  if (def.wrap) return String(def.wrap(ctx, prelude + body));
  return `client.${def.once ? "once" : "on"}(${def.listen}, async (${def.params.join(", ")}) => {
${prelude}${prelude && !prelude.endsWith("\n") ? "\n" : ""}${body}});`;
}

export { ANY };
