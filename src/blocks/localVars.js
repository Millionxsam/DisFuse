import * as Blockly from 'blockly';
import { Order, javascriptGenerator } from 'blockly/javascript';

Blockly.Blocks['localVars_set'] = {
  init: function () {

    this.appendValueInput('value')
      .setCheck(null)
      .appendField('set')
      .appendField(
        new Blockly.FieldTextInput('variable', (val) => {
          if (/^(?![_$a-zA-Z])|[^_$a-zA-Z0-9]/.test(val)) return null;
          else return val;
        }),
        'variable'
      )
      .appendField('to');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#d98e2b');
  },
};

javascriptGenerator.forBlock['localVars_set'] = function (block, generator) {
  var variable = block.getFieldValue('variable');
  var value = generator.valueToCode(block, 'value', Order.ATOMIC) || 'null';

  return `var ${variable} = ${value};\n`;
};

Blockly.Blocks['localVars_change'] = {
  init: function () {
    var validator = function (newValue) {
      if (/^[a-zA-Z0-9]+$/.test(newValue)) {
        return newValue;
      } else {
        return null;
      }
    };

    var varInput = new Blockly.FieldTextInput('variable');
    varInput.setValidator(validator);

    this.appendValueInput('value')
      .setCheck('Number')
      .appendField('change')
      .appendField(varInput, 'variable')
      .appendField('by');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#d98e2b');
  },
};

javascriptGenerator.forBlock['localVars_change'] = function (block, generator) {
  var variable = block.getFieldValue('variable');
  var value = generator.valueToCode(block, 'value', Order.ATOMIC) || 'null';

  return `${variable} += ${value};\n`;
};

Blockly.Blocks['localVars_get'] = {
  init: function () {
    var validator = function (newValue) {
      if (/^[a-zA-Z0-9]+$/.test(newValue)) {
        return newValue;
      } else {
        return null;
      }
    };

    var varInput = new Blockly.FieldTextInput('variable');
    varInput.setValidator(validator);

    this.appendDummyInput()
      .appendField('value of variable')
      .appendField(varInput, 'variable');
    this.setOutput(true, null);
    this.setColour('#d98e2b');
  },
};

javascriptGenerator.forBlock['localVars_get'] = function (block, generator) {
  var variable = block.getFieldValue('variable');
  return [`${variable}`, Order.NONE];
};
