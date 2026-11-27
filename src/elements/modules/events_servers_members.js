/* Builder catalog module: events_servers_members. See ../../README.md for the format.

   Events from the block editor's "Server Actions", "Boosts" and "Member
   Actions" toolbox sections (src/blocks/events/servers.js, boosts.js,
   members.js). Each hat block is an event here, and its variable blocks
   are that event's values.

   Events with discord.js names listen with Discord.Events.X. The others
   (boosts, role and nickname changes) come from the discord-logs package,
   which adds them to the client, like the block editor's export does. The
   member join event comes from @androz2091/discord-invites-tracker so it
   can tell which invite was used. */

import { group } from "../define.js";

const { event } = group({ colour: "#A33DAC" });

/** discord-logs adds boost, role and nickname events to the client. */
const DISCORD_LOGS = {
  package: "discord-logs",
  code: `require("discord-logs")(client);`,
};

/** The invite tracker the "member joins" event listens on (same setup as the block editor). */
const INVITES_TRACKER = {
  package: "@androz2091/discord-invites-tracker",
  code: `const InvitesTracker = require("@androz2091/discord-invites-tracker");
const tracker = InvitesTracker.init(client, {
  fetchGuilds: true,
  fetchVanity: true,
  fetchAuditLogs: true,
});`,
};

/** discord-logs may give a boost level as a name ("Tier1") or a number. Always a number. */
const boostLevelCode = (level) => `({None: 0, Tier1: 1, Tier2: 2, Tier3: 3}[${level}] ?? ${level})`;

/* ---------------------------------------------------------------------
   Members joining and leaving
   --------------------------------------------------------------------- */

const memberJoins = event({
  id: "event_member_joins",
  label: "When a member joins a server",
  description:
    "Runs when someone joins a server the bot is in, and tells you which invite they used.",
  category: "members",
  group: "Joining and leaving",
  icon: "fa-solid fa-user-plus",
  keywords: ["join", "joined", "welcome", "new member", "invite", "arrive"],
  block: { type: "events_guild_memberAdd", text: "when a member joins a server" },
  params: ["guildMemberAdded", "_", "guildMemberAddedUsedInvite"],
  dependencies: [INVITES_TRACKER],
  values: [
    {
      key: "member",
      label: "Member who joined",
      description: "The person who just joined the server.",
      type: "member",
      code: "guildMemberAdded",
      block: {
        type: "events_guild_memberAdd_member",
        text: "member that joined",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_guild_memberAdd"],
            message: "This block must be in the 'when a member joins a server' event",
          },
        ],
      },
    },
    {
      key: "server",
      label: "Server they joined",
      description: "The server the member joined.",
      type: "server",
      code: "guildMemberAdded.guild",
      block: {
        type: "events_guild_memberAdd_server",
        text: "server the member joined to",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_guild_memberAdd"],
            message: "This block must be in the 'when a member joins a server' event",
          },
        ],
      },
    },
    {
      key: "invite",
      label: "Invite they used",
      description:
        "The invite the member joined with. Empty when the bot can't tell which one it was.",
      type: "invite",
      code: "guildMemberAddedUsedInvite",
      block: {
        type: "events_guild_memberAdd_invite",
        text: "invite the member joined with",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_guild_memberAdd"],
            message: "This block must be in the 'when a member joins a server' event",
          },
        ],
      },
    },
  ],
  wrap: (ctx, body) =>
    `tracker.on("guildMemberAdd", async (guildMemberAdded, _, guildMemberAddedUsedInvite) => {\n${body}});`,
});

