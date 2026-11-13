import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../lib/restrictions";
import {
  appBlocks,
  liveChangeCode,
  loopGenerator,
  newItemsCode,
  thenGenerator,
  value,
} from "../lib/appBlocks";

const colour = "#9146FF";
const { thenBlock, loopBlock, hatBlock, statementBlock, outputBlock, infoBlock } =
  appBlocks(colour);

/* Everything above the "log in" line in the toolbox works without any
   account. It reads public stream info from DecAPI (decapi.me), a free
   API made for Twitch chat bots, so it never needs keys.

   Twitch's official API (Helix) needs an app: a free Client ID and
   secret from dev.twitch.tv/console. Once "log in to Twitch" has run,
   the stream blocks above use Helix too (which gives more info), and
   the channel, video, clip and directory blocks below work. Those only
   read public data, so an app access token (no user login) is enough. */

/** Turns "twitch.tv/name", "@name" or "Name" into a login name. */
const loginOf = () =>
  javascriptGenerator.provideFunction_(
    "twitchLoginName",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  return String(channel ?? "")
    .trim()
    .replace(/^(https?:\\/\\/)?(www\\.|m\\.)?twitch\\.tv\\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
}`,
  );

/** Reads one DecAPI endpoint as text, or null if the user doesn't exist. */
const decapi = () =>
  javascriptGenerator.provideFunction_(
    "twitchDecapi",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(path, channel, query = "") {
  const login = ${loginOf()}(channel);
  if (!login) return null;
  const res = await fetch("https://decapi.me/twitch/" + path + "/" + encodeURIComponent(login) + query, {
    headers: { "User-Agent": "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)" }
  });
  const text = (await res.text()).trim();
  if (!res.ok || /^(User not found|Invalid Twitch username|An error occurred)/i.test(text)) return null;
  return text;
}`,
  );

/** Gets (and caches) an app access token once "log in to Twitch" has run. */
const token = () =>
  javascriptGenerator.provideFunction_(
    "twitchToken",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  const login = globalThis.twitchLogin;
  if (!login) return null;
  if (login.token && login.expires > Date.now()) return login.token;

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: login.clientId, client_secret: login.clientSecret, grant_type: "client_credentials" })
  });
  const json = await res.json().catch(async () => null);
  if (!res.ok || !json?.access_token) {
    console.error("Twitch login failed (" + res.status + "):", json?.message || json);
    return null;
  }

  login.token = json.access_token;
  login.expires = Date.now() + (json.expires_in - 60) * 1000;
  return login.token;
}`,
  );

/** Calls Twitch's official API (Helix). Returns the response's "data" list. */
const helix = () =>
  javascriptGenerator.provideFunction_(
    "twitchHelix",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(path, params = {}) {
  if (!globalThis.twitchLogin) {
    console.error('Twitch: use "log in to Twitch" (in "when the bot is logged in") before using this block.');
    return null;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    for (const item of [].concat(value)) query.append(key, String(item));
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const accessToken = await ${token()}();
    if (!accessToken) return null;

    const res = await fetch("https://api.twitch.tv/helix/" + path + "?" + query, {
      headers: { "Client-Id": globalThis.twitchLogin.clientId, Authorization: "Bearer " + accessToken }
    });

    if (res.status === 401 && attempt === 0) {
      globalThis.twitchLogin.token = null;
      continue;
    }
    if (!res.ok) {
      console.error("Twitch API error (" + res.status + "):", await res.text().catch(async () => ""));
      return null;
    }
    return (await res.json()).data ?? [];
  }
  return null;
}`,
  );

