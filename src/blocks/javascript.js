import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["javascript_raw"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Raw code:")
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

javascriptGenerator.forBlock["javascript_raw"] = function (block) {
  return `${block.getFieldValue("CODE")}\n`;
};

Blockly.Blocks["javascript_raw_float"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Raw code:")
      .appendField(
        new Blockly.FieldMultilineInput("console.log('hi');"),
        "CODE"
      );
    this.setColour("#c93a5e");
    this.setTooltip("Inserts raw javascript code.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_raw_float"] = function (block) {
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

javascriptGenerator.forBlock["javascript_raw_value"] = function (block) {
  var code = `${block.getFieldValue("CODE")}`;

  return [code, Order.NONE];
};

Blockly.Blocks["javascript_wait"] = {
  init: function () {
    this.appendValueInput("number")
      .setCheck("Number")
      .appendField("Wait (in milliseconds):");
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
    this.appendValueInput("log").setCheck(null).appendField("Console log:");
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
  var log = generator.valueToCode(block, "log", Order.ATOMIC);

  return `console.log(${log});\n`;
};

Blockly.Blocks["javascript_consolewarn"] = {
  init: function () {
    this.appendValueInput("log").setCheck(null).appendField("Console warn:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Logs a warn to the console.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_consolewarn"] = function (
  block,
  generator
) {
  var log = generator.valueToCode(block, "log", Order.ATOMIC);

  return `console.warn(${log});\n`;
};

Blockly.Blocks["javascript_consoleerror"] = {
  init: function () {
    this.appendValueInput("log").setCheck(null).appendField("Console error:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Logs an error to the console.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_consoleerror"] = function (
  block,
  generator
) {
  var log = generator.valueToCode(block, "log", Order.ATOMIC);

  return `console.error(${log});\n`;
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
  var codeVar = generator.statementToCode(block, "code");
  var errorVar = generator.statementToCode(block, "error");

  return `try {
  ${codeVar}} catch (errorButWithLengthyName) {
  ${errorVar}};\n`;
};

Blockly.Blocks["javascript_trycatchfinally"] = {
  init: function () {
    this.appendDummyInput().appendField("Try to run code");
    this.appendStatementInput("code").setCheck("default");
    this.appendDummyInput().appendField("If error");
    this.appendStatementInput("error").setCheck("default");
    this.appendDummyInput().appendField("Then finally");
    this.appendStatementInput("finally").setCheck("default");
    this.setInputsInline(false);
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["javascript_trycatchfinally"] = function (
  block,
  generator
) {
  var codeVar = generator.statementToCode(block, "code");
  var errorVar = generator.statementToCode(block, "error");
  var finallyVar = generator.statementToCode(block, "finally");

  return `try {
  ${codeVar}} catch (errorButWithLengthyName) {
  ${errorVar}} finally {
  ${finallyVar}};\n`;
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

javascriptGenerator.forBlock["javascript_trycatch_error"] = () => ["errorButWithLengthyName", Order.NONE,];

createRestrictions(
  ['emoji_getallinserver_value'],
  [
    {
      type: 'hasParent',
      blockTypes: ['emoji_getallinserver'],
      message: 'This block must be in a "for each emoji in the server" block',
    },
  ]
);