import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent.ts";
import { createRestrictions } from "../../functions/restrictions";

createEventBlock({
  id: "events_members_nickname",
  text: "When a member's nickname changes",
  colour: "#FF4F4F",
  event: "guildMemberNicknameUpdate",
  variables: ["member", "oldNickname", "newNickname"],
});

createEventVariable({
  id: "events_members_nickname_member",
  text: "member whose nickname has changed",
  colour: "#FF4F4F",
  blockType: "member",
  blockOutput: "member",
});

createEventVariable({
  id: "events_members_nickname_oldNickname",
  text: "old nickname",
  colour: "#FF4F4F",
  blockType: "String",
  blockOutput: "oldNickname",
});

createEventVariable({
  id: "events_members_nickname_newNickname",
  text: "new nickname",
  colour: "#FF4F4F",
  blockType: "String",
  blockOutput: "newNickname",
});

createEventBlock({
  id: "events_members_addRole",
  text: "When a member is given a role",
  colour: "#FF4F4F",
  event: "guildMemberRoleAdd",
  variables: ["member", "role"],
});

createEventVariable({
  id: "events_members_addRole_member",
  text: "member who was given a role",
  colour: "#FF4F4F",
  blockType: "member",
  blockOutput: "member",
});

createEventVariable({
  id: "events_members_addRole_role",
  text: "added role",
  colour: "#FF4F4F",
  blockType: "role",
  blockOutput: "role",
});

createEventBlock({
  id: "events_members_removeRole",
  text: "When a member is removed from a role",
  colour: "#FF4F4F",
  event: "guildMemberRoleRemove",
  variables: ["member", "role"],
});

createEventVariable({
  id: "events_members_removeRole_member",
  text: "member who was removed from a role",
  colour: "#FF4F4F",
  blockType: "member",
  blockOutput: "member",
});

createEventVariable({
  id: "events_members_removeRole_role",
  text: "removed role",
  colour: "#FF4F4F",
  blockType: "role",
  blockOutput: "role",
});

createRestrictions(
  ["events_members_addRole_member", "events_members_addRole_role"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_members_addRole"],
      message:
        "This block must be in the 'When a member is given a role' event",
    },
  ]
);

createRestrictions(
  ["events_members_removeRole_member", "events_members_removeRole_role"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_members_removeRole"],
      message:
        "This block must be in the 'When a member is removed from a role' event",
    },
  ]
);
