import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

export function createEventBlock(
  blockId,
  fieldText,
  colour,
  eventName,
  eventVariables
) {
  if (Array.isArray(eventVariables)) eventVariables = eventVariables.join(", ");

  Blockly.Blocks[blockId] = {
    init: function () {
      this.appendDummyInput().appendField(fieldText);
      this.appendStatementInput("code").setCheck(null);
      this.setInputsInline(false);
      this.setColour(colour);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };

  javascriptGenerator.forBlock[blockId] = function (block, generator) {
    var statements_code = generator.statementToCode(block, "code");

    var code = `client.on('${eventName}', async (${eventVariables}) => {
    ${statements_code}});\n`;
    return code;
  };
}

export function createEventVariable(
  blockId,
  fieldText,
  colour,
  blockOutput,
  codeOutput
) {
  Blockly.Blocks[blockId] = {
    init: function () {
      this.appendDummyInput().appendField(fieldText);
      this.setInputsInline(false);
      this.setColour(colour);
      this.setOutput(true, blockOutput);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };

  javascriptGenerator.forBlock[blockId] = function () {
    return [codeOutput, Order.NONE];
  };
}
