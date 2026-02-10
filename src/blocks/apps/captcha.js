import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../../functions/restrictions";
import { createMutatorBlock } from "../../functions/createMutator.ts";

Blockly.Blocks["captcha_create"] = {
  init: function () {
    this.appendDummyInput().appendField("Create new captcha");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
  },
};

javascriptGenerator.forBlock["captcha_create"] = () =>
  "let captcha = new Captcha().generate('image/png');\n";

createMutatorBlock({
  id: "captcha_create_mutator",
  optionsBlockId: "captcha_create_mutator_options",
  colour: "#0fbd8c",
  inputs: [{ type: "dummy", label: "Create new captcha" }],
  mutatorFields: [
    {
      name: "width",
      label: "include width",
      inputType: "value",
      inputLabel: "width:",
      valueCheck: "Number",
    },
    {
      name: "height",
      label: "include height",
      inputType: "value",
      inputLabel: "height:",
      valueCheck: "Number",
    },
    {
      name: "backgroundcolor",
      label: "include background color",
      inputType: "value",
      inputLabel: "background color:",
      valueCheck: "Colour",
    },
    {
      name: "textcolor",
      label: "include text color",
      inputType: "value",
      inputLabel: "text color:",
      valueCheck: "Colour",
    },
    {
      name: "font",
      label: "include font",
      inputType: "value",
      inputLabel: "font:",
      valueCheck: "String",
    },
    {
      name: "fontsize",
      label: "include font size",
      inputType: "value",
      inputLabel: "font size:",
      valueCheck: "Number",
    },
    {
      name: "characters",
      label: "include characters",
      inputType: "value",
      inputLabel: "characters:",
      valueCheck: "String",
    },
    {
      name: "charlength",
      label: "include character length",
      inputType: "value",
      inputLabel: "amount of characters:",
      valueCheck: "Number",
    },
    {
      name: "noiselines",
      label: "include noise lines",
      inputType: "value",
      inputLabel: "noise lines:",
      valueCheck: "Number",
    },
    {
      name: "noisedots",
      label: "include noise dots",
      inputType: "value",
      inputLabel: "noise dots:",
      valueCheck: "Number",
    },
    {
      name: "noisecolor",
      label: "include noise color",
      inputType: "value",
      inputLabel: "noise color:",
      valueCheck: "Colour",
    },
  ],
  nextStatement: "default",
  previousStatement: "default",
});

javascriptGenerator.forBlock["captcha_create_mutator"] = function (
  block,
  generator,
) {
  const width = generator.valueToCode(block, "width", Order.NONE);
  const height = generator.valueToCode(block, "height", Order.NONE);
  const backgroundColor = generator.valueToCode(
    block,
    "backgroundcolor",
    Order.NONE,
  );
  const textColor = generator.valueToCode(block, "textcolor", Order.NONE);
  const font = generator.valueToCode(block, "font", Order.NONE);
  const fontSize = generator.valueToCode(block, "fontsize", Order.NONE);
  const characters = generator.valueToCode(block, "characters", Order.NONE);
  const charLength = generator.valueToCode(block, "charlength", Order.NONE);
  const noiseLines = generator.valueToCode(block, "noiselines", Order.NONE);
  const noiseDots = generator.valueToCode(block, "noisedots", Order.NONE);
  const noiseColor = generator.valueToCode(block, "noisecolor", Order.NONE);

  const options = [
    width && `width: ${width}`,
    height && `height: ${height}`,
    backgroundColor && `backgroundColor: ${backgroundColor}`,
    textColor && `textColor: ${textColor}`,
    font && `font: ${font}`,
    fontSize && `fontSize: ${fontSize}`,
    characters && `characters: ${characters}`,
    charLength && `charLength: ${charLength}`,
    noiseLines && `noiseLines: ${noiseLines}`,
    noiseDots && `noiseDots: ${noiseDots}`,
    noiseColor && `noiseColor: ${noiseColor}`,
  ].filter(Boolean);

  return `let captcha = new Captcha(${
    options.length !== 0 ? "{" + options.join(",\n  ") + "}" : ""
  }).generate('image/png');\n`;
};

Blockly.Blocks["captcha_addFile"] = {
  init: function () {
    this.appendDummyInput().appendField("Add captcha as file");
    this.setPreviousStatement(true, "files");
    this.setNextStatement(true, "files");
    this.setColour("#0fbd8c");
  },
};

javascriptGenerator.forBlock["captcha_addFile"] = function () {
  return `new Discord.AttachmentBuilder(captcha.buffer, { name: "captcha.png" }),\n`;
};

Blockly.Blocks["captcha_send"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("Send captcha to channel:");
    this.appendValueInput("content")
      .setCheck("String")
      .appendField("with content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setPreviousStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Sends a captcha image in a channel");
  },
};

javascriptGenerator.forBlock["captcha_send"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  const code = `await ${channel}.send({
  files: [{ attachment: captcha.buffer, name: "captcha.png" }],
  content: ${content || "''"},
  embeds: [${embeds.replaceAll("'", "") || ""}],
  components: [
  ${rows}]
});\n`;

  return code;
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
  files: [{ attachment: captcha.buffer, name: "captcha.png" }],
  content: ${content || "''"},
  embeds: [${embeds.replaceAll("'", "") || ""}],
  components: [
  ${rows}]
});\n`;
};

Blockly.Blocks["captcha_replyInteraction"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply captcha to interaction");
    this.appendValueInput("content")
      .setCheck("String")
      .appendField("with content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendValueInput("ephemeral")
      .setCheck("Boolean")
      .appendField("visible only to the user?");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Replies to the interaction with a captcha");
  },
};

javascriptGenerator.forBlock["captcha_replyInteraction"] = function (
  block,
  generator,
) {
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");
  var value_ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);

  return `interaction.reply({
  files: [{ attachment: captcha.buffer, name: "captcha.png" }],
  content: ${content || "''"},
  embeds: [${embeds.replaceAll("'", "") || ""}],
  ephemeral: ${value_ephemeral || "false"}
  components: [
  ${rows}]
});\n`;
};

createRestrictions(
  ["captcha_replyInteraction"],
  [
    {
      type: "hasHat",
      blockTypes: [
        "slash_received",
        "buttons_event",
        "modal_handle_interaction",
        "menus_event",
        "contextMenu_received",
      ],
      message: "This must be under a interaction event",
    },
  ],
);

Blockly.Blocks["captcha_value"] = {
  init: function () {
    this.appendDummyInput().appendField("get text of captcha");
    this.setOutput(true, "String");
    this.setColour("#0fbd8c");
    this.setTooltip("Gets the text of the captcha");
  },
};

javascriptGenerator.forBlock["captcha_value"] = () => [
  "captcha.text",
  Order.NONE,
];

createRestrictions(
  ["captcha_value", "captcha_send", "captcha_reply", "captcha_addFile"],
  [
    {
      type: "hasBlockInParent",
      blockTypes: ["captcha_create", "captcha_create_mutator"],
      message: 'This block must be used AFTER a "Create new captcha" block',
    },
  ],
);

createRestrictions(
  ["captcha_send"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel to send the captcha in",
    },
  ],
);

createRestrictions(
  ["captcha_reply"],
  [
    {
      type: "notEmpty",
      blockTypes: ["message"],
      message: "You must specify the message to reply with the captcha",
    },
  ],
);
