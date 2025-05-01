import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../../functions/restrictions";

Blockly.Blocks["canvas_createCanvas"] = {
  init: function () {
    this.appendDummyInput().appendField("Create new canvas");
    this.appendValueInput("WIDTH").setCheck("Number").appendField("width:");
    this.appendValueInput("HEIGHT").setCheck("Number").appendField("height:");
    this.appendStatementInput("DO").setCheck(null).appendField("then");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C9F70");
    this.setTooltip(
      "Creates a new canvas with the specified width and height, then runs the given code."
    );
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["canvas_createCanvas"] = function (block, generator) {
  var width = generator.valueToCode(block, "WIDTH", Order.ATOMIC) ?? 500;
  var height = generator.valueToCode(block, "HEIGHT", Order.ATOMIC) ?? 500;
  var statements = generator.statementToCode(block, "DO");

  return `(() => {
  let canvas = _napi_rs_canvas.createCanvas(${width}, ${height});
  let ctx = canvas.getContext('2d');
  ${statements}})();`;
};

Blockly.Blocks["canvas_setFillColor"] = {
  init: function () {
    this.appendValueInput("COLOR").setCheck("Colour").appendField("Set fill color to");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C9F70");
    this.setTooltip("Sets the fill color for the canvas.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["canvas_setFillColor"] = function (block, generator) {
  var color = generator.valueToCode(block, "COLOR", Order.ATOMIC);
  var code = `ctx.fillStyle = ${color};\n`;
  return code;
};

Blockly.Blocks["canvas_setStrokeColor"] = {
  init: function () {
    this.appendValueInput("COLOR").setCheck("Colour").appendField("Set stroke color to");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C9F70");
    this.setTooltip("Sets the stroke color for the canvas.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["canvas_SetStrokeColor"] = function (block, generator) {
  var color = generator.valueToCode(block, "COLOR", Order.ATOMIC);
  var code = `ctx.strokeStyle = ${color};\n`;
  return code;
};

Blockly.Blocks["canvas_drawRectangle"] = {
  init: function () {
    this.appendValueInput("X").setCheck("Number").appendField("Draw rectangle at X:");
    this.appendValueInput("Y").setCheck("Number").appendField("Y:");
    this.appendValueInput("WIDTH").setCheck("Number").appendField("width:");
    this.appendValueInput("HEIGHT").setCheck("Number").appendField("height:");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C9F70");
    this.setTooltip("Draws a rectangle at the specified position.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["canvas_drawRectangle"] = function (block, generator) {
  var x = generator.valueToCode(block, "X", Order.ATOMIC) || 0;
  var y = generator.valueToCode(block, "Y", Order.ATOMIC) || 0;
  var width = generator.valueToCode(block, "WIDTH", Order.ATOMIC) || 100;
  var height = generator.valueToCode(block, "HEIGHT", Order.ATOMIC) || 100;
  var code = `ctx.fillRect(${x}, ${y}, ${width}, ${height});\n`;
  return code;
};

Blockly.Blocks["canvas_drawCircle"] = {
  init: function () {
    this.appendValueInput("X").setCheck("Number").appendField("Draw circle at X:");
    this.appendValueInput("Y").setCheck("Number").appendField("Y:");
    this.appendValueInput("RADIUS").setCheck("Number").appendField("radius:");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C9F70");
    this.setTooltip("Draws a filled circle at the specified position.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["canvas_drawCircle"] = function (block, generator) {
  var x = generator.valueToCode(block, "X", Order.ATOMIC) || 0;
  var y = generator.valueToCode(block, "Y", Order.ATOMIC) || 0;
  var radius = generator.valueToCode(block, "RADIUS", Order.ATOMIC) || 50;
  var code = `ctx.beginPath();\nctx.arc(${x}, ${y}, ${radius}, 0, Math.PI * 2);\nctx.fill();\n`;
  return code;
};

Blockly.Blocks["canvas_setLineWidth"] = {
  init: function () {
    this.appendValueInput("WIDTH").setCheck("Number").appendField("Set stroke width to");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C9F70");
    this.setTooltip("Sets the width of the stroke for future drawings.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["canvas_setLineWidth"] = function (block, generator) {
  var width = generator.valueToCode(block, "WIDTH", Order.ATOMIC) || 1;
  var code = `ctx.lineWidth = ${width};\n`;
  return code;
};

Blockly.Blocks["canvas_drawLine"] = {
  init: function () {
    this.appendValueInput("X1").setCheck("Number").appendField("Draw line from X:");
    this.appendValueInput("Y1").setCheck("Number").appendField("Y:");
    this.appendValueInput("X2").setCheck("Number").appendField("to X:");
    this.appendValueInput("Y2").setCheck("Number").appendField("Y:");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C9F70");
    this.setTooltip("Draws a line from one point to another.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["canvas_drawLine"] = function (block, generator) {
  var x1 = generator.valueToCode(block, "X1", Order.ATOMIC);
  var y1 = generator.valueToCode(block, "Y1", Order.ATOMIC);
  var x2 = generator.valueToCode(block, "X2", Order.ATOMIC);
  var y2 = generator.valueToCode(block, "Y2", Order.ATOMIC);
  var code = `ctx.beginPath();\nctx.moveTo(${x1}, ${y1});\nctx.lineTo(${x2}, ${y2});\nctx.stroke();\n`;
  return code;
};

Blockly.Blocks["canvas_clearCanvas"] = {
  init: function () {
    this.appendDummyInput().appendField("Clear canvas");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C9F70");
    this.setTooltip("Clears the entire canvas.");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["canvas_width"] = {
  init: function () {
    this.appendDummyInput().appendField("canvas width");
    this.setOutput(true, "Number");
    this.setColour("#4C9F70");
    this.setTooltip("Gets the width of the canvas.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["canvas_width"] = function (block, generator) {
  return [`canvas.width`, Order.ATOMIC];
};

Blockly.Blocks["canvas_height"] = {
  init: function () {
    this.appendDummyInput().appendField("canvas height");
    this.setOutput(true, "Number");
    this.setColour("#4C9F70");
    this.setTooltip("Gets the height of the canvas.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["canvas_height"] = function (block, generator) {
  return [`canvas.height`, Order.ATOMIC];
};

javascriptGenerator.forBlock["canvas_clearCanvas"] = function (block, generator) {
  var code = `ctx.clearRect(0, 0, canvas.width, canvas.height);\n`;
  return code;
};

createRestrictions(
  [
    "canvas_setFillColor",
    "canvas_drawRectangle",
    "canvas_drawCircle",
    "canvas_drawLine",
    "canvas_setLineWidth",
    "canvas_setStrokeColor",
    "canvas_width",
    "canvas_height",
  ],
  [
    {
      type: "hasParent",
      blockTypes: ["canvas_createCanvas"],
      message: 'This block must be in a "Create new canvas" block',
    },
  ]
);