/** The Helix user for a login name. */
const helixUser = () =>
  javascriptGenerator.provideFunction_(
    "twitchHelixUser",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  const login = ${loginOf()}(channel);
  if (!login) return null;
  return (await ${helix()}("users", { login }))?.[0] ?? null;
}`,
  );

/** Turns a Helix stream into the shape the stream info block reads. */
const streamShape = () =>
  javascriptGenerator.provideFunction_(
    "twitchStreamShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(stream) {
  return {
    channel: stream.user_login,
    channelName: stream.user_name,
    channelId: stream.user_id,
    title: stream.title,
    game: stream.game_name,
    viewers: stream.viewer_count,
    url: "https://www.twitch.tv/" + stream.user_login,
    thumbnailUrl: String(stream.thumbnail_url || "").replace("{width}", "1280").replace("{height}", "720") + "?t=" + Date.now(),
    startedAt: stream.started_at ? new Date(stream.started_at) : null,
    language: stream.language,
    tags: stream.tags || [],
    isMature: !!stream.is_mature
  };
}`,
  );

/**
 * The stream a channel has live right now, null when it is offline, or
 * undefined when Twitch couldn't be reached.
 */
const streamOf = () =>
  javascriptGenerator.provideFunction_(
    "twitchStream",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  const login = ${loginOf()}(channel);
  if (!login) return null;

  try {
    if (globalThis.twitchLogin) {
      const streams = await ${helix()}("streams", { user_login: login });
      if (!streams) return undefined;
      return streams[0] ? ${streamShape()}(streams[0]) : null;
    }

    const uptime = await ${decapi()}("uptime", login);
    if (uptime === null) return null;
    if (/is offline$/i.test(uptime)) return null;

    const [title, game, viewers] = await Promise.all([
      ${decapi()}("title", login),
      ${decapi()}("game", login),
      ${decapi()}("viewercount", login)
    ]);

    const units = { day: 86400, hour: 3600, minute: 60, second: 1 };
    let seconds = 0;
    for (const [, amount, unit] of uptime.matchAll(/(\\d+)\\s+(day|hour|minute|second)s?/g)) seconds += Number(amount) * units[unit];

    return {
      channel: login,
      channelName: login,
      channelId: null,
      title,
      game,
      viewers: Number(viewers) || 0,
      url: "https://www.twitch.tv/" + login,
      thumbnailUrl: "https://static-cdn.jtvnw.net/previews-ttv/live_user_" + login + "-1280x720.jpg?t=" + Date.now(),
      startedAt: new Date(Date.now() - seconds * 1000),
      language: null,
      tags: [],
      isMature: null
    };
  } catch (error) {
    console.error("Error checking Twitch stream:", error);
    return undefined;
  }
}`,
  );

/** A channel's profile and channel settings, from Helix. */
const channelOf = () =>
  javascriptGenerator.provideFunction_(
    "twitchChannel",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  const user = await ${helixUser()}(channel);
  if (!user) return null;

  const [info, streams] = await Promise.all([
    ${helix()}("channels", { broadcaster_id: user.id }),
    ${helix()}("streams", { user_id: user.id })
  ]);
  const settings = info?.[0] || {};

  return {
    id: user.id,
    login: user.login,
    name: user.display_name,
    description: user.description,
    url: "https://www.twitch.tv/" + user.login,
    avatarUrl: user.profile_image_url,
    offlineImageUrl: user.offline_image_url || null,
    broadcasterType: user.broadcaster_type || "normal",
    createdAt: user.created_at ? new Date(user.created_at) : null,
    title: settings.title ?? null,
    game: settings.game_name ?? null,
    language: settings.broadcaster_language ?? null,
    tags: settings.tags || [],
    isLive: !!streams?.length
  };
}`,
  );

