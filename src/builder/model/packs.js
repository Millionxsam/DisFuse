/* =====================================================================
   DisFuse Builder: Workshop packs
   ---------------------------------------------------------------------
   A Workshop pack is built one of two ways, picked when it's made and
   never changed (`type` on the pack, "blocks" when missing):

     blocks    built as blocks in a Blockly workspace (the original kind;
               nothing here is about them)
     builder   built as events, steps and values defined in a form, each
               with the JavaScript it writes

   How it's built is all the kind decides: every pack works in every
   project. A block pack's blocks become steps in DisFuse Builder
   (catalog/blockPacks.js), and a builder pack's items become blocks in
   the block editor (Pages/Workspace/editor/builderPackBlocks.js).

   This file is the builder kind's data: its shape, the checks run before
   it's published, and which changes would break projects already using
   it. It is SHARED with the API (functions/builder/packs.js there is a
   copy), so it has no imports and runs in Node as well as the browser.
   catalog/packs.js turns a published pack into catalog definitions.

   SAVED SHAPE
   -----------
   The draft (the pack's `data`, as JSON) and each published version's
   `items` are the same object:

     PackItems = {
       setup: string,              // code put once at the top of the bot when
                                   // anything from the pack is used
       events:  PackEvent[],
       actions: PackAction[],      // "steps" to the people using them
       values:  PackValue[],
     }

     common  = { id, label, description, icon, group }
     PackValue  = common + { output: type | null, requires: context[], inputs: PackInput[], code }
     PackAction = common + { requires, inputs, branches: PackBranch[], code }
     PackBranch = { key, label, optional, provides: PackProvided[] }
     PackEvent  = common + {
       mode: "client" | "custom",
       listen, params: string[], once,    // mode "client": client.on(listen, ...)
       code,                              // mode "custom": the whole listener
       prelude,                           // code run first in the handler
       settings: PackInput[],             // filled in on the event's page
       values: PackProvided[],            // values only offered inside it
       provides: context[],               // what steps can do inside it
     }
     PackProvided = { key, label, type, code, description }
     PackInput  = { key, kind, label, help, placeholder, optional, default,
                    multiline (text), min / max (number),
                    options: [{ label, value }] (dropdown), accepts (slot) }

   CODE TEMPLATES
   --------------
   Every `code` is the JavaScript it writes, with placeholders:

     {{name}}        an input, as code: typed text comes out quoted, a
                     number as a number, a value placed there as its code
     {{raw:name}}    an input's literal exactly as typed or picked, unquoted
     {{steps:name}}  the steps inside a section (steps only)
     {{steps}}       the event's steps (an event's custom listener only)
     {{id}}          a short suffix unique to this step, for variable names
                     that mustn't clash (`const result{{id}} = ...`); a
                     section's values can use it to name what the step made
   ===================================================================== */

export const PACK_TYPES = {
  blocks: {
    label: "Build it with blocks",
    editor: "Block Editor",
    icon: "fa-solid fa-puzzle-piece",
    description: "Make custom blocks, in the Block Editor's pack workspace.",
  },
  builder: {
    label: "Build it with DisFuse Builder",
    editor: "DisFuse Builder",
    icon: "fa-solid fa-wand-magic-sparkles",
    description: "Make custom events, steps and values, with a form and the code each one writes.",
  },
};

/** Packs from before there were two kinds have no type: they're block packs. */
export function packType(pack) {
  return pack?.type === "builder" ? "builder" : "blocks";
}

export const PACK_LIMITS = {
  items: 100,
  inputs: 20,
  options: 50,
  branches: 6,
  provided: 30,
  label: 80,
  description: 400,
  help: 200,
  group: 40,
  icon: 60,
  code: 20000,
  setup: 50000,
  text: 2000,
  /** The draft, as JSON. */
  draftBytes: 1_000_000,
};

export const PACK_INPUT_KINDS = ["text", "number", "boolean", "dropdown", "colour", "slot", "code"];

/** Value types a pack can use (catalog/types.js has their names and icons). */
export const PACK_VALUE_TYPES = [
  "String", "Number", "Boolean", "Colour", "date", "Array", "object", "regexp", "buffer", "error",
  "user", "member", "server", "channel", "message", "role", "emoji", "sticker", "invite", "webhook",
  "attachment", "everyone", "permission", "permissionChannel", "channelType", "interaction", "modal",
];

