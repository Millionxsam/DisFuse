import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";
import { createMutatorBlock } from "../functions/createMutator.ts";
import {
  formatEmbeds,
  buildMessageOptions,
  buildThenSuffix,
} from "../functions/generatorUtils";

Blockly.Blocks["msg_getone"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("String")
      .appendField("get the message with id equal to");
    this.appendValueInput("channel").setCheck("channel").appendField("on the channel");
    this.setInputsInline(false);
    this.setOutput(true, "message");
    this.setColour("#336EFF");
  },
};

javascriptGenerator.forBlock["msg_getone"] = function (block, generator) {
  var id = generator.valueToCode(block, "id", Order.NONE);
  var channel = generator.valueToCode(block, "channel", Order.NONE);

  return [`await ${channel}.messages.fetch(${id})`, Order.AWAIT];
};

Blockly.Blocks["msg_received"] = {
  init: function () {
    this.appendDummyInput().appendField("when a message is received");
    this.appendStatementInput("event").setCheck("default");
    this.setInputsInline(false);
    this.setColour("#336EFF");
  },
};

Blockly.Blocks["message_author_not_bot"] = {
  init: function () {
    this.appendDummyInput().appendField("when a message is received from a human");
    this.appendStatementInput("name").setCheck("default");
    this.setInputsInline(false);
    this.setColour("#336EFF");
  },
};

createMutatorBlock({
  id: "msg_reply_mutator",
  optionsBlockId: "msg_reply_mutator_options",
  colour: "#336EFF",
  inputs: [
    { type: "dummy", label: "reply to the message" },
    { type: "value", name: "content", check: "String", label: "content:" },
  ],
  mutatorFields: [
    {
      name: "embeds",
      label: "include embeds",
      default: false,
      inputType: "value",
      inputLabel: "embed name(s):",
      valueCheck: "String",
    },
    {
      name: "rows",
      label: "include rows",
      default: false,
      inputType: "statement",
      inputLabel: "rows:",
      valueCheck: "rows",
    },
    {
      name: "files",
      label: "include files",
      default: false,
      inputType: "statement",
      inputLabel: "files:",
      valueCheck: "files",
    },
    {
      name: "then",
      label: 'include "then"',
      default: false,
      inputType: "statement",
      inputLabel: "then:",
      valueCheck: "default",
    },
  ],
  previousStatement: "default",
  nextStatement: "default",
});

javascriptGenerator.forBlock["msg_reply_mutator"] = function (block, generator) {
  const content = generator.valueToCode(block, "content", Order.ATOMIC) || "''";
  const embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  const ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);
  const rows = generator.statementToCode(block, "rows");
  const files = generator.statementToCode(block, "files");
  const then = generator.statementToCode(block, "then");

  const options = buildMessageOptions({ content, embeds, rows, files, ephemeral });
  const thenCode = buildThenSuffix(then);

  return `await message.reply({\n  ${options.join(",\n  ")}\n})${thenCode}`;
};

createMutatorBlock({
  id: "msg_edit_mutator",
  optionsBlockId: "msg_edit_mutator_options",
  colour: "#336EFF",
  inputs: [
    {
      type: "value",
      name: "message",
      check: "message",
      label: "edit message:",
    },
    { type: "value", name: "content", check: "String", label: "content:" },
  ],
  mutatorFields: [
    {
      name: "embeds",
      label: "include embeds",
      default: false,
      inputType: "value",
      inputLabel: "embed name(s):",
      valueCheck: "String",
    },
    {
      name: "rows",
      label: "include rows",
      default: false,
      inputType: "statement",
      inputLabel: "rows:",
      valueCheck: "rows",
    },
    {
      name: "files",
      label: "include files",
      default: false,
      inputType: "statement",
      inputLabel: "files:",
      valueCheck: "files",
    },
  ],
  previousStatement: "default",
  nextStatement: "default",
});

javascriptGenerator.forBlock["msg_edit_mutator"] = function (block, generator) {
  const message = generator.valueToCode(block, "message", Order.NONE);
  const content = generator.valueToCode(block, "content", Order.ATOMIC) || "''";
  const embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  const ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);
  const rows = generator.statementToCode(block, "rows");
  const files = generator.statementToCode(block, "files");

  const options = buildMessageOptions({ content, embeds, rows, files, ephemeral });

  return `await (${message}).edit({\n  ${options.join(",\n  ")}\n});\n`;
};

