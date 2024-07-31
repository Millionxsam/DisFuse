import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["comment_stack"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("//")
      .appendField(new Blockly.FieldTextInput("comment"), "TEXT");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#364759");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["comment_stack"] = function (block, generator) {
  var text = block.getFieldValue("TEXT");
  var code = `// ${text}\n`;
  return code;
};

Blockly.Blocks["comment_float"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("//")
      .appendField(new Blockly.FieldTextInput("comment"), "TEXT");
    this.setInputsInline(true);
    this.setColour("#364759");
    this.setTooltip("");
    this.setHelpUrl("");
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
    this.setColour("#364759");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["comment_statement"] = function (
  block,
  generator
) {
  var text = block.getFieldValue("TEXT");
  var code = generator.statementToCode(block, "CODE");

  return `// ${text}
${String(code).trimStart()}`;
};

Blockly.Blocks["comment_stackImage"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("// Image")
      .appendField(
        new Blockly.FieldTextInput(
          "https://disfuse.vercel.app/media/disfuse-clear.png"
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
    this.setColour("#364759");
    this.setTooltip("");
    this.setHelpUrl("");
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
  var code = `// image ${text}\n`;
  return code;
};
