import * as Blockly from "blockly";
import javascript from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["db_create"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Create database with name:")
      .appendField(new Blockly.FieldTextInput("database"), "name")
      .appendField("with file:")
      .appendField(new Blockly.FieldTextInput("database"), "path")
      .appendField(".json");
    this.setColour("C66953");
  },
};

Blockly.Blocks["db_get"] = {
  init: function () {
    this.appendValueInput("id").setCheck("String").appendField("get");
    this.appendDummyInput()
      .appendField("from the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour("C66953");
  },
};

Blockly.Blocks["db_has"] = {
  init: function () {
    this.appendValueInput("id").setCheck("String");
    this.appendDummyInput()
      .appendField("exists in the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db")
      .appendField("?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("C66953");
  },
};

Blockly.Blocks["db_all"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("all data from the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db");
    this.setInputsInline(true);
    this.setOutput(true, "Array");
    this.setColour("C66953");
  },
};

Blockly.Blocks["db_set"] = {
  init: function () {
    this.appendValueInput("id").setCheck("String").appendField("Set");
    this.appendValueInput("val").setCheck(null).appendField("to");
    this.appendDummyInput()
      .appendField("in the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("C66953");
  },
};

Blockly.Blocks["db_del"] = {
  init: function () {
    this.appendValueInput("id").setCheck("String").appendField("Delete");
    this.appendDummyInput()
      .appendField("in the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("C66953");
  },
};

Blockly.Blocks["db_add"] = {
  init: function () {
    this.appendValueInput("val").setCheck("Number").appendField("Add");
    this.appendValueInput("id").setCheck("String").appendField("to");
    this.appendDummyInput()
      .appendField("in the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("C66953");
  },
};

Blockly.Blocks["db_sub"] = {
  init: function () {
    this.appendValueInput("val").setCheck("Number").appendField("Subtract");
    this.appendValueInput("id").setCheck("String").appendField("from");
    this.appendDummyInput()
      .appendField("in the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("C66953");
  },
};

Blockly.Blocks["db_push"] = {
  init: function () {
    this.appendValueInput("val").setCheck(null).appendField("Push");
    this.appendValueInput("id").setCheck("String").appendField("to");
    this.appendDummyInput()
      .appendField("in the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("C66953");
  },
};

Blockly.Blocks["db_clear"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Clear all data in the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("C66953");
  },
};

javascript.javascriptGenerator.forBlock["db_clear"] = function (
  block,
  generator
) {
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].clear();`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_push"] = function (
  block,
  generator
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_val = generator.valueToCode(block, "val", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].push(${value_id}, ${value_val});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_sub"] = function (
  block,
  generator
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_val = generator.valueToCode(block, "val", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].subtract(${value_id}, ${value_val});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_add"] = function (
  block,
  generator
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_val = generator.valueToCode(block, "val", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].add(${value_id}, ${value_val});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_del"] = function (
  block,
  generator
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].delete(${value_id});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_set"] = function (
  block,
  generator
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_val = generator.valueToCode(block, "val", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].set(${value_id}, ${value_val});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_all"] = function (
  block,
  generator
) {
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].all()`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["db_has"] = function (
  block,
  generator
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].has(${value_id})`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["db_get"] = function (
  block,
  generator
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].get(${value_id})`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["db_create"] = function (
  block,
  generator
) {
  var text_name = block.getFieldValue("name");
  var text_path = block.getFieldValue("path");

  var code = `databases["${text_name}"] = new easy_json_database("./${text_path}.json");`;
  return code;
};

createRestrictions(
  ["db_get", "db_has", "db_del"],
  [
    {
      type: "notEmpty",
      blockTypes: ["id"],
      message: "You must specify the key",
    },
    {
      type: "blockNotFound",
      blockTypes: ["db_create"],
      message:
        "You must create a database first with the 'create database' block",
    },
  ]
);

createRestrictions(
  ["db_set", "db_add", "db_subtract", "db_push"],
  [
    {
      type: "notEmpty",
      blockTypes: ["id"],
      message: "You must specify the key to modify",
    },
    {
      type: "notEmpty",
      blockTypes: ["val"],
      message: "You must specify the value",
    },
    {
      type: "blockNotFound",
      blockTypes: ["db_create"],
      message:
        "You must create a database first with the 'create database' block",
    },
  ]
);

createRestrictions(
  ["db_clear"],
  [
    {
      type: "blockNotFound",
      blockTypes: ["db_create"],
      message:
        "You must create a database first with the 'create database' block",
    },
  ]
);
