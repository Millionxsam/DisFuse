import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["string_binary"] = {
  init() {
    this.appendValueInput("TEXT")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["convert string → binary", "ENCODE"],
          ["convert binary → string", "DECODE"],
        ]),
        "MODE",
      );

    this.setOutput(true, "String");
    this.setColour("#c93a5e");
    this.setTooltip("Convert text to binary or binary back to text");
    this.setHelpUrl("");
  },
};

// JavaScript generator
javascriptGenerator.forBlock["string_binary"] = function (block, generator) {
  const mode = block.getFieldValue("MODE");

  const text = generator.valueToCode(block, "TEXT", Order.NONE) || '""';

  let code;

  if (mode === "ENCODE") {
    code = `
(() => {
  const bytes = new TextEncoder().encode(${text});

  return [...bytes]
    .map(byte =>
      byte.toString(2).padStart(8, "0")
    )
    .join(" ");
})()
`;
  } else {
    code = `
(() => {
  const bytes = ${text}
    .split(" ")
    .map(bin =>
      parseInt(bin, 2)
    );

  return new TextDecoder()
    .decode(new Uint8Array(bytes));
})()
`;
  }

  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks["javascript_raw"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("raw code:")
      .appendField(
        new Blockly.FieldMultilineInput("console.log('hi');"),
        "CODE",
      );
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Inserts raw javascript code.");
  },
};

javascriptGenerator.forBlock["javascript_raw"] = function (block) {
  return `${block.getFieldValue("CODE")}\n`;
};

Blockly.Blocks["javascript_raw_float"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("raw code:")
      .appendField(
        new Blockly.FieldMultilineInput("console.log('hi');"),
        "CODE",
      );
    this.setColour("#c93a5e");
    this.setTooltip("Inserts raw javascript code.");
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
      .appendField("wait (in milliseconds):");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip(
      "Waits for an specific amount of time before continuing the code.",
    );
  },
};

javascriptGenerator.forBlock["javascript_wait"] = function (block, generator) {
  const time = generator.valueToCode(block, "number", Order.ATOMIC);
  return `await wait(${time});\n`;
};

Blockly.Blocks["javascript_consoleclear"] = {
  init: function () {
    this.appendDummyInput().appendField("clear console");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Clears the terminal console.");
  },
};

javascriptGenerator.forBlock["javascript_consoleclear"] = function () {
  return `console.clear();\n`;
};

Blockly.Blocks["javascript_consolelog"] = {
  init: function () {
    this.appendValueInput("log").setCheck(null).appendField("console log:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Logs something to the console.");
  },
};

javascriptGenerator.forBlock["javascript_consolelog"] = function (
  block,
  generator,
) {
  var log = generator.valueToCode(block, "log", Order.ATOMIC);

  return `console.log(${log});\n`;
};

Blockly.Blocks["javascript_consolewarn"] = {
  init: function () {
    this.appendValueInput("log").setCheck(null).appendField("console warn:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Logs a warn to the console.");
  },
};

javascriptGenerator.forBlock["javascript_consolewarn"] = function (
  block,
  generator,
) {
  var log = generator.valueToCode(block, "log", Order.ATOMIC);

  return `console.warn(${log});\n`;
};

Blockly.Blocks["javascript_consoleerror"] = {
  init: function () {
    this.appendValueInput("log").setCheck(null).appendField("console error:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Logs an error to the console.");
  },
};

javascriptGenerator.forBlock["javascript_consoleerror"] = function (
  block,
  generator,
) {
  var log = generator.valueToCode(block, "log", Order.ATOMIC);

  return `console.error(${log});\n`;
};

Blockly.Blocks["javascript_consoleinput"] = {
  init: function () {
    this.appendDummyInput().appendField("ask for input");
    this.appendValueInput("prompt")
      .setCheck(null)
      .appendField("prompt message:");
    this.setOutput(true, "String");
    this.setColour("#c93a5e");
    this.setTooltip("Asks the user for input and returns it as text.");
  },
};

javascriptGenerator.forBlock["javascript_consoleinput"] = function (
  block,
  generator,
) {
  var promptMessage =
    generator.valueToCode(block, "prompt", Order.ATOMIC) || "'Enter input:'";

  return [
    `(await (new Promise((resolve) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      readline.question(${promptMessage}, (input) => {
        readline.close();
        resolve(input);
      });
    })))`,
    Order.NONE,
  ];
};

Blockly.Blocks["javascript_trycatch"] = {
  init: function () {
    this.appendDummyInput().appendField("try to run code");
    this.appendStatementInput("code").setCheck("default");
    this.appendDummyInput().appendField("if error");
    this.appendStatementInput("error").setCheck("default");
    this.setInputsInline(false);
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#c93a5e");
  },
};

javascriptGenerator.forBlock["javascript_trycatch"] = function (
  block,
  generator,
) {
  var codeVar = generator.statementToCode(block, "code");
  var errorVar = generator.statementToCode(block, "error");

  return `try {
  ${codeVar}} catch (errorButWithLengthyName) {
  ${errorVar}};\n`;
};

Blockly.Blocks["javascript_trycatchfinally"] = {
  init: function () {
    this.appendDummyInput().appendField("try to run code");
    this.appendStatementInput("code").setCheck("default");
    this.appendDummyInput().appendField("if error");
    this.appendStatementInput("error").setCheck("default");
    this.appendDummyInput().appendField("then finally");
    this.appendStatementInput("finally").setCheck("default");
    this.setInputsInline(false);
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#c93a5e");
  },
};

javascriptGenerator.forBlock["javascript_trycatchfinally"] = function (
  block,
  generator,
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
  },
};

javascriptGenerator.forBlock["javascript_trycatch_error"] = () => [
  "errorButWithLengthyName",
  Order.NONE,
];

Blockly.Blocks["javascript_exit"] = {
  init: function () {
    this.appendValueInput("code")
      .setCheck("Number")
      .appendField("forcequit with code:");
    this.setPreviousStatement(true, "default");
    this.setColour("#c93a5e");
    this.setTooltip("Forces the bot to quit instantly, possible data loss!");
  },
};

javascriptGenerator.forBlock["javascript_exit"] = function (block, generator) {
  var exitCode = generator.valueToCode(block, "code", Order.ATOMIC) || 0;

  return `process.exit(${exitCode});\n`;
};

Blockly.Blocks["javascript_typeof"] = {
  init: function () {
    this.appendValueInput("value").setCheck(null).appendField("type of");
    this.setOutput(true, "String");
    this.setColour("#c93a5e");
    this.setTooltip(
      "Detects the type (string, number, object, etc.) that a value is",
    );
  },
};

javascriptGenerator.forBlock["javascript_typeof"] = function (
  block,
  generator,
) {
  let value = generator.valueToCode(block, "value", Order.ATOMIC);
  return [`typeof (${value})`, Order.NONE];
};
