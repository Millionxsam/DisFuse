/* =====================================================================
   DisFuse Builder: every change a builder project can go through
   ---------------------------------------------------------------------
   SHARED FILE. An identical copy lives in the API at
   functions/builder/ops.js. The page applies a change here first, so the
   screen updates at once, and sends the same change to the API, which
   applies it here again to the saved copy. Because both sides run the
   same code, they can't disagree about what a change does. Change both
   copies or neither.

   The saved shape (see ../README.md for the full description):

     builder {
       commands:  Command[]    slash commands and right-click commands
       events:    Event[]
       variables: Variable[]   { id, name }
     }

   Each operation takes the builder (already a private copy, see
   applyOp) and a payload, changes the builder in place, and returns
   something useful to the caller. Anything invalid throws an OpError
   whose message is written for the user.

   This file doesn't know the catalog: it checks the SHAPE of actions and
   values, and Discord's rules for commands, but not whether "send_message"
   is a real action. The page does that.

   Plain JavaScript; the only import is the other shared file.
   ===================================================================== */

import {
  LIMITS,
  CHANNEL_TYPES,
  VALUE_OPTION_TYPES,
  checkChoice,
  checkContextMenuName,
  checkDescription,
  checkEventLabel,
  checkName,
  checkVariableName,
  cleanLocalizations,
  cleanPermissions,
  isStructural,
} from "./rules.js";

export class OpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "OpError";
    this.status = status;
  }
}

const fail = (message, status) => {
  throw new OpError(message, status);
};

/* ---------------------------------------------------------------------
   Limits on the shape of saved data
   --------------------------------------------------------------------- */

export const SHAPE_LIMITS = {
  /** The whole builder, as JSON. The project document also holds logs. */
  maxBytes: 3_000_000,
  actionsPerFlow: 2000,
  depth: 30,
  valueDepth: 40,
  textLength: 20_000,
  keyLength: 64,
};

const ID_PATTERN = /^[A-Za-z0-9_-]{6,40}$/;
const TYPE_PATTERN = /^[a-z][a-z0-9_]{0,79}$/;
const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
const REF_KINDS = new Set(["value", "event", "branch", "variable", "option", "input"]);

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function checkId(id, what = "item") {
  if (typeof id !== "string" || !ID_PATTERN.test(id)) fail(`That ${what} has an invalid id.`);
}

/* ---------------------------------------------------------------------
   An empty project
   --------------------------------------------------------------------- */

export function emptyBuilder() {
  return { commands: [], events: [], variables: [] };
}

/** Fills in missing lists so every operation can rely on them. */
export function normaliseBuilder(builder) {
  const out = isObject(builder) ? builder : emptyBuilder();
  if (!Array.isArray(out.commands)) out.commands = [];
  if (!Array.isArray(out.events)) out.events = [];
  if (!Array.isArray(out.variables)) out.variables = [];
  return out;
}

/* ---------------------------------------------------------------------
   Walking options
   --------------------------------------------------------------------- */

/** Calls fn(option, parent, siblings, depth) for every option of a command. */
export function walkOptions(options, fn, parent = null, depth = 1) {
  for (const option of options ?? []) {
    fn(option, parent, options, depth);
    if (Array.isArray(option.options)) walkOptions(option.options, fn, option, depth + 1);
  }
}

/** @returns {{ option, parent, siblings, depth, path } | null} path is ancestors, outermost first */
export function findOption(command, optionId) {
  const search = (options, parent, depth, path) => {
    for (const option of options ?? []) {
      if (option.id === optionId) return { option, parent, siblings: options, depth, path };
      const found = search(option.options, option, depth + 1, [...path, option]);
      if (found) return found;
    }
    return null;
  };
  return search(command?.options, null, 1, []);
}

export function findCommand(builder, commandId) {
  return builder?.commands?.find((c) => c.id === commandId) ?? null;
}

/** Whether any command, option, event or variable already uses an id. */
function idTaken(builder, id) {
  if (builder.events.some((e) => e.id === id)) return true;
  if (builder.variables.some((v) => v.id === id)) return true;
  for (const command of builder.commands) {
    if (command.id === id) return true;
    let found = false;
    walkOptions(command.options, (option) => {
      if (option.id === id) found = true;
    });
    if (found) return true;
  }
  return false;
}

/* ---------------------------------------------------------------------
   Flows: the places actions live
   --------------------------------------------------------------------- */

/**
 * The thing whose `actions` a flow id points at.
 *
 *   a command's id       its actions (used while it has no subcommands)
 *   a subcommand's id    that subcommand's actions
 *   an event's id        that event's actions
 *
 * @returns {{ kind: "command"|"subcommand"|"event", owner, command?, option?, event? } | null}
 */
export function findFlow(builder, flowId) {
  const event = builder?.events?.find((e) => e.id === flowId);
  if (event) return { kind: "event", owner: event, event };

  for (const command of builder?.commands ?? []) {
    if (command.id === flowId) return { kind: "command", owner: command, command };
    const found = findOption(command, flowId);
    if (found?.option?.type === 1)
      return { kind: "subcommand", owner: found.option, command, option: found.option, path: found.path };
  }
  return null;
}

function requireFlow(builder, flowId) {
  const flow = findFlow(builder, flowId);
  if (!flow) fail("That command or event no longer exists.", 404);
  if (!Array.isArray(flow.owner.actions)) flow.owner.actions = [];
  return flow;
}

/* ---------------------------------------------------------------------
   Walking actions
   --------------------------------------------------------------------- */

/** A section of a repeat branch (an "otherwise if", a switch case). */
export function isRepeatItem(entry) {
  return isObject(entry) && Array.isArray(entry.actions) && !("type" in entry);
}

/**
 * Calls fn({ action, list, index, parent, branch, item, depth }) for
 * every action, outermost first. `parent` is the action whose branch
 * holds it; `item` the repeat section, if any.
 */
export function walkActions(actions, fn, parent = null, branch = null, item = null, depth = 1) {
  (actions ?? []).forEach((action, index) => {
    fn({ action, list: actions, index, parent, branch, item, depth });
    for (const [key, entries] of Object.entries(action?.branches ?? {})) {
      if (!Array.isArray(entries)) continue;
      if (entries.some(isRepeatItem))
        for (const section of entries) walkActions(section.actions, fn, action, key, section, depth + 1);
      else walkActions(entries, fn, action, key, null, depth + 1);
    }
  });
}

