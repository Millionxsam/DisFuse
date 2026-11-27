/* =====================================================================
   Builder catalog: servers, boosts and webhooks
   ---------------------------------------------------------------------
   The servers the bot is in: going through them, reading their
   details (name, icon, member count, boosts) and changing a few
   settings. Also webhooks, which post messages under any name and
   picture you like.
   ===================================================================== */

import { group, input } from "../define.js";

const { action, value } = group({ colour: "#A33DAC" });

/* discord.js gives a server's boost level as a number (0 to 3), older
   versions as a name ("Tier1"). Always a number. */
const boostLevelCode = (server) =>
  `({ None: 0, Tier1: 1, Tier2: 2, Tier3: 3 }[${server}.premiumTier] ?? ${server}.premiumTier)`;

const events = [];

const actions = [
  action({
    id: "server_each",
    label: "Repeat with each server the bot is in",
    description: "Runs the steps inside once for every server the bot is in.",
    category: "servers",
    group: "Finding",
    icon: "fa-solid fa-server",
    keywords: ["for each", "loop", "all servers", "guilds"],
    block: {
      type: "server_getall",
      text: ["for each server the bot is in", "{code}"],
      parts: { code: { check: "default" } },
    },
    branches: [
      {
        key: "code",
        label: "Do",
        provides: [
          {
            key: "server",
            label: "Current server",
            type: "server",
            code: "guild",
            block: {
              type: "server_guild",
              text: "current server in the loop",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["server_getall"],
                  message: 'This block must be under the "For each server the bot is in" block',
                },
              ],
            },
          },
        ],
      },
    ],
    code: (ctx) =>
      `await forEachCollection(client, "guilds", async (guild) => {\n${ctx.branch("code")}});\n`,
  }),
  action({
    id: "server_pause_invites",
    label: "Pause or resume a server's invites",
    description: "Stops people from joining a server with invites, or lets them join again.",
    category: "servers",
    group: "Changing",
    icon: "fa-solid fa-door-closed",
    keywords: ["disable invites", "lockdown", "pause invites", "raid"],
    block: {
      type: "server_disableinvites",
      text: "{disabled} invites on server: {server}",
      parts: {
        disabled: {
          options: [
            ["Disable", "true"],
            ["Enable", "false"],
          ],
        },
      },
    },
    inputs: [
      input.dropdown(
        "disabled",
        "Invites",
        [
          ["Pause", "true"],
          ["Resume", "false"],
        ],
        { default: "true" },
      ),
      input.slot("server", "Server", "server"),
    ],
    code: (ctx) =>
      `await ${ctx.input("server")}.disableInvites(${ctx.raw("disabled") === "true"});\n`,
  }),
  action({
    id: "server_leave",
    label: "Leave a server",
    description: "Makes the bot leave a server. It will need a new invite to come back.",
    category: "servers",
    group: "Changing",
    icon: "fa-solid fa-right-from-bracket",
    keywords: ["leave", "quit", "exit"],
    block: { type: "server_leave", text: "leave server: {server}" },
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `await ${ctx.input("server")}.leave();\n`,
  }),
  action({
    id: "server_boost_bar",
    label: "Show or hide a server's boost bar",
    description: "Turns the boost progress bar at the top of the channel list on or off.",
    category: "boosts",
    group: "Boosts",
    icon: "fa-solid fa-bars-progress",
    keywords: ["boost", "progress bar", "nitro"],
    block: {
      type: "boost_setProgressBar",
      text: ["show the boost progress bar of server: {server}", "set to {enabled}"],
      inline: true,
      tooltip: "Enable or disable the boost progress bar on the server",
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
        {
          type: "notEmpty",
          blockTypes: ["enabled"],
          message: "You must specify whether to show the progress bar",
        },
      ],
    },
    inputs: [
      input.slot("server", "Server", "server"),
      input.boolean("enabled", "Show it", { default: true }),
    ],
    code: (ctx) =>
      `await ${ctx.input("server")}.setPremiumProgressBarEnabled(${ctx.input("enabled")});\n`,
  }),
  action({
    id: "webhook_create",
    label: "Create a webhook",
    description:
      "Makes a webhook in a channel. A webhook posts messages under its own name and picture.",
    category: "webhooks",
    group: "Webhooks",
    icon: "fa-solid fa-link",
    keywords: ["webhook", "create webhook", "new webhook"],
    block: {
      type: "webhooks_create",
      text: [
        "create a webhook with the name: {name}",
        "avatar URL: {avatar}",
        "in channel: {channel}",
        "then {code}",
      ],
      parts: { code: { check: "default" } },
      colour: "#4f85db",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["channel"],
          message: "You must specify the channel to create the webhook in",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 80,
          message: "Name cannot be greater than 80 characters",
        },
        {
          type: "validator",
          blockTypes: ["avatar"],
          check: (val) => {
            if (val === "") return true;
            try {
              new URL(val);
              return true;
            } catch (_) {
              return false;
            }
          },
          message: "Avatar URL must be a valid URL",
        },
      ],
    },
    inputs: [
      input.text("name", "Name", { default: "", maxLength: 80 }),
      input.text("avatar", "Picture link (optional)", { default: "", placeholder: "https://..." }),
      input.slot("channel", "In channel", "channel"),
    ],
    branches: [
      {
        key: "code",
        label: "After it's made",
        optional: true,
        provides: [
          {
            key: "webhook",
            label: "New webhook",
            type: "webhook",
            code: "newWebhook",
            block: {
              type: "webhooks_createdWebhook",
              text: "created webhook",
              colour: "#4f85db",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["webhooks_create"],
                  message: "This block must be under the 'Create a webhook' block",
                },
              ],
            },
          },
        ],
      },
    ],
    code: (ctx) =>
      `await ${ctx.input("channel")}.createWebhook({ name: ${ctx.input("name")}${ctx.has("avatar") ? `, avatar: ${ctx.input("avatar")}` : ""} })${ctx.hasBranch("code") ? `.then(async (newWebhook) => {\n${ctx.branch("code")}})` : ""};\n`,
  }),
  action({
    id: "webhook_send",
    label: "Send a message with a webhook",
    description:
      "Posts a message through a webhook. You can change the name and picture it shows for this message.",
    category: "webhooks",
    group: "Webhooks",
    icon: "fa-solid fa-paper-plane",
    keywords: ["webhook", "send", "post", "fake user"],
    block: {
      type: "webhooks_send",
      pings: true,
      text: ["send a message as webhook: {webhook}", "content: {content}"],
      colour: "#4f85db",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["content"],
          message: "You must specify the content to send",
        },
        {
          type: "validator",
          blockTypes: ["content"],
          check: (val) => val.length <= 2000,
          message: "Content cannot be greater than 2,000 characters",
        },
        { type: "notEmpty", blockTypes: ["webhook"], message: "You must specify the webhook" },
      ],
    },
    inputs: [
      input.slot("webhook", "Webhook", "webhook"),
      input.text("content", "Message", { default: "", multiline: true, maxLength: 2000 }),
      input.text("username", "Name to show (optional)", { default: "", maxLength: 80 }),
      input.text("avatar", "Picture link to show (optional)", {
        default: "",
        placeholder: "https://...",
      }),
    ],
    code: (ctx) => {
      const parts = [`content: ${ctx.input("content")}`];
      if (ctx.has("username")) parts.push(`username: ${ctx.input("username")}`);
      if (ctx.has("avatar")) parts.push(`avatarURL: ${ctx.input("avatar")}`);
      parts.push(ctx.allowedMentions());
      return `await ${ctx.input("webhook")}.send({ ${parts.join(", ")} });\n`;
    },
  }),
  action({
    id: "webhook_delete",
    label: "Delete a webhook",
    description: "Deletes a webhook. Messages it already sent stay.",
    category: "webhooks",
    group: "Webhooks",
    icon: "fa-solid fa-trash-can",
    keywords: ["webhook", "delete", "remove"],
    block: {
      type: "webhooks_delete",
      text: "delete the webhook: {webhook}",
      colour: "#4f85db",
      restrictions: [
        { type: "notEmpty", blockTypes: ["webhook"], message: "You must specify the webhook" },
      ],
    },
    inputs: [input.slot("webhook", "Webhook", "webhook")],
    code: (ctx) => `await ${ctx.input("webhook")}.delete();\n`,
  }),
  action({
    id: "webhook_edit",
    label: "Edit a webhook's name or picture",
    description: "Changes a webhook's name or picture. Leave a box empty to keep it as it is.",
    category: "webhooks",
    group: "Webhooks",
    icon: "fa-solid fa-pen",
    keywords: ["webhook", "edit", "rename", "avatar"],
    block: {
      type: "webhooks_edit",
      text: [
        "edit the webhook: {webhook}",
        "with new name: {name}",
        "and new avatar URL: {avatar}",
      ],
      colour: "#4f85db",
      inline: false,
      restrictions: [
        { type: "notEmpty", blockTypes: ["webhook"], message: "You must specify the webhook" },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 80,
          message: "Name cannot be greater than 80 characters",
        },
        {
          type: "validator",
          blockTypes: ["avatar"],
          check: (val) => {
            if (val === "") return true;
            try {
              new URL(val);
              return true;
            } catch (_) {
              return false;
            }
          },
          message: "Avatar URL must be a valid URL",
        },
      ],
    },
    inputs: [
      input.slot("webhook", "Webhook", "webhook"),
      input.text("name", "New name", { default: "", maxLength: 80 }),
      input.text("avatar", "New picture link", { default: "", placeholder: "https://..." }),
    ],
    code: (ctx) => {
      const parts = [];
      if (ctx.has("name")) parts.push(`name: ${ctx.input("name")}`);
      if (ctx.has("avatar")) parts.push(`avatar: ${ctx.input("avatar")}`);
      return parts.length ? `await ${ctx.input("webhook")}.edit({ ${parts.join(", ")} });\n` : "";
    },
  }),
];

