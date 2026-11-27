/* =====================================================================
   DisFuse Builder: the whole bot
   ---------------------------------------------------------------------
   Builds the bot's index.js from a builder project: its commands, its
   events and its variables. The file has the same shape as the one the
   block editor exports (see src/functions/updateCode.js) so exported
   bots behave the same way whichever editor made them:

     header         dotenv, the discord.js client, the DisFuse helper
                    functions, packages, Insights
     variables      one `let` per variable
     commands       registered with Discord when the bot starts, using
                    discord.js (never from DisFuse's servers), and one
                    `interactionCreate` handler that runs the right flow
     events         one `client.on(...)` per event
     login

   Nothing here touches the DOM, so the check script runs it in Node.
   ===================================================================== */

import { utilFunctions as blockEditorUtils } from "../../blocks/lib/generatorUtils.js";

/* The block editor's helper header, shared so both exports behave the
   same. Its comments use dashes the builder's own text never does. */
const utilFunctions = blockEditorUtils.replace(/ — /g, ", ");
import { FLOW_CONTEXTS } from "../catalog/contexts.js";
import { Generator, str } from "./context.js";

/* ---------------------------------------------------------------------
   Names
   --------------------------------------------------------------------- */

/* Names the generated file already uses, so a user's variable called
   "client" can't replace the bot. The block editor keeps the same list. */
const RESERVED = new Set(
  (
    "break,case,catch,class,const,continue,debugger,default,delete,do,else,enum,export,extends,false,finally,for,function,if,import,in,instanceof,new,null,return,super,switch,this,throw,true,try,typeof,var,void,while,with,yield,let,static,implements,interface,package,private,protected,public,await,async,arguments,eval,undefined,NaN,Infinity," +
    "getCollection,getFromCollection,forEachCollection,asyncFilter,asyncFind,asyncMap,Discord,moment,client,databases,disfuseCooldowns,wait,process,require,module,exports,console,interaction,message,messageSent,error,member,user,guild,server,channel,role,emoji,fetch,JSON,Math,Date,String,Number,Boolean,Array,Object,Promise,Error,RegExp,Map,Set,setTimeout,setInterval,clearTimeout,clearInterval,globalThis,disfuseCommands,disfuseSuggestions,disfuseLogEvent,disfuseInsights"
  ).split(","),
);

/** A safe JavaScript identifier from any text. */
export function identifier(text, fallback = "value") {
  let name = String(text ?? "")
    .normalize("NFKD")
    .replace(/[^\w$]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!name) name = fallback;
  if (/^\d/.test(name)) name = "_" + name;
  if (RESERVED.has(name)) name += "_";
  return name;
}