/** Turns a Helix video or clip into the shape the video info block reads. */
const videoShape = () =>
  javascriptGenerator.provideFunction_(
    "twitchVideoShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(video, type) {
  const duration = String(video.duration ?? "").match(/^(?:(\\d+)h)?(?:(\\d+)m)?(?:(\\d+)s)?$/);
  const seconds = typeof video.duration === "number"
    ? Math.round(video.duration)
    : duration ? Number(duration[1] || 0) * 3600 + Number(duration[2] || 0) * 60 + Number(duration[3] || 0) : null;

  return {
    id: video.id,
    title: video.title,
    description: video.description ?? "",
    url: video.url,
    thumbnailUrl: String(video.thumbnail_url || "").replace("%{width}", "1280").replace("%{height}", "720") || null,
    views: video.view_count ?? 0,
    lengthSeconds: seconds,
    createdAt: video.created_at ? new Date(video.created_at) : null,
    type: type || video.type,
    channelName: video.user_name || video.broadcaster_name,
    clippedBy: video.creator_name ?? null
  };
}`,
  );

/** A channel's videos ("archive", "highlight", "upload" or "all") or recent clips, newest first. */
const videosOf = () =>
  javascriptGenerator.provideFunction_(
    "twitchVideos",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel, type = "all", count = 20) {
  const user = await ${helixUser()}(channel);
  if (!user) return [];
  const first = Math.min(100, Math.max(1, Number(count) || 20));

  if (type === "clip") {
    const clips = await ${helix()}("clips", { broadcaster_id: user.id, first: 100, started_at: new Date(Date.now() - 30 * 86400000).toISOString() });
    return (clips || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, first)
      .map(clip => ${videoShape()}(clip, "clip"));
  }

  const videos = await ${helix()}("videos", { user_id: user.id, type, first, sort: "time" });
  return (videos || []).map(video => ${videoShape()}(video));
}`,
  );