/** Contexts a pack's steps can need, or its events provide (catalog/contexts.js). */
export const PACK_CONTEXTS = [
  "interaction", "repliable", "showModal", "chatInput", "contextMenu", "userContextMenu",
  "messageContextMenu", "component", "button", "selectMenu", "modalSubmit", "message",
];

const ITEM_ID = /^[a-z0-9]{6,16}$/;
const KEY = /^[A-Za-z_][A-Za-z0-9_]{0,39}$/;
const PARAM = /^[A-Za-z_$][\w$]{0,39}$/;
/** Names the placeholders use themselves. */
const RESERVED_KEYS = new Set(["id", "steps", "raw"]);

/** {{name}}, {{raw:name}}, {{steps:name}}, {{steps}}, {{id}} */
export const PLACEHOLDER = /\{\{\s*(?:(raw|steps)\s*:\s*)?([A-Za-z_$][\w$]*)\s*\}\}/g;

/** A new item id: lowercase letters and digits, so catalog ids stay valid. */
export function newPackItemId() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(10);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function emptyPackItems() {
  return { setup: "", events: [], actions: [], values: [] };
}

/* ---------------------------------------------------------------------
   Cleaning: whatever comes in, the right shape comes out
   --------------------------------------------------------------------- */

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value, max) => (typeof value === "string" ? value.slice(0, max) : "");
const list = (value, max) => (Array.isArray(value) ? value.slice(0, max) : []);
const type = (value) => (PACK_VALUE_TYPES.includes(value) ? value : null);
const contexts = (value) => [...new Set(list(value, PACK_CONTEXTS.length).filter((c) => PACK_CONTEXTS.includes(c)))];

function cleanInput(raw) {
  if (!isObject(raw)) return null;
  const kind = PACK_INPUT_KINDS.includes(raw.kind) ? raw.kind : "text";
  const input = {
    key: text(raw.key, 40),
    kind,
    label: text(raw.label, PACK_LIMITS.label),
    help: text(raw.help, PACK_LIMITS.help),
    placeholder: text(raw.placeholder, PACK_LIMITS.label),
    optional: raw.optional === true,
  };

  switch (kind) {
    case "text":
      input.default = text(raw.default, PACK_LIMITS.text);
      input.multiline = raw.multiline === true;
      break;
    case "code":
      input.default = text(raw.default, PACK_LIMITS.text);
      break;
    case "number": {
      const n = Number(raw.default);
      input.default = raw.default === "" || raw.default === null || raw.default === undefined || !Number.isFinite(n) ? null : n;
      for (const bound of ["min", "max"]) {
        const b = Number(raw[bound]);
        input[bound] = raw[bound] === "" || raw[bound] === null || raw[bound] === undefined || !Number.isFinite(b) ? null : b;
      }
      break;
    }
    case "boolean":
      input.default = raw.default === true;
      break;
    case "colour":
      input.default = /^#[0-9a-fA-F]{6}$/.test(raw.default ?? "") ? raw.default : "#5865F2";
      break;
    case "dropdown":
      input.options = list(raw.options, PACK_LIMITS.options)
        .filter(isObject)
        .map((option) => ({ label: text(option.label, PACK_LIMITS.label), value: text(option.value, PACK_LIMITS.label) }));
      input.default = text(raw.default, PACK_LIMITS.label);
      break;
    case "slot":
      input.accepts = type(raw.accepts);
      break;
    default:
      break;
  }
  return input;
}

function cleanProvided(raw) {
  if (!isObject(raw)) return null;
  return {
    key: text(raw.key, 40),
    label: text(raw.label, PACK_LIMITS.label),
    type: type(raw.type),
    code: text(raw.code, PACK_LIMITS.text),
    description: text(raw.description, PACK_LIMITS.help),
  };
}

function cleanCommon(raw) {
  return {
    id: ITEM_ID.test(raw.id ?? "") ? raw.id : newPackItemId(),
    label: text(raw.label, PACK_LIMITS.label),
    description: text(raw.description, PACK_LIMITS.description),
    icon: /^[a-z0-9 -]*$/.test(raw.icon ?? "") ? text(raw.icon, PACK_LIMITS.icon) : "",
    group: text(raw.group, PACK_LIMITS.group),
    /* Archived: still published, so projects using it keep working, but
       no longer offered in the pickers or the toolbox. */
    ...(raw.archived === true ? { archived: true } : {}),
  };
}

const inputs = (raw) => list(raw, PACK_LIMITS.inputs).map(cleanInput).filter(Boolean);
const provided = (raw) => list(raw, PACK_LIMITS.provided).map(cleanProvided).filter(Boolean);

