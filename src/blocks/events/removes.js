import { createRestrictions } from "../../functions/restrictions";
import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent";

createEventBlock(
  "events_remove_guildmemberremove", // block id
  "When a member leaves / gets kicked from a server", // label
  "#FF4F4F", // colour
  "guildMemberRemove", // event
  "leavingMember" // event parameter/s
);

createEventVariable(
  "events_remove_guildmemberremove_member", // block id
  "leaving / kicked member", // label
  "#FF4F4F", // colour
  "member", // output type
  "leavingMember" // code output
);

createRestrictions(
  ["events_remove_guildmemberremove_member"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_remove_guildmemberremove"],
      message:
        "This block must be in the 'When a member leaves / gets kicked from a server' event",
    },
  ]
);
