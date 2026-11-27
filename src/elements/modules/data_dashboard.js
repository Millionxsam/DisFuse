/* =====================================================================
   Builder catalog: databases and dashboard data
   ---------------------------------------------------------------------
   Saving data so the bot remembers it after a restart: simple
   databases (JSON files next to the bot) and the settings people save
   on the bot's DisFuse website dashboard.
   ===================================================================== */

import { ANY, group, input } from "../define.js";

const { action, value, block } = group({ colour: "#014f98" });

/* easy-json-database keeps each database in one JSON file. */
const DATABASE_PACKAGE = ["easy-json-database"];

/* The block editor needed a "create database" block before any other
   database block. Here a database is made the first time it's used. */
const DATABASE = {
  key: "disfuseDatabase",
  code: `/* Simple databases */
function disfuseDatabase(name) {
  const key = String(name || "database");
  if (!databases[key]) databases[key] = new easy_json_database(\`./\${key.replace(/[^\\w.-]/g, "_")}.json\`);
  return databases[key];
}`,
};

/* The same helper the block editor's export uses to reach a website's
   dashboard data, authenticated with the bot's own token. */
const DASHBOARD = {
  key: "disfuseDashboard",
  code: `/* DisFuse dashboard data */
const DISFUSE_DASHBOARD_API = "https://api.disfuse.xyz/dashboard";
async function disfuseDashboard(method, scope, id, key, value) {
  if (!id) return null;
  try {
    const response = await axios({
      method,
      url: \`\${DISFUSE_DASHBOARD_API}/\${scope}/\${encodeURIComponent(String(id))}\` +
        (key ? \`/\${encodeURIComponent(String(key))}\` : ""),
      headers: { Authorization: \`Bot \${process.env.DISFUSE_SECURE_BOT_TOKEN}\` },
      ...(value === undefined ? {} : { data: { value } }),
    });
    return method === "get" ? (response.data?.value ?? null) : response.data;
  } catch (error) {
    console.error("DisFuse dashboard request failed:", error.response?.data?.error || error.message);
    return null;
  }
}`,
};

/* The `_v2` database blocks pick the database from a dropdown of every
   "create database" block in the project (src/blocks/lib/databaseNames.js),
   so a typo can't point them at a database that doesn't exist. The text
   versions stay so saved projects still open; they're in the Legacy
   category. Both generate the same code. */
const DATABASE_DROPDOWN = {
  part: "field",
  field: (Blockly) =>
    Blockly.fieldRegistry.fromJson({ type: "field_database_dropdown" }),
};

const DATABASE_EXISTS = {
  type: "custom",
  check: (block) => block.getField("db")?.databaseExists?.() ?? true,
  message:
    "No database with this name exists. Create one with the 'create database' block, or pick another from the dropdown",
};

const events = [];

