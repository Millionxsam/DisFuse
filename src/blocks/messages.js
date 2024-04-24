import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";

const msgCreate = {
  type: "msg_received",
  message0: "When a message is sent %1 %2",
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
  colour: "#336EFF",
  tooltip: "",
  helpUrl: "",
};

const msgReply = {
  type: "msg_reply",
  message0: "Reply to message %1 content: %2",
  args0: [
    {
      type: "input_dummy",
    },
    {
      type: "input_value",
      name: "content",
      check: "String",
    },
  ],
  inputsInline: false,
  previousStatement: null,
  nextStatement: null,
  colour: "#336EFF",
  tooltip: "",
  helpUrl: "",
};

export const messageBlocks = Blockly.common.createBlockDefinitionsFromJsonArray(
  [msgCreate, msgReply]
);

javascriptGenerator.forBlock["msg_received"] = function (block, generator) {
  var code = generator.statementToCode(block, "event");

  var code = `  client.on("messageCreate", async (message) => {
        ${code}
    });\n`;
  return code;
};

javascriptGenerator.forBlock["msg_reply"] = function (block, generator) {
  var content = generator.valueToCode(block, "content", Order.ATOMIC);

  var code = `message.reply({
    content: ${content}
    });\n`;
  return code;
};
