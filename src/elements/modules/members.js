/* =====================================================================
   Builder catalog: members and users
   ---------------------------------------------------------------------
   People: finding them, moderating them (ban, kick, timeout), sending
   them DMs, and reading their details.

   A "user" is someone's Discord account; a "member" is that account in
   one server (with a nickname, roles and a join date). Values that read
   account details accept either, and read the account from a member.
   ===================================================================== */

import { buildMessageOptions } from "../../blocks/lib/generatorUtils.js";
import { group, input } from "../define.js";

const { action, value, block } = group({ colour: "#3c9e56" });

/* The account behind a user or a member. A member keeps it in .user;
   a user is its own account. */
const userOf = (code) => `(${code}?.user ?? ${code})`;

const events = [];

const actions = [
  action({
    id: "member_each",
    label: "Repeat with each member in a server",
    description: "Runs the steps inside once for every member of a server.",
    category: "members",
    group: "Finding",
    icon: "fa-solid fa-users",
    keywords: ["for each", "loop", "all members", "everyone"],
    block: {
      type: "member_foreach",
      text: ["for each member in server: {server}", "{code}"],
      parts: { code: { check: "default" } },
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to iterate member from.",
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
            key: "member",
            label: "Current member",
            type: "member",
            code: "member",
            block: {
              type: "member_member",
              text: "current member in loop",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["member_foreach"],
                  message: "This block must be under a 'For each member in server' block",
                },
              ],
            },
          },
        ],
      },
    ],
    code: (ctx) =>
      `await forEachCollection(${ctx.input("server")}, "members", async (member) => {\n${ctx.branch("code")}});\n`,
  }),
  action({
    id: "member_ban",
    label: "Ban a member",
    description: "Bans someone from the server so they can't come back until they're unbanned.",
    category: "members",
    group: "Moderation",
    icon: "fa-solid fa-gavel",
    keywords: ["ban", "moderation", "remove"],
    block: {
      type: "member_ban",
      text: ["ban member: {member}", "reason: {reason}"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
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
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("member")}.ban({ reason: ${ctx.has("reason") ? ctx.input("reason") : "undefined"} });\n`,
  }),
  action({
    id: "member_unban",
    label: "Unban a user from a server",
    description: "Lifts a ban, so the person can join the server again.",
    category: "members",
    group: "Moderation",
    icon: "fa-solid fa-unlock",
    keywords: ["unban", "pardon"],
    block: {
      type: "member_unban",
      text: ["unban user: {user}", "from server: {server}", "reason: {reason}"],
      parts: { user: { check: ["user", "String"] } },
      restrictions: [
        {
          type: "validator",
          blockTypes: ["reason"],
          check: (val) => val.length <= 512,
          message: "Reason cannot be greater than 512 characters",
        },
        { type: "notEmpty", blockTypes: ["user"], message: "You must specify the user to unban." },
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to unban the user from.",
        },
      ],
    },
    inputs: [
      input.text("user", "User ID", { default: "" }),
      input.slot("server", "Server", "server"),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("server")}.bans.remove(${ctx.input("user")}, ${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n`,
  }),
  action({
    id: "member_timeout",
    label: "Time out a member",
    description: "Stops a member from talking, reacting or joining voice for a while.",
    category: "members",
    group: "Moderation",
    icon: "fa-solid fa-clock",
    keywords: ["timeout", "mute", "silence"],
    block: {
      type: "member_timeout",
      text: ["timeout member: {member}", "seconds: {seconds}", "reason: {reason}"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
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
      input.number("seconds", "For (seconds)", { default: 60, min: 1, max: 2419200 }),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("member")}.timeout(${ctx.input("seconds")} * 1000, ${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n`,
  }),
  action({
    id: "member_kick",
    label: "Kick a member",
    description: "Removes someone from the server. They can join again with an invite.",
    category: "members",
    group: "Moderation",
    icon: "fa-solid fa-person-walking-arrow-right",
    keywords: ["kick", "remove", "moderation"],
    block: {
      type: "member_kick",
      text: ["kick member: {member}", "reason: {reason}"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
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
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("member")}.kick(${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n`,
  }),
  action({
    id: "member_send_dm",
    label: "Send a DM to someone",
    description: "Sends a private message you build to someone.",
    category: "members",
    group: "Messages",
    icon: "fa-solid fa-envelope",
    keywords: ["dm", "direct message", "private message", "pm"],
    block: {
      type: "cv2_sendDm",
      text: ["send a DM to user/member: {member}", "components: {components}"],
      parts: {
        member: { check: ["member", "user"] },
        components: { part: "statement", check: "rootComponents" },
        files: { part: "statement", check: "files" },
      },
      tooltip: "Sends a DM using Discord's Components V2 system.",
      mutator: {
        options: "cv2_sendDm_mutator",
        fields: [
          {
            name: "files",
            label: "include files",
            inputType: "statement",
            inputLabel: "files:",
            valueCheck: "files",
          },
          {
            name: "then",
            label: "include then",
            inputType: "statement",
            inputLabel: "then:",
            valueCheck: "default",
          },
        ],
      },
    },
    inputs: [input.slot("member", "To", ["user", "member"]), input.message("content", "Message")],
    branches: [
      {
        key: "then",
        label: "After it's sent",
        optional: true,
        provides: [{ key: "sent", label: "Sent message", type: "message", code: "messageSent" }],
      },
    ],
    special: "message",
    code: (ctx) =>
      `await ${ctx.input("member")}.send(${ctx.message("content")})${ctx.hasBranch("then") ? `.then(async (messageSent) => {\n${ctx.branch("then")}})` : ""};\n`,
  }),
  action({
    id: "member_set_nickname",
    label: "Change a member's nickname",
    description:
      "Sets the name a member shows in this server. Leave it empty to remove their nickname.",
    category: "members",
    group: "Changing",
    icon: "fa-solid fa-signature",
    keywords: ["nickname", "rename", "nick"],
    block: {
      type: "member_setnick",
      text: ["change nickname of member: {member}", "to: {nickname}", "reason: {reason}"],
      inline: false,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
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
      input.text("nickname", "New nickname", { default: "", maxLength: 32 }),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("member")}.setNickname(${ctx.has("nickname") ? ctx.input("nickname") : "null"}, ${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n`,
  }),
  action({
    id: "member_end_timeout",
    label: "End a member's timeout",
    description: "Lets a timed-out member talk again right away.",
    category: "members",
    group: "Moderation",
    icon: "fa-solid fa-clock-rotate-left",
    keywords: ["untimeout", "unmute"],
    block: {
      type: "member_removetimeout",
      text: ["remove timeout from member: {member}", "reason: {reason}"],
      inline: false,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
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
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("member")}.timeout(null, ${ctx.has("reason") ? ctx.input("reason") : "undefined"});\n`,
  }),
];

const values = [
  value({
    id: "member_find",
    label: "Member by username or ID",
    description: "Finds a member of a server by their username or ID.",
    category: "members",
    group: "Finding",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["get member", "find member", "member id"],
    block: {
      type: "member_getone",
      text: ["get the member with the {type} equal to {value}", "on the server {server}"],
      parts: {
        type: {
          options: [
            ["username", "username"],
            ["id", "id"],
          ],
        },
      },
    },
    output: "member",
    inputs: [
      input.dropdown(
        "type",
        "Find by",
        [
          ["Username", "username"],
          ["ID", "id"],
        ],
        { default: "username" },
      ),
      input.text("value", "Username or ID", { default: "" }),
      input.slot("server", "In server", "server"),
    ],
    code: (ctx) =>
      ctx.raw("type") === "id"
        ? `${ctx.input("server")}.members.cache.get(${ctx.input("value")})`
        : `${ctx.input("server")}.members.cache.find((m) => m.user.username == ${ctx.input("value")})`,
  }),
  value({
    id: "user_find",
    label: "User by username or ID",
    description: "Finds a Discord user the bot knows by their username or ID.",
    category: "members",
    group: "Finding",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["get user", "find user", "user id"],
    block: {
      type: "member_getuser",
      text: "get the user with the {type} equal to {value}",
      parts: {
        type: {
          options: [
            ["username", "username"],
            ["id", "id"],
          ],
        },
      },
    },
    output: "user",
    inputs: [
      input.dropdown(
        "type",
        "Find by",
        [
          ["Username", "username"],
          ["ID", "id"],
        ],
        { default: "username" },
      ),
      input.text("value", "Username or ID", { default: "" }),
    ],
    code: (ctx) =>
      ctx.raw("type") === "id"
        ? `client.users.cache.get(${ctx.input("value")})`
        : `client.users.cache.find((u) => u.username == ${ctx.input("value")})`,
  }),
  value({
    id: "member_status",
    label: "Member's online status",
    description: "Whether a member is online, idle, do not disturb or offline.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-circle",
    keywords: ["status", "online", "presence"],
    block: {
      type: "member_status",
      text: "status of member: {member}",
      tooltip: 'Returns "idle", "online", "dnd", or "offline" as a text',
    },
    output: "String",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) => `(${ctx.input("member")}?.presence?.status || "offline")`,
  }),
  value({
    id: "user_badges",
    label: "User's badges (list)",
    description: "The names of the badges on someone's profile.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-certificate",
    keywords: ["flags", "badges"],
    block: {
      type: "member_userFlags",
      text: "flags of user: {member}",
      parts: { member: { check: "user" } },
      tooltip:
        "Returns the flags of a user as a list/array (this includes the user's badges as well as other info",
      helpUrl: "https://discord-api-types.dev/api/discord-api-types-v10/enum/UserFlags",
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "Array",
    inputs: [input.slot("member", "User or member", ["user", "member"])],
    code: (ctx) => `${userOf(ctx.input("member"))}.flags.toArray()`,
  }),
  value({
    id: "user_has_badge",
    label: "User has a badge?",
    description: "True if someone's profile shows a badge, like Active Developer.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-award",
    keywords: ["badge", "flag"],
    block: {
      type: "member_hasBadge",
      text: ["does user {member}", "have the {badge} badge?"],
      parts: { member: { check: "user" } },
      inline: true,
      tooltip: "Checks if a user has one of Discord's profile badges.",
      helpUrl: "https://discord-api-types.dev/api/discord-api-types-v10/enum/UserFlags",
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "Boolean",
    inputs: [
      input.slot("member", "User or member", ["user", "member"]),
      input.dropdown(
        "badge",
        "Badge",
        [
          ["Discord Staff", "Staff"],
          ["Partnered Server Owner", "Partner"],
          ["HypeSquad Events", "Hypesquad"],
          ["Bug Hunter Level 1", "BugHunterLevel1"],
          ["Bug Hunter Level 2", "BugHunterLevel2"],
          ["HypeSquad Bravery", "HypeSquadOnlineHouse1"],
          ["HypeSquad Brilliance", "HypeSquadOnlineHouse2"],
          ["HypeSquad Balance", "HypeSquadOnlineHouse3"],
          ["Early Supporter", "PremiumEarlySupporter"],
          ["Verified Bot Developer", "VerifiedDeveloper"],
          ["Moderator Programs Alumni", "CertifiedModerator"],
          ["Active Developer", "ActiveDeveloper"],
        ],
        { default: "ActiveDeveloper" },
      ),
    ],
    code: (ctx) => `(${userOf(ctx.input("member"))}?.flags?.has(${ctx.input("badge")}) ?? false)`,
  }),
  value({
    id: "user_badge_count",
    label: "User's number of badges",
    description: "How many badges are on someone's profile.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-certificate",
    keywords: ["badges"],
    block: {
      type: "member_badgeCount",
      text: "number of badges of user {member}",
      parts: { member: { check: "user" } },
      inline: true,
      tooltip: "Returns how many profile badges/flags a user has.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "Number",
    inputs: [input.slot("member", "User or member", ["user", "member"])],
    code: (ctx) => `(${userOf(ctx.input("member"))}?.flags?.toArray().length ?? 0)`,
  }),
  value({
    id: "member_activity_name",
    label: "Member's activity",
    description: "The name of a member's current activity, like the game they're playing.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-gamepad",
    keywords: ["activity", "playing", "presence"],
    block: {
      type: "member_activityName",
      text: ["name of the activity member {member}", "is doing"],
      inline: true,
      tooltip:
        "Returns the name of the member's current activity (game, stream, etc), or an empty text if they have none.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "String",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) => `(${ctx.input("member")}?.presence?.activities?.[0]?.name || "")`,
  }),
  value({
    id: "member_activity_type",
    label: "Member's kind of activity",
    description:
      "Whether a member is Playing, Streaming, Listening, Watching, Competing or has a Custom status.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-headphones",
    keywords: ["activity type"],
    block: {
      type: "member_activityType",
      text: "type of the member's current activity: {member}",
      inline: true,
      tooltip:
        'Returns "Playing", "Streaming", "Listening", "Watching", "Custom", or "Competing", or an empty text if the member has no activity.',
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "String",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) =>
      `(["Playing", "Streaming", "Listening", "Watching", "Custom", "Competing"][${ctx.input("member")}?.presence?.activities?.[0]?.type] || "")`,
  }),
  value({
    id: "member_is_streaming",
    label: "Member is streaming?",
    description: "True if a member is streaming right now.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-video",
    keywords: ["streaming", "live"],
    block: {
      type: "member_isStreaming",
      text: ["is member {member}", "currently streaming?"],
      inline: true,
      tooltip:
        "Checks if the member is currently live streaming (e.g. through Discord's Go Live, Twitch, or YouTube).",
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) =>
      `(${ctx.input("member")}?.presence?.activities?.some((a) => a.type === 1) ?? false)`,
  }),
  value({
    id: "member_activity_time",
    label: "How long a member has been on their activity",
    description: "How many seconds a member has been doing their current activity.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-stopwatch",
    keywords: ["activity time", "elapsed"],
    block: {
      type: "member_activityElapsed",
      text: "seconds member has spent on their current activity: {member}",
      inline: true,
      tooltip:
        "Returns how many seconds the member has been playing/streaming/etc their current activity for, or 0 if they have none.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "Number",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) =>
      `Math.floor((Date.now() - (${ctx.input("member")}?.presence?.activities?.[0]?.timestamps?.start ?? Date.now())) / 1000)`,
  }),
  value({
    id: "user_dm_channel",
    label: "User's DM channel",
    description: "The private chat between the bot and someone, if it's open.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-envelope-open",
    keywords: ["dm channel"],
    block: {
      type: "member_dmChannel",
      text: "dM channel of user: {member}",
      parts: { member: { check: "user" } },
      inline: true,
    },
    output: "channel",
    inputs: [input.slot("member", "User or member", ["user", "member"])],
    code: (ctx) => `${ctx.input("member")}.dmChannel`,
  }),
  value({
    id: "member_can_ban",
    label: "Bot can ban the member?",
    description: "True if the bot is allowed to ban a member.",
    category: "members",
    group: "Moderation",
    icon: "fa-solid fa-gavel",
    keywords: ["bannable"],
    block: {
      type: "member_bannable",
      text: ["is member {member}", "bannable by the bot?"],
      inline: true,
    },
    output: "Boolean",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) => `${ctx.input("member")}.bannable`,
  }),
  value({
    id: "member_can_kick",
    label: "Bot can kick the member?",
    description: "True if the bot is allowed to kick a member.",
    category: "members",
    group: "Moderation",
    icon: "fa-solid fa-person-walking-arrow-right",
    keywords: ["kickable"],
    block: {
      type: "member_kickable",
      text: ["is member {member}", "kickable by the bot?"],
      inline: true,
    },
    output: "Boolean",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) => `${ctx.input("member")}.kickable`,
  }),
  value({
    id: "member_is_timed_out",
    label: "Member is timed out?",
    description: "True if a member is timed out right now.",
    category: "members",
    group: "Moderation",
    icon: "fa-solid fa-clock",
    keywords: ["timeout", "muted"],
    block: {
      type: "member_timedout",
      text: ["is member {member}", "timed out?"],
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) => `${ctx.input("member")}.isCommunicationDisabled()`,
  }),
  value({
    id: "member_has_permission",
    label: "Member has a permission?",
    description: "True if a member has a permission in the server, like Ban Members.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-key",
    keywords: ["permission", "is admin", "can"],
    block: {
      type: "member_hasPermission",
      text: ["does member {member}", "have the {permission}", "?"],
      parts: { permission: { part: "value", check: "permission" } },
    },
    output: "Boolean",
    inputs: [
      input.slot("member", "Member", "member"),
      input.dropdown(
        "permission",
        "Permission",
        [
          ["Administrator", "Administrator"],
          ["Manage Server", "ManageGuild"],
          ["Manage Roles", "ManageRoles"],
          ["Manage Channels", "ManageChannels"],
          ["Kick Members", "KickMembers"],
          ["Ban Members", "BanMembers"],
          ["Timeout Members", "ModerateMembers"],
          ["Manage Messages", "ManageMessages"],
          ["Manage Nicknames", "ManageNicknames"],
          ["Manage Webhooks", "ManageWebhooks"],
          ["Manage Expressions", "ManageGuildExpressions"],
          ["Manage Threads", "ManageThreads"],
          ["Manage Events", "ManageEvents"],
          ["View Audit Log", "ViewAuditLog"],
          ["Mention @everyone", "MentionEveryone"],
          ["Mute Members", "MuteMembers"],
          ["Deafen Members", "DeafenMembers"],
          ["Move Members", "MoveMembers"],
          ["Change Nickname", "ChangeNickname"],
          ["View Channels", "ViewChannel"],
          ["Send Messages", "SendMessages"],
          ["Embed Links", "EmbedLinks"],
          ["Attach Files", "AttachFiles"],
          ["Add Reactions", "AddReactions"],
          ["Use External Emojis", "UseExternalEmojis"],
          ["Create Invite", "CreateInstantInvite"],
          ["Connect (voice)", "Connect"],
          ["Speak (voice)", "Speak"],
        ],
        { default: "Administrator" },
      ),
    ],
    code: (ctx) =>
      `${ctx.input("member")}.permissions.has(Discord.PermissionFlagsBits.${ctx.raw("permission")})`,
  }),
  value({
    id: "member_color",
    label: "Member's color",
    description: "The color of a member's name, from their highest colored role.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-palette",
    keywords: ["color", "colour", "role color"],
    block: {
      type: "member_color",
      text: "display color of member: {member}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "String",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) => `${ctx.input("member")}.displayHexColor`,
  }),
  value({
    id: "user_id",
    label: "ID of a user or member",
    description: "Someone's Discord ID.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id"],
    block: {
      type: "member_id",
      text: "ID of user/member: {member}",
      parts: { member: { check: ["member", "user"] } },
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "String",
    inputs: [input.slot("member", "User or member", ["user", "member"])],
    code: (ctx) => `${ctx.input("member")}.id`,
  }),
  value({
    id: "member_joined",
    label: "When a member joined the server",
    description: "When a member joined the server, as a date or a timestamp.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-calendar-plus",
    keywords: ["joined", "join date"],
    block: {
      type: "member_joined",
      text: "join {type} of member: {member}",
      parts: {
        type: {
          options: [
            ["date", "joinedAt"],
            ["timestamp", "joinedTimestamp"],
          ],
        },
      },
      inline: true,
      output: "String",
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: ["date", "Number"],
    inputs: [
      input.dropdown(
        "type",
        "As a",
        [
          ["Date", "joinedAt"],
          ["Timestamp", "joinedTimestamp"],
        ],
        { default: "joinedAt" },
      ),
      input.slot("member", "Member", "member"),
    ],
    code: (ctx) =>
      `${ctx.input("member")}.${ctx.raw("type") === "joinedTimestamp" ? "joinedTimestamp" : "joinedAt"}`,
  }),
  value({
    id: "member_nickname",
    label: "Member's nickname",
    description: "A member's nickname in this server. Empty if they don't have one.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-signature",
    keywords: ["nickname", "nick"],
    block: {
      type: "member_nickname",
      text: "nickname of member: {member}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "String",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) => `${ctx.input("member")}.nickname`,
  }),
  value({
    id: "user_username",
    label: "User's username",
    description: "Someone's Discord username.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-at",
    keywords: ["username", "name", "tag"],
    block: {
      type: "member_username",
      text: "username of user: {member}",
      parts: { member: { check: "user" } },
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "String",
    inputs: [input.slot("member", "User or member", ["user", "member"])],
    code: (ctx) => `${userOf(ctx.input("member"))}.username`,
  }),
  value({
    id: "user_avatar",
    label: "User's profile picture link",
    description:
      "A link to someone's profile picture (their server one, for a member who has one).",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-image-portrait",
    keywords: ["avatar", "pfp", "profile picture"],
    block: {
      type: "member_avatarURL",
      text: "avatar URL of user/member: {user}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["user"], message: "You must specify a user or member" },
      ],
    },
    output: "String",
    inputs: [input.slot("user", "User or member", ["user", "member"])],
    code: (ctx) => `${ctx.input("user")}.displayAvatarURL()`,
  }),
  value({
    id: "user_banner",
    label: "User's profile banner link",
    description:
      "A link to someone's profile banner, if they have one. The user may need to be loaded from Discord first.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-panorama",
    keywords: ["banner"],
    block: {
      type: "member_bannerURL",
      text: "banner URL of user: {user}",
      parts: { user: { check: "user" } },
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["user"], message: "You must specify a user or member" },
      ],
    },
    output: "String",
    inputs: [input.slot("user", "User or member", ["user", "member"])],
    code: (ctx) => `${userOf(ctx.input("user"))}.bannerURL()`,
  }),
  value({
    id: "user_is_bot",
    label: "User is a bot?",
    description: "True if the account is a bot.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-robot",
    keywords: ["bot"],
    block: {
      type: "member_bot",
      text: ["is user {member}", "a bot?"],
      parts: { member: { check: "user" } },
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("member", "User or member", ["user", "member"])],
    code: (ctx) => `${userOf(ctx.input("member"))}.bot`,
  }),
  value({
    id: "user_is_official",
    label: "User is official Discord?",
    description: "True if the account is Discord's own system account.",
    category: "members",
    group: "About a user",
    icon: "fa-brands fa-discord",
    keywords: ["system", "official"],
    block: {
      type: "member_system",
      text: ["is user {member}", "official Discord?"],
      parts: { member: { check: "user" } },
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("member", "User or member", ["user", "member"])],
    code: (ctx) => `${userOf(ctx.input("member"))}.system`,
  }),
  value({
    id: "user_accent_color",
    label: "User's profile accent color",
    description:
      "The accent color someone set on their profile. The user may need to be loaded from Discord first.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-droplet",
    keywords: ["accent", "color"],
    block: {
      type: "member_accent",
      text: "accent color of user: {member}",
      parts: { member: { check: "user" } },
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "String",
    inputs: [input.slot("member", "User or member", ["user", "member"])],
    code: (ctx) => `${userOf(ctx.input("member"))}.hexAccentColor`,
  }),
  value({
    id: "user_created",
    label: "When a user's account was made",
    description: "When someone's Discord account was created, as a date or a timestamp.",
    category: "members",
    group: "About a user",
    icon: "fa-solid fa-cake-candles",
    keywords: ["created", "account age"],
    block: {
      type: "member_created",
      text: "creation {type} of user: {member}",
      parts: {
        type: {
          options: [
            ["date", "createdAt"],
            ["timestamp", "createdTimestamp"],
          ],
        },
        member: { check: "user" },
      },
      inline: true,
      output: ["String", "date", "Number"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
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
      input.slot("member", "User or member", ["user", "member"]),
    ],
    code: (ctx) =>
      `${userOf(ctx.input("member"))}.${ctx.raw("type") === "createdTimestamp" ? "createdTimestamp" : "createdAt"}`,
  }),
  value({
    id: "member_account",
    label: "Member's user account",
    description: "The Discord user account behind a member.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-user",
    keywords: ["user", "account"],
    block: {
      type: "member_user",
      text: "user of member: {member}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "user",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) => `${ctx.input("member")}.user`,
  }),
  value({
    id: "member_server",
    label: "Server of a member",
    description: "The server a member is in.",
    category: "members",
    group: "About a member",
    icon: "fa-solid fa-server",
    keywords: ["guild", "server"],
    block: {
      type: "member_getServer",
      text: "server of member: {member}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
      ],
    },
    output: "server",
    inputs: [input.slot("member", "Member", "member")],
    code: (ctx) => `${ctx.input("member")}.guild`,
  }),
];

const components = [];

const blocks = [
  block({
    type: "member_dm_mutator",
    pings: true,
    text: ["send a dm", "to member: {member}", "content: {content}"],
    parts: {
      member: { part: "value", check: "member" },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
      files: { part: "statement", check: "files" },
    },
    previous: "default",
    next: "default",
    mutator: {
      options: "member_dm_mutator_options",
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
      ],
    },
    code: (ctx) => {
      const user = ctx.code("member") || "null";
      const content = ctx.code("content") || "''";
      const embeds = ctx.code("embeds");
      const rows = ctx.branch("rows");
      const files = ctx.branch("files");

      const options = buildMessageOptions({ allowedMentions: ctx.allowedMentions(), content, embeds, rows, files });

      return `await ${user}.send({\n  ${options.join(",\n  ")}\n});\n`;
    },
  }),
  block({
    type: "member_dm",
    pings: true,
    text: [
      "send direct message to user/member: {member}",
      "content: {content}",
      "embed name(s): {embeds}",
    ],
    parts: {
      member: { part: "value", check: ["user", "member"] },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
    },
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
    ],
    code: (ctx) => {
      var user = ctx.code("member");
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");

      const parts = buildMessageOptions({ allowedMentions: ctx.allowedMentions(),
        content,
        embeds,
      });

      return `await ${user}.send({\n  ${parts.join(", ")}\n});\n`;
    },
  }),
  block({
    type: "member_dm_rows",
    pings: true,
    text: [
      "send direct message to user/member: {member}",
      "content: {content}",
      "embed name(s): {embeds}",
      "rows: {rows}",
    ],
    parts: {
      member: { part: "value", check: ["user", "member"] },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
    },
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      { type: "notEmpty", blockTypes: ["member"], message: "You must specify the user/member." },
    ],
    code: (ctx) => {
      var user = ctx.code("member");
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");

      const parts = buildMessageOptions({ allowedMentions: ctx.allowedMentions(),
        content,
        embeds,
        rows,
      });

      return `await ${user}.send({\n  ${parts.join(", ")}\n});\n`;
    },
  }),
];

export default {
  events,
  actions,
  values,
  components,
  contexts: [],

  blocks,
};
