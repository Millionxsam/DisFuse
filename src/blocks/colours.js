import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

Blockly.Blocks["colour_convert"] = {
  init: function () {
    this.appendValueInput("value");
    this.appendDummyInput().appendField("to colour");
    this.setColour("#ad794c");
    this.setOutput(true, "Colour");
  },
};

javascriptGenerator.forBlock["colour_convert"] = function (block, generator) {
  var colour = generator.valueToCode(block, "value", Order.ATOMIC);
  return [colour, Order.ATOMIC];
};
