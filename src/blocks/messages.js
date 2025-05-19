import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["msg_getone"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("String")
      .appendField("get the message with id equal to");
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("on the channel");
    this.setInputsInline(false);
    this.setOutput(true, "message");
    this.setColour("#336EFF");
  },
};

javascriptGenerator.forBlock["msg_getone"] = function (block, generator) {
  var id = generator.valueToCode(block, "id", Order.NONE);
  var channel = generator.valueToCode(block, "channel", Order.NONE);

  var code = `await ${channel}.messages.fetch(${id})`;

  return [code, Order.AWAIT];
};

Blockly.Blocks["msg_received"] = {
  init: function () {
    this.appendDummyInput().appendField("When a message is received");
    this.appendStatementInput("event").setCheck("default");
    this.setInputsInline(false);
    this.setColour("#336EFF");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_reply_mutator_options"] = {
  init() {
    this.appendDummyInput()
      .appendField("include embeds")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "embeds");
    this.appendDummyInput()
      .appendField("include rows")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "rows");
    this.appendDummyInput()
      .appendField('include "then" statement')
      .appendField(new Blockly.FieldCheckbox("FALSE"), "then");
    this.setColour("#336EFF");
    this.setInputsInline(false);
    this.contextMenu = false;
  },
};

Blockly.Blocks["msg_reply_mutator"] = {
  init() {
    this.appendDummyInput().appendField("Reply to the message");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#336EFF");

    this.setMutator(new Blockly.icons.MutatorIcon([], this));
    this.settings_ = { embeds: false, rows: false };
    this.update_();
  },
  mutationToDom() {
    const mutation = document.createElement("mutation");
    mutation.setAttribute("embed", this.settings_.embeds);
    mutation.setAttribute("rows", this.settings_.rows);
    mutation.setAttribute("then", this.settings_.then);
    return mutation;
  },
  domToMutation(xml) {
    this.settings_ = {
      embeds: xml.getAttribute("embed") === "true",
      rows: xml.getAttribute("rows") === "true",
      then: xml.getAttribute("then") === "true",
    };
    this.update_();
  },
  decompose(ws) {
    const block = ws.newBlock("msg_reply_mutator_options");
    block.initSvg();
    block.setFieldValue(this.settings_.embeds ? "TRUE" : "FALSE", "embeds");
    block.setFieldValue(this.settings_.rows ? "TRUE" : "FALSE", "rows");
    block.setFieldValue(this.settings_.then ? "TRUE" : "FALSE", "then");
    return block;
  },
  compose(opt) {
    this.settings_ = {
      embeds: opt.getFieldValue("embeds") === "TRUE",
      rows: opt.getFieldValue("rows") === "TRUE",
      then: opt.getFieldValue("then") === "TRUE",
    };
    this.update_();
  },
  update_() {
    const saved = {
      embeds: this.getInput("embeds")?.connection?.targetConnection || null,
      rows: this.getInput("rows")?.connection?.targetConnection || null,
      then: this.getInput("then")?.connection?.targetConnection || null,
    };

    if (this.getInput("embeds")) this.removeInput("embeds");
    if (this.getInput("rows")) this.removeInput("rows");
    if (this.getInput("then")) this.removeInput("then");

    if (this.settings_.embeds) {
      const input = this.appendValueInput("embeds")
        .setCheck("String")
        .appendField("embed name(s):");

      if (saved.embeds) input.connection.connect(saved.embeds);
    }

    if (this.settings_.rows) {
      const input = this.appendStatementInput("rows")
        .setCheck("rows")
        .appendField("rows:");

      if (saved.rows) input.connection.connect(saved.rows);
    }

    if (this.settings_.then) {
      const input = this.appendStatementInput("then")
        .setCheck("default")
        .appendField("then:");

      if (saved.then) input.connection.connect(saved.then);
    }

    this._saved = null;
  },
};

javascriptGenerator.forBlock["msg_reply_mutator"] = function (
  block,
  generator
) {
  const content = generator.valueToCode(block, "content", Order.ATOMIC) || "''";
  const embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  const ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);
  const rows = generator.statementToCode(block, "rows");
  const then = generator.statementToCode(block, "then");
  let thenCode = ";\n";

  const options = [`content: ${content}`];
  if (embeds) options.push(`embeds: [${embeds.replaceAll("'", "")}]`);
  if (rows) options.push(`components: [\n${rows}]`);
  if (ephemeral) options.push(`ephemeral: ${ephemeral}`);
  if (then) thenCode = `.then((messageSent) => {\n${then}});\n`;

  return `message.reply({
  ${options.join(",\n  ")}
})${thenCode}`;
};

