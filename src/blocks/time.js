import * as Blockly from 'blockly';
import { Order, javascriptGenerator } from 'blockly/javascript';

Blockly.Blocks['time_date_now'] = {
  init: function () {
    this.appendDummyInput().appendField('current timestamp (milliseconds)');
    this.setOutput(true, 'Number');
    this.setColour('#db4b9c');
    this.setTooltip('Returns milliseconds since January 1, 1970 (Unix Epoch)');
  },
};

javascriptGenerator.forBlock['time_date_now'] = function (block, generator) {
  var code = 'Date.now()';
  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks['time_date'] = {
  init: function () {
    this.appendDummyInput().appendField('current date');
    this.setOutput(true, 'date');
    this.setColour('#db4b9c');
  },
};

javascriptGenerator.forBlock['time_date'] = function (block, generator) {
  var code = 'new Date()';
  return [code, Order.NEW];
};

Blockly.Blocks['time_between'] = {
  init: function () {
    this.appendValueInput('DATE1')
      .setCheck('date')
      .appendField(
        new Blockly.FieldDropdown([
          ['milliseconds', '* 1'],
          ['seconds', '/ 1000'],
          ['minutes', '/ 60000'],
          ['hours', '/ 3600000'],
        ]),
        'TIME'
      )
      .appendField('between date');
    this.appendValueInput('DATE2').setCheck('date').appendField('and date');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour('#db4b9c');
    this.setTooltip('Gets a specific amount between two dates.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['time_between'] = function (block, generator) {
  var time = block.getFieldValue('TIME');
  var date1 = generator.valueToCode(block, 'DATE1', Order.ATOMIC);
  var date2 = generator.valueToCode(block, 'DATE2', Order.ATOMIC);

  var code = `(${date1} - ${date2}) ${time}`;

  return [code, Order.NONE];
};

Blockly.Blocks['time_createdate'] = {
  init: function () {
    this.appendValueInput('TIME')
      .setCheck(['String', 'Number'])
      .appendField('create date from time');
    this.setOutput(true, 'date');
    this.setColour('#db4b9c');
  },
};

javascriptGenerator.forBlock['time_createdate'] = function (block, generator) {
  var time = generator.valueToCode(block, 'TIME', Order.ATOMIC);

  return [`new Date(${time})`, Order.NEW];
};

Blockly.Blocks['time_timestampFromDate'] = {
  init: function () {
    this.appendValueInput('DATE')
      .setCheck('date')
      .appendField('create timestamp from date');
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ['short time', 't'],
        ['long time', 'T'],
        ['short date', 'd'],
        ['long date', 'D'],
        ['short datetime', 'f'],
        ['long datetime', 'F'],
        ['relative time', 'R'],
      ]),
      'STYLE'
    );
    this.setOutput(true, 'String');
    this.setColour('#db4b9c');
  },
};

javascriptGenerator.forBlock['time_timestampFromDate'] = function (
  block,
  generator
) {
  var date = generator.valueToCode(block, 'DATE', Order.ATOMIC);
  var style = block.getFieldValue('STYLE');

  return [
    `'<t:' + Math.floor(${date}.getTime() / 1000) + ':${style}>'`,
    Order.NONE,
  ];
};

Blockly.Blocks['time_convert'] = {
  init: function () {
    this.appendValueInput('NUMBER')
      .setCheck('Number')
      .appendField('convert')
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['milliseconds', 'milliseconds'],
        ['seconds', 'seconds'],
        ['minutes', 'minutes'],
        ['hours', 'hours'],
        ['days', 'days'],
        ['months', 'months'],
        ['years', 'years'],
      ]), 'FROM')
      .appendField('to')
      .appendField(new Blockly.FieldDropdown([
        ['milliseconds', 'milliseconds'],
        ['seconds', 'seconds'],
        ['minutes', 'minutes'],
        ['hours', 'hours'],
        ['days', 'days'],
        ['months', 'months'],
        ['years', 'years'],
      ]), 'TO');
    this.setOutput(true, 'Number');
    this.setColour('#db4b9c');
    this.setTooltip('Converts a number from one time unit to another.');
  },
};

javascriptGenerator.forBlock['time_convert'] = function (block, generator) {
  var number = generator.valueToCode(block, 'NUMBER', Order.ATOMIC);
  var fromUnit = block.getFieldValue('FROM');
  var toUnit = block.getFieldValue('TO');

  var timeRates = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
    months: 2628000000,
    years: 31536000000,
  };

  var code = `Math.round(${number} * ${timeRates[fromUnit] / timeRates[toUnit]})`;
  return [code, Order.NONE];
};

Blockly.Blocks['time_operation'] = {
  init: function () {
    this.appendValueInput('NUMBER')
      .setCheck('Number')
      .appendField(new Blockly.FieldDropdown([
        ['add', 'ADD'],
        ['subtract', 'SUBTRACT']
      ]), 'OPERATION');
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['milliseconds', 'milliseconds'],
        ['seconds', 'seconds'],
        ['minutes', 'minutes'],
        ['hours', 'hours'],
        ['days', 'days'],
        ['months', 'months'],
        ['years', 'years'],
      ]), 'UNIT')
      .appendField('to/from date');
    this.appendValueInput('DATE')
      .setCheck('date')
    this.setOutput(true, 'date');
    this.setColour('#db4b9c');
    this.setTooltip('Adds or subtracts a specific time amount to/from the date.');
  },
};

javascriptGenerator.forBlock['time_operation'] = function (block, generator) {
  var date = generator.valueToCode(block, 'DATE', Order.ATOMIC);
  var number = generator.valueToCode(block, 'NUMBER', Order.ATOMIC);
  var operation = block.getFieldValue('OPERATION');
  var unit = block.getFieldValue('UNIT');

  var timeRates = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
    months: 2628000000,
    years: 31536000000,
  };

  var sign = operation === 'ADD' ? '+' : '-';
  var code = `new Date(${date}.getTime() ${sign} (${number} * ${timeRates[unit]}))`;

  return [code, Order.NONE];
};

Blockly.Blocks['time_stringToMS'] = {
  init: function () {
    this.appendValueInput('TIME')
      .setCheck('String')
      .appendField('turn time string');
    this.appendDummyInput().appendField('to milliseconds');
    this.setOutput(true, 'Number');
    this.setColour('#db4b9c');
  },
};

javascriptGenerator.forBlock['time_stringToMS'] = function (block, generator) {
  var time = generator.valueToCode(block, 'TIME', Order.ATOMIC);
  return [`ms(${time})`, Order.NONE];
};

Blockly.Blocks['time_msToString'] = {
  init: function () {
    this.appendValueInput('TIME')
      .setCheck('Number')
      .appendField('turn milliseconds:');
    this.appendDummyInput().appendField('to time string');
    this.appendValueInput('LONG')
      .setCheck('Boolean')
      .appendField('long display:');
    this.setInputsInline(false);
    this.setOutput(true, 'String');
    this.setColour('#db4b9c');
  },
};

javascriptGenerator.forBlock['time_msToString'] = function (block, generator) {
  var time = generator.valueToCode(block, 'TIME', Order.ATOMIC);
  var long = generator.valueToCode(block, 'LONG', Order.ATOMIC);

  return [`ms(${time}, { long: ${long ?? true} })`, Order.NONE];
};