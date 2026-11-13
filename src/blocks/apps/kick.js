import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../lib/restrictions";
import {
  appBlocks,
  liveChangeCode,
  loopGenerator,
  thenGenerator,
  value,
} from "../lib/appBlocks";

const colour = "#2BA52E";
const { thenBlock, loopBlock, hatBlock, statementBlock, outputBlock, infoBlock } =
  appBlocks(colour);

/* Kick only shares channel and stream info through its official API
   (api.kick.com), which needs an app: a free client ID and secret from
   kick.com/settings/developer. Everything here only reads public data,
   so an app access token (no user login) is enough. */

/** Turns "kick.com/name" or "Name" into a channel slug. */
const slugOf = () =>
  javascriptGenerator.provideFunction_(
    "kickSlug",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  return String(channel ?? "")
    .trim()
    .replace(/^(https?:\\/\\/)?(www\\.)?kick\\.com\\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
}`,
  );

/** Gets (and caches) an app access token once "log in to Kick" has run. */
const token = () =>
  javascriptGenerator.provideFunction_(
    "kickToken",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  const login = globalThis.kickLogin;
  if (!login) return null;
  if (login.token && login.expires > Date.now()) return login.token;

  const res = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: login.clientId, client_secret: login.clientSecret })
  });
  const json = await res.json().catch(async () => null);
  if (!res.ok || !json?.access_token) {
    console.error("Kick login failed (" + res.status + "):", json);
    return null;
  }

  login.token = json.access_token;
  login.expires = Date.now() + ((json.expires_in || 3600) - 60) * 1000;
  return login.token;
}`,
  );

/** Calls Kick's official API. Returns the response's "data". */
const api = () =>
  javascriptGenerator.provideFunction_(
    "kickApi",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(path, params = {}) {
  if (!globalThis.kickLogin) {
    console.error('Kick: use "log in to Kick" (in "when the bot is logged in") before using Kick blocks.');
    return null;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.append(key, String(value));
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const accessToken = await ${token()}();
    if (!accessToken) return null;

    const res = await fetch("https://api.kick.com/public/v1/" + path + "?" + query, {
      headers: { Authorization: "Bearer " + accessToken, Accept: "application/json" }
    });

    if (res.status === 401 && attempt === 0) {
      globalThis.kickLogin.token = null;
      continue;
    }
    if (!res.ok) {
      console.error("Kick API error (" + res.status + "):", await res.text().catch(async () => ""));
      return null;
    }
    return (await res.json()).data ?? null;
  }
  return null;
}`,
  );

/** Turns a Kick channel or livestream into the shape the info block reads. */
const channelShape = () =>
  javascriptGenerator.provideFunction_(
    "kickChannelShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  const stream = channel.stream || {};
  const isLive = channel.stream ? !!stream.is_live : true;
  const started = stream.start_time || channel.started_at;

  return {
    slug: channel.slug,
    url: "https://kick.com/" + channel.slug,
    userId: channel.broadcaster_user_id,
    description: channel.channel_description ?? null,
    bannerUrl: channel.banner_picture || null,
    profilePictureUrl: channel.profile_picture || null,
    isLive,
    title: channel.stream_title || null,
    category: channel.category?.name || null,
    viewers: isLive ? (stream.viewer_count ?? channel.viewer_count ?? 0) : 0,
    startedAt: isLive && started && !String(started).startsWith("0001") ? new Date(started) : null,
    thumbnailUrl: (stream.thumbnail || channel.thumbnail) || null,
    language: stream.language || channel.language || null,
    isMature: !!(stream.is_mature ?? channel.has_mature_content)
  };
}`,
  );

/** A channel by slug, or null. Undefined when Kick couldn't be reached. */
const channelOf = () =>
  javascriptGenerator.provideFunction_(
    "kickChannel",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  const slug = ${slugOf()}(channel);
  if (!slug) return null;
  const channels = await ${api()}("channels", { slug });
  if (!channels) return undefined;
  return channels[0] ? ${channelShape()}(channels[0]) : null;
}`,
  );

Blockly.Blocks["kick_login"] = {
  init: function () {
    this.appendDummyInput().appendField("log in to Kick");
    this.appendValueInput("clientId").setCheck(null).appendField("app client ID:");
    this.appendValueInput("clientSecret")
      .setCheck(null)
      .appendField("app client secret:");
    statementBlock(
      this,
      'Lets the Kick blocks use Kick\'s official API. Create a free app at kick.com/settings/developer for the client ID and secret. Put this in "when the bot is logged in".',
    );
  },
};

javascriptGenerator.forBlock["kick_login"] = function (block, generator) {
  const clientId = value(block, generator, "clientId");
  const clientSecret = value(block, generator, "clientSecret");

  return `globalThis.kickLogin = { clientId: String(${clientId} ?? "").trim(), clientSecret: String(${clientSecret} ?? "").trim() };
await ${token()}();\n`;
};

Blockly.Blocks["kick_getChannel"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("get Kick channel:");
    thenBlock(
      this,
      'Looks up a Kick channel and its stream, then runs the blocks inside. Use "get ... of Kick channel" inside.',
    );
  },
};

javascriptGenerator.forBlock["kick_getChannel"] = thenGenerator(
  "kickChannelInformation",
  "Kick channel",
  (block, generator) => `${channelOf()}(${value(block, generator, "channel")})`,
);

infoBlock(
  "kick_channelInfo",
  "kickChannelInformation",
  "Kick channel",
  [
    ["name", "slug"],
    ["link", "url"],
    ["user ID", "userId"],
    ["description", "description"],
    ["is live right now", "isLive"],
    ["stream title", "title"],
    ["category", "category"],
    ["viewer count", "viewers"],
    ["stream start time", "startedAt"],
    ["stream thumbnail URL", "thumbnailUrl"],
    ["stream language", "language"],
    ["is for mature audiences", "isMature"],
    ["banner image URL", "bannerUrl"],
    ["profile picture URL", "profilePictureUrl"],
  ],
  "Information about the Kick channel and its stream. The profile picture is only known for channels from \"for each live Kick stream\"; the description and banner only for channels you got by name.",
);

Blockly.Blocks["kick_onLive"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("when Kick channel:");
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["goes live", "live"],
        ["goes offline", "offline"],
      ]),
      "when",
    );
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    hatBlock(
      this,
      'Runs when a channel starts (or ends) a stream. Use "get ... of Kick channel" inside it. The channel is checked every few minutes (at least 1).',
    );
  },
};

javascriptGenerator.forBlock["kick_onLive"] = function (block, generator) {
  return liveChangeCode({
    minutes: value(block, generator, "minutes", "5"),
    label: "Kick",
    stream: `${channelOf()}(${value(block, generator, "channel")}).then(async (channel) => channel === undefined ? undefined : channel?.isLive ? channel : null)`,
    variable: "kickChannelInformation",
    when: block.getFieldValue("when"),
    code: generator.statementToCode(block, "code"),
  });
};

Blockly.Blocks["kick_forEachLivestream"] = {
  init: function () {
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("for each top live Kick stream, max (1-100):");
    this.appendValueInput("category")
      .setCheck("String")
      .appendField("in category (empty for all):");
    loopBlock(
      this,
      'Runs the blocks inside once for each of the most watched live streams on Kick. Use "get ... of Kick channel" inside.',
    );
  },
};

javascriptGenerator.forBlock["kick_forEachLivestream"] = loopGenerator(
  "kickChannelInformation",
  "Kick streams",
  (block, generator) => {
    const count = value(block, generator, "count", "5");
    const category = value(block, generator, "category");

    return `(async () => {
  const category = String(${category} ?? "").trim();
  let categoryId = null;
  if (category) {
    const found = (await ${api()}("categories", { q: category })) || [];
    categoryId = (found.find(item => item.name?.toLowerCase() === category.toLowerCase()) || found[0])?.id;
    if (!categoryId) return [];
  }
  const streams = await ${api()}("livestreams", { limit: Math.min(100, Math.max(1, Number(${count}) || 5)), sort: "viewer_count", category_id: categoryId });
  return (streams || []).map(${channelShape()});
})()`;
  },
);

Blockly.Blocks["kick_isLive"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("Kick channel:");
    this.appendDummyInput().appendField("is live right now?");
    this.setInputsInline(true);
    outputBlock(this, "Boolean", "Checks whether a Kick channel is streaming");
  },
};

javascriptGenerator.forBlock["kick_isLive"] = function (block, generator) {
  const channel = value(block, generator, "channel");
  return [
    `await ${channelOf()}(${channel}).then(async (channel) => !!channel?.isLive).catch(async () => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["kick_viewerCount"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("viewer count of Kick channel:");
    outputBlock(this, "Number", "How many people are watching a Kick channel (0 when offline)");
  },
};

javascriptGenerator.forBlock["kick_viewerCount"] = function (block, generator) {
  const channel = value(block, generator, "channel");
  return [
    `await ${channelOf()}(${channel}).then(async (channel) => channel?.viewers ?? 0).catch(async () => 0)`,
    Order.AWAIT,
  ];
};

createRestrictions(
  ["kick_channelInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["kick_getChannel", "kick_onLive", "kick_forEachLivestream"],
      message:
        'This block must be inside a "get Kick channel", "when Kick channel goes live" or "for each top live Kick stream" block.',
    },
  ],
);
