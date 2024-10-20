import * as Blockly from 'blockly';
import { Order, javascriptGenerator } from 'blockly/javascript';
import { createRestrictions } from '../functions/restrictions';

Blockly.Blocks['threads_msgCreateThread'] = {
  init: function () {
    this.appendDummyInput().appendField('Start a thread');
    this.appendValueInput('message')
      .setCheck('message')
      .appendField('in the message:');
    this.appendValueInput('name').setCheck('String').appendField('name:');
    this.appendValueInput('slowmode')
      .setCheck('Number')
      .appendField('slowmode (seconds):');
    this.appendDummyInput()
      .appendField('type:')
      .appendField(
        new Blockly.FieldDropdown([
          ['Public', 'GUILD_PUBLIC_THREAD'],
          ['Private', 'GUILD_PRIVATE_THREAD'],
        ]),
        'type'
      );
    this.appendStatementInput('then').appendField('then:');
    this.setInputsInline(false);
    this.setColour('#5b67a5');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
  },
};

javascriptGenerator.forBlock['threads_msgCreateThread'] = function (
  block,
  generator
) {
  var val_message = generator.valueToCode(block, 'message', Order.ATOMIC);
  var val_name = generator.valueToCode(block, 'name', Order.ATOMIC);
  var val_slowmode = generator.valueToCode(block, 'slowmode', Order.ATOMIC);
  var val_type = block.getFieldValue('type');
  var then = generator.statementToCode(block, 'then');

  var code = `${val_message}.startThread({
  name: ${val_name},
  type: ${val_type},${
    val_slowmode ? `\n  rateLimitPerUser: ${val_slowmode}` : ''
  }
})`;

  if (then) code += `.then(async (createdThread) => {\n${then}})`;

  code += ';\n';

  return code;
};

Blockly.Blocks['threads_channelCreateThread'] = {
  init: function () {
    this.appendDummyInput().appendField('Start a thread');
    this.appendValueInput('channel')
      .setCheck('channel')
      .appendField('in the channel:');
    this.appendValueInput('name').setCheck('String').appendField('name:');
    this.appendValueInput('slowmode')
      .setCheck('Number')
      .appendField('slowmode (seconds):');
    this.appendDummyInput()
      .appendField('type:')
      .appendField(
        new Blockly.FieldDropdown([
          ['Public', 'GUILD_PUBLIC_THREAD'],
          ['Private', 'GUILD_PRIVATE_THREAD'],
        ]),
        'type'
      );
    this.appendStatementInput('then').appendField('then:');
    this.setInputsInline(false);
    this.setColour('#5b67a5');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
  },
};

javascriptGenerator.forBlock['threads_channelCreateThread'] = function (
  block,
  generator
) {
  var val_channel = generator.valueToCode(block, 'channel', Order.ATOMIC);
  var val_name = generator.valueToCode(block, 'name', Order.ATOMIC);
  var val_slowmode = generator.valueToCode(block, 'slowmode', Order.ATOMIC);
  var val_type = block.getFieldValue('type');
  var then = generator.statementToCode(block, 'then');

  var code = `${val_channel}.threads.create({
  name: ${val_name},
  type: ${val_type},${
    val_slowmode ? `\n  rateLimitPerUser: ${val_slowmode}` : ''
  }
})`;

  if (then) code += `.then(async (createdThread) => {\n${then}})`;

  code += ';\n';

  return code;
};

Blockly.Blocks['threads_createdThread'] = {
  init: function () {
    this.appendDummyInput().appendField('created thread');
    this.setColour('#5b67a5');
    this.setOutput(true, 'channel');
  },
};

javascriptGenerator.forBlock['threads_createdThread'] = () => [
  'createdThread',
  Order.NONE,
];

Blockly.Blocks['threads_name'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('name of thread:');
    this.setColour('#5b67a5');
    this.setOutput(true, 'String');
  },
};

javascriptGenerator.forBlock['threads_name'] = function (block, generator) {
  var val_thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  return [`${val_thread}.name`, Order.NONE];
};

Blockly.Blocks['threads_createdAt'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('creation date of thread:');
    this.setOutput(true, 'date');
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_createdAt'] = function (
  block,
  generator
) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${thread}.createdAt`;
  return [code, Order.NONE];
};

Blockly.Blocks['threads_lastMessage'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('last message of thread:');
    this.setOutput(true, 'message');
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_lastMessage'] = function (
  block,
  generator
) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${thread}.lastMessage`;
  return [code, Order.NONE];
};

