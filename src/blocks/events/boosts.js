import { createRestrictions } from "../../functions/restrictions";
import { createEventBlock, createEventVariable } from "../../functions/createEvent.ts";

const boostLevelCode = level =>
  `({None: 0, Tier1: 1, Tier2: 2, Tier3: 3}[${level}] ?? ${level})`;

createEventBlock({
  id: "events_boosts_serverBoosted",
  text: "when a member boosts the server",
  colour: "#A33DAC",
  event: "guildMemberBoost",
  variables: "boostedMember"
});

createEventVariable({
  id: "events_boosts_serverBoosted_member",
  text: "member that boosted",
  colour: "#A33DAC",
  blockType: "member",
  blockOutput: "boostedMember"
});

createEventVariable({
  id: "events_boosts_serverBoosted_server",
  text: "server that was boosted",
  colour: "#A33DAC",
  blockType: "server",
  blockOutput: "boostedMember.guild"
});

createRestrictions(
  ["events_boosts_serverBoosted_member", "events_boosts_serverBoosted_server"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_boosts_serverBoosted"],
      message: "This block must be in the 'when a member boosts the server' event"
    }
  ]
);

createEventBlock({
  id: "events_boosts_serverUnboosted",
  text: "when a member removes their boost from the server",
  colour: "#A33DAC",
  event: "guildMemberUnboost",
  variables: "unboostedMember"
});

createEventVariable({
  id: "events_boosts_serverUnboosted_member",
  text: "member that removed their boost",
  colour: "#A33DAC",
  blockType: "member",
  blockOutput: "unboostedMember"
});

createEventVariable({
  id: "events_boosts_serverUnboosted_server",
  text: "server that was unboosted",
  colour: "#A33DAC",
  blockType: "server",
  blockOutput: "unboostedMember.guild"
});

createRestrictions(
  ["events_boosts_serverUnboosted_member", "events_boosts_serverUnboosted_server"],
  [
    {
      type: "hasHat",
      blockTypes: ["events_boosts_serverUnboosted"],
      message:
        "This block must be in the 'when a member removes their boost from the server' event"
    }
  ]
);

createEventBlock({
  id: "events_boosts_levelUp",
  text: "when the server's boost level goes up",
  colour: "#A33DAC",
  event: "guildBoostLevelUp",
  variables: ["boostedGuild", "oldBoostLevel", "newBoostLevel"]
});

createEventVariable({
  id: "events_boosts_levelUp_server",
  text: "server whose boost level went up",
  colour: "#A33DAC",
  blockType: "server",
  blockOutput: "boostedGuild"
});

createEventVariable({
  id: "events_boosts_levelUp_oldLevel",
  text: "old boost level of the server",
  colour: "#A33DAC",
  blockType: "Number",
  blockOutput: boostLevelCode("oldBoostLevel")
});

createEventVariable({
  id: "events_boosts_levelUp_newLevel",
  text: "new boost level of the server",
  colour: "#A33DAC",
  blockType: "Number",
  blockOutput: boostLevelCode("newBoostLevel")
});

createRestrictions(
  [
    "events_boosts_levelUp_server",
    "events_boosts_levelUp_oldLevel",
    "events_boosts_levelUp_newLevel"
  ],
  [
    {
      type: "hasHat",
      blockTypes: ["events_boosts_levelUp"],
      message: "This block must be in the 'when the server's boost level goes up' event"
    }
  ]
);

createEventBlock({
  id: "events_boosts_levelDown",
  text: "when the server's boost level goes down",
  colour: "#A33DAC",
  event: "guildBoostLevelDown",
  variables: ["boostedGuild", "oldBoostLevel", "newBoostLevel"]
});

createEventVariable({
  id: "events_boosts_levelDown_server",
  text: "server whose boost level went down",
  colour: "#A33DAC",
  blockType: "server",
  blockOutput: "boostedGuild"
});

createEventVariable({
  id: "events_boosts_levelDown_oldLevel",
  text: "old boost level of the server",
  colour: "#A33DAC",
  blockType: "Number",
  blockOutput: boostLevelCode("oldBoostLevel")
});

createEventVariable({
  id: "events_boosts_levelDown_newLevel",
  text: "new boost level of the server",
  colour: "#A33DAC",
  blockType: "Number",
  blockOutput: boostLevelCode("newBoostLevel")
});

createRestrictions(
  [
    "events_boosts_levelDown_server",
    "events_boosts_levelDown_oldLevel",
    "events_boosts_levelDown_newLevel"
  ],
  [
    {
      type: "hasHat",
      blockTypes: ["events_boosts_levelDown"],
      message: "This block must be in the 'when the server's boost level goes down' event"
    }
  ]
);
