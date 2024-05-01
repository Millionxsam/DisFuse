import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["channel_send"] = {
  init: function () {
    this.appendDummyInput().appendField("Send a message");
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("in channel:");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("D39600");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["channel_send"] = function (block, generator) {
  var value_channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);

  var code = `${value_channel}.send({
        content: ${value_content},
        embeds: [${value_embeds.replaceAll("'", "")}]
    });`;
  return code;
};

createRestrictions(
  ["channel_send"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel to send the message in",
    },
    {
      type: "notEmpty",
      blockTypes: ["content", "embeds"],
      message: "You must specify the content or embeds to send",
    },
  ]
);
