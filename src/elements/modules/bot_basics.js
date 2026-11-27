/* =====================================================================
   Builder catalog: the bot, cooldowns and notes
   ---------------------------------------------------------------------
   The block editor's Main, Cooldowns and Comments blocks: starting the
   bot, its status, cooldowns for commands, and notes that don't run.
   Each entry describes its block too.
   ===================================================================== */

import { ANY, group, input } from "../define.js";

const { event, action, value, block } = group({ colour: "#FF6E33" });

/* The same clean-up the block editor applies before putting a user's
   note into a JavaScript comment: one line, no way to end the comment. */
function sanitizeComment(text) {
  return String(text ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\*\//g, "* /")
    .replace(/-->/g, "-- >")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

/* A cooldown is remembered per user and per cooldown name. */
function cooldownKey(user, name) {
  const who =
    !user || user === "null" ? '(typeof message !== "undefined" ? message.author : null)' : user;
  return "`${" + who + ".id}:${" + name + "}`";
}

const COOLDOWN_INPUTS = [
  input.text("command", "Cooldown name", {
    placeholder: "daily",
    help: "Any name you like, such as the command's name. Steps that use the same name share one cooldown.",
  }),
  input.slot("user", "User", ["user", "member"]),
];

const events = [
  event({
    id: "bot_ready",
    label: "When the bot starts",
    description: "Runs once, as soon as the bot has logged in and is online.",
    category: "bot",
    icon: "fa-solid fa-power-off",
    keywords: ["ready", "online", "logged in", "startup", "start"],
    block: {
      type: "main_ready",
      body: { name: "event", check: "default" },
      text: "when the bot is logged in",
      inline: false,
    },
    listen: '"clientReady"',
    params: [],
  }),
];

const actions = [
  action({
    id: "note_group",
    label: "Group steps with a note",
    description:
      "Keeps some steps together under a note so they're easier to find. The steps still run.",
    category: "notes",
    icon: "fa-solid fa-layer-group",
    keywords: ["comment", "group", "section", "label"],
    block: {
      type: "comment_statement",
      text: ["// {TEXT}", "{CODE}"],
      parts: {
        TEXT: { part: "text", value: "comment that runs the code inside" },
        CODE: { check: "default" },
      },
      colour: "#476586",
    },
    inputs: [input.text("TEXT", "Note", { default: "", allowValues: false })],
    branches: [{ key: "CODE", label: "Steps" }],
    code: (ctx) => `// ${sanitizeComment(ctx.raw("TEXT"))}\n${ctx.branch("CODE")}`,
  }),
  action({
    id: "note",
    label: "Add a note",
    description: "A note for yourself. It doesn't do anything when the bot runs.",
    category: "notes",
    icon: "fa-solid fa-note-sticky",
    keywords: ["comment", "remember", "todo"],
    block: [
      {
        type: "comment_multiline",
        text: "// {TEXT}",
        parts: { TEXT: { part: "multiline", value: "multi-line\ncomment" } },
        colour: "#476586",
        previous: null,
        next: null,
      },
      {
        type: "comment_float",
        text: "// {TEXT}",
        parts: { TEXT: { part: "text", value: "comment" } },
        colour: "#476586",
        inline: true,
        previous: false,
        next: false,
      },
    ],
    inputs: [
      input.text("TEXT", "Note", {
        default: "",
        allowValues: false,
        placeholder: "Write anything here",
        multiline: true,
      }),
    ],
    code: (ctx) => `/* ${sanitizeComment(ctx.raw("TEXT"))} */\n`,
  }),
  action({
    id: "cooldown_run",
    label: "Run steps with a cooldown",
    description:
      "Runs the steps inside only if this user isn't on cooldown, then starts their cooldown.",
    category: "cooldowns",
    icon: "fa-solid fa-hourglass-start",
    keywords: ["cooldown", "rate limit", "spam", "wait"],
    block: {
      type: "cooldown_check",
      text: [
        "create cooldown",
        "command name: {command}",
        "duration (ms): {duration}",
        "for user: {user}",
        "then run: {code}",
      ],
      parts: { duration: { scale: 0.001 }, user: { check: "user" }, code: { check: "default" } },
      tooltip:
        "Runs the code only if the user is not on cooldown for this command. Optionally run code when the user is still on cooldown.",
      mutator: {
        options: "cooldown_check_options",
        fields: [
          {
            name: "oncooldown",
            label: "include 'on cooldown'",
            default: false,
            inputType: "statement",
            inputLabel: "if on cooldown:",
            valueCheck: "default",
          },
        ],
      },
    },
    inputs: [
      ...COOLDOWN_INPUTS.slice(0, 1),
      input.number("duration", "Cooldown (seconds)", {
        default: 5,
        help: "How long they have to wait before this runs for them again.",
      }),
      COOLDOWN_INPUTS[1],
    ],
    branches: [
      { key: "code", label: "Then" },
      { key: "oncooldown", label: "If they're still on cooldown", optional: true },
    ],
    code: (ctx) => {
      const keyVar = `disfuseCooldownKey${ctx.uid}`;
      const onCooldown = ctx.hasBranch("oncooldown") ? ctx.branch("oncooldown") : "";
      return `const ${keyVar} = ${cooldownKey(ctx.input("user"), ctx.input("command"))};
if (!disfuseCooldowns.has(${keyVar}) || disfuseCooldowns.get(${keyVar}) <= Date.now()) {
disfuseCooldowns.set(${keyVar}, Date.now() + ${ctx.input("duration")} * 1000);
${ctx.branch("code")}}${onCooldown ? ` else {\n${onCooldown}}` : ""}\n`;
    },
  }),
  action({
    id: "cooldown_start",
    label: "Start a cooldown",
    description: "Puts a user on cooldown for a number of seconds.",
    category: "cooldowns",
    icon: "fa-solid fa-hourglass-half",
    keywords: ["cooldown", "set cooldown"],
    block: {
      type: "cooldown_set",
      text: [
        "set cooldown on command: {command}",
        "to duration (ms): {duration}",
        "for user: {user}",
      ],
      parts: { duration: { scale: 0.001 }, user: { check: "user" } },
      inline: false,
      tooltip: "Starts the cooldown timer for the given user and command.",
    },
    inputs: [
      COOLDOWN_INPUTS[0],
      input.number("duration", "Cooldown (seconds)", { default: 5 }),
      COOLDOWN_INPUTS[1],
    ],
    code: (ctx) =>
      `disfuseCooldowns.set(${cooldownKey(ctx.input("user"), ctx.input("command"))}, Date.now() + ${ctx.input("duration")} * 1000);\n`,
  }),
  action({
    id: "cooldown_end",
    label: "End a cooldown",
    description: "Takes a user off cooldown right away.",
    category: "cooldowns",
    icon: "fa-solid fa-hourglass-end",
    keywords: ["reset cooldown", "clear cooldown", "remove cooldown"],
    block: {
      type: "cooldown_clear",
      text: ["clear cooldown for user: {user}", "on command: {command}"],
      parts: { user: { check: "user" } },
      inline: true,
      tooltip: "Removes the cooldown for the given user and command.",
    },
    inputs: [COOLDOWN_INPUTS[1], COOLDOWN_INPUTS[0]],
    code: (ctx) =>
      `disfuseCooldowns.delete(${cooldownKey(ctx.input("user"), ctx.input("command"))});\n`,
  }),
  action({
    id: "cooldown_end_all",
    label: "End all cooldowns",
    description: "Takes everyone off every cooldown.",
    category: "cooldowns",
    icon: "fa-solid fa-broom",
    keywords: ["reset cooldowns", "clear cooldowns"],
    block: {
      type: "cooldown_clearAll",
      text: "clear all cooldowns",
      inline: true,
      tooltip: "Removes every cooldown currently stored.",
    },
    code: () => "disfuseCooldowns.clear();\n",
  }),
  action({
    id: "bot_set_status",
    label: "Set the bot's status and activity",
    description: "Changes the bot's online status and the activity shown under its name.",
    category: "bot",
    icon: "fa-solid fa-circle-dot",
    keywords: ["presence", "activity", "playing", "watching", "status"],
    block: {
      type: "main_presence",
      text: [
        "set the presence of the bot",
        "status: {status}",
        "AFK: {afk}",
        "activity type: {activity_type}",
        "activity name: {activity_name}",
      ],
      parts: {
        status: {
          options: [
            ["online", "online"],
            ["idle", "idle"],
            ["invisible", "invisible"],
            ["do not disturb", "dnd"],
          ],
        },
        activity_type: {
          options: [
            ["Playing", "0"],
            ["Competing", "5"],
            ["Streaming", "1"],
            ["Listening", "2"],
            ["Watching", "3"],
            ["Custom", "4"],
          ],
        },
      },
    },
    inputs: [
      input.dropdown(
        "status",
        "Status",
        [
          ["Online", "online"],
          ["Idle", "idle"],
          ["Do not disturb", "dnd"],
          ["Invisible", "invisible"],
        ],
        { default: "online" },
      ),
      input.boolean("afk", "Away (AFK)", { default: false }),
      input.dropdown(
        "activity_type",
        "Activity",
        [
          ["Playing", "0"],
          ["Watching", "3"],
          ["Listening to", "2"],
          ["Competing in", "5"],
          ["Streaming", "1"],
          ["Custom status", "4"],
        ],
        { default: "0" },
      ),
      input.text("activity_name", "Activity text", { default: "", placeholder: "Minecraft" }),
    ],
    sentence: "Set status to {status}",
    code: (ctx) => `client.user.setPresence({
  status: ${ctx.input("status")},
  afk: ${ctx.input("afk")},
  activities: [{
    name: ${ctx.input("activity_name")},
    type: ${Number(ctx.raw("activity_type")) || 0}
  }]
});\n`,
  }),
  action({
    id: "bot_shutdown",
    label: "Shut down the bot",
    description: "Logs the bot out and stops it. It stays offline until you start it again.",
    category: "bot",
    icon: "fa-solid fa-plug-circle-xmark",
    keywords: ["stop", "destroy", "logout", "offline"],
    block: { type: "main_destroy", text: "shutdown the bot" },
    code: () => "await client.destroy();\n",
  }),
  action({
    id: "bot_login_again",
    label: "Log in with another token",
    description:
      "Starts the bot again with a different bot token. Commands and events set up before this keep listening on the old login.",
    category: "bot",
    group: "Advanced",
    icon: "fa-solid fa-key",
    keywords: ["token", "login", "start bot"],
    block: {
      type: "main_botStart",
      text: ["start bot with token: {token}", "mobile: {mobile}"],
      parts: { mobile: { part: "checkbox" } },
      inline: false,
    },
    inputs: [
      input.text("token", "Bot token", {
        default: "",
        help: "Use the Secret value so the token isn't saved in your steps.",
        placeholder: "Paste a secret here",
      }),
    ],
    code: (ctx) => `client = new Discord.Client({
  intents: Object.values(Discord.GatewayIntentBits)
});
client.login(${ctx.input("token")});\n`,
  }),
];

const values = [
  value({
    id: "note_value",
    label: "Value with a note",
    description: "Passes a value through unchanged, with a note attached for yourself.",
    category: "notes",
    icon: "fa-solid fa-comment",
    keywords: ["comment"],
    block: {
      type: "comment_value",
      text: ["{VALUE}", "// {TEXT}"],
      parts: { TEXT: { part: "text", value: "comment" } },
      colour: "#476586",
      init: (block, Blockly) =>
        block.setOnChange((event) => {
          if (event.type === Blockly.Events.UI) return;
        }),
      mixin: {
        getBlockType() {
          return this.getInput("VALUE")?.connection?.targetConnection?.check || null;
        },
      },
    },
    output: ANY,
    inputs: [
      input.slot("VALUE", "Value", ANY),
      input.text("TEXT", "Note", { default: "", allowValues: false }),
    ],
    code: (ctx) => `${ctx.code("VALUE") || "null"} /* ${sanitizeComment(ctx.raw("TEXT"))} */`,
  }),
  value({
    id: "cooldown_is_active",
    label: "User is on cooldown?",
    description: "True if the user is still on this cooldown.",
    category: "cooldowns",
    icon: "fa-solid fa-hourglass",
    keywords: ["cooldown", "has cooldown"],
    block: {
      type: "cooldown_has",
      text: ["is user {user}", "on cooldown for command {command}"],
      parts: { user: { check: "user" } },
      inline: true,
      tooltip: "Returns true if the user is currently on cooldown for the given command.",
    },
    output: "Boolean",
    inputs: [COOLDOWN_INPUTS[1], COOLDOWN_INPUTS[0]],
    code: (ctx) => {
      const key = cooldownKey(ctx.input("user"), ctx.input("command"));
      return `(disfuseCooldowns.has(${key}) && disfuseCooldowns.get(${key}) > Date.now())`;
    },
  }),
  value({
    id: "cooldown_time_left",
    label: "Cooldown time left",
    description: "How many seconds are left before the user's cooldown ends (0 if it has ended).",
    category: "cooldowns",
    icon: "fa-solid fa-stopwatch",
    keywords: ["cooldown", "remaining", "time left"],
    block: {
      type: "cooldown_get",
      text: ["cooldown left for user {user}", "on command {command}"],
      parts: { user: { check: "user" } },
      inline: true,
      tooltip: "Returns how many milliseconds are left until the cooldown for the command ends.",
      code: (ctx) =>
        `Math.max(0, (disfuseCooldowns.get(${cooldownKey(ctx.input("user"), ctx.input("command"))}) ?? 0) - Date.now())`,
    },
    output: "Number",
    inputs: [COOLDOWN_INPUTS[1], COOLDOWN_INPUTS[0]],
    code: (ctx) =>
      `Math.ceil(Math.max(0, (disfuseCooldowns.get(${cooldownKey(ctx.input("user"), ctx.input("command"))}) ?? 0) - Date.now()) / 1000)`,
  }),
  value({
    id: "bot_secret",
    label: "Secret",
    description:
      "Reads one of the secrets you saved on your bot's dashboard, like an API key, without putting it in your steps.",
    category: "bot",
    icon: "fa-solid fa-user-secret",
    keywords: ["env", "environment", "api key", "password", "token"],
    block: {
      type: "main_env",
      text: "get secret with name: {value}",
      output: null,
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["value"],
          message: "You must specify the name of the ENV to get",
        },
      ],
    },
    output: "String",
    inputs: [
      input.text("value", "Secret name", {
        default: "",
        placeholder: "API_KEY",
        suggest: "secrets",
      }),
    ],
    code: (ctx) => `process.env[${ctx.input("value")}]`,
  }),
  value({
    id: "bot_user",
    label: "The bot",
    description: "The bot's own user account.",
    category: "bot",
    icon: "fa-solid fa-robot",
    keywords: ["client", "me", "self"],
    block: { type: "main_bot", text: "bot" },
    output: "user",
    code: () => "client.user",
  }),
  value({
    id: "bot_ping",
    label: "Bot's ping",
    description: "How long Discord takes to answer the bot, in milliseconds.",
    category: "bot",
    icon: "fa-solid fa-signal",
    keywords: ["latency", "ms", "speed"],
    block: { type: "main_ping", text: "current bot latency ping" },
    output: "Number",
    code: () => "client.ws.ping",
  }),
  value({
    id: "bot_count",
    label: "Number of servers, users or channels the bot has",
    description:
      "How many servers the bot is in, or how many users, channels or commands it knows about.",
    category: "bot",
    icon: "fa-solid fa-hashtag",
    keywords: ["server count", "guild count", "how many", "servers", "users"],
    block: {
      type: "main_numberof",
      text: ["number of {property}", "of the bot"],
      parts: {
        property: {
          options: [
            ["servers", "guilds"],
            ["users", "users"],
            ["channels", "channels"],
            ["commands", "application.commands"],
          ],
        },
      },
      inline: true,
    },
    output: "Number",
    inputs: [
      input.dropdown(
        "property",
        "Count",
        [
          ["Servers", "guilds"],
          ["Users", "users"],
          ["Channels", "channels"],
          ["Commands", "application.commands"],
        ],
        { default: "guilds" },
      ),
    ],
    sentence: "Number of {property}",
    code: (ctx) =>
      ctx.raw("property") === "application.commands"
        ? "(await client.application.commands.fetch()).size"
        : `client.${ctx.raw("property")}.cache.size`,
  }),
  value({
    id: "bot_logged_in_at",
    label: "When the bot logged in",
    description: "The date and time the bot last logged in.",
    category: "bot",
    icon: "fa-solid fa-clock",
    keywords: ["ready at", "uptime", "start time"],
    block: { type: "main_readyAt", text: "time since the bot logged in", inline: false },
    output: "date",
    code: () => "client.readyAt",
  }),
];

