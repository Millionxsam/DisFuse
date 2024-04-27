import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["slash_received"] = {
  init: function () {
    this.appendDummyInput().appendField("When a slash command is received");
    this.appendStatementInput("event").setCheck(null);
    this.setInputsInline(false);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_create"] = {
  init: function () {
    this.appendDummyInput().appendField("Create slash command");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendValueInput("guild")
      .setCheck("String")
      .appendField("guild ID (leave blank for global commands):");
    this.appendValueInput("nsfw").setCheck("Boolean").appendField("NSFW:");
    this.appendValueInput("dm")
      .setCheck("Boolean")
      .appendField("usable in DMs:");
    this.appendValueInput("perms")
      .setCheck("permission")
      .appendField(
        "member permission (dont use yet, im not finished this part yet):"
      );
    this.appendStatementInput("options")
      .setCheck(null)
      .appendField("option(s):");
    this.setInputsInline(false);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_addoption"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Add")
      .appendField(
        new Blockly.FieldDropdown([
          ["text", "3"],
          ["attachment", "11"],
          ["true/false", "5"],
          ["channel", "7"],
          ["integer", "4"],
          ["mentionable", "9"],
          ["number", "10"],
          ["role", "8"],
          ["user", "6"],
        ]),
        "type"
      )
      .appendField("option");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendValueInput("required")
      .setCheck("Boolean")
      .appendField("required:");
    this.appendStatementInput("choices")
      .setCheck(null)
      .appendField("choices (only with text type & optional):");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_addchoice"] = {
  init: function () {
    this.appendDummyInput().appendField("Add choice");
    this.appendValueInput("name")
      .setCheck("String")
      .appendField("name (shown to user):");
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("value (returned in code):");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_addsubcommandgroup"] = {
  init: function () {
    this.appendDummyInput().appendField("Add subcommand group");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendStatementInput("subcommands")
      .setCheck(null)
      .appendField("subcommands:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_name"] = {
  init: function () {
    this.appendDummyInput().appendField("name of the command");
    this.setOutput(true, null);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["slash_received"] = function (block, generator) {
  var code = generator.statementToCode(block, "event");

  var code = `client.on("interactionCreate", async (interaction) => {
          ${code}
      });`;
  return code;
};

javascriptGenerator.forBlock["slash_create"] = function (block, generator) {
  var name = generator.valueToCode(block, "name", Order.ATOMIC);
  var dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var guild = generator.valueToCode(block, "guild", Order.ATOMIC);
  var options = generator.statementToCode(block, "options");
  var nsfw = generator.valueToCode(block, "nsfw", Order.ATOMIC);
  var perm = generator.valueToCode(block, "perms", Order.ATOMIC);

  var code;

  if (guild)
    code = `client.guilds.cache.get(${guild}).commands.create({
      name: ${name},
      description: ${dsc},
      nsfw: ${nsfw},
      defaultMemberPermissions: ${perm},
      options: [${options}]
    });`;
  else if (!guild)
    code = `client.application.commands.create({
      name: ${name},
      description: ${dsc},
      nsfw: ${nsfw},
      defaultMemberPermissions: ${perm},
      options: [${options}]
    });`;

  return code;
};

javascriptGenerator.forBlock["slash_addoption"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var value_required = generator.valueToCode(block, "required", Order.ATOMIC);
  var statements_choices = generator.statementToCode(block, "choices");

  var code = `{
    type: ${dropdown_type},
    name: "${value_name}",
    description: "${value_dsc}",
    required: ${value_required},
    choices: [${statements_choices}]
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_addchoice"] = function (block, generator) {
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `{
    name: "${value_name}",
    value: "${value_value}"
  },`;
  return code;
};

Blockly.Blocks["slash_addsubcommand"] = {
  init: function () {
    this.appendDummyInput().appendField("Add subcommand");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendStatementInput("options").setCheck(null).appendField("options:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_member"] = {
  init: function () {
    this.appendDummyInput().appendField("member who ran the command");
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_user"] = {
  init: function () {
    this.appendDummyInput().appendField("user who ran the command");
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_channel"] = {
  init: function () {
    this.appendDummyInput().appendField("channel the command was run in");
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_server"] = {
  init: function () {
    this.appendDummyInput().appendField("server the command was run in");
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setColour("#00A859");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["slash_server"] = function (block, generator) {
  var code = "interaction.guild";
  return code;
};

javascriptGenerator.forBlock["slash_channel"] = function (block, generator) {
  var code = "interaction.channel";
  return code;
};

javascriptGenerator.forBlock["slash_member"] = function (block, generator) {
  var code = "interaction.member";
  return code;
};

javascriptGenerator.forBlock["slash_user"] = function (block, generator) {
  var code = "interaction.member.user";
  return code;
};

javascriptGenerator.forBlock["slash_addsubcommand"] = function (
  block,
  generator
) {
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var statements_options = generator.statementToCode(block, "options");

  var code = `{
    type: 1,
    name: "${value_name}",
    description: "${value_dsc}",
    options: [${statements_options}]
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_addsubcommandgroup"] = function (
  block,
  generator
) {
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var statements_subcommands = generator.statementToCode(block, "subcommands");

  var code = `{
    type: 2,
    name: "${value_name}",
    description: "${value_dsc}",
    options: [${statements_subcommands}]
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_name"] = function (block, generator) {
  var code = "interaction.commandName";
  return [code, Order.NONE];
};
