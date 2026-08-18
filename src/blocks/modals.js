import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["modal_create"] = {
  init: function () {
    this.appendValueInput("title")
      .appendField("create modal with title:")
      .setCheck("String");
    this.appendValueInput("customId")
      .appendField("custom ID:")
      .setCheck("String");
    this.appendStatementInput("components")
      .setCheck("Array")
      .appendField("components:");
    this.setOutput(true, "modal");
    this.setColour("#1A8793");
    this.setTooltip("Creates a modal.");
  },
};

javascriptGenerator.forBlock["modal_create"] = function (block, generator) {
  var title = generator.valueToCode(block, "title", Order.ATOMIC);
  var customId = generator.valueToCode(block, "customId", Order.ATOMIC);
  var components = generator.statementToCode(block, "components");

  const code = `new Discord.ModalBuilder()
  .setTitle(${title})
  .setCustomId(${customId})
  .addComponents(
  ${components})`;
  return [code, Order.NEW];
};

Blockly.Blocks["modal_show"] = {
  init: function () {
    this.appendValueInput("modal").setCheck("modal").appendField("show modal:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#1A8793");
    this.setTooltip("Shows the modal on the interaction.");
  },
};

javascriptGenerator.forBlock["modal_show"] = function (block, generator) {
  var modal = generator.valueToCode(block, "modal", Order.ATOMIC);

  var code = `interaction.showModal(
  ${modal}
);\n`;
  return code;
};

Blockly.Blocks["modal_handle_interaction"] = {
  init: function () {
    this.appendDummyInput().appendField("when a modal is submitted");
    this.appendStatementInput("code").setCheck("default");
    this.setColour("#1A8793");
    this.setTooltip("Runs the code when a modal is sub");
  },
};

javascriptGenerator.forBlock["modal_handle_interaction"] = function (
  block,
  generator,
) {
  var statements_code = generator.statementToCode(block, "code");

  const code = `client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  ${statements_code}});\n`;
  return code;
};

Blockly.Blocks["modal_get_input_value"] = {
  init: function () {
    this.appendValueInput("customId").appendField(
      "get text from input with custom id:",
    );
    this.appendDummyInput().appendField("from the modal");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#1A8793");
    this.setTooltip("Gets the value of a text input in a modal.");
  },
};

javascriptGenerator.forBlock["modal_get_input_value"] = function (
  block,
  generator,
) {
  var customId = generator.valueToCode(block, "customId", Order.ATOMIC);

  const code = `(interaction).fields.getTextInputValue(${customId})`;
  return [code, Order.ATOMIC];
};

Blockly.Blocks["modal_get_author"] = {
  init: function () {
    this.appendDummyInput().appendField("user that submited the modal");
    this.setOutput(true, "user");
    this.setColour("#1A8793");
    this.setTooltip("Gets the author that submited the modal.");
  },
};

javascriptGenerator.forBlock["modal_get_author"] = function (block, generator) {
  return [`(interaction).user`, Order.ATOMIC];
};

Blockly.Blocks["modal_get_customId"] = {
  init: function () {
    this.appendDummyInput().appendField("custom ID of the modal");
    this.setOutput(true, "String");
    this.setColour("#1A8793");
    this.setTooltip("Gets the custom ID of the modal.");
  },
};

javascriptGenerator.forBlock["modal_get_customId"] = function (
  block,
  generator,
) {
  return [`(interaction).customId`, Order.ATOMIC];
};

createRestrictions(
  ["modal_create"],
  [
    {
      type: "notEmpty",
      blockTypes: ["title"],
      message: "You must specify the title for the modal",
    },
    {
      type: "notEmpty",
      blockTypes: ["customId"],
      message: "You must specify the custom ID for the modal",
    },
    {
      type: "notEmpty",
      blockTypes: ["components"],
      message: "You must specify the components for the modal",
    },
    {
      type: "validator",
      blockTypes: ["title"],
      check: (val) => val.length <= 100,
      message: "Title cannot be greater than 100 characters",
    },
    {
      type: "validator",
      blockTypes: ["customId"],
      check: (val) => val.length <= 100,
      message: "Custom ID cannot be greater than 100 characters",
    },
    {
      type: "validator",
      blockTypes: ["customId"],
      check: (val) => /^[a-z0-9_-]+$/.test(val),
      message:
        "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
    },
  ],
);

createRestrictions(
  ["modal_show"],
  [
    {
      type: "notEmpty",
      blockTypes: ["modal"],
      message: "You must specify the modal to show",
    },
    {
      type: "hasHat",
      blockTypes: [
        "modal_handle_interaction",
        "slash_received",
        "contextMenu_received",
        "buttons_event",
        "menus_event",
      ],
      message: "This block must be under an interaction event",
    },
  ],
);

createRestrictions(
  ["modal_get_input_value"],
  [
    {
      type: "notEmpty",
      blockTypes: ["customId"],
      message:
        "You must specify the custom ID of the input to get the value from",
    },
    {
      type: "hasHat",
      blockTypes: ["modal_handle_interaction"],
      message: 'This block must be under a "when a modal is submited" event',
    },
  ],
);

createRestrictions(
  ["modal_get_author"],
  [
    {
      type: "hasHat",
      blockTypes: ["modal_handle_interaction"],
      message: 'This block must be under a "when a modal is submited" event',
    },
  ],
);
