import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";
/*import { createRestrictions } from "../functions/restrictions";*/

Blockly.Blocks["my_custom_output"] = {
  init: function () {
    this.appendDummyInput()
    .appendField('🥩')
    .appendField(new Blockly.FieldTextInput('hi'), 'input')
    .appendField('🥩');
    this.setOutput(true, 'String')
    this.setColour("#014f98");
  },
};

javascriptGenerator.forBlock["my_custom_output"] = function (block) {
  return [Order.NONE, `${block.getFieldValue('input')}`];
};

const shadowXml = Blockly.utils.xml.textToDom(`<block type="my_custom_output"></block>`);

Blockly.Blocks["my_custom_block"] = {
  init: function () {
    let makeInputBlock = () =>
      Blockly.Xml.domToBlock(shadowXml, this.workspace);

    this.appendValueInput("input")
      .setCheck("String")
      .appendField("can't get replaced →");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#014f98");

    this.setOnChange(function (event) {
      if (!this.workspace || this.isInFlyout) return;

      const input = this.getInput("input");
      if (!input) return;
      const connection = input.connection;
      if (!connection) return;

      const targetBlock = connection.targetBlock();

      const shouldConnectNewBlock =
        event?.type === "drag" ||
        (targetBlock?.type !== shadowXml.getAttribute('type') &&
          (event?.blockId === this.id ||
            event?.blockId === targetBlock?.id ||
            event?.blockId === targetBlock?.getParent()?.id));

      if (shouldConnectNewBlock) {
        if (targetBlock) targetBlock.dispose();
        makeInputBlock().outputConnection.connect(connection);
      }
    });
  },
};

javascriptGenerator.forBlock["my_custom_block"] = function (block, generator) {
  return `console.log(${generator.valueToCode("input")});\n`;
};