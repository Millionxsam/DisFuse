import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../../functions/restrictions";

Blockly.Blocks["canvas_createCanvas"] = {
  init: function () {
    this.appendDummyInput().appendField("Create new canvas");
    this.appendValueInput("WIDTH").setCheck("Number").appendField("width:");
    this.appendValueInput("HEIGHT").setCheck("Number").appendField("height:");
    this.appendStatementInput("DO").appendField("then");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip(
      "Creates a new canvas with the specified width and height, then runs the given code."
    );
  },
};
javascriptGenerator.forBlock["canvas_createCanvas"] = function (block) {
  const width =
    javascriptGenerator.valueToCode(block, "WIDTH", Order.ATOMIC) || 500;
  const height =
    javascriptGenerator.valueToCode(block, "HEIGHT", Order.ATOMIC) || 500;
  const body = javascriptGenerator.statementToCode(block, "DO");
  return `(async () => {
  const canvas = _napi_rs_canvas.createCanvas(${width}, ${height});
  const ctx = canvas.getContext('2d');
  ${body}})();\n`;
};

Blockly.Blocks["canvas_setFillColor"] = {
  init: function () {
    this.appendValueInput("COLOR")
      .setCheck("Colour")
      .appendField("Set fill color to");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Sets the fill color for the canvas.");
  },
};
javascriptGenerator.forBlock["canvas_setFillColor"] = (block) =>
  `ctx.fillStyle = ${javascriptGenerator.valueToCode(
    block,
    "COLOR",
    Order.ATOMIC
  )};\n`;

Blockly.Blocks["canvas_setStrokeColor"] = {
  init: function () {
    this.appendValueInput("COLOR")
      .setCheck("Colour")
      .appendField("Set stroke color to");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Sets the stroke color for the canvas.");
  },
};
javascriptGenerator.forBlock["canvas_setStrokeColor"] = (block) =>
  `ctx.strokeStyle = ${javascriptGenerator.valueToCode(
    block,
    "COLOR",
    Order.ATOMIC
  )};\n`;

Blockly.Blocks["canvas_setLineWidth"] = {
  init: function () {
    this.appendValueInput("WIDTH")
      .setCheck("Number")
      .appendField("Set line width to");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Sets the width of the stroke.");
  },
};
javascriptGenerator.forBlock["canvas_setLineWidth"] = (block) =>
  `ctx.lineWidth = ${javascriptGenerator.valueToCode(
    block,
    "WIDTH",
    Order.ATOMIC
  )};\n`;

Blockly.Blocks["canvas_drawRectangle"] = {
  init: function () {
    this.appendValueInput("X")
      .setCheck("Number")
      .appendField("Rectangle at X:");
    this.appendValueInput("Y").setCheck("Number").appendField("Y:");
    this.appendValueInput("W").setCheck("Number").appendField("width:");
    this.appendValueInput("H").setCheck("Number").appendField("height:");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Draws a filled rectangle.");
  },
};
javascriptGenerator.forBlock["canvas_drawRectangle"] = (block) => {
  const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || 0;
  const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || 0;
  const w = javascriptGenerator.valueToCode(block, "W", Order.ATOMIC) || 100;
  const h = javascriptGenerator.valueToCode(block, "H", Order.ATOMIC) || 100;
  return `ctx.fillRect(${x}, ${y}, ${w}, ${h});\n`;
};

Blockly.Blocks["canvas_drawCircle"] = {
  init: function () {
    this.appendValueInput("X").setCheck("Number").appendField("Circle at X:");
    this.appendValueInput("Y").setCheck("Number").appendField("Y:");
    this.appendValueInput("R").setCheck("Number").appendField("radius:");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Draws a filled circle.");
  },
};
javascriptGenerator.forBlock["canvas_drawCircle"] = (block) => {
  const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || 0;
  const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || 0;
  const r = javascriptGenerator.valueToCode(block, "R", Order.ATOMIC) || 50;
  return `ctx.beginPath(); ctx.arc(${x}, ${y}, ${r}, 0, Math.PI*2); ctx.fill();\n`;
};

Blockly.Blocks["canvas_drawLine"] = {
  init: function () {
    this.appendValueInput("X1").setCheck("Number").appendField("Line from X:");
    this.appendValueInput("Y1").setCheck("Number").appendField("Y:");
    this.appendValueInput("X2").setCheck("Number").appendField("to X:");
    this.appendValueInput("Y2").setCheck("Number").appendField("Y:");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Draws a line.");
  },
};
javascriptGenerator.forBlock["canvas_drawLine"] = (block) => {
  const x1 = javascriptGenerator.valueToCode(block, "X1", Order.ATOMIC);
  const y1 = javascriptGenerator.valueToCode(block, "Y1", Order.ATOMIC);
  const x2 = javascriptGenerator.valueToCode(block, "X2", Order.ATOMIC);
  const y2 = javascriptGenerator.valueToCode(block, "Y2", Order.ATOMIC);
  return `ctx.beginPath(); ctx.moveTo(${x1}, ${y1}); ctx.lineTo(${x2}, ${y2}); ctx.stroke();\n`;
};

Blockly.Blocks["canvas_setFont"] = {
  init: function () {
    this.appendValueInput("FONT").setCheck("String").appendField("Set font to");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Sets font for text.");
  },
};
javascriptGenerator.forBlock["canvas_setFont"] = (block) =>
  `ctx.font = ${javascriptGenerator.valueToCode(
    block,
    "FONT",
    Order.ATOMIC
  )};\n`;