const values = [
  value({
    id: "server_find",
    label: "Server by name or ID",
    description: "Finds a server the bot is in by its name or ID.",
    category: "servers",
    group: "Finding",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["get server", "find server", "guild", "server id"],
    block: {
      type: "server_getone",
      text: ["get the server with the {type} equal to", "{value}"],
      parts: {
        type: {
          options: [
            ["name", "name"],
            ["id", "id"],
          ],
        },
        value: { check: null },
      },
      inline: true,
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["value"],
          message: "You must specify a value to search for",
        },
      ],
    },
    output: "server",
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
    ],
    code: (ctx) =>
      ctx.raw("type") === "id"
        ? `client.guilds.cache.get(${ctx.input("value")})`
        : `client.guilds.cache.find((s) => s.name === ${ctx.input("value")})`,
  }),
  value({
    id: "server_name",
    label: "Server name",
    description: "The name of a server.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-signature",
    keywords: ["name", "guild name"],
    block: {
      type: "server_name",
      text: "name of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "String",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.name`,
  }),
  value({
    id: "server_member_count",
    label: "Server's number of members",
    description: "How many members a server has, bots included.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-users",
    keywords: ["member count", "members", "size"],
    block: {
      type: "server_membercount",
      text: "number of members of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "Number",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.memberCount`,
  }),
  value({
    id: "server_id",
    label: "Server ID",
    description: "A server's ID.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id", "guild id"],
    block: {
      type: "server_id",
      text: "ID of server: {server}",
      inline: true,
      output: ["String", "Number"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "String",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.id`,
  }),
  value({
    id: "server_banner",
    label: "Server banner link",
    description: "A link to a server's banner image. Empty if it doesn't have one.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-panorama",
    keywords: ["banner"],
    block: {
      type: "server_banner",
      text: "banner URL of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "String",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.bannerURL()`,
  }),
  value({
    id: "server_icon",
    label: "Server icon link",
    description: "A link to a server's icon. Empty if it doesn't have one.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-image",
    keywords: ["icon", "picture", "logo"],
    block: {
      type: "server_icon",
      text: "icon URL of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "String",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.iconURL()`,
  }),
  value({
    id: "server_owner_id",
    label: "Server owner's ID",
    description: "The ID of the person who owns a server.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-crown",
    keywords: ["owner", "owner id"],
    block: {
      type: "server_ownerid",
      text: "owner ID of server: {server}",
      inline: true,
      output: ["String", "Number"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "String",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.ownerId`,
  }),
  value({
    id: "server_description",
    label: "Server description",
    description: "A server's description. Only community servers have one.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-align-left",
    keywords: ["description", "about"],
    block: {
      type: "server_dsc",
      text: "description of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "String",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.description`,
  }),
  value({
    id: "server_afk_channel",
    label: "Server's AFK channel",
    description: "The voice channel where idle members get moved.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-moon",
    keywords: ["afk", "idle"],
    block: {
      type: "server_afkchannel",
      text: "AFK channel of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "channel",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.afkChannel`,
  }),
  value({
    id: "server_created",
    label: "When the server was made",
    description: "The date a server was created.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-cake-candles",
    keywords: ["created", "creation date", "age"],
    block: {
      type: "server_creationdate",
      text: "creation date of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "date",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.createdAt`,
  }),
  value({
    id: "server_vanity_code",
    label: "Server's custom invite code",
    description:
      "The code of a server's custom invite link (the part after discord.gg/). Empty if it doesn't have one.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-link",
    keywords: ["vanity", "vanity url", "custom invite"],
    block: {
      type: "server_vanityurl",
      text: "vanity URL of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "String",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.vanityURLCode`,
  }),
  value({
    id: "server_system_channel",
    label: "Server's system messages channel",
    description: "The channel where Discord posts welcome and boost messages.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-bullhorn",
    keywords: ["system channel", "welcome channel"],
    block: {
      type: "server_systemchannel",
      text: "system channel of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "channel",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.systemChannel`,
  }),
  value({
    id: "server_rules_channel",
    label: "Server's rules channel",
    description: "A community server's rules channel.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-scale-balanced",
    keywords: ["rules"],
    block: {
      type: "server_ruleschannel",
      text: "rules channel of server: {server}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "channel",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.rulesChannel`,
  }),
  value({
    id: "server_is_verified",
    label: "Server is verified?",
    description: "True if Discord has verified a server.",
    category: "servers",
    group: "About a server",
    icon: "fa-solid fa-circle-check",
    keywords: ["verified"],
    block: {
      type: "server_verified",
      text: ["server {server}", "is verified?"],
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.verified`,
  }),
  value({
    id: "server_boost_count",
    label: "Server's number of boosts",
    description: "How many boosts a server has.",
    category: "boosts",
    group: "Boosts",
    icon: "fa-solid fa-gem",
    keywords: ["boosts", "boost count", "nitro"],
    block: {
      type: "boost_count",
      text: "number of boosts of server: {server}",
      inline: true,
      tooltip: "Returns the number of active boosts the server has",
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "Number",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.premiumSubscriptionCount`,
  }),
  value({
    id: "server_boost_level",
    label: "Server's boost level",
    description: "A server's boost level, from 0 to 3.",
    category: "boosts",
    group: "Boosts",
    icon: "fa-solid fa-ranking-star",
    keywords: ["boost level", "tier", "nitro"],
    block: {
      type: "boost_level",
      text: "boost level of server: {server}",
      inline: true,
      tooltip: "0 = no boosts, 1 = tier 1, 2 = tier 2, 3 = tier 3",
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "Number",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => boostLevelCode(ctx.input("server")),
  }),
  value({
    id: "server_boost_bar_shown",
    label: "Server's boost bar is shown?",
    description: "True if a server shows the boost progress bar.",
    category: "boosts",
    group: "Boosts",
    icon: "fa-solid fa-bars-progress",
    keywords: ["boost", "progress bar"],
    block: {
      type: "boost_progressBar",
      text: ["server {server}", "has the boost progress bar enabled?"],
      inline: true,
      tooltip: "Returns whether the server shows the boost progress bar",
      restrictions: [
        { type: "notEmpty", blockTypes: ["server"], message: "You must specify a server" },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.premiumProgressBarEnabled`,
  }),
  value({
    id: "webhook_find",
    label: "Webhook by ID and token",
    description: "Loads a webhook from its ID and token (both are in its link).",
    category: "webhooks",
    group: "Webhooks",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["get webhook", "fetch webhook", "webhook url"],
    block: {
      type: "webhooks_fetch",
      text: ["get webhook with ID: {id}", "and token: {token}"],
      colour: "#4f85db",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["id"],
          message: "You must specify the ID of the webhook ",
        },
        {
          type: "notEmpty",
          blockTypes: ["token"],
          message: "You must specify the token of the webhook ",
        },
      ],
    },
    output: "webhook",
    inputs: [
      input.text("id", "ID", { default: "" }),
      input.text("token", "Token", { default: "" }),
    ],
    code: (ctx) => `(await client.fetchWebhook(${ctx.input("id")}, ${ctx.input("token")}))`,
  }),
  value({
    id: "webhook_token",
    label: "Webhook token",
    description: "A webhook's secret token. Anyone with it can post through the webhook.",
    category: "webhooks",
    group: "About a webhook",
    icon: "fa-solid fa-key",
    keywords: ["token", "secret"],
    block: {
      type: "webhooks_token",
      text: "token of webhook: {webhook}",
      colour: "#4f85db",
      restrictions: [
        { type: "notEmpty", blockTypes: ["webhook"], message: "You must specify the webhook" },
      ],
    },
    output: "String",
    inputs: [input.slot("webhook", "Webhook", "webhook")],
    code: (ctx) => `${ctx.input("webhook")}.token`,
  }),
  value({
    id: "webhook_name",
    label: "Webhook name",
    description: "The name a webhook posts under.",
    category: "webhooks",
    group: "About a webhook",
    icon: "fa-solid fa-signature",
    keywords: ["name"],
    block: {
      type: "webhooks_name",
      text: "name of webhook: {webhook}",
      colour: "#4f85db",
      restrictions: [
        { type: "notEmpty", blockTypes: ["webhook"], message: "You must specify the webhook" },
      ],
    },
    output: "String",
    inputs: [input.slot("webhook", "Webhook", "webhook")],
    code: (ctx) => `${ctx.input("webhook")}.name`,
  }),
  value({
    id: "webhook_id",
    label: "Webhook ID",
    description: "A webhook's ID.",
    category: "webhooks",
    group: "About a webhook",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id"],
    block: {
      type: "webhooks_id",
      text: "id of webhook: {webhook}",
      colour: "#4f85db",
      restrictions: [
        { type: "notEmpty", blockTypes: ["webhook"], message: "You must specify the webhook" },
      ],
    },
    output: "String",
    inputs: [input.slot("webhook", "Webhook", "webhook")],
    code: (ctx) => `${ctx.input("webhook")}.id`,
  }),
  value({
    id: "webhook_owner",
    label: "Who made the webhook",
    description: "The user who created a webhook.",
    category: "webhooks",
    group: "About a webhook",
    icon: "fa-solid fa-user",
    keywords: ["owner", "creator"],
    block: {
      type: "webhooks_owner",
      text: "user owner of webhook: {webhook}",
      colour: "#4f85db",
      restrictions: [
        { type: "notEmpty", blockTypes: ["webhook"], message: "You must specify the webhook" },
      ],
    },
    output: "user",
    inputs: [input.slot("webhook", "Webhook", "webhook")],
    code: (ctx) => `${ctx.input("webhook")}.owner`,
  }),
  value({
    id: "webhook_created",
    label: "When the webhook was made",
    description: "The date a webhook was created.",
    category: "webhooks",
    group: "About a webhook",
    icon: "fa-solid fa-calendar-plus",
    keywords: ["created", "creation date"],
    block: {
      type: "webhooks_createdAt",
      text: "creation date of webhook: {webhook}",
      colour: "#4f85db",
      restrictions: [
        { type: "notEmpty", blockTypes: ["webhook"], message: "You must specify the webhook" },
      ],
    },
    output: "date",
    inputs: [input.slot("webhook", "Webhook", "webhook")],
    code: (ctx) => `${ctx.input("webhook")}.createdAt`,
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
