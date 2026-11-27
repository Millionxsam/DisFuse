/* =====================================================================
   Builder catalog: threads
   ---------------------------------------------------------------------
   Threads: starting them from a message or in a channel, changing
   them, and reading their details. A thread is a kind of channel, so
   anything that takes a channel takes a thread too.
   ===================================================================== */

import { group, input } from "../define.js";

const { action, value } = group({ colour: "#5b67a5" });

const events = [];

const actions = [
  action({
    id: "thread_start_from_message",
    label: "Start a thread from a message",
    description: "Starts a public thread under a message.",
    category: "threads",
    group: "Starting",
    icon: "fa-solid fa-reply",
    keywords: ["create thread", "new thread", "reply thread"],
    block: {
      type: "threads_msgCreateThread",
      text: [
        "start a thread",
        "in the message: {message}",
        "name: {name}",
        "slowmode (seconds): {slowmode}",
        "type: {type}",
        "then: {then}",
      ],
      parts: {
        type: {
          part: "dropdown",
          options: [
            ["Public", "GUILD_PUBLIC_THREAD"],
            ["Private", "GUILD_PRIVATE_THREAD"],
          ],
        },
      },
      inline: false,
      previous: null,
      next: null,
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["message"],
          message: "You must specify what message to start a thread in",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 100,
          message: "Name cannot be greater than 100 characters",
        },
        {
          type: "notEmpty",
          blockTypes: ["name"],
          message: "You must specify the name of the thread",
        },
      ],
    },
    inputs: [
      input.slot("message", "From message", "message"),
      input.text("name", "Thread name", { default: "", maxLength: 100 }),
      input.number("slowmode", "Slowmode (seconds)", {
        optional: true,
        help: "How long people wait between messages. Leave it empty for none.",
        min: 0,
        max: 21600,
        integer: true,
      }),
    ],
    branches: [
      {
        key: "then",
        label: "After it's made",
        optional: true,
        provides: [
          {
            key: "thread",
            label: "New thread",
            type: "channel",
            code: "createdThread",
            block: {
              type: "threads_createdThread",
              text: "created thread",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["threads_msgCreateThread", "threads_channelCreateThread"],
                  message: "This block must be under a 'start a thread' block",
                },
              ],
              also: ["thread_start_in_channel"],
            },
          },
        ],
      },
    ],
    code: (ctx) => {
      const parts = [`name: ${ctx.input("name")}`];

      if (ctx.has("slowmode")) parts.push(`rateLimitPerUser: ${ctx.input("slowmode")}`);
      const call = `await ${ctx.input("message")}.startThread({ ${parts.join(", ")} })`;
      return ctx.hasBranch("then")
        ? `{\nconst createdThread = ${call};\n${ctx.branch("then")}}\n`
        : `${call};\n`;
    },
  }),
  action({
    id: "thread_start_in_channel",
    label: "Start a thread in a channel",
    description:
      "Starts a new thread in a text channel. Private threads are only seen by people added to them.",
    category: "threads",
    group: "Starting",
    icon: "fa-solid fa-comments",
    keywords: ["create thread", "new thread", "private thread"],
    block: {
      type: "threads_channelCreateThread",
      text: [
        "start a thread",
        "in the channel: {channel}",
        "name: {name}",
        "slowmode (seconds): {slowmode}",
        "type: {type}",
        "then: {then}",
      ],
      parts: {
        type: {
          options: [
            ["Public", "PublicThread"],
            ["Private", "PrivateThread"],
          ],
        },
      },
      inline: false,
      previous: null,
      next: null,
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify what channel to start a thread in",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 100,
          message: "Name cannot be greater than 100 characters",
        },
        {
          type: "notEmpty",
          blockTypes: ["name"],
          message: "You must specify the name of the thread",
        },
      ],
    },
    inputs: [
      input.slot("channel", "In channel", "channel"),
      input.text("name", "Thread name", { default: "", maxLength: 100 }),
      input.dropdown(
        "type",
        "Who can see it",
        [
          ["Everyone (public)", "PublicThread"],
          ["Only people added (private)", "PrivateThread"],
        ],
        { default: "PublicThread" },
      ),
      input.number("slowmode", "Slowmode (seconds)", {
        optional: true,
        help: "How long people wait between messages. Leave it empty for none.",
        min: 0,
        max: 21600,
        integer: true,
      }),
    ],
    branches: [
      {
        key: "then",
        label: "After it's made",
        optional: true,
        provides: [{ key: "thread", label: "New thread", type: "channel", code: "createdThread" }],
      },
    ],
    code: (ctx) => {
      const parts = [`name: ${ctx.input("name")}`];
      parts.push(
        `type: Discord.ChannelType.${ctx.raw("type") === "PrivateThread" ? "PrivateThread" : "PublicThread"}`,
      );
      if (ctx.has("slowmode")) parts.push(`rateLimitPerUser: ${ctx.input("slowmode")}`);
      const call = `await ${ctx.input("channel")}.threads.create({ ${parts.join(", ")} })`;
      return ctx.hasBranch("then")
        ? `{\nconst createdThread = ${call};\n${ctx.branch("then")}}\n`
        : `${call};\n`;
    },
  }),
  action({
    id: "thread_rename",
    label: "Rename a thread",
    description: "Changes a thread's name.",
    category: "threads",
    group: "Changing",
    icon: "fa-solid fa-signature",
    keywords: ["rename", "thread name"],
    block: {
      type: "threads_setName",
      text: ["rename thread: {thread}", "to: {name}"],
      previous: null,
      next: null,
      restrictions: [
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 100,
          message: "Name cannot be greater than 100 characters",
        },
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
        {
          type: "notEmpty",
          blockTypes: ["name"],
          message: "You must specify the new name for the thread",
        },
      ],
    },
    inputs: [
      input.slot("thread", "Thread", "channel"),
      input.text("name", "New name", { default: "", maxLength: 100 }),
    ],
    code: (ctx) => `await ${ctx.input("thread")}.setName(${ctx.input("name")});\n`,
  }),
  action({
    id: "thread_archive",
    label: "Archive or reopen a thread",
    description: "Archives a thread (hides it from the channel list) or brings it back.",
    category: "threads",
    group: "Changing",
    icon: "fa-solid fa-box-archive",
    keywords: ["archive", "close thread", "unarchive"],
    block: {
      type: "threads_setArchived",
      text: ["set archived status of thread: {thread}", "to: {archived}"],
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
        {
          type: "notEmpty",
          blockTypes: ["locked", "archived"],
          message: "You must specify the locked or archived status",
        },
      ],
    },
    inputs: [
      input.slot("thread", "Thread", "channel"),
      input.boolean("archived", "Archived", { default: true }),
    ],
    code: (ctx) => `await ${ctx.input("thread")}.setArchived(${ctx.input("archived")});\n`,
  }),
  action({
    id: "thread_lock",
    label: "Lock or unlock a thread",
    description: "A locked thread can only be reopened by people who can manage threads.",
    category: "threads",
    group: "Changing",
    icon: "fa-solid fa-lock",
    keywords: ["lock", "unlock"],
    block: {
      type: "threads_setLocked",
      text: ["set locked status of thread: {thread}", "to: {locked}"],
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
        {
          type: "notEmpty",
          blockTypes: ["locked", "archived"],
          message: "You must specify the locked or archived status",
        },
      ],
    },
    inputs: [
      input.slot("thread", "Thread", "channel"),
      input.boolean("locked", "Locked", { default: true }),
    ],
    code: (ctx) => `await ${ctx.input("thread")}.setLocked(${ctx.input("locked")});\n`,
  }),
  action({
    id: "thread_slowmode",
    label: "Set a thread's slowmode",
    description: "How long people have to wait between messages in a thread. 0 turns it off.",
    category: "threads",
    group: "Changing",
    icon: "fa-solid fa-hourglass-half",
    keywords: ["slowmode", "rate limit", "cooldown"],
    block: {
      type: "threads_setSlowmode",
      text: ["set slowmode of thread: {thread}", "slowmode (seconds): {slowmode}"],
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
        {
          type: "notEmpty",
          blockTypes: ["slowmode"],
          message: "You must specify the slowmode duration",
        },
        {
          type: "validator",
          blockTypes: ["slowmode"],
          check: (val) => 0 <= parseInt(val) && parseInt(val) <= 21600,
          message: "Slowmode must be between 0 and 21,600 seconds",
        },
      ],
    },
    inputs: [
      input.slot("thread", "Thread", "channel"),
      input.number("slowmode", "Slowmode (seconds)", {
        default: 0,
        min: 0,
        max: 21600,
        integer: true,
      }),
    ],
    code: (ctx) => `await ${ctx.input("thread")}.setRateLimitPerUser(${ctx.input("slowmode")});\n`,
  }),
  action({
    id: "thread_pin",
    label: "Pin a forum post",
    description: "Pins a post to the top of its forum channel.",
    category: "threads",
    group: "Changing",
    icon: "fa-solid fa-thumbtack",
    keywords: ["pin", "forum"],
    block: {
      type: "threads_pin",
      text: "pin thread: {thread}",
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `await ${ctx.input("thread")}.pin();\n`,
  }),
  action({
    id: "thread_unpin",
    label: "Unpin a forum post",
    description: "Unpins a post in a forum channel.",
    category: "threads",
    group: "Changing",
    icon: "fa-solid fa-thumbtack fa-rotate-180",
    keywords: ["unpin", "forum"],
    block: {
      type: "threads_unpin",
      text: "unpin thread: {thread}",
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `await ${ctx.input("thread")}.unpin();\n`,
  }),
  action({
    id: "thread_join",
    label: "Join a thread",
    description: "Makes the bot join a thread so it gets its messages.",
    category: "threads",
    group: "Members",
    icon: "fa-solid fa-right-to-bracket",
    keywords: ["join"],
    block: {
      type: "threads_join",
      text: "join thread: {thread}",
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `await ${ctx.input("thread")}.join();\n`,
  }),
  action({
    id: "thread_leave",
    label: "Leave a thread",
    description: "Makes the bot leave a thread.",
    category: "threads",
    group: "Members",
    icon: "fa-solid fa-right-from-bracket",
    keywords: ["leave"],
    block: {
      type: "threads_leave",
      text: "leave thread: {thread}",
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `await ${ctx.input("thread")}.leave();\n`,
  }),
  action({
    id: "thread_add_user",
    label: "Add someone to a thread",
    description: "Adds a person to a thread. This is how people get into private threads.",
    category: "threads",
    group: "Members",
    icon: "fa-solid fa-user-plus",
    keywords: ["add member", "invite to thread"],
    block: {
      type: "threads_addUser",
      text: ["add user: {user}", "to thread: {thread}"],
      parts: { user: { check: "user" } },
      tooltip: "Add a user to a thread.",
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
        { type: "notEmpty", blockTypes: ["user"], message: "You must specify the user" },
      ],
    },
    inputs: [
      input.slot("user", "Person", ["user", "member"]),
      input.slot("thread", "To thread", "channel"),
    ],
    code: (ctx) => `await ${ctx.input("thread")}.members.add(${ctx.input("user")});\n`,
  }),
  action({
    id: "thread_remove_user",
    label: "Remove someone from a thread",
    description: "Takes a person out of a thread.",
    category: "threads",
    group: "Members",
    icon: "fa-solid fa-user-minus",
    keywords: ["remove member", "kick from thread"],
    block: {
      type: "threads_removeUser",
      text: ["remove user: {user}", "from thread: {thread}"],
      parts: { user: { check: "user" } },
      tooltip: "Remove a user from a thread.",
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
        { type: "notEmpty", blockTypes: ["user"], message: "You must specify the user" },
      ],
    },
    inputs: [
      input.slot("user", "Person", ["user", "member"]),
      input.slot("thread", "From thread", "channel"),
    ],
    code: (ctx) => `await ${ctx.input("thread")}.members.remove(${ctx.input("user")});\n`,
  }),
  action({
    id: "thread_delete",
    label: "Delete a thread",
    description: "Deletes a thread and every message in it.",
    category: "threads",
    group: "Changing",
    icon: "fa-solid fa-trash-can",
    keywords: ["delete", "remove"],
    block: {
      type: "threads_delete",
      text: "delete thread {thread}",
      tooltip: "Deletes a specified thread.",
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `await ${ctx.input("thread")}.delete();\n`,
  }),
];

const values = [
  value({
    id: "thread_find",
    label: "Thread by name or ID",
    description: "Finds an active thread in a channel by its name or ID.",
    category: "threads",
    group: "Finding",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["get thread", "find thread"],
    block: {
      type: "threads_getone",
      text: ["get the thread with the {type} equal to {value}", "in the channel {channel}"],
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
      input.slot("channel", "In channel", "channel"),
    ],
    code: (ctx) =>
      ctx.raw("type") === "id"
        ? `${ctx.input("channel")}.threads.cache.get(${ctx.input("value")})`
        : `${ctx.input("channel")}.threads.cache.find((t) => t.name == ${ctx.input("value")})`,
  }),
  value({
    id: "thread_message_has",
    label: "Message has a thread?",
    description: "True if a thread was started from a message.",
    category: "threads",
    group: "Messages",
    icon: "fa-solid fa-comments",
    keywords: ["has thread"],
    block: {
      type: "threads_msgHasThread",
      text: ["does message {message}", "have a thread?"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["message"], message: "You must specify the message" },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) => `${ctx.input("message")}.hasThread`,
  }),
  value({
    id: "thread_of_message",
    label: "Thread started from a message",
    description: "The thread that was started from a message, if there is one.",
    category: "threads",
    group: "Messages",
    icon: "fa-solid fa-reply",
    keywords: ["message thread"],
    block: {
      type: "threads_msgThread",
      text: "get thread of message: {message}",
      restrictions: [
        { type: "notEmpty", blockTypes: ["message"], message: "You must specify the message" },
      ],
    },
    output: "channel",
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) => `${ctx.input("message")}.thread`,
  }),
  value({
    id: "thread_name",
    label: "Thread name",
    description: "A thread's name.",
    category: "threads",
    group: "About a thread",
    icon: "fa-solid fa-signature",
    keywords: ["name"],
    block: {
      type: "threads_name",
      text: "name of thread: {thread}",
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    output: "String",
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `${ctx.input("thread")}.name`,
  }),
  value({
    id: "thread_created",
    label: "When the thread was made",
    description: "The date a thread was started.",
    category: "threads",
    group: "About a thread",
    icon: "fa-solid fa-calendar-plus",
    keywords: ["created"],
    block: { type: "threads_createdAt", text: "creation date of thread: {thread}" },
    output: "date",
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `${ctx.input("thread")}.createdAt`,
  }),
  value({
    id: "thread_last_message",
    label: "Last message in a thread",
    description: "The newest message in a thread the bot has seen.",
    category: "threads",
    group: "About a thread",
    icon: "fa-solid fa-message",
    keywords: ["last message", "latest"],
    block: { type: "threads_lastMessage", text: "last message of thread: {thread}" },
    output: "message",
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `${ctx.input("thread")}.lastMessage`,
  }),
  value({
    id: "thread_owner",
    label: "Who started the thread",
    description: "The user who started a thread.",
    category: "threads",
    group: "About a thread",
    icon: "fa-solid fa-user",
    keywords: ["author", "owner", "creator"],
    block: {
      type: "threads_author",
      text: "author of thread: {thread}",
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    output: "user",
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `(await ${ctx.input("thread")}.fetchOwner())?.user`,
  }),
  value({
    id: "thread_owner_member",
    label: "Who started the thread (as a member)",
    description: "The member who started a thread.",
    category: "threads",
    group: "About a thread",
    icon: "fa-solid fa-user-tag",
    keywords: ["author", "owner", "creator"],
    block: {
      type: "threads_authorMember",
      text: "author member of thread: {thread}",
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    output: "member",
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `(await ${ctx.input("thread")}.fetchOwner())?.guildMember`,
  }),
  value({
    id: "thread_id",
    label: "Thread ID",
    description: "A thread's ID.",
    category: "threads",
    group: "About a thread",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id"],
    block: {
      type: "threads_id",
      text: "ID of thread: {thread}",
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    output: "String",
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `${ctx.input("thread")}.id`,
  }),
  value({
    id: "thread_member_count",
    label: "Number of people in a thread",
    description: "How many people have joined a thread.",
    category: "threads",
    group: "About a thread",
    icon: "fa-solid fa-users",
    keywords: ["member count", "members"],
    block: {
      type: "threads_memberCount",
      text: "number of members in thread: {thread}",
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    output: "Number",
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `((await ${ctx.input("thread")}.members.fetch())?.size ?? 0)`,
  }),
  value({
    id: "thread_parent",
    label: "Channel of a thread",
    description: "The channel a thread is in.",
    category: "threads",
    group: "About a thread",
    icon: "fa-solid fa-hashtag",
    keywords: ["parent", "channel"],
    block: {
      type: "threads_parentChannel",
      text: "parent channel of thread: {thread}",
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    output: "channel",
    inputs: [input.slot("thread", "Thread", "channel")],
    code: (ctx) => `${ctx.input("thread")}.parent`,
  }),
  value({
    id: "thread_message_in",
    label: "Message is in a thread?",
    description: "True if a message was sent in a thread, or has a thread started from it.",
    category: "threads",
    group: "Messages",
    icon: "fa-solid fa-comment-dots",
    keywords: ["in thread"],
    block: {
      type: "threads_msgInThread",
      text: ["is {message}", "in a thread?"],
      inline: true,
      tooltip:
        "Checks if a message is in a thread. A message starting a thread is counted as being in the thread.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["message"], message: "You must specify the message" },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) =>
      `(${ctx.input("message")}.channel.isThread() || ${ctx.input("message")}.hasThread)`,
  }),
  value({
    id: "thread_message_thread",
    label: "Thread of a message",
    description: "The thread a message was sent in, or else the thread started from it.",
    category: "threads",
    group: "Messages",
    icon: "fa-solid fa-comments",
    keywords: ["thread of message"],
    block: {
      type: "threads_getThread",
      text: ["thread that message {message}", "is in"],
      inline: true,
      tooltip:
        "Gets the thread that a message is in. Works for messages sent in threads and messages that started a thread.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["message"], message: "You must specify the message" },
      ],
    },
    output: "channel",
    inputs: [input.slot("message", "Message", "message")],
    code: (ctx) =>
      `(${ctx.input("message")}.channel.isThread() ? ${ctx.input("message")}.channel : ${ctx.input("message")}.thread)`,
  }),
  value({
    id: "thread_is",
    label: "Thread is locked or archived?",
    description: "True if a thread is locked, or archived, depending on what you pick.",
    category: "threads",
    group: "About a thread",
    icon: "fa-solid fa-lock",
    keywords: ["locked", "archived", "status"],
    block: {
      type: "threads_isStatus",
      text: ["is thread {thread}", '{""} {status}', "?"],
      parts: {
        status: {
          options: [
            ["locked", "locked"],
            ["archived", "archived"],
          ],
        },
      },
      inline: true,
      tooltip: "Checks if a thread is locked or archived.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["thread"], message: "You must specify the thread" },
      ],
    },
    output: "Boolean",
    inputs: [
      input.slot("thread", "Thread", "channel"),
      input.dropdown(
        "status",
        "Is it",
        [
          ["Locked", "locked"],
          ["Archived", "archived"],
        ],
        { default: "locked" },
      ),
    ],
    code: (ctx) =>
      `${ctx.input("thread")}.${ctx.raw("status") === "archived" ? "archived" : "locked"}`,
  }),
];

const components = [];

export default {
  events,
  actions,
  values,
  components,
  contexts: [],
};
