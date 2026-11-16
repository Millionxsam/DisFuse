import * as Blockly from "blockly";
import javascript from "blockly/javascript";
import { createRestrictions } from "./lib/restrictions";
import {
  FieldDatabaseDropdown,
  getDatabaseNames,
} from "./lib/databaseNames";

Blockly.Blocks["db_create"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("create database with name:")
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
    this.appendValueInput("id").setCheck("String").appendField("set");
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
    this.appendValueInput("id").setCheck("String").appendField("delete");
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
    this.appendValueInput("val").setCheck("Number").appendField("add");
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
    this.appendValueInput("val").setCheck("Number").appendField("subtract");
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
    this.appendValueInput("val").setCheck(null).appendField("push");
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
      .appendField("clear all data in the database with the name:")
      .appendField(new Blockly.FieldTextInput("database"), "db");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("C66953");
  },
};

javascript.javascriptGenerator.forBlock["db_clear"] = function (
  block,
  generator,
) {
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].clear();`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_push"] = function (
  block,
  generator,
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_val = generator.valueToCode(block, "val", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].push(${value_id}, ${value_val});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_sub"] = function (
  block,
  generator,
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_val = generator.valueToCode(block, "val", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].subtract(${value_id}, ${value_val});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_add"] = function (
  block,
  generator,
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_val = generator.valueToCode(block, "val", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].add(${value_id}, ${value_val});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_del"] = function (
  block,
  generator,
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].delete(${value_id});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_set"] = function (
  block,
  generator,
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_val = generator.valueToCode(block, "val", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].set(${value_id}, ${value_val});`;
  return code;
};

javascript.javascriptGenerator.forBlock["db_all"] = function (
  block,
  generator,
) {
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].all()`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["db_has"] = function (
  block,
  generator,
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].has(${value_id})`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["db_get"] = function (
  block,
  generator,
) {
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var text_db = block.getFieldValue("db");

  var code = `databases["${text_db}"].get(${value_id})`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["db_create"] = function (
  block,
  generator,
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
  ],
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
  ],
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
  ],
);

/* =====================================================================
   Database blocks that pick the database from a dropdown
   ---------------------------------------------------------------------
   The blocks above take the database's name as typed text, so a single
   wrong letter pointed them at a database that doesn't exist. These
   `_v2` versions list every "create database" block in the project, in
   all of its workspaces, instead. They generate exactly the same code.

   The text versions stay registered so saved projects still open, and
   are offered in the toolbox's Legacy category.
   ===================================================================== */

const DB_V2 = {
  db_get: (block) => {
    block.appendValueInput("id").setCheck("String").appendField("get");
    block
      .appendDummyInput()
      .appendField("from the database")
      .appendField(new FieldDatabaseDropdown(), "db");
    block.setOutput(true, null);
  },
  db_has: (block) => {
    block.appendValueInput("id").setCheck("String");
    block
      .appendDummyInput()
      .appendField("exists in the database")
      .appendField(new FieldDatabaseDropdown(), "db")
      .appendField("?");
    block.setOutput(true, "Boolean");
  },
  db_all: (block) => {
    block
      .appendDummyInput()
      .appendField("all data from the database")
      .appendField(new FieldDatabaseDropdown(), "db");
    block.setOutput(true, "Array");
  },
  db_set: (block) => {
    block.appendValueInput("id").setCheck("String").appendField("set");
    block.appendValueInput("val").setCheck(null).appendField("to");
    block
      .appendDummyInput()
      .appendField("in the database")
      .appendField(new FieldDatabaseDropdown(), "db");
  },
  db_del: (block) => {
    block.appendValueInput("id").setCheck("String").appendField("delete");
    block
      .appendDummyInput()
      .appendField("in the database")
      .appendField(new FieldDatabaseDropdown(), "db");
  },
  db_add: (block) => {
    block.appendValueInput("val").setCheck("Number").appendField("add");
    block.appendValueInput("id").setCheck("String").appendField("to");
    block
      .appendDummyInput()
      .appendField("in the database")
      .appendField(new FieldDatabaseDropdown(), "db");
  },
  db_sub: (block) => {
    block.appendValueInput("val").setCheck("Number").appendField("subtract");
    block.appendValueInput("id").setCheck("String").appendField("from");
    block
      .appendDummyInput()
      .appendField("in the database")
      .appendField(new FieldDatabaseDropdown(), "db");
  },
  db_push: (block) => {
    block.appendValueInput("val").setCheck(null).appendField("push");
    block.appendValueInput("id").setCheck("String").appendField("to");
    block
      .appendDummyInput()
      .appendField("in the database")
      .appendField(new FieldDatabaseDropdown(), "db");
  },
  db_clear: (block) => {
    block
      .appendDummyInput()
      .appendField("clear all data in the database")
      .appendField(new FieldDatabaseDropdown(), "db");
  },
};

Object.entries(DB_V2).forEach(([type, build]) => {
  Blockly.Blocks[`${type}_v2`] = {
    init: function () {
      build(this);
      this.setInputsInline(true);
      if (!this.outputConnection) {
        this.setPreviousStatement(true, "default");
        this.setNextStatement(true, "default");
      }
      this.setColour("C66953");
    },
  };

  javascript.javascriptGenerator.forBlock[`${type}_v2`] =
    javascript.javascriptGenerator.forBlock[type];
});

const DB_EXISTS = {
  type: "custom",
  check: (block) =>
    getDatabaseNames(block.workspace).includes(block.getFieldValue("db")),
  message:
    "No database with this name exists. Create one with the 'create database' block, or pick another from the dropdown",
};

createRestrictions(
  ["db_get_v2", "db_has_v2", "db_del_v2"],
  [
    {
      type: "notEmpty",
      blockTypes: ["id"],
      message: "You must specify the key",
    },
    DB_EXISTS,
  ],
);

createRestrictions(
  ["db_set_v2", "db_add_v2", "db_sub_v2", "db_push_v2"],
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
    DB_EXISTS,
  ],
);

createRestrictions(["db_all_v2", "db_clear_v2"], [DB_EXISTS]);
