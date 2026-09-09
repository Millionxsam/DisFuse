import * as Blockly from "blockly";
import javascript, { Order } from "blockly/javascript";
import { createRestrictions } from "./lib/restrictions";

/* =====================================================================
   Dashboard blocks
   ---------------------------------------------------------------------
   The bridge between a bot's Blockly code and the settings people entered
   through its DisFuse Website dashboard.

   Two independent scopes, matching the Websites data model:

     guild — one value per Discord server (website.data.guilds[guildId])
     user  — one value per Discord user   (website.data.users[userId])

   Generated code calls the DisFuse dashboard API authenticated with the
   bot's own token, so a bot can only ever reach its own website's data.
   Every read is awaited, so a "get" block can be dropped straight into a
   value input and yields the real value rather than a Promise.
   ===================================================================== */

const COLOUR = "#014f98";

/** Emitted once per project by functions/updateCode.js. */
export const dashboardHelpers = `
/* DisFuse dashboard data */
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
    console.error(
      "DisFuse dashboard request failed:",
      error.response?.data?.error || error.message
    );
    return null;
  }
}`.trim();

/* ---- Scope helpers ---------------------------------------------------- */

const SCOPES = [
  {
    id: "guild",
    /* "server" reads better in the UI; "guild" is what the API calls it. */
    noun: "server",
    idLabel: "server ID",
    idCheck: "String",
  },
  { id: "user", noun: "user", idLabel: "user ID", idCheck: "String" },
];

function defineScopeBlocks({ id: scope, noun, idLabel, idCheck }) {
  const suffix = scope === "guild" ? "Server" : "User";

  /* ---- get ---- */

  Blockly.Blocks[`dashboard_get${suffix}`] = {
    init: function () {
      this.appendValueInput("key").setCheck("String").appendField("get data");
      this.appendValueInput("id")
        .setCheck(idCheck)
        .appendField(`for ${noun} with ID`);
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour(COLOUR);
      this.setTooltip(
        `Reads a value that was set for this ${noun} on your website's dashboard.`,
      );
    },
  };

  javascript.javascriptGenerator.forBlock[`dashboard_get${suffix}`] = function (
    block,
    generator,
  ) {
    const key = generator.valueToCode(block, "key", Order.NONE) || "''";
    const id = generator.valueToCode(block, "id", Order.NONE) || "null";

    return [
      `(await disfuseDashboard("get", "${scope}", ${id}, ${key}))`,
      Order.AWAIT,
    ];
  };

  /* ---- set ---- */

  Blockly.Blocks[`dashboard_set${suffix}`] = {
    init: function () {
      this.appendValueInput("key").setCheck("String").appendField("set data");
      this.appendValueInput("value").setCheck(null).appendField("to");
      this.appendValueInput("id")
        .setCheck(idCheck)
        .appendField(`for ${noun} with ID`);
      this.setInputsInline(true);
      this.setPreviousStatement(true, "default");
      this.setNextStatement(true, "default");
      this.setColour(COLOUR);
      this.setTooltip(
        `Saves a value for this ${noun}. It shows up on your website's dashboard.`,
      );
    },
  };

  javascript.javascriptGenerator.forBlock[`dashboard_set${suffix}`] = function (
    block,
    generator,
  ) {
    const key = generator.valueToCode(block, "key", Order.NONE) || "''";
    const value = generator.valueToCode(block, "value", Order.NONE) || "null";
    const id = generator.valueToCode(block, "id", Order.NONE) || "null";

    return `await disfuseDashboard("put", "${scope}", ${id}, ${key}, ${value});\n`;
  };

  /* ---- delete ---- */

  Blockly.Blocks[`dashboard_delete${suffix}`] = {
    init: function () {
      this.appendValueInput("key")
        .setCheck("String")
        .appendField("delete data");
      this.appendValueInput("id")
        .setCheck(idCheck)
        .appendField(`for ${noun} with ID`);
      this.setInputsInline(true);
      this.setPreviousStatement(true, "default");
      this.setNextStatement(true, "default");
      this.setColour(COLOUR);
      this.setTooltip(`Removes a stored value for this ${noun}.`);
    },
  };

  javascript.javascriptGenerator.forBlock[`dashboard_delete${suffix}`] =
    function (block, generator) {
      const key = generator.valueToCode(block, "key", Order.NONE) || "''";
      const id = generator.valueToCode(block, "id", Order.NONE) || "null";

      return `await disfuseDashboard("delete", "${scope}", ${id}, ${key});\n`;
    };

  /* ---- has ---- */

  Blockly.Blocks[`dashboard_has${suffix}`] = {
    init: function () {
      this.appendValueInput("key").setCheck("String").appendField("data");
      this.appendValueInput("id")
        .setCheck(idCheck)
        .appendField(`is set for ${noun} with ID`);
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(COLOUR);
      this.setTooltip(`Whether this ${noun} has a value stored for that key.`);
    },
  };

  javascript.javascriptGenerator.forBlock[`dashboard_has${suffix}`] = function (
    block,
    generator,
  ) {
    const key = generator.valueToCode(block, "key", Order.NONE) || "''";
    const id = generator.valueToCode(block, "id", Order.NONE) || "null";

    return [
      `((await disfuseDashboard("get", "${scope}", ${id}, ${key})) !== null)`,
      Order.EQUALITY,
    ];
  };

  /* ---- all ---- */

  Blockly.Blocks[`dashboard_all${suffix}`] = {
    init: function () {
      this.appendValueInput("id")
        .setCheck(idCheck)
        .appendField(`all dashboard data for ${noun} with ID`);
      this.setInputsInline(true);
      this.setOutput(true, "object");
      this.setColour(COLOUR);
      this.setTooltip(
        `Every setting stored for this ${noun}, as an object of key/value pairs.`,
      );
    },
  };

  javascript.javascriptGenerator.forBlock[`dashboard_all${suffix}`] = function (
    block,
    generator,
  ) {
    const id = generator.valueToCode(block, "id", Order.NONE) || "null";

    return [
      `((await disfuseDashboard("get", "${scope}", ${id}))?.data ?? {})`,
      Order.AWAIT,
    ];
  };

  createRestrictions(
    [
      `dashboard_get${suffix}`,
      `dashboard_set${suffix}`,
      `dashboard_delete${suffix}`,
      `dashboard_has${suffix}`,
    ],
    [
      {
        type: "notEmpty",
        blockTypes: ["key"],
        message: "You must specify the data key",
      },
      {
        type: "notEmpty",
        blockTypes: ["id"],
        message: `You must specify the ${idLabel}`,
      },
    ],
  );

  createRestrictions(
    [`dashboard_all${suffix}`],
    [
      {
        type: "notEmpty",
        blockTypes: ["id"],
        message: `You must specify the ${idLabel}`,
      },
    ],
  );
}

SCOPES.forEach(defineScopeBlocks);

createRestrictions(
  ["dashboard_setServer", "dashboard_setUser"],
  [
    {
      type: "notEmpty",
      blockTypes: ["value"],
      message: "You must specify the value to save",
    },
  ],
);