export function findAction(actions, actionId) {
  let found = null;
  walkActions(actions, (entry) => {
    if (!found && entry.action?.id === actionId) found = entry;
  });
  return found;
}

/** The chain of actions around an action, outermost first. */
export function ancestorsOf(actions, actionId) {
  const chain = [];
  const search = (list, trail) => {
    for (const action of list ?? []) {
      if (action.id === actionId) {
        chain.push(...trail);
        return true;
      }
      for (const [key, entries] of Object.entries(action.branches ?? {})) {
        if (!Array.isArray(entries)) continue;
        if (entries.some(isRepeatItem)) {
          for (const section of entries)
            if (search(section.actions, [...trail, { action, branch: key, item: section }])) return true;
        } else if (search(entries, [...trail, { action, branch: key, item: null }])) return true;
      }
    }
    return false;
  };
  search(actions, []);
  return chain;
}

function countActions(actions) {
  let count = 0;
  let deepest = 0;
  walkActions(actions, ({ depth }) => {
    count += 1;
    deepest = Math.max(deepest, depth);
  });
  return { count, deepest };
}

function collectActionIds(actions, into = new Set()) {
  walkActions(actions, ({ action }) => into.add(action.id));
  return into;
}

/**
 * The list a location points at.
 *
 *   { parentId: null }                         the flow's own list
 *   { parentId, branch }                       a branch of an action
 *   { parentId, branch, itemId }               one section of a repeat branch
 */
function listAt(rootActions, location = {}) {
  const { parentId = null, branch = null, itemId = null } = location;
  if (!parentId) return rootActions;

  const parent = findAction(rootActions, parentId)?.action;
  if (!parent) fail("The step you're adding to no longer exists.", 404);
  if (typeof branch !== "string" || !KEY_PATTERN.test(branch)) fail("That section doesn't exist.");

  if (!isObject(parent.branches)) parent.branches = {};
  const entries = parent.branches[branch];

  if (itemId) {
    const section = Array.isArray(entries) ? entries.find((e) => isRepeatItem(e) && e.id === itemId) : null;
    if (!section) fail("That section no longer exists.", 404);
    return section.actions;
  }

  if (Array.isArray(entries) && entries.some(isRepeatItem)) fail("Pick which section to add the step to.");
  if (!Array.isArray(entries)) parent.branches[branch] = [];
  return parent.branches[branch];
}

function clampIndex(index, length) {
  const n = Number.isInteger(index) ? index : length;
  return Math.max(0, Math.min(n, length));
}

/* ---------------------------------------------------------------------
   Checking saved shapes
   --------------------------------------------------------------------- */

function checkText(value) {
  if (typeof value === "string" && value.length > SHAPE_LIMITS.textLength)
    fail(`Text can be up to ${SHAPE_LIMITS.textLength.toLocaleString("en-US")} characters long.`);
}

/** Literals can be plain values or the structured data of groups, messages and forms. */
function checkLiteral(value, depth) {
  if (depth > SHAPE_LIMITS.valueDepth) fail("That's nested too deeply.");
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("That number isn't valid.");
    return;
  }
  if (typeof value === "string") return checkText(value);
  if (Array.isArray(value)) {
    if (value.length > 500) fail("That list is too long.");
    for (const entry of value) checkLiteral(entry, depth + 1);
    return;
  }
  if (isObject(value)) {
    const keys = Object.keys(value);
    if (keys.length > 200) fail("That has too many parts.");
    for (const key of keys) {
      if (key.length > SHAPE_LIMITS.keyLength || key.startsWith("$")) fail("That has an invalid field.");
      /* Inputs nested inside structured literals (message pieces, group
         items) are input values and are checked as such. */
      if (key === "inputs" && isObject(value[key])) checkInputs(value[key], depth + 1);
      else checkLiteral(value[key], depth + 1);
    }
    return;
  }
  fail("That value can't be saved.");
}

export function checkInputValue(inputValue, depth = 0) {
  if (depth > SHAPE_LIMITS.valueDepth) fail("That's nested too deeply.");
  if (!isObject(inputValue)) fail("That input has an invalid value.");

  const hasLiteral = Object.prototype.hasOwnProperty.call(inputValue, "literal");
  const hasRef = Object.prototype.hasOwnProperty.call(inputValue, "ref");
  if (hasLiteral === hasRef) fail("That input has an invalid value.");

  if (hasLiteral) return checkLiteral(inputValue.literal, depth + 1);

  const ref = inputValue.ref;
  if (!isObject(ref) || !REF_KINDS.has(ref.kind)) fail("That value can't be used.");

  switch (ref.kind) {
    case "value":
      if (typeof ref.type !== "string" || !TYPE_PATTERN.test(ref.type)) fail("That value can't be used.");
      if (ref.inputs !== undefined) checkInputs(ref.inputs, depth + 1);
      break;
    case "event":
      if (typeof ref.key !== "string" || !KEY_PATTERN.test(ref.key)) fail("That value can't be used.");
      break;
    case "branch":
      checkId(ref.action, "step");
      if (!KEY_PATTERN.test(String(ref.branch ?? "")) || !KEY_PATTERN.test(String(ref.key ?? "")))
        fail("That value can't be used.");
      break;
    case "variable":
      checkId(ref.id, "variable");
      break;
    case "option":
      checkId(ref.id, "option");
      if (ref.as !== undefined && ref.as !== "member") fail("That value can't be used.");
      break;
    case "input":
      if (!TYPE_PATTERN.test(String(ref.source ?? "")) || !KEY_PATTERN.test(String(ref.input ?? "")) || !KEY_PATTERN.test(String(ref.key ?? "")))
        fail("That value can't be used.");
      break;
    default:
  }
}

export function checkInputs(inputs, depth = 0) {
  if (!isObject(inputs)) fail("Those inputs are invalid.");
  const keys = Object.keys(inputs);
  if (keys.length > 100) fail("That step has too many inputs.");
  for (const key of keys) {
    if (!KEY_PATTERN.test(key)) fail("That step has an invalid input.");
    checkInputValue(inputs[key], depth);
  }
}

