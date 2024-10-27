import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["slash_received"] = {
  init: function () {
    this.appendDummyInput().appendField("When a slash command is received");
    this.appendStatementInput("event").setCheck("default");
    this.setInputsInline(false);
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_reply"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply to the interaction");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendValueInput("ephemeral")
      .setCheck("Boolean")
      .appendField("visible only to the user?");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_reply_rows"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply to the interaction");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendValueInput("ephemeral")
      .setCheck("Boolean")
      .appendField("visible only to the user?");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_editreply"] = {
  init: function () {
    this.appendDummyInput().appendField("Edit the reply");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["slash_editreply"] = function (block, generator) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `interaction.editReply({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  components: [
  ${rows}]
});`;
  return code;
};

javascriptGenerator.forBlock["slash_reply"] = function (block, generator) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var value_ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);

  var code = `interaction.reply({
    content: ${value_content || "''"},
    embeds: [${value_embeds.replaceAll("'", "")}],
    ephemeral: ${value_ephemeral || "false"}
  });`;
  return code;
};

javascriptGenerator.forBlock["slash_reply_rows"] = function (block, generator) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var value_ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `interaction.reply({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  ephemeral: ${value_ephemeral || "false"},
  components: [
  ${rows}]
});\n`;
  return code;
};

// kept for old projects compatibility
Blockly.Blocks["slash_createcontainer"] = {
  init: function () {
    this.appendDummyInput().appendField("Set slash commands");
    this.appendValueInput("guild")
      .setCheck("String")
      .appendField("guild ID (leave blank for global commands):");
    this.appendStatementInput("commands").setCheck([
      "contextMenuCreate",
      "slashCreate",
    ]);
    this.setInputsInline(false);
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
};

// kept for old projects compatibility
javascriptGenerator.forBlock["slash_createcontainer"] = function (
  block,
  generator
) {
  var value_guild = generator.valueToCode(block, "guild", Order.ATOMIC);
  var statements_code = generator.statementToCode(block, "commands");

  var code;

  if (value_guild?.length > 15)
    code = `client.guilds.cache.get(${value_guild}).commands.set([${statements_code}]);`;
  else code = `client.application.commands.set([${statements_code}]);`;

  return code;
};

Blockly.Blocks["slash_create"] = {
  init: function () {
    this.appendDummyInput().appendField("Add slash command");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendValueInput("nsfw").setCheck("Boolean").appendField("NSFW:");
    this.appendValueInput("dm")
      .setCheck("Boolean")
      .appendField("usable in DMs:");
    this.appendValueInput("perms")
      .setCheck(["Array", "permission"])
      .appendField("required member permission(s):");
    this.appendStatementInput("options")
      .setCheck("default")
      .appendField("option(s):");
    this.setInputsInline(false);
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setPreviousStatement(true, ["slashCreate", "contextMenuCreate"]);
    this.setNextStatement(true, ["slashCreate", "contextMenuCreate"]);
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
      .setCheck("default")
      .appendField("choices (only with text type & optional):");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
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
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
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
      .setCheck("default")
      .appendField("subcommands:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_name"] = {
  init: function () {
    this.appendDummyInput().appendField("name of the command");
    this.setOutput(true, "String");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_addsubcommand"] = {
  init: function () {
    this.appendDummyInput().appendField("Add subcommand");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendStatementInput("options")
      .setCheck("default")
      .appendField("options:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_member"] = {
  init: function () {
    this.appendDummyInput().appendField("member who ran the command");
    this.setInputsInline(false);
    this.setOutput(true, "member");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_user"] = {
  init: function () {
    this.appendDummyInput().appendField("user who ran the command");
    this.setInputsInline(false);
    this.setOutput(true, "user");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_channel"] = {
  init: function () {
    this.appendDummyInput().appendField("channel the command was run in");
    this.setInputsInline(false);
    this.setOutput(true, "channel");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_server"] = {
  init: function () {
    this.appendDummyInput().appendField("server the command was run in");
    this.setInputsInline(false);
    this.setOutput(true, "server");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_getoption"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["text", "String"],
          ["attachment", "Attachment"],
          ["true/false", "Boolean"],
          ["channel", "Channel"],
          ["integer", "Integer"],
          ["mentionable", "Mentionable"],
          ["number", "Number"],
          ["role", "Role"],
          ["user", "User"],
          ["member", "Member"],
          ["subcommand", "Subcommand"],
          ["subcommand group", "SubcommandGroup"],
        ]),
        "type"
      );
    this.appendValueInput("name")
      .setCheck("String")
      .appendField("option value with name:");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["slash_getoption"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);

  var code = `interaction.options.get${dropdown_type}(${value_name})`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["slash_received"] = function (block, generator) {
  var code_statement = generator.statementToCode(block, "event");

  var code = `client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
${code_statement}});\n`;
  return code;
};

javascriptGenerator.forBlock["slash_create"] = function (block, generator) {
  var name = generator.valueToCode(block, "name", Order.ATOMIC);
  var dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var options = generator.statementToCode(block, "options");
  var nsfw = generator.valueToCode(block, "nsfw", Order.ATOMIC);
  var perm = generator.valueToCode(block, "perms", Order.ATOMIC);
  var dm = generator.valueToCode(block, "dm", Order.ATOMIC);

  var code = `\n{
      name: ${name},
      type: Discord.ApplicationCommandType.ChatInput,
      description: ${dsc},
      nsfw: ${nsfw || false},
      dmPermission: ${dm || true},
      defaultMemberPermissions: ${perm.startsWith("[") && perm.endsWith("]") ? perm : `[${perm}]`
    },
      options: [${options}]
    },`;

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
    name: ${value_name},
    description: ${value_dsc},
    required: ${value_required || "false"},
    choices: [${statements_choices}]
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_addchoice"] = function (block, generator) {
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `{
    name: ${value_name},
    value: ${value_value}
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_server"] = function (block, generator) {
  var code = "interaction.guild";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["slash_channel"] = function (block, generator) {
  var code = "interaction.channel";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["slash_member"] = function (block, generator) {
  var code = "interaction.member";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["slash_user"] = function (block, generator) {
  var code = "interaction.member.user";
  return [code, Order.NONE];
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
    name: ${value_name},
    description: ${value_dsc},
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
    name: ${value_name},
    description: ${value_dsc},
    options: [${statements_subcommands}]
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_name"] = function (block, generator) {
  var code = "interaction.commandName";
  return [code, Order.NONE];
};

createRestrictions(
  ["slash_create"],
  [
    {
      type: "surroundParent",
      blockTypes: ["slash_createcontainer", "misc_createcontainer"],
      message:
        'This block must be under "Set slash commands / context menus" block',
    },
  ]
);

createRestrictions(
  ["slash_addoption"],
  [
    {
      type: "surroundParent",
      blockTypes: ["slash_create", "slash_addsubcommand"],
      message:
        'This block must be under "add slash command" OR "add subcommand" block',
    },
  ]
);
createRestrictions(
  ["slash_addchoice"],
  [
    {
      type: "surroundParent",
      blockTypes: ["slash_addoption"],
      message: 'This block must be under "add option" block',
    },
  ]
);
createRestrictions(
  ["slash_addsubcommand"],
  [
    {
      type: "surroundParent",
      blockTypes: ["slash_create", "slash_addsubcommandgroup"],
      message:
        'This block must be under "add slash command" OR "add subcommand group" block',
    },
  ]
);
createRestrictions(
  ["slash_addsubcommandgroup"],
  [
    {
      type: "surroundParent",
      blockTypes: ["slash_create"],
      message: 'This block must be under "add slash command" block',
    },
  ]
);
createRestrictions(
  ["slash_addchoice"],
  [
    {
      type: "surroundParent",
      blockTypes: ["slash_addoption"],
      message: 'This block must be under "add option" block',
    },
  ]
);

createRestrictions(
  ["slash_editreply"],
  [
    {
      type: "hasHat",
      blockTypes: ["slash_received"],
      message: 'This block must be under "when slash command received" event',
    },
    {
      type: "hasBlockInParent",
      blockTypes: ["slash_reply"],
      message: 'This block must be used AFTER "reply to the command" block',
    },
  ]
);

createRestrictions(
  ["slash_name", "slash_member", "slash_user", "slash_channel", "slash_server"],
  [
    {
      type: "hasHat",
      blockTypes: ["slash_received"],
      message: 'This block must be under "when slash command received" event',
    },
  ]
);

createRestrictions(
  ["slash_editreply"],
  [
    {
      type: "hasHat",
      blockTypes: ["slash_received", "contextMenu_received"],
      message:
        'This block must be under "when slash command received" or "when context menu clicked" event',
    },
    {
      type: "hasBlockInParent",
      blockTypes: ["slash_reply"],
      message: 'This block must be used AFTER "reply to the command" block',
    },
  ]
);

createRestrictions(
  ["slash_reply"],
  [
    {
      type: "hasHat",
      blockTypes: [
        "slash_received",
        "modal_handle_interaction",
        "contextMenu_received",
      ],
      message: "This block must be under an interaction event",
    },
  ]
);

createRestrictions(
  ["slash_reply_rows"],
  [
    {
      type: "hasHat",
      blockTypes: [
        "slash_received",
        "modal_handle_interaction",
        "contextMenu_received",
      ],
      message: "This block must be under an interaction event",
    },
  ]
);
