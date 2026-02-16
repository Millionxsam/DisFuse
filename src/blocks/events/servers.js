import { createRestrictions } from "../../functions/restrictions";
import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent.ts";
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

createEventBlock({
  id: "events_guild_created",
  text: "When the bot is added to a server",
  colour: "#FF4F4F",
  event: "guildCreate",
  variables: "guildClientJoined",
});

createEventVariable({
  id: "events_guild_created_guild",
  text: "server the bot joined",
  colour: "#FF4F4F",
  blockType: "server",
  blockOutput: "guildClientJoined",
});

createRestrictions(
  ["events_guild_created_guild"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_guild_created"],
      message:
        "This block must be in the 'When the bot is added to a server' event",
    },
  ],
);

createEventBlock({
  id: "events_guild_deleted",
  text: "When the bot is removed from a server",
  colour: "#FF4F4F",
  event: "guildDelete",
  variables: "guildRemovedClient",
});

createEventVariable({
  id: "events_guild_deleted_guild",
  text: "server that removed the bot",
  colour: "#FF4F4F",
  blockType: "server",
  blockOutput: "guildRemovedClient",
});

createRestrictions(
  ["events_guild_deleted_guild"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_guild_deleted"],
      message:
        "This block must be in the 'When the bot is removed from a server' event",
    },
  ],
);

Blockly.Blocks["events_guild_memberAdd"] = {
  init: function () {
    this.appendDummyInput().appendField("When a member joins a server");
    this.setColour("#FF4F4F");
    this.appendStatementInput("code").setCheck(null);
    this.setPreviousStatement(false);
    this.setNextStatement(false);
  },
};

javascriptGenerator.forBlock["events_guild_memberAdd"] = function (
  block,
  generator,
) {
  const actions = generator.statementToCode(block, "code");
  const code = `tracker.on("guildMemberAdd", async (...guildMemberAdded) => {${actions}});`;

  return code;
};

createEventVariable({
  id: "events_guild_memberAdd_member",
  text: "member that joined",
  colour: "#FF4F4F",
  blockType: "member",
  blockOutput: "guildMemberAdded.member",
});

createEventVariable({
  id: "events_guild_memberAdd_server",
  text: "server the member joined to",
  colour: "#FF4F4F",
  blockType: "server",
  blockOutput: "guildMemberAdded.member.guild",
});

createEventVariable({
  id: "events_guild_memberAdd_invite",
  text: "invite the member joined with",
  colour: "#FF4F4F",
  blockType: "invite",
  blockOutput: "guildMemberAdded.invite",
});

createRestrictions(
  [
    "events_guild_memberAdd_member",
    "events_guild_memberAdd_server",
    "events_guild_memberAdd_invite",
  ],
  [
    {
      type: "hasHat",
      blockTypes: ["events_guild_memberAdd"],
      message: "This block must be in the 'When a member joins a server' event",
    },
  ],
);

createEventBlock({
  id: "events_remove_guildmemberremove",
  text: "When a member leaves / gets kicked from a server",
  colour: "#FF4F4F",
  event: "guildMemberRemove",
  variables: "leavingMember",
});

createEventVariable({
  id: "events_remove_guildmemberremove_member",
  text: "leaving member",
  colour: "#FF4F4F",
  blockType: "member",
  blockOutput: "leavingMember",
});

createEventVariable({
  id: "events_remove_guildmemberremove_server",
  text: "server that the member left from",
  colour: "#FF4F4F",
  blockType: "server",
  blockOutput: "leavingMember.guild",
});

createRestrictions(
  [
    "events_remove_guildmemberremove_member",
    "events_remove_guildmemberremove_server",
  ],
  [
    {
      type: "hasHat",
      blockTypes: ["events_remove_guildmemberremove"],
      message:
        "This block must be in the 'When a member leaves / gets kicked from a server' event",
    },
  ],
);