const memberLeaves = event({
  id: "event_member_leaves",
  label: "When a member leaves a server",
  description: "Runs when someone leaves, is kicked from or is banned from a server the bot is in.",
  category: "members",
  group: "Joining and leaving",
  icon: "fa-solid fa-user-minus",
  keywords: ["leave", "left", "kicked", "goodbye", "remove", "quit"],
  block: {
    type: "events_remove_guildmemberremove",
    text: "when a member leaves / gets kicked from a server",
  },
  listen: "Discord.Events.GuildMemberRemove",
  params: ["leavingMember"],
  values: [
    {
      key: "member",
      label: "Member who left",
      description: "The person who left or was removed from the server.",
      type: "member",
      code: "leavingMember",
      block: {
        type: "events_remove_guildmemberremove_member",
        text: "leaving member",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_remove_guildmemberremove"],
            message:
              "This block must be in the 'when a member leaves / gets kicked from a server' event",
          },
        ],
      },
    },
    {
      key: "server",
      label: "Server they left",
      description: "The server the member left.",
      type: "server",
      code: "leavingMember.guild",
      block: {
        type: "events_remove_guildmemberremove_server",
        text: "server that the member left from",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_remove_guildmemberremove"],
            message:
              "This block must be in the 'when a member leaves / gets kicked from a server' event",
          },
        ],
      },
    },
  ],
});

/* ---------------------------------------------------------------------
   The bot joining and leaving servers
   --------------------------------------------------------------------- */

const botAdded = event({
  id: "event_bot_added",
  label: "When the bot is added to a server",
  description: "Runs when someone adds the bot to a new server.",
  category: "servers",
  group: "Bot added or removed",
  icon: "fa-solid fa-right-to-bracket",
  keywords: ["added", "invited", "joined", "new server", "guild create"],
  block: { type: "events_guild_created", text: "when the bot is added to a server" },
  listen: "Discord.Events.GuildCreate",
  params: ["guildClientJoined"],
  values: [
    {
      key: "server",
      label: "Server the bot joined",
      description: "The server the bot was just added to.",
      type: "server",
      code: "guildClientJoined",
      block: {
        type: "events_guild_created_guild",
        text: "server the bot joined",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_guild_created"],
            message: "This block must be in the 'when the bot is added to a server' event",
          },
        ],
      },
    },
  ],
});

const botRemoved = event({
  id: "event_bot_removed",
  label: "When the bot is removed from a server",
  description: "Runs when the bot is kicked or banned from a server, or the server is deleted.",
  category: "servers",
  group: "Bot added or removed",
  icon: "fa-solid fa-right-from-bracket",
  keywords: ["removed", "kicked", "left", "server deleted", "guild delete"],
  block: { type: "events_guild_deleted", text: "when the bot is removed from a server" },
  listen: "Discord.Events.GuildDelete",
  params: ["guildRemovedClient"],
  values: [
    {
      key: "server",
      label: "Server that removed the bot",
      description: "The server the bot is no longer in.",
      type: "server",
      code: "guildRemovedClient",
      block: {
        type: "events_guild_deleted_guild",
        text: "server that removed the bot",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_guild_deleted"],
            message: "This block must be in the 'when the bot is removed from a server' event",
          },
        ],
      },
    },
  ],
});

/* ---------------------------------------------------------------------
   Boosts
   --------------------------------------------------------------------- */

const memberBoosts = event({
  id: "event_boost_added",
  label: "When a member boosts the server",
  description: "Runs when someone starts boosting a server the bot is in.",
  category: "boosts",
  group: "Boosts",
  icon: "fa-solid fa-gem",
  keywords: ["boost", "boosted", "nitro", "premium", "booster"],
  block: { type: "events_boosts_serverBoosted", text: "when a member boosts the server" },
  listen: `"guildMemberBoost"`,
  params: ["boostedMember"],
  dependencies: [DISCORD_LOGS],
  values: [
    {
      key: "member",
      label: "Member who boosted",
      description: "The person who boosted the server.",
      type: "member",
      code: "boostedMember",
      block: {
        type: "events_boosts_serverBoosted_member",
        text: "member that boosted",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_boosts_serverBoosted"],
            message: "This block must be in the 'when a member boosts the server' event",
          },
        ],
      },
    },
    {
      key: "server",
      label: "Boosted server",
      description: "The server that was boosted.",
      type: "server",
      code: "boostedMember.guild",
      block: {
        type: "events_boosts_serverBoosted_server",
        text: "server that was boosted",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_boosts_serverBoosted"],
            message: "This block must be in the 'when a member boosts the server' event",
          },
        ],
      },
    },
  ],
});

