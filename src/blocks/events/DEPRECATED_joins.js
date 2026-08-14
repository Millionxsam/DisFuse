import { createRestrictions } from "../../functions/restrictions";
import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent.ts";

createEventBlock({
  id: "events_joins_guildmemberadd",
  text: "when a member joins a server",
  colour: "#3c9e56",
  event: "guildMemberAdd",
  variables: "joinedMember",
});

createEventVariable({
  id: "events_joins_guildmemberadd_member",
  text: "joining member",
  colour: "#3c9e56",
  blockType: "member",
  blockOutput: "joinedMember",
});

createEventVariable({
  id: "events_joins_guildmemberadd_server",
  text: "joining server",
  colour: "#3c9e56",
  blockType: "server",
  blockOutput: "joinedMember.guild",
});

createRestrictions(
  ["events_joins_guildmemberadd_member", "events_joins_guildmemberadd_server"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_joins_guildmemberadd"],
      message: "This block must be in the 'when a member joins a server' event",
    },
  ],
);