function cleanValue(raw) {
  return {
    ...cleanCommon(raw),
    output: type(raw.output),
    requires: contexts(raw.requires),
    inputs: inputs(raw.inputs),
    code: text(raw.code, PACK_LIMITS.code),
  };
}

function cleanAction(raw) {
  return {
    ...cleanCommon(raw),
    requires: contexts(raw.requires),
    inputs: inputs(raw.inputs),
    branches: list(raw.branches, PACK_LIMITS.branches)
      .filter(isObject)
      .map((branch) => ({
        key: text(branch.key, 40),
        label: text(branch.label, PACK_LIMITS.label),
        optional: branch.optional === true,
        provides: provided(branch.provides),
      })),
    code: text(raw.code, PACK_LIMITS.code),
  };
}

function cleanEvent(raw) {
  return {
    ...cleanCommon(raw),
    mode: raw.mode === "custom" ? "custom" : "client",
    listen: text(raw.listen, 100).trim(),
    params: list(raw.params, 10).filter((p) => typeof p === "string").map((p) => p.trim().slice(0, 40)),
    once: raw.once === true,
    code: text(raw.code, PACK_LIMITS.code),
    prelude: text(raw.prelude, PACK_LIMITS.code),
    settings: inputs(raw.settings),
    values: provided(raw.values),
    provides: contexts(raw.provides),
  };
}

/**
 * The pack's items in exactly the saved shape. Anything unknown is
 * dropped, text is cut to its limit, and missing ids are made.
 */
export function cleanPackItems(raw) {
  const source = isObject(raw) ? raw : {};
  const items = (key, clean) => list(source[key], PACK_LIMITS.items).filter(isObject).map(clean);
  return {
    setup: text(source.setup, PACK_LIMITS.setup),
    events: items("events", cleanEvent),
    actions: items("actions", cleanAction),
    values: items("values", cleanValue),
  };
}

/** Every item, with its kind: [{ kind: "event"|"action"|"value", item }] */
export function allPackItems(items) {
  return [
    ...(items?.events ?? []).map((item) => ({ kind: "event", item })),
    ...(items?.actions ?? []).map((item) => ({ kind: "action", item })),
    ...(items?.values ?? []).map((item) => ({ kind: "value", item })),
  ];
}

export function countPackItems(items) {
  return (items?.events?.length ?? 0) + (items?.actions?.length ?? 0) + (items?.values?.length ?? 0);
}

/** How many items a pack offers: every item but the archived ones. */
export function countOfferedPackItems(items) {
  return allPackItems(items).filter(({ item }) => !item?.archived).length;
}

/* ---------------------------------------------------------------------
   Checking: what has to be fixed before it can be published
   --------------------------------------------------------------------- */

export const KIND_LABELS = { event: "event", action: "step", value: "value" };

/** The placeholders in a code template: [{ prefix: "" | "raw" | "steps", name }] */
export function placeholdersIn(code) {
  return [...String(code ?? "").matchAll(PLACEHOLDER)].map((m) => ({ prefix: m[1] ?? "", name: m[2] }));
}

function checkTemplate(code, allowed, push, where) {
  for (const { prefix, name } of placeholdersIn(code)) {
    const shown = `{{${prefix ? `${prefix}:` : ""}${name}}}`;
    if (prefix === "steps") {
      if (!allowed.branches?.has(name)) push(`${where} uses ${shown}, but there's no section called "${name}".`);
    } else if (prefix === "raw") {
      if (!allowed.inputs?.has(name)) push(`${where} uses ${shown}, but there's no input called "${name}".`);
    } else if (name === "id") {
      if (!allowed.id) push(`${where} can't use {{id}}.`);
    } else if (name === "steps") {
      if (!allowed.steps) push(`${where} can't use {{steps}}.`);
    } else if (!allowed.inputs?.has(name)) {
      push(`${where} uses ${shown}, but there's no input called "${name}".`);
    }
  }
}