/** Checks an action and everything inside it. Fills in missing fields. */
export function checkAction(action, depth = 1) {
  if (depth > SHAPE_LIMITS.depth) fail(`Steps can only be nested ${SHAPE_LIMITS.depth} levels deep.`);
  if (!isObject(action)) fail("That step is invalid.");
  checkId(action.id, "step");
  if (typeof action.type !== "string" || !TYPE_PATTERN.test(action.type)) fail("That step is invalid.");

  if (action.inputs === undefined) action.inputs = {};
  checkInputs(action.inputs);

  if (action.disabled !== undefined && typeof action.disabled !== "boolean") fail("That step is invalid.");

  if (action.branches === undefined) action.branches = {};
  if (!isObject(action.branches)) fail("That step is invalid.");

  for (const [key, entries] of Object.entries(action.branches)) {
    if (!KEY_PATTERN.test(key) || !Array.isArray(entries)) fail("That step has an invalid section.");
    const repeat = entries.some(isRepeatItem);
    for (const entry of entries) {
      if (repeat) {
        if (!isRepeatItem(entry)) fail("That step has an invalid section.");
        checkId(entry.id, "section");
        if (entry.inputs === undefined) entry.inputs = {};
        checkInputs(entry.inputs);
        for (const inner of entry.actions) checkAction(inner, depth + 1);
      } else checkAction(entry, depth + 1);
    }
  }

  const allowed = new Set(["id", "type", "inputs", "branches", "disabled"]);
  for (const key of Object.keys(action)) if (!allowed.has(key)) delete action[key];
  return action;
}

function checkFlowSize(actions) {
  const { count, deepest } = countActions(actions);
  if (count > SHAPE_LIMITS.actionsPerFlow)
    fail(`A command or event can have up to ${SHAPE_LIMITS.actionsPerFlow} steps.`);
  if (deepest > SHAPE_LIMITS.depth) fail(`Steps can only be nested ${SHAPE_LIMITS.depth} levels deep.`);
}

function checkUniqueIds(actions) {
  const seen = new Set();
  walkActions(actions, ({ action }) => {
    if (seen.has(action.id)) fail("Two steps share the same id.");
    seen.add(action.id);
  });
}

/* ---------------------------------------------------------------------
   Removing references when the thing they point at goes away
   --------------------------------------------------------------------- */

/**
 * Removes every input value, anywhere under `inputs`, whose reference
 * matches. The input falls back to its default. Returns how many went.
 */
function stripFromInputs(inputs, matches) {
  let removed = 0;
  if (!isObject(inputs)) return 0;

  for (const key of Object.keys(inputs)) {
    const value = inputs[key];
    if (!isObject(value)) continue;

    if (value.ref) {
      if (matches(value.ref)) {
        delete inputs[key];
        removed += 1;
      } else if (value.ref.inputs) removed += stripFromInputs(value.ref.inputs, matches);
    } else if (Object.prototype.hasOwnProperty.call(value, "literal")) {
      removed += stripFromLiteral(value.literal, matches);
    }
  }
  return removed;
}

function stripFromLiteral(literal, matches) {
  let removed = 0;
  if (Array.isArray(literal)) for (const entry of literal) removed += stripFromLiteral(entry, matches);
  else if (isObject(literal))
    for (const [key, value] of Object.entries(literal)) {
      if (key === "inputs" && isObject(value)) removed += stripFromInputs(value, matches);
      else removed += stripFromLiteral(value, matches);
    }
  return removed;
}

function stripFromActions(actions, matches) {
  let removed = 0;
  walkActions(actions, ({ action, item }) => {
    removed += stripFromInputs(action.inputs, matches);
    if (item) removed += stripFromInputs(item.inputs, matches);
  });
  /* Repeat sections are visited once per action inside them, and not at
     all when empty; cover them directly. */
  walkActions(actions, ({ action }) => {
    for (const entries of Object.values(action.branches ?? {}))
      for (const entry of entries ?? []) if (isRepeatItem(entry)) removed += stripFromInputs(entry.inputs, matches);
  });
  return removed;
}

/** Every list of actions in the project. */
function everyFlow(builder) {
  const flows = [];
  for (const event of builder.events) flows.push(event);
  for (const command of builder.commands) {
    flows.push(command);
    walkOptions(command.options, (option) => {
      if (option.type === 1) flows.push(option);
    });
  }
  return flows;
}

/* ---------------------------------------------------------------------
   Commands
   --------------------------------------------------------------------- */

const COMMAND_KINDS = {
  slash: { limit: LIMITS.slashCommands, label: "slash commands" },
  user: { limit: LIMITS.userCommands, label: "user right-click commands" },
  message: { limit: LIMITS.messageCommands, label: "message right-click commands" },
};

function checkCommandName(kind, name) {
  return kind === "slash" ? checkName(name) : checkContextMenuName(name);
}

function nameTaken(list, name, exceptId) {
  const wanted = String(name).toLowerCase();
  return list.some((entry) => entry.id !== exceptId && String(entry.name).toLowerCase() === wanted);
}

function cleanContexts(contexts, integrationTypes) {
  const allowed = ["Guild", "BotDM", "PrivateChannel"];
  let list = [...new Set((Array.isArray(contexts) ? contexts : []).map(String))].filter((c) => allowed.includes(c));
  /* Other people's DMs and group chats only exist for bots people add to
     their own account. */
  if (!integrationTypes.includes("UserInstall")) list = list.filter((c) => c !== "PrivateChannel");
  if (!list.length) fail("Pick at least one place the command can be used.");
  return list;
}

function cleanIntegrationTypes(types) {
  const allowed = ["GuildInstall", "UserInstall"];
  const list = [...new Set((Array.isArray(types) ? types : []).map(String))].filter((t) => allowed.includes(t));
  if (!list.length) fail("Pick at least one way the command can be installed.");
  return list;
}

