import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

const boostLevelCode = server =>
  `({None: 0, Tier1: 1, Tier2: 2, Tier3: 3}[${server}.premiumTier] ?? ${server}.premiumTier)`;

Blockly.Blocks["boost_count"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("number of boosts of server:");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour("#A33DAC");
    this.setTooltip("Returns the number of active boosts the server has");
  }
};

Blockly.Blocks["boost_level"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("boost level of server:");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour("#A33DAC");
    this.setTooltip("0 = no boosts, 1 = tier 1, 2 = tier 2, 3 = tier 3");
  }
};

Blockly.Blocks["boost_progressBar"] = {
  init: function () {
    this.appendValueInput("server").setCheck("server").appendField("server");
    this.appendDummyInput().appendField("has the boost progress bar enabled?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#A33DAC");
    this.setTooltip("Returns whether the server shows the boost progress bar");
  }
};

Blockly.Blocks["boost_setProgressBar"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("show the boost progress bar of server:");
    this.appendValueInput("enabled").setCheck("Boolean").appendField("set to");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#A33DAC");
    this.setTooltip("Enable or disable the boost progress bar on the server");
  }
};

javascriptGenerator.forBlock["boost_count"] = function (block, generator) {
  const value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  const code = `${value_server}.premiumSubscriptionCount`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["boost_level"] = function (block, generator) {
  const value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  const code = boostLevelCode(value_server);
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["boost_progressBar"] = function (block, generator) {
  const value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  const code = `${value_server}.premiumProgressBarEnabled`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["boost_setProgressBar"] = function (block, generator) {
  const value_server = generator.valueToCode(block, "server", Order.ATOMIC);
  const value_enabled = generator.valueToCode(block, "enabled", Order.ATOMIC);

  const code = `await ${value_server}.setPremiumProgressBarEnabled(${value_enabled});`;
  return code;
};

createRestrictions(
  ["boost_count", "boost_level", "boost_progressBar", "boost_setProgressBar"],
  [
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify a server"
    }
  ]
);

createRestrictions(
  ["boost_setProgressBar"],
  [
    {
      type: "notEmpty",
      blockTypes: ["enabled"],
      message: "You must specify whether to show the progress bar"
    }
  ]
);
