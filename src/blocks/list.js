import * as Blockly from 'blockly';
import { Order, javascriptGenerator } from 'blockly/javascript';
import { createRestrictions } from '../functions/restrictions';

Blockly.Blocks['list_filter'] = {
  init: function () {
    this.appendValueInput('list').setCheck('Array').appendField('filter list');
    this.appendValueInput('method').setCheck('Boolean').appendField('by');
    this.setInputsInline(true);
    this.setColour('#9966ff');
    this.setTooltip(
      "Remove all items in a list which doesn't match the boolean"
    );
    this.setOutput(true, 'Array');
  },
};

javascriptGenerator.forBlock['list_filter'] = function (block, generator) {
  var val_list = generator.valueToCode(block, 'list', Order.ATOMIC);
  var val_method = generator.valueToCode(block, 'method', Order.ATOMIC);
  var code = `${val_list}.filter((filterItem) => ${val_method})`;
  return [code, Order.NONE];
};

Blockly.Blocks['list_filter_item'] = {
  init: function () {
    this.appendDummyInput('name').appendField('item in loop');
    this.setInputsInline(true);
    this.setColour('#9966ff');
    this.setOutput(true, null);
  },
};

javascriptGenerator.forBlock['list_filter_item'] = () => [
  'filterItem',
  Order.NONE,
];

createRestrictions(
  ['list_filter_item'],
  [
    {
      type: 'hasParent',
      blockTypes: ['list_filter'],
      message: "This block must be inside a 'filter by' block",
    },
  ]
);

Blockly.Blocks['list_merge'] = {
  init: function () {
    this.appendValueInput('list').setCheck('Array').appendField('merge list');
    this.appendValueInput('list2').setCheck('Array').appendField('with');
    this.setInputsInline(true);
    this.setColour('#9966ff');
    this.setOutput(true, 'Array');
  },
};

javascriptGenerator.forBlock['list_merge'] = function (block, generator) {
  var val_list = generator.valueToCode(block, 'list', Order.ATOMIC);
  var val_list2 = generator.valueToCode(block, 'list2', Order.ATOMIC);
  var code = `${val_list}.concat(${val_list2})`;
  return [code, Order.NONE];
};
