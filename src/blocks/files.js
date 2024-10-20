import * as Blockly from 'blockly/core';
import { Order, javascriptGenerator } from 'blockly/javascript';
import { createRestrictions } from '../functions/restrictions';

Blockly.Blocks['fs_readFile'] = {
  init: function () {
    this.appendValueInput('path')
      .setCheck('String')
      .appendField('Read file from path:');
    this.appendStatementInput('then').appendField('then:');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#eb8334');
    this.setTooltip('Reads content from a file.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['fs_readFile'] = function (block, generator) {
  var path = generator.valueToCode(block, 'path', Order.ATOMIC);
  var then = generator.statementToCode(block, 'then');
  var code = `fs.readFile(${path}, 'utf8', (err, readData) => {\n  if (err) throw err;\n  ${then}});\n`;
  return code;
};

Blockly.Blocks['fs_readFile_data'] = {
  init: function () {
    this.appendDummyInput().appendField('contents of the file read');
    this.setOutput(true, 'String');
    this.setColour('#eb8334');
    this.setTooltip('The content read from the file.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['fs_readFile_data'] = () => [
  'readData',
  Order.NONE,
];

Blockly.Blocks['fs_writeFile'] = {
  init: function () {
    this.appendValueInput('path')
      .setCheck('String')
      .appendField('Create/overwrite file at path:');
    this.appendValueInput('data').setCheck('String').appendField('with data:');
    this.appendStatementInput('then').appendField('then:');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#eb8334');
    this.setTooltip(
      "Overwrites the data of a file. If the file doesn't exist, it creates one."
    );
  },
};

javascriptGenerator.forBlock['fs_writeFile'] = function (block, generator) {
  var path = generator.valueToCode(block, 'path', Order.ATOMIC);
  var data = generator.valueToCode(block, 'data', Order.ATOMIC);
  var then = generator.statementToCode(block, 'then');

  var code = `fs.writeFile(${path}, ${data}, (err) => {
  if (err) throw err;
  ${then}});\n`;

  return code;
};

Blockly.Blocks['fs_readdir'] = {
  init: function () {
    this.appendValueInput('path')
      .setCheck('String')
      .appendField('For each file at path:');
    this.appendStatementInput('doo');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#eb8334');
    this.setTooltip('Do something for each file in a directory.');
  },
};

javascriptGenerator.forBlock['fs_readdir'] = function (block, generator) {
  var path = generator.valueToCode(block, 'path', Order.ATOMIC);
  var doo = generator.statementToCode(block, 'doo');

  var code = `fs.readdir(${path}, (err, files) => {
  if (err) throw err;

  files.forEach(file => {
    const filePath = path.join(${path}, file);

    ${doo}});
});\n`;

  return code;
};

Blockly.Blocks['fs_readdir_name'] = {
  init: function () {
    this.appendDummyInput().appendField('current file name in the loop');
    this.setOutput(true, 'String');
    this.setColour('#eb8334');
    this.setTooltip('The name of the current file in the loop.');
  },
};

Blockly.Blocks['fs_readdir_path'] = {
  init: function () {
    this.appendDummyInput().appendField('current file path in the loop');
    this.setOutput(true, 'String');
    this.setColour('#eb8334');
    this.setTooltip('The path of the current file in the loop.');
  },
};

javascriptGenerator.forBlock['fs_readFile_data'] = () => [
  'readData',
  Order.NONE,
];

Blockly.Blocks['fs_deleteFile'] = {
  init: function () {
    this.appendValueInput('path')
      .setCheck('String')
      .appendField('Delete file from path:');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#eb8334');
    this.setTooltip('Deletes a file from a path.');
  },
};

javascriptGenerator.forBlock['fs_deleteFile'] = function (block, generator) {
  var path = generator.valueToCode(block, 'path', Order.ATOMIC);

  return `fs.unlink(${path}, (err) => {
  if (err) throw err;
});\n`;
};

Blockly.Blocks['fs_renameFile'] = {
  init: function () {
    this.appendValueInput('path')
      .setCheck('String')
      .appendField('Rename file from path:');
    this.appendValueInput('newpath')
      .setCheck('String')
      .appendField('New path:');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#eb8334');
    this.setTooltip('Renames a file from a path.');
  },
};

javascriptGenerator.forBlock['fs_renameFile'] = function (block, generator) {
  var path = generator.valueToCode(block, 'path', Order.ATOMIC);
  var newpath = generator.valueToCode(block, 'newpath', Order.ATOMIC);

  return `fs.rename(${path}, ${newpath}, (err) => {
  if (err) throw err;
});\n`;
};

Blockly.Blocks['fs_sendFile'] = {
  init: function () {
    this.appendValueInput('path')
      .setCheck('String')
      .appendField('Send file from path:');
    this.appendValueInput('channel')
      .setCheck('channel')
      .appendField('to channel:');
    this.appendValueInput('content')
      .setCheck('String')
      .appendField('with content:');
    this.appendValueInput('embeds')
      .setCheck('String')
      .appendField('embed name(s):');
    this.appendStatementInput('rows').setCheck('rows').appendField('rows:');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#eb8334');
    this.setTooltip('Sends a file to a specific channel.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['fs_sendFile'] = function (block, generator) {
  var path = generator.valueToCode(block, 'path', Order.ATOMIC);
  var channel = generator.valueToCode(block, 'channel', Order.ATOMIC);
  var content = generator.valueToCode(block, 'content', Order.ATOMIC);
  var embeds = generator.valueToCode(block, 'embeds', Order.ATOMIC);
  var rows = generator.statementToCode(block, 'rows');

  var code = `${channel}.send({
  files: [new Discord.AttachmentBuilder(${path})],
  content: ${content || "''"},
  embeds: [${embeds.replaceAll("'", '') || ''}],
  components: [
  ${rows}]
});\n`;

  return code;
};

createRestrictions(
  [
    'fs_readFile',
    'fs_writeFile',
    'fs_readdir',
    'fs_deleteFile',
    'fs_renameFile',
    'fs_sendFile',
  ],
  [
    {
      type: 'notEmpty',
      blockTypes: ['path'],
      message: 'You must specify a valid path',
    },
  ]
);

createRestrictions(
  ['fs_renameFile'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['newpath'],
      message: 'You must specify the new path for the file',
    },
  ]
);

createRestrictions(
  ['fs_sendFile'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['channel'],
      message: 'You must specify the channel to send the file in',
    },
  ]
);

createRestrictions(
  ['fs_writeFile'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['data'],
      message: 'You must specify the data to write',
    },
  ]
);

createRestrictions(
  ['fs_readdir_path', 'fs_readdir_name'],
  [
    {
      type: 'hasParent',
      blockTypes: ['fs_readdir'],
      message: 'This block must be inside a "For each file at path" block',
    },
  ]
);

createRestrictions(
  ['fs_readFile_data'],
  [
    {
      type: 'hasParent',
      blockTypes: ['fs_readFile'],
      message: 'This block must be inside a "Read file from path" block',
    },
  ]
);
