import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

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
  },
};

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
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
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
      .appendField("required user permission(s):");
    this.appendStatementInput("options")
      .setCheck("default")
      .appendField("option(s):");
    this.setInputsInline(false);
    this.setColour("#3366CC");
    this.setPreviousStatement(true, ["slashCreate", "contextMenuCreate"]);
    this.setNextStatement(true, ["slashCreate", "contextMenuCreate"]);
  },
};

Blockly.Blocks["msg_reply"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply to the message");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("then").appendField("then:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#336EFF");
  },
};

Blockly.Blocks["msg_reply_rows"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply to the message");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.appendStatementInput("then").appendField("then:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#336EFF");
  },
};

Blockly.Blocks["misc_int_reply"] = {
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
    this.setColour("#4192E9");
  },
};

Blockly.Blocks["misc_int_reply_rows"] = {
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
    this.setColour("#4192E9");
  },
};

Blockly.Blocks["misc_int_edit"] = {
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
    this.setColour("#4192E9");
  },
};

Blockly.Blocks["main_amountservers"] = {
  init: function () {
    this.appendDummyInput().appendField("number of servers of the bot");
    this.setOutput(true, "Number");
    this.setColour("#FF6E33");
    this.setInputsInline(true);
  },
};

javascriptGenerator.forBlock["slash_editreply"] = function (block, generator) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `await interaction.editReply({
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

  var code = `await interaction.reply({
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

  var code = `await interaction.reply({
    content: ${value_content || "''"},
    embeds: [${value_embeds.replaceAll("'", "")}],
    ephemeral: ${value_ephemeral || "false"},
    components: [
    ${rows}]
  });\n`;
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
        options: [${options}],
        ${
          perm.length > 0
            ? `defaultMemberPermissions: ${
                perm.startsWith("[") && perm.endsWith("]") ? perm : `[${perm}]`
              }`
            : ""
        }
      },`;

  return code;
};

javascriptGenerator.forBlock["slash_createcontainer"] = function (
  block,
  generator
) {
  var value_guild = generator.valueToCode(block, "guild", Order.ATOMIC);
  var statements_code = generator.statementToCode(block, "commands");

  var code;

  if (value_guild?.length > 10)
    code = `client.guilds.cache.get(${value_guild}).commands.set([${statements_code}]);`;
  else code = `client.application.commands.set([${statements_code}]);`;

  return code;
};

javascriptGenerator.forBlock["msg_reply_rows"] = function (block, generator) {
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");
  var then = generator.statementToCode(block, "then");

  var code = `message.reply({
    content: ${content || "''"},
    embeds: [${embeds.replaceAll("'", "") || ""}],
    components: [
    ${rows}]
  }).then((messageSent) => {
    ${then}});\n`;
  return code;
};

javascriptGenerator.forBlock["msg_reply"] = function (block, generator) {
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var then = generator.statementToCode(block, "then");

  var code = `message.reply({
    content: ${content || "''"},
    embeds: [${embeds.replaceAll("'", "")}]
  }).then((messageSent) => {
    ${then}});\n`;
  return code;
};

javascriptGenerator.forBlock["misc_int_reply"] = function (block, generator) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var value_ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);

  var code = `await interaction.reply({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  ephemeral: ${value_ephemeral || "false"}
});\n`;
  return code;
};

javascriptGenerator.forBlock["misc_int_reply_rows"] = function (
  block,
  generator
) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var value_ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `await interaction.reply({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  ephemeral: ${value_ephemeral || "false"},
  components: [${rows}]
});\n`;
  return code;
};

javascriptGenerator.forBlock["misc_int_edit"] = function (block, generator) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `await interaction.editReply({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  components: [${rows}]
});\n`;
  return code;
};

javascriptGenerator.forBlock["main_amountservers"] = () => [
  "client.guilds.cache.size",
  Order.NONE,
];
