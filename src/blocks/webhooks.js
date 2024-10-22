import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["webhooks_create"] = {
  init: function () {
    this.appendValueInput("name")
      .appendField("Create a webhook with the name:")
      .setCheck("String");
    this.appendValueInput("avatar")
      .setCheck("String")
      .appendField("and avatar URL:");
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("in channel:");
    this.appendStatementInput("code").setCheck("default").appendField("then");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#D49E55");
  },
};

Blockly.Blocks["webhooks_createdWebhook"] = {
  init: function () {
    this.appendDummyInput().appendField("created webhook");
    this.setOutput(true, "webhook");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_createdWebhook"] = () => [
  "newWebhook",
  Order.NONE,
];

Blockly.Blocks["webhooks_send"] = {
  init: function () {
    this.appendValueInput("webhook")
      .setCheck("webhook")
      .appendField("Send a message as webhook:");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_send"] = function (block, generator) {
  var content = generator.valueToCode(block, "content", Order.ATOMIC);

  var webhook = generator.valueToCode(block, "webhook", Order.ATOMIC);

  var code = `${webhook}.send({
  content: ${content || "''"}
});`;
  return code;
};

javascriptGenerator.forBlock["webhooks_create"] = function (block, generator) {
  var name = generator.valueToCode(block, "name", Order.NONE);
  var avatar = generator.valueToCode(block, "avatar", Order.ATOMIC);

  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var statements_code = generator.statementToCode(block, "code");

  var code = `${channel}.createWebhook({
  name: ${name},
  avatar: ${avatar || '""'}
}).then(async (newWebhook) => {
  ${statements_code}});`;

  return code;
};

Blockly.Blocks["webhooks_delete"] = {
  init: function () {
    this.appendValueInput("webhook")
      .setCheck("webhook")
      .appendField("Delete the webhook:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_delete"] = function (block, generator) {
  var webhook = generator.valueToCode(block, "webhook", Order.ATOMIC);

  var code = `${webhook}.delete();`;
  return code;
};

Blockly.Blocks["webhooks_edit"] = {
  init: function () {
    this.appendValueInput("webhook")
      .setCheck("webhook")
      .appendField("Edit the webhook:");
    this.appendValueInput("name")
      .appendField("with new name:")
      .setCheck("String");
    this.appendValueInput("avatar")
      .setCheck("String")
      .appendField("and new avatar URL:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_edit"] = function (block, generator) {
  var name = generator.valueToCode(block, "name", Order.NONE);
  var avatar = generator.valueToCode(block, "avatar", Order.ATOMIC);
  var webhook = generator.valueToCode(block, "webhook", Order.ATOMIC);

  var code = `${webhook}.edit({
  name: ${name}, ${avatar ? `\navatar: ${avatar}` : ""}
});`;
  return code;
};

Blockly.Blocks["webhooks_fetch"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("String")
      .appendField("get webhook with ID:");
    this.appendValueInput("token").setCheck("String").appendField("and token:");
    this.setOutput(true, "webhook");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_fetch"] = function (block, generator) {
  var id = generator.valueToCode(block, "id", Order.ATOMIC);
  var token = generator.valueToCode(block, "token", Order.ATOMIC);

  var code = `client.fetchWebhook(${id}, ${token}).then((webhook) => { return webhook })`;

  return [code, Order.NONE];
};

Blockly.Blocks["webhooks_token"] = {
  init: function () {
    this.appendValueInput("webhook")
      .setCheck("webhook")
      .appendField("token of webhook:");
    this.setOutput(true, "String");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_token"] = function (block, generator) {
  var webhook = generator.valueToCode(block, "webhook", Order.ATOMIC);
  var code = `${webhook}.token`;
  return [code, Order.NONE];
};

Blockly.Blocks["webhooks_name"] = {
  init: function () {
    this.appendValueInput("webhook")
      .setCheck("webhook")
      .appendField("name of webhook:");
    this.setOutput(true, "String");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_name"] = function (block, generator) {
  var webhook = generator.valueToCode(block, "webhook", Order.ATOMIC);
  var code = `${webhook}.name`;
  return [code, Order.NONE];
};

Blockly.Blocks["webhooks_owner"] = {
  init: function () {
    this.appendValueInput("webhook")
      .setCheck("webhook")
      .appendField("user owner of webhook:");
    this.setOutput(true, "user");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_owner"] = function (block, generator) {
  var webhook = generator.valueToCode(block, "webhook", Order.ATOMIC);
  var code = `${webhook}.owner`;
  return [code, Order.NONE];
};

Blockly.Blocks["webhooks_id"] = {
  init: function () {
    this.appendValueInput("webhook")
      .setCheck("webhook")
      .appendField("id of webhook:");
    this.setOutput(true, "String");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_id"] = function (block, generator) {
  var webhook = generator.valueToCode(block, "webhook", Order.ATOMIC);
  var code = `${webhook}.id`;
  return [code, Order.NONE];
};

Blockly.Blocks["webhooks_createdAt"] = {
  init: function () {
    this.appendValueInput("webhook")
      .setCheck("webhook")
      .appendField("creation date of webhook:");
    this.setOutput(true, "date");
    this.setColour("#D49E55");
  },
};

javascriptGenerator.forBlock["webhooks_createdAt"] = function (
  block,
  generator
) {
  var webhook = generator.valueToCode(block, "webhook", Order.ATOMIC);
  var code = `${webhook}.createdAt`;
  return [code, Order.NONE];
};

createRestrictions(
  ["webhooks_fetch"],
  [
    {
      type: "notEmpty",
      blockTypes: ["id"],
      message: "You must specify the ID of the webhook ",
    },
    {
      type: "notEmpty",
      blockTypes: ["token"],
      message: "You must specify the token of the webhook ",
    },
  ]
);

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
      message: "You must specify the content to send",
    },
  ]
);

createRestrictions(
  ["webhooks_createdWebhook"],
  [
    {
      type: "hasParent",
      blockTypes: ["webhooks_create"],
      message: "This block must be under the 'Create a webhook' block",
    },
  ]
);

createRestrictions(
  [
    "webhooks_send",
    "webhooks_delete",
    "webhooks_edit",
    "webhooks_token",
    "webhooks_name",
    "webhooks_owner",
    "webhooks_id",
    "webhooks_createdAt",
  ],
  [
    {
      type: "notEmpty",
      blockTypes: ["webhook"],
      message: "You must specify the webhook",
    },
  ]
);
