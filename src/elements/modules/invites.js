import { group, input } from "../define.js";

const { event, action, value, block } = group({ colour: "#CA8A67" });

const events = [
  event({
    id: "invite_created_event",
    label: "When an invite is created",
    description: "Runs when someone makes an invite to a server the bot is in.",
    category: "invites",
    icon: "fa-solid fa-envelope-open-text",
    block: {
      type: "invite_invitecreated",
      text: "when an invite is created",
      body: { name: "code", check: "default" },
      inline: false,
      tooltip: "Runs the code inside when an invite is created.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["code"],
          message: "You must specify the code to run when an invite is created.",
        },
      ],
    },
    listen: "Discord.Events.InviteCreate",
    params: ["inviteEventCreateOrDelete"],
    values: [
      {
        key: "invite",
        label: "The invite",
        type: "invite",
        code: "inviteEventCreateOrDelete",
        block: {
          type: "invite_event_var",
          text: "the invite created/deleted",
          inline: false,
          output: "invite",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["invite_invitedeleted", "invite_invitecreated"],
              message: 'This block must be under a "when an invite is created/deleted" block',
            },
          ],
          also: ["invite_deleted_event"],
        },
      },
    ],
  }),
  event({
    id: "invite_deleted_event",
    label: "When an invite is deleted",
    description: "Runs when an invite to a server the bot is in is deleted or expires.",
    category: "invites",
    icon: "fa-solid fa-envelope-open-text",
    block: {
      type: "invite_invitedeleted",
      text: "when an invite is deleted",
      body: { name: "code", check: "default" },
      inline: false,
      tooltip: "Runs the code inside when an invite is deleted.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["code"],
          message: "You must specify the code to run when an invite is deleted.",
        },
      ],
    },
    listen: "Discord.Events.InviteDelete",
    params: ["inviteEventCreateOrDelete"],
    values: [
      {
        key: "invite",
        label: "The invite",
        type: "invite",
        code: "inviteEventCreateOrDelete",
      },
    ],
  }),
];

