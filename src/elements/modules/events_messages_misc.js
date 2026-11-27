/* =====================================================================
   Builder catalog: message, voice, thread, emoji and custom events
   ---------------------------------------------------------------------
   Events from the block editor's "Message Actions", "Voice Actions",
   "Thread Actions", "Emojis & Stickers" and "Custom" sections. Each
   hat block is an event here, and its variable blocks are that event's
   values.

   Pins, edits and voice joins come from the discord-logs package, which
   adds them to the client like the block editor's export does.
   ===================================================================== */

import { ANY, group, input } from "../define.js";

const { event, value } = group({ colour: "#336EFF" });

/** discord-logs adds pin, edit and voice events to the client. */
const DISCORD_LOGS = {
  package: "discord-logs",
  code: `require("discord-logs")(client);`,
};

const IGNORE_BOTS = input.boolean("ignoreBots", "Ignore messages from bots", {
  default: true,
  allowValues: false,
  help: "Keeps your bot from answering itself or other bots.",
});

/** A custom event's parameter names, cleaned up into valid names. */
const parameterNames = (text) =>
  String(text ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));

const events = [
  event({
    id: "event_message_deleted",
    label: "When a message is deleted",
    description:
      "Runs when a message the bot can see gets deleted. Older messages may have no text or author.",
    category: "messages",
    group: "Messages",
    icon: "fa-solid fa-trash-can",
    keywords: ["delete", "deleted", "removed", "message delete", "logs"],
    block: { type: "events_message_deleted", text: "when a message gets deleted" },
    listen: "Discord.Events.MessageDelete",
    params: ["messageDeleted"],
    values: [
      {
        key: "message",
        label: "Deleted message",
        type: "message",
        code: "messageDeleted",
        block: {
          type: "events_message_deleted_message",
          text: "message that got deleted",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_message_deleted"],
              message: "This block must be in the 'when a message gets deleted' event",
            },
          ],
        },
      },
      {
        key: "content",
        label: "What it said",
        type: "String",
        code: '(messageDeleted.content ?? "")',
        description: "Empty if the bot didn't see the message being sent.",
      },
      { key: "author", label: "Who sent it", type: "user", code: "messageDeleted.author" },
      {
        key: "channel",
        label: "Channel it was in",
        type: "channel",
        code: "messageDeleted.channel",
      },
      {
        key: "server",
        label: "Server it was in",
        type: "server",
        code: "messageDeleted.guild",
        description: "Empty in DMs.",
      },
    ],
  }),
  event({
    id: "event_reaction_added",
    label: "When someone reacts to a message",
    description: "Runs when someone adds a reaction to a message.",
    category: "messages",
    group: "Reactions",
    icon: "fa-solid fa-face-smile-beam",
    keywords: ["reaction", "react", "emoji", "reaction roles"],
    block: {
      type: "events_message_ReactionAdd",
      text: "when a reaction is added to a message",
      parts: { ignoreBots: { part: "fixed", value: false } },
    },
    listen: "Discord.Events.MessageReactionAdd",
    params: ["messageReaction", "user"],
    values: [
      {
        key: "user",
        label: "Who reacted",
        type: "user",
        code: "user",
        block: {
          type: "events_message_ReactionAdd_user",
          text: "user that added reaction",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_message_ReactionAdd"],
              message: "This block must be in the 'when a reaction is added to a message' event",
            },
          ],
        },
      },
      {
        key: "message",
        label: "Message they reacted to",
        type: "message",
        code: "messageReaction.message",
        block: {
          type: "events_message_ReactionAdd_msg",
          text: "message the reaction was added to",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_message_ReactionAdd"],
              message: "This block must be in the 'when a reaction is added to a message' event",
            },
          ],
        },
      },
      {
        key: "emoji",
        label: "Emoji they used",
        type: "String",
        code: "messageReaction.emoji.toString()",
        description: "Custom emojis look like <:name:id>.",
        block: {
          type: "events_message_ReactionAdd_emoji",
          text: "emoji of the reaction",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_message_ReactionAdd"],
              message: "This block must be in the 'when a reaction is added to a message' event",
            },
          ],
        },
      },
      { key: "emojiName", label: "Emoji name", type: "String", code: "messageReaction.emoji.name" },
      {
        key: "count",
        label: "Number of these reactions",
        type: "Number",
        code: "messageReaction.count",
        block: {
          type: "events_message_ReactionAdd_count",
          text: "amount of the reaction",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_message_ReactionAdd"],
              message: "This block must be in the 'when a reaction is added to a message' event",
            },
          ],
        },
      },
      {
        key: "channel",
        label: "Channel",
        type: "channel",
        code: "messageReaction.message.channel",
      },
      {
        key: "server",
        label: "Server",
        type: "server",
        code: "messageReaction.message.guild",
        description: "Empty in DMs.",
      },
    ],
    settings: [
      input.boolean("ignoreBots", "Ignore reactions from bots", {
        default: true,
        allowValues: false,
      }),
    ],
    prelude: () => "if (messageReaction.partial) await messageReaction.fetch();\n",
  }),
  event({
    id: "event_message_edited",
    label: "When a message is edited",
    description: "Runs when someone changes the text of a message.",
    category: "messages",
    group: "Messages",
    icon: "fa-solid fa-pen-to-square",
    keywords: ["edit", "edited", "changed", "message update", "logs"],
    block: { type: "events_message_edited", text: "when a message is edited" },
    listen: '"messageContentEdited"',
    params: ["messageEdited", "oldContent", "newContent"],
    values: [
      {
        key: "message",
        label: "Edited message",
        type: "message",
        code: "messageEdited",
        block: { type: "events_message_edited_message", text: "edited message" },
      },
      {
        key: "before",
        label: "Text before",
        type: "String",
        code: "oldContent",
        block: { type: "events_message_edited_oldContent", text: "old content" },
      },
      {
        key: "after",
        label: "Text after",
        type: "String",
        code: "newContent",
        block: { type: "events_message_edited_newContent", text: "new content" },
      },
      { key: "author", label: "Who edited it", type: "user", code: "messageEdited.author" },
      { key: "channel", label: "Channel", type: "channel", code: "messageEdited.channel" },
      {
        key: "server",
        label: "Server",
        type: "server",
        code: "messageEdited.guild",
        description: "Empty in DMs.",
      },
    ],
    dependencies: [DISCORD_LOGS],
  }),
  event({
    id: "event_message_pinned",
    label: "When a message is pinned",
    description: "Runs when a message gets pinned in a channel.",
    category: "messages",
    group: "Messages",
    icon: "fa-solid fa-thumbtack",
    keywords: ["pin", "pinned"],
    block: { type: "events_message_pinned", text: "when a message is pinned" },
    listen: '"messagePinned"',
    params: ["pinnedMessage"],
    values: [
      {
        key: "message",
        label: "Pinned message",
        type: "message",
        code: "pinnedMessage",
        block: { type: "events_message_pinned_message", text: "pinned message" },
      },
      { key: "channel", label: "Channel", type: "channel", code: "pinnedMessage.channel" },
      {
        key: "server",
        label: "Server",
        type: "server",
        code: "pinnedMessage.guild",
        description: "Empty in DMs.",
      },
    ],
    dependencies: [DISCORD_LOGS],
  }),
  event({
    id: "event_message_reply",
    label: "When someone replies to a message",
    description: "Runs when a message is sent as a reply to another message.",
    category: "messages",
    group: "Messages",
    icon: "fa-solid fa-reply",
    keywords: ["reply", "replied", "response"],
    block: {
      type: "events_message_reply",
      text: "when a message is replied to",
      parts: { ignoreBots: { part: "fixed", value: false } },
    },
    listen: "Discord.Events.MessageCreate",
    params: ["message"],
    provides: ["message"],
    values: [
      { key: "message", label: "The reply", type: "message", code: "message" },
      { key: "content", label: "Message text", type: "String", code: "message.content" },
      { key: "author", label: "Who sent it (user)", type: "user", code: "message.author" },
      {
        key: "member",
        label: "Who sent it (member)",
        type: "member",
        code: "message.member",
        description: "Empty in DMs.",
      },
      { key: "channel", label: "Channel it was sent in", type: "channel", code: "message.channel" },
      {
        key: "server",
        label: "Server it was sent in",
        type: "server",
        code: "message.guild",
        description: "Empty in DMs.",
      },
      {
        key: "repliedTo",
        label: "Message they replied to",
        type: "message",
        code: "(await message.fetchReference().catch(() => null))",
        description: "Empty if that message was deleted.",
      },
    ],
    settings: [IGNORE_BOTS],
    prelude: (ctx) =>
      `if (!message.reference) return;\n${ctx.raw("ignoreBots") === true ? "if (message.author.bot) return;\n" : ""}`,
  }),
  event({
    id: "event_voice_join",
    label: "When a member joins a voice channel",
    description: "Runs when someone connects to a voice channel.",
    category: "voice",
    group: "Voice",
    icon: "fa-solid fa-microphone",
    keywords: ["voice", "join", "connect", "vc"],
    block: {
      type: "events_voice_join",
      text: "when a member joins a voice channel",
      colour: "#1f9ea8",
    },
    listen: '"voiceChannelJoin"',
    params: ["voiceJoinedMember", "voiceJoinedChannel"],
    values: [
      {
        key: "member",
        label: "Member who joined",
        type: "member",
        code: "voiceJoinedMember",
        block: {
          type: "events_voice_join_member",
          text: "member who joined the voice channel",
          colour: "#1f9ea8",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_voice_join"],
              message: "This block must be in the 'when a member joins a voice channel' event",
            },
          ],
        },
      },
      {
        key: "channel",
        label: "Voice channel they joined",
        type: "channel",
        code: "voiceJoinedChannel",
        block: {
          type: "events_voice_join_channel",
          text: "voice channel that was joined",
          colour: "#1f9ea8",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_voice_join"],
              message: "This block must be in the 'when a member joins a voice channel' event",
            },
          ],
        },
      },
      { key: "server", label: "Server", type: "server", code: "voiceJoinedMember.guild" },
    ],
    dependencies: [DISCORD_LOGS],
  }),
  event({
    id: "event_voice_leave",
    label: "When a member leaves a voice channel",
    description: "Runs when someone disconnects from a voice channel.",
    category: "voice",
    group: "Voice",
    icon: "fa-solid fa-microphone-slash",
    keywords: ["voice", "leave", "disconnect", "vc"],
    block: {
      type: "events_voice_leave",
      text: "when a member leaves a voice channel",
      colour: "#1f9ea8",
    },
    listen: '"voiceChannelLeave"',
    params: ["voiceLeftMember", "voiceLeftChannel"],
    values: [
      {
        key: "member",
        label: "Member who left",
        type: "member",
        code: "voiceLeftMember",
        block: {
          type: "events_voice_leave_member",
          text: "member who left the voice channel",
          colour: "#1f9ea8",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_voice_leave"],
              message: "This block must be in the 'when a member leaves a voice channel' event",
            },
          ],
        },
      },
      {
        key: "channel",
        label: "Voice channel they left",
        type: "channel",
        code: "voiceLeftChannel",
        block: {
          type: "events_voice_leave_channel",
          text: "voice channel that was left",
          colour: "#1f9ea8",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_voice_leave"],
              message: "This block must be in the 'when a member leaves a voice channel' event",
            },
          ],
        },
      },
      { key: "server", label: "Server", type: "server", code: "voiceLeftMember.guild" },
    ],
    dependencies: [DISCORD_LOGS],
  }),
  event({
    id: "event_thread_created",
    label: "When a thread is created",
    description: "Runs when someone starts a thread or forum post.",
    category: "threads",
    group: "Threads",
    icon: "fa-solid fa-comments",
    keywords: ["thread", "new thread", "forum post"],
    block: { type: "events_thread_created", text: "when a thread is created", colour: "#5b67a5" },
    listen: "Discord.Events.ThreadCreate",
    params: ["createdThread", "newlyCreated"],
    values: [
      {
        key: "thread",
        label: "New thread",
        type: "channel",
        code: "createdThread",
        block: {
          type: "events_thread_created_thread",
          text: "created thread",
          colour: "#5b67a5",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_thread_created"],
              message: "This block must be in the 'when a thread is created' event",
            },
          ],
        },
      },
      {
        key: "parent",
        label: "Channel it's in",
        type: "channel",
        code: "createdThread.parent",
        block: {
          type: "events_thread_created_parent",
          text: "parent channel",
          colour: "#5b67a5",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_thread_created"],
              message: "This block must be in the 'when a thread is created' event",
            },
          ],
        },
      },
      { key: "server", label: "Server", type: "server", code: "createdThread.guild" },
    ],
    prelude: () => "if (!newlyCreated) return;\n",
  }),
  event({
    id: "event_thread_deleted",
    label: "When a thread is deleted",
    description: "Runs when a thread or forum post is deleted.",
    category: "threads",
    group: "Threads",
    icon: "fa-solid fa-comment-slash",
    keywords: ["thread", "deleted thread"],
    block: { type: "events_thread_deleted", text: "when a thread is deleted", colour: "#5b67a5" },
    listen: "Discord.Events.ThreadDelete",
    params: ["deletedThread"],
    values: [
      {
        key: "thread",
        label: "Deleted thread",
        type: "channel",
        code: "deletedThread",
        block: {
          type: "events_thread_deleted_thread",
          text: "deleted thread",
          colour: "#5b67a5",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_thread_deleted"],
              message: "This block must be in the 'when a thread is deleted' event",
            },
          ],
        },
      },
      { key: "parent", label: "Channel it was in", type: "channel", code: "deletedThread.parent" },
      { key: "server", label: "Server", type: "server", code: "deletedThread.guild" },
    ],
  }),
  event({
    id: "event_emoji_created",
    label: "When an emoji is added",
    description: "Runs when a custom emoji is added to a server.",
    category: "emojis",
    group: "Emojis and stickers",
    icon: "fa-solid fa-face-smile",
    keywords: ["emoji", "new emoji", "added"],
    block: { type: "events_emojis_created", text: "when an emoji is created", colour: "#DEB144" },
    listen: "Discord.Events.GuildEmojiCreate",
    params: ["createdOrDeletedEmoji"],
    values: [
      {
        key: "emoji",
        label: "New emoji",
        type: "emoji",
        code: "createdOrDeletedEmoji",
        block: {
          type: "events_emojis_createdOrDeletedEmoji",
          text: "created/deleted emoji",
          colour: "#DEB144",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_emojis_created", "events_emojis_deleted"],
              message: "This block must be in the 'when an emoji is created/deleted' event",
            },
          ],
          also: ["event_emoji_deleted"],
        },
      },
      { key: "server", label: "Server", type: "server", code: "createdOrDeletedEmoji.guild" },
    ],
  }),
  event({
    id: "event_emoji_deleted",
    label: "When an emoji is deleted",
    description: "Runs when a custom emoji is removed from a server.",
    category: "emojis",
    group: "Emojis and stickers",
    icon: "fa-solid fa-face-frown",
    keywords: ["emoji", "deleted", "removed"],
    block: { type: "events_emojis_deleted", text: "when an emoji is deleted", colour: "#DEB144" },
    listen: "Discord.Events.GuildEmojiDelete",
    params: ["createdOrDeletedEmoji"],
    values: [
      { key: "emoji", label: "Deleted emoji", type: "emoji", code: "createdOrDeletedEmoji" },
      { key: "server", label: "Server", type: "server", code: "createdOrDeletedEmoji.guild" },
    ],
  }),
  event({
    id: "event_emoji_changed",
    label: "When an emoji is changed",
    description: "Runs when a custom emoji is renamed or changed.",
    category: "emojis",
    group: "Emojis and stickers",
    icon: "fa-solid fa-face-grin-wink",
    keywords: ["emoji", "renamed", "updated"],
    block: { type: "events_emojis_changed", text: "when an emoji is changed", colour: "#DEB144" },
    listen: "Discord.Events.GuildEmojiUpdate",
    params: ["oldEmoji", "newEmoji"],
    values: [
      {
        key: "before",
        label: "Emoji before",
        type: "emoji",
        code: "oldEmoji",
        block: {
          type: "events_emojis_changedOldEmoji",
          text: "emoji before changes",
          colour: "#DEB144",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_emojis_changed"],
              message: "This block must be in the 'when an emoji is changed' event",
            },
          ],
        },
      },
      {
        key: "after",
        label: "Emoji after",
        type: "emoji",
        code: "newEmoji",
        block: {
          type: "events_emojis_changedNewEmoji",
          text: "emoji after changes",
          colour: "#DEB144",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_emojis_changed"],
              message: "This block must be in the 'when an emoji is changed' event",
            },
          ],
        },
      },
      { key: "server", label: "Server", type: "server", code: "newEmoji.guild" },
    ],
  }),
  event({
    id: "event_sticker_created",
    label: "When a sticker is added",
    description: "Runs when a sticker is added to a server.",
    category: "emojis",
    group: "Emojis and stickers",
    icon: "fa-solid fa-note-sticky",
    keywords: ["sticker", "new sticker", "added"],
    block: {
      type: "events_stickers_created",
      text: "when a sticker is created",
      colour: "#7a9e37",
    },
    listen: "Discord.Events.GuildStickerCreate",
    params: ["createdOrDeletedSticker"],
    values: [
      {
        key: "sticker",
        label: "New sticker",
        type: "sticker",
        code: "createdOrDeletedSticker",
        block: {
          type: "events_stickers_createdOrDeletedSticker",
          text: "created/deleted sticker",
          colour: "#7a9e37",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_stickers_created", "events_stickers_deleted"],
              message: "This block must be in the 'when a sticker is created/deleted' event",
            },
          ],
          also: ["event_sticker_deleted"],
        },
      },
      { key: "server", label: "Server", type: "server", code: "createdOrDeletedSticker.guild" },
    ],
  }),
  event({
    id: "event_sticker_deleted",
    label: "When a sticker is deleted",
    description: "Runs when a sticker is removed from a server.",
    category: "emojis",
    group: "Emojis and stickers",
    icon: "fa-solid fa-note-sticky",
    keywords: ["sticker", "deleted", "removed"],
    block: {
      type: "events_stickers_deleted",
      text: "when a sticker is deleted",
      colour: "#7a9e37",
    },
    listen: "Discord.Events.GuildStickerDelete",
    params: ["createdOrDeletedSticker"],
    values: [
      {
        key: "sticker",
        label: "Deleted sticker",
        type: "sticker",
        code: "createdOrDeletedSticker",
      },
      { key: "server", label: "Server", type: "server", code: "createdOrDeletedSticker.guild" },
    ],
  }),
  event({
    id: "event_sticker_changed",
    label: "When a sticker is changed",
    description: "Runs when a sticker is renamed or changed.",
    category: "emojis",
    group: "Emojis and stickers",
    icon: "fa-solid fa-note-sticky",
    keywords: ["sticker", "renamed", "updated"],
    block: {
      type: "events_stickers_changed",
      text: "when a sticker is changed",
      colour: "#7a9e37",
    },
    listen: "Discord.Events.GuildStickerUpdate",
    params: ["oldSticker", "newSticker"],
    values: [
      {
        key: "before",
        label: "Sticker before",
        type: "sticker",
        code: "oldSticker",
        block: {
          type: "events_stickers_changedOldSticker",
          text: "sticker before changes",
          colour: "#7a9e37",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_stickers_changed"],
              message: "This block must be in the 'when a sticker is changed' event",
            },
          ],
        },
      },
      {
        key: "after",
        label: "Sticker after",
        type: "sticker",
        code: "newSticker",
        block: {
          type: "events_stickers_changedNewSticker",
          text: "sticker after changes",
          colour: "#7a9e37",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["events_stickers_changed"],
              message: "This block must be in the 'when a sticker is changed' event",
            },
          ],
        },
      },
      { key: "server", label: "Server", type: "server", code: "newSticker.guild" },
    ],
  }),
  event({
    id: "event_custom",
    label: "When a custom event happens",
    description:
      "Runs when the bot gets an event by name. For events that aren't in this list, like ones added by other packages.",
    category: "custom",
    group: "Custom",
    icon: "fa-solid fa-satellite-dish",
    keywords: ["custom", "client.on", "listen", "any event", "raw"],
    block: {
      type: "events_custom",
      body: { name: "code", check: "default" },
      text: "when client receives {event} parameters: {parameters}",
      parts: {
        event: { part: "text", value: "event" },
        parameters: { part: "text", value: "abc, def" },
      },
      colour: "#999999",
    },
    params: [],
    provides: ["customEvent"],
    settings: [
      input.text("event", "Event name", {
        default: "",
        allowValues: false,
        help: "The name the bot gets the event by.",
        placeholder: "guildAuditLogEntryCreate",
      }),
      input.text("parameters", "What it gives you", {
        default: "",
        allowValues: false,
        help: "Names for what the event sends, in order, split by commas. Use them with the Custom event value.",
        placeholder: "entry, server",
      }),
    ],
    wrap: (ctx, body) => {
      const names = parameterNames(ctx.raw("parameters"));
      const given = names
        .map((name, index) => `${JSON.stringify(name)}: disfuseEventArgs[${index}]`)
        .join(", ");
      /* The names also work as variables, for code written by hand. */
      return `client.on(${JSON.stringify(String(ctx.raw("event") ?? "").trim())}, async (...disfuseEventArgs) => {
${names.length ? `let [${names.join(", ")}] = disfuseEventArgs;\n` : ""}disfuseEventArgs = { ${given} };
${body}});`;
    },
  }),
];

const actions = [];

const values = [
  value({
    id: "event_custom_value",
    label: "Custom event value",
    description:
      "One of the things a custom event gives you, by the name you gave it on the event's page.",
    category: "custom",
    group: "Custom",
    icon: "fa-solid fa-satellite-dish",
    keywords: ["parameter", "custom event", "argument"],
    block: {
      type: "events_customParameter",
      text: "get parameter {parameter}",
      parts: { parameter: { part: "text" } },
      colour: "#999999",
    },
    requires: ["customEvent"],
    output: ANY,
    inputs: [input.text("parameter", "Name", { default: "", allowValues: false })],
    code: (ctx) => `disfuseEventArgs[${JSON.stringify(String(ctx.raw("parameter") ?? "").trim())}]`,
  }),
];

const components = [];

export default {
  events,
  actions,
  values,
  components,
  contexts: [
    {
      key: "customEvent",
      label: "a custom event",
      description: 'Only works inside "When a custom event happens".',
      variable: "disfuseEventArgs",
    },
  ],
};