function createCommand(builder, { command }) {
  if (!isObject(command)) fail("That command is invalid.");
  const kind = command.kind ?? "slash";
  const rules = COMMAND_KINDS[kind];
  if (!rules) fail("That kind of command doesn't exist.");

  checkId(command.id, "command");
  if (idTaken(builder, command.id)) fail("That id is already used.");

  const sameKind = builder.commands.filter((c) => (c.kind ?? "slash") === kind);
  if (sameKind.length >= rules.limit) fail(`Discord allows up to ${rules.limit} ${rules.label} per bot.`);

  const name = String(command.name ?? "");
  const nameError = checkCommandName(kind, name);
  if (nameError) fail(nameError);
  if (nameTaken(sameKind, name)) fail(`You already have a command called ${kind === "slash" ? "/" : ""}${name}.`);

  const created = {
    id: command.id,
    kind,
    name,
    nsfw: false,
    defaultMemberPermissions: [],
    contexts: ["Guild", "BotDM"],
    integrationTypes: ["GuildInstall"],
    nameLocalizations: {},
    actions: [],
    created: typeof command.created === "string" ? command.created.slice(0, 40) : new Date().toISOString(),
  };

  if (kind === "slash") {
    const description = String(command.description ?? "");
    const descriptionError = checkDescription(description);
    if (descriptionError) fail(descriptionError);
    created.description = description;
    created.descriptionLocalizations = {};
    created.options = [];
  }

  builder.commands.push(created);
  return created;
}

function updateCommand(builder, { commandId, patch }) {
  const command = findCommand(builder, commandId);
  if (!command) fail("That command no longer exists.", 404);
  if (!isObject(patch)) fail("Nothing to change.");
  const kind = command.kind ?? "slash";

  if (patch.name !== undefined) {
    const name = String(patch.name);
    const error = checkCommandName(kind, name);
    if (error) fail(error);
    const sameKind = builder.commands.filter((c) => (c.kind ?? "slash") === kind);
    if (nameTaken(sameKind, name, command.id)) fail(`You already have a command called ${kind === "slash" ? "/" : ""}${name}.`);
    command.name = name;
  }

  if (patch.description !== undefined) {
    if (kind !== "slash") fail("Right-click commands don't have descriptions.");
    const error = checkDescription(patch.description);
    if (error) fail(error);
    command.description = String(patch.description);
  }

  if (patch.nsfw !== undefined) command.nsfw = patch.nsfw === true;

  if (patch.defaultMemberPermissions !== undefined)
    command.defaultMemberPermissions = cleanPermissions(patch.defaultMemberPermissions);

  if (patch.integrationTypes !== undefined) command.integrationTypes = cleanIntegrationTypes(patch.integrationTypes);

  if (patch.contexts !== undefined || patch.integrationTypes !== undefined)
    command.contexts = cleanContexts(patch.contexts ?? command.contexts, command.integrationTypes ?? ["GuildInstall"]);

  if (patch.nameLocalizations !== undefined)
    command.nameLocalizations = cleanLocalizations(patch.nameLocalizations, LIMITS.nameLength);

  if (patch.descriptionLocalizations !== undefined) {
    if (kind !== "slash") fail("Right-click commands don't have descriptions.");
    command.descriptionLocalizations = cleanLocalizations(patch.descriptionLocalizations, LIMITS.descriptionLength);
  }

  if (kind === "slash" && patch.nameLocalizations !== undefined)
    for (const [locale, text] of Object.entries(command.nameLocalizations))
      if (checkName(text)) fail(`The ${locale} name: ${checkName(text)}`);

  return command;
}

function deleteCommand(builder, { commandId }) {
  const index = builder.commands.findIndex((c) => c.id === commandId);
  if (index === -1) fail("That command no longer exists.", 404);
  const [removed] = builder.commands.splice(index, 1);
  return removed;
}

/* ---------------------------------------------------------------------
   Options
   --------------------------------------------------------------------- */

const OPTION_FIELDS_BY_TYPE = {
  choices: [3, 4, 10],
  autocomplete: [3, 4, 10],
  channelTypes: [7],
  minValue: [4, 10],
  maxValue: [4, 10],
  minLength: [3],
  maxLength: [3],
};

function optionDefaults(option) {
  const base = {
    id: option.id,
    type: option.type,
    name: option.name,
    description: option.description,
    nameLocalizations: {},
    descriptionLocalizations: {},
  };
  if (option.type === 1) return { ...base, options: [], actions: [] };
  if (option.type === 2) return { ...base, options: [] };
  return {
    ...base,
    required: false,
    choices: [],
    channelTypes: [],
    minValue: null,
    maxValue: null,
    minLength: null,
    maxLength: null,
    autocomplete: false,
    suggestions: [],
  };
}

/** What may sit next to `type` among `siblings`, and inside `parent`. */
function checkPlacement(command, parent, siblings, type, exceptId) {
  const others = siblings.filter((o) => o.id !== exceptId);

  if (!parent) {
    if (isStructural({ type }) && others.some((o) => !isStructural(o)))
      fail("A command can't mix subcommands with other options. Remove the other options first, or move them into a subcommand.");
    if (!isStructural({ type }) && others.some(isStructural))
      fail("This command has subcommands, so options go inside a subcommand instead.");
    return;
  }

  if (parent.type === 2 && type !== 1) fail("Subcommand groups can only hold subcommands.");
  if (parent.type === 1 && isStructural({ type })) fail("Subcommands can't have their own subcommands.");
  if (parent.type !== 1 && parent.type !== 2) fail("Only subcommands and groups can hold options.");
}

function checkBound(value, { integer = false, min = -(2 ** 53), max = 2 ** 53 } = {}) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) fail("That limit must be a number.");
  if (integer && !Number.isInteger(n)) fail("That limit must be a whole number.");
  if (n < min || n > max) fail(`That limit must be between ${min} and ${max}.`);
  return n;
}

function cleanChoices(type, list, limit, what) {
  if (!Array.isArray(list)) fail(`Those ${what} are invalid.`);
  if (list.length > limit) fail(`An option can have up to ${limit} ${what}.`);
  return list.map((choice) => {
    if (!isObject(choice)) fail(`Those ${what} are invalid.`);
    checkId(choice.id, what);
    const error = checkChoice(type, choice);
    if (error) fail(error);
    const out = {
      id: choice.id,
      name: String(choice.name),
      value: type === 3 ? String(choice.value) : Number(choice.value),
    };
    const names = cleanLocalizations(choice.nameLocalizations, LIMITS.choiceNameLength);
    if (Object.keys(names).length) out.nameLocalizations = names;
    return out;
  });
}

