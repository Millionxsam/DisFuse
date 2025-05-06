import * as Blockly from 'blockly';
import {
  JavascriptGenerator,
  Order,
  javascriptGenerator,
} from 'blockly/javascript';

interface EventBlockOptions {
  id: string;
  text: string;
  colour: string;
  event: string;
  variables: string | string[];
  blockOutput: string;
}

interface EventVariableOptions {
  id: string;
  text: string;
  colour: string;
  blockType: string;
  blockOutput: string;
}

export function createEventBlock(options: EventBlockOptions): void {
  const { id, text, colour, event, variables, blockOutput } = options;

  const eventVariables = Array.isArray(variables)
    ? variables.join(', ')
    : variables;

  Blockly.Blocks[id] = {
    init: function () {
      this.appendDummyInput().appendField(text);
      this.appendStatementInput('code').setCheck(null);
      this.setColour(colour);
    },
  };

  javascriptGenerator[id] = function (
    block: Blockly.Block,
    generator: JavascriptGenerator
  ) {
    const statements_code = generator.statementToCode(block, 'code');
    const code = `client.on('${event}', async (${eventVariables}) => {\n${blockOutput ?? ''}\n${statements_code ?? ''}});\n`;
    return code;
  };
}

export function createEventVariable(options: EventVariableOptions): void {
  const { id, text, colour, blockType, blockOutput } = options;

  Blockly.Blocks[id] = {
    init: function () {
      this.appendDummyInput().appendField(text);
      this.setColour(colour);
      this.setOutput(true, blockType);
    },
  };

  javascriptGenerator[id] = function () {
    return [blockOutput ?? '', Order.NONE];
  };
}
