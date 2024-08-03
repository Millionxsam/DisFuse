import * as Blockly from "blockly/core";
import javascript from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["webhooks_create"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Create a webhook with the name:")
      .appendField(new Blockly.FieldTextInput("name"), "NAME");
    this.appendValueInput("avatar")
      .setCheck("String")
      .appendField("with the avatar URL:");
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("in channel:");
    this.appendStatementInput("code").setCheck("webhookActionBlock").appendField("then");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#2d39a6");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["webhooks_send"] = {
  init: function () {
    this.appendDummyInput().appendField("Send a message as the webhook");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.setPreviousStatement(true, "webhookActionBlock");
    this.setNextStatement(true, "webhookActionBlock");
    this.setColour("#2d39a6");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["webhooks_send"] = function (
  block,
  generator
) {
  var value_content = generator.valueToCode(
    block,
    "content",
    javascript.Order.ATOMIC
  );

  var code = `webhook.send({
    content: ${value_content || "''"}
  });`;
  return code;
};

javascript.javascriptGenerator.forBlock["webhooks_create"] = function (
  block,
  generator
) {
  var text_name = block.getFieldValue("NAME");
  var value_avatar = generator.valueToCode(
    block,
    "avatar",
    javascript.Order.ATOMIC
  );
  var value_channel = generator.valueToCode(
    block,
    "channel",
    javascript.Order.ATOMIC
  );
  var statements_code = generator.statementToCode(block, "code");

  var code = `${value_channel}.createWebhook({
        name: "${text_name}",
        avatar: ${value_avatar || '""'}
    }).then(webhook => {
        ${statements_code}
    });`;
  return code;
};

Blockly.Blocks["webhooks_delete"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Delete the webhook");
    this.setPreviousStatement(true, "webhookActionBlock");
    this.setNextStatement(true, "webhookActionBlock");
    this.setColour("#2d39a6");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["webhooks_delete"] = function (
  block,
  generator
) {
  var code = `webhook.delete();`;
  return code;
};

createRestrictions(
  ["webhooks_create"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel to create the webhook in",
    },
  ]
);

createRestrictions(
  ["webhooks_send"],
  [
    {
      type: "notEmpty",
      blockTypes: ["content"],
      message: "You must specify content to send",
    },
  ]
);

createRestrictions(
  ["webhooks_delete", "webhooks_send"],
  [
    {
      type: "hasParent",
      blockTypes: ["webhooks_create"],
      message: "This block must be under the 'Create a webhook' block",
    }
  ]
)