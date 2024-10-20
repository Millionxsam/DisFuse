import * as Blockly from 'blockly/core';
import { Order, javascriptGenerator } from 'blockly/javascript';
import { createRestrictions } from '../functions/restrictions';

Blockly.Blocks['emoji_getallinserver'] = {
  init: function () {
    this.appendDummyInput().appendField('For each emoji on the server:');
    this.appendValueInput('server').setCheck('server');
    this.appendStatementInput('code').setCheck('default');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('DEB144');
    this.setTooltip('Runs a code for each emoji on a server.');
    this.setHelpUrl('');
    this.setInputsInline(true);
  },
};

javascriptGenerator.forBlock['emoji_getallinserver'] = function (
  block,
  generator
) {
  var server = generator.valueToCode(block, 'server', Order.ATOMIC);
  var statements_code = generator.statementToCode(block, 'code');

  const code = `${server}.emojis.cache.forEach((ForEachemojiInServer) => {
  ${statements_code}});\n`;
  return code;
};

Blockly.Blocks['emoji_getallinserver_value'] = {
  init: function () {
    this.appendDummyInput().appendField('current emoji in loop');
    this.setOutput('emoji');
    this.setColour('DEB144');
    this.setTooltip('The current emoji on the server of the loop.');
  },
};

javascriptGenerator.forBlock['emoji_getallinserver_value'] = function (
  block,
  generator
) {
  return ['emoji', Order.NONE];
};

