import * as Blockly from "blockly";
import javascript from "blockly/javascript";

function randomColor() {
  const r = Math.floor(Math.random() * 206) + 50;
  const g = Math.floor(Math.random() * 206) + 50;
  const b = Math.floor(Math.random() * 206) + 50;
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

Blockly.Blocks["color_picker"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("color")
      .appendField(new Blockly.FieldColour(randomColor()), "color");
    this.setOutput(true, "Color");
    this.setColour(20);
  },
};

javascript.javascriptGenerator.forBlock["color_picker"] = function (
  block,
  generator
) {
  var colour = block.getFieldValue("color");
  return [colour, javascript.Order.ATOMIC];
};

Blockly.Blocks["color_custom"] = {
  init: function () {
    var validator = function (newValue) {
      let regExp = /^#([0-9a-fA-F]{3}){1,2}$/i;
      if (regExp.test(newValue)) {
        return newValue;
      } else {
        return null;
      }
    };

    var field = new Blockly.FieldTextInput(randomColor());
    field.setValidator(validator);

    this.appendDummyInput()
      .appendField("custom hex")
      .appendField(field, "color");
    this.setColour(20);
    this.setOutput(true, "Color");
  },
};

javascript.javascriptGenerator.forBlock["color_custom"] = function (
  block,
  generator
) {
  var colour = block.getFieldValue("color");
  return [colour, javascript.Order.ATOMIC];
};
