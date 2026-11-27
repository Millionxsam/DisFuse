/* =====================================================================
   Builder catalog: messages and polls
   ---------------------------------------------------------------------
   Receiving, sending, replying to, editing and reacting to messages,
   and polls. Messages are built in the message builder (Components V2,
   the same as every message the block editor sends).
   ===================================================================== */

import {
  ALLOWED_MENTIONS,
  buildMessageOptions,
  buildThenSuffix,
  formatEmbeds,
} from "../../blocks/lib/generatorUtils.js";
import { ANY, group, input } from "../define.js";

const { event, action, value, block } = group({ colour: "#336EFF" });

const events = [
  event({
    id: "message_sent",
    label: "When a message is sent",
    description: "Runs every time someone sends a message the bot can see.",
    category: "messages",
    icon: "fa-solid fa-message",
    keywords: ["message create", "message received", "on message", "chat"],
    block: [
      {
        type: "msg_received",
        body: { name: "event", check: "default" },
        text: "when a message is received",
        parts: { ignoreBots: { part: "fixed", value: false } },
        inline: false,
      },
      {
        type: "message_author_not_bot",
        body: { name: "name", check: "default" },
        text: "when a message is received from a human",
        parts: { ignoreBots: { part: "fixed", value: true } },
        inline: false,
      },
    ],
    listen: "Discord.Events.MessageCreate",
    params: ["message"],
    provides: ["message"],
    values: [
      {
        key: "message",
        label: "The message",
        type: "message",
        code: "message",
        block: {
          type: "msg_msg",
          text: "message received",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["msg_received", "message_author_not_bot", "msg_dm_received"],
              message: 'This block must be in a "when a message is received" event',
            },
          ],
          also: ["dm_received"],
        },
      },
      {
        key: "content",
        label: "Message text",
        type: "String",
        code: "message.content",
        block: {
          type: "msg_content",
          text: "content of the message",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["msg_received", "message_author_not_bot", "msg_dm_received"],
              message: 'This block must be in a "when a message is received" event',
            },
          ],
          also: ["dm_received"],
        },
      },
      {
        key: "author",
        label: "Who sent it (user)",
        type: "user",
        code: "message.author",
        block: {
          type: "msg_user",
          text: "user who sent the message",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["msg_received", "message_author_not_bot"],
              message: 'This block must be in a "when a message is received" event',
            },
          ],
        },
      },
      {
        key: "member",
        label: "Who sent it (member)",
        type: "member",
        code: "message.member",
        description: "Empty in DMs.",
        block: {
          type: "msg_member",
          text: "member who sent the message",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["msg_received", "message_author_not_bot"],
              message: 'This block must be in a "when a message is received" event',
            },
          ],
        },
      },
      {
        key: "channel",
        label: "Channel it was sent in",
        type: "channel",
        code: "message.channel",
        block: {
          type: "msg_channel",
          text: "channel of the message",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["msg_received", "message_author_not_bot", "msg_dm_received"],
              message: 'This block must be in a "when a message is received" event',
            },
          ],
          also: ["dm_received"],
        },
      },
      {
        key: "server",
        label: "Server it was sent in",
        type: "server",
        code: "message.guild",
        description: "Empty in DMs.",
        block: {
          type: "msg_server",
          text: "server of the message",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["msg_received", "message_author_not_bot"],
              message: 'This block must be in a "when a message is received" event',
            },
          ],
        },
      },
    ],
    settings: [
      input.boolean("ignoreBots", "Ignore messages from bots", {
        default: true,
        allowValues: false,
        help: "Keeps your bot from answering itself or other bots.",
      }),
    ],
    prelude: (ctx) => (ctx.raw("ignoreBots") === true ? "if (message.author.bot) return;\n" : ""),
  }),
  event({
    id: "dm_received",
    label: "When the bot gets a DM",
    description:
      "Runs when someone sends the bot a direct message. Messages in servers and messages from bots are ignored.",
    category: "messages",
    icon: "fa-solid fa-envelope",
    keywords: ["direct message", "dm", "private message", "inbox"],
    block: {
      type: "msg_dm_received",
      body: { name: "event", check: "default" },
      text: "when the bot receives a DM",
      inline: false,
      tooltip:
        "Runs when someone sends the bot a direct message. Messages sent in servers and messages from bots are ignored.",
    },
    listen: "Discord.Events.MessageCreate",
    params: ["message"],
    provides: ["message"],
    values: [
      { key: "message", label: "The message", type: "message", code: "message" },
      { key: "content", label: "Message text", type: "String", code: "message.content" },
      { key: "author", label: "Who sent it", type: "user", code: "message.author" },
      { key: "channel", label: "The DM channel", type: "channel", code: "message.channel" },
    ],
    /* A DM has no server, which is what tells it apart. Bots are skipped
       too, including this bot: replying to a DM fires this again. */
    prelude: () => "if (message.guild || message.author.bot) return;\n",
  }),
  event({
    id: "poll_vote_added",
    label: "When someone votes in a poll",
    description: "Runs when someone picks an answer in a poll the bot can see.",
    category: "polls",
    icon: "fa-solid fa-square-poll-vertical",
    keywords: ["poll", "vote", "answer"],
    block: {
      type: "poll_whenvoteadded",
      body: { name: "CODE", check: "default" },
      text: "when a vote is added to a poll",
      colour: "#656b75",
      tooltip: "Runs the code inside when a vote is added to any poll the bot can access to.",
    },
    listen: "Discord.Events.MessagePollVoteAdd",
    params: ["pollVoteAdded", "userVoteAdd"],
    values: [
      {
        key: "text",
        label: "Answer they picked",
        type: "String",
        code: "pollVoteAdded.text",
        block: {
          type: "poll_whenvoteaddedvotetext",
          text: "poll vote text",
          colour: "#656b75",
          tooltip: "The text of the vote.",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["poll_whenvoteadded"],
              message: "This block must be in the 'when a vote is added to a poll' event",
            },
          ],
        },
      },
      {
        key: "emoji",
        label: "Emoji of the answer",
        type: "emoji",
        code: "pollVoteAdded.emoji",
        block: {
          type: "poll_whenvoteaddedvoteemoji",
          text: "poll vote emoji",
          colour: "#656b75",
          tooltip: "The emoji of the vote.",
          output: ["String", "emoji"],
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["poll_whenvoteadded"],
              message: "This block must be in the 'when a vote is added to a poll' event",
            },
          ],
        },
      },
      {
        key: "voterId",
        label: "Voter's ID",
        type: "String",
        code: "userVoteAdd",
        description: "Discord sends the voter's ID with this event.",
        block: {
          type: "poll_whenvoteaddedvoteuser",
          text: "poll vote author",
          colour: "#656b75",
          tooltip: "The user that added the vote to the poll.",
          output: "user",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["poll_whenvoteadded"],
              message: "This block must be in the 'when a vote is added to a poll' event",
            },
          ],
        },
      },
      {
        key: "voter",
        label: "Voter",
        type: "user",
        code: "(await client.users.fetch(userVoteAdd))",
      },
      {
        key: "question",
        label: "Poll question",
        type: "String",
        code: "pollVoteAdded.poll.question.text",
      },
      {
        key: "message",
        label: "Poll message",
        type: "message",
        code: "pollVoteAdded.poll.message",
      },
    ],
  }),
];