const components = [];

const blocks = [
  block({
    type: "comment_stack",
    text: "// {TEXT}",
    parts: { TEXT: { part: "text", value: "comment" } },
    colour: "#476586",
    inline: true,
    previous: null,
    next: null,
    code: (ctx) => {
      var text = ctx.field("TEXT");
      var code = `// ${sanitizeComment(text)}\n`;
      return code;
    },
  }),
  block({
    type: "comment_stackImage",
    text: "// image {TEXT}",
    parts: {
      TEXT: {
        part: "text",
        value: "https://disfuse.xyz/media/disfuse-clear.png",
        validator: (value) => {
          try {
            new URL(value);
            return value;
          } catch {
            return null;
          }
        },
      },
    },
    colour: "#476586",
    inline: false,
    previous: null,
    next: null,
    code: (ctx) => {
      var text = ctx.field("TEXT");
      var code = `// image (${text})\n`;
      return code;
    },
    init: (block, Blockly) => {
      block.imageField = new Blockly.FieldImage("", 200, 200, { alt: "*", flipRtl: "FALSE" });
      block.appendDummyInput().appendField(block.imageField);
      block.imageField.setValue(block.getFieldValue("TEXT"));
      block.setOnChange(() => block.imageField.setValue(block.getFieldValue("TEXT")));
    },
  }),
  block({
    type: "main_token",
    text: ["log in to bot with token: {token}", "mobile: {mobile}"],
    parts: { token: { part: "value", check: "String" }, mobile: { part: "checkbox" } },
    inline: false,
    restrictions: [
      {
        type: "notEmpty",
        blockTypes: ["token"],
        message: "You must specify the token of your bot",
      },
    ],
    code: (ctx) => {
      return "";
    },
  }),
];

export default {
  events,
  actions,
  values,
  components,
  contexts: [],

  blocks,
};
