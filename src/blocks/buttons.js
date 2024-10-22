import * as Blockly from 'blockly';
import javascript, { Order } from 'blockly/javascript';
import { createRestrictions } from '../functions/restrictions';

Blockly.Blocks['buttons_add'] = {
  init: function () {
    this.appendDummyInput().appendField('Add a button');
    this.appendValueInput('label').setCheck('String').appendField('label:');
    this.appendValueInput('emoji').setCheck('String').appendField('emoji:');
    this.appendDummyInput()
      .appendField('style:')
      .appendField(
        new Blockly.FieldDropdown([
          ['Blurple', '1'],
          ['Gray', '2'],
          ['Green', '3'],
          ['Red', '4'],
          ['Link', '5'],
        ]),
        'style'
      );
    this.appendValueInput('id').setCheck('String').appendField('ID:');
    this.appendValueInput('disabled')
      .setCheck('Boolean')
      .appendField('disabled?');
    this.appendValueInput('url')
      .setCheck('String')
      .appendField('URL (only with link style):');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('2677AF');
    this.setTooltip('');
    this.setHelpUrl('');
    this.setInputsInline(false);
  },
};

Blockly.Blocks['buttons_event'] = {
  init: function () {
    this.appendDummyInput().appendField('When a button is clicked');
    this.appendStatementInput('event').setCheck('default');
    this.setInputsInline(false);
    this.setColour('#2677AF');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['buttons_message'] = {
  init: function () {
    this.appendDummyInput().appendField('message of the clicked button');
    this.setColour('#2677AF');
    this.setOutput(true, 'message');
  },
};

Blockly.Blocks['buttons_id'] = {
  init: function () {
    this.appendDummyInput().appendField('ID of the clicked button');
    this.setColour('#2677AF');
    this.setOutput(true, 'String');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['buttons_member'] = {
  init: function () {
    this.appendDummyInput().appendField('member who clicked the button');
    this.setColour('#2677AF');
    this.setOutput(true, 'member');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['buttons_user'] = {
  init: function () {
    this.appendDummyInput().appendField('user who clicked the button');
    this.setColour('#2677AF');
    this.setOutput(true, 'user');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['buttons_channel'] = {
  init: function () {
    this.appendDummyInput().appendField('channel of the button');
    this.setColour('#2677AF');
    this.setOutput(true, 'channel');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['buttons_server'] = {
  init: function () {
    this.appendDummyInput().appendField('server of the button');
    this.setColour('#2677AF');
    this.setOutput(true, 'server');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['slash_reply'] = {
  init: function () {
    this.appendDummyInput().appendField('Reply to the click');
    this.appendValueInput('content').setCheck('String').appendField('content:');
    this.appendDummyInput()
      .appendField('embed(s):')
      .appendField(new Blockly.FieldTextInput('name'), 'embeds');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('2677AF');
    this.setTooltip('');
    this.setHelpUrl('');
    this.setInputsInline(false);
  },
};

Blockly.Blocks['slash_edit'] = {
  init: function () {
    this.appendDummyInput().appendField('Edit the reply');
    this.appendValueInput('content').setCheck('String').appendField('content:');
    this.appendDummyInput()
      .appendField('embed(s):')
      .appendField(new Blockly.FieldTextInput('name'), 'embeds');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('2677AF');
    this.setTooltip('');
    this.setHelpUrl('');
    this.setInputsInline(false);
  },
};

Blockly.Blocks['buttons_del'] = {
  init: function () {
    this.appendDummyInput().appendField('Delete the reply by the bot');
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('2677AF');
    this.setTooltip('');
    this.setHelpUrl('');
    this.setInputsInline(false);
  },
};

javascript.javascriptGenerator.forBlock['buttons_del'] = function (
  block,
  generator
) {
  var code = `interaction.deleteReply();`;
  return code;
};

javascript.javascriptGenerator.forBlock['buttons_message'] = () => [
  'interaction.message',
  Order.NONE,
];

javascript.javascriptGenerator.forBlock['buttons_server'] = function (
  block,
  generator
) {
  var code = `interaction.guild`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock['buttons_channel'] = function (
  block,
  generator
) {
  var code = `interaction.channel`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock['buttons_user'] = function (
  block,
  generator
) {
  var code = `interaction.member.user`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock['buttons_member'] = function (
  block,
  generator
) {
  var code = `interaction.member`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock['buttons_id'] = function (
  block,
  generator
) {
  var code = `interaction.customId`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock['buttons_event'] = function (
  block,
  generator
) {
  var code = generator.statementToCode(block, 'event');

  var codeEvent = `client.on("interactionCreate", async (interaction) => {
  if(!interaction.isButton()) return;
  ${code}});\n`;

  return codeEvent;
};

javascript.javascriptGenerator.forBlock['buttons_add'] = function (
  block,
  generator
) {
  var label = generator.valueToCode(block, 'label', javascript.Order.ATOMIC);
  var emoji = generator.valueToCode(block, 'emoji', javascript.Order.ATOMIC);
  var style = block.getFieldValue('style');
  var id = generator.valueToCode(block, 'id', javascript.Order.ATOMIC);
  var disabled = generator.valueToCode(
    block,
    'disabled',
    javascript.Order.ATOMIC
  );
  var url = generator.valueToCode(block, 'url', javascript.Order.ATOMIC);

  var code = `new Discord.ButtonBuilder().setLabel(${label || "''"
    })
  .setStyle(${style})
  .setDisabled(${disabled || 'false'})${url ? `\n.setURL(${url})` : ''
    }${id ? `\n.setCustomId(${id})` : ''}${emoji ? `\n.setEmoji(${emoji})` : ''},\n`;
  return code;
};

createRestrictions(
  [
    'buttons_id',
    'buttons_member',
    'buttons_user',
    'buttons_channel',
    'buttons_server',
    'buttons_del',
  ],
  [
    {
      type: 'hasHat',
      blockTypes: ['buttons_event'],
      message: 'This block must be in a "When a button is clicked" event',
    },
  ]
);

createRestrictions(
  ['buttons_reply', 'buttons_edit'],
  [
    {
      type: 'hasHat',
      blockTypes: ['buttons_event'],
      message: 'This block must be in a "When a button is clicked" event',
    },
    {
      type: 'notEmpty',
      blockTypes: ['content', 'embeds'],
      message: 'You must specify the content and/or embed(s)',
    },
  ]
);

createRestrictions(
  ['buttons_add'],
  [
    {
      type: 'surroundParent',
      blockTypes: ['misc_addrow'],
      message: 'This block must be under a "add row" block',
    },
    {
      type: 'notEmpty',
      blockTypes: ['label'],
      message: 'You must specify a label to show to the user',
    },
  ]
);
