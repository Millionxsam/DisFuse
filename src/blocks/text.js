import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["text_newline"] = {
  init: function () {
    this.appendDummyInput().appendField("new line");
    this.setOutput(true, "String");
    this.setStyle("text_blocks");
  },
};

javascriptGenerator.forBlock["text_newline"] = function (block, generator) {
  var code = "'\\n'";
  return [code, Order.NONE];
};

Blockly.Blocks["text_contains"] = {
  init: function () {
    this.appendValueInput("text").appendField("text").setCheck("String");
    this.appendValueInput("query").appendField("contains").setCheck("String");
    this.setOutput(true, "Boolean");
    this.setStyle("text_blocks");
    this.setInputsInline(true);
  },
};

javascriptGenerator.forBlock["text_contains"] = function (block, generator) {
  const text = generator.valueToCode(block, "text", Order.NONE);
  const query = generator.valueToCode(block, "query", Order.NONE);

  var code = `${text}.includes(${query})`;
  return [code, Order.NONE];
};

Blockly.Blocks["text_regexp"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("regexp /")
      .appendField(
        new Blockly.FieldTextInput("regexp", function (newValue) {
          try {
            new RegExp(newValue);
            return newValue;
          } catch (err) {
            return null;
          }
        }),
        "regexp"
      )
      .appendField("/");
    this.setOutput(true, "regexp");
    this.setStyle("regexp_blocks");
  },
};

javascriptGenerator.forBlock["text_regexp"] = function (block, generator) {
  const regexp = generator.quote_(block.getFieldValue("regexp") || "");
  return [`new RegExp(${regexp})`, Order.NEW];
};

Blockly.Blocks["text_regexp_test"] = {
  init: function () {
    this.appendValueInput("regexp")
      .setCheck("regexp")
      .appendField("test regexp");
    this.appendValueInput("string").setCheck("String").appendField("on");
    this.setStyle("regexp_blocks");
    this.setOutput(true, "Boolean");
    this.setInputsInline(true);
  },
};

javascriptGenerator.forBlock["text_regexp_test"] = function (block, generator) {
  var regexp = generator.valueToCode(block, "regexp", Order.ATOMIC);
  var string = generator.valueToCode(block, "string", Order.ATOMIC);

  var code = `${regexp}.test(${string})`;

  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks["text_regexp_match"] = {
  init: function () {
    this.appendValueInput("regexp")
      .setCheck("regexp")
      .appendField("match regexp");
    this.appendValueInput("string").setCheck("String").appendField("on");
    this.setStyle("regexp_blocks");
    this.setOutput(true, "Array");
    this.setInputsInline(true);
  },
};

javascriptGenerator.forBlock["text_regexp_match"] = function (
  block,
  generator
) {
  var regexp = generator.valueToCode(block, "regexp", Order.ATOMIC);
  var string = generator.valueToCode(block, "string", Order.ATOMIC);

  var code = `${string}.match(${regexp})`;

  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks["text_regexp_exec"] = {
  init: function () {
    this.appendValueInput("regexp")
      .setCheck("regexp")
      .appendField("exec regexp");
    this.appendValueInput("string").setCheck("String").appendField("on");
    this.setStyle("regexp_blocks");
    this.setOutput(true, "Array");
    this.setInputsInline(true);
  },
};

javascriptGenerator.forBlock["text_regexp_exec"] = function (block, generator) {
  var regexp = generator.valueToCode(block, "regexp", Order.ATOMIC);
  var string = generator.valueToCode(block, "string", Order.ATOMIC);

  var code = `${regexp}.exec(${string})`;

  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks["text_regexp_replace"] = {
  init: function () {
    this.appendValueInput("regexp")
      .setCheck("regexp")
      .appendField("replace regexp");
    this.appendValueInput("string").setCheck("String").appendField("on");
    this.appendValueInput("replace")
      .setCheck("String")
      .appendField("with");
    this.setStyle("regexp_blocks");
    this.setOutput(true, "String");
    this.setInputsInline(true);
  },
};

javascriptGenerator.forBlock["text_regexp_replace"] = function (
  block,
  generator
) {
  var regexp = generator.valueToCode(block, "regexp", Order.ATOMIC);
  var string = generator.valueToCode(block, "string", Order.ATOMIC);
  var replace = generator.valueToCode(block, "replace", Order.ATOMIC);

  var code = `${string}.replace(${regexp}, ${replace})`;

  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks["text_regexp_search"] = {
  init: function () {
    this.appendValueInput("regexp")
      .setCheck("regexp")
      .appendField("search regexp");
    this.appendValueInput("string").setCheck("String").appendField("on");
    this.setStyle("regexp_blocks");
    this.setOutput(true, "Number");
  },
};

javascriptGenerator.forBlock["text_regexp_search"] = function (
  block,
  generator
) {
  var regexp = generator.valueToCode(block, "regexp", Order.ATOMIC);
  var string = generator.valueToCode(block, "string", Order.ATOMIC);

  var code = `${string}.search(${regexp})`;

  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks["text_repeat"] = {
  init: function () {
    this.appendValueInput("text").setCheck("String").appendField("repeat");
    this.appendValueInput("times").setCheck("Number");
    this.appendDummyInput().appendField("times");
    this.setStyle("text_blocks");
    this.setOutput(true, "String");
  },
};

javascriptGenerator.forBlock["text_repeat"] = function (block, generator) {
  var val_text = generator.valueToCode(block, "text", Order.ATOMIC);
  var val_times = generator.valueToCode(block, "times", Order.ATOMIC);

  return [`${val_text}.repeat(${val_times})`, Order.NONE];
};

Blockly.Blocks["text_startOrEndWith"] = {
  init: function () {
    this.appendValueInput("text").setCheck("String").appendField("does");
    this.appendValueInput("text2")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["start", "starts"],
          ["end", "ends"],
        ]),
        "name"
      )
      .appendField("with");
    this.setInputsInline(true);
    this.setStyle("text_blocks");
    this.setOutput(true, "Boolean");
  },
};

javascriptGenerator.forBlock["text_startOrEndWith"] = function (
  block,
  generator
) {
  var val_text = generator.valueToCode(block, "text", Order.ATOMIC);
  var val_text2 = generator.valueToCode(block, "text2", Order.ATOMIC);
  var field_name = block.getFieldValue("name");

  var code = `${val_text}.${field_name}With(${val_text2})`;

  return [code, Order.NONE];
};
