import { createRestrictions } from "../../functions/restrictions";
import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent";

createEventBlock(
  "events_message_deleted",
  "When a message gets deleted",
  "#FF4F4F",
  "messageDelete",
  "messageDeleted"
);

createEventVariable(
  "events_message_deleted_message",
  "message that got deleted",
  "#FF4F4F",
  "message",
  "messageDeleted"
);

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

createEventBlock(
  "events_message_ReactionAdd", // block id
  "When a reaction is added to a message", // label
  "#FF4F4F", // colour
  "messageReactionAdd", // event
  "messageReaction" // event parameter/s
);

createEventVariable(
  "events_message_ReactionAdd_emoji", // block id
  "emoji of the reaction", // label
  "#FF4F4F", // colour
  "String", // output type
  "messageReaction.emoji.toString()" // code output
);

createEventVariable(
  "events_message_ReactionAdd_count", // block id
  "amount of the reaction", // label
  "#FF4F4F", // colour
  "Number", // output type
  "messageReaction.count" // code output
);

createRestrictions(
  ["events_message_ReactionAdd_emoji", "events_message_ReactionAdd_count"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_message_ReactionAdd"],
      message:
        "This block must be in the 'When a reaction is added to a message' event",
    },
  ]
);
