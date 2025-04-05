import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";

Blockly.Blocks["output_valueInput"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get value input with name:")
      .appendField(new Blockly.FieldTextInput("name"), "name");
    this.appendDummyInput()
      .appendField("Order:")
      .appendField(
        new Blockly.FieldDropdown([
          ["none", "Order.NONE"],
          ["atomic", "Order.ATOMIC"],
        ]),
        "ORDER"
      );
    this.setColour("#a55b8d");
    this.setTooltip("tooltip");
    this.setHelpUrl("url");
    this.setOutput(true, "String");
  },
};

javascriptGenerator.forBlock["output_valueInput"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("name");
  var code = `generator.valueToCode(block, "${name}", ${block.getFieldValue(
    "ORDER"
  )})`;
  return [code, Order.NONE];
};

Blockly.Blocks["output_statementInput"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get statement input with name:")
      .appendField(new Blockly.FieldTextInput("name"), "name");
    this.setColour("#a55b8d");
    this.setTooltip("tooltip");
    this.setHelpUrl("url");
    this.setOutput(true, "String");
  },
};

javascriptGenerator.forBlock["output_statementInput"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("name");
  var code = `generator.statementToCode(block, "${name}")`;
  return [code, Order.NONE];
};

Blockly.Blocks["output_fieldValue"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get field value with name:")
      .appendField(new Blockly.FieldTextInput("name"), "name");
    this.setColour("#a55b8d");
    this.setTooltip("tooltip");
    this.setHelpUrl("url");
    this.setOutput(true, "String");
  },
};

javascriptGenerator.forBlock["output_fieldValue"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("name");
  var code = `block.getFieldValue("${name}")`;
  return [code, Order.NONE];
};