Blockly.Blocks['threads_setLocked'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('Set locked status of thread:');
    this.appendValueInput('locked').setCheck('Boolean').appendField('to:');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_setLocked'] = function (
  block,
  generator
) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var locked = generator.valueToCode(block, 'locked', Order.ATOMIC);
  var code = `${thread}.setLocked(${locked});\n`;
  return code;
};

Blockly.Blocks['threads_setName'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('Rename thread:');
    this.appendValueInput('name').setCheck('String').appendField('to:');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_setName'] = function (block, generator) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var name = generator.valueToCode(block, 'name', Order.ATOMIC);
  var code = `${thread}.setName(${name});\n`;
  return code;
};

Blockly.Blocks['threads_setArchived'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('Set archived status of thread:');
    this.appendValueInput('archived').setCheck('Boolean').appendField('to:');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_setArchived'] = function (
  block,
  generator
) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var archived = generator.valueToCode(block, 'archived', Order.ATOMIC);
  var code = `${thread}.setArchived(${archived});\n`;
  return code;
};

Blockly.Blocks['threads_pin'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('Pin thread:');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_pin'] = function (block, generator) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${thread}.pin();\n`;
  return code;
};

Blockly.Blocks['threads_unpin'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('Unpin thread:');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_unpin'] = function (block, generator) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${thread}.unpin();\n`;
  return code;
};

Blockly.Blocks['threads_join'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('Join thread:');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_join'] = function (block, generator) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${thread}.join();\n`;
  return code;
};

Blockly.Blocks['threads_leave'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('Leave thread:');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_leave'] = function (block, generator) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${thread}.leave();\n`;
  return code;
};

Blockly.Blocks['threads_setSlowmode'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('Set slowmode of:');
    this.appendValueInput('slowmode')
      .setCheck('Number')
      .appendField('slowmode (seconds):');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_setSlowmode'] = function (
  block,
  generator
) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var slowmode = generator.valueToCode(block, 'slowmode', Order.ATOMIC);
  var code = `${thread}.setRateLimitPerUser(${slowmode});\n`;
  return code;
};

Blockly.Blocks['threads_author'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('author of thread:');
    this.setOutput(true, 'user');
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_author'] = function (block, generator) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `await ${thread}.fetchOwner().user`;
  return [code, Order.AWAIT];
};

Blockly.Blocks['threads_authorMember'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('author member of thread:');
    this.setOutput(true, 'member');
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_authorMember'] = function (
  block,
  generator
) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `await ${thread}.fetchOwner()`;
  return [code, Order.AWAIT];
};

Blockly.Blocks['threads_id'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('ID of thread:');
    this.setOutput(true, 'String');
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_id'] = function (block, generator) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${thread}.id`;
  return [code, Order.NONE];
};

Blockly.Blocks['threads_memberCount'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('number of members in thread:');
    this.setOutput(true, 'Number');
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_memberCount'] = function (
  block,
  generator
) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${thread}.members.cache.size`;
  return [code, Order.NONE];
};

Blockly.Blocks['threads_parentChannel'] = {
  init: function () {
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('parent channel of thread:');
    this.setOutput(true, 'channel');
    this.setColour('#5b67a5');
  },
};

javascriptGenerator.forBlock['threads_parentChannel'] = function (
  block,
  generator
) {
  var thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${thread}.parent`;
  return [code, Order.NONE];
};

