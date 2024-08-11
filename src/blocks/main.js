import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["main_token"] = {
  init: function () {
    this.appendValueInput("token")
      .setCheck("String")
      .appendField("Log in to bot with the token:");
    this.setInputsInline(true);
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["main_ready"] = {
  init: function () {
    this.appendDummyInput().appendField("When the bot is logged in");
    this.appendStatementInput("event").setCheck("default");
    this.setInputsInline(false);
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["main_readyAt"] = {
  init: function () {
    this.appendDummyInput().appendField("time since the bot logged in");
    this.setInputsInline(false);
    this.setColour("#FF6E33");
    this.setOutput(true, "date");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["main_readyAt"] = function (block, generator) {
  var code = "client.readyAt";
  return [code, Order.NONE];
};

Blockly.Blocks["main_presence"] = {
  init: function () {
    this.appendDummyInput().appendField("Set the presence of the bot");
    this.appendDummyInput()
      .appendField("status:")
      .appendField(
        new Blockly.FieldDropdown([
          ["online", "online"],
          ["idle", "idle"],
          ["invisible", "invisible"],
          ["do not disturb", "dnd"],
        ]),
        "status"
      );
    this.appendValueInput("afk").setCheck("Boolean").appendField("AFK:");
    this.appendDummyInput()
      .appendField("activity type:")
      .appendField(
        new Blockly.FieldDropdown([
          ["Playing", "0"],
          ["Competing", "5"],
          ["Streaming", "1"],
          ["Listening", "2"],
          ["Watching", "3"],
        ]),
        "activity_type"
      );
    this.appendValueInput("activity_name")
      .setCheck("String")
      .appendField("activity name:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["main_env"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("get secret with name:");
    this.setOutput(true, null);
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["main_bot"] = {
  init: function () {
    this.appendDummyInput().appendField("bot");
    this.setOutput(true, "user");
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["main_ping"] = {
  init: function () {
    this.appendDummyInput().appendField("current bot latency ping");
    this.setOutput(true, "Number");
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["main_amountservers"] = {
  init: function () {
    this.appendDummyInput().appendField("get the amount of servers the bot in");
    this.setOutput(true, "Number");
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["main_amountservers"] = function (block, generator) {
  return ['client.guilds.cache.size', Order.NONE];
};

javascriptGenerator.forBlock["main_token"] = function (block, generator) {
  const token = generator.valueToCode(block, "token", Order.ATOMIC);

  const code = `client.login(${token});\n`;
  return code;
};

javascriptGenerator.forBlock["main_ready"] = function (block, generator) {
  var code_statement = generator.statementToCode(block, "event");

  var code = `client.on("ready", async () => {
    ${code_statement}
  });\n`;
  return code;
};

javascriptGenerator.forBlock["main_presence"] = function (block, generator) {
  var dropdown_status = block.getFieldValue("status");
  var value_afk = generator.valueToCode(block, "afk", Order.ATOMIC);
  var dropdown_activity_type = block.getFieldValue("activity_type");
  var value_activity_name = generator.valueToCode(
    block,
    "activity_name",
    Order.ATOMIC
  );

  var code = `client.user.setPresence({
    status: "${dropdown_status}",
    afk: ${value_afk || "false"},
    activities: [{
      name: ${value_activity_name || ""},
      type: ${dropdown_activity_type || "0"}
    }]
  });`;
  return code;
};

javascriptGenerator.forBlock["main_env"] = function (block, generator) {
  var value_env = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `process.env[${value_env}]`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["main_bot"] = function (block, generator) {
  var code = "client.user";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["main_ping"] = function (block, generator) {
  var code = "client.ws.ping";
  return [code, Order.NONE];
};

createRestrictions(
  ["main_token"],
  [
    {
      type: "notEmpty",
      blockTypes: ["token"],
      message: "You must specify the token of your bot",
    },
  ]
);

createRestrictions(
  ["main_env"],
  [
    {
      type: "notEmpty",
      blockTypes: ["value"],
      message: "You must specify the name of the ENV to get",
    },
  ]
);
