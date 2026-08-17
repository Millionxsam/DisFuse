import {
  createEventBlock,
  createEventVariable,
} from "../../functions/createEvent.ts";
import { createRestrictions } from "../../functions/restrictions";

createEventBlock({
  id: "events_thread_created",
  text: "when a thread is created",
  colour: "#5b67a5",
  event: "threadCreate",
  variables: ["createdThread", "parentChannel"],
});

createEventVariable({
  id: "events_thread_created_thread",
  text: "created thread",
  colour: "#5b67a5",
  blockType: "channel",
  blockOutput: "createdThread",
});

createEventVariable({
  id: "events_thread_created_parent",
  text: "parent channel",
  colour: "#5b67a5",
  blockType: "channel",
  blockOutput: "parentChannel",
});

createRestrictions(
  ["events_thread_created_thread", "events_thread_created_parent"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_thread_created"],
      message: "This block must be in the 'when a thread is created' event",
    },
  ],
);

createEventBlock({
  id: "events_thread_deleted",
  text: "when a thread is deleted",
  colour: "#5b67a5",
  event: "threadDelete",
  variables: "deletedThread",
});

createEventVariable({
  id: "events_thread_deleted_thread",
  text: "deleted thread",
  colour: "#5b67a5",
  blockType: "channel",
  blockOutput: "deletedThread",
});

createRestrictions(
  ["events_thread_deleted_thread"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_thread_deleted"],
      message: "This block must be in the 'when a thread is deleted' event",
    },
  ],
);
