import { createRestrictions } from "../../functions/restrictions";
import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent.ts";

createEventBlock({
  id: "events_message_deleted",
  text: "When a message gets deleted",
  colour: "#FF4F4F",
  event: "messageDelete",
  variables: "messageDeleted",
});

createEventVariable({
  id: "events_message_deleted_message",
  text: "message that got deleted",
  colour: "#FF4F4F",
  blockType: "message",
  blockOutput: "messageDeleted",
});

createRestrictions(
  ["events_message_deleted_message"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_message_deleted"],
      message: "This block must be in the 'When a message gets deleted' event",
    },
  ]
);

createEventBlock({
  id: "events_message_ReactionAdd",
  text: "When a reaction is added to a message",
  colour: "#FF4F4F",
  event: "messageReactionAdd",
  variables: ["messageReaction", "user"],
});

createEventVariable({
  id: "events_message_ReactionAdd_user",
  text: "user that added reaction",
  colour: "#FF4F4F",
  blockType: "user",
  blockOutput: "user",
});

createEventVariable({
  id: "events_message_ReactionAdd_msg",
  text: "message the reaction was added to",
  colour: "#FF4F4F",
  blockType: "message",
  blockOutput: "messageReaction.message",
});

createEventVariable({
  id: "events_message_ReactionAdd_emoji",
  text: "emoji of the reaction",
  colour: "#FF4F4F",
  blockType: "String",
  blockOutput: "messageReaction.emoji.toString()",
});

createEventVariable({
  id: "events_message_ReactionAdd_count",
  text: "amount of the reaction",
  colour: "#FF4F4F",
  blockType: "Number",
  blockOutput: "messageReaction.count",
});

createRestrictions(
  ["events_message_ReactionAdd_user", "events_message_ReactionAdd_msg", "events_message_ReactionAdd_emoji", "events_message_ReactionAdd_count"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_message_ReactionAdd"],
      message:
        "This block must be in the 'When a reaction is added to a message' event",
    },
  ]
);
