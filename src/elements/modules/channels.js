/* =====================================================================
   Builder catalog: channels
   ---------------------------------------------------------------------
   Finding, creating, changing and deleting channels, sending messages
   to them, and waiting for messages in them. Steps that make a channel
   provide it inside their "After it's made" section.
   ===================================================================== */

import { buildMessageOptions, buildThenSuffix } from "../../blocks/lib/generatorUtils.js";
import { group, input } from "../define.js";

const { action, value, block } = group({ colour: "#AD509B" });

/* The role or member a permission change is for: @everyone is the
   server's own everyone role, which the block editor never managed to
   pass along (its "@everyone" block wrote an undefined name). */
function permissionTarget(ctx, channel) {
  return ctx.raw("target") === "everyone" ? `${channel}.guild.roles.everyone` : ctx.input("role");
}

const events = [];

const actions = [
  action({
    id: "member_move_voice",
    label: "Move a member to a voice channel",
    description:
      "Moves someone to another voice channel. Does nothing if they aren't in a voice channel.",
    category: "voice",
    icon: "fa-solid fa-person-walking-arrow-right",
    keywords: ["move", "voice", "drag", "switch channel", "vc"],
    block: {
      type: "channel_moveMember",
      text: ["move member: {member}", "to voice channel: {channel}", "reason: {reason}"],
      tooltip:
        "Moves a member to another voice channel. Does nothing if the member is not in a voice channel.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["member"],
          message: "You must specify the member to move",
        },
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the voice channel to move the member to",
        },
        {
          type: "validator",
          blockTypes: ["reason"],
          check: (val) => val.length <= 512,
          message: "Reason cannot be greater than 512 characters",
        },
      ],
    },
    inputs: [
      input.slot("member", "Member", "member"),
      input.slot("channel", "Voice channel", "channel"),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `if (${ctx.input("member")}.voice.channel) {\n  await ${ctx.input("member")}.voice.setChannel(${ctx.input("channel")}, ${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n}\n`,
  }),
  action({
    id: "channel_each",
    label: "Repeat with each channel in a server",
    description: "Runs the steps inside once for every channel in a server.",
    category: "channels",
    group: "Finding",
    icon: "fa-solid fa-list-ol",
    keywords: ["for each", "loop", "all channels"],
    block: {
      type: "channel_foreach",
      text: ["for each channel on the server: {server}", "{code}"],
      parts: { code: { check: "default" } },
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to iterate channels from.",
        },
      ],
    },
    inputs: [input.slot("server", "Server", "server")],
    branches: [
      {
        key: "code",
        label: "Do",
        provides: [
          {
            key: "channel",
            label: "Current channel",
            type: "channel",
            code: "channel",
            block: { type: "channel_channel", text: "current channel on the loop" },
          },
        ],
      },
    ],
    code: (ctx) =>
      `await forEachCollection(${ctx.input("server")}, "channels", async (channel) => {\n${ctx.branch("code")}});\n`,
  }),
  action({
    id: "channel_create",
    label: "Create a channel",
    description: "Makes a new channel in a server.",
    category: "channels",
    group: "Creating and deleting",
    icon: "fa-solid fa-square-plus",
    keywords: ["create channel", "new channel", "make channel"],
    block: {
      type: "channel_create",
      text: [
        "create a channel",
        "in the server: {guild}",
        "name: {name}",
        "in category: {parent}",
        "type: {type}",
        "then: {then}",
      ],
      parts: {
        type: {
          options: [
            ["announcements", "GuildAnnouncement"],
            ["category", "GuildCategory"],
            ["forum", "GuildForum"],
            ["media", "GuildMedia"],
            ["stage", "GuildStageVoice"],
            ["text", "GuildText"],
            ["voice", "GuildVoice"],
          ],
        },
      },
      inline: false,
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["guild"],
          message: "You must specify what server to create a channel in",
        },
        {
          type: "notEmpty",
          blockTypes: ["name"],
          message: "You must specify the name of the channel",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => /^[a-zA-Z0-9 _-]*$/.test(val),
          message: "Invalid channel name",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 100,
          message: "The name cannot be greater than 100 characters",
        },
      ],
    },
    inputs: [
      input.slot("guild", "Server", "server"),
      input.text("name", "Name", { default: "new-channel", maxLength: 100 }),
      input.dropdown(
        "type",
        "Type",
        [
          ["Text", "GuildText"],
          ["Voice", "GuildVoice"],
          ["Category", "GuildCategory"],
          ["Announcement", "GuildAnnouncement"],
          ["Stage", "GuildStageVoice"],
          ["Forum", "GuildForum"],
          ["Media", "GuildMedia"],
        ],
        { default: "GuildText" },
      ),
      input.slot("parent", "In category (optional)", "channel", { optional: true }),
    ],
    branches: [
      {
        key: "then",
        label: "After it's made",
        optional: true,
        provides: [
          {
            key: "channel",
            label: "New channel",
            type: "channel",
            code: "createdChannel",
            block: {
              type: "channel_createdChannel",
              text: "created channel",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["channel_create", "channel_clone"],
                  message: "This block must be under a 'create channel' or 'clone channel' block",
                },
              ],
              also: ["channel_clone"],
            },
          },
        ],
      },
    ],
    code: (ctx) => `await ${ctx.input("guild")}.channels.create({
  name: ${ctx.input("name")},
  parent: ${ctx.input("parent")},
  type: Discord.ChannelType.${ctx.raw("type")}
})${ctx.hasBranch("then") ? `.then(async (createdChannel) => {\n${ctx.branch("then")}})` : ""};\n`,
  }),
  action({
    id: "channel_wait_for_messages",
    label: "Wait for messages in a channel",
    description:
      "Waits for people to send messages in a channel, then runs different steps depending on whether anyone did.",
    category: "channels",
    group: "Messages",
    icon: "fa-solid fa-hourglass-half",
    keywords: ["await messages", "collector", "wait for response", "ask"],
    block: {
      type: "channel_waitForResponse",
      text: [
        "wait for responses",
        "in channel: {channel}",
        "accept messages if: {filter}",
        "time (seconds): {time}",
        "max messages: {max}",
        "when finished collecting: {then}",
        "if no responses received: {noResponses}",
      ],
      parts: { then: { check: "default" }, noResponses: { check: "default" } },
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to wait for responses in",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.boolean("filter", "Only count messages where", {
        default: true,
        help: "Leave it checked to count every message.",
        provides: [
          {
            key: "message",
            label: "Message being checked",
            type: "message",
            code: "msg",
            block: {
              type: "channel_awaitResponses_filterMsg",
              text: "message being checked",
              restrictions: [
                {
                  type: "surroundParent",
                  blockTypes: ["channel_waitForResponses"],
                  message:
                    "This block must be under a 'wait for responses' block and inside the 'accept messages' input",
                },
              ],
            },
          },
        ],
      }),
      input.number("time", "Wait for up to (seconds)", { default: 60, min: 1 }),
      input.number("max", "Stop after this many messages", { default: 1, min: 1 }),
    ],
    branches: [
      {
        key: "then",
        label: "If messages came in",
        provides: [
          {
            key: "responses",
            label: "Messages that came in",
            type: "Array",
            code: "collected.toJSON()",
            block: {
              type: "channel_responses",
              text: "responses",
              restrictions: [
                {
                  type: "surroundParent",
                  blockTypes: ["channel_waitForResponses"],
                  message: "This block must be under a 'wait for responses' block",
                },
              ],
            },
          },
          {
            key: "first",
            label: "First message that came in",
            type: "message",
            code: "collected.first()",
          },
        ],
      },
      { key: "noResponses", label: "If nobody answered in time" },
    ],
    code: (ctx) => `await ${ctx.input("channel")}.awaitMessages({
  filter: async (msg) => ${ctx.input("filter")},
  time: ${ctx.input("time")} * 1000,
  max: ${ctx.input("max")}
}).then(async (collected) => {
  if (collected.size === 0) {
${ctx.branch("noResponses")}  } else {
${ctx.branch("then")}  }
});\n`,
  }),
  action({
    id: "channel_move_to_category",
    label: "Move a channel to a category",
    description: "Puts a channel in a category.",
    category: "channels",
    group: "Changing",
    icon: "fa-solid fa-folder-tree",
    keywords: ["category", "parent", "move"],
    block: {
      type: "channel_setParent",
      text: [
        "move the channel: {channel}",
        "to category: {category}",
        "sync permissions? {syncPerms}",
        "reason: {reason}",
      ],
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to move",
        },
        {
          type: "notEmpty",
          blockTypes: ["category"],
          message: "You must specify the category to move the channel to",
        },
        {
          type: "validator",
          blockTypes: ["reason"],
          check: (val) => val.length <= 512,
          message: "Reason cannot be greater than 512 characters",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.slot("category", "Category", "channel"),
      input.boolean("syncPerms", "Use the category's permissions", { default: true }),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.setParent(${ctx.input("category")}, { lockPermissions: ${ctx.input("syncPerms")}, reason: ${ctx.has("reason") ? ctx.input("reason") : "undefined"} });\n`,
  }),
  action({
    id: "channel_sync_permissions",
    label: "Sync a channel with its category",
    description: "Gives a channel the same permissions as its category.",
    category: "channels",
    group: "Permissions",
    icon: "fa-solid fa-rotate",
    keywords: ["sync", "lock permissions"],
    block: {
      type: "channel_syncPerms",
      text: ["sync permissions of channel: {channel}", "to its category"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["channel"], message: "You must specify the channel" },
      ],
    },
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `await ${ctx.input("channel")}.lockPermissions();\n`,
  }),
  action({
    id: "channel_set_position",
    label: "Move a channel up or down",
    description: "Changes where a channel sits in the channel list.",
    category: "channels",
    group: "Changing",
    icon: "fa-solid fa-arrows-up-down",
    keywords: ["position", "order", "move"],
    block: {
      type: "channel_setPosition",
      text: ["move the channel: {channel}", "to position #: {position}", "reason: {reason}"],
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to move",
        },
        {
          type: "notEmpty",
          blockTypes: ["position"],
          message: "You must specify the position to move the channel to",
        },
        {
          type: "validator",
          blockTypes: ["reason"],
          check: (val) => val.length <= 512,
          message: "Reason cannot be greater than 512 characters",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.number("position", "Position", { default: 0, min: 0 }),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.setPosition(${ctx.input("position")}, { reason: ${ctx.has("reason") ? ctx.input("reason") : "undefined"} });\n`,
  }),
  action({
    id: "channel_set_age_restricted",
    label: "Make a channel age-restricted",
    description: "Turns a channel's age restriction (NSFW) on or off.",
    category: "channels",
    group: "Changing",
    icon: "fa-solid fa-triangle-exclamation",
    keywords: ["nsfw", "age restricted", "18+"],
    block: { type: "channel_setnsfw", text: ["set NSFW to: {set}", "on channel: {channel}"] },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.boolean("set", "Age-restricted", { default: true }),
    ],
    code: (ctx) => `await ${ctx.input("channel")}.setNSFW(${ctx.input("set")});\n`,
  }),
  action({
    id: "channel_set_permission",
    label: "Set a permission in a channel",
    description: "Allows or denies a permission in a channel for a role, a member, or everyone.",
    category: "channels",
    group: "Permissions",
    icon: "fa-solid fa-lock",
    keywords: ["permission", "overwrite", "lock", "allow", "deny", "hide channel"],
    block: {
      type: "channel_set_permission_v2",
      text: [
        "set {permission}",
        "to {action}",
        "on channel: {channel}",
        "for role/everyone/member: {role}",
      ],
      parts: {
        permission: {
          part: "value",
          check: "permissionChannel",
          map: { UseSlashCommands: "UseApplicationCommands" },
        },
        action: {
          options: [
            ["Allow", "allow"],
            ["Deny", "deny"],
            ["Inherit", "inherit"],
          ],
        },
        role: { check: ["role", "everyone", "member"] },
        target: {
          part: "fixed",
          value: (ctx) =>
            ctx.block.getInputTargetBlock("role")?.type === "misc_everyone" ? "everyone" : "pick",
        },
      },
      inline: false,
      tooltip:
        "Sets a specific permission to Allow, Deny, or Inherit (removes the override) for a role, @everyone or a member on a channel.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["permission"],
          message: "You must specify the permission to edit",
        },
        { type: "notEmpty", blockTypes: ["channel"], message: "You must specify the channel" },
        {
          type: "notEmpty",
          blockTypes: ["role"],
          message: "You must specify the role, everyone or the member",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.dropdown(
        "target",
        "For",
        [
          ["Everyone (@everyone)", "everyone"],
          ["A role or member", "pick"],
        ],
        { default: "pick" },
      ),
      input.slot("role", "Role or member", ["role", "member", "user"], {
        showIf: { target: "pick" },
      }),
      input.dropdown(
        "permission",
        "Permission",
        [
          ["View Channel", "ViewChannel"],
          ["Send Messages", "SendMessages"],
          ["Send Text-to-Speech Messages", "SendTTSMessages"],
          ["Manage Messages", "ManageMessages"],
          ["Embed Links", "EmbedLinks"],
          ["Attach Files", "AttachFiles"],
          ["Read Message History", "ReadMessageHistory"],
          ["Mention @everyone", "MentionEveryone"],
          ["Use External Emojis", "UseExternalEmojis"],
          ["Add Reactions", "AddReactions"],
          ["Manage Threads", "ManageThreads"],
          ["Create Public Threads", "CreatePublicThreads"],
          ["Create Private Threads", "CreatePrivateThreads"],
          ["Send Messages in Threads", "SendMessagesInThreads"],
          ["Use Application Commands", "UseApplicationCommands"],
          ["Use External Stickers", "UseExternalStickers"],
          ["Manage Channel", "ManageChannels"],
          ["Manage Permissions", "ManageRoles"],
          ["Manage Webhooks", "ManageWebhooks"],
          ["Create Invite", "CreateInstantInvite"],
          ["Connect (voice)", "Connect"],
          ["Speak (voice)", "Speak"],
          ["Send Polls", "SendPolls"],
        ],
        { default: "SendMessages" },
      ),
      input.dropdown(
        "action",
        "Set it to",
        [
          ["Allow", "allow"],
          ["Deny", "deny"],
          ["Default (use the server's setting)", "inherit"],
        ],
        { default: "deny" },
      ),
    ],
    code: (ctx) => {
      const channel = `_channel${ctx.uid}`;
      const value = { allow: "true", deny: "false" }[ctx.raw("action")] ?? "null";
      return `{\nconst ${channel} = ${ctx.input("channel")};\nawait ${channel}.permissionOverwrites.edit(${permissionTarget(ctx, channel)}, { ${ctx.raw("permission")}: ${value} });\n}\n`;
    },
  }),
  action({
    id: "channel_clear_permissions",
    label: "Remove a channel's permission changes",
    description: "Removes every permission change a channel has for a role, a member, or everyone.",
    category: "channels",
    group: "Permissions",
    icon: "fa-solid fa-lock-open",
    keywords: ["permission", "overwrite", "reset"],
    block: {
      type: "channel_delete_permission",
      text: [
        "delete all permissions of {channel}",
        "role/everyone/member: {role}",
        "reason: {reason}",
      ],
      parts: {
        role: { check: ["role", "everyone", "member"] },
        target: {
          part: "fixed",
          value: (ctx) =>
            ctx.block.getInputTargetBlock("role")?.type === "misc_everyone" ? "everyone" : "pick",
        },
      },
      inline: false,
      tooltip:
        "Completely removes all permission overrides for a role, @everyone, or member from a channel. This resets them back to inheriting from the server/category.",
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.dropdown(
        "target",
        "For",
        [
          ["Everyone (@everyone)", "everyone"],
          ["A role or member", "pick"],
        ],
        { default: "pick" },
      ),
      input.slot("role", "Role or member", ["role", "member", "user"], {
        showIf: { target: "pick" },
      }),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) => {
      const channel = `_channel${ctx.uid}`;
      return `{\nconst ${channel} = ${ctx.input("channel")};\nawait ${channel}.permissionOverwrites.delete(${permissionTarget(ctx, channel)}, ${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n}\n`;
    },
  }),
  action({
    id: "channel_set_slowmode",
    label: "Set a channel's slowmode",
    description: "Makes people wait between messages in a channel. 0 turns it off.",
    category: "channels",
    group: "Changing",
    icon: "fa-solid fa-gauge-simple",
    keywords: ["slowmode", "rate limit", "cooldown"],
    block: {
      type: "channel_setslowmode",
      text: ["set slowmode of channel: {channel}", "to (seconds): {time}", "reason: {reason}"],
      restrictions: [
        {
          type: "validator",
          blockTypes: ["time"],
          check: (val) => 0 <= parseInt(val) && parseInt(val) <= 21600,
          message: "Slowmode must be between 0 and 21,600 seconds",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.number("time", "Seconds between messages", { default: 5, min: 0, max: 21600 }),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.setRateLimitPerUser(${ctx.input("time")}, ${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n`,
  }),
  action({
    id: "channel_set_topic",
    label: "Set a channel's topic",
    description: "Changes the topic shown at the top of a channel.",
    category: "channels",
    group: "Changing",
    icon: "fa-solid fa-heading",
    keywords: ["topic", "description"],
    block: {
      type: "channel_settopic",
      text: ["set topic of channel: {channel}", "to: {topic}"],
      restrictions: [
        {
          type: "validator",
          blockTypes: ["topic"],
          check: (val) => val.length <= 1024,
          message: "Topic cannot be greater than 1024 characters",
        },
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to set the topic of",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.text("topic", "Topic", { default: "", maxLength: 1024 }),
    ],
    code: (ctx) => `await ${ctx.input("channel")}.setTopic(${ctx.input("topic")});\n`,
  }),
  action({
    id: "channel_typing",
    label: "Show the bot typing in a channel",
    description: 'Shows "Bot is typing..." in a channel, then waits.',
    category: "channels",
    group: "Messages",
    icon: "fa-solid fa-keyboard",
    keywords: ["typing", "type", "wait"],
    block: {
      type: "channel_starttyping",
      text: ["start typing on channel: {channel}", "and wait (seconds): {wait}"],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.number("wait", "Then wait (seconds)", { default: 2, min: 0 }),
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.sendTyping();\nawait wait(${ctx.input("wait")} * 1000);\n`,
  }),
  action({
    id: "channel_purge",
    label: "Delete recent messages in a channel",
    description:
      "Deletes a number of the newest messages in a channel at once (up to 100, none older than 2 weeks).",
    category: "channels",
    group: "Messages",
    icon: "fa-solid fa-broom",
    keywords: ["purge", "clear", "bulk delete", "clean"],
    block: {
      type: "channel_bulkdelete",
      text: ["delete the last {amount}", "messages on channel: {channel}"],
      inline: true,
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.number("amount", "How many", { default: 10, min: 1, max: 100 }),
    ],
    code: (ctx) => `await ${ctx.input("channel")}.bulkDelete(${ctx.input("amount")}, true);\n`,
  }),
  action({
    id: "channel_set_thread_archive",
    label: "Set when a channel's threads hide",
    description:
      "Sets how long new threads in a channel stay open without activity before they're archived.",
    category: "channels",
    group: "Changing",
    icon: "fa-solid fa-box-archive",
    keywords: ["auto archive", "threads", "inactive"],
    block: {
      type: "channel_setautoarchive",
      text: [
        "set thread auto archive duration to: {duration}",
        "for channel: {channel}",
        "reason: {reason}",
      ],
      parts: {
        duration: {
          options: [
            ["One hour", "60"],
            ["One day", "1440"],
            ["One week", "10080"],
            ["Three days", "4320"],
          ],
        },
      },
      restrictions: [
        {
          type: "validator",
          blockTypes: ["reason"],
          check: (val) => val.length <= 512,
          message: "Reason cannot be greater than 512 characters",
        },
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to set the auto archive duration of",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.dropdown(
        "duration",
        "After",
        [
          ["1 hour", "60"],
          ["1 day", "1440"],
          ["3 days", "4320"],
          ["1 week", "10080"],
        ],
        { default: "1440" },
      ),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.setDefaultAutoArchiveDuration(${Number(ctx.raw("duration")) || 1440}, ${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n`,
  }),
  action({
    id: "channel_clone",
    label: "Copy a channel",
    description: "Makes a copy of a channel with the same settings and permissions.",
    category: "channels",
    group: "Creating and deleting",
    icon: "fa-solid fa-clone",
    keywords: ["clone", "duplicate", "copy"],
    block: {
      type: "channel_clone",
      text: ["clone the channel: {channel}", "new name: {name}", "then: {then}"],
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to clone",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => /^[a-zA-Z0-9 _-]*$/.test(val),
          message: "Invalid channel name",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 100,
          message: "The name cannot be greater than 100 characters",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.text("name", "New name (optional)", {
        default: "",
        help: "Leave empty to keep the same name.",
      }),
    ],
    branches: [
      {
        key: "then",
        label: "After it's made",
        optional: true,
        provides: [
          { key: "channel", label: "New channel", type: "channel", code: "createdChannel" },
        ],
      },
    ],
    code: (ctx) => {
      const channel = ctx.input("channel");
      const name = ctx.has("name") ? ctx.input("name") : `${channel}.name`;
      return `await ${channel}.clone({ name: ${name} })${ctx.hasBranch("then") ? `.then(async (createdChannel) => {\n${ctx.branch("then")}})` : ""};\n`;
    },
  }),
  action({
    id: "channel_delete",
    label: "Delete a channel",
    description: "Deletes a channel for good.",
    category: "channels",
    group: "Creating and deleting",
    icon: "fa-solid fa-trash-can",
    keywords: ["delete channel", "remove channel"],
    block: {
      type: "channel_del",
      text: ["delete the channel: {channel}", "reason: {reason}"],
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to delete",
        },
        {
          type: "validator",
          blockTypes: ["reason"],
          check: (val) => val.length <= 512,
          message: "Reason cannot be greater than 512 characters",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.delete(${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n`,
  }),
  action({
    id: "channel_rename",
    label: "Rename a channel",
    description: "Changes a channel's name.",
    category: "channels",
    group: "Changing",
    icon: "fa-solid fa-i-cursor",
    keywords: ["rename", "name"],
    block: {
      type: "channel_setname",
      text: ["rename channel: {channel}", "new name: {name}"],
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to rename",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => /^[a-zA-Z0-9 _-]*$/.test(val),
          message: "Invalid channel name",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 100,
          message: "The name cannot be greater than 100 characters",
        },
      ],
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.text("name", "New name", { default: "", maxLength: 100 }),
    ],
    code: (ctx) => `await ${ctx.input("channel")}.setName(${ctx.input("name")});\n`,
  }),
  action({
    id: "channel_recent_messages",
    label: "Get a channel's recent messages",
    description: "Loads a channel's most recent messages, for the steps inside to use.",
    category: "channels",
    group: "Messages",
    icon: "fa-solid fa-clock-rotate-left",
    keywords: ["fetch messages", "history", "last messages"],
    block: {
      type: "channel_fetchLastMessages",
      text: ["get last {amount}", "messages of channel: {channel}", "then: {code}"],
      parts: { code: { check: "default" } },
      inline: true,
    },
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.number("amount", "How many (up to 100)", { default: 10, min: 1, max: 100 }),
    ],
    branches: [
      {
        key: "code",
        label: "Then",
        provides: [
          {
            key: "messages",
            label: "Recent messages (list)",
            type: "Array",
            code: "[...fetchedMessages.values()]",
          },
          {
            key: "newest",
            label: "Newest message",
            type: "message",
            code: "fetchedMessages.first()",
          },
        ],
        contexts: ["fetchedMessages"],
      },
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.messages.fetch({ limit: ${ctx.input("amount")} }).then(async (fetchedMessages) => {\n${ctx.branch("code")}});\n`,
  }),
  action({
    id: "channel_send_message",
    label: "Send a message to a channel",
    description: "Sends a message you build to a channel.",
    category: "channels",
    group: "Messages",
    icon: "fa-solid fa-paper-plane",
    keywords: ["send", "message", "say", "post", "announce"],
    block: {
      type: "cv2_sendMessage",
      text: ["send message in channel: {channel}", "components: {components}"],
      parts: {
        components: { part: "statement", check: "rootComponents" },
        files: { part: "statement", check: "files" },
      },
      tooltip: "Sends a message using Discord's Components V2 system.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to send the message in",
        },
        {
          type: "notEmpty",
          blockTypes: ["components"],
          message: "You must add at least one component to the message",
        },
      ],
      mutator: {
        options: "cv2_sendMessage_mutator",
        fields: [
          {
            name: "files",
            default: true,
            label: "include files",
            inputType: "statement",
            inputLabel: "files:",
            valueCheck: "files",
          },
          {
            name: "then",
            label: "include 'then'",
            inputType: "statement",
            inputLabel: "then:",
            valueCheck: "default",
          },
        ],
      },
    },
    special: "message",
    inputs: [input.slot("channel", "Channel", "channel"), input.message("content", "Message")],
    branches: [
      {
        key: "then",
        label: "After it's sent",
        optional: true,
        provides: [
          {
            key: "sent",
            label: "Sent message",
            type: "message",
            code: "messageSent",
            block: {
              type: "misc_messageSent",
              text: "message sent by the bot",
              colour: "4192E9",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: [
                    "msg_reply",
                    "msg_reply_rows",
                    "msg_reply_mutator",
                    "channel_send",
                    "channel_send_rows",
                    "channel_send_mutator",
                    "cv2_sendMessage",
                    "cv2_replyMsg",
                    "cv2_sendDm",
                    "cv2_replyToMsg",
                  ],
                  message:
                    "This block must be be in a 'reply to message' or 'send in channel' block",
                },
              ],
              also: ["message_reply", "member_send_dm", "message_reply_to"],
            },
          },
        ],
      },
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.send(${ctx.message("content")})${ctx.hasBranch("then") ? `.then(async (messageSent) => {\n${ctx.branch("then")}})` : ""};\n`,
  }),
];

const values = [
  value({
    id: "channel_voice_member_count",
    label: "Number of members in a voice channel",
    description:
      "How many people are connected to a voice or stage channel right now. 0 for any other kind of channel.",
    category: "voice",
    icon: "fa-solid fa-users-line",
    keywords: ["voice count", "how many in vc", "connected", "members in voice"],
    block: {
      type: "channel_voiceMemberCount",
      text: "number of members in voice channel: {channel}",
      tooltip:
        "Returns how many members are currently connected to a voice or stage channel. Returns 0 for any other kind of channel.",
    },
    output: "Number",
    inputs: [input.slot("channel", "Voice channel", "channel")],
    code: (ctx) =>
      `(${ctx.input("channel")}?.isVoiceBased?.() ? ${ctx.input("channel")}.members.size : 0)`,
  }),
  value({
    id: "channel_find",
    label: "Channel by name or ID",
    description: "Finds a channel in a server by its name or its ID.",
    category: "channels",
    group: "Finding",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["get channel", "find channel", "channel id"],
    block: {
      type: "channel_getone",
      text: ["get the channel with the {type} equal to {value}", "on the server {server}"],
      parts: {
        type: {
          options: [
            ["name", "name"],
            ["id", "id"],
          ],
        },
      },
    },
    output: "channel",
    inputs: [
      input.dropdown(
        "type",
        "Find by",
        [
          ["Name", "name"],
          ["ID", "id"],
        ],
        { default: "name" },
      ),
      input.text("value", "Name or ID", { default: "" }),
      input.slot("server", "In server", "server"),
    ],
    code: (ctx) =>
      ctx.raw("type") === "id"
        ? `${ctx.input("server")}.channels.cache.get(${ctx.input("value")})`
        : `${ctx.input("server")}.channels.cache.find((c) => c.name == ${ctx.input("value")})`,
  }),
  value({
    id: "channel_slowmode",
    label: "Slowmode of a channel",
    description: "How many seconds people have to wait between messages in a channel.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-gauge-simple",
    keywords: ["slowmode"],
    block: { type: "channel_getslowmode", text: "slowmode (seconds) of channel: {channel}" },
    output: "Number",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.rateLimitPerUser`,
  }),
  value({
    id: "channel_is_age_restricted",
    label: "Is the channel age-restricted?",
    description: "True if a channel is marked age-restricted (NSFW).",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-triangle-exclamation",
    keywords: ["nsfw"],
    block: { type: "channel_getnsfw", text: ["channel {channel}", "is NSFW?"] },
    output: "Boolean",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.nsfw`,
  }),
  value({
    id: "channel_category",
    label: "Category of a channel",
    description: "The category a channel is in.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-folder",
    keywords: ["parent", "category"],
    block: {
      type: "channel_getParent",
      text: "category of channel: {channel}",
      restrictions: [
        { type: "notEmpty", blockTypes: ["channel"], message: "You must specify the channel" },
      ],
    },
    output: "channel",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.parent`,
  }),
  value({
    id: "channel_server",
    label: "Server of a channel",
    description: "The server a channel belongs to.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-server",
    keywords: ["guild", "server"],
    block: { type: "channel_getServer", text: "server of channel: {channel}" },
    output: "server",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.guild`,
  }),
  value({
    id: "channel_topic",
    label: "Topic of a channel",
    description: "The topic shown at the top of a channel.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-heading",
    keywords: ["topic"],
    block: { type: "channel_gettopic", text: "topic of channel: {channel}" },
    output: "String",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.topic`,
  }),
  value({
    id: "channel_is_type",
    label: "Channel is this kind?",
    description: "True if a channel is a text channel, voice channel, thread, and so on.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-layer-group",
    keywords: ["type", "is voice", "is text"],
    block: {
      type: "channel_gettype",
      text: ["channel {channel}", "is {type} ?"],
      parts: {
        type: {
          options: [
            ["Text channel", "0"],
            ["Voice channel", "2"],
            ["Category", "4"],
            ["Public thread", "11"],
            ["Private thread", "12"],
            ["Announcement channel", "5"],
            ["Announcement thread", "10"],
            ["Forum channel", "15"],
            ["Stage channel", "13"],
            ["Media channel", "16"],
            ["DM", "1"],
          ],
        },
      },
    },
    output: "Boolean",
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.dropdown(
        "type",
        "Kind",
        [
          ["Text channel", "0"],
          ["Voice channel", "2"],
          ["Category", "4"],
          ["Public thread", "11"],
          ["Private thread", "12"],
          ["Announcement channel", "5"],
          ["Announcement thread", "10"],
          ["Forum channel", "15"],
          ["Stage channel", "13"],
          ["Media channel", "16"],
          ["Direct message", "1"],
        ],
        { default: "0" },
      ),
    ],
    code: (ctx) => `${ctx.input("channel")}.type === ${Number(ctx.raw("type")) || 0}`,
  }),
  value({
    id: "channel_can_delete",
    label: "Can the bot delete the channel?",
    description: "True if the bot has permission to delete a channel.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-trash-can",
    keywords: ["deletable"],
    block: { type: "channel_deletable", text: ["channel {channel}", "is deletable by the bot?"] },
    output: "Boolean",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.deletable`,
  }),
  value({
    id: "channel_can_manage",
    label: "Can the bot manage the channel?",
    description: "True if the bot has permission to change a channel's settings.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-sliders",
    keywords: ["manageable"],
    block: { type: "channel_manageable", text: ["channel {channel}", "is manageable by the bot?"] },
    output: "Boolean",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.manageable`,
  }),
  value({
    id: "channel_name",
    label: "Name of a channel",
    description: "A channel's name.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-i-cursor",
    keywords: ["name"],
    block: { type: "channel_name", text: "name of channel: {channel}" },
    output: "String",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.name`,
  }),
  value({
    id: "channel_id",
    label: "ID of a channel",
    description: "A channel's ID.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id"],
    block: { type: "channel_id", text: "ID of channel: {channel}" },
    output: "String",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.id`,
  }),
  value({
    id: "channel_link",
    label: "Link to a channel",
    description: "A link that opens the channel in Discord.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-link",
    keywords: ["url", "link"],
    block: { type: "channel_url", text: "URL of channel: {channel}" },
    output: "String",
    inputs: [input.slot("channel", "Channel", "channel")],
    code: (ctx) => `${ctx.input("channel")}.url`,
  }),
  value({
    id: "channel_created",
    label: "When a channel was made",
    description: "The date a channel was created, or its timestamp in milliseconds.",
    category: "channels",
    group: "About a channel",
    icon: "fa-solid fa-calendar-plus",
    keywords: ["created", "creation date"],
    block: {
      type: "channel_created",
      text: "creation {type} of channel: {channel}",
      parts: {
        type: {
          options: [
            ["date", "createdAt"],
            ["timestamp", "createdTimestamp"],
          ],
        },
      },
      inline: true,
      output: "String",
    },
    output: ["date", "Number"],
    inputs: [
      input.dropdown(
        "type",
        "As a",
        [
          ["Date", "createdAt"],
          ["Timestamp", "createdTimestamp"],
        ],
        { default: "createdAt" },
      ),
      input.slot("channel", "Channel", "channel"),
    ],
    code: (ctx) =>
      `${ctx.input("channel")}.${ctx.raw("type") === "createdTimestamp" ? "createdTimestamp" : "createdAt"}`,
  }),
  value({
    id: "channel_recent_message_number",
    label: "Number of a recent message",
    description: "One of the messages loaded by Get recent messages. Number 1 is the newest.",
    category: "channels",
    group: "Messages",
    icon: "fa-solid fa-list-ol",
    keywords: ["fetched message", "message #"],
    block: {
      type: "channel_fetchedLastMessages",
      text: "message # {number}",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["channel_fetchLastMessages"],
          message: "This block must be under a 'get last messages of channel' block",
        },
      ],
    },
    requires: ["fetchedMessages"],
    output: "message",
    inputs: [input.number("number", "Number", { default: 1, min: 1 })],
    code: (ctx) => `fetchedMessages.at(${ctx.input("number")} - 1)`,
  }),
];

const components = [];

const blocks = [
  block({
    type: "misc_permissionChannel",
    element: "channel_set_permission",
    text: "permission {permission}",
    parts: {
      permission: {
        part: "dropdown",
        options: [
          ["ViewChannel", "ViewChannel"],
          ["SendMessages", "SendMessages"],
          ["SendTTSMessages", "SendTTSMessages"],
          ["ManageMessages", "ManageMessages"],
          ["EmbedLinks", "EmbedLinks"],
          ["AttachFiles", "AttachFiles"],
          ["ReadMessageHistory", "ReadMessageHistory"],
          ["MentionEveryone", "MentionEveryone"],
          ["UseExternalEmojis", "UseExternalEmojis"],
          ["AddReactions", "AddReactions"],
          ["ManageThreads", "ManageThreads"],
          ["CreatePublicThreads", "CreatePublicThreads"],
          ["CreatePrivateThreads", "CreatePrivateThreads"],
          ["SendMessagesInThreads", "SendMessagesInThreads"],
          ["UseSlashCommands", "UseSlashCommands"],
          ["UseExternalStickers", "UseExternalStickers"],
        ],
      },
    },
    colour: "4192E9",
    output: "permissionChannel",
    restrictions: [
      {
        type: "hasParent",
        blockTypes: ["channel_set_permission"],
        message: "This block must be be in a 'set permission ... to ... in channel' block",
      },
    ],
    code: (ctx) => `'${ctx.field("permission")}'`,
  }),
  block({
    type: "misc_everyone",
    element: "channel_set_permission",
    text: "@everyone",
    colour: "4192E9",
    output: "everyone",
    code: () => "everyone",
  }),
  block({
    type: "channel_send_mutator",
    pings: true,
    text: ["send a message", "in channel: {channel}", "content: {content}"],
    parts: {
      channel: { part: "value", check: "channel" },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
      files: { part: "statement", check: "files" },
      then: { part: "statement", check: "default" },
    },
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "notEmpty",
        blockTypes: ["channel"],
        message: "You must specify the channel to send the message in",
      },
      {
        type: "notEmpty",
        blockTypes: ["content", "embeds"],
        message: "You must specify the content or embeds to send",
      },
      {
        type: "validator",
        blockTypes: ["content"],
        check: (val) => val.length <= 2000,
        message: "The content cannot be greater than 2,000 characters",
      },
      {
        type: "validator",
        blockTypes: ["embeds"],
        check: (val, workspace) => {
          if (!val.length) return true;

          let embeds = val.split(",");
          let pass = true;

          embeds.forEach((embedName) => {
            if (
              !workspace
                .getAllBlocks(false)
                .find(
                  (b) => b.type === "embed_create" && b.getFieldValue("name") === embedName.trim(),
                )
            )
              pass = false;
          });

          return pass;
        },
        message: "No embed with that name exists",
      },
    ],
    mutator: {
      options: "channel_send_mutator_options",
      fields: [
        {
          name: "embeds",
          label: "include embeds",
          default: false,
          inputType: "value",
          inputLabel: "embed name(s):",
          valueCheck: "String",
        },
        {
          name: "rows",
          label: "include rows",
          default: false,
          inputType: "statement",
          inputLabel: "rows:",
          valueCheck: "rows",
        },
        {
          name: "files",
          label: "include files",
          default: false,
          inputType: "statement",
          inputLabel: "files:",
          valueCheck: "files",
        },
        {
          name: "then",
          label: "include 'then'",
          default: false,
          inputType: "statement",
          inputLabel: "then:",
          valueCheck: "default",
        },
      ],
    },
    code: (ctx) => {
      const channel = ctx.code("channel") || "null";
      const content = ctx.code("content") || "''";
      const embeds = ctx.code("embeds");
      const rows = ctx.branch("rows");
      const files = ctx.branch("files");
      const then = ctx.branch("then");

      const options = buildMessageOptions({ allowedMentions: ctx.allowedMentions(), content, embeds, rows, files });
      const thenCode = buildThenSuffix(then);

      return `await ${channel}.send({\n  ${options.join(",\n  ")}\n})${thenCode}`;
    },
  }),
  block({
    type: "channel_send",
    pings: true,
    text: [
      "send a message",
      "in channel: {channel}",
      "content: {content}",
      "embed name(s): {embeds}",
      "then: {then}",
    ],
    parts: {
      channel: { part: "value", check: "channel" },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      then: { part: "statement", check: null },
    },
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "notEmpty",
        blockTypes: ["channel"],
        message: "You must specify the channel to send the message in",
      },
      {
        type: "notEmpty",
        blockTypes: ["content", "embeds"],
        message: "You must specify the content or embeds to send",
      },
      {
        type: "validator",
        blockTypes: ["content"],
        check: (val) => val.length <= 2000,
        message: "The content cannot be greater than 2,000 characters",
      },
      {
        type: "validator",
        blockTypes: ["embeds"],
        check: (val, workspace) => {
          if (!val.length) return true;

          let embeds = val.split(",");
          let pass = true;

          embeds.forEach((embedName) => {
            if (
              !workspace
                .getAllBlocks(false)
                .find(
                  (b) => b.type === "embed_create" && b.getFieldValue("name") === embedName.trim(),
                )
            )
              pass = false;
          });

          return pass;
        },
        message: "No embed with that name exists",
      },
    ],
    code: (ctx) => {
      var value_channel = ctx.code("channel");
      var value_content = ctx.code("content");
      var value_embeds = ctx.code("embeds");
      var then = ctx.branch("then");

      const parts = buildMessageOptions({ allowedMentions: ctx.allowedMentions(),
        content: value_content,
        embeds: value_embeds,
      });

      return `await ${value_channel}.send({\n  ${parts.join(", ")}\n})${buildThenSuffix(then)}`;
    },
  }),
  block({
    type: "channel_send_rows",
    pings: true,
    text: [
      "send a message",
      "in channel: {channel}",
      "content: {content}",
      "embed name(s): {embeds}",
      "rows: {rows}",
      "then: {then}",
    ],
    parts: {
      channel: { part: "value", check: "channel" },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
      then: { part: "statement", check: null },
    },
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "notEmpty",
        blockTypes: ["channel"],
        message: "You must specify the channel to send the message in",
      },
      {
        type: "notEmpty",
        blockTypes: ["content", "embeds"],
        message: "You must specify the content or embeds to send",
      },
      {
        type: "validator",
        blockTypes: ["content"],
        check: (val) => val.length <= 2000,
        message: "The content cannot be greater than 2,000 characters",
      },
      {
        type: "validator",
        blockTypes: ["embeds"],
        check: (val, workspace) => {
          if (!val.length) return true;

          let embeds = val.split(",");
          let pass = true;

          embeds.forEach((embedName) => {
            if (
              !workspace
                .getAllBlocks(false)
                .find(
                  (b) => b.type === "embed_create" && b.getFieldValue("name") === embedName.trim(),
                )
            )
              pass = false;
          });

          return pass;
        },
        message: "No embed with that name exists",
      },
    ],
    code: (ctx) => {
      var value_channel = ctx.code("channel");
      var value_content = ctx.code("content");
      var value_embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");
      var then = ctx.branch("then");

      const parts = buildMessageOptions({ allowedMentions: ctx.allowedMentions(),
        content: value_content,
        embeds: value_embeds,
        rows,
      });

      return `await ${value_channel}.send({\n  ${parts.join(", ")}\n})${buildThenSuffix(then)}`;
    },
  }),
  block({
    type: "channel_set_permission",
    text: [
      "set {permission}",
      "to {action}",
      "on channel: {channel}",
      "for role/everyone/member: {role}",
    ],
    parts: {
      permission: { part: "value", check: "permissionChannel" },
      action: {
        part: "dropdown",
        options: [
          ["Allow", "allow"],
          ["Block", "block"],
        ],
      },
      channel: { part: "value", check: "channel" },
      role: { part: "value", check: ["role", "everyone", "member"] },
    },
    inline: false,
    tooltip: "Sets a permission for a role, everyone or a member on a channel.",
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "notEmpty",
        blockTypes: ["permission"],
        message: "You must specify the permission to edit",
      },
      { type: "notEmpty", blockTypes: ["channel"], message: "You must specify the channel" },
      {
        type: "notEmpty",
        blockTypes: ["role"],
        message: "You must specify the role, everyone or the member",
      },
    ],
    code: (ctx) => {
      const permission = ctx.code("permission");
      const action = ctx.field("action");
      const channel = ctx.code("channel");
      const role = ctx.code("role");
      const allow = action === "allow" ? "true" : "false";

      if (role === "(everyone)") {
        return `let permsChannel = ${channel};\npermsChannel.permissionOverwrites.edit(permsChannel.guild.roles.everyone, { ${permission}: ${allow} });\n`;
      } else {
        return `${channel}.permissionOverwrites.edit(${role}, { ${permission}: ${allow} });\n`;
      }
    },
  }),
];

export default {
  events,
  actions,
  values,
  components,
  contexts: [
    {
      key: "fetchedMessages",
      label: "a Get recent messages step",
      description: "Only works inside a Get recent messages step.",
      variable: "fetchedMessages",
    },
  ],

  blocks,
};