const actions = [
  action({
    id: "message_reply",
    label: "Reply to the received message",
    description: "Replies to the message that was just sent, with a message you build.",
    category: "messages",
    group: "Sending",
    icon: "fa-solid fa-reply",
    keywords: ["reply", "respond", "answer", "send"],
    block: {
      type: "cv2_replyMsg",
      text: ["reply to the message", "components: {components}"],
      parts: {
        components: { part: "statement", check: "rootComponents" },
        files: { part: "statement", check: "files" },
      },
      tooltip: "Replies to a message using Components V2. Cannot use content or embeds.",
      mutator: {
        options: "cv2_replyMsg_mutator",
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
            label: "include 'then'",
            inputType: "statement",
            inputLabel: "then:",
            valueCheck: "default",
          },
        ],
      },
    },
    requires: ["message"],
    inputs: [input.message("content", "Reply")],
    branches: [
      {
        key: "then",
        label: "After it's sent",
        optional: true,
        provides: [
          {
            key: "sent",
            label: "The reply",
            type: "message",
            code: "messageSent",
          },
        ],
      },
    ],
    special: "message",
    code: (ctx) =>
      `await message.reply(${ctx.message("content")})${ctx.hasBranch("then") ? `.then(async (messageSent) => {\n${ctx.branch("then")}})` : ""};\n`,
  }),
  action({
    id: "message_delete",
    label: "Delete a message",
    description: "Deletes a message.",
    category: "messages",
    group: "Managing",
    icon: "fa-solid fa-trash-can",
    keywords: ["delete", "remove"],
    block: {
      type: "msg_deleteOther",
      text: "delete message: {message}",
      colour: "336EFF",
      tooltip: "Delete a message",
    },
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) => `await ${ctx.input("message")}.delete();\n`,
  }),
  action({
    id: "message_edit",
    label: "Edit a message the bot sent",
    description: "Changes a message the bot sent to a new message you build.",
    category: "messages",
    group: "Sending",
    icon: "fa-solid fa-pen-to-square",
    keywords: ["edit", "change", "update"],
    block: {
      type: "cv2_editMsg",
      text: ["edit message: {message}", "components: {components}"],
      parts: {
        components: { part: "statement", check: "rootComponents" },
        files: { part: "statement", check: "files" },
      },
      tooltip: "Edits a deferred or previously sent interaction reply using Components V2.",
      mutator: {
        options: "cv2_editMsg_mutator",
        fields: [
          {
            name: "files",
            label: "include files",
            inputType: "statement",
            inputLabel: "files:",
            valueCheck: "files",
          },
        ],
      },
    },
    inputs: [input.slot("message", "Message", "message"), input.message("content", "New message")],
    special: "message",
    code: (ctx) =>
      `await ${ctx.input("message")}.edit(${ctx.message("content", { edit: true })});\n`,
  }),
  action({
    id: "message_react",
    label: "React to a message",
    description: "Adds an emoji reaction to a message.",
    category: "messages",
    group: "Reactions",
    icon: "fa-solid fa-face-smile",
    keywords: ["react", "reaction", "emoji"],
    block: {
      type: "msg_react",
      text: ["react to message: {message}", "with emoji: {reaction}"],
      parts: { reaction: { check: ["String", "emoji"] } },
      inline: false,
      restrictions: [
        {
          type: "validator",
          blockTypes: ["reaction"],
          check: (val) => /^(|([\p{Emoji}]{1}))$/u.test(val),
          message: "Emoji must be a single valid emoji",
        },
      ],
    },
    inputs: [
      input.slot("message", "Message", "message"),
      input.text("reaction", "Emoji", {
        default: "👍",
        help: "An emoji, or a custom emoji like <:name:id>.",
      }),
    ],
    code: (ctx) => `await ${ctx.input("message")}.react(${ctx.input("reaction")});\n`,
  }),
  action({
    id: "message_pin",
    label: "Pin a message",
    description: "Pins a message to its channel.",
    category: "messages",
    group: "Managing",
    icon: "fa-solid fa-thumbtack",
    keywords: ["pin"],
    block: {
      type: "msg_pin",
      text: "pin message: {message}",
      colour: "336EFF",
      tooltip: "Pins a message in its channel.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message"],
          message: "You must specify the message to pin/unpin",
        },
      ],
    },
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) => `await ${ctx.input("message")}.pin();\n`,
  }),
  action({
    id: "message_unpin",
    label: "Unpin a message",
    description: "Unpins a message from its channel.",
    category: "messages",
    group: "Managing",
    icon: "fa-solid fa-thumbtack fa-rotate-180",
    keywords: ["unpin"],
    block: {
      type: "msg_unpin",
      text: "unpin message: {message}",
      colour: "336EFF",
      tooltip: "Unpins a message from its channel.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message"],
          message: "You must specify the message to pin/unpin",
        },
      ],
    },
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) => `await ${ctx.input("message")}.unpin();\n`,
  }),
  action({
    id: "message_each_reaction",
    label: "Repeat with each reaction on a message",
    description: "Runs the steps inside once for every reaction on a message.",
    category: "messages",
    group: "Reactions",
    icon: "fa-solid fa-icons",
    keywords: ["reactions", "for each", "loop"],
    block: {
      type: "msg_get_reactions",
      text: ["for each reaction in {message}", "{code}"],
      parts: { code: { check: "default" } },
      inline: false,
      tooltip: "Loops through each reaction in the message.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message"],
          message: "You must specify the message to get the reactions from",
        },
      ],
    },
    inputs: [input.slot("message", "Message", "message")],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        provides: [
          {
            key: "emoji",
            label: "Reaction emoji",
            type: "String",
            code: "reaction.emoji.toString()",
            block: {
              type: "msg_reaction_emoji",
              text: "emoji of the reaction",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["msg_get_reactions"],
                  message: 'This block must be inside a "for each reaction in a message" block',
                },
              ],
            },
          },
          {
            key: "count",
            label: "Reaction count",
            type: "Number",
            code: "reaction.count",
            block: {
              type: "msg_reaction_count",
              text: "amount of the reaction",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["msg_get_reactions"],
                  message: 'This block must be inside a "for each reaction in a message" block',
                },
              ],
            },
          },
          {
            key: "users",
            label: "People who reacted",
            type: "Array",
            code: "[...(await reaction.users.fetch()).values()]",
            block: {
              type: "msg_reaction_users",
              text: "members who reacted to the reaction",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["msg_get_reactions"],
                  message: 'This block must be inside a "for each reaction in a message" block',
                },
              ],
            },
          },
        ],
        contexts: ["loop"],
      },
    ],
    code: (ctx) => `for (const reaction of ${ctx.input("message")}.reactions.cache.values()) {
if (reaction.partial) await reaction.fetch();
${ctx.branch("code")}}\n`,
  }),
  action({
    id: "poll_send",
    label: "Send a poll to a channel",
    description: "Sends a poll with a question and answers people can vote on.",
    category: "polls",
    icon: "fa-solid fa-square-poll-horizontal",
    keywords: ["poll", "vote", "survey", "question"],
    inputs: [
      input.slot("CHANNEL", "Channel", "channel"),
      input.text("QUESTION", "Question", {
        default: "",
        placeholder: "What should we play?",
        maxLength: 300,
      }),
      input.group(
        "answers",
        "Answers",
        [
          input.text("TEXT", "Answer", { default: "", maxLength: 55 }),
          input.text("EMOJI", "Emoji (optional)", { default: "" }),
        ],
        { itemLabel: "Answer", maxItems: 10 },
      ),
      input.number("DURATION", "Open for (hours)", {
        default: 24,
        min: 1,
        max: 768,
      }),
      input.boolean("MULTISELECT", "Let people pick more than one answer", {
        default: false,
      }),
      input.text("MESSAGE", "Message text (optional)", { default: "" }),
    ],
    branches: [
      {
        key: "then",
        label: "After it's sent",
        optional: true,
        provides: [
          {
            key: "sent",
            label: "The poll message",
            type: "message",
            code: "messageSent",
          },
        ],
      },
    ],
    special: "poll",
    code: (ctx) => {
      const answers = ctx
        .group("answers")
        .map(
          (item) =>
            `{ text: ${item.input("TEXT")}${item.has("EMOJI") ? `, emoji: ${item.input("EMOJI")}` : ""} }`,
        );
      const content = ctx.has("MESSAGE") ? `content: ${ctx.input("MESSAGE")},\n` : "";
      const then = ctx.hasBranch("then")
        ? `.then(async (messageSent) => {\n${ctx.branch("then")}})`
        : "";
      return `await ${ctx.input("CHANNEL")}.send({
${content}poll: {
  question: { text: ${ctx.input("QUESTION")} },
  answers: [${answers.join(", ")}],
  duration: ${ctx.input("DURATION")},
  allowMultiselect: ${ctx.input("MULTISELECT")}
}
})${then};\n`;
    },
  }),
  action({
    id: "message_reply_to",
    label: "Reply to a chosen message",
    description: "Replies to any message, with a message you build.",
    category: "messages",
    group: "Sending",
    icon: "fa-solid fa-reply-all",
    keywords: ["reply", "respond"],
    block: {
      type: "cv2_replyToMsg",
      text: ["reply to message: {message}", "components: {components}"],
      parts: {
        message: { check: "message" },
        components: { part: "statement", check: "rootComponents" },
        files: { part: "statement", check: "files" },
      },
      tooltip: "Replies to any message using Components V2. Cannot use content or embeds.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message"],
          message: "You must specify the message to reply to",
        },
        {
          type: "notEmpty",
          blockTypes: ["components"],
          message: "You must add at least one component to the message",
        },
      ],
      mutator: {
        options: "cv2_replyToMsg_mutator",
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
            label: "include 'then'",
            inputType: "statement",
            inputLabel: "then:",
            valueCheck: "default",
          },
        ],
      },
    },
    special: "message",
    inputs: [
      input.slot("message", "Message to reply to", "message"),
      input.message("content", "Reply"),
    ],
    branches: [
      {
        key: "then",
        label: "After it's sent",
        optional: true,
        provides: [
          {
            key: "sent",
            label: "The reply",
            type: "message",
            code: "messageSent",
          },
        ],
      },
    ],
    code: (ctx) =>
      `await ${ctx.input("message")}.reply(${ctx.message("content")})${ctx.hasBranch("then") ? `.then(async (messageSent) => {\n${ctx.branch("then")}})` : ""};\n`,
  }),
];