Blockly.Blocks["canvas_fillText"] = {
  init: function () {
    this.appendValueInput("TEXT").setCheck("String").appendField("Fill text");
    this.appendValueInput("X").setCheck("Number").appendField("at X:");
    this.appendValueInput("Y").setCheck("Number").appendField("Y:");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Draws filled text.");
  },
};
javascriptGenerator.forBlock["canvas_fillText"] = (block) => {
  const text = javascriptGenerator.valueToCode(block, "TEXT", Order.NONE);
  const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || 0;
  const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || 0;
  return `ctx.fillText(${text}, ${x}, ${y});\n`;
};

Blockly.Blocks["canvas_strokeText"] = {
  init: function () {
    this.appendValueInput("TEXT").setCheck("String").appendField("Stroke text");
    this.appendValueInput("X").setCheck("Number").appendField("at X:");
    this.appendValueInput("Y").setCheck("Number").appendField("Y:");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Draws stroked text.");
  },
};
javascriptGenerator.forBlock["canvas_strokeText"] = (block) => {
  const text = javascriptGenerator.valueToCode(block, "TEXT", Order.NONE);
  const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || 0;
  const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || 0;
  return `ctx.strokeText(${text}, ${x}, ${y});\n`;
};

Blockly.Blocks["canvas_drawImage"] = {
  init: function () {
    this.appendValueInput("SRC")
      .setCheck("String")
      .appendField("Draw image from URL");
    this.appendValueInput("X").setCheck("Number").appendField("at X:");
    this.appendValueInput("Y").setCheck("Number").appendField("Y:");
    this.appendValueInput("W").setCheck("Number").appendField("width:");
    this.appendValueInput("H").setCheck("Number").appendField("height:");
    this.setInputsInline(false);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
    this.setTooltip("Loads and draws an image from a URL.");
  },
};
javascriptGenerator.forBlock["canvas_drawImage"] = (block) => {
  const src = javascriptGenerator.valueToCode(block, "SRC", Order.NONE);
  const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || 0;
  const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || 0;
  const w = javascriptGenerator.valueToCode(block, "W", Order.ATOMIC) || null;
  const h = javascriptGenerator.valueToCode(block, "H", Order.ATOMIC) || null;
  return `{
  const img = await _napi_rs_canvas.loadImage(${src});
  ctx.drawImage(img, ${x}, ${y}${w ? `, ${w}, ${h}` : ""});
}\n`;
};

Blockly.Blocks["canvas_save"] = {
  init: function () {
    this.appendDummyInput().appendField("Save canvas state");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
  },
};
javascriptGenerator.forBlock["canvas_save"] = () => `ctx.save();\n`;
Blockly.Blocks["canvas_restore"] = {
  init: function () {
    this.appendDummyInput().appendField("Restore canvas state");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
  },
};
javascriptGenerator.forBlock["canvas_restore"] = (block) => `ctx.restore();\n`;
Blockly.Blocks["canvas_rotate"] = {
  init: function () {
    this.appendValueInput("ANGLE")
      .setCheck("Number")
      .appendField("Rotate by (rad)");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
  },
};
javascriptGenerator.forBlock["canvas_rotate"] = (block) =>
  `ctx.rotate(${javascriptGenerator.valueToCode(
    block,
    "ANGLE",
    Order.ATOMIC
  )});\n`;
Blockly.Blocks["canvas_translate"] = {
  init: function () {
    this.appendValueInput("DX")
      .setCheck("Number")
      .appendField("Translate X by");
    this.appendValueInput("DY").setCheck("Number").appendField("Y by");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
  },
};
javascriptGenerator.forBlock["canvas_translate"] = (block) =>
  `ctx.translate(${javascriptGenerator.valueToCode(
    block,
    "DX",
    Order.ATOMIC
  )}, ${javascriptGenerator.valueToCode(block, "DY", Order.ATOMIC)});\n`;

Blockly.Blocks["canvas_clearCanvas"] = {
  init: function () {
    this.appendDummyInput().appendField("Clear canvas");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C9F70");
  },
};
javascriptGenerator.forBlock["canvas_clearCanvas"] = () =>
  `ctx.clearRect(0,0,canvas.width,canvas.height);\n`;

Blockly.Blocks["canvas_width"] = {
  init: function () {
    this.appendDummyInput().appendField("canvas width");
    this.setOutput(true, "Number");
    this.setColour("#4C9F70");
  },
};
javascriptGenerator.forBlock["canvas_width"] = () => [
  "canvas.width",
  Order.ATOMIC,
];
Blockly.Blocks["canvas_height"] = {
  init: function () {
    this.appendDummyInput().appendField("canvas height");
    this.setOutput(true, "Number");
    this.setColour("#4C9F70");
  },
};
javascriptGenerator.forBlock["canvas_height"] = () => [
  "canvas.height",
  Order.ATOMIC,
];

createRestrictions(
  [
    "canvas_setFillColor",
    "canvas_setStrokeColor",
    "canvas_setLineWidth",
    "canvas_drawRectangle",
    "canvas_drawCircle",
    "canvas_drawLine",
    "canvas_setFont",
    "canvas_fillText",
    "canvas_strokeText",
    "canvas_drawImage",
    "canvas_save",
    "canvas_restore",
    "canvas_rotate",
    "canvas_translate",
    "canvas_clearCanvas",
    "canvas_width",
    "canvas_height",
  ],
  [
    {
      type: "hasParent",
      blockTypes: ["canvas_createCanvas"],
      message: 'This block must be inside a "Create new canvas" block.',
    },
  ]
);
