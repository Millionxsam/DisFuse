import * as Blockly from 'blockly';
import { Order, javascriptGenerator } from 'blockly/javascript';
import { createRestrictions } from '../functions/restrictions';

Blockly.Blocks['music_findLyrics'] = {
  init: function () {
    this.appendDummyInput().appendField('Get lyrics');
    this.appendValueInput('artist')
      .setCheck('String')
      .appendField('by artist:');
    this.appendValueInput('song').setCheck('String').appendField('song name:');
    this.appendStatementInput('then').setCheck(null).appendField('then:');
    this.setColour('#379e37');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock['music_findLyrics'] = function (block, generator) {
  var val_artist = generator.valueToCode(block, 'artist', Order.ATOMIC);
  var val_song = generator.valueToCode(block, 'song', Order.ATOMIC);
  var code_then = generator.statementToCode(block, 'then');

  var code = `lyricsfinder(${val_artist}, ${val_song}).then(async (lyrics) => {
  ${code_then}});\n`;

  return code;
};

Blockly.Blocks['music_findLyrics_lyrics'] = {
  init: function () {
    this.appendDummyInput().appendField('song lyrics ');
    this.setColour('#379e37');
    this.setOutput(true, 'String');
  },
};

javascriptGenerator.forBlock['music_findLyrics_lyrics'] = () => [
  'lyrics || "No Lyrics Found!"',
  Order.NONE,
];

createRestrictions(
  ['music_findLyrics'],
  [
    {
      type: 'notEmpty',
      blockTypes: ['artist'],
      message: 'You must specify an artist',
    },
    {
      type: 'notEmpty',
      blockTypes: ['song'],
      message: 'You must specify a song name',
    },
  ]
);

createRestrictions(
  ['music_findLyrics_lyrics'],
  [
    {
      type: 'hasParent',
      blockTypes: ['music_findLyrics'],
      message: 'This block must be under a "Get lyrics" block',
    },
  ]
);
