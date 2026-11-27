/* =====================================================================
   Commands declared in the block editor
   ---------------------------------------------------------------------
   The block editor registers commands with a "create slash commands /
   context menus" block holding "add slash command" and "add context
   menu" blocks, with options, subcommands and choices stacked inside.
   In the builder those are commands on the Commands page, so each one
   becomes a command with the same name, description, options and
   settings.

   The block editor only warned about names Discord won't accept, so a
   name is cleaned up to the nearest one it will (and the person told).
   ===================================================================== */

import { LIMITS, checkContextMenuName, checkDescription, checkName, cleanPermissions } from "../model/rules.js";
import { fieldValue, inputBlock, statementStack, textLiteral } from "./blockJson.js";

/** Blocks that hold command declarations. */
export const COMMAND_CONTAINERS = new Set(["misc_createcontainer_global", "misc_createcontainer", "slash_createcontainer"]);

const SLASH_DECLARATIONS = new Set(["slash_create_mutator", "slash_create"]);

/** A name Discord accepts for a slash command or option: lowercase, no spaces. */
export function cleanCommandName(name) {
  const cleaned = [...String(name ?? "").trim().toLowerCase().replace(/\s+/g, "-")]
    .filter((char) => /[-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]/u.test(char))
    .slice(0, LIMITS.nameLength)
    .join("");
  return checkName(cleaned) ? null : cleaned;
}

function cleanMenuName(name) {
  const cleaned = [...String(name ?? "").trim()].slice(0, LIMITS.nameLength).join("").trim();
  return checkContextMenuName(cleaned) ? null : cleaned;
}

function cleanDescription(text, fallback) {
  const cleaned = [...String(text ?? "").trim()].slice(0, LIMITS.descriptionLength).join("");
  if (!checkDescription(cleaned)) return cleaned;
  const backup = [...String(fallback ?? "").trim()].slice(0, LIMITS.descriptionLength).join("");
  return checkDescription(backup) ? "No description" : backup;
}

/** Typed text in an input, or null when it's empty or a value. */
function typed(block, name) {
  return textLiteral(inputBlock(block, name));
}

/** A true/false typed into an input; `fallback` when it's empty or a value. */
function typedBoolean(block, name, fallback) {
  const child = inputBlock(block, name);
  if (child?.type !== "logic_boolean") return fallback;
  return String(fieldValue(child, "BOOL")).toUpperCase() === "TRUE";
}

/** Permission names from a permission block, or a list of them. */
function permissionsFrom(block) {
  if (!block) return [];
  if (block.type === "misc_permission") return [String(fieldValue(block, "permission") ?? "")];
  if (block.type === "lists_create_with")
    return Object.entries(block.inputs ?? {})
      .filter(([name]) => /^ADD\d+$/.test(name))
      .flatMap(([, slot]) => permissionsFrom(slot?.block ?? slot?.shadow));
  const text = textLiteral(block);
  return text ? text.split(",").map((part) => part.trim()) : [];
}

/**
 * Reads one container's declarations into the converter.
 *
 * @param {object} container  the "create slash commands" block
 * @param {import("./fromBlocks.js").BlockConverter} conv
 */
export function readCommandDeclarations(container, conv) {
  const guild = typed(container, "guild");
  if (guild?.trim())
    conv.note(
      "Your commands were registered in one test server. Builder projects register them in every server the bot is in.",
    );

  const statement = container.type === "slash_createcontainer" ? "commands" : "code";
  for (const block of statementStack(container, statement)) {
    if (conv.sourceOf(block.type) !== "builtin") {
      conv.skip(block, conv.sourceOf(block.type));
      continue;
    }
    if (block.enabled === false) continue;
    if (SLASH_DECLARATIONS.has(block.type)) readSlashCommand(block, conv);
    else if (block.type === "contextMenu_create") readContextMenu(block, conv);
  }
}

function sameKind(conv, kind) {
  return conv.commands.filter((command) => command.kind === kind);
}

function readSlashCommand(block, conv) {
  const raw = typed(block, "name");
  if (raw === null) {
    conv.note("A slash command whose name wasn't typed in (it came from a value) was left out.");
    return;
  }
  const name = cleanCommandName(raw);
  if (!name) {
    conv.note(`The slash command "${raw}" has a name Discord doesn't accept, so it was left out.`);
    return;
  }
  if (name !== raw) conv.note(`The slash command "${raw}" was renamed to "/${name}", because Discord only accepts lowercase names without spaces.`);

  const existing = sameKind(conv, "slash");
  if (existing.some((command) => command.name === name)) {
    conv.note(`The slash command /${name} was added more than once, so only the first one was kept.`);
    return;
  }
  if (existing.length >= LIMITS.slashCommands) {
    conv.note(`Discord allows up to ${LIMITS.slashCommands} slash commands, so some were left out.`);
    return;
  }

  const command = {
    id: conv.newId(),
    kind: "slash",
    name,
    description: cleanDescription(typed(block, "dsc"), name),
    nsfw: typedBoolean(block, "nsfw", false),
    defaultMemberPermissions: cleanPermissions(permissionsFrom(inputBlock(block, "perms"))),
    contexts: typedBoolean(block, "dm", true) ? ["Guild", "BotDM"] : ["Guild"],
    integrationTypes: ["GuildInstall"],
    nameLocalizations: {},
    descriptionLocalizations: {},
    options: readOptions(statementStack(block, "options"), conv, `/${name}`, "command"),
    actions: [],
    created: new Date().toISOString(),
  };

  /* Discord won't take a command that mixes subcommands with other options. */
  const structural = command.options.filter((o) => o.type === 1 || o.type === 2);
  if (structural.length && structural.length !== command.options.length) {
    command.options = structural;
    conv.note(`/${name} mixed subcommands with other options, which Discord doesn't allow, so the other options were left out.`);
  }

  conv.addCommand(command, raw);
}