Blockly.Blocks["msg_msg"] = {
  init: function () {
    this.appendDummyInput().appendField("message received");
    this.setOutput(true, "message");
    this.setColour("#336EFF");
  },
};

Blockly.Blocks["msg_content"] = {
  init: function () {
    this.appendDummyInput().appendField("content of the message");
    this.setOutput(true, "String");
    this.setColour("#336EFF");
  },
};

Blockly.Blocks["msg_member"] = {
  init: function () {
    this.appendDummyInput().appendField("member who sent the message");
    this.setOutput(true, "member");
    this.setColour("#336EFF");
  },
};

Blockly.Blocks["msg_user"] = {
  init: function () {
    this.appendDummyInput().appendField("user who sent the message");
    this.setOutput(true, "user");
    this.setColour("#336EFF");
  },
};

Blockly.Blocks["msg_channel"] = {
  init: function () {
    this.appendDummyInput().appendField("channel of the message");
    this.setOutput(true, "channel");
    this.setColour("#336EFF");
  },
};

Blockly.Blocks["msg_server"] = {
  init: function () {
    this.appendDummyInput().appendField("server of the message");
    this.setOutput(true, "server");
    this.setColour("#336EFF");
  },
};

Blockly.Blocks["msg_react"] = {
  init: function () {
    this.appendValueInput("message").setCheck("message").appendField("react to message:");
    this.appendValueInput("reaction")
      .setCheck(["String", "emoji"])
      .appendField("with emoji:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#336EFF");
  },
};

createRestrictions(
  ["msg_react"],
  [
    {
      type: "validator",
      blockTypes: ["reaction"],
      check: val => /^(|([\p{Emoji}]{1}))$/u.test(val),
      message: "Emoji must be a single valid emoji",
    },
  ],
);

javascriptGenerator.forBlock["msg_react"] = function (block, generator) {
  var message = generator.valueToCode(block, "message", Order.ATOMIC);
  var reaction = generator.valueToCode(block, "reaction", Order.ATOMIC);

  return `${message}.react(${reaction});\n`;
};

javascriptGenerator.forBlock["msg_received"] = function (block, generator) {
  const codeState = generator.statementToCode(block, "event");
  return `client.on("messageCreate", async (message) => {\n${codeState}});\n`;
};

javascriptGenerator.forBlock["message_author_not_bot"] = function (block, generator) {
  const codeState = generator.statementToCode(block, "name");
  return `client.on("messageCreate", async (message) => {\n  if (message.author.bot) return;\n${codeState}});\n`;
};

javascriptGenerator.forBlock["msg_msg"] = () => ["message", Order.NONE];
javascriptGenerator.forBlock["msg_content"] = () => ["message.content", Order.NONE];
javascriptGenerator.forBlock["msg_member"] = () => ["message.member", Order.NONE];
javascriptGenerator.forBlock["msg_user"] = () => ["message.member.user", Order.NONE];
javascriptGenerator.forBlock["msg_channel"] = () => ["message.channel", Order.NONE];
javascriptGenerator.forBlock["msg_server"] = () => ["message.guild", Order.NONE];
javascriptGenerator.forBlock["msg_delete"] = () => "message.delete();";

Blockly.Blocks["msg_delete"] = {
  init: function () {
    this.appendDummyInput().appendField("delete the user's message");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("336EFF");
    this.setTooltip("Delete the message received");
  },
};

