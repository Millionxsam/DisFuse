import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["javascript_raw"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("raw code:")
      .appendField(
        new Blockly.FieldMultilineInput("console.log('hi');"),
        "CODE"
      );
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Inserts raw javascript code.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_raw"] = function (block, generator) {
  return `${block.getFieldValue("CODE")}\n`;
};

Blockly.Blocks["javascript_raw_value"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("raw code:")
      .appendField(new Blockly.FieldTextInput("(1 + 1)"), "CODE");
    this.setOutput(true, null);
    this.setColour("#c93a5e");
    this.setTooltip("Inserts raw javascript code.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_raw_value"] = function (
  block,
  generator
) {
  var code = `${block.getFieldValue("CODE")}`;

  return [code, Order.NONE];
};

Blockly.Blocks["javascript_wait"] = {
  init: function () {
    this.appendValueInput("number")
      .setCheck("Number")
      .appendField("wait (in milliseconds):");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip(
      "Waits for an specific amount of time before continuing the code."
    );
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_wait"] = function (block, generator) {
  const time = generator.valueToCode(block, "number", Order.ATOMIC);
  return `await wait(${time});\n`;
};

Blockly.Blocks["javascript_consolelog"] = {
  init: function () {
    this.appendValueInput("LOG").setCheck(null).appendField("console log:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Logs something to the console.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_consolelog"] = function (
  block,
  generator
) {
  var log = generator.valueToCode(block, "LOG", Order.ATOMIC);

  return `console.log(${log});\n`;
};

Blockly.Blocks["javascript_trycatch"] = {
  init: function () {
    this.appendDummyInput().appendField("Try to run code");
    this.appendStatementInput("code").setCheck("default");
    this.appendDummyInput().appendField("If error");
    this.appendStatementInput("error").setCheck("default");
    this.setInputsInline(false);
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_trycatch"] = function (
  block,
  generator
) {
  var code_statement = generator.statementToCode(block, "code");
  var error_statement = generator.statementToCode(block, "error");

  return `try {
  ${code_statement}} catch (errorButWithLengthyName) {
  ${error_statement}};\n`;
};

Blockly.Blocks["javascript_trycatch_error"] = {
  init: function () {
    this.appendDummyInput().appendField("error");
    this.setColour("#c93a5e");
    this.setOutput(true, ["error", "String"]);
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_trycatch_error"] = () => [
  "errorButWithLengthyName",
  Order.NONE,
];