/** Variable id → the JS name it is generated with. Stable and unique. */
export function variableNames(variables = []) {
  const names = new Map();
  const taken = new Set();
  for (const variable of variables) {
    const base = identifier(variable.name, "variable");
    let name = base;
    for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${base}${i}`;
    taken.add(name.toLowerCase());
    names.set(variable.id, name);
  }
  return names;
}

function packageIdentifier(pkg = "") {
  let name = pkg.replace(/[-.@/]/g, "_");
  if (/^\d/.test(name)) name = "_" + name;
  return name;
}

/* ---------------------------------------------------------------------
   Commands
   --------------------------------------------------------------------- */

const CONTEXT_CODE = {
  Guild: "Discord.InteractionContextType.Guild",
  BotDM: "Discord.InteractionContextType.BotDM",
  PrivateChannel: "Discord.InteractionContextType.PrivateChannel",
};

const INTEGRATION_CODE = {
  GuildInstall: "Discord.ApplicationIntegrationType.GuildInstall",
  UserInstall: "Discord.ApplicationIntegrationType.UserInstall",
};

const COMMAND_TYPE_CODE = {
  slash: "Discord.ApplicationCommandType.ChatInput",
  user: "Discord.ApplicationCommandType.User",
  message: "Discord.ApplicationCommandType.Message",
};

function localizations(map) {
  const entries = Object.entries(map ?? {}).filter(([, text]) => String(text ?? "").trim());
  if (!entries.length) return null;
  return `{ ${entries.map(([locale, text]) => `${str(locale)}: ${str(text)}`).join(", ")} }`;
}

function isNumeric(type) {
  return type === 4 || type === 10;
}

function optionData(option) {
  const parts = [
    `type: ${Number(option.type)}`,
    `name: ${str(option.name)}`,
    `description: ${str(option.description || option.name)}`,
  ];

  const names = localizations(option.nameLocalizations);
  if (names) parts.push(`nameLocalizations: ${names}`);
  const descriptions = localizations(option.descriptionLocalizations);
  if (descriptions) parts.push(`descriptionLocalizations: ${descriptions}`);

  if (option.type === 1 || option.type === 2) {
    parts.push(`options: [${(option.options ?? []).map(optionData).join(", ")}]`);
    return `{ ${parts.join(", ")} }`;
  }

  if (option.required) parts.push("required: true");

  const numeric = isNumeric(option.type);
  const choiceValue = (value) =>
    numeric ? String(Number(value) || 0) : str(value);

  if (option.autocomplete && [3, 4, 10].includes(option.type)) {
    parts.push("autocomplete: true");
  } else if (option.choices?.length && [3, 4, 10].includes(option.type)) {
    parts.push(
      `choices: [${option.choices
        .map((choice) => {
          const choiceNames = localizations(choice.nameLocalizations);
          return `{ name: ${str(choice.name)}, value: ${choiceValue(choice.value)}${
            choiceNames ? `, nameLocalizations: ${choiceNames}` : ""
          } }`;
        })
        .join(", ")}]`,
    );
  }

  if (option.type === 7 && option.channelTypes?.length)
    parts.push(`channelTypes: [${option.channelTypes.map(Number).join(", ")}]`);

  if (numeric) {
    if (option.minValue !== undefined && option.minValue !== null && option.minValue !== "")
      parts.push(`minValue: ${Number(option.minValue)}`);
    if (option.maxValue !== undefined && option.maxValue !== null && option.maxValue !== "")
      parts.push(`maxValue: ${Number(option.maxValue)}`);
  }

  if (option.type === 3) {
    if (option.minLength !== undefined && option.minLength !== null && option.minLength !== "")
      parts.push(`minLength: ${Number(option.minLength)}`);
    if (option.maxLength !== undefined && option.maxLength !== null && option.maxLength !== "")
      parts.push(`maxLength: ${Number(option.maxLength)}`);
  }

  return `{ ${parts.join(", ")} }`;
}

/** The registration data for one command, as discord.js takes it. */
export function commandData(command) {
  const kind = command.kind ?? "slash";
  const parts = [`name: ${str(command.name)}`, `type: ${COMMAND_TYPE_CODE[kind]}`];

  if (kind === "slash") {
    parts.push(`description: ${str(command.description || command.name)}`);
    parts.push(`options: [${(command.options ?? []).map(optionData).join(", ")}]`);
    const descriptions = localizations(command.descriptionLocalizations);
    if (descriptions) parts.push(`descriptionLocalizations: ${descriptions}`);
  }

  const names = localizations(command.nameLocalizations);
  if (names) parts.push(`nameLocalizations: ${names}`);

  if (command.nsfw) parts.push("nsfw: true");

  if (Array.isArray(command.defaultMemberPermissions) && command.defaultMemberPermissions.length)
    parts.push(
      `defaultMemberPermissions: [${command.defaultMemberPermissions
        .map((flag) => `Discord.PermissionFlagsBits.${identifier(flag)}`)
        .join(", ")}]`,
    );

  const contexts = (command.contexts ?? []).filter((c) => CONTEXT_CODE[c]);
  if (contexts.length) parts.push(`contexts: [${contexts.map((c) => CONTEXT_CODE[c]).join(", ")}]`);

  const integrations = (command.integrationTypes ?? []).filter((c) => INTEGRATION_CODE[c]);
  if (integrations.length)
    parts.push(`integrationTypes: [${integrations.map((c) => INTEGRATION_CODE[c]).join(", ")}]`);

  return `{ ${parts.join(", ")} }`;
}

/**
 * Every place a slash command runs code: the command itself when it has
 * no subcommands, otherwise each subcommand (at any depth).
 *
 * @returns {Array<{ group: object|null, sub: object|null, flow: object }>}
 */
export function commandFlows(command) {
  const options = command.options ?? [];
  const subs = options.filter((o) => o.type === 1);
  const groups = options.filter((o) => o.type === 2);

  if ((command.kind ?? "slash") !== "slash" || (!subs.length && !groups.length))
    return [{ group: null, sub: null, flow: command }];

  return [
    ...subs.map((sub) => ({ group: null, sub, flow: sub })),
    ...groups.flatMap((group) =>
      (group.options ?? [])
        .filter((o) => o.type === 1)
        .map((sub) => ({ group, sub, flow: sub })),
    ),
  ];
}

/** The options a flow can read: the non-subcommand options at its level. */
function flowOptions(flow) {
  return (flow.options ?? []).filter((o) => o.type !== 1 && o.type !== 2);
}

function collectSuggestions(command) {
  const out = [];
  const walk = (options, group, sub) => {
    for (const option of options ?? []) {
      if (option.type === 2) walk(option.options, option.name, null);
      else if (option.type === 1) walk(option.options, group, option.name);
      else if (option.autocomplete && option.suggestions?.length)
        out.push({
          key: [command.name, group ?? "", sub ?? "", option.name].join("/"),
          numeric: isNumeric(option.type),
          suggestions: option.suggestions,
        });
    }
  };
  walk(command.options, null, null);
  return out;
}

/* ---------------------------------------------------------------------
   The whole file
   --------------------------------------------------------------------- */

/**
 * The listener for one event: `client.on(...)` (or the event's own
 * wrapper) around its steps. Used for the whole file, and by the
 * Workshop's pack editor to preview a single event.
 */
export function eventCode(gen, catalog, event, index = 0) {
  const def = catalog.events.get(event.type);
  const where = event.label ? `Event "${event.label}"` : `Event ${index + 1}`;
  if (!def) {
    gen.issue(where, `Unknown event "${event.type}"`);
    return `/* Unknown event: ${String(event.type).replace(/\*\//g, "")} */`;
  }
  gen.use(def);

  const scope = gen.scopeFor({
    kind: "event",
    actions: event.actions ?? [],
    contexts: def.provides,
    event: def,
    eventInstance: event,
  });
  const ctx = gen.makeCtx(def, def.settings, { id: event.id, inputs: event.settings ?? {} }, scope, where);
  const body = gen.flowCode(event.actions ?? [], scope, where);

  let prelude = "";
  try {
    prelude = def.prelude ? String(def.prelude(ctx) ?? "") : "";
  } catch (error) {
    gen.issue(where, `Couldn't build the event: ${error.message}`);
  }

  const comment = `/* ${String(event.label || def.label).replace(/\*\//g, "")} */\n`;

  if (def.wrap) {
    try {
      return comment + String(def.wrap(ctx, prelude + body));
    } catch (error) {
      gen.issue(where, `Couldn't build the event: ${error.message}`);
      return "";
    }
  }

  return `${comment}client.${def.once ? "once" : "on"}(${def.listen}, async (${def.params.join(", ")}) => {
${prelude}${prelude && !prelude.endsWith("\n") ? "\n" : ""}${body}});`;
}