function checkInputs(list, push, what = "Input") {
  const keys = new Set();
  list.forEach((input, index) => {
    const name = input.label || input.key || `${what} ${index + 1}`;
    if (!input.label.trim()) push(`${what} ${index + 1} needs a name.`);
    if (!KEY.test(input.key)) push(`"${name}" needs a code name: letters, numbers and _, not starting with a number.`);
    else if (RESERVED_KEYS.has(input.key)) push(`"${input.key}" can't be used as a code name.`);
    else if (keys.has(input.key)) push(`Two inputs are called "${input.key}".`);
    keys.add(input.key);
    if (input.kind === "dropdown") {
      if (!input.options?.length) push(`The dropdown "${name}" needs at least one choice.`);
      if (input.options?.some((o) => !o.label.trim())) push(`Every choice in "${name}" needs a label.`);
    }
  });
  return keys;
}

function checkProvided(list, push, where) {
  const keys = new Set();
  list.forEach((value, index) => {
    const name = value.label || `Value ${index + 1}`;
    if (!value.label.trim()) push(`${where}: value ${index + 1} needs a name.`);
    if (!KEY.test(value.key)) push(`${where}: "${name}" needs a code name.`);
    else if (keys.has(value.key)) push(`${where}: two values are called "${value.key}".`);
    keys.add(value.key);
    if (!value.code.trim()) push(`${where}: "${name}" needs code.`);
  });
}

/**
 * Problems that stop a pack being published, per item.
 *
 * @returns {Array<{ id: string|null, kind: string|null, label: string, message: string }>}
 */
export function packProblems(items) {
  const problems = [];
  const all = allPackItems(items);

  if (!all.length) problems.push({ id: null, kind: null, label: "Pack", message: "Add at least one event, step or value." });

  const labels = new Map();
  for (const { kind, item } of all) {
    const label = item.label.trim() || `Untitled ${KIND_LABELS[kind]}`;
    const push = (message) => problems.push({ id: item.id, kind, label, message });

    if (!item.label.trim()) push("Give it a name.");
    const sameName = `${kind}:${item.label.trim().toLowerCase()}`;
    if (item.label.trim() && labels.has(sameName)) push(`Another ${KIND_LABELS[kind]} is also called "${item.label.trim()}".`);
    labels.set(sameName, true);

    if (kind === "event") {
      const settingKeys = checkInputs(item.settings, push, "Setting");
      checkProvided(item.values, push, "Values");
      const params = item.params.filter(Boolean);
      for (const param of params) if (!PARAM.test(param)) push(`"${param}" isn't a valid parameter name.`);
      if (item.mode === "client") {
        if (!item.listen) push("Enter the name of the event to listen for.");
        else if (!/^[A-Za-z_$][\w$.:-]*$/.test(item.listen)) push("The event name can only use letters, numbers, _, $, :, - and dots.");
      } else {
        if (!item.code.trim()) push("Write the code that listens for the event.");
        else if (!placeholdersIn(item.code).some((p) => !p.prefix && p.name === "steps"))
          push("The listener code needs {{steps}} where the event's steps should run.");
        checkTemplate(item.code, { inputs: settingKeys, steps: true, id: true }, push, "The listener code");
      }
      checkTemplate(item.prelude, { inputs: settingKeys, id: true }, push, "The code that runs first");
      for (const value of item.values) checkTemplate(value.code, {}, push, `"${value.label || value.key}"`);
    } else {
      const inputKeys = checkInputs(item.inputs, push);
      if (!item.code.trim()) push(kind === "value" ? "Write the code that gives the value." : "Write the code the step runs.");

      let branchKeys = new Set();
      if (kind === "action") {
        item.branches.forEach((branch, index) => {
          const name = branch.label || branch.key || `Section ${index + 1}`;
          if (!branch.label.trim()) push(`Section ${index + 1} needs a name.`);
          if (!KEY.test(branch.key)) push(`The section "${name}" needs a code name.`);
          else if (branchKeys.has(branch.key)) push(`Two sections are called "${branch.key}".`);
          else if (inputKeys.has(branch.key)) push(`"${branch.key}" is the code name of an input and a section.`);
          branchKeys.add(branch.key);
          checkProvided(branch.provides, push, `Section "${name}"`);
          for (const value of branch.provides) checkTemplate(value.code, { id: true }, push, `"${value.label || value.key}"`);
        });
        for (const branch of item.branches)
          if (KEY.test(branch.key) && !placeholdersIn(item.code).some((p) => p.prefix === "steps" && p.name === branch.key))
            push(`The code doesn't use {{steps:${branch.key}}}, so the steps in "${branch.label || branch.key}" would never run.`);
      }
      checkTemplate(item.code, { inputs: inputKeys, branches: branchKeys, id: true }, push, "The code");
    }
  }

  return problems;
}