const memberUnboosts = event({
  id: "event_boost_removed",
  label: "When a member removes their boost",
  description: "Runs when someone stops boosting a server the bot is in.",
  category: "boosts",
  group: "Boosts",
  icon: "fa-solid fa-heart-crack",
  keywords: ["unboost", "unboosted", "boost removed", "stopped boosting", "nitro", "premium"],
  block: {
    type: "events_boosts_serverUnboosted",
    text: "when a member removes their boost from the server",
  },
  listen: `"guildMemberUnboost"`,
  params: ["unboostedMember"],
  dependencies: [DISCORD_LOGS],
  values: [
    {
      key: "member",
      label: "Member who removed their boost",
      description: "The person who stopped boosting the server.",
      type: "member",
      code: "unboostedMember",
      block: {
        type: "events_boosts_serverUnboosted_member",
        text: "member that removed their boost",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_boosts_serverUnboosted"],
            message:
              "This block must be in the 'when a member removes their boost from the server' event",
          },
        ],
      },
    },
    {
      key: "server",
      label: "Server that lost the boost",
      description: "The server the boost was taken from.",
      type: "server",
      code: "unboostedMember.guild",
      block: {
        type: "events_boosts_serverUnboosted_server",
        text: "server that was unboosted",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_boosts_serverUnboosted"],
            message:
              "This block must be in the 'when a member removes their boost from the server' event",
          },
        ],
      },
    },
  ],
});

/** The values both boost level events share, each with its block. */
const boostLevelValues = (direction) => {
  const event = direction === "up" ? "Up" : "Down";
  const block = (name, text) => ({
    type: `events_boosts_level${event}_${name}`,
    text,
    restrictions: [
      {
        type: "hasHat",
        blockTypes: [`events_boosts_level${event}`],
        message: `This block must be in the 'when the server's boost level goes ${direction}' event`,
      },
    ],
  });
  return [
    {
      key: "server",
      label: `Server whose boost level went ${direction}`,
      description: `The server whose boost level went ${direction}.`,
      type: "server",
      code: "boostedGuild",
      block: block("server", `server whose boost level went ${direction}`),
    },
    {
      key: "oldLevel",
      label: "Old boost level",
      description: "The server's boost level before the change, from 0 to 3.",
      type: "Number",
      code: boostLevelCode("oldBoostLevel"),
      block: block("oldLevel", "old boost level of the server"),
    },
    {
      key: "newLevel",
      label: "New boost level",
      description: "The server's boost level now, from 0 to 3.",
      type: "Number",
      code: boostLevelCode("newBoostLevel"),
      block: block("newLevel", "new boost level of the server"),
    },
  ];
};

const levelUp = event({
  id: "event_boost_level_up",
  label: "When the server's boost level goes up",
  description: "Runs when a server gets enough boosts to reach a higher level.",
  category: "boosts",
  group: "Boost level",
  icon: "fa-solid fa-arrow-trend-up",
  keywords: ["boost level", "tier", "level up", "boost tier", "premium tier"],
  block: { type: "events_boosts_levelUp", text: "when the server's boost level goes up" },
  listen: `"guildBoostLevelUp"`,
  params: ["boostedGuild", "oldBoostLevel", "newBoostLevel"],
  dependencies: [DISCORD_LOGS],
  values: boostLevelValues("up"),
});

const levelDown = event({
  id: "event_boost_level_down",
  label: "When the server's boost level goes down",
  description: "Runs when a server loses boosts and drops to a lower level.",
  category: "boosts",
  group: "Boost level",
  icon: "fa-solid fa-arrow-trend-down",
  keywords: ["boost level", "tier", "level down", "boost tier", "premium tier"],
  block: { type: "events_boosts_levelDown", text: "when the server's boost level goes down" },
  listen: `"guildBoostLevelDown"`,
  params: ["boostedGuild", "oldBoostLevel", "newBoostLevel"],
  dependencies: [DISCORD_LOGS],
  values: boostLevelValues("down"),
});

/* ---------------------------------------------------------------------
   Member changes (roles, nickname)
   --------------------------------------------------------------------- */

