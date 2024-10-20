import * as Blockly from 'blockly';
import { Order, javascriptGenerator } from 'blockly/javascript';

Blockly.Blocks['fetch_send'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Send')
      .appendField(
        new Blockly.FieldDropdown([
          ['GET', 'get'],
          ['POST', 'post'],
          ['PATCH', 'patch'],
          ['DELETE', 'delete'],
        ]),
        'method'
      )
      .appendField('request');
    this.appendValueInput('url').setCheck('String').appendField('URL:');
    this.appendStatementInput('then').appendField('then:').setCheck('default');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#0fbd8c');
    this.setTooltip('Sends a fetch request to a url');
  },
};

javascriptGenerator.forBlock['fetch_send'] = function (block, generator) {
  var method = block.getFieldValue('method');
  var url = generator.valueToCode(block, 'url', Order.ATOMIC);
  var statement = generator.statementToCode(block, 'then');

  return `axios.${method}(${url}).then(async (response) => {
  ${statement}});`;
};

Blockly.Blocks['fetch_sendAdvanced'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Send')
      .appendField(
        new Blockly.FieldDropdown([
          ['GET', 'get'],
          ['POST', 'post'],
          ['PATCH', 'patch'],
          ['DELETE', 'delete'],
        ]),
        'method'
      )
      .appendField('request');
    this.appendValueInput('url').setCheck('String').appendField('URL:');
    this.appendStatementInput('config')
      .appendField('Configs:')
      .setCheck('requestConfigSection');
    this.appendStatementInput('then').appendField('then:').setCheck('default');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#0fbd8c');
    this.setTooltip('Sends a fetch request to a url');
  },
};

javascriptGenerator.forBlock['fetch_sendAdvanced'] = function (
  block,
  generator
) {
  var method = block.getFieldValue('method');
  var url = generator.valueToCode(block, 'url', Order.ATOMIC);
  var config = generator.statementToCode(block, 'config');
  var statement = generator.statementToCode(block, 'then');

  return `axios({
  url: ${url},
  method: "${method}",
  ${config}}).then(async (response) => {
    ${statement}});`;
};

Blockly.Blocks['fetch_configSection'] = {
  init: function () {
    this.appendValueInput('key').setCheck('String').appendField('Add config:');
    this.appendValueInput('value').appendField('with value:');
    this.setPreviousStatement(true, 'requestConfigSection');
    this.setNextStatement(true, 'requestConfigSection');
    this.setColour('#0fbd8c');
    this.setTooltip('Sends a fetch request to a url');
  },
};

javascriptGenerator.forBlock['fetch_configSection'] = function (
  block,
  generator
) {
  var key = generator.valueToCode(block, 'key', Order.ATOMIC);
  var value = generator.valueToCode(block, 'value', Order.ATOMIC);

  return `${key}: ${value},`;
};

Blockly.Blocks['fetch_responseData'] = {
  init: function () {
    this.appendDummyInput().appendField('data of the response');
    this.setOutput(true, 'object');
    this.setColour('#0fbd8c');
  },
};

javascriptGenerator.forBlock['fetch_responseData'] = function (
  block,
  generator
) {
  return [`response.data`, Order.NONE];
};

Blockly.Blocks['fetch_responseStatus'] = {
  init: function () {
    this.appendDummyInput().appendField('status of the response');
    this.setOutput(true, 'Number');
    this.setColour('#0fbd8c');
  },
};

javascriptGenerator.forBlock['fetch_responseStatus'] = function (
  block,
  generator
) {
  return [`response.status`, Order.NONE];
};

Blockly.Blocks['fetch_responseHeaders'] = {
  init: function () {
    this.appendDummyInput().appendField('headers of the response');
    this.setOutput(true, 'object');
    this.setColour('#0fbd8c');
  },
};

javascriptGenerator.forBlock['fetch_responseHeaders'] = function (
  block,
  generator
) {
  return [`response.headers`, Order.NONE];
};
