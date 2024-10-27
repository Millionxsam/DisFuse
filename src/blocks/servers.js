import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";
import javascript from "blockly/javascript";

Blockly.Blocks["server_getone"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get the server with the")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["id", "id"],
        ]),
        "type"
      )
      .appendField("equal to");
    this.appendValueInput("value").setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, "server");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_getall"] = {
  init: function () {
    this.appendDummyInput().appendField("For each server the bot is in");
    this.appendStatementInput("code").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_guild"] = {
  init: function () {
    this.appendDummyInput().appendField("current server in the loop");
    this.setOutput(true, "server");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_name"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("name of server:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_membercount"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("number of members of server:");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_id"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("ID of server:");
    this.setInputsInline(true);
    this.setOutput(true, ["String", "Number"]);
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_banner"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("banner URL of server:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_icon"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("icon URL of server:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_ownerid"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("owner ID of server:");
    this.setInputsInline(true);
    this.setOutput(true, ["String", "Number"]);
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_dsc"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("description of server:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_afkchannel"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("AFK channel of server:");
    this.setInputsInline(true);
    this.setOutput(true, "channel");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_creationdate"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("creation date of server:");
    this.setInputsInline(true);
    this.setOutput(true, "date");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_verified"] = {
  init: function () {
    this.appendValueInput("server").setCheck("server").appendField("server");
    this.appendDummyInput().appendField("is verified?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_vanityurl"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("vanity URL of server:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_systemchannel"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("system channel of server:");
    this.setInputsInline(true);
    this.setOutput(true, "channel");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_ruleschannel"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("rules channel of server:");
    this.setInputsInline(true);
    this.setOutput(true, "channel");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_disableinvites"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField(
        new Blockly.FieldDropdown([
          ["Disable", "true"],
          ["Enable", "false"],
        ]),
        "disabled"
      )
      .appendField("invites on server:")
      .setAlign(Blockly.inputs.Align.LEFT);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_leave"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("Leave server:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["server_leave"] = function (
  block,
  generator
) {
  var value_server = generator.valueToCode(
    block,
    "server",
    javascript.Order.ATOMIC
  );

  var code = `${value_server}.leave();`;
  return code;
};

javascript.javascriptGenerator.forBlock["server_disableinvites"] = function (
  block,
  generator
) {
  var value_server = generator.valueToCode(
    block,
    "server",
    javascript.Order.ATOMIC
  );
  var disabled = block.getFieldValue("disabled");

  var code = `${value_server}.disableInvites(${disabled});`;
  return code;
};

javascriptGenerator.forBlock["server_ruleschannel"] = function (
  block,
  generator
) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.rulesChannel`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_systemchannel"] = function (
  block,
  generator
) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.systemChannel`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_vanityurl"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.vanityURLCode`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_verified"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.verified`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_creationdate"] = function (
  block,
  generator
) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.createdAt`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_afkchannel"] = function (
  block,
  generator
) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.afkChannel`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_dsc"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.description`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_ownerid"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.ownerId`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_icon"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.iconURL()`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_banner"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.bannerURL()`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_id"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.id`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_membercount"] = function (
  block,
  generator
) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.memberCount`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_name"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.name`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_guild"] = function (block, generator) {
  var code = "guild";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_getone"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `client.guilds.cache${dropdown_type === "name"
      ? `.find(s => s.name === ${value_value})`
      : dropdown_type === "id"
        ? `.get(${value_value})`
        : ""
    }`;

  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_getall"] = function (block, generator) {
  var statements_code = generator.statementToCode(block, "code");

  var code = `client.guilds.cache.forEach(guild => {
    ${statements_code}
  });`;
  return code;
};

createRestrictions(
  ["server_getone"],
  [
    {
      type: "notEmpty",
      blockTypes: ["value"],
      message: "You must specify a value to search for",
    },
  ]
);

createRestrictions(
  ["server_guild"],
  [
    {
      type: "hasParent",
      blockTypes: ["server_getall"],
      message:
        'This block must be under the "For each server the bot is in" block',
    },
  ]
);

createRestrictions(
  [
    "server_name",
    "server_membercount",
    "server_id",
    "server_banner",
    "server_icon",
    "server_ownerid",
    "server_dsc",
    "server_afkchannel",
    "server_creationdate",
    "server_verified",
    "server_vanityurl",
    "server_systemchannel",
    "server_ruleschannel",
  ],
  [
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify a server",
    },
  ]
);
