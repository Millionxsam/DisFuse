import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["main_token"] = {
  init: function () {
    this.appendValueInput("token")
      .setCheck("String")
      .appendField("Log in to bot with the token:");
    this.setInputsInline(true);
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["main_ready"] = {
  init: function () {
    this.appendDummyInput().appendField("When the bot is logged in");
    this.appendStatementInput("event").setCheck(null);
    this.setInputsInline(false);
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["main_presence"] = {
  init: function () {
    this.appendDummyInput().appendField("Set the presence of the bot");
    this.appendDummyInput()
      .appendField("status:")
      .appendField(
        new Blockly.FieldDropdown([
          ["online", "online"],
          ["idle", "idle"],
          ["invisible", "invisible"],
          ["do not disturb", "dnd"],
        ]),
        "status"
      );
    this.appendValueInput("afk").setCheck("Boolean").appendField("AFK:");
    this.appendDummyInput()
      .appendField("activity type:")
      .appendField(
        new Blockly.FieldDropdown([
          ["Playing", "0"],
          ["Competing", "5"],
          ["Streaming", "1"],
          ["Listening", "2"],
          ["Watching", "3"],
        ]),
        "activity_type"
      );
    this.appendValueInput("activity_name")
      .setCheck("String")
      .appendField("activity name:");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FF6E33");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["main_token"] = function (block, generator) {
  const token = generator.valueToCode(block, "token", Order.ATOMIC);

  const code = `client.login(${token});\n`;
  return code;
};

javascriptGenerator.forBlock["main_ready"] = function (block, generator) {
  var code = generator.statementToCode(block, "event");

  var code = `client.on("ready", async () => {
    ${code}
  });\n`;
  return code;
};

javascriptGenerator.forBlock["main_presence"] = function (block, generator) {
  var dropdown_status = block.getFieldValue("status");
  var value_afk = generator.valueToCode(block, "afk", Order.ATOMIC);
  var dropdown_activity_type = block.getFieldValue("activity_type");
  var value_activity_name = generator.valueToCode(
    block,
    "activity_name",
    Order.ATOMIC
  );

  var code = `client.user.setPresence({
    status: "${dropdown_status}",
    afk: ${value_afk},
    activities: [{
      name: ${value_activity_name || ""},
      type: ${dropdown_activity_type || 0}
    }]
  });`;
  return code;
};
