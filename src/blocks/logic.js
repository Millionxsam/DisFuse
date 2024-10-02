import * as Blockly from 'blockly/core';
import { Order, javascriptGenerator } from 'blockly/javascript';
import { createRestrictions } from '../functions/restrictions';

Blockly.Blocks['logic_nullishOperator'] = {
  init: function () {
    this.appendValueInput('value').setCheck(null).appendField('use value:');
    this.appendValueInput('fallback')
      .setCheck(null)
      .appendField('if')
      .appendField(
        new Blockly.FieldDropdown([
          ['null', '??'],
          ['null or false', '||'],
        ]),
        'type'
      )
      .appendField('use:');
    this.setInputsInline(false);
    this.setColour('#4c97ff');
    this.setTooltip(
      'Returns the second value if the first value is nullish; otherwise, it returns the first value.'
    );
    this.setHelpUrl('');
    this.setOutput(true, null);
  },
};

javascriptGenerator.forBlock['logic_nullishOperator'] = function (
  block,
  generator
) {
  var value = generator.valueToCode(block, 'value', Order.ATOMIC);
  var fallback = generator.valueToCode(block, 'fallback', Order.ATOMIC);
  var type = block.getFieldValue('type');

  var code = `${value} ${type} ${fallback}`;

  return [code, Order.NONE];
};

createRestrictions(
  ['logic_nullishOperator'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['value'],
      message: 'You must specify the value',
    },
    {
      type: 'notEmpty',
      blockTypes: ['fallback'],
      message: 'You must specify the fallback value',
    },
  ]
);
