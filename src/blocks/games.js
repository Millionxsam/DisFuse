import * as Blockly from 'blockly';
import { javascriptGenerator, Order } from 'blockly/javascript';

Blockly.Blocks['game_2048'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a 2048 game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    //   this.appendValueInput("dsc")
    //       .setCheck("String")
    //       .appendField("description/body:");
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_connect4'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a Connect4 game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('status')
      .setCheck('String')
      .appendField('status title:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_fasttype'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a FastType game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('dsc')
      .setCheck('String')
      .appendField('description/body:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_findemoji'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a FindEmoji game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('dsc')
      .setCheck('String')
      .appendField('description/body:');
    this.appendValueInput('finddsc')
      .setCheck('String')
      .appendField('second description:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_flood'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a Flood game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_hangman'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a Hangman game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_matchpairs'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a MatchPairs game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('dsc')
      .setCheck('String')
      .appendField('description/body:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_minesweeper'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a Minesweeper game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('dsc')
      .setCheck('String')
      .appendField('description/body:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_rps'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a RockPaperScissors game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendValueInput('opponent').setCheck('user').appendField('opponent:');
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('dsc')
      .setCheck('String')
      .appendField('description/body:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_slots'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a Slots game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_snake'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a Snake game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('overtitle')
      .setCheck('String')
      .appendField('game over title:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_tictactoe'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a TicTacToe game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendValueInput('opponent').setCheck('user').appendField('opponent:');
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('overtitle')
      .setCheck('String')
      .appendField('game over title:');
    this.appendValueInput('statustitle')
      .setCheck('String')
      .appendField('status title:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_wordle'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a Wordle game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['game_trivia'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Start a Trivia game from')
      .appendField(
        new Blockly.FieldDropdown([
          ['text command', 'false'],
          ['slash command', 'true'],
        ]),
        'slash'
      );
    this.appendDummyInput()
      .appendField('mode:')
      .appendField(
        new Blockly.FieldDropdown([
          ['single', 'single'],
          ['multiple', 'multiple'],
        ]),
        'mode'
      );
    this.appendDummyInput()
      .appendField('difficulty:')
      .appendField(
        new Blockly.FieldDropdown([
          ['easy', 'easy'],
          ['medium', 'medium'],
          ['hard', 'hard'],
        ]),
        'difficulty'
      );
    this.appendDummyInput().appendField('Configure embed ↓');
    this.appendValueInput('title').setCheck('String').appendField('title:');
    this.appendValueInput('dsc')
      .setCheck('String')
      .appendField('description/body:');
    this.appendValueInput('color')
      .setCheck(['Colour', 'String'])
      .appendField('color:');
    this.setInputsInline(false);
    this.setPreviousStatement(true, 'default');
    this.setNextStatement(true, 'default');
    this.setColour('#4fb88a');
    this.setTooltip('');
    this.setHelpUrl('');
  },
};

javascriptGenerator.forBlock['game_trivia'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, 'dsc', Order.ATOMIC);
  var value_mode = block.getFieldValue('mode');
  var value_dif = block.getFieldValue('difficulty');

  var code = `new discordgamecord.Trivia({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
            description: ${value_dsc},
        },
        difficulty: "${value_dif}",
        mode: "${value_mode}"
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_wordle'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);

  var code = `new discordgamecord.Wordle({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_tictactoe'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);
  var value_overtitle = generator.valueToCode(block, 'overtitle', Order.ATOMIC);
  var value_statustitle = generator.valueToCode(
    block,
    'statustitle',
    Order.ATOMIC
  );

  var code = `new discordgamecord.TicTacToe({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
            overTitle: ${value_overtitle},
            statusTitle: ${value_statustitle}
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_snake'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);
  var value_overtitle = generator.valueToCode(block, 'overtitle', Order.ATOMIC);

  var code = `new discordgamecord.Snake({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
            overTitle: ${value_overtitle}
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_slots'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);

  var code = `new discordgamecord.Slots({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_rps'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, 'dsc', Order.ATOMIC);

  var code = `new discordgamecord.RockPaperScissors({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
            description: ${value_dsc},
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_minesweeper'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, 'dsc', Order.ATOMIC);

  var code = `new discordgamecord.Minesweeper({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
            description: ${value_dsc},
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_matchpairs'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, 'dsc', Order.ATOMIC);

  var code = `new discordgamecord.MatchPairs({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
            description: ${value_dsc},
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_hangman'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);

  var code = `new discordgamecord.Hangman({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_flood'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);

  var code = `new discordgamecord.Flood({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_findemoji'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, 'dsc', Order.ATOMIC);
  var value_finddsc = generator.valueToCode(block, 'finddsc', Order.ATOMIC);

  var code = `new discordgamecord.FindEmoji({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
            description: ${value_dsc},
            findDescription: ${value_finddsc}
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_fasttype'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, 'dsc', Order.ATOMIC);

  var code = `new discordgamecord.FastType({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
            description: ${value_dsc}
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_connect4'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);
  var value_status = generator.valueToCode(block, 'status', Order.ATOMIC);

  var code = `new discordgamecord.Connect4({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color},
            statusTitle: ${value_status}
        }
    }).startGame();`;
  return code;
};

javascriptGenerator.forBlock['game_2048'] = function (block, generator) {
  var dropdown_slash = block.getFieldValue('slash');
  var value_title = generator.valueToCode(block, 'title', Order.ATOMIC);
  var value_color = generator.valueToCode(block, 'color', Order.ATOMIC);

  var code = `new discordgamecord.TwoZeroFourEight({
        message: ${dropdown_slash === 'true' ? 'interaction' : 'message'},
        isSlashGame: ${dropdown_slash},
        embed: {
            title: ${value_title},
            color: ${value_color}
        }
    }).startGame();`;
  return code;
};
