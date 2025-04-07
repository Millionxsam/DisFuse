import * as Blockly from "blockly";
import javascript from "blockly/javascript";

Blockly.Blocks["input_value"] = {
  init: function () {
    this.appendDummyInput("name")
      .appendField("Value input named")
      .appendField(new Blockly.FieldTextInput("name"), "name");
    this.appendStatementInput("fields")
      .setCheck("Field")
      .appendField("with fields");
    this.appendDummyInput()
      .appendField("set fields position to")
      .appendField(
        new Blockly.FieldDropdown([
          ["left", "-1"],
          ["center", "0"],
          ["right", "1"],
        ]),
        "fieldsPos"
      );
    this.appendValueInput("check")
      .setCheck(["OutputType", "Array"])
      .appendField("set check to");
    this.setPreviousStatement(true, "Input");
    this.setNextStatement(true, "Input");
    this.setInputsInline(false);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour("#5b80a5");
  },
};

javascript.javascriptGenerator.forBlock["input_value"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("name");
  name = name.replace(/[^A-Za-z0-9_.-]/g, "_");
  var fields = generator.statementToCode(block, "fields");
  var fieldPos = block.getFieldValue("fieldsPos");
  var check =
    generator.valueToCode(block, "check", javascript.Order.ATOMIC) || null;

  return `{
    "type": "value",
    "name": "${name}",
    "check": ${!check || check === "null" ? "null" : `"${check}"`},
    "align": ${fieldPos},
    "fields": [${(fields || "")
      .split("")
      .reverse()
      .join("")
      .replace(",", "")
      .split("")
      .reverse()
      .join("")}]
  },`;
};

Blockly.Blocks["input_statement"] = {
  init: function () {
    this.appendDummyInput("name")
      .appendField("Statement input named")
      .appendField(new Blockly.FieldTextInput("name"), "name");
    this.appendStatementInput("code")
      .setCheck("Field")
      .appendField("with fields");
    this.appendDummyInput()
      .appendField("set fields position to")
      .appendField(
        new Blockly.FieldDropdown([
          ["left", "-1"],
          ["center", "0"],
          ["right", "1"],
        ]),
        "fieldsPos"
      );
    this.appendValueInput("check")
      .setCheck(["OutputType", "Array"])
      .appendField("set check to");
    this.setPreviousStatement(true, "Input");
    this.setNextStatement(true, "Input");
    this.setInputsInline(false);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour("#5b80a5");
  },
};

javascript.javascriptGenerator.forBlock["input_statement"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("name");
  name = name.replace(/[^A-Za-z0-9_.-]/g, "_");
  var fields = generator.statementToCode(block, "code");
  var fieldPos = block.getFieldValue("fieldsPos");
  var check =
    generator.valueToCode(block, "check", javascript.Order.ATOMIC) || null;

  return `{
    "type": "statement",
    "name": "${name}",
    "check": ${!check || check === "null" ? "null" : `"${check}"`},
    "align": ${fieldPos},
    "fields": [${(fields || "")
      .split("")
      .reverse()
      .join("")
      .replace(",", "")
      .split("")
      .reverse()
      .join("")}]
  },`;
};

Blockly.Blocks["input_dummy"] = {
  init: function () {
    this.appendDummyInput().appendField("Dummy input");
    this.appendStatementInput("code")
      .setCheck("Field")
      .appendField("with fields");
    this.appendDummyInput()
      .appendField("set fields position to")
      .appendField(
        new Blockly.FieldDropdown([
          ["left", "-1"],
          ["center", "0"],
          ["right", "1"],
        ]),
        "fieldsPos"
      );
    this.setPreviousStatement(true, "Input");
    this.setNextStatement(true, "Input");
    this.setInputsInline(false);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour("#5b80a5");
  },
};

javascript.javascriptGenerator.forBlock["input_dummy"] = function (
  block,
  generator
) {
  var fields = generator.statementToCode(block, "code");
  var fieldPos = block.getFieldValue("fieldsPos");

  return `{
    "type": "dummy",
    "align": ${fieldPos},
    "fields": [${(fields || "")
      .split("")
      .reverse()
      .join("")
      .replace(",", "")
      .split("")
      .reverse()
      .join("")}]
  },`;
};

Blockly.Blocks["input_endrow"] = {
  init: function () {
    this.appendDummyInput().appendField("End-row input");
    this.appendStatementInput("code")
      .setCheck("Field")
      .appendField("with fields");
    this.appendDummyInput()
      .appendField("set fields position to")
      .appendField(
        new Blockly.FieldDropdown([
          ["left", "-1"],
          ["center", "0"],
          ["right", "1"],
        ]),
        "fieldsPos"
      );
    this.setPreviousStatement(true, "Input");
    this.setNextStatement(true, "Input");
    this.setInputsInline(false);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour("#5b80a5");
  },
};

javascript.javascriptGenerator.forBlock["input_endrow"] = function (
  block,
  generator
) {
  var fields = generator.statementToCode(block, "code");
  var fieldPos = block.getFieldValue("fieldsPos");

  return `{
    "type": "endrow",
    "align": ${fieldPos},
    "fields": [${(fields || "")
      .split("")
      .reverse()
      .join("")
      .replace(",", "")
      .split("")
      .reverse()
      .join("")}]
  },`;
};