/* ---------------------------------------------------------------------
   Publishing: changes that would break projects using the pack
   --------------------------------------------------------------------- */

/** "1.2.3" → [1, 2, 3], or null. */
export function parseVersion(version) {
  const match = /^(\d{1,6})\.(\d{1,6})\.(\d{1,6})$/.exec(String(version ?? "").trim());
  return match ? match.slice(1).map(Number) : null;
}

/** Is version `a` higher than `b`? */
export function versionIsHigher(a, b) {
  const x = parseVersion(a);
  const y = parseVersion(b ?? "0.0.0") ?? [0, 0, 0];
  if (!x) return false;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

/**
 * What a new version would break for projects already using the last
 * one: anything people may have placed has to keep existing with the
 * same inputs, sections and type. Same idea, and same [name, problem]
 * shape, as the block pack check.
 *
 * @returns {Array<[string, string]>}
 */
export function breakingChanges(previous, next) {
  const errors = [];
  if (!previous) return errors;

  const byId = (items) => new Map(allPackItems(items).map(({ kind, item }) => [item.id, { kind, item }]));
  const after = byId(next);

  for (const { kind, item } of allPackItems(previous)) {
    const name = item.label || KIND_LABELS[kind];
    const now = after.get(item.id);
    if (!now) {
      errors.push([name, `This ${KIND_LABELS[kind]} was removed`]);
      continue;
    }
    if (now.kind !== kind) {
      errors.push([name, `This can't change from a ${KIND_LABELS[kind]} to a ${KIND_LABELS[now.kind]}`]);
      continue;
    }

    const keys = (list) => new Set((list ?? []).map((entry) => entry.key));
    const fields = kind === "event" ? "settings" : "inputs";
    const newInputs = keys(now.item[fields]);
    for (const input of item[fields] ?? []) if (!newInputs.has(input.key)) errors.push([name, `Input "${input.key}" was removed`]);

    if (kind === "value" && (item.output ?? null) !== (now.item.output ?? null)) errors.push([name, "The type of value it gives can't be changed"]);

    if (kind === "action") {
      const newBranches = new Map((now.item.branches ?? []).map((b) => [b.key, b]));
      for (const branch of item.branches ?? []) {
        const kept = newBranches.get(branch.key);
        if (!kept) errors.push([name, `Section "${branch.key}" was removed`]);
        else {
          const values = keys(kept.provides);
          for (const value of branch.provides ?? [])
            if (!values.has(value.key)) errors.push([name, `Value "${value.key}" in section "${branch.key}" was removed`]);
        }
      }
    }

    if (kind === "event") {
      const values = keys(now.item.values);
      for (const value of item.values ?? []) if (!values.has(value.key)) errors.push([name, `Value "${value.key}" was removed`]);
    }
  }

  return errors;
}

/**
 * The draft with everything breakingChanges() would complain about put
 * back from the last version: removed items, inputs, sections and values
 * come back, and a value's type goes back to what it was. What was
 * added or edited otherwise stays as it is.
 */
export function restoreBreaking(previous, next) {
  if (!previous) return next;
  const restored = structuredCloneSafe(next);
  const lists = { event: "events", action: "actions", value: "values" };
  const byId = new Map(allPackItems(restored).map(({ kind, item }) => [item.id, { kind, item }]));

  const putBack = (current, old) => {
    const keys = new Set((current ?? []).map((entry) => entry.key));
    return [...(current ?? []), ...(old ?? []).filter((entry) => !keys.has(entry.key))];
  };

  for (const { kind, item } of allPackItems(previous)) {
    const now = byId.get(item.id);
    if (!now || now.kind !== kind) {
      if (now) restored[lists[now.kind]] = restored[lists[now.kind]].filter((i) => i.id !== item.id);
      restored[lists[kind]].push(structuredCloneSafe(item));
      continue;
    }
    const current = now.item;
    if (kind === "event") {
      current.settings = putBack(current.settings, item.settings);
      current.values = putBack(current.values, item.values);
    } else current.inputs = putBack(current.inputs, item.inputs);
    if (kind === "value") current.output = item.output ?? null;
    if (kind === "action") {
      const branches = new Map((current.branches ?? []).map((b) => [b.key, b]));
      for (const branch of item.branches ?? []) {
        const kept = branches.get(branch.key);
        if (!kept) current.branches.push(structuredCloneSafe(branch));
        else kept.provides = putBack(kept.provides, branch.provides);
      }
    }
  }
  return restored;
}

function structuredCloneSafe(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}
