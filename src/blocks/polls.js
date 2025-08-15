import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["poll_create"] = {
  init: function () {
    var validator = function (newValue) {
      return newValue.replace(/[^a-zA-Z0-9_$]/g, "");
    };

    this.appendDummyInput()
      .appendField("Create a poll named")
      .appendField(new Blockly.FieldTextInput("poll", validator), "NAME");
    this.appendValueInput("QUESTION")
      .setCheck("String")
      .appendField("set question to:");
    this.appendValueInput("DURATION")
      .setCheck("Number")
      .appendField("set duration (hours) to:");
    this.appendValueInput("MULTISELECT")
      .setCheck("Boolean")
      .appendField("allow multiple answers:");
    this.appendStatementInput("CHOICES")
      .setCheck("pollChoicesBlock")
      .appendField("choices");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#656b75");
    this.setTooltip("Creates a new Discord poll.");
  },
};

createRestrictions(
  ["poll_create"],
  [
    {
      type: "validator",
      blockTypes: ["QUESTION"],
      check: (val) => val.length <= 300,
      message: "Question cannot be greater than 300 characters",
    },
    {
      type: "validator",
      blockTypes: ["DURATION"],
      check: (val) => 0 <= parseInt(val) && parseInt(val) <= 336,
      message: "Duration must be between 0 and 336 hours (2 weeks)",
    },
  ]
);

javascriptGenerator.forBlock["poll_create"] = function (block, generator) {
  var text_name = block.getFieldValue("NAME");
  var value_question = generator.valueToCode(block, "QUESTION", Order.ATOMIC);
  var value_duration = generator.valueToCode(block, "DURATION", Order.ATOMIC);
  var value_multiselect = generator.valueToCode(
    block,
    "MULTISELECT",
    Order.ATOMIC
  );
  var statements_choices = generator.statementToCode(block, "CHOICES");

  return `let PollCreator${text_name} = {
  question: {
    text: ${value_question || "''"}
  },
  answers: [${statements_choices}],
  duration: ${value_duration || "24"},
  allowMultiselect: ${value_multiselect || "false"}
};\n`;
};

Blockly.Blocks["poll_choice"] = {
  init: function () {
    this.appendDummyInput().appendField("Create a choice");
    this.appendValueInput("TEXT").setCheck("String").appendField("with text:");
    this.appendValueInput("EMOJI")
      .setCheck(["String", "emoji"])
      .appendField("with emoji:");
    this.setPreviousStatement(true, "pollChoicesBlock");
    this.setNextStatement(true, "pollChoicesBlock");
    this.setColour("#656b75");
    this.setTooltip("Creates a choice for a poll.");
  },
};

createRestrictions(
  ["poll_choice"],
  [
    {
      type: "validator",
      blockTypes: ["TEXT"],
      check: (val) => val.length <= 55,
      message: "Text cannot be greater than 55 characters",
    },
    {
      type: "validator",
      blockTypes: ["EMOJI"],
      check: (val) => /^(|([\p{Emoji}]{1}))$/u.test(val),
      message: "Emoji must be a single valid emoji",
    },
  ]
);

javascriptGenerator.forBlock["poll_choice"] = function (block, generator) {
  var value_text = generator.valueToCode(block, "TEXT", Order.ATOMIC);
  var value_emoji = generator.valueToCode(block, "EMOJI", Order.ATOMIC);

  return `{ text: ${value_text || "''"}, emoji: ${value_emoji || "null"}},\n`;
};

Blockly.Blocks["poll_sendchannel"] = {
  init: function () {
    var validator = function (newValue) {
      return newValue.replace(/[^a-zA-Z0-9_$]/g, "");
    };

    this.appendDummyInput()
      .appendField("Send poll named:")
      .appendField(new Blockly.FieldTextInput("poll", validator), "NAME");
    this.appendValueInput("CHANNEL")
      .setCheck("channel")
      .appendField("to channel:");
    this.appendValueInput("MESSAGE")
      .setCheck("String")
      .appendField("with text:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#656b75");
  },
};

javascriptGenerator.forBlock["poll_sendchannel"] = function (block, generator) {
  var text_name = block.getFieldValue("NAME");
  var value_channel = generator.valueToCode(block, "CHANNEL", Order.ATOMIC);
  var value_message =
    generator.valueToCode(block, "MESSAGE", Order.ATOMIC) || "";

  return `${value_channel}.send({
  content: ${value_message || "''"},
  poll: PollCreator${text_name}
});\n`;
};

createRestrictions(
  ["poll_sendchannel"],
  [
    {
      type: "validator",
      blockTypes: ["MESSAGE"],
      check: (val) => val.length <= 2000,
      message: "Text cannot be greater than 2,000 characters",
    },
  ]
);

Blockly.Blocks["poll_whenvoteadded"] = {
  init: function () {
    this.appendDummyInput().appendField("When a vote is added to a poll");
    this.appendStatementInput("CODE").setCheck("default");
    this.setColour("#656b75");
    this.setTooltip(
      "Runs the code inside when a vote is added to any poll the bot can access to."
    );
  },
};

javascriptGenerator.forBlock["poll_whenvoteadded"] = function (
  block,
  generator
) {
  var code = generator.statementToCode(block, "CODE");

  return `client.on(Events.MessagePollVoteAdd, async (pollVoteAdded, userVoteAdd) {
${code}
});\n`;
};

Blockly.Blocks["poll_whenvoteaddedvotetext"] = {
  init: function () {
    this.appendDummyInput().appendField("poll vote text");
    this.setColour("#656b75");
    this.setOutput(true, "String");
    this.setTooltip("The text of the vote.");
  },
};

javascriptGenerator.forBlock["poll_whenvoteaddedvotetext"] = () => [
  "pollVoteAdded.text",
  Order.NONE,
];

Blockly.Blocks["poll_whenvoteaddedvoteemoji"] = {
  init: function () {
    this.appendDummyInput().appendField("poll vote emoji");
    this.setColour("#656b75");
    this.setOutput(true, ["String", "emoji"]);
    this.setTooltip("The emoji of the vote.");
  },
};

javascriptGenerator.forBlock["poll_whenvoteaddedvoteemoji"] = () => [
  "pollVoteAdded.emoji",
  Order.NONE,
];

Blockly.Blocks["poll_whenvoteaddedvoteuser"] = {
  init: function () {
    this.appendDummyInput().appendField("poll vote author");
    this.setColour("#656b75");
    this.setOutput(true, "user");
    this.setTooltip("The user that added the vote to the poll.");
  },
};

javascriptGenerator.forBlock["poll_whenvoteaddedvoteuser"] = () => [
  "userVoteAdd",
  Order.NONE,
];

createRestrictions(
  [
    "poll_whenvoteaddedvotetext",
    "poll_whenvoteaddedvoteemoji",
    "poll_whenvoteaddedvoteuser",
  ],
  [
    {
      type: "hasHat",
      blockTypes: ["poll_whenvoteadded"],
      message:
        "This block must be in the 'When a vote is added to a poll' event",
    },
  ]
);
