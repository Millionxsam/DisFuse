import * as Blockly from "blockly";
import javascript from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["misc_addrow"] = {
  init: function () {
    this.appendDummyInput().appendField("Add a row");
    this.appendStatementInput("components").setCheck(null).appendField("with:");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("4192E9");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["misc_addrow"] = function (
  block,
  generator
) {
  var statements_components = generator.statementToCode(block, "components");

  var code = `new Discord.ActionRowBuilder().addComponents([${statements_components}]),`;
  return code;
};

createRestrictions(
  ["misc_addrow"],
  [
    {
      type: "surroundParent",
      blockTypes: ["msg_reply_rows"],
      message:
        "This block must be under 'reply to the message with rows' block",
    },
  ]
);
