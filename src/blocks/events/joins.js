import { createRestrictions } from "../../functions/restrictions";
import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent";

createEventBlock(
  "events_joins_guildmemberadd",
  "When a member joins a server",
  "#FF4F4F",
  "guildMemberAdd",
  ["AddMember", "addServer"]
);

createEventVariable(
  "events_joins_guildmemberadd_member",
  "joining member",
  "#FF4F4F",
  "member",
  "AddMember"
);

// i hate bug
createEventVariable(
  "events_joins_guildmemberadd_joining_member",
  "joining member",
  "#FF4F4F",
  "member",
  "AddMember"
);

// i hate bug
createEventVariable(
  "events_joins_guildmemberadd_joining_server",
  "joining server",
  "#FF4F4F",
  "server",
  "AddServer"
);

createEventVariable(
  "events_joins_guildmemberadd_server",
  "joining server",
  "#FF4F4F",
  "server",
  "AddServer"
);

/*
Blockly.Blocks["events_joins_guildmemberadd"] = {
  init: function () {
    this.appendDummyInput().appendField("When a member joins a server");
    this.appendStatementInput("code").setCheck(null);
    this.setInputsInline(false);
    this.setColour("#FF4F4F");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["events_joins_member"] = {
  init: function () {
    this.appendDummyInput().appendField("joining member");
    this.setInputsInline(false);
    this.setColour("#FF4F4F");
    this.setOutput(true, "member");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["events_joins_server"] = {
  init: function () {
    this.appendDummyInput().appendField("joining server");
    this.setInputsInline(false);
    this.setColour("#FF4F4F");
    this.setTooltip("");
    this.setOutput(true, "server");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["events_joins_server"] = function (
  block,
  generator
) {
  var code = `member.guild`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["events_joins_member"] = function (
  block,
  generator
) {
  var code = `member`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["events_joins_guildmemberadd"] = function (
  block,
  generator
) {
  var statements_code = generator.statementToCode(block, "code");

  var code = `client.on("guildMemberAdd", async (member) => {
        ${statements_code}
    });`;
  return code;
};
*/

createRestrictions(
  ["events_joins_guildmemberadd_member", "events_joins_guildmemberadd_server"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_joins_guildmemberadd"],
      message: "This block must be in the 'when a member joins a server' event",
    },
  ]
);
