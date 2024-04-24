import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";

const botToken = {
  type: "bot_token",
  message0: "Log in to bot with the token: %1",
  args0: [
    {
      type: "input_value",
      name: "token",
      check: "String",
    },
  ],
  inputsInline: true,
  colour: "#FF6E33",
  tooltip: "",
  helpUrl: "",
};

const readyEvent = {
  type: "main_ready",
  message0: "When the bot is logged in %1 %2",
  args0: [
    {
      type: "input_dummy",
    },
    {
      type: "input_statement",
      name: "event",
    },
  ],
  inputsInline: false,
  colour: "#FF6E33",
  tooltip: "",
  helpUrl: "",
};

export const mainBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  botToken,
  readyEvent,
]);

javascriptGenerator.forBlock["bot_token"] = function (block, generator) {
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
