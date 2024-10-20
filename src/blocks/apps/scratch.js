import * as Blockly from 'blockly/core';
import { Order, javascriptGenerator } from 'blockly/javascript';

Blockly.Blocks['scratch_getprofile'] = {
  init: function () {
    this.appendValueInput('username')
      .setCheck('String')
      .appendField('Get Scratch profile of user:');
    this.appendStatementInput('code').appendField('Then').setCheck('default');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#0fbd8c');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['scratch_getprofile'] = function (
  block,
  generator
) {
  var user = generator.valueToCode(block, 'username', Order.NONE);
  var code = generator.statementToCode(block, 'code');

  return `await fetch('https://api.scratch.mit.edu/users/' + ${user})
  .then(response => response.json())
  .then(async (scratchUserProfileInformation) => {
    ${code}})
  .catch(error => console.error('Error fetching Scratch user profile:', error));`;
};

Blockly.Blocks['scratch_getprofileinfo'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('get')
      .appendField(
        new Blockly.FieldDropdown([
          ['bio', 'profile.bio'],
          ['country', 'profile.country'],
          ['status', 'profile.status'],
          ['join date', 'history.joined'],
          ['profile picture (90x90)', "profile.images['90x90']"],
          ['is part of the Scratch Team', 'scratchteam'],
        ]),
        'info'
      )
      .appendField('of Scratch profile');
    this.setOutput(true, null);
    this.setColour('#0fbd8c');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['scratch_getprofileinfo'] = function (block) {
  var info = block.getFieldValue('info');
  return [`scratchUserProfileInformation.${info}`, Order.ATOMIC];
};

Blockly.Blocks['scratch_getmessages'] = {
  init: function () {
    this.appendValueInput('username')
      .setCheck('String')
      .appendField('amount of messages of Scratch user:');
    this.setOutput(true, 'Number');
    this.setColour('#0fbd8c');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['scratch_getmessages'] = function (
  block,
  generator
) {
  var user = generator.valueToCode(block, 'username', Order.NONE);

  return [
    `await fetch('https://api.scratch.mit.edu/users/' + ${user} + '/messages/count')
  .then(response => response.json())
  .then(json => json['count'])
  .catch(error => console.error('Error fetching Scratch user profile:', error))`,
    Order.AWAIT,
  ];
};