/** The game (category) ID for a name, or null. */
const gameIdOf = () =>
  javascriptGenerator.provideFunction_(
    "twitchGameId",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(name) {
  if (!String(name ?? "").trim()) return null;
  return (await ${helix()}("games", { name: String(name).trim() }))?.[0]?.id ?? null;
}`,
  );

const VIDEO_TYPES = [
  ["past broadcast (VOD)", "archive"],
  ["highlight", "highlight"],
  ["upload", "upload"],
  ["video of any type", "all"],
  ["clip", "clip"],
];

/* ------------------------------------------------------------------ */
/* Streams (no login needed)                                            */
/* ------------------------------------------------------------------ */

Blockly.Blocks["twitch_getStream"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("get live stream of Twitch channel:");
    thenBlock(
      this,
      "If the channel is live right now, runs the blocks inside with its stream. Nothing runs when it is offline.",
    );
  },
};

javascriptGenerator.forBlock["twitch_getStream"] = thenGenerator(
  "twitchStreamInformation",
  "Twitch stream",
  (block, generator) => `${streamOf()}(${value(block, generator, "channel")})`,
);

infoBlock(
  "twitch_streamInfo",
  "twitchStreamInformation",
  "Twitch stream",
  [
    ["title", "title"],
    ["game / category", "game"],
    ["viewer count", "viewers"],
    ["link", "url"],
    ["thumbnail image URL", "thumbnailUrl"],
    ["channel login name", "channel"],
    ["channel display name", "channelName"],
    ["start time", "startedAt"],
    ["language", "language"],
    ["tags (list)", "tags"],
    ["is for mature audiences", "isMature"],
  ],
  'Information about the Twitch stream. Language, tags and mature need "log in to Twitch"; without it they are null.',
);

Blockly.Blocks["twitch_onLive"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("when Twitch channel:");
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
      'Runs when a channel starts (or ends) a stream — great for live notifications. Use "get ... of Twitch stream" inside it. The channel is checked every few minutes (at least 1).',
    );
  },
};

javascriptGenerator.forBlock["twitch_onLive"] = function (block, generator) {
  return liveChangeCode({
    minutes: value(block, generator, "minutes", "5"),
    label: "Twitch",
    stream: `${streamOf()}(${value(block, generator, "channel")})`,
    variable: "twitchStreamInformation",
    when: block.getFieldValue("when"),
    code: generator.statementToCode(block, "code"),
  });
};

Blockly.Blocks["twitch_isLive"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("Twitch channel:");
    this.appendDummyInput().appendField("is live right now?");
    this.setInputsInline(true);
    outputBlock(this, "Boolean", "Checks whether a Twitch channel is streaming");
  },
};

javascriptGenerator.forBlock["twitch_isLive"] = function (block, generator) {
  const channel = value(block, generator, "channel");
  return [`!!(await ${streamOf()}(${channel}))`, Order.LOGICAL_NOT];
};

Blockly.Blocks["twitch_quickInfo"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["follower count", "followcount"],
          ["stream title", "title"],
          ["game / category", "game"],
          ["viewer count", "viewercount"],
          ["uptime", "uptime"],
          ["profile picture URL", "avatar"],
          ["user ID", "id"],
          ["account creation date", "creation"],
          ["account age", "accountage"],
          ["link to latest past broadcast", "videos"],
          ["channel link", "link"],
        ]),
        "info",
      )
      .appendField("of Twitch channel:");
    outputBlock(
      this,
      null,
      "Quick public info about a Twitch channel. Title and game are the last ones used, even when offline. Uptime is null and viewer count 0 when offline.",
    );
  },
};

javascriptGenerator.forBlock["twitch_quickInfo"] = function (block, generator) {
  const channel = value(block, generator, "channel");
  const info = block.getFieldValue("info");

  if (info === "link")
    return [`("https://www.twitch.tv/" + ${loginOf()}(${channel}))`, Order.ATOMIC];

  let code;
  if (info === "followcount")
    code = `${decapi()}("followcount", ${channel}).then(async (text) => text === null ? null : Number(text) || 0)`;
  else if (info === "viewercount")
    code = `${decapi()}("viewercount", ${channel}).then(async (text) => Number(text) || 0)`;
  else if (info === "uptime")
    code = `${decapi()}("uptime", ${channel}).then(async (text) => !text || /is offline$/i.test(text) ? null : text)`;
  else if (info === "videos")
    code = `${decapi()}("videos", ${channel}, "?limit=1").then(async (text) => (String(text ?? "").match(/https:\\/\\/www\\.twitch\\.tv\\/videos\\/\\d+/) || [])[0] ?? null)`;
  else code = `${decapi()}("${info}", ${channel})`;

  return [`await ${code}.catch(async () => null)`, Order.AWAIT];
};

/* ------------------------------------------------------------------ */
/* With a Twitch app                                                    */
/* ------------------------------------------------------------------ */

Blockly.Blocks["twitch_login"] = {
  init: function () {
    this.appendDummyInput().appendField("log in to Twitch");
    this.appendValueInput("clientId").setCheck(null).appendField("app client ID:");
    this.appendValueInput("clientSecret")
      .setCheck(null)
      .appendField("app client secret:");
    statementBlock(
      this,
      'Lets the Twitch blocks use Twitch\'s official API. Register a free app at dev.twitch.tv/console for the client ID and secret. Put this in "when the bot is logged in".',
    );
  },
};

javascriptGenerator.forBlock["twitch_login"] = function (block, generator) {
  const clientId = value(block, generator, "clientId");
  const clientSecret = value(block, generator, "clientSecret");

  return `globalThis.twitchLogin = { clientId: String(${clientId} ?? "").trim(), clientSecret: String(${clientSecret} ?? "").trim() };
await ${token()}();\n`;
};

Blockly.Blocks["twitch_getChannel"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("get Twitch channel:");
    thenBlock(
      this,
      'Looks up a Twitch channel (profile and stream settings), then runs the blocks inside. Needs "log in to Twitch".',
    );
  },
};

javascriptGenerator.forBlock["twitch_getChannel"] = thenGenerator(
  "twitchChannelInformation",
  "Twitch channel",
  (block, generator) => `${channelOf()}(${value(block, generator, "channel")})`,
);

Blockly.Blocks["twitch_searchChannels"] = {
  init: function () {
    this.appendValueInput("query")
      .setCheck("String")
      .appendField("for each Twitch channel found searching:");
    this.appendDummyInput()
      .appendField("only live channels")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "live");
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("max results (1-100):");
    loopBlock(
      this,
      'Searches channels by name, then runs the blocks inside once for each. Use "get ... of Twitch channel" inside. Needs "log in to Twitch".',
    );
  },
};

javascriptGenerator.forBlock["twitch_searchChannels"] = loopGenerator(
  "twitchChannelInformation",
  "Twitch channels",
  (block, generator) => {
    const query = value(block, generator, "query");
    const count = value(block, generator, "count", "5");
    const live = block.getFieldValue("live") === "TRUE";

    return `${helix()}("search/channels", { query: String(${query}), live_only: ${live}, first: Math.min(100, Math.max(1, Number(${count}) || 5)) }).then(async (channels) => (channels || []).map(channel => ({
  id: channel.id,
  login: channel.broadcaster_login,
  name: channel.display_name,
  description: null,
  url: "https://www.twitch.tv/" + channel.broadcaster_login,
  avatarUrl: channel.thumbnail_url,
  offlineImageUrl: null,
  broadcasterType: null,
  createdAt: null,
  title: channel.title,
  game: channel.game_name,
  language: channel.broadcaster_language,
  tags: channel.tags || [],
  isLive: !!channel.is_live
})))`;
  },
);

infoBlock(
  "twitch_channelInfo",
  "twitchChannelInformation",
  "Twitch channel",
  [
    ["display name", "name"],
    ["login name", "login"],
    ["user ID", "id"],
    ["description", "description"],
    ["link", "url"],
    ["profile picture URL", "avatarUrl"],
    ["offline banner URL", "offlineImageUrl"],
    ["partner / affiliate", "broadcasterType"],
    ["creation date", "createdAt"],
    ["stream title", "title"],
    ["game / category", "game"],
    ["language", "language"],
    ["tags (list)", "tags"],
    ["is live right now", "isLive"],
  ],
  "Information about the Twitch channel you got. Channels from a search have no description, banner or creation date (null).",
);

Blockly.Blocks["twitch_forEachVideo"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("for each recent")
      .appendField(new Blockly.FieldDropdown(VIDEO_TYPES), "type")
      .appendField("of Twitch channel:");
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("max results (1-100):");
    loopBlock(
      this,
      'Runs the blocks inside once for each of the channel\'s latest videos or clips (clips from the last 30 days), newest first. Use "get ... of Twitch video" inside. Needs "log in to Twitch".',
    );
  },
};

javascriptGenerator.forBlock["twitch_forEachVideo"] = loopGenerator(
  "twitchVideoInformation",
  "Twitch videos",
  (block, generator) =>
    `${videosOf()}(${value(block, generator, "channel")}, "${block.getFieldValue("type")}", ${value(block, generator, "count", "5")})`,
);

Blockly.Blocks["twitch_getLatestVideo"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("get latest")
      .appendField(new Blockly.FieldDropdown(VIDEO_TYPES), "type")
      .appendField("of Twitch channel:");
    thenBlock(
      this,
      'Gets the channel\'s newest video or clip, then runs the blocks inside. Needs "log in to Twitch".',
    );
  },
};

javascriptGenerator.forBlock["twitch_getLatestVideo"] = thenGenerator(
  "twitchVideoInformation",
  "Twitch video",
  (block, generator) =>
    `${videosOf()}(${value(block, generator, "channel")}, "${block.getFieldValue("type")}", 1).then(async (videos) => videos[0])`,
);

Blockly.Blocks["twitch_onNewVideo"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("when Twitch channel:");
    this.appendDummyInput()
      .appendField("posts a new")
      .appendField(new Blockly.FieldDropdown(VIDEO_TYPES), "type");
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    hatBlock(
      this,
      'Runs once for each new video or clip on a channel. Use "get ... of Twitch video" inside. Needs "log in to Twitch".',
    );
  },
};

javascriptGenerator.forBlock["twitch_onNewVideo"] = function (block, generator) {
  return newItemsCode({
    minutes: value(block, generator, "minutes", "5"),
    label: "Twitch",
    list: `${videosOf()}(${value(block, generator, "channel")}, "${block.getFieldValue("type")}", 20)`,
    variable: "twitchVideoInformation",
    code: generator.statementToCode(block, "code"),
  });
};

infoBlock(
  "twitch_videoInfo",
  "twitchVideoInformation",
  "Twitch video",
  [
    ["title", "title"],
    ["link", "url"],
    ["video ID", "id"],
    ["description", "description"],
    ["thumbnail image URL", "thumbnailUrl"],
    ["views", "views"],
    ["length in seconds", "lengthSeconds"],
    ["creation date", "createdAt"],
    ["type", "type"],
    ["channel name", "channelName"],
    ["clipped by (clips only)", "clippedBy"],
  ],
  "Information about the Twitch video or clip.",
);

Blockly.Blocks["twitch_forEachTopStream"] = {
  init: function () {
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("for each top live Twitch stream, max (1-100):");
    this.appendValueInput("game")
      .setCheck("String")
      .appendField("in game / category (empty for all):");
    loopBlock(
      this,
      'Runs the blocks inside once for each of the most watched live streams. Use "get ... of Twitch stream" inside. Needs "log in to Twitch".',
    );
  },
};

javascriptGenerator.forBlock["twitch_forEachTopStream"] = loopGenerator(
  "twitchStreamInformation",
  "Twitch streams",
  (block, generator) => {
    const count = value(block, generator, "count", "5");
    const game = value(block, generator, "game");

    return `(async () => {
  const game = String(${game} ?? "").trim();
  const gameId = game ? await ${gameIdOf()}(game) : null;
  if (game && !gameId) return [];
  const streams = await ${helix()}("streams", { first: Math.min(100, Math.max(1, Number(${count}) || 5)), game_id: gameId });
  return (streams || []).map(${streamShape()});
})()`;
  },
);

Blockly.Blocks["twitch_topGames"] = {
  init: function () {
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("list of top Twitch games / categories, max (1-100):");
    outputBlock(
      this,
      "Array",
      'The names of the most watched games and categories right now. Needs "log in to Twitch".',
    );
  },
};

javascriptGenerator.forBlock["twitch_topGames"] = function (block, generator) {
  const count = value(block, generator, "count", "10");
  return [
    `await ${helix()}("games/top", { first: Math.min(100, Math.max(1, Number(${count}) || 10)) }).then(async (games) => (games || []).map(game => game.name)).catch(async () => [])`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* Where the info blocks can go                                         */
/* ------------------------------------------------------------------ */

createRestrictions(
  ["twitch_streamInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["twitch_getStream", "twitch_onLive", "twitch_forEachTopStream"],
      message:
        'This block must be inside a "get live stream of Twitch channel", "when Twitch channel goes live" or "for each top live Twitch stream" block.',
    },
  ],
);

createRestrictions(
  ["twitch_channelInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["twitch_getChannel", "twitch_searchChannels"],
      message:
        'This block must be inside a "get Twitch channel" or "for each Twitch channel found" block.',
    },
  ],
);

createRestrictions(
  ["twitch_videoInfo"],
  [
    {
      type: "hasParent",
      blockTypes: [
        "twitch_forEachVideo",
        "twitch_getLatestVideo",
        "twitch_onNewVideo",
      ],
      message:
        'This block must be inside a "for each recent ... of Twitch channel", "get latest ... of Twitch channel" or "when Twitch channel posts a new ..." block.',
    },
  ],
);
