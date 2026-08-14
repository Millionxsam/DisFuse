import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createMutatorBlock } from "../functions/createMutator.ts";

const COLOUR = "#FF6E33";

let cooldownVarIndex = 0;

function cooldownKey(user, command) {
  return "`${" + user + ".id}:${" + command + "}`";
}

createMutatorBlock({
  id: "cooldown_check",
  optionsBlockId: "cooldown_check_options",
  colour: COLOUR,
  inputs: [
    { type: "dummy", label: "create cooldown" },
    { type: "value", name: "command", check: "String", label: "command name:" },
    { type: "value", name: "duration", check: "Number", label: "duration (ms):" },
    { type: "value", name: "user", check: "user", label: "for user:" },
    { type: "statement", name: "code", check: "default", label: "then run:" }
  ],
  mutatorFields: [
    {
      name: "oncooldown",
      label: "include 'on cooldown'",
      default: false,
      inputType: "statement",
      inputLabel: "if on cooldown:",
      valueCheck: "default"
    }
  ],
  previousStatement: "default",
  nextStatement: "default",
  tooltip:
    "Runs the code only if the user is not on cooldown for this command. Optionally run code when the user is still on cooldown."
});

javascriptGenerator.forBlock["cooldown_check"] = function (block, generator) {
  const duration = generator.valueToCode(block, "duration", Order.ATOMIC) || "0";
  const user = generator.valueToCode(block, "user", Order.ATOMIC) || "message.author";
  const command = generator.valueToCode(block, "command", Order.NONE) || "''";
  const code = generator.statementToCode(block, "code");
  const oncooldown = generator.statementToCode(block, "oncooldown");

  const key = cooldownKey(user, command);
  const keyVar = `disfuseCooldownKey${++cooldownVarIndex}`;

  let result = `const ${keyVar} = ${key};
if (!disfuseCooldowns.has(${keyVar}) || disfuseCooldowns.get(${keyVar}) <= Date.now()) {
disfuseCooldowns.set(${keyVar}, Date.now() + ${duration});
${code}`;

  if (oncooldown) {
    result += `} else {
${oncooldown}`;
  }

  result += `}`;
  return result;
};

Blockly.Blocks["cooldown_has"] = {
  init: function () {
    this.appendValueInput("user").setCheck("user").appendField("is user:");
    this.appendValueInput("command")
      .setCheck("String")
      .appendField("on cooldown for command:");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(COLOUR);
    this.setTooltip(
      "Returns true if the user is currently on cooldown for the given command."
    );
  }
};

javascriptGenerator.forBlock["cooldown_has"] = function (block, generator) {
  const user = generator.valueToCode(block, "user", Order.ATOMIC) || "message.author";
  const command = generator.valueToCode(block, "command", Order.NONE) || "''";

  const key = cooldownKey(user, command);
  const code = `(disfuseCooldowns.has(${key}) && disfuseCooldowns.get(${key}) > Date.now())`;
  return [code, Order.NONE];
};

Blockly.Blocks["cooldown_get"] = {
  init: function () {
    this.appendValueInput("user").setCheck("user").appendField("cooldown left for user:");
    this.appendValueInput("command").setCheck("String").appendField("on command:");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(COLOUR);
    this.setTooltip(
      "Returns how many milliseconds are left until the cooldown for the command ends."
    );
  }
};

javascriptGenerator.forBlock["cooldown_get"] = function (block, generator) {
  const user = generator.valueToCode(block, "user", Order.ATOMIC) || "message.author";
  const command = generator.valueToCode(block, "command", Order.NONE) || "''";

  const key = cooldownKey(user, command);
  const code = `Math.max(0, (disfuseCooldowns.get(${key}) ?? 0) - Date.now())`;
  return [code, Order.NONE];
};

Blockly.Blocks["cooldown_set"] = {
  init: function () {
    this.appendValueInput("command")
      .setCheck("String")
      .appendField("set cooldown on command:");
    this.appendValueInput("duration").setCheck("Number").appendField("to duration (ms):");
    this.appendValueInput("user").setCheck("user").appendField("for user:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(COLOUR);
    this.setTooltip("Starts the cooldown timer for the given user and command.");
  }
};

javascriptGenerator.forBlock["cooldown_set"] = function (block, generator) {
  const duration = generator.valueToCode(block, "duration", Order.ATOMIC) || "0";
  const user = generator.valueToCode(block, "user", Order.ATOMIC) || "message.author";
  const command = generator.valueToCode(block, "command", Order.NONE) || "''";

  const key = cooldownKey(user, command);
  return `disfuseCooldowns.set(${key}, Date.now() + ${duration});\n`;
};

Blockly.Blocks["cooldown_clear"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("user")
      .appendField("clear cooldown for user:");
    this.appendValueInput("command").setCheck("String").appendField("on command:");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(COLOUR);
    this.setTooltip("Removes the cooldown for the given user and command.");
  }
};

javascriptGenerator.forBlock["cooldown_clear"] = function (block, generator) {
  const user = generator.valueToCode(block, "user", Order.ATOMIC) || "message.author";
  const command = generator.valueToCode(block, "command", Order.NONE) || "''";

  const key = cooldownKey(user, command);
  return `disfuseCooldowns.delete(${key});\n`;
};

Blockly.Blocks["cooldown_clearAll"] = {
  init: function () {
    this.appendDummyInput().appendField("clear all cooldowns");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(COLOUR);
    this.setTooltip("Removes every cooldown currently stored.");
  }
};

javascriptGenerator.forBlock["cooldown_clearAll"] = function () {
  return `disfuseCooldowns.clear();\n`;
};