function createOption(builder, { commandId, parentId = null, option }) {
  const command = findCommand(builder, commandId);
  if (!command) fail("That command no longer exists.", 404);
  if ((command.kind ?? "slash") !== "slash") fail("Right-click commands can't have options.");
  if (!isObject(option)) fail("That option is invalid.");

  checkId(option.id, "option");
  if (idTaken(builder, option.id)) fail("That id is already used.");

  const type = Number(option.type);
  if (![1, 2, ...VALUE_OPTION_TYPES].includes(type)) fail("That kind of option doesn't exist.");

  let parent = null;
  if (!Array.isArray(command.options)) command.options = [];
  let siblings = command.options;

  if (parentId) {
    const found = findOption(command, parentId);
    if (!found) fail("The subcommand you're adding to no longer exists.", 404);
    parent = found.option;
    if (!Array.isArray(parent.options)) parent.options = [];
    siblings = parent.options;
  }

  checkPlacement(command, parent, siblings, type);
  if (siblings.length >= LIMITS.optionsPerLevel) fail(`Discord allows up to ${LIMITS.optionsPerLevel} options here.`);

  const name = String(option.name ?? "");
  const nameError = checkName(name);
  if (nameError) fail(nameError);
  if (nameTaken(siblings, name)) fail(`There's already an option called ${name} here.`);

  const description = String(option.description ?? "");
  const descriptionError = checkDescription(description);
  if (descriptionError) fail(descriptionError);

  const created = optionDefaults({ id: option.id, type, name, description });
  siblings.push(created);
  return created;
}

function updateOption(builder, { commandId, optionId, patch }) {
  const command = findCommand(builder, commandId);
  if (!command) fail("That command no longer exists.", 404);
  const found = findOption(command, optionId);
  if (!found) fail("That option no longer exists.", 404);
  if (!isObject(patch)) fail("Nothing to change.");

  const option = found.option;

  if (patch.name !== undefined) {
    const name = String(patch.name);
    const error = checkName(name);
    if (error) fail(error);
    if (nameTaken(found.siblings, name, option.id)) fail(`There's already an option called ${name} here.`);
    option.name = name;
  }

  if (patch.description !== undefined) {
    const error = checkDescription(patch.description);
    if (error) fail(error);
    option.description = String(patch.description);
  }

  if (patch.nameLocalizations !== undefined) {
    option.nameLocalizations = cleanLocalizations(patch.nameLocalizations, LIMITS.nameLength);
    for (const [locale, text] of Object.entries(option.nameLocalizations))
      if (checkName(text)) fail(`The ${locale} name: ${checkName(text)}`);
  }
  if (patch.descriptionLocalizations !== undefined)
    option.descriptionLocalizations = cleanLocalizations(patch.descriptionLocalizations, LIMITS.descriptionLength);

  if (isStructural(option)) {
    for (const key of ["type", "required", "choices", "channelTypes", "minValue", "maxValue", "minLength", "maxLength", "autocomplete", "suggestions"])
      if (patch[key] !== undefined) fail("Subcommands and groups don't have that setting.");
    return option;
  }

  if (patch.type !== undefined) {
    const type = Number(patch.type);
    if (!VALUE_OPTION_TYPES.includes(type)) fail("An option can't be turned into a subcommand. Delete it and add a subcommand instead.");
    if (type !== option.type) {
      option.type = type;
      /* Settings that only made sense for the old type go. */
      for (const [field, types] of Object.entries(OPTION_FIELDS_BY_TYPE))
        if (!types.includes(type)) {
          if (field === "choices") option.choices = [];
          else if (field === "autocomplete") {
            option.autocomplete = false;
            option.suggestions = [];
          } else if (field === "channelTypes") option.channelTypes = [];
          else option[field] = null;
        }
      /* Choice values are typed; text choices don't survive becoming numbers. */
      if (option.choices?.length) option.choices = [];
      if (option.suggestions?.length) option.suggestions = [];
    }
  }

  const type = option.type;
  const allowedHere = (field) => OPTION_FIELDS_BY_TYPE[field]?.includes(type);

  if (patch.required !== undefined) option.required = patch.required === true;

  if (patch.choices !== undefined) {
    if (!allowedHere("choices")) fail("Only text and number options can have preset choices.");
    option.choices = cleanChoices(type, patch.choices, LIMITS.choices, "choices");
  }

  if (patch.autocomplete !== undefined) {
    if (!allowedHere("autocomplete") && patch.autocomplete) fail("Only text and number options can have suggestions.");
    option.autocomplete = patch.autocomplete === true;
  }

  if (patch.suggestions !== undefined) {
    if (!allowedHere("autocomplete")) fail("Only text and number options can have suggestions.");
    option.suggestions = cleanChoices(type, patch.suggestions, LIMITS.suggestions, "suggestions");
  }

  if (patch.channelTypes !== undefined) {
    if (!allowedHere("channelTypes")) fail("Only channel options can be limited to channel types.");
    const known = CHANNEL_TYPES.map((c) => c.value);
    option.channelTypes = [...new Set((Array.isArray(patch.channelTypes) ? patch.channelTypes : []).map(Number))].filter((t) => known.includes(t));
  }

  for (const field of ["minValue", "maxValue"])
    if (patch[field] !== undefined) {
      if (!allowedHere(field)) fail("Only number options have a smallest and largest value.");
      option[field] = checkBound(patch[field], { integer: type === 4 });
    }

  for (const field of ["minLength", "maxLength"])
    if (patch[field] !== undefined) {
      if (!allowedHere(field)) fail("Only text options have a length limit.");
      option[field] = checkBound(patch[field], {
        integer: true,
        min: field === "minLength" ? LIMITS.minLength : 1,
        max: LIMITS.maxLength,
      });
    }

  if (option.minValue !== null && option.maxValue !== null && option.minValue > option.maxValue)
    fail("The smallest value can't be bigger than the largest value.");
  if (option.minLength !== null && option.maxLength !== null && option.minLength > option.maxLength)
    fail("The shortest length can't be longer than the longest length.");

  return option;
}

