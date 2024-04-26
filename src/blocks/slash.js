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
    this.appendValueInput("perms")
      .setCheck("Array")
      .appendField("required member permission(s):");
    this.appendStatementInput("options")
      .setCheck(null)
      .appendField("option(s):");
    this.setInputsInline(false);
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
  var defaultmemberperms = generator.valueToCode(
    block,
    "defaultMemberPerms",
    Order.ATOMIC
  );

  var code;

  if (guild)
    code = `client.guilds.cache.get(${guild}).commands.create({
      name: ${name},
      description: ${dsc},
      nsfw: ${nsfw},
      defaultMemberPermissions: ${defaultmemberperms},
      options: [${options}]
    });`;
  else if (!guild)
    code = `client.application.commands.create({
      name: ${name},
      description: ${dsc},
      nsfw: ${nsfw},
      defaultMemberPermissions: ${defaultmemberperms},
      options: [${options}]
    });`;

  return code;
};

javascriptGenerator.forBlock["slash_name"] = function (block, generator) {
  var code = "interaction.commandName";
  return [code, Order.NONE];
};