Blockly.Blocks["msg_msg"] = {
  init: function () {
    this.appendDummyInput().appendField("message received");
    this.setOutput(true, "message");
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

Blockly.Blocks["msg_react"] = {
  init: function () {
    this.appendValueInput("message")
      .setCheck("message")
      .appendField("React to message:");
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
      check: (val) => /^(|([\p{Emoji}]{1}))$/u.test(val),
      message: "Emoji must be a single valid emoji",
    },
  ]
);

javascriptGenerator.forBlock["msg_react"] = function (block, generator) {
  var message = generator.valueToCode(block, "message", Order.ATOMIC);
  var reaction = generator.valueToCode(block, "reaction", Order.ATOMIC);

  return `${message}.react(${reaction});\n`;
};

javascriptGenerator.forBlock["msg_received"] = function (block, generator) {
  var codeState = generator.statementToCode(block, "event");

  var code = `client.on("messageCreate", async (message) => {
${codeState}});\n`;

  return code;
};

javascriptGenerator.forBlock["msg_msg"] = function (block, generator) {
  var code = "message";
  return [code, Order.NONE];
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

javascriptGenerator.forBlock["msg_delete"] = function (block, generator) {
  return "message.delete();";
};

Blockly.Blocks["msg_delete"] = {
  init: function () {
    this.appendDummyInput().appendField("Delete the user's message");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("336EFF");
    this.setTooltip("Delete the message received");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["msg_deleteOther"] = {
  init: function () {
    this.appendValueInput("message")
      .setCheck("message")
      .appendField("Delete message:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("336EFF");
    this.setTooltip("Delete a message");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["msg_deleteOther"] = function (block, generator) {
  var message = generator.valueToCode(block, "message", Order.ATOMIC);
  var code = `${message}.delete();\n`;
  return code;
};

Blockly.Blocks["msg_edit"] = {
  init: function () {
    this.appendValueInput("message")
      .setCheck("message")
      .appendField("Edit message:");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("336EFF");
    this.setTooltip(
      "Edit a message with content, embeds or rows (only works on messages the bot sent)"
    );
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["msg_edit"] = function (block, generator) {
  var message = generator.valueToCode(block, "message", Order.ATOMIC);
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  return `${message}.edit({
  content: ${content || "''"},
  embeds: [${embeds.replaceAll("'", "") || ""}],
  components: [
  ${rows}]
});\n`;
};

Blockly.Blocks["captcha_reply"] = {
  init: function () {
    this.appendValueInput("message")
      .setCheck("message")
      .appendField("Reply captcha to message:");
    this.appendValueInput("content")
      .setCheck("String")
      .appendField("with content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
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
  embeds: [${embeds.replaceAll("'", "") || ""}],
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
          ["ID", "id"],
          ["author as member", "member"],
          ["author as user", "author"],
          ["channel", "channel"],
          ["server", "guild"],
          ["creation date", "createdAt"],
          ["URL", "url"],
        ]),
        "property"
      )
      .appendField("of message");
    this.setColour("336EFF");
    this.setOutput(true, null);
    this.setOnChange(function () {
      let type = this.getFieldValue("property");

      switch (type) {
        case "content":
          this.setOutput(true, "String");
          break;
        case "id":
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
        case "url":
          this.setOutput(true, "String");
          break;
        default:
          this.setOutput(true, null);
          break;
      }
    });
  },
};

javascriptGenerator.forBlock["message_property"] = function (block, generator) {
  var val_message = generator.valueToCode(block, "message", Order.ATOMIC);
  var field_property = block.getFieldValue("property");
  var code = `${val_message}.${field_property}`;
  return [code, Order.NONE];
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
      blockTypes: ["msg_received"],
      message: 'This block must be in a "When a message is received" event',
    },
  ]
);

createRestrictions(
  ["msg_reply", "msg_reply_rows", "msg_edit", "msg_reply_mutator"],
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
    {
      type: "validator",
      blockTypes: ["content"],
      check: (val) => val.length <= 2000,
      message: "Content cannot be greater than 2,000 characters",
    },
    {
      type: "validator",
      blockTypes: ["embeds"],
      check: (val, workspace) => {
        if (!val.length) return true;

        let embeds = val.split(",");
        let pass = true;

        embeds.forEach((embedName) => {
          if (
            !workspace
              .getAllBlocks(false)
              .find(
                (b) =>
                  b.type === "embed_create" &&
                  b.getFieldValue("name") === embedName.trim()
              )
          )
            pass = false;
        });

        return pass;
      },
      message: "No embed with that name exists",
    },
  ]
);

createRestrictions(
  ["message_property"],
  [
    {
      type: "notEmpty",
      blockTypes: ["message"],
      message: "You must specify the message to get the properties from",
    },
  ]
);