const roleAdded = event({
  id: "event_member_role_added",
  label: "When a member is given a role",
  description: "Runs when a role is added to someone in a server the bot is in.",
  category: "members",
  group: "Roles and nicknames",
  icon: "fa-solid fa-user-shield",
  keywords: ["role added", "give role", "gets role", "role", "promoted"],
  block: {
    type: "events_members_addRole",
    text: "when a member is given a role",
    colour: "#3c9e56",
  },
  listen: `"guildMemberRoleAdd"`,
  params: ["member", "role"],
  dependencies: [DISCORD_LOGS],
  values: [
    {
      key: "member",
      label: "Member who was given the role",
      description: "The person who got the role.",
      type: "member",
      code: "member",
      block: {
        type: "events_members_addRole_member",
        text: "member who was given a role",
        colour: "#3c9e56",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_members_addRole"],
            message: "This block must be in the 'when a member is given a role' event",
          },
        ],
      },
    },
    {
      key: "role",
      label: "Role that was given",
      description: "The role that was added to the member.",
      type: "role",
      code: "role",
      block: {
        type: "events_members_addRole_role",
        text: "added role",
        colour: "#3c9e56",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_members_addRole"],
            message: "This block must be in the 'when a member is given a role' event",
          },
        ],
      },
    },
  ],
});

const roleRemoved = event({
  id: "event_member_role_removed",
  label: "When a member is removed from a role",
  description: "Runs when a role is taken away from someone in a server the bot is in.",
  category: "members",
  group: "Roles and nicknames",
  icon: "fa-solid fa-user-xmark",
  keywords: ["role removed", "take role", "loses role", "lost role", "role", "demoted"],
  block: {
    type: "events_members_removeRole",
    text: "when a member is removed from a role",
    colour: "#3c9e56",
  },
  listen: `"guildMemberRoleRemove"`,
  params: ["member", "role"],
  dependencies: [DISCORD_LOGS],
  values: [
    {
      key: "member",
      label: "Member who lost the role",
      description: "The person the role was taken from.",
      type: "member",
      code: "member",
      block: {
        type: "events_members_removeRole_member",
        text: "member who was removed from a role",
        colour: "#3c9e56",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_members_removeRole"],
            message: "This block must be in the 'when a member is removed from a role' event",
          },
        ],
      },
    },
    {
      key: "role",
      label: "Role that was removed",
      description: "The role that was taken from the member.",
      type: "role",
      code: "role",
      block: {
        type: "events_members_removeRole_role",
        text: "removed role",
        colour: "#3c9e56",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["events_members_removeRole"],
            message: "This block must be in the 'when a member is removed from a role' event",
          },
        ],
      },
    },
  ],
});

const nicknameChanged = event({
  id: "event_member_nickname_changed",
  label: "When a member's nickname changes",
  description: "Runs when someone's nickname is set, changed or cleared in a server the bot is in.",
  category: "members",
  group: "Roles and nicknames",
  icon: "fa-solid fa-signature",
  keywords: ["nickname", "nick", "name change", "renamed", "display name"],
  block: {
    type: "events_members_nickname",
    text: "when a member's nickname changes",
    colour: "#3c9e56",
  },
  listen: `"guildMemberNicknameUpdate"`,
  params: ["member", "oldNickname", "newNickname"],
  dependencies: [DISCORD_LOGS],
  values: [
    {
      key: "member",
      label: "Member whose nickname changed",
      description: "The person whose nickname changed.",
      type: "member",
      code: "member",
      block: {
        type: "events_members_nickname_member",
        text: "member whose nickname has changed",
        colour: "#3c9e56",
      },
    },
    {
      key: "oldNickname",
      label: "Old nickname",
      description: "Their nickname before the change. Empty if they didn't have one.",
      type: "String",
      code: "oldNickname",
      block: {
        type: "events_members_nickname_oldNickname",
        text: "old nickname",
        colour: "#3c9e56",
      },
    },
    {
      key: "newNickname",
      label: "New nickname",
      description: "Their nickname now. Empty if it was cleared.",
      type: "String",
      code: "newNickname",
      block: {
        type: "events_members_nickname_newNickname",
        text: "new nickname",
        colour: "#3c9e56",
      },
    },
  ],
});

export default {
  events: [
    memberJoins,
    memberLeaves,
    botAdded,
    botRemoved,
    memberBoosts,
    memberUnboosts,
    levelUp,
    levelDown,
    roleAdded,
    roleRemoved,
    nicknameChanged,
  ],
  actions: [],
  values: [],
  components: [],
  contexts: [],
};