Blockly.Blocks["msg_deleteOther"] = {
  init: function () {
    this.appendValueInput("message").setCheck("message").appendField("delete message:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("336EFF");
    this.setTooltip("Delete a message");
  },
};

javascriptGenerator.forBlock["msg_deleteOther"] = function (block, generator) {
  var message = generator.valueToCode(block, "message", Order.ATOMIC);
  return `${message}.delete();\n`;
};

Blockly.Blocks["msg_edit"] = {
  init: function () {
    this.appendValueInput("message").setCheck("message").appendField("edit message:");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds").setCheck("String").appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("336EFF");
    this.setTooltip("Edits a message sent by the bot.");
  },
};

javascriptGenerator.forBlock["msg_edit"] = function (block, generator) {
  var message = generator.valueToCode(block, "message", Order.ATOMIC);
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  return `await (${message}).edit({
  content: ${content || "''"},
  embeds: [${formatEmbeds(embeds)}],
  components: [
  ${rows}]
});\n`;
};

Blockly.Blocks["captcha_reply"] = {
  init: function () {
    this.appendValueInput("message")
      .setCheck("message")
      .appendField("reply captcha to message:");
    this.appendValueInput("content").setCheck("String").appendField("with content:");
    this.appendValueInput("embeds").setCheck("String").appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Replies to a message with a captcha");
  },
};

javascriptGenerator.forBlock["captcha_reply"] = function (block, generator) {
  var message = generator.valueToCode(block, "message", Order.ATOMIC);
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  return `${message}.reply({
  files: [{ attachment: captcha.PNGStream, name: "captcha.png" }],
  content: ${content || "''"},
  embeds: [${formatEmbeds(embeds)}],
  components: [
  ${rows}]
});\n`;
};

Blockly.Blocks["message_property"] = {
  init: function () {
    this.appendValueInput("message")
      .setCheck("message")
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["content", "content"],
          ["files (list)", "attachments"],
          ["ID", "id"],
          ["author (member)", "member"],
          ["author (user)", "author"],
          ["channel", "channel"],
          ["server", "guild"],
          ["creation date", "createdAt"],
          ["URL", "url"],
        ]),
        "property",
      )
      .appendField("of");
    this.setColour("336EFF");
    this.setOutput(true, null);
    this.setOnChange(function () {
      let type = this.getFieldValue("property");

      switch (type) {
        case "content":
        case "id":
        case "url":
          this.setOutput(true, "String");
          break;
        case "member":
          this.setOutput(true, "member");
          break;
        case "author":
          this.setOutput(true, "user");
          break;
        case "channel":
          this.setOutput(true, "channel");
          break;
        case "guild":
          this.setOutput(true, "server");
          break;
        case "createdAt":
          this.setOutput(true, "date");
          break;
        case "attachments":
          this.setOutput(true, "Array");
          break;
        default:
          this.setOutput(true, null);
          break;
      }
    });
  },
};

javascriptGenerator.forBlock["message_property"] = function (block, generator) {
  const message = generator.valueToCode(block, "message", Order.ATOMIC);
  const property = block.getFieldValue("property");

  const code =
    property === "attachments"
      ? `[...${message}.attachments.values()]`
      : `${message}.${property}`;

  return [code, Order.ATOMIC];
};

createRestrictions(
  [
    "msg_content",
    "msg_member",
    "msg_user",
    "msg_channel",
    "msg_server",
    "msg_delete",
    "msg_msg",
  ],
  [
    {
      type: "hasHat",
      blockTypes: ["msg_received", "message_author_not_bot"],
      message: 'This block must be in a "when a message is received" event',
    },
  ],
);

createRestrictions(
  ["msg_reply", "msg_reply_rows", "msg_edit", "msg_reply_mutator"],
  [
    {
      type: "hasHat",
      blockTypes: ["msg_received", "message_author_not_bot"],
      message: 'This block must be in a "when a message is received" event',
    },
    {
      type: "notEmpty",
      blockTypes: ["content", "embeds"],
      message: "You must specify the content and/or embed(s) to send",
    },
    {
      type: "validator",
      blockTypes: ["content"],
      check: val => val.length <= 2000,
      message: "Content cannot be greater than 2,000 characters",
    },
    {
      type: "validator",
      blockTypes: ["embeds"],
      check: (val, workspace) => {
        if (!val.length) return true;

        let embeds = val.split(",");
        let pass = true;

        embeds.forEach(embedName => {
          if (
            !workspace
              .getAllBlocks(false)
              .find(
                b =>
                  b.type === "embed_create" &&
                  b.getFieldValue("name") === embedName.trim(),
              )
          )
            pass = false;
        });

        return pass;
      },
      message: "No embed with that name exists",
    },
  ],
);

createRestrictions(
  ["message_property"],
  [
    {
      type: "notEmpty",
      blockTypes: ["message"],
      message: "You must specify the message to get the properties from",
    },
  ],
);
