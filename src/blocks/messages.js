import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import javascript from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["msg_received"] = {
  init: function () {
    this.appendDummyInput().appendField("When a message is received");
    this.appendStatementInput("event").setCheck(null);
    this.setInputsInline(false);
    this.setColour("#336EFF");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_reply"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply to the message");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#336EFF");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_reply_rows"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply to the message");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck(null).appendField("rows:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#336EFF");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_content"] = {
  init: function () {
    this.appendDummyInput().appendField("content of the message");
    this.setOutput(true, "String");
    this.setColour("#336EFF");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_member"] = {
  init: function () {
    this.appendDummyInput().appendField("member who sent the message");
    this.setOutput(true, "member");
    this.setColour("#336EFF");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_user"] = {
  init: function () {
    this.appendDummyInput().appendField("user who sent the message");
    this.setOutput(true, "user");
    this.setColour("#336EFF");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_channel"] = {
  init: function () {
    this.appendDummyInput().appendField("channel of the message");
    this.setOutput(true, "channel");
    this.setColour("#336EFF");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_server"] = {
  init: function () {
    this.appendDummyInput().appendField("server of the message");
    this.setOutput(true, "server");
    this.setColour("#336EFF");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["msg_received"] = function (block, generator) {
  var code = generator.statementToCode(block, "event");

  var code = `  client.on("messageCreate", async (message) => {
          ${code}
      });\n`;
  return code;
};

javascriptGenerator.forBlock["msg_reply_rows"] = function (block, generator) {
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `message.reply({
      content: ${content || "''"},
      embeds: [${embeds.replaceAll("'", "")}],
      components: [${rows}]
      });\n`;
  return code;
};

javascriptGenerator.forBlock["msg_reply"] = function (block, generator) {
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);

  var code = `message.reply({
      content: ${content || "''"},
      embeds: [${embeds.replaceAll("'", "")}]
      });\n`;
  return code;
};

javascriptGenerator.forBlock["msg_content"] = function (block, generator) {
  var code = "message.content";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["msg_member"] = function (block, generator) {
  var code = "message.member";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["msg_user"] = function (block, generator) {
  var code = "message.member.user";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["msg_channel"] = function (block, generator) {
  var code = "message.channel";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["msg_server"] = function (block, generator) {
  var code = "message.guild";
  return [code, Order.NONE];
};

javascript.javascriptGenerator.forBlock["msg_delete"] = function (
  block,
  generator
) {
  var code = "message.delete()";
  return code;
};

Blockly.Blocks["msg_delete"] = {
  init: function () {
    this.appendDummyInput().appendField("Delete the user's message");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("336EFF");
    this.setTooltip("Delete a message");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_dm"] = {
  init: function () {
    this.appendValueInput("USER").setCheck("user").appendField("Send a dm to");
    this.appendValueInput("MESSAGE")
      .setCheck("String")
      .appendField("With the message");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("336EFF");
    this.setTooltip("Send a dm");
    this.setHelpUrl("");
  },
};
// where do you put the content of the dm great question lol
javascript.javascriptGenerator.forBlock["msg_dm"] = function (
  block,
  generator
) {
  var value_user = generator.valueToCode(
    block,
    "USER",
    javascript.Order.ATOMIC
  );
  var value_message = generator.valueToCode(
    block,
    "MESSAGE",
    javascript.Order.ATOMIC
  );
  var code = "user.send";
  return code;
};

createRestrictions(
  ["msg_content", "msg_member", "msg_user", "msg_channel", "msg_server"],
  [
    {
      type: "hasParent",
      blockTypes: ["msg_received"],
      message: 'This block must be in a "When a message is received" event',
    },
  ]
);

createRestrictions(
  ["msg_reply", "msg_reply_rows"],
  [
    {
      type: "hasHat",
      blockTypes: ["msg_received"],
      message: 'This block must be in a "When a message is received" event',
    },
    {
      type: "notEmpty",
      blockTypes: ["content", "embeds"],
      message: "You must specify the content and/or embed(s) to send",
    },
  ]
);
