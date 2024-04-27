import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

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

javascriptGenerator.forBlock["msg_reply"] = function (block, generator) {
  var content = generator.valueToCode(block, "content", Order.ATOMIC);

  var code = `message.reply({
      content: ${content}
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
