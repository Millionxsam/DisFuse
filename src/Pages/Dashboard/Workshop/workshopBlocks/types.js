import * as Blockly from "blockly";
import javascript from "blockly/javascript";

Blockly.Blocks["type_dropdown"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["any", "null"],
        ["String", "String"],
        ["Number", "Number"],
        ["Boolean", "Boolean"],
        ["Array", "Array"],
      ]),
      "DROPDOWN"
    );
    this.setOutput(true, "OutputType");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour("#5ba55b");
  },
};

javascript.javascriptGenerator.forBlock["type_dropdown"] = function (
  block,
  generator
) {
  return [block.getFieldValue("DROPDOWN"), javascript.Order.ATOMIC];
};

Blockly.Blocks["type_custom"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("type")
      .appendField(new Blockly.FieldTextInput("custom"), "type");
    this.setColour("#5ba55b");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setOutput(true, "OutputType");
  },
};

javascript.javascriptGenerator.forBlock["type_custom"] = function (
  block,
  generator
) {
  return [block.getFieldValue("type"), javascript.Order.ATOMIC];
};