/**
 * @param {object} args
 * @param {object} args.project   { _id, name, ... }
 * @param {object} args.builder   { commands, events, variables }
 * @param {object} args.catalog   from ../catalog/index.js
 * @param {string} [args.insights] Insights code for this project (the
 *   browser passes insightsCode(project); left out in tests)
 * @returns {{ code: string, dependencies: string[], issues: Array }}
 */
export function generateBot({ project, builder, catalog, insights = "" }) {
  const variables = variableNames(builder?.variables ?? []);
  const gen = new Generator(catalog, { project, variables });

  const commands = (builder?.commands ?? []).filter((c) => c?.name);
  const events = (builder?.events ?? []).filter((e) => e && e.enabled !== false);

  /* ---- Commands ------------------------------------------------- */

  const functions = [];
  const routes = { slash: [], user: [], message: [] };
  const suggestions = [];

  commands.forEach((command, commandIndex) => {
    const kind = command.kind ?? "slash";
    const flows = commandFlows(command);
    const byGroup = [];

    for (const { group, sub, flow } of flows) {
      const fnName = identifier(
        ["command", commandIndex, command.name, group?.name, sub?.name]
          .filter((part) => part !== undefined && part !== null)
          .join("_"),
      );
      const where = `/${[command.name, group?.name, sub?.name].filter(Boolean).join(" ")}`;
      const scope = gen.scopeFor({
        kind: sub ? "subcommand" : kind,
        actions: flow.actions ?? [],
        contexts: FLOW_CONTEXTS[kind] ?? FLOW_CONTEXTS.slash,
        options: kind === "slash" ? flowOptions(flow) : [],
      });
      const body = gen.flowCode(flow.actions ?? [], scope, where);

      functions.push(`async function ${fnName}(interaction) {\n${body}}`);
      byGroup.push({ group: group?.name ?? null, sub: sub?.name ?? null, fnName });
    }

    if (kind === "slash") {
      suggestions.push(...collectSuggestions(command));
      if (byGroup.length === 1 && !byGroup[0].sub)
        routes.slash.push(`case ${str(command.name)}: return await ${byGroup[0].fnName}(interaction);`);
      else
        routes.slash.push(`case ${str(command.name)}: {
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand(false);
${byGroup
  .map(
    (route) =>
      `  if (group === ${route.group === null ? "null" : str(route.group)} && sub === ${str(route.sub)}) return await ${route.fnName}(interaction);`,
  )
  .join("\n")}
  return;
}`);
    } else {
      routes[kind].push(`case ${str(command.name)}: return await ${byGroup[0].fnName}(interaction);`);
    }
  });

  const commandSections = [];

  if (commands.length) {
    commandSections.push(
      `/* Slash and context menu commands. They are registered with Discord
   by discord.js each time the bot starts. */
const disfuseCommands = [
${commands.map(commandData).join(",\n")}
];

client.on("clientReady", async () => {
  try {
    await client.application.commands.set(disfuseCommands);
    console.log("Registered " + disfuseCommands.length + " command(s)");
  } catch (error) {
    console.error("Couldn't register commands:", error);
  }
});`,
    );

    if (suggestions.length)
      commandSections.push(
        `/* Suggestions shown while someone types an option */
const disfuseSuggestions = {
${suggestions
  .map(
    (entry) =>
      `  ${str(entry.key)}: [${entry.suggestions
        .map((s) => `{ name: ${str(s.name)}, value: ${entry.numeric ? String(Number(s.value) || 0) : str(s.value)} }`)
        .join(", ")}]`,
  )
  .join(",\n")}
};`,
      );

    commandSections.push(functions.join("\n\n"));

    const branches = [];
    if (routes.slash.length)
      branches.push(`if (interaction.isChatInputCommand()) {
  switch (interaction.commandName) {
${routes.slash.join("\n")}
  }
}`);
    if (routes.user.length)
      branches.push(`if (interaction.isUserContextMenuCommand()) {
  switch (interaction.commandName) {
${routes.user.join("\n")}
  }
}`);
    if (routes.message.length)
      branches.push(`if (interaction.isMessageContextMenuCommand()) {
  switch (interaction.commandName) {
${routes.message.join("\n")}
  }
}`);
    if (suggestions.length)
      branches.push(`if (interaction.isAutocomplete()) {
  const focused = interaction.options.getFocused(true);
  const key = [
    interaction.commandName,
    interaction.options.getSubcommandGroup(false) ?? "",
    interaction.options.getSubcommand(false) ?? "",
    focused.name
  ].join("/");
  const typed = String(focused.value ?? "").toLowerCase();
  const matches = (disfuseSuggestions[key] ?? []).filter(item => item.name.toLowerCase().includes(typed));
  await interaction.respond(matches.slice(0, 25));
  return;
}`);

    commandSections.push(`client.on("interactionCreate", async (interaction) => {
  try {
${branches.join("\n")}
  } catch (error) {
    console.error(error);
  }
});`);
  }

  /* ---- Events --------------------------------------------------- */

  const eventSections = events.map((event, index) => eventCode(gen, catalog, event, index));

  /* ---- Variables ------------------------------------------------ */

  const variableSection = [...variables.values()].length
    ? `/* Variables */\n${[...variables.values()].map((name) => `let ${name};`).join("\n")}`
    : "";

  /* ---- Header --------------------------------------------------- */

  const dependencyCode = [...gen.dependencies.values()]
    .map((dep) => dep.code ?? `const ${packageIdentifier(dep.package)} = require(${str(dep.package)});`)
    .filter(Boolean)
    .join("\n");

  const setupCode = [...gen.setup.values()].join("\n\n");

  const code = `require("dotenv").config();
const Discord = require("discord.js");
let client = new Discord.Client({
  intents: Object.values(Discord.GatewayIntentBits),
  partials: [Discord.Partials.Channel]
});

const process = require("process");
process.on("uncaughtException", (e) => {
  console.error(e);
});

const databases = {};

${utilFunctions}
${insights ? "\n" + insights : ""}
${dependencyCode ? "\n" + dependencyCode : ""}
${setupCode ? "\n" + setupCode : ""}
${variableSection ? "\n" + variableSection : ""}

client.setMaxListeners(0);

client.on("clientReady", async () => {
  console.log(client.user.tag + " is logged in!");
});

${commandSections.join("\n\n")}

${eventSections.join("\n\n")}

client.login(process.env.DISFUSE_SECURE_BOT_TOKEN);
`;

  return {
    code,
    dependencies: [...gen.dependencies.values()]
      .filter((dep) => !dep.builtin && !dep.package.startsWith("node:"))
      .map((dep) => dep.package),
    issues: gen.issues,
  };
}
