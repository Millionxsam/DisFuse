import * as Blockly from 'blockly';
import { Order, javascriptGenerator } from 'blockly/javascript';

Blockly.Blocks['events_custom'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('When client receives')
      .appendField(new Blockly.FieldTextInput('event'), 'event')
      .appendField('parameters:')
      .appendField(new Blockly.FieldTextInput('abc, def'), 'parameters');
    this.appendStatementInput('code').setCheck('default');
    this.setColour('#999999');
  },
};

javascriptGenerator.forBlock['events_custom'] = function (block, generator) {
  var code_code = generator.statementToCode(block, 'code');
  var field_event = block.getFieldValue('event');
  var field_parameters = block.getFieldValue('parameters');

  var code = `client.on("${field_event}", async (${field_parameters}) => {
${code_code}});`;

  return code;
};

Blockly.Blocks['events_customParameter'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('get parameter')
      .appendField(new Blockly.FieldTextInput(''), 'parameter');
    this.setColour('#999999');
    this.setOutput(true, null);
  },
};

javascriptGenerator.forBlock['events_customParameter'] = function (block) {
  var parameter = block.getFieldValue('parameter');
  return [parameter, Order.NONE];
};
