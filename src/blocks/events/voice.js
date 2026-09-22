import { createEventBlock, createEventVariable } from "../lib/createEvent";
import { createRestrictions } from "../lib/restrictions";

// when joining voice channel

createEventBlock({
  id: "events_voice_join",
  text: "when a member joins a voice channel",
  colour: "#1f9ea8",
  event: "voiceChannelJoin",
  variables: ["voiceJoinedMember", "voiceJoinedChannel"],
});

createEventVariable({
  id: "events_voice_join_member",
  text: "member who joined the voice channel",
  colour: "#1f9ea8",
  blockType: "member",
  blockOutput: "voiceJoinedMember",
});

createEventVariable({
  id: "events_voice_join_channel",
  text: "voice channel that was joined",
  colour: "#1f9ea8",
  blockType: "channel",
  blockOutput: "voiceJoinedChannel",
});

createRestrictions(
  ["events_voice_join_member", "events_voice_join_channel"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_voice_join"],
      message:
        "This block must be in the 'when a member joins a voice channel' event",
    },
  ],
);

// when leaving voice channel

createEventBlock({
  id: "events_voice_leave",
  text: "when a member leaves a voice channel",
  colour: "#1f9ea8",
  event: "voiceChannelLeave",
  variables: ["voiceLeftMember", "voiceLeftChannel"],
});

createEventVariable({
  id: "events_voice_leave_member",
  text: "member who left the voice channel",
  colour: "#1f9ea8",
  blockType: "member",
  blockOutput: "voiceLeftMember",
});

createEventVariable({
  id: "events_voice_leave_channel",
  text: "voice channel that was left",
  colour: "#1f9ea8",
  blockType: "channel",
  blockOutput: "voiceLeftChannel",
});

createRestrictions(
  ["events_voice_leave_member", "events_voice_leave_channel"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_voice_leave"],
      message:
        "This block must be in the 'when a member leaves a voice channel' event",
    },
  ],
);
