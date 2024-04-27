import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["server_getone"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("server with the")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["id", "id"],
        ]),
        "type"
      )
      .appendField("of");
    this.appendValueInput("value").setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, "server");
    this.setColour("A33DAC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["server_getone"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `client.guilds.cache${
    dropdown_type === "name"
      ? `.find(s => s.name === ${value_value})`
      : dropdown_type === "id"
      ? `.get(${value_value})`
      : ""
  }`;

  return [code, Order.NONE];
};
