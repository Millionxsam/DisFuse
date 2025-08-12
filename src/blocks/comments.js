import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

function sanitizeComment(text) {
  if (typeof text !== "string") text = String(text);
  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\*\//g, "* /")
    .replace(/-->/g, "-- >")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
}

Blockly.Blocks["comment_stack"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("//")
      .appendField(new Blockly.FieldTextInput("comment"), "TEXT");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#476586");
  },
};

javascriptGenerator.forBlock["comment_stack"] = function (block, generator) {
  var text = block.getFieldValue("TEXT");
  var code = `// ${sanitizeComment(text)}\n`;
  return code;
};

Blockly.Blocks["comment_multiline"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("//")
      .appendField(
        new Blockly.FieldMultilineInput("multi-line\ncomment"),
        "TEXT"
      );
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#476586");
  },
};

javascriptGenerator.forBlock["comment_multiline"] = function (block) {
  var text = block.getFieldValue("TEXT");
  var code = `/*
${sanitizeComment(text)}
*/`;
  return code;
};

Blockly.Blocks["comment_float"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("//")
      .appendField(new Blockly.FieldTextInput("comment"), "TEXT");
    this.setInputsInline(true);
    this.setColour("#476586");
  },
};

javascriptGenerator.forBlock["comment_float"] = function (block, generator) {
  var text = block.getFieldValue("TEXT");
  var code = `// ${text}\n`;
  return code;
};

Blockly.Blocks["comment_statement"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("//")
      .appendField(
        new Blockly.FieldTextInput("comment that runs the code inside"),
        "TEXT"
      );
    this.appendStatementInput("CODE").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#476586");
  },
};

javascriptGenerator.forBlock["comment_statement"] = function (
  block,
  generator
) {
  var text = block.getFieldValue("TEXT");
  var code = generator.statementToCode(block, "CODE");

  return `// ${sanitizeComment(text)}
${String(code).trimStart()}`;
};

Blockly.Blocks["comment_stackImage"] = {
  init: function () {
    const urlValidator = function (newValue) {
      try {
        new URL(newValue);
        return newValue;
      } catch (e) {
        return null; 
      }
    };

    this.appendDummyInput().appendField("// Image").appendField(
      new Blockly.FieldTextInput(
        "https://disfuse.xyz/media/disfuse-clear.png",
        urlValidator 
      ),
      "TEXT"
    );

    this.imageField = new Blockly.FieldImage("", 200, 200, {
      alt: "*",
      flipRtl: "FALSE",
    });
    this.appendDummyInput().appendField(this.imageField);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#476586");
    this.setInputsInline(false);

    this.imageField.setValue(this.getFieldValue("TEXT"));

    this.setOnChange(
      function () {
        const imageUrl = this.getFieldValue("TEXT");
        this.imageField.setValue(imageUrl);
      }.bind(this)
    );
  },
};

javascriptGenerator.forBlock["comment_stackImage"] = function (
  block,
  generator
) {
  var text = block.getFieldValue("TEXT");
  var code = `// image (${text})\n`;
  return code;
};

Blockly.Blocks["comment_value"] = {
  init: function () {
    this.appendValueInput("VALUE").setCheck(null);
    this.appendDummyInput()
      .appendField("//")
      .appendField(new Blockly.FieldTextInput("comment"), "TEXT");
    this.setOutput(true, "String");
    this.setColour("#476586");
    this.setOnChange(function (event) {
      if (event.type === Blockly.Events.UI) return;
      this.setOutput(true, this.getBlockType());
    });
  },
  getBlockType: function () {
    const input = this.getInput("VALUE");
    if (!input) return null;

    return input?.connection?.targetConnection?.check || null;
  },
};

javascriptGenerator.forBlock["comment_value"] = function (block, generator) {
  const valueCode = generator.valueToCode(block, "VALUE", Order.NONE) || "null";
  const comment = block.getFieldValue("TEXT");
  const code = `${valueCode} /* ${sanitizeComment(comment)} */`;
  return [code, Order.ATOMIC];
};
