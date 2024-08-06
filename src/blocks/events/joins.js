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
  ["joinedMember", "joinedServer"]
);

createEventVariable(
  "events_joins_guildmemberadd_member",
  "joining member",
  "#FF4F4F",
  "member",
  "joinedMember"
);

createEventVariable(
  "events_joins_guildmemberadd_server",
  "joining server",
  "#FF4F4F",
  "server",
  "joinedServer"
);

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
