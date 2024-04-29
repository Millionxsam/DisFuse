import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["text_newline"] = {
  init: function () {
    this.appendDummyInput().appendField("new line");
    this.setOutput(true, "String");
    this.setColour("ffbf00");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["text_newline"] = function (block, generator) {
  var code = "'\\n'";
  return [code, Order.NONE];
};