function deleteOption(builder, { commandId, optionId }) {
  const command = findCommand(builder, commandId);
  if (!command) fail("That command no longer exists.", 404);
  const found = findOption(command, optionId);
  if (!found) fail("That option no longer exists.", 404);

  const removedIds = new Set([found.option.id]);
  walkOptions(found.option.options, (option) => removedIds.add(option.id));

  found.siblings.splice(found.siblings.indexOf(found.option), 1);

  /* Steps that read a deleted option fall back to their default. */
  const flows = [command];
  walkOptions(command.options, (option) => {
    if (option.type === 1) flows.push(option);
  });
  for (const flow of flows)
    stripFromActions(flow.actions, (ref) => ref.kind === "option" && removedIds.has(ref.id));

  return found.option;
}

function reorderOptions(builder, { commandId, parentId = null, order }) {
  const command = findCommand(builder, commandId);
  if (!command) fail("That command no longer exists.", 404);
  let siblings = command.options ?? [];
  if (parentId) {
    const found = findOption(command, parentId);
    if (!found) fail("That subcommand no longer exists.", 404);
    siblings = found.option.options ?? [];
  }
  if (!Array.isArray(order) || order.length !== siblings.length || new Set(order).size !== order.length)
    fail("That order doesn't match the options.");
  const byId = new Map(siblings.map((o) => [o.id, o]));
  const sorted = order.map((id) => byId.get(id));
  if (sorted.some((o) => !o)) fail("That order doesn't match the options.");
  siblings.splice(0, siblings.length, ...sorted);
  return siblings;
}

/* ---------------------------------------------------------------------
   Events
   --------------------------------------------------------------------- */

function createEvent(builder, { event }) {
  if (!isObject(event)) fail("That event is invalid.");
  checkId(event.id, "event");
  if (idTaken(builder, event.id)) fail("That id is already used.");
  if (typeof event.type !== "string" || !TYPE_PATTERN.test(event.type)) fail("That kind of event doesn't exist.");
  if (builder.events.length >= LIMITS.events) fail(`A project can have up to ${LIMITS.events} events.`);

  const label = String(event.label ?? "").trim();
  const error = checkEventLabel(label);
  if (error) fail(error);

  const created = {
    id: event.id,
    type: event.type,
    label,
    settings: {},
    actions: [],
    enabled: true,
    created: typeof event.created === "string" ? event.created.slice(0, 40) : new Date().toISOString(),
  };

  if (event.settings !== undefined) {
    checkInputs(event.settings);
    created.settings = event.settings;
  }

  builder.events.push(created);
  return created;
}

function mergeInputs(target, patch) {
  checkInputs(Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== null)));
  for (const [key, value] of Object.entries(patch)) {
    if (!KEY_PATTERN.test(key)) fail("That input is invalid.");
    if (value === null) delete target[key];
    else target[key] = value;
  }
}

function updateEvent(builder, { eventId, patch }) {
  const event = builder.events.find((e) => e.id === eventId);
  if (!event) fail("That event no longer exists.", 404);
  if (!isObject(patch)) fail("Nothing to change.");

  if (patch.label !== undefined) {
    const label = String(patch.label).trim();
    const error = checkEventLabel(label);
    if (error) fail(error);
    event.label = label;
  }

  if (patch.settings !== undefined) {
    if (!isObject(patch.settings)) fail("Those settings are invalid.");
    if (!isObject(event.settings)) event.settings = {};
    mergeInputs(event.settings, patch.settings);
  }

  if (patch.enabled !== undefined) event.enabled = patch.enabled !== false;

  if (patch.type !== undefined && patch.type !== event.type) fail("An event's type can't be changed. Add a new event instead.");

  return event;
}

function deleteEvent(builder, { eventId }) {
  const index = builder.events.findIndex((e) => e.id === eventId);
  if (index === -1) fail("That event no longer exists.", 404);
  const [removed] = builder.events.splice(index, 1);
  return removed;
}

function reorderEvents(builder, { order }) {
  if (!Array.isArray(order) || order.length !== builder.events.length || new Set(order).size !== order.length)
    fail("That order doesn't match the events.");
  const byId = new Map(builder.events.map((e) => [e.id, e]));
  const sorted = order.map((id) => byId.get(id));
  if (sorted.some((e) => !e)) fail("That order doesn't match the events.");
  builder.events.splice(0, builder.events.length, ...sorted);
  return builder.events;
}

/* ---------------------------------------------------------------------
   Actions
   --------------------------------------------------------------------- */

function insertAction(builder, { flowId, action, location = {} }) {
  const flow = requireFlow(builder, flowId);
  checkAction(action);

  const existing = collectActionIds(flow.owner.actions);
  for (const id of collectActionIds([action]))
    if (existing.has(id)) fail("That step is already there.");

  const list = listAt(flow.owner.actions, location);
  list.splice(clampIndex(location.index, list.length), 0, action);

  checkUniqueIds(flow.owner.actions);
  checkFlowSize(flow.owner.actions);
  return action;
}

function updateAction(builder, { flowId, actionId, patch }) {
  const flow = requireFlow(builder, flowId);
  const found = findAction(flow.owner.actions, actionId);
  if (!found) fail("That step no longer exists.", 404);
  if (!isObject(patch)) fail("Nothing to change.");
  const action = found.action;

  if (patch.inputs !== undefined) {
    if (!isObject(patch.inputs)) fail("Those inputs are invalid.");
    if (!isObject(action.inputs)) action.inputs = {};
    mergeInputs(action.inputs, patch.inputs);
    if (Object.keys(action.inputs).length > 100) fail("That step has too many inputs.");
  }

  if (patch.disabled !== undefined) {
    if (patch.disabled) action.disabled = true;
    else delete action.disabled;
  }

  return action;
}

function moveAction(builder, { flowId, actionId, location = {} }) {
  const flow = requireFlow(builder, flowId);
  const found = findAction(flow.owner.actions, actionId);
  if (!found) fail("That step no longer exists.", 404);

  if (location.parentId) {
    if (location.parentId === actionId || findAction([found.action], location.parentId))
      fail("A step can't be moved inside itself.");
  }

  /* Take it out first, then work out where it goes: the index is in the
     list as it will be without it. */
  found.list.splice(found.index, 1);
  const list = listAt(flow.owner.actions, location);
  list.splice(clampIndex(location.index, list.length), 0, found.action);

  checkFlowSize(flow.owner.actions);
  return found.action;
}