const actions = [
  action({
    id: "invite_each_in_server",
    label: "Repeat with each invite in a server",
    description: "Runs the steps inside once for every invite to a server.",
    category: "invites",
    icon: "fa-solid fa-repeat",
    block: {
      type: "invite_foreach",
      text: ["for each invite on server: {server}", "{code}"],
      parts: {
        server: { part: "value", check: "server" },
        code: { part: "statement", check: "default" },
      },
      previous: "default",
      next: "default",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to iterate invites from.",
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
            key: "invite",
            label: "Current invite",
            type: "invite",
            code: "inviteForEachInLoop",
            block: {
              type: "invite_foreach_var",
              text: "current invite on the loop",
              output: "invite",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["invite_channel_foreach", "invite_foreach"],
                  message: 'This block must be under a "for each invite on server/channel" block',
                },
              ],
              also: ["invite_each_in_channel"],
            },
          },
        ],
      },
    ],
    code: (ctx) =>
      `await forEachCollection(${ctx.input("server")}, "invites", async (inviteForEachInLoop) => {\n${ctx.branch("code")}});\n`,
  }),
  action({
    id: "invite_each_in_channel",
    label: "Repeat with each invite to a channel",
    description: "Runs the steps inside once for every invite to a channel.",
    category: "invites",
    icon: "fa-solid fa-repeat",
    block: {
      type: "invite_channel_foreach",
      text: ["for each invite on channel: {channel}", "{code}"],
      parts: {
        channel: { part: "value", check: "channel" },
        code: { part: "statement", check: "default" },
      },
      previous: "default",
      next: "default",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to iterate invites from.",
        },
      ],
    },
    inputs: [input.slot("channel", "Channel", "channel")],
    branches: [
      {
        key: "code",
        label: "Do",
        provides: [
          { key: "invite", label: "Current invite", type: "invite", code: "inviteForEachInLoop" },
        ],
      },
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.fetchInvites(true).then(async (allTheInvites) => {\nfor (const inviteForEachInLoop of allTheInvites.values()) {\n${ctx.branch("code")}}\n});\n`,
  }),
  action({
    id: "invite_delete",
    label: "Delete an invite",
    description: "Deletes an invite so its link stops working.",
    category: "invites",
    icon: "fa-solid fa-trash-can",
    block: {
      type: "invite_delete",
      text: "delete invite: {invite}",
      parts: { invite: { part: "value", check: "invite" } },
      tooltip: "Deletes an invite.",
      previous: "default",
      next: "default",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["invite"],
          message: "You must specify the invite to delete.",
        },
      ],
    },
    inputs: [input.slot("invite", "Invite", "invite")],
    code: (ctx) => `await ${ctx.input("invite")}.delete();\n`,
  }),
];

const values = [
  value({
    id: "invite_create",
    label: "New invite to a channel",
    description: "Makes an invite link to a channel that never expires.",
    category: "invites",
    icon: "fa-solid fa-envelope-open-text",
    block: {
      type: "invite_create",
      text: ["create invite for channel: {channel}", "amount of uses: {uses}"],
      parts: {
        channel: { part: "value", check: "channel" },
        uses: { part: "value", check: "Number" },
      },
      tooltip: "Creates an invite URL for a channel.",
      output: "invite",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to create the invite for.",
        },
        {
          type: "notEmpty",
          blockTypes: ["uses"],
          message: "You must specify the amount of uses for the invite.",
        },
      ],
    },
    output: "invite",
    inputs: [
      input.slot("channel", "Channel", "channel"),
      input.number("uses", "How many uses (0 for no limit)", { default: 0 }),
    ],
    code: (ctx) =>
      `(await ${ctx.input("channel")}.createInvite({ maxAge: 0, maxUses: ${ctx.has("uses") ? ctx.input("uses") : "null"}, unique: true }))`,
  }),
  value({
    id: "invite_from_link",
    label: "Invite from a link",
    description: "Looks up an invite from its link or code.",
    category: "invites",
    icon: "fa-solid fa-link",
    block: {
      type: "invite_get",
      text: "get invite with URL: {invite}",
      parts: { invite: { part: "value", check: "String" } },
      tooltip: "Gets an invite from an URL.",
      output: "invite",
      restrictions: [
        {
          type: "validator",
          blockTypes: ["invite"],
          check: (val) => {
            if (val === "") return true;
            try {
              new URL(val);
              return true;
            } catch (_) {
              return false;
            }
          },
          message: "You must include a valid URL",
        },
      ],
    },
    output: "invite",
    inputs: [
      input.text("invite", "Invite link", { default: "", placeholder: "https://discord.gg/..." }),
    ],
    code: (ctx) => `(await client.fetchInvite(${ctx.input("invite")}))`,
  }),
  value({
    id: "invite_link",
    label: "Invite link",
    description: "The link of an invite.",
    category: "invites",
    icon: "fa-solid fa-link",
    block: {
      type: "invite_url",
      text: "get url of invite: {invite}",
      parts: { invite: { part: "value", check: "invite" } },
      tooltip: "Gets the URL of an invite.",
      output: "String",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["invite"],
          message: "You must specify the invite to get the URL from.",
        },
      ],
    },
    output: "String",
    inputs: [input.slot("invite", "Invite", "invite")],
    code: (ctx) => `${ctx.input("invite")}.url`,
  }),
  value({
    id: "invite_channel",
    label: "Channel of an invite",
    description: "The channel an invite leads to.",
    category: "invites",
    icon: "fa-solid fa-hashtag",
    block: {
      type: "invite_channel",
      text: "get channel of invite: {invite}",
      parts: { invite: { part: "value", check: "invite" } },
      tooltip: "Gets the channel of an invite.",
      output: "channel",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["invite"],
          message: "You must specify the invite to get the channel from.",
        },
      ],
    },
    output: "channel",
    inputs: [input.slot("invite", "Invite", "invite")],
    code: (ctx) => `${ctx.input("invite")}.channel`,
  }),
  value({
    id: "invite_uses",
    label: "Invite uses",
    description: "How many times an invite has been used.",
    category: "invites",
    icon: "fa-solid fa-hashtag",
    block: {
      type: "invite_uses",
      text: "number of uses of invite: {invite}",
      parts: { invite: { part: "value", check: "invite" } },
      inline: true,
      tooltip: "The number of times an invite has been used.",
      output: "Number",
    },
    output: "Number",
    inputs: [input.slot("invite", "Invite", "invite")],
    code: (ctx) => `${ctx.input("invite")}.uses`,
  }),
  value({
    id: "invite_temporary",
    label: "Invite is temporary?",
    description: "Whether people who join with this invite are removed when they go offline.",
    category: "invites",
    icon: "fa-solid fa-hourglass",
    block: {
      type: "invite_temporary",
      text: ["invite: {invite}", "is temporary?"],
      parts: { invite: { part: "value", check: "invite" } },
      inline: true,
      tooltip: "Checks if an invite is temporary.",
      output: "Boolean",
    },
    output: "Boolean",
    inputs: [input.slot("invite", "Invite", "invite")],
    code: (ctx) => `${ctx.input("invite")}.temporary`,
  }),
  value({
    id: "invite_expires",
    label: "When an invite expires",
    description: "When an invite stops working, as a date or a timestamp.",
    category: "invites",
    icon: "fa-solid fa-calendar-xmark",
    block: {
      type: "invite_expiration",
      text: ["get expiration", "{typeOfExpiration}", "of invite: {invite}"],
      parts: {
        typeOfExpiration: {
          part: "dropdown",
          options: [
            ["date", "expiresAt"],
            ["timestamp", "expiresTimestamp"],
          ],
        },
        invite: { part: "value", check: "invite" },
      },
      inline: true,
      tooltip: "Gets the date/time an invite expires at.",
      output: "String",
    },
    output: "String",
    inputs: [
      input.dropdown(
        "typeOfExpiration",
        "As",
        [
          ["Date", "expiresAt"],
          ["Timestamp", "expiresTimestamp"],
        ],
        { default: "expiresAt", allowValues: false },
      ),
      input.slot("invite", "Invite", "invite"),
    ],
    code: (ctx) => `${ctx.input("invite")}.${ctx.raw("typeOfExpiration")}`,
  }),
  value({
    id: "invite_created_at",
    label: "When an invite was made",
    description: "When an invite was created, as a date or a timestamp.",
    category: "invites",
    icon: "fa-solid fa-calendar",
    block: {
      type: "invite_created",
      text: ["get created", "{typeOfCreated}", "of invite: {invite}"],
      parts: {
        typeOfCreated: {
          part: "dropdown",
          options: [
            ["date", "createdAt"],
            ["timestamp", "createdTimestamp"],
          ],
        },
        invite: { part: "value", check: "invite" },
      },
      inline: true,
      tooltip: "Gets the date/time an invite was created.",
      output: "String",
    },
    output: "String",
    inputs: [
      input.dropdown(
        "typeOfCreated",
        "As",
        [
          ["Date", "createdAt"],
          ["Timestamp", "createdTimestamp"],
        ],
        { default: "createdAt", allowValues: false },
      ),
      input.slot("invite", "Invite", "invite"),
    ],
    code: (ctx) => `${ctx.input("invite")}.${ctx.raw("typeOfCreated")}`,
  }),
  value({
    id: "invite_author",
    label: "Who made an invite",
    description: "The user that created an invite.",
    category: "invites",
    icon: "fa-solid fa-user",
    block: {
      type: "invite_author",
      text: "get author of invite: {invite}",
      parts: { invite: { part: "value", check: "invite" } },
      tooltip: "Gets the user that created the invite.",
      output: "user",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["invite"],
          message: "You must specify the invite to get the author from.",
        },
      ],
    },
    output: "user",
    inputs: [input.slot("invite", "Invite", "invite")],
    code: (ctx) => `${ctx.input("invite")}.inviter`,
  }),
];

const blocks = [
  block({
    type: "invite_createGuild",
    text: ["create invite for server: {guild}", "amount of uses: {uses}"],
    parts: { guild: { part: "value", check: "server" }, uses: { part: "value", check: "Number" } },
    tooltip: "Creates an invite URL for a server.",
    output: "invite",
    code: (ctx) => {
      const { Order } = ctx;
      var guild = ctx.code("guild");
      var uses = ctx.code("uses");

      const code = `await ${guild}.invites.create({ maxAge: 0, maxUses: ${
        uses || "null"
      }, unique: true })`;
      return [code, Order.AWAIT];
    },
    init: (block) =>
      block.setWarningText('This block is broken, use "create invite for channel" instead'),
  }),
];

export default { events, actions, values, blocks };