Blockly.Blocks['emoji_getname'] = {
  init: function () {
    this.appendValueInput('emoji')
      .setCheck('emoji')
      .appendField('get name of emoji:');
    this.setOutput(true, 'string');
    this.setColour('DEB144');
    this.setTooltip('Gets the name of an emoji.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_getname'] = function (block, generator) {
  var emoji = generator.valueToCode(block, 'emoji', Order.ATOMIC);

  return [`${emoji}.name`, Order.NONE];
};

Blockly.Blocks['emoji_getimageurl'] = {
  init: function () {
    this.appendValueInput('emoji')
      .setCheck('emoji')
      .appendField('get image/gif URL of the emoji:');
    this.setOutput(true, 'string');
    this.setColour('DEB144');
    this.setTooltip('Gets the image/gif URL of an emoji.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_getimageurl'] = function (
  block,
  generator
) {
  var emoji = generator.valueToCode(block, 'emoji', Order.ATOMIC);

  return [`${emoji}.imageURL()`, Order.NONE];
};

Blockly.Blocks['emoji_getemojiwith'] = {
  init: function () {
    this.appendValueInput('equal')
      .setCheck('String')
      .appendField('get emoji with')
      .appendField(
        new Blockly.FieldDropdown([
          ['name', 'name'],
          ['id', 'id'],
        ]),
        'with'
      )
      .appendField('equal to');
    this.appendValueInput('server')
      .setCheck('server')
      .appendField('on the server');
    this.setOutput(true, 'emoji');
    this.setColour('DEB144');
    this.setTooltip('Gets an emoji with a specific name/id on a server.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_getemojiwith'] = function (
  block,
  generator
) {
  var dropdown_with = block.getFieldValue('with');
  var value_equal = generator.valueToCode(block, 'equal', Order.ATOMIC);
  var value_server = generator.valueToCode(block, 'server', Order.ATOMIC);

  var code;
  if (dropdown_with === 'name') {
    code = `${value_server}.emojis.cache.find(emoji => emoji.name === ${value_equal})`;
  } else {
    code = `${value_server}.emojis.cache.get(${value_equal})`;
  }

  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks['emoji_getid'] = {
  init: function () {
    this.appendValueInput('emoji')
      .setCheck('emoji')
      .appendField('get ID of the emoji:');
    this.setOutput(true, 'string');
    this.setColour('DEB144');
    this.setTooltip('Gets the ID of an emoji.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_getid'] = function (block, generator) {
  var emoji = generator.valueToCode(block, 'emoji', Order.ATOMIC);

  return [`${emoji}.id`, Order.NONE];
};

Blockly.Blocks['emoji_isanimated'] = {
  init: function () {
    this.appendValueInput('emoji').setCheck('emoji').appendField('is emoji');
    this.appendDummyInput().appendField('animated?');
    this.setOutput(true, 'Boolean');
    this.setColour('DEB144');
    this.setTooltip('Checks if an emoji is animated.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_isanimated'] = function (block, generator) {
  var emoji = generator.valueToCode(block, 'emoji', Order.ATOMIC);

  return [`${emoji}.animated`, Order.NONE];
};

Blockly.Blocks['emoji_create'] = {
  init: function () {
    this.appendValueInput('name')
      .setCheck('String')
      .appendField('Create an emoji named:');
    this.appendValueInput('url')
      .setCheck('String')
      .appendField('with image/gif url set to:');
    this.appendValueInput('server')
      .setCheck('server')
      .appendField('in the server:');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('DEB144');
    this.setTooltip('Creates an emoji in the specified server.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_create'] = function (block, generator) {
  var name = generator.valueToCode(block, 'name', Order.ATOMIC) || '';
  var url = generator.valueToCode(block, 'url', Order.ATOMIC) || '';
  var server = generator.valueToCode(block, 'server', Order.ATOMIC) || '()';

  const code = `${server}.emojis.create(${url}, ${name});\n`;
  return code;
};

Blockly.Blocks['emoji_delete'] = {
  init: function () {
    this.appendValueInput('emoji')
      .setCheck('emoji')
      .appendField('Delete emoji:');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('DEB144');
    this.setTooltip('Deletes an emoji.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_delete'] = function (block, generator) {
  var emoji = generator.valueToCode(block, 'emoji', Order.ATOMIC);

  return `${emoji}.delete();\n`;
};

Blockly.Blocks['emoji_created'] = {
  init: function () {
    this.appendValueInput('emoji')
      .setCheck('emoji')
      .appendField('creation')
      .appendField(
        new Blockly.FieldDropdown([
          ['date', 'createdAt'],
          ['timestamp', 'createdTimestamp'],
        ]),
        'type'
      )
      .appendField('of emoji:');
    this.setInputsInline(true);
    this.setOutput(true, 'String');
    this.setColour('DEB144');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_created'] = function (block, generator) {
  var emoji = generator.valueToCode(block, 'emoji', Order.ATOMIC);
  var type = block.getFieldValue('type');

  var code = `${emoji}.${type}`;
  return [code, Order.NONE];
};

Blockly.Blocks['emoji_setname'] = {
  init: function () {
    this.appendValueInput('emoji')
      .setCheck('emoji')
      .appendField('Rename the emoji:');
    this.appendValueInput('name').setCheck('String').appendField('to:');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('DEB144');
    this.setTooltip('Renames an emoji.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_setname'] = function (block, generator) {
  var emoji = generator.valueToCode(block, 'emoji', Order.ATOMIC);
  var name = generator.valueToCode(block, 'name', Order.ATOMIC);

  return `${emoji}.setName(${name});\n`;
};

Blockly.Blocks['emoji_author'] = {
  init: function () {
    this.appendValueInput('emoji')
      .setCheck('emoji')
      .appendField('get author of the emoji:');
    this.setOutput(true, 'user');
    this.setColour('DEB144');
    this.setTooltip('Gets the user that created the emoji.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['emoji_author'] = function (block, generator) {
  var emoji = generator.valueToCode(block, 'emoji', Order.ATOMIC);

  return [`${emoji}.author`, Order.NONE];
};

createRestrictions(
  ['emoji_create'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['url'],
      message: 'You must specify the URL for the emoji image/GIF',
    },
    {
      type: 'notEmpty',
      blockTypes: ['server'],
      message: 'You must specify the server to create the emoji in',
    },
  ]
);

createRestrictions(
  ['emoji_setname', 'emoji_create'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['name'],
      message: 'You must specify the name for the emoji',
    },
  ]
);

createRestrictions(
  [
    'emoji_getid',
    'emoji_isanimated',
    'emoji_getimageurl',
    'emoji_getname',
    'emoji_delete',
    'emoji_created',
    'emoji_author',
    'emoji_setname',
  ],
  [
    {
      type: 'notEmpty',
      blockTypes: ['emoji'],
      message: 'You must specify the emoji',
    },
  ]
);

createRestrictions(
  ['emoji_getemojiwith'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['equal'],
      message: 'You must specify the name/id',
    },
    {
      type: 'notEmpty',
      blockTypes: ['server'],
      message: 'You must specify the server to get the emoji from',
    },
  ]
);

createRestrictions(
  ['emoji_getallinserver_value'],
  [
    {
      type: 'hasParent',
      blockTypes: ['emoji_getallinserver'],
      message: 'This block must be in a "for each emoji in the server" block',
    },
  ]
);

createRestrictions(
  ['emoji_getallinserver'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['server'],
      message: 'You must specify the server to iterate emojis from.',
    },
  ]
);
