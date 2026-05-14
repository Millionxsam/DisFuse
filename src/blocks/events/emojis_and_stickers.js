import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent.ts";
import { createRestrictions } from "../../functions/restrictions";

createEventBlock({
  id: "events_emojis_created",
  text: "when an emoji is created",
  colour: "#FF4F4F",
  event: "emojiCreate",
  variables: ["createdOrDeletedEmoji"],
});

createEventBlock({
  id: "events_emojis_deleted",
  text: "when an emoji is deleted",
  colour: "#FF4F4F",
  event: "emojiDelete",
  variables: ["createdOrDeletedEmoji"],
});

createEventVariable({
  id: "events_emojis_createdOrDeletedEmoji",
  text: "created/deleted emoji",
  colour: "#FF4F4F",
  blockType: "emoji",
  blockOutput: "createdOrDeletedEmoji",
});

createEventBlock({
  id: "events_emojis_changed",
  text: "when an emoji is changed",
  colour: "#FF4F4F",
  event: "emojiUpdate",
  variables: ["oldEmoji"  , "newEmoji"],
});

createEventVariable({
  id: "events_emojis_changedOldEmoji",
  text: "emoji before changes",
  colour: "#FF4F4F",
  blockType: "emoji",
  blockOutput: "oldEmoji",
});

createEventVariable({
  id: "events_emojis_changedNewEmoji",
  text: "emoji after changes",
  colour: "#FF4F4F",
  blockType: "emoji",
  blockOutput: "newEmoji",
});

createRestrictions(
  ["events_emojis_createdOrDeletedEmoji"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_emojis_created", "events_emojis_deleted"],
      message:
        "This block must be in the 'when an emoji is created/deleted' event",
    },
  ],
);

createRestrictions(
  ["events_emojis_changedNewEmoji", "events_emojis_changedOldEmoji"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_emojis_changed"],
      message:
        "This block must be in the 'when an emoji is changed' event",
    },
  ],
);

createEventBlock({
  id: "events_stickers_created",
  text: "when a sticker is created",
  colour: "#FF4F4F",
  event: "stickerCreate",
  variables: ["createdOrDeletedSticker"],
});

createEventBlock({
  id: "events_stickers_deleted",
  text: "when a sticker is deleted",
  colour: "#FF4F4F",
  event: "stickerDelete",
  variables: ["createdOrDeletedSticker"],
});

createEventVariable({
  id: "events_stickers_createdOrDeletedSticker",
  text: "created/deleted sticker",
  colour: "#FF4F4F",
  blockType: "sticker",
  blockOutput: "createdOrDeletedSticker",
});

createEventBlock({
  id: "events_stickers_changed",
  text: "when a sticker is changed",
  colour: "#FF4F4F",
  event: "stickerUpdate",
  variables: ["oldSticker"  , "newSticker"],
});

createEventVariable({
  id: "events_stickers_changedOldSticker",
  text: "sticker before changes",
  colour: "#FF4F4F",
  blockType: "sticker",
  blockOutput: "oldSticker",
});

createEventVariable({
  id: "events_stickers_changedNewSticker",
  text: "sticker after changes",
  colour: "#FF4F4F",
  blockType: "sticker",
  blockOutput: "newSticker",
});

createRestrictions(
  ["events_stickers_createdOrDeletedSticker"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_stickers_created", "events_stickers_deleted"],
      message:
        "This block must be in the 'when a sticker is created/deleted' event",
    },
  ],
);

createRestrictions(
  ["events_stickers_changedNewSticker", "events_stickers_changedOldSticker"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_stickers_changed"],
      message:
        "This block must be in the 'when a sticker is changed' event",
    },
  ],
);