function deleteAction(builder, { flowId, actionId }) {
  const flow = requireFlow(builder, flowId);
  const found = findAction(flow.owner.actions, actionId);
  if (!found) fail("That step no longer exists.", 404);
  found.list.splice(found.index, 1);
  return found.action;
}

function actionFor(builder, flowId, actionId) {
  const flow = requireFlow(builder, flowId);
  const found = findAction(flow.owner.actions, actionId);
  if (!found) fail("That step no longer exists.", 404);
  if (!isObject(found.action.branches)) found.action.branches = {};
  return { flow, action: found.action };
}

function setBranchEnabled(builder, { flowId, actionId, branch, enabled }) {
  const { action } = actionFor(builder, flowId, actionId);
  if (typeof branch !== "string" || !KEY_PATTERN.test(branch)) fail("That section doesn't exist.");
  if (enabled) {
    if (!Array.isArray(action.branches[branch])) action.branches[branch] = [];
  } else delete action.branches[branch];
  return action;
}

function addBranchItem(builder, { flowId, actionId, branch, item, index }) {
  const { flow, action } = actionFor(builder, flowId, actionId);
  if (typeof branch !== "string" || !KEY_PATTERN.test(branch)) fail("That section doesn't exist.");
  if (!isObject(item)) fail("That section is invalid.");
  checkId(item.id, "section");

  const entries = Array.isArray(action.branches[branch]) ? action.branches[branch] : [];
  if (entries.length && !entries.every(isRepeatItem)) fail("That section can't have more parts.");
  if (entries.length >= 100) fail("That step can have up to 100 sections.");
  if (entries.some((e) => e.id === item.id)) fail("That section is already there.");

  const section = { id: item.id, inputs: item.inputs ?? {}, actions: [] };
  checkInputs(section.inputs);
  entries.splice(clampIndex(index, entries.length), 0, section);
  action.branches[branch] = entries;
  checkFlowSize(flow.owner.actions);
  return section;
}

function sectionFor(builder, { flowId, actionId, branch, itemId }) {
  const { action } = actionFor(builder, flowId, actionId);
  const entries = action.branches[branch];
  const section = Array.isArray(entries) ? entries.find((e) => isRepeatItem(e) && e.id === itemId) : null;
  if (!section) fail("That section no longer exists.", 404);
  return { action, entries, section };
}

function updateBranchItem(builder, payload) {
  const { section } = sectionFor(builder, payload);
  if (!isObject(payload.inputs)) fail("Those inputs are invalid.");
  if (!isObject(section.inputs)) section.inputs = {};
  mergeInputs(section.inputs, payload.inputs);
  return section;
}

function removeBranchItem(builder, payload) {
  const { entries, section } = sectionFor(builder, payload);
  entries.splice(entries.indexOf(section), 1);
  return section;
}

function moveBranchItem(builder, { index, ...payload }) {
  const { entries, section } = sectionFor(builder, payload);
  entries.splice(entries.indexOf(section), 1);
  entries.splice(clampIndex(index, entries.length), 0, section);
  return section;
}

/* ---------------------------------------------------------------------
   Variables
   --------------------------------------------------------------------- */

function createVariable(builder, { variable }) {
  if (!isObject(variable)) fail("That variable is invalid.");
  checkId(variable.id, "variable");
  if (idTaken(builder, variable.id)) fail("That id is already used.");
  if (builder.variables.length >= LIMITS.variables) fail(`A project can have up to ${LIMITS.variables} variables.`);
  const name = String(variable.name ?? "").trim();
  const error = checkVariableName(name, builder.variables.map((v) => v.name));
  if (error) fail(error);
  const created = { id: variable.id, name };
  builder.variables.push(created);
  return created;
}

function renameVariable(builder, { variableId, name }) {
  const variable = builder.variables.find((v) => v.id === variableId);
  if (!variable) fail("That variable no longer exists.", 404);
  const text = String(name ?? "").trim();
  const error = checkVariableName(
    text,
    builder.variables.filter((v) => v.id !== variableId).map((v) => v.name),
  );
  if (error) fail(error);
  variable.name = text;
  return variable;
}

function deleteVariable(builder, { variableId }) {
  const index = builder.variables.findIndex((v) => v.id === variableId);
  if (index === -1) fail("That variable no longer exists.", 404);
  const [removed] = builder.variables.splice(index, 1);
  let count = 0;
  for (const flow of everyFlow(builder))
    count += stripFromActions(flow.actions, (ref) => ref.kind === "variable" && ref.id === variableId);
  for (const event of builder.events)
    count += stripFromInputs(event.settings, (ref) => ref.kind === "variable" && ref.id === variableId);
  return { ...removed, removedUses: count };
}

/** How many places use a variable, for the "are you sure" message. */
export function countVariableUses(builder, variableId) {
  let count = 0;
  const counter = (inputs) => {
    for (const value of Object.values(inputs ?? {})) {
      if (!isObject(value)) continue;
      if (value.ref?.kind === "variable" && value.ref.id === variableId) count += 1;
      else if (value.ref?.inputs) counter(value.ref.inputs);
      else if ("literal" in value) scan(value.literal);
    }
  };
  const scan = (literal) => {
    if (Array.isArray(literal)) literal.forEach(scan);
    else if (isObject(literal))
      for (const [key, value] of Object.entries(literal)) key === "inputs" ? counter(value) : scan(value);
  };
  for (const flow of everyFlow(builder ?? emptyBuilder()))
    walkActions(flow.actions, ({ action }) => {
      counter(action.inputs);
      for (const entries of Object.values(action.branches ?? {}))
        for (const entry of entries ?? []) if (isRepeatItem(entry)) counter(entry.inputs);
    });
  for (const event of builder?.events ?? []) counter(event.settings);
  return count;
}

/* ---------------------------------------------------------------------
   Templates
   ---------------------------------------------------------------------
   A DisFuse Builder template is a builder of its own: the same
   { commands, events, variables } a project saves, and nothing about any
   bot (no token, no secrets, no settings). Importing one replays it into
   a project through the same operations people use by hand, so a
   template can never put anything in a project that those couldn't, and
   every limit and rule applies to it the same way.

   The ids in `content` are used as they are. The page gives everything
   new ids, and renames commands and variables whose names are taken,
   before it sends an import (model/templates.js), so both sides apply
   exactly the same thing.
   --------------------------------------------------------------------- */

