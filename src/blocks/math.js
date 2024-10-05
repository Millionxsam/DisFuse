import * as Blockly from 'blockly';
import { Order, javascriptGenerator } from 'blockly/javascript';

Blockly.Blocks['math_toNumber'] = {
  init: function () {
    this.appendValueInput('from').setCheck(null);
    this.appendDummyInput().appendField('to number');
    this.setColour('#cfa23a');
    this.setOutput(true, 'Number');
  },
};

javascriptGenerator.forBlock['math_toNumber'] = function (block, generator) {
  var val_from = generator.valueToCode(block, 'from', Order.ATOMIC);
  var code = `Number(${val_from})`;
  return [code, Order.NONE];
};