Blockly.Blocks['threads_getone'] = {
  init: function () {
    this.appendValueInput('value')
      .setCheck('String')
      .appendField('get the thread with the')
      .appendField(
        new Blockly.FieldDropdown([
          ['name', 'name'],
          ['id', 'id'],
        ]),
        'type'
      )
      .appendField('equal to');
    this.appendValueInput('channel')
      .setCheck('channel')
      .appendField('in the channel');
    this.setOutput(true, 'channel');
    this.setColour('#5b67a5');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['threads_getone'] = function (block, generator) {
  var dropdown_type = block.getFieldValue('type');
  var value_value = generator.valueToCode(block, 'value', Order.ATOMIC);
  var value_channel = generator.valueToCode(block, 'channel', Order.ATOMIC);

  var code = `${value_channel}.threads.cache${
    dropdown_type === 'id'
      ? `.get(${value_value})`
      : `.find(t => t.name == ${value_value})`
  }`;
  return [code, Order.NONE];
};

Blockly.Blocks['threads_msgThread'] = {
  init: function () {
    this.appendValueInput('message')
      .setCheck('message')
      .appendField('get thread of message:');
    this.setOutput(true, 'channel');
    this.setColour('#5b67a5');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['threads_msgThread'] = function (
  block,
  generator
) {
  var value_message = generator.valueToCode(block, 'message', Order.ATOMIC);

  var code = `${value_message}.thread`;
  return [code, Order.NONE];
};

Blockly.Blocks['threads_msgHasThread'] = {
  init: function () {
    this.appendValueInput('message')
      .setCheck('message')
      .appendField('does message');
    this.appendDummyInput().appendField('have a thread?');
    this.setOutput(true, 'Boolean');
    this.setColour('#5b67a5');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['threads_msgHasThread'] = function (
  block,
  generator
) {
  var value_message = generator.valueToCode(block, 'message', Order.ATOMIC);

  var code = `${value_message}.hasThread`;
  return [code, Order.NONE];
};

Blockly.Blocks['threads_addUser'] = {
  init: function () {
    this.appendValueInput('user').setCheck('user').appendField('Add user:');
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('to thread:');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
    this.setTooltip('Add a user to a thread.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['threads_addUser'] = function (block, generator) {
  var val_user = generator.valueToCode(block, 'user', Order.ATOMIC);
  var val_thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${val_thread}.members.add(${val_user});\n`;
  return code;
};

Blockly.Blocks['threads_removeUser'] = {
  init: function () {
    this.appendValueInput('user').setCheck('user').appendField('Remove user:');
    this.appendValueInput('thread')
      .setCheck('channel')
      .appendField('from thread:');
    this.setPreviousStatement('default', null);
    this.setNextStatement('default', null);
    this.setColour('#5b67a5');
    this.setTooltip('Remove a user from a thread.');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['threads_removeUser'] = function (
  block,
  generator
) {
  var val_user = generator.valueToCode(block, 'user', Order.ATOMIC);
  var val_thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
  var code = `${val_thread}.members.remove(${val_user});\n`;
  return code;
};

createRestrictions(
  ['threads_msgCreateThread'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['message'],
      message: 'You must specify what message to start a thread in',
    },
  ]
);

createRestrictions(
  ['threads_msgThread', 'threads_msgHasThread'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['message'],
      message: 'You must specify the message',
    },
  ]
);

createRestrictions(
  ['threads_channelCreateThread'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['channel'],
      message: 'You must specify what channel to start a thread in',
    },
  ]
);

createRestrictions(
  ['threads_msgCreateThread', 'threads_channelCreateThread'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['name'],
      message: 'You must specify the name of the thread',
    },
  ]
);

createRestrictions(
  ['threads_createdThread'],
  [
    {
      type: 'hasParent',
      blockTypes: ['threads_msgCreateThread', 'threads_channelCreateThread'],
      message: "This block must be under a 'start a thread' block",
    },
  ]
);

createRestrictions(
  [
    'threads_name',
    'threads_setLocked',
    'threads_setName',
    'threads_setArchived',
    'threads_setSlowmode',
    'threads_author',
    'threads_authorMember',
    'threads_id',
    'threads_memberCount',
    'threads_parentChannel',
    'threads_unpin',
    'threads_pin',
    'threads_leave',
    'threads_join',
    'threads_addUser',
    'threads_removeUser',
  ],
  [
    {
      type: 'notEmpty',
      blockTypes: ['thread'],
      message: 'You must specify the thread',
    },
  ]
);

createRestrictions(
  ['threads_setLocked', 'threads_setArchived'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['locked', 'archived'],
      message: 'You must specify the locked or archived status',
    },
  ]
);

createRestrictions(
  ['threads_setName'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['name'],
      message: 'You must specify the new name for the thread',
    },
  ]
);

createRestrictions(
  ['threads_setSlowmode'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['slowmode'],
      message: 'You must specify the slowmode duration',
    },
  ]
);

createRestrictions(
  ['threads_addUser', 'threads_removeUser'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['user'],
      message: 'You must specify the user',
    },
  ]
);