function readContextMenu(block, conv) {
  const raw = typed(block, "name");
  const name = raw === null ? null : cleanMenuName(raw);
  if (!name) {
    conv.note("A right-click command without a typed-in name was left out.");
    return;
  }
  const kind = String(fieldValue(block, "type") ?? "").endsWith("User") ? "user" : "message";
  const existing = sameKind(conv, kind);
  if (existing.some((command) => command.name.toLowerCase() === name.toLowerCase())) {
    conv.note(`The right-click command "${name}" was added more than once, so only the first one was kept.`);
    return;
  }
  const limit = kind === "user" ? LIMITS.userCommands : LIMITS.messageCommands;
  if (existing.length >= limit) {
    conv.note(`Discord allows up to ${limit} right-click commands of each kind, so some were left out.`);
    return;
  }

  conv.addCommand(
    {
      id: conv.newId(),
      kind,
      name,
      nsfw: false,
      defaultMemberPermissions: [],
      contexts: typedBoolean(block, "dms", true) ? ["Guild", "BotDM"] : ["Guild"],
      integrationTypes: ["GuildInstall"],
      nameLocalizations: {},
      actions: [],
      created: new Date().toISOString(),
    },
    raw,
  );
}

const VALUE_TYPES = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11]);

/**
 * Options, subcommands and groups from a stack of blocks.
 * `level` is what holds them: "command", "subcommand" or "group".
 */
function readOptions(blocks, conv, where, level) {
  const options = [];
  for (const block of blocks) {
    if (conv.sourceOf(block.type) !== "builtin") {
      conv.skip(block, conv.sourceOf(block.type));
      continue;
    }
    if (block.enabled === false) continue;

    let type = null;
    if (block.type === "slash_addoption") type = Number(fieldValue(block, "type"));
    else if (block.type === "slash_addsubcommand") type = 1;
    else if (block.type === "slash_addsubcommandgroup") type = 2;
    else continue;

    const allowed =
      level === "group" ? type === 1 : level === "subcommand" ? VALUE_TYPES.has(type) : type === 1 || type === 2 || VALUE_TYPES.has(type);
    if (!allowed) {
      conv.note(`An option of ${where} was in a place Discord doesn't allow, so it was left out.`);
      continue;
    }

    const raw = typed(block, "name");
    const name = raw === null ? null : cleanCommandName(raw);
    if (!name) {
      conv.note(`An option of ${where} has no name Discord accepts, so it was left out.`);
      continue;
    }
    if (options.some((option) => option.name === name)) continue;
    if (options.length >= LIMITS.optionsPerLevel) {
      conv.note(`${where} has more than ${LIMITS.optionsPerLevel} options in one place, so some were left out.`);
      break;
    }

    const base = {
      id: conv.newId(),
      type,
      name,
      description: cleanDescription(typed(block, "dsc"), name),
      nameLocalizations: {},
      descriptionLocalizations: {},
    };

    if (type === 1) {
      options.push({ ...base, options: readOptions(statementStack(block, "options"), conv, `${where} ${name}`, "subcommand"), actions: [] });
      continue;
    }
    if (type === 2) {
      options.push({ ...base, options: readOptions(statementStack(block, "subcommands"), conv, `${where} ${name}`, "group") });
      continue;
    }

    const choices = [];
    for (const choice of statementStack(block, "choices")) {
      if (choice.type !== "slash_addchoice" || choice.enabled === false) continue;
      const choiceName = typed(choice, "name");
      const choiceValue = typed(choice, "value") ?? choiceName;
      if (!choiceName?.trim() || choiceValue === null) continue;
      const value = type === 3 ? String(choiceValue).slice(0, LIMITS.choiceValueLength) : Number(choiceValue);
      if (type !== 3 && (!Number.isFinite(value) || (type === 4 && !Number.isInteger(value)))) continue;
      if (choices.length < LIMITS.choices)
        choices.push({ id: conv.newId(), name: [...choiceName].slice(0, LIMITS.choiceNameLength).join(""), value });
    }
    if (choices.length && ![3, 4, 10].includes(type))
      conv.note(`Only text and number options can have choices, so the choices of the "${name}" option of ${where} were left out.`);

    options.push({
      ...base,
      required: typedBoolean(block, "required", false),
      choices: [3, 4, 10].includes(type) ? choices : [],
      channelTypes: [],
      minValue: null,
      maxValue: null,
      minLength: null,
      maxLength: null,
      autocomplete: false,
      suggestions: [],
    });
  }
  return options;
}
