import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["time_date_now"] = {
  init: function () {
    this.appendDummyInput().appendField("current timestamp (milliseconds)");
    this.setOutput(true, "Number");
    this.setColour("#db4b9c");
    this.setTooltip("Returns milliseconds since January 1, 1970 (Unix Epoch)");
  },
};

javascriptGenerator.forBlock["time_date_now"] = function (block, generator) {
  var code = "Date.now()";
  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks["time_date"] = {
  init: function () {
    this.appendDummyInput().appendField("current date");
    this.setOutput(true, "date");
    this.setColour("#db4b9c");
  },
};

javascriptGenerator.forBlock["time_date"] = function (block, generator) {
  var code = "new Date()";
  return [code, Order.NEW];
};

Blockly.Blocks["time_between"] = {
  init: function () {
    this.appendValueInput("DATE1")
      .setCheck("date")
      .appendField(
        new Blockly.FieldDropdown([
          ["milliseconds", "* 1"],
          ["seconds", "/ 1000"],
          ["minutes", "/ 60000"],
          ["hours", "/ 3600000"],
        ]),
        "TIME"
      )
      .appendField("between date");
    this.appendValueInput("DATE2").setCheck("date").appendField("and date");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour("#db4b9c");
    this.setTooltip("Gets a specific amount between two dates.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["time_between"] = function (block, generator) {
  var time = block.getFieldValue("TIME");
  var date1 = generator.valueToCode(block, "DATE1", Order.ATOMIC);
  var date2 = generator.valueToCode(block, "DATE2", Order.ATOMIC);

  var code = `(${date1} - ${date2}) ${time}`;

  return [code, Order.NONE];
};

Blockly.Blocks["time_createdate"] = {
  init: function () {
    this.appendValueInput("TIME")
      .setCheck("String")
      .appendField("create date with time");
    this.setOutput(true, "date");
    this.setColour("#db4b9c");
  },
};

javascriptGenerator.forBlock["time_createdate"] = function (block, generator) {
  var time = generator.valueToCode(block, "TIME", Order.ATOMIC);

  return [`new Date(${time})`, Order.NEW];
};