const actions = [
  action({
    id: "dashboard_server_set",
    label: "Save a server setting to the dashboard",
    description:
      "Saves a setting for a server, so it shows on your website's dashboard.",
    category: "dashboard",
    group: "Server settings",
    icon: "fa-solid fa-floppy-disk",
    keywords: ["dashboard", "website", "setting", "save", "set", "server"],
    block: {
      type: "dashboard_setServer",
      text: ["set data {key}", "to {value}", "for server with ID {id}"],
      inline: true,
      tooltip:
        "Saves a value for this server. It shows up on your website's dashboard.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["key"],
          message: "You must specify the data key",
        },
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the server ID",
        },
        {
          type: "notEmpty",
          blockTypes: ["value"],
          message: "You must specify the value to save",
        },
      ],
    },
    inputs: [
      input.text("key", "Setting", {
        default: "",
        help: "The name of the setting on your website's dashboard.",
      }),
      input.slot("value", "To", ANY),
      input.text("id", "Server ID", { default: "" }),
    ],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `await disfuseDashboard("put", "guild", ${ctx.input("id")}, ${ctx.input("key")}, ${ctx.has("value") ? ctx.input("value") : "null"});\n`,
  }),
  action({
    id: "dashboard_server_delete",
    label: "Remove a server setting from the dashboard",
    description:
      "Deletes a setting saved for a server on your website's dashboard.",
    category: "dashboard",
    group: "Server settings",
    icon: "fa-solid fa-eraser",
    keywords: ["dashboard", "website", "setting", "delete", "remove", "server"],
    block: {
      type: "dashboard_deleteServer",
      text: ["delete data {key}", "for server with ID {id}"],
      inline: true,
      tooltip: "Removes a stored value for this server.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["key"],
          message: "You must specify the data key",
        },
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the server ID",
        },
      ],
    },
    inputs: [
      input.text("key", "Setting", {
        default: "",
        help: "The name of the setting on your website's dashboard.",
      }),
      input.text("id", "Server ID", { default: "" }),
    ],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `await disfuseDashboard("delete", "guild", ${ctx.input("id")}, ${ctx.input("key")});\n`,
  }),
  action({
    id: "dashboard_user_set",
    label: "Save a user setting to the dashboard",
    description:
      "Saves a setting for a user, so it shows on your website's dashboard.",
    category: "dashboard",
    group: "User settings",
    icon: "fa-solid fa-floppy-disk",
    keywords: ["dashboard", "website", "setting", "save", "set", "user"],
    block: {
      type: "dashboard_setUser",
      text: ["set data {key}", "to {value}", "for user with ID {id}"],
      inline: true,
      tooltip:
        "Saves a value for this user. It shows up on your website's dashboard.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["key"],
          message: "You must specify the data key",
        },
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the user ID",
        },
        {
          type: "notEmpty",
          blockTypes: ["value"],
          message: "You must specify the value to save",
        },
      ],
    },
    inputs: [
      input.text("key", "Setting", {
        default: "",
        help: "The name of the setting on your website's dashboard.",
      }),
      input.slot("value", "To", ANY),
      input.text("id", "User ID", { default: "" }),
    ],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `await disfuseDashboard("put", "user", ${ctx.input("id")}, ${ctx.input("key")}, ${ctx.has("value") ? ctx.input("value") : "null"});\n`,
  }),
  action({
    id: "dashboard_user_delete",
    label: "Remove a user setting from the dashboard",
    description:
      "Deletes a setting saved for a user on your website's dashboard.",
    category: "dashboard",
    group: "User settings",
    icon: "fa-solid fa-eraser",
    keywords: ["dashboard", "website", "setting", "delete", "remove", "user"],
    block: {
      type: "dashboard_deleteUser",
      text: ["delete data {key}", "for user with ID {id}"],
      inline: true,
      tooltip: "Removes a stored value for this user.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["key"],
          message: "You must specify the data key",
        },
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the user ID",
        },
      ],
    },
    inputs: [
      input.text("key", "Setting", {
        default: "",
        help: "The name of the setting on your website's dashboard.",
      }),
      input.text("id", "User ID", { default: "" }),
    ],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `await disfuseDashboard("delete", "user", ${ctx.input("id")}, ${ctx.input("key")});\n`,
  }),
  action({
    id: "db_set",
    label: "Save to a database",
    description:
      "Saves a value under a key in a database. Anything already saved there is replaced.",
    category: "data",
    group: "Databases",
    icon: "fa-solid fa-floppy-disk",
    keywords: ["database", "set", "save", "store", "db"],
    block: [
      {
        type: "db_set_v2",
        text: ["set {id}", "to {val}", "in the database {db}"],
        parts: { db: DATABASE_DROPDOWN },
        colour: "C66953",
        inline: true,
        restrictions: [
          DATABASE_EXISTS,
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key to modify",
          },
          {
            type: "notEmpty",
            blockTypes: ["val"],
            message: "You must specify the value",
          },
        ],
      },
      {
        type: "db_set",
        text: ["set {id}", "to {val}", "in the database with the name: {db}"],
        parts: { db: { part: "text", value: "database" } },
        colour: "C66953",
        inline: true,
        restrictions: [
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key to modify",
          },
          {
            type: "notEmpty",
            blockTypes: ["val"],
            message: "You must specify the value",
          },
          {
            type: "blockNotFound",
            blockTypes: ["db_create"],
            message:
              "You must create a database first with the 'create database' block",
          },
        ],
      },
    ],
    inputs: [
      input.text("id", "Key", { default: "" }),
      input.slot("val", "Value", ANY),
      input.text("db", "Database", {
        default: "database",
        help: "Each name is its own file, like database.json. It's made the first time you use it.",
      }),
    ],
    dependencies: DATABASE_PACKAGE,
    setup: [DATABASE],
    code: (ctx) =>
      `disfuseDatabase(${ctx.input("db")}).set(${ctx.input("id")}, ${ctx.has("val") ? ctx.input("val") : "null"});\n`,
  }),
  action({
    id: "db_delete",
    label: "Delete from a database",
    description: "Removes a key and its value from a database.",
    category: "data",
    group: "Databases",
    icon: "fa-solid fa-eraser",
    keywords: ["database", "delete", "remove", "db"],
    block: [
      {
        type: "db_del_v2",
        text: ["delete {id}", "in the database {db}"],
        parts: { db: DATABASE_DROPDOWN },
        colour: "C66953",
        inline: true,
        restrictions: [
          DATABASE_EXISTS,
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key",
          },
        ],
      },
      {
        type: "db_del",
        text: ["delete {id}", "in the database with the name: {db}"],
        parts: { db: { part: "text", value: "database" } },
        colour: "C66953",
        inline: true,
        restrictions: [
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key",
          },
          {
            type: "blockNotFound",
            blockTypes: ["db_create"],
            message:
              "You must create a database first with the 'create database' block",
          },
        ],
      },
    ],
    inputs: [
      input.text("id", "Key", { default: "" }),
      input.text("db", "Database", {
        default: "database",
        help: "Each name is its own file, like database.json. It's made the first time you use it.",
      }),
    ],
    dependencies: DATABASE_PACKAGE,
    setup: [DATABASE],
    code: (ctx) =>
      `disfuseDatabase(${ctx.input("db")}).delete(${ctx.input("id")});\n`,
  }),
  action({
    id: "db_add",
    label: "Add to a number in a database",
    description:
      "Adds to the number saved under a key. Starts from 0 if nothing is saved yet.",
    category: "data",
    group: "Databases",
    icon: "fa-solid fa-plus",
    keywords: ["database", "add", "increase", "points", "coins", "db"],
    block: [
      {
        type: "db_add_v2",
        text: ["add {val}", "to {id}", "in the database {db}"],
        parts: { db: DATABASE_DROPDOWN },
        colour: "C66953",
        inline: true,
        restrictions: [
          DATABASE_EXISTS,
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key to modify",
          },
          {
            type: "notEmpty",
            blockTypes: ["val"],
            message: "You must specify the value",
          },
        ],
      },
      {
        type: "db_add",
        text: ["add {val}", "to {id}", "in the database with the name: {db}"],
        parts: { db: { part: "text", value: "database" } },
        colour: "C66953",
        inline: true,
        restrictions: [
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key to modify",
          },
          {
            type: "notEmpty",
            blockTypes: ["val"],
            message: "You must specify the value",
          },
          {
            type: "blockNotFound",
            blockTypes: ["db_create"],
            message:
              "You must create a database first with the 'create database' block",
          },
        ],
      },
    ],
    inputs: [
      input.number("val", "Add", { default: 1 }),
      input.text("id", "To key", { default: "" }),
      input.text("db", "Database", {
        default: "database",
        help: "Each name is its own file, like database.json. It's made the first time you use it.",
      }),
    ],
    dependencies: DATABASE_PACKAGE,
    setup: [DATABASE],
    code: (ctx) =>
      `disfuseDatabase(${ctx.input("db")}).add(${ctx.input("id")}, ${ctx.input("val")});\n`,
  }),
  action({
    id: "db_subtract",
    label: "Subtract from a number in a database",
    description: "Subtracts from the number saved under a key.",
    category: "data",
    group: "Databases",
    icon: "fa-solid fa-minus",
    keywords: ["database", "subtract", "decrease", "remove points", "db"],
    block: [
      {
        type: "db_sub_v2",
        text: ["subtract {val}", "from {id}", "in the database {db}"],
        parts: { db: DATABASE_DROPDOWN },
        colour: "C66953",
        inline: true,
        restrictions: [DATABASE_EXISTS],
      },
      {
        type: "db_sub",
        text: [
          "subtract {val}",
          "from {id}",
          "in the database with the name: {db}",
        ],
        parts: { db: { part: "text", value: "database" } },
        colour: "C66953",
        inline: true,
      },
    ],
    inputs: [
      input.number("val", "Take away", { default: 1 }),
      input.text("id", "From key", { default: "" }),
      input.text("db", "Database", {
        default: "database",
        help: "Each name is its own file, like database.json. It's made the first time you use it.",
      }),
    ],
    dependencies: DATABASE_PACKAGE,
    setup: [DATABASE],
    code: (ctx) =>
      `disfuseDatabase(${ctx.input("db")}).subtract(${ctx.input("id")}, ${ctx.input("val")});\n`,
  }),
  action({
    id: "db_push",
    label: "Add to a list in a database",
    description:
      "Adds a value to the end of the list saved under a key. Makes the list if there isn't one.",
    category: "data",
    group: "Databases",
    icon: "fa-solid fa-list",
    keywords: ["database", "push", "append", "list", "db"],
    block: [
      {
        type: "db_push_v2",
        text: ["push {val}", "to {id}", "in the database {db}"],
        parts: { db: DATABASE_DROPDOWN },
        colour: "C66953",
        inline: true,
        restrictions: [
          DATABASE_EXISTS,
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key to modify",
          },
          {
            type: "notEmpty",
            blockTypes: ["val"],
            message: "You must specify the value",
          },
        ],
      },
      {
        type: "db_push",
        text: ["push {val}", "to {id}", "in the database with the name: {db}"],
        parts: { db: { part: "text", value: "database" } },
        colour: "C66953",
        inline: true,
        restrictions: [
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key to modify",
          },
          {
            type: "notEmpty",
            blockTypes: ["val"],
            message: "You must specify the value",
          },
          {
            type: "blockNotFound",
            blockTypes: ["db_create"],
            message:
              "You must create a database first with the 'create database' block",
          },
        ],
      },
    ],
    inputs: [
      input.slot("val", "Add", ANY),
      input.text("id", "To key", { default: "" }),
      input.text("db", "Database", {
        default: "database",
        help: "Each name is its own file, like database.json. It's made the first time you use it.",
      }),
    ],
    dependencies: DATABASE_PACKAGE,
    setup: [DATABASE],
    code: (ctx) =>
      `disfuseDatabase(${ctx.input("db")}).push(${ctx.input("id")}, ${ctx.has("val") ? ctx.input("val") : "null"});\n`,
  }),
  action({
    id: "db_clear",
    label: "Empty a database",
    description: "Deletes everything saved in a database.",
    category: "data",
    group: "Databases",
    icon: "fa-solid fa-trash-can",
    keywords: ["database", "clear", "reset", "wipe", "db"],
    block: [
      {
        type: "db_clear_v2",
        text: "clear all data in the database {db}",
        parts: { db: DATABASE_DROPDOWN },
        colour: "C66953",
        inline: true,
        restrictions: [DATABASE_EXISTS],
      },
      {
        type: "db_clear",
        text: "clear all data in the database with the name: {db}",
        parts: { db: { part: "text", value: "database" } },
        colour: "C66953",
        inline: true,
        restrictions: [
          {
            type: "blockNotFound",
            blockTypes: ["db_create"],
            message:
              "You must create a database first with the 'create database' block",
          },
        ],
      },
    ],
    inputs: [
      input.text("db", "Database", {
        default: "database",
        help: "Each name is its own file, like database.json. It's made the first time you use it.",
      }),
    ],
    dependencies: DATABASE_PACKAGE,
    setup: [DATABASE],
    code: (ctx) => `disfuseDatabase(${ctx.input("db")}).clear();\n`,
  }),
];

