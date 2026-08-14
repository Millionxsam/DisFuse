import { createRestrictions } from "../../functions/restrictions";
import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent.ts";

createEventBlock({
  id: "events_message_pinned",
  text: "when a message is pinned",
  colour: "#336EFF",
  event: "messagePinned",
  variables: "pinnedMessage",
});

createEventVariable({
  id: "events_message_pinned_message",
  text: "pinned message",
  blockOutput: "pinnedMessage",
  blockType: "message",
  colour: "#336EFF",
});

createEventBlock({
  id: "events_message_edited",
  text: "when a message is edited",
  colour: "#336EFF",
  event: "messageContentEdited",
  variables: ["messageEdited", "oldContent", "newContent"],
});

createEventVariable({
  id: "events_message_edited_message",
  text: "edited message",
  blockOutput: "messageEdited",
  blockType: "message",
  colour: "#336EFF",
});

createEventVariable({
  id: "events_message_edited_oldContent",
  text: "old content",
  blockOutput: "oldContent",
  blockType: "String",
  colour: "#336EFF",
});

createEventVariable({
  id: "events_message_edited_newContent",
  text: "new content",
  blockOutput: "newContent",
  blockType: "String",
  colour: "#336EFF",
});

createEventBlock({
  id: "events_message_deleted",
  text: "when a message gets deleted",
  colour: "#336EFF",
  event: "messageDelete",
  variables: "messageDeleted",
});

createEventVariable({
  id: "events_message_deleted_message",
  text: "message that got deleted",
  colour: "#336EFF",
  blockType: "message",
  blockOutput: "messageDeleted",
});

createRestrictions(
  ["events_message_deleted_message"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_message_deleted"],
      message: "This block must be in the 'when a message gets deleted' event",
    },
  ],
);

createEventBlock({
  id: "events_message_ReactionAdd",
  text: "when a reaction is added to a message",
  colour: "#336EFF",
  event: "messageReactionAdd",
  variables: ["messageReaction", "user"],
  blockOutput: "if (messageReaction.partial) await messageReaction.fetch();",
});

createEventVariable({
  id: "events_message_ReactionAdd_user",
  text: "user that added reaction",
  colour: "#336EFF",
  blockType: "user",
  blockOutput: "user",
});

createEventVariable({
  id: "events_message_ReactionAdd_msg",
  text: "message the reaction was added to",
  colour: "#336EFF",
  blockType: "message",
  blockOutput: "messageReaction.message",
});

createEventVariable({
  id: "events_message_ReactionAdd_emoji",
  text: "emoji of the reaction",
  colour: "#336EFF",
  blockType: "String",
  blockOutput: "messageReaction.emoji.toString()",
});

createEventVariable({
  id: "events_message_ReactionAdd_count",
  text: "amount of the reaction",
  colour: "#336EFF",
  blockType: "Number",
  blockOutput: "messageReaction.count",
});

createRestrictions(
  [
    "events_message_ReactionAdd_user",
    "events_message_ReactionAdd_msg",
    "events_message_ReactionAdd_emoji",
    "events_message_ReactionAdd_count",
  ],
  [
    {
      type: "hasHat",
      blockTypes: ["events_message_ReactionAdd"],
      message:
        "This block must be in the 'when a reaction is added to a message' event",
    },
  ],
);