const list = (value) => (Array.isArray(value) ? value : []);

/* What a new command or option starts with; a template only carries settings that differ. */
const COMMAND_DEFAULTS = {
  nsfw: false,
  defaultMemberPermissions: [],
  integrationTypes: ["GuildInstall"],
  contexts: ["Guild", "BotDM"],
  nameLocalizations: {},
  descriptionLocalizations: {},
};
const OPTION_DEFAULTS = {
  nameLocalizations: {},
  descriptionLocalizations: {},
  required: false,
  choices: [],
  channelTypes: [],
  minValue: null,
  maxValue: null,
  minLength: null,
  maxLength: null,
  autocomplete: false,
  suggestions: [],
};

function changedSettings(source, keys, defaults) {
  const patch = {};
  for (const key of keys) {
    const value = source?.[key];
    if (value === undefined) continue;
    if (JSON.stringify(value) === JSON.stringify(defaults[key])) continue;
    patch[key] = value;
  }
  return patch;
}

/** The settings of a command in a template, as an updateCommand patch. */
export function templateCommandSettings(command) {
  const keys = ["nsfw", "defaultMemberPermissions", "integrationTypes", "contexts", "nameLocalizations"];
  if ((command?.kind ?? "slash") === "slash") keys.push("descriptionLocalizations");
  const patch = changedSettings(command, keys, COMMAND_DEFAULTS);
  /* Where a command works depends on how it's installed; they go together. */
  if (patch.integrationTypes && command?.contexts !== undefined) patch.contexts = command.contexts;
  return patch;
}

/** The settings of an option in a template, as an updateOption patch (only ones its type has). */
export function templateOptionSettings(option) {
  const type = Number(option?.type);
  const keys = ["nameLocalizations", "descriptionLocalizations"];
  if (!isStructural({ type })) {
    keys.push("required");
    for (const [field, types] of Object.entries(OPTION_FIELDS_BY_TYPE)) if (types.includes(type)) keys.push(field);
    if (OPTION_FIELDS_BY_TYPE.autocomplete.includes(type)) keys.push("suggestions");
  }
  return changedSettings(option, keys, OPTION_DEFAULTS);
}

function importSteps(builder, flowId, actions) {
  for (const action of list(actions)) insertAction(builder, { flowId, action, location: {} });
}

function importOptions(builder, commandId, parentId, options) {
  for (const option of list(options)) {
    if (!isObject(option)) fail("That template has an invalid option.");
    createOption(builder, {
      commandId,
      parentId,
      option: { id: option.id, type: option.type, name: option.name, description: option.description },
    });
    const patch = templateOptionSettings(option);
    if (Object.keys(patch).length) updateOption(builder, { commandId, optionId: option.id, patch });
    const type = Number(option.type);
    if (type === 1 || type === 2) importOptions(builder, commandId, option.id, option.options);
    if (type === 1) importSteps(builder, option.id, option.actions);
  }
}

function importTemplate(builder, { content }) {
  if (!isObject(content)) fail("That template is invalid.");
  /* Kept apart from the payload: what lands in the builder is a copy. */
  const source = clone(content);

  for (const variable of list(source.variables)) {
    if (!isObject(variable)) fail("That template has an invalid variable.");
    createVariable(builder, { variable: { id: variable.id, name: variable.name } });
  }

  for (const command of list(source.commands)) {
    if (!isObject(command)) fail("That template has an invalid command.");
    createCommand(builder, {
      command: { id: command.id, kind: command.kind, name: command.name, description: command.description, created: command.created },
    });
    const patch = templateCommandSettings(command);
    if (Object.keys(patch).length) updateCommand(builder, { commandId: command.id, patch });
    if ((command.kind ?? "slash") === "slash") importOptions(builder, command.id, null, command.options);
    importSteps(builder, command.id, command.actions);
  }

  for (const event of list(source.events)) {
    if (!isObject(event)) fail("That template has an invalid event.");
    createEvent(builder, {
      event: { id: event.id, type: event.type, label: event.label, settings: event.settings, created: event.created },
    });
    if (event.enabled === false) updateEvent(builder, { eventId: event.id, patch: { enabled: false } });
    importSteps(builder, event.id, event.actions);
  }

  return {
    commands: list(source.commands).map((c) => c.id),
    events: list(source.events).map((e) => e.id),
    variables: list(source.variables).map((v) => v.id),
  };
}

/** How much a builder (or a template) holds: commands, events and steps. */
export function builderStats(builder) {
  let steps = 0;
  for (const flow of everyFlow(normaliseBuilder(clone(builder ?? emptyBuilder()))))
    walkActions(flow.actions, () => {
      steps += 1;
    });
  return { commands: list(builder?.commands).length, events: list(builder?.events).length, steps };
}

/* ---------------------------------------------------------------------
   Applying a change
   --------------------------------------------------------------------- */

export const OPS = {
  createCommand,
  updateCommand,
  deleteCommand,
  createOption,
  updateOption,
  deleteOption,
  reorderOptions,
  createEvent,
  updateEvent,
  deleteEvent,
  reorderEvents,
  insertAction,
  updateAction,
  moveAction,
  deleteAction,
  setBranchEnabled,
  addBranchItem,
  updateBranchItem,
  removeBranchItem,
  moveBranchItem,
  createVariable,
  renameVariable,
  deleteVariable,
  importTemplate,
};

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

/**
 * Applies one change to a copy of the builder.
 *
 * @param {object} builder  the current builder (not modified)
 * @param {string} name     a key of OPS
 * @param {object} payload
 * @returns {{ builder: object, result: any }}
 * @throws {OpError}
 */
export function applyOp(builder, name, payload) {
  const op = OPS[name];
  if (!op) fail("That change isn't supported.");

  const draft = normaliseBuilder(clone(builder ?? emptyBuilder()));
  const result = op(draft, payload ?? {});

  const bytes = JSON.stringify(draft).length;
  if (bytes > SHAPE_LIMITS.maxBytes)
    fail("This project has grown too big to save. Try removing some steps or events.", 413);

  return { builder: draft, result };
}