const values = [
  value({
    id: "dashboard_server_get",
    label: "Server setting from the dashboard",
    description:
      "A setting that was saved for a server on your website's dashboard. Empty if it isn't set.",
    category: "dashboard",
    group: "Server settings",
    icon: "fa-solid fa-sliders",
    keywords: ["dashboard", "website", "setting", "get", "server"],
    block: {
      type: "dashboard_getServer",
      text: ["get data {key}", "for server with ID {id}"],
      inline: true,
      tooltip:
        "Reads a value that was set for this server on your website's dashboard.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["key"],
          message: "You must specify the data key",
        },
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the server ID",
        },
      ],
    },
    output: ANY,
    inputs: [
      input.text("key", "Setting", {
        default: "",
        help: "The name of the setting on your website's dashboard.",
      }),
      input.text("id", "Server ID", { default: "" }),
    ],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `(await disfuseDashboard("get", "guild", ${ctx.input("id")}, ${ctx.input("key")}))`,
  }),
  value({
    id: "dashboard_server_has",
    label: "Server has a dashboard setting?",
    description:
      "True if a setting has been saved for a server on your website's dashboard.",
    category: "dashboard",
    group: "Server settings",
    icon: "fa-solid fa-circle-question",
    keywords: ["dashboard", "website", "setting", "exists", "server"],
    block: {
      type: "dashboard_hasServer",
      text: ["data {key}", "is set for server with ID {id}"],
      inline: true,
      tooltip: "Whether this server has a value stored for that key.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["key"],
          message: "You must specify the data key",
        },
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the server ID",
        },
      ],
    },
    output: "Boolean",
    inputs: [
      input.text("key", "Setting", {
        default: "",
        help: "The name of the setting on your website's dashboard.",
      }),
      input.text("id", "Server ID", { default: "" }),
    ],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `((await disfuseDashboard("get", "guild", ${ctx.input("id")}, ${ctx.input("key")})) !== null)`,
  }),
  value({
    id: "dashboard_server_all",
    label: "All dashboard settings of a server",
    description:
      "Every setting saved for a server on your website's dashboard, as an object.",
    category: "dashboard",
    group: "Server settings",
    icon: "fa-solid fa-table-list",
    keywords: ["dashboard", "website", "all settings", "server"],
    block: {
      type: "dashboard_allServer",
      text: "all dashboard data for server with ID {id}",
      inline: true,
      tooltip:
        "Every setting stored for this server, as an object of key/value pairs.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the server ID",
        },
      ],
    },
    output: "object",
    inputs: [input.text("id", "Server ID", { default: "" })],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `((await disfuseDashboard("get", "guild", ${ctx.input("id")}))?.data ?? {})`,
  }),
  value({
    id: "dashboard_user_get",
    label: "User setting from the dashboard",
    description:
      "A setting that was saved for a user on your website's dashboard. Empty if it isn't set.",
    category: "dashboard",
    group: "User settings",
    icon: "fa-solid fa-sliders",
    keywords: ["dashboard", "website", "setting", "get", "user"],
    block: {
      type: "dashboard_getUser",
      text: ["get data {key}", "for user with ID {id}"],
      inline: true,
      tooltip:
        "Reads a value that was set for this user on your website's dashboard.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["key"],
          message: "You must specify the data key",
        },
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the user ID",
        },
      ],
    },
    output: ANY,
    inputs: [
      input.text("key", "Setting", {
        default: "",
        help: "The name of the setting on your website's dashboard.",
      }),
      input.text("id", "User ID", { default: "" }),
    ],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `(await disfuseDashboard("get", "user", ${ctx.input("id")}, ${ctx.input("key")}))`,
  }),
  value({
    id: "dashboard_user_has",
    label: "User has a dashboard setting?",
    description:
      "True if a setting has been saved for a user on your website's dashboard.",
    category: "dashboard",
    group: "User settings",
    icon: "fa-solid fa-circle-question",
    keywords: ["dashboard", "website", "setting", "exists", "user"],
    block: {
      type: "dashboard_hasUser",
      text: ["data {key}", "is set for user with ID {id}"],
      inline: true,
      tooltip: "Whether this user has a value stored for that key.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["key"],
          message: "You must specify the data key",
        },
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the user ID",
        },
      ],
    },
    output: "Boolean",
    inputs: [
      input.text("key", "Setting", {
        default: "",
        help: "The name of the setting on your website's dashboard.",
      }),
      input.text("id", "User ID", { default: "" }),
    ],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `((await disfuseDashboard("get", "user", ${ctx.input("id")}, ${ctx.input("key")})) !== null)`,
  }),
  value({
    id: "dashboard_user_all",
    label: "All dashboard settings of a user",
    description:
      "Every setting saved for a user on your website's dashboard, as an object.",
    category: "dashboard",
    group: "User settings",
    icon: "fa-solid fa-table-list",
    keywords: ["dashboard", "website", "all settings", "user"],
    block: {
      type: "dashboard_allUser",
      text: "all dashboard data for user with ID {id}",
      inline: true,
      tooltip:
        "Every setting stored for this user, as an object of key/value pairs.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the user ID",
        },
      ],
    },
    output: "object",
    inputs: [input.text("id", "User ID", { default: "" })],
    dependencies: ["axios"],
    setup: [DASHBOARD],
    code: (ctx) =>
      `((await disfuseDashboard("get", "user", ${ctx.input("id")}))?.data ?? {})`,
  }),
  value({
    id: "db_get",
    label: "Value from a database",
    description: "What's saved under a key in a database. Empty if nothing is.",
    category: "data",
    group: "Databases",
    icon: "fa-solid fa-database",
    keywords: ["database", "get", "load", "db"],
    block: [
      {
        type: "db_get_v2",
        text: ["get {id}", "from the database {db}"],
        parts: { db: DATABASE_DROPDOWN },
        colour: "C66953",
        inline: true,
        restrictions: [
          DATABASE_EXISTS,
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key",
          },
        ],
      },
      {
        type: "db_get",
        text: ["get {id}", "from the database with the name: {db}"],
        parts: { db: { part: "text", value: "database" } },
        colour: "C66953",
        inline: true,
        restrictions: [
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key",
          },
          {
            type: "blockNotFound",
            blockTypes: ["db_create"],
            message:
              "You must create a database first with the 'create database' block",
          },
        ],
      },
    ],
    output: ANY,
    inputs: [
      input.text("id", "Key", { default: "" }),
      input.text("db", "Database", {
        default: "database",
        help: "Each name is its own file, like database.json. It's made the first time you use it.",
      }),
    ],
    dependencies: DATABASE_PACKAGE,
    setup: [DATABASE],
    code: (ctx) =>
      `disfuseDatabase(${ctx.input("db")}).get(${ctx.input("id")})`,
  }),
  value({
    id: "db_has",
    label: "Database has a key?",
    description: "True if something is saved under a key in a database.",
    category: "data",
    group: "Databases",
    icon: "fa-solid fa-circle-question",
    keywords: ["database", "has", "exists", "db"],
    block: [
      {
        type: "db_has_v2",
        text: ["{id}", "exists in the database {db} ?"],
        parts: { db: DATABASE_DROPDOWN },
        colour: "C66953",
        inline: true,
        restrictions: [
          DATABASE_EXISTS,
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key",
          },
        ],
      },
      {
        type: "db_has",
        text: ["{id}", "exists in the database with the name: {db} ?"],
        parts: { db: { part: "text", value: "database" } },
        colour: "C66953",
        inline: true,
        restrictions: [
          {
            type: "notEmpty",
            blockTypes: ["id"],
            message: "You must specify the key",
          },
          {
            type: "blockNotFound",
            blockTypes: ["db_create"],
            message:
              "You must create a database first with the 'create database' block",
          },
        ],
      },
    ],
    output: "Boolean",
    inputs: [
      input.text("id", "Key", { default: "" }),
      input.text("db", "Database", {
        default: "database",
        help: "Each name is its own file, like database.json. It's made the first time you use it.",
      }),
    ],
    dependencies: DATABASE_PACKAGE,
    setup: [DATABASE],
    code: (ctx) =>
      `disfuseDatabase(${ctx.input("db")}).has(${ctx.input("id")})`,
  }),
  value({
    id: "db_all",
    label: "Everything in a database",
    description:
      "Every key and value in a database, as a list of { key, data } items.",
    category: "data",
    group: "Databases",
    icon: "fa-solid fa-table-list",
    keywords: ["database", "all", "list", "db"],
    block: [
      {
        type: "db_all_v2",
        text: "all data from the database {db}",
        parts: { db: DATABASE_DROPDOWN },
        colour: "C66953",
        inline: true,
        restrictions: [DATABASE_EXISTS],
      },
      {
        type: "db_all",
        text: "all data from the database with the name: {db}",
        parts: { db: { part: "text", value: "database" } },
        colour: "C66953",
        inline: true,
      },
    ],
    output: "Array",
    inputs: [
      input.text("db", "Database", {
        default: "database",
        help: "Each name is its own file, like database.json. It's made the first time you use it.",
      }),
    ],
    dependencies: DATABASE_PACKAGE,
    setup: [DATABASE],
    code: (ctx) => `disfuseDatabase(${ctx.input("db")}).all()`,
  }),
];

const components = [];

const blocks = [
  block({
    type: "db_create",
    text: "create database with name: {name} with file: {path} .json",
    parts: {
      name: { part: "text", value: "database" },
      path: { part: "text", value: "database" },
    },
    colour: "C66953",
    code: (ctx) => {
      var text_name = ctx.field("name");
      var text_path = ctx.field("path");

      var code = `databases["${text_name}"] = new easy_json_database("./${text_path}.json");`;
      return code;
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
