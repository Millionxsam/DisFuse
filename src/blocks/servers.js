import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["server_getone"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("server with the")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["id", "id"],
        ]),
        "type"
      )
      .appendField("of");
    this.appendValueInput("value").setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, "server");
    this.setColour("A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_getall"] = {
  init: function () {
    this.appendDummyInput().appendField("For each server the bot is in");
    this.appendStatementInput("code").setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["server_guild"] = {
  init: function () {
    this.appendDummyInput().appendField("server");
    this.setOutput(true, "server");
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setOutput(true, "String");
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
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
    this.setColour("A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
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

  var code = `moment(${value_server}.createdAt).format("LLLL")`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["server_dsc"] = function (block, generator) {
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

  var code = `client.guilds.cache${
    dropdown_type === "name"
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