const values = [
  value({
    id: "message_by_id",
    label: "Message by ID",
    description: "Finds a message in a channel from its ID.",
    category: "messages",
    group: "Finding",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["fetch message", "get message", "id"],
    block: {
      type: "msg_getone",
      text: ["get the message with id equal to {id}", "on the channel {channel}"],
      inline: false,
    },
    output: "message",
    inputs: [
      input.text("id", "Message ID", { default: "" }),
      input.slot("channel", "In channel", "channel"),
    ],
    code: (ctx) => `await ${ctx.input("channel")}.messages.fetch(${ctx.input("id")})`,
  }),
  value({
    id: "message_info",
    label: "Info about a message",
    description: "Something about a message: its text, who sent it, where, when, or its files.",
    category: "messages",
    group: "Reading",
    icon: "fa-solid fa-circle-info",
    keywords: ["content", "author", "channel", "attachments", "url", "id", "created"],
    block: {
      type: "message_property",
      text: "get {property} of {message}",
      parts: {
        property: {
          options: [
            ["content", "content"],
            ["files (list)", "attachments"],
            ["ID", "id"],
            ["author (member)", "member"],
            ["author (user)", "author"],
            ["channel", "channel"],
            ["server", "guild"],
            ["creation date", "createdAt"],
            ["URL", "url"],
          ],
        },
      },
      colour: "336EFF",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message"],
          message: "You must specify the message to get the properties from",
        },
      ],
      init: (block) =>
        block.setOnChange(() => {
          const types = {
            content: "String",
            id: "String",
            url: "String",
            member: "member",
            author: "user",
            channel: "channel",
            guild: "server",
            createdAt: "date",
            attachments: "Array",
          };
          block.setOutput(true, types[block.getFieldValue("property")] ?? null);
        }),
    },
    output: ANY,
    inputs: [
      input.dropdown(
        "property",
        "Get its",
        [
          ["Text", "content"],
          ["Attached files (list)", "attachments"],
          ["ID", "id"],
          ["Author (member)", "member"],
          ["Author (user)", "author"],
          ["Channel", "channel"],
          ["Server", "guild"],
          ["Date it was sent", "createdAt"],
          ["Link", "url"],
        ],
        { default: "content" },
      ),
      input.slot("message", "Message", "message"),
    ],
    sentence: "Message {property}",
    code: (ctx) =>
      ctx.raw("property") === "attachments"
        ? `[...${ctx.input("message")}.attachments.values()]`
        : `${ctx.input("message")}.${ctx.raw("property")}`,
  }),
  value({
    id: "message_reaction_info",
    label: "Reaction on a message",
    description: "How many people reacted to a message with an emoji, or who they were.",
    category: "messages",
    group: "Reactions",
    icon: "fa-solid fa-face-grin-stars",
    keywords: ["reaction count", "who reacted"],
    block: {
      type: "msg_reaction_property",
      text: ["get {property} of reaction {message}", "with emoji: {reaction}"],
      parts: {
        property: {
          options: [
            ["users", "users"],
            ["amount", "count"],
          ],
        },
      },
      inline: false,
      output: "Array",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message", "reaction"],
          message: "You must specify the reaction emoji and the message",
        },
      ],
      init: (block) =>
        block.setOnChange(() =>
          block.setOutput(true, block.getFieldValue("property") === "count" ? "Number" : "Array"),
        ),
    },
    output: ["Array", "Number"],
    inputs: [
      input.dropdown(
        "property",
        "Get the",
        [
          ["People who reacted (list)", "users"],
          ["Number of reactions", "count"],
        ],
        { default: "users" },
      ),
      input.slot("message", "Message", "message"),
      input.text("reaction", "Emoji", { default: "👍" }),
    ],
    code: (ctx) =>
      ctx.raw("property") === "count"
        ? `(${ctx.input("message")}.reactions.cache.get(${ctx.input("reaction")})?.count ?? 0)`
        : `[...((await ${ctx.input("message")}.reactions.cache.get(${ctx.input("reaction")})?.users.fetch())?.values() ?? [])]`,
  }),
  value({
    id: "message_is_reply",
    label: "Message is a reply?",
    description: "True if a message is a reply to another message.",
    category: "messages",
    group: "Replies",
    icon: "fa-solid fa-reply",
    keywords: ["reply", "reference"],
    block: {
      type: "msg_isReply",
      text: ["is {message}", "a reply?"],
      inline: true,
      tooltip: "Checks if a message is a reply to another message.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message"],
          message: "You must specify the message to check",
        },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) => `!!${ctx.input("message")}.reference`,
  }),
  value({
    id: "message_reply_pings",
    label: "Message's reply pings?",
    description: "True if a reply mentions (pings) the person it replies to.",
    category: "messages",
    group: "Replies",
    icon: "fa-solid fa-at",
    keywords: ["mention", "ping", "reply"],
    block: {
      type: "msg_replyPing",
      text: ["does {message}", "have reply ping?"],
      inline: true,
      tooltip: "Checks if a reply has the reply ping (mention author) activated.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message"],
          message: "You must specify the message to check",
        },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) => `!!${ctx.input("message")}.mentions.repliedUser`,
  }),
  value({
    id: "message_replied_to",
    label: "Message it replied to",
    description: "The message that a reply was answering.",
    category: "messages",
    group: "Replies",
    icon: "fa-solid fa-turn-up",
    keywords: ["reply", "original", "reference"],
    block: {
      type: "msg_replyTo",
      text: ["message that {message}", "replied to"],
      inline: true,
      tooltip: "Gets the message that a reply was replying to.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message"],
          message: "You must specify the message to check",
        },
      ],
    },
    output: "message",
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) =>
      `await ${ctx.input("message")}.channel.messages.fetch(${ctx.input("message")}.reference?.messageId)`,
  }),
];

