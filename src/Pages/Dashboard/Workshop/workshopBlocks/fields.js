import * as Blockly from "blockly";
import javascript from "blockly/javascript";

Blockly.Blocks["field_label"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("label with text")
      .appendField(new Blockly.FieldTextInput("label"), "label");
    this.setPreviousStatement(true, "Field");
    this.setNextStatement(true, "Field");
    this.setColour("#5b9ca5");
  },
};

javascript.javascriptGenerator.forBlock["field_label"] = function (
  block,
  generator
) {
  var label = block.getFieldValue("label");

  return `{
    "type": "label",
    "text": "${label}"
  },`;
};

Blockly.Blocks["field_textInput"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("text input named")
      .appendField(new Blockly.FieldTextInput("name"), "name")
      .appendField("with default")
      .appendField(new Blockly.FieldTextInput("default"), "default");
    this.setPreviousStatement(true, "Field");
    this.setNextStatement(true, "Field");
    this.setColour("#5b9ca5");
  },
};

javascript.javascriptGenerator.forBlock["field_textInput"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("name");
  var defaultValue = block.getFieldValue("default");

  return `{
    "type": "textInput",
    "name": "${name}",
    "defaultValue": "${defaultValue}"
  },`;
};

Blockly.Blocks["field_numericInput"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("numeric input named")
      .appendField(new Blockly.FieldTextInput("name"), "name")
      .appendField("with default")
      .appendField(new Blockly.FieldNumber(0), "default");
    this.appendDummyInput()
      .appendField("minimum")
      .appendField(new Blockly.FieldNumber(-Infinity), "min")
      .appendField("maximum")
      .appendField(new Blockly.FieldNumber(Infinity), "max");
    this.appendDummyInput()
      .appendField("with precision of")
      .appendField(
        new Blockly.FieldNumber(0, -Infinity, Infinity, 1),
        "precision"
      );
    this.setPreviousStatement(true, "Field");
    this.setNextStatement(true, "Field");
    this.setInputsInline(false);
    this.setColour("#5b9ca5");
  },
};

javascript.javascriptGenerator.forBlock["field_numericInput"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("name");
  var defaultValue = block.getFieldValue("default") || 0;
  var min = block.getFieldValue("min") || -Infinity;
  var max = block.getFieldValue("max") || Infinity;
  var precision = block.getFieldValue("precision");

  return `{
    "type": "numericInput",
    "name": "${name}",
    "defaultValue": ${
      defaultValue.toString().includes("Infinity")
        ? `"${defaultValue}"`
        : defaultValue
    },
    "min": ${min.toString().includes("Infinity") ? `"${min}"` : min},
    "max": ${max.toString().includes("Infinity") ? `"${max}"` : max},
    "precision": ${
      precision.toString().includes("Infinity") ? `"${precision}"` : precision
    }
  },`;
};

Blockly.Blocks["field_checkbox"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("checkbox named")
      .appendField(new Blockly.FieldTextInput("name"), "name")
      .appendField("with default")
      .appendField(new Blockly.FieldCheckbox("TRUE"), "default");
    this.setPreviousStatement(true, "Field");
    this.setNextStatement(true, "Field");
    this.setColour("#5b9ca5");
  },
};

javascript.javascriptGenerator.forBlock["field_checkbox"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("name");
  var defaultValue = block.getFieldValue("default");

  return `{
    "type": "checkbox",
    "name": "${name}",
    "defaultValue": "${defaultValue}"
  },`;
};

Blockly.Blocks["field_variable"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("variable input named")
      .appendField(new Blockly.FieldTextInput("name"), "name");
    this.appendDummyInput()
      .appendField("with default variable")
      .appendField(new Blockly.FieldTextInput("variable"), "default");
    this.setPreviousStatement(true, "Field");
    this.setNextStatement(true, "Field");
    this.setColour("#5b9ca5");
  },
};

javascript.javascriptGenerator.forBlock["field_variable"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("name");
  var defaultValue = block.getFieldValue("default");

  return `{
    "type": "variable",
    "name": "${name}",
    "defaultValue": "${defaultValue}"
  },`;
};

Blockly.Blocks["field_dropdown"] = {
  init: function () {
    this.appendDummyInput("dummy")
      .appendField("dropdown named")
      .appendField(new Blockly.FieldTextInput("name"), "name");
    this.appendStatementInput("code")
      .setCheck("dropdownChoice")
      .appendField("with choices");
    this.setColour("#5b9ca5");
    this.setPreviousStatement(true, "Field");
    this.setNextStatement(true, "Field");
  },
};

javascript.javascriptGenerator.forBlock["field_dropdown"] = function (
  block,
  generator
) {
  var choices = generator.statementToCode(block, "code");
  var name = block.getFieldValue("name");

  return `{
    "type": "dropdown",
    "name": "${name}",
    "choices": [${(choices || "")
      .split("")
      .reverse()
      .join("")
      .replace(",", "")
      .split("")
      .reverse()
      .join("")}]
  },`;
};

Blockly.Blocks["field_dropdownChoice"] = {
  init: function () {
    this.appendDummyInput("dummy")
      .appendField("choice with value")
      .appendField(new Blockly.FieldTextInput("value"), "value")
      .appendField("and display")
      .appendField(new Blockly.FieldTextInput("display"), "display");
    this.setColour("#65b8a4");
    this.setPreviousStatement(true, "dropdownChoice");
    this.setNextStatement(true, "dropdownChoice");
  },
};

javascript.javascriptGenerator.forBlock["field_dropdownChoice"] = function (
  block,
  generator
) {
  var field_value = block.getFieldValue("value");
  var field_display = block.getFieldValue("display");
  var code = `["${field_display}", "${field_value}"],`;
  return code;
};