const components = [];

const blocks = [
  block({
    type: "poll_create",
    element: "poll_send",
    text: [
      "create a poll named {NAME}",
      "set question to: {QUESTION}",
      "set duration (hours) to: {DURATION}",
      "allow multiple answers: {MULTISELECT}",
      "choices {CHOICES}",
    ],
    parts: {
      NAME: {
        part: "text",
        value: "poll",
        validator: (value) => value.replace(/[^a-zA-Z0-9_$]/g, ""),
      },
      QUESTION: { part: "value", check: "String" },
      DURATION: { part: "value", check: "Number" },
      MULTISELECT: { part: "value", check: "Boolean" },
      CHOICES: { part: "statement", check: "pollChoicesBlock" },
    },
    colour: "#656b75",
    tooltip: "Creates a new Discord poll.",
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["QUESTION"],
        check: (val) => val.length <= 300,
        message: "Question cannot be greater than 300 characters",
      },
      {
        type: "validator",
        blockTypes: ["DURATION"],
        check: (val) => 0 <= parseInt(val) && parseInt(val) <= 336,
        message: "Duration must be between 0 and 336 hours (2 weeks)",
      },
    ],
    code: (ctx) => `let PollCreator${ctx.field("NAME")} = {
  question: {
    text: ${ctx.code("QUESTION") || "''"}
  },
  answers: [${ctx.branch("CHOICES")}],
  duration: ${ctx.code("DURATION") || "24"},
  allowMultiselect: ${ctx.code("MULTISELECT") || "false"}
};\n`,
  }),
  block({
    type: "msg_reply_mutator",
    pings: true,
    text: ["reply to the message", "content: {content}"],
    parts: {
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
        type: "hasHat",
        blockTypes: ["msg_received", "message_author_not_bot", "msg_dm_received"],
        message: 'This block must be in a "when a message is received" event',
      },
      {
        type: "notEmpty",
        blockTypes: ["content", "embeds"],
        message: "You must specify the content and/or embed(s) to send",
      },
      {
        type: "validator",
        blockTypes: ["content"],
        check: (val) => val.length <= 2000,
        message: "Content cannot be greater than 2,000 characters",
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
      options: "msg_reply_mutator_options",
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
      const content = ctx.code("content") || "''";
      const embeds = ctx.code("embeds");
      const ephemeral = ctx.code("ephemeral");
      const rows = ctx.branch("rows");
      const files = ctx.branch("files");
      const then = ctx.branch("then");

      const options = buildMessageOptions({ allowedMentions: ctx.allowedMentions(),
        content,
        embeds,
        rows,
        files,
        ephemeral,
      });
      const thenCode = buildThenSuffix(then);

      return `await message.reply({\n  ${options.join(",\n  ")}\n})${thenCode}`;
    },
  }),
  block({
    type: "msg_edit_mutator",
    pings: true,
    text: ["edit message: {message}", "content: {content}"],
    parts: {
      message: { part: "value", check: "message" },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
      files: { part: "statement", check: "files" },
    },
    previous: "default",
    next: "default",
    mutator: {
      options: "msg_edit_mutator_options",
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
      const message = ctx.code("message");
      const content = ctx.code("content") || "''";
      const embeds = ctx.code("embeds");
      const ephemeral = ctx.code("ephemeral");
      const rows = ctx.branch("rows");
      const files = ctx.branch("files");

      const options = buildMessageOptions({ allowedMentions: ctx.allowedMentions(),
        content,
        embeds,
        rows,
        files,
        ephemeral,
      });

      return `await (${message}).edit({\n  ${options.join(",\n  ")}\n});\n`;
    },
  }),
  block({
    type: "msg_delete",
    text: "delete the user's message",
    colour: "336EFF",
    tooltip: "Delete the message received",
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["msg_received", "message_author_not_bot"],
        message: 'This block must be in a "when a message is received" event',
      },
    ],
    code: (ctx) => "message.delete();",
  }),
  block({
    type: "msg_edit",
    pings: true,
    text: [
      "edit message: {message}",
      "content: {content}",
      "embed name(s): {embeds}",
      "rows: {rows}",
    ],
    parts: {
      message: { part: "value", check: "message" },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
    },
    colour: "336EFF",
    tooltip: "Edits a message sent by the bot.",
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["msg_received", "message_author_not_bot", "msg_dm_received"],
        message: 'This block must be in a "when a message is received" event',
      },
      {
        type: "notEmpty",
        blockTypes: ["content", "embeds"],
        message: "You must specify the content and/or embed(s) to send",
      },
      {
        type: "validator",
        blockTypes: ["content"],
        check: (val) => val.length <= 2000,
        message: "Content cannot be greater than 2,000 characters",
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
      var message = ctx.code("message");
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");

      return `await (${message}).edit({
      ${ctx.allowedMentions()},
      content: ${content || "''"},
      embeds: [${formatEmbeds(embeds)}],
      components: [
      ${rows}]
    });\n`;
    },
  }),
  block({
    type: "poll_choice",
    text: ["create a choice", "with text: {TEXT}", "with emoji: {EMOJI}"],
    parts: {
      TEXT: { part: "value", check: "String" },
      EMOJI: { part: "value", check: ["String", "emoji"] },
    },
    colour: "#656b75",
    tooltip: "Creates a choice for a poll.",
    previous: "pollChoicesBlock",
    next: "pollChoicesBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["TEXT"],
        check: (val) => val.length <= 55,
        message: "Text cannot be greater than 55 characters",
      },
      {
        type: "validator",
        blockTypes: ["EMOJI"],
        check: (val) => /^(|([\p{Emoji}]{1}))$/u.test(val),
        message: "Emoji must be a single valid emoji",
      },
    ],
    code: (ctx) => {
      var value_text = ctx.code("TEXT");
      var value_emoji = ctx.code("EMOJI");

      return `{ text: ${value_text || "''"}, emoji: ${value_emoji || "null"}},\n`;
    },
  }),
  block({
    type: "poll_sendchannel",
    pings: true,
    text: ["send poll named: {NAME}", "to channel: {CHANNEL}", "with text: {MESSAGE}"],
    parts: {
      NAME: {
        part: "text",
        value: "poll",
        validator: (value) => value.replace(/[^a-zA-Z0-9_$]/g, ""),
      },
      CHANNEL: { part: "value", check: "channel" },
      MESSAGE: { part: "value", check: "String" },
    },
    colour: "#656b75",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["MESSAGE"],
        check: (val) => val.length <= 2000,
        message: "Text cannot be greater than 2,000 characters",
      },
    ],
    code: (ctx) => {
      var text_name = ctx.field("NAME");
      var value_channel = ctx.code("CHANNEL");
      var value_message = ctx.code("MESSAGE") || "";

      return `await ${value_channel}.send({
      ${ctx.allowedMentions()},
      content: ${value_message || "''"},
      poll: PollCreator${text_name}
    });\n`;
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
