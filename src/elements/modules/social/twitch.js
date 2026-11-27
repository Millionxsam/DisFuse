/* =====================================================================
   Twitch
   ---------------------------------------------------------------------
   The stream steps work without any account: they read public stream
   info from DecAPI (decapi.me), a free API made for Twitch chat bots.

   Twitch's official API (Helix) needs an app: a free Client ID and
   secret from dev.twitch.tv/console. Once "Log in to Twitch" has run,
   the stream steps use Helix too (which gives more info), and the
   channel, video, clip and directory steps work. Those only read public
   data, so an app access token (no user login) is enough.
   ===================================================================== */

import { group, input } from "../../define.js";
import { ALL_HELPERS } from "./twitch.helpers.js";
import {
  infoBlock,
  liveChangeCode,
  minutesInput,
  newItemsCode,
  site,
} from "./shared.js";

const colour = "#9146FF";
const { lookup, loop, watcher, step, check } = site(
  { name: "Twitch", colour, setup: ALL_HELPERS },
  group({ colour }),
);

const NEEDS_LOGIN = 'Needs "Log in to Twitch" first.';

const VIDEO_TYPES = [
  ["past broadcast (VOD)", "archive"],
  ["highlight", "highlight"],
  ["upload", "upload"],
  ["video of any type", "all"],
  ["clip", "clip"],
];
const videoType = () =>
  input.dropdown(
    "type",
    "Kind of video",
    VIDEO_TYPES.map(([label, value]) => [
      label.charAt(0).toUpperCase() + label.slice(1),
      value,
    ]),
    { default: "all" },
  );

const channelInput = input.text("channel", "Twitch channel", {
  default: "",
  placeholder: "twitch.tv/name or name",
});
const countInput = (fallback = 5) =>
  input.number("count", "How many (1-100)", {
    default: fallback,
    min: 1,
    max: 100,
    integer: true,
  });

/* ---- What the info blocks read --------------------------------------- */

const STREAM = "twitchStreamInformation";
const STREAM_FIELDS = [
  ["title", "title", "String", "Stream title"],
  ["game / category", "game", "String", "Game or category"],
  ["viewer count", "viewers", "Number"],
  ["link", "url", "String", "Stream link"],
  ["thumbnail image URL", "thumbnailUrl", "String", "Thumbnail link"],
  ["channel login name", "channel"],
  ["channel display name", "channelName"],
  ["start time", "startedAt", "date"],
  ["language", "language"],
  ["tags (list)", "tags", "Array", "Tags"],
  [
    "is for mature audiences",
    "isMature",
    "Boolean",
    "Is for mature audiences?",
  ],
];

const CHANNEL = "twitchChannelInformation";
const CHANNEL_FIELDS = [
  ["display name", "name"],
  ["login name", "login"],
  ["user ID", "id"],
  ["description", "description"],
  ["link", "url", "String", "Channel link"],
  ["profile picture URL", "avatarUrl", "String", "Profile picture link"],
  ["offline banner URL", "offlineImageUrl", "String", "Offline banner link"],
  ["partner / affiliate", "broadcasterType", "String", "Partner or affiliate"],
  ["creation date", "createdAt", "date"],
  ["stream title", "title"],
  ["game / category", "game", "String", "Game or category"],
  ["language", "language"],
  ["tags (list)", "tags", "Array", "Tags"],
  ["is live right now", "isLive", "Boolean", "Is live right now?"],
];

const VIDEO = "twitchVideoInformation";
const VIDEO_FIELDS = [
  ["title", "title"],
  ["link", "url", "String", "Video link"],
  ["video ID", "id"],
  ["description", "description"],
  ["thumbnail image URL", "thumbnailUrl", "String", "Thumbnail link"],
  ["views", "views", "Number"],
  ["length in seconds", "lengthSeconds", "Number"],
  ["creation date", "createdAt", "date"],
  ["type", "type", "String", "Kind of video"],
  ["channel name", "channelName"],
  ["clipped by (clips only)", "clippedBy", "String", "Clipped by (clips only)"],
];

const streamInfo = infoBlock(
  "twitch_streamInfo",
  "Twitch stream",
  STREAM_FIELDS,
  {
    inside: ["twitch_getStream", "twitch_onLive", "twitch_forEachTopStream"],
    also: ["twitch_channel_live", "twitch_each_top_stream"],
    tooltip:
      'Information about the Twitch stream. Language, tags and mature need "log in to Twitch"; without it they are null.',
  },
);
const channelInfo = infoBlock(
  "twitch_channelInfo",
  "Twitch channel",
  CHANNEL_FIELDS,
  {
    inside: ["twitch_getChannel", "twitch_searchChannels"],
    also: ["twitch_search_channels"],
    tooltip:
      "Information about the Twitch channel you got. Channels from a search have no description, banner or creation date (null).",
  },
);
const videoInfo = infoBlock("twitch_videoInfo", "Twitch video", VIDEO_FIELDS, {
  inside: ["twitch_forEachVideo", "twitch_getLatestVideo", "twitch_onNewVideo"],
  also: ["twitch_latest_video", "twitch_new_video"],
  tooltip: "Information about the Twitch video or clip.",
});

/* ---- Steps ------------------------------------------------------------ */

const actions = [
  step({
    id: "twitch_login",
    label: "Log in to Twitch",
    description:
      "Lets the Twitch steps use Twitch's official API. Register a free app at dev.twitch.tv/console for the client ID and secret. Use it when the bot starts.",
    icon: "fa-solid fa-key",
    keywords: ["login", "api key", "client id", "helix"],
    block: {
      type: "twitch_login",
      text: [
        "log in to Twitch",
        "app client ID: {clientId}",
        "app client secret: {clientSecret}",
      ],
      parts: { clientId: { check: null }, clientSecret: { check: null } },
      tooltip:
        'Lets the Twitch blocks use Twitch\'s official API. Register a free app at dev.twitch.tv/console for the client ID and secret. Put this in "when the bot is logged in".',
    },
    inputs: [
      input.text("clientId", "App client ID", {
        default: "",
        help: "Keep it in a Secret, and use the Secret here.",
      }),
      input.text("clientSecret", "App client secret", {
        default: "",
        help: "Keep it in a Secret, and use the Secret here.",
      }),
    ],
    code: (ctx) =>
      `globalThis.twitchLogin = { clientId: String(${ctx.input("clientId")} ?? "").trim(), clientSecret: String(${ctx.input("clientSecret")} ?? "").trim() };
await twitchToken();\n`,
  }),
  lookup({
    id: "twitch_get_stream",
    label: "Get a Twitch channel's live stream",
    description:
      "If the channel is live right now, runs with its stream. Nothing runs when it's offline.",
    icon: "fa-solid fa-tower-broadcast",
    keywords: ["stream", "live", "streamer"],
    variable: STREAM,
    noun: "Twitch stream",
    fields: STREAM_FIELDS,
    info: streamInfo,
    block: {
      type: "twitch_getStream",
      text: ["get live stream of Twitch channel: {channel}", "then {code}"],
      parts: { channel: { check: "String" } },
      tooltip:
        "If the channel is live right now, runs the blocks inside with its stream. Nothing runs when it is offline.",
    },
    inputs: [channelInput],
    expr: (ctx) => `twitchStream(${ctx.input("channel")})`,
  }),
  lookup({
    id: "twitch_get_channel",
    label: "Look up a Twitch channel",
    description: `Finds a Twitch channel's profile and stream settings. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-user",
    keywords: ["channel", "profile", "streamer"],
    variable: CHANNEL,
    noun: "Twitch channel",
    fields: CHANNEL_FIELDS,
    info: channelInfo,
    block: {
      type: "twitch_getChannel",
      text: ["get Twitch channel: {channel}", "then {code}"],
      parts: { channel: { check: "String" } },
      tooltip:
        'Looks up a Twitch channel (profile and stream settings), then runs the blocks inside. Needs "log in to Twitch".',
    },
    inputs: [channelInput],
    expr: (ctx) => `twitchChannel(${ctx.input("channel")})`,
  }),
  loop({
    id: "twitch_search_channels",
    label: "For each Twitch channel found",
    description: `Searches channels by name, and runs once for each. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["search", "find", "channels"],
    variable: CHANNEL,
    noun: "Twitch channel",
    fields: CHANNEL_FIELDS,
    block: {
      type: "twitch_searchChannels",
      text: [
        "for each Twitch channel found searching: {query}",
        "only live channels {live}",
        "max results (1-100): {count}",
        "do {code}",
      ],
      parts: { live: { part: "checkbox" } },
      tooltip:
        'Searches channels by name, then runs the blocks inside once for each. Use "get ... of Twitch channel" inside. Needs "log in to Twitch".',
    },
    inputs: [
      input.text("query", "Search for", { default: "" }),
      input.boolean("live", "Only live channels", {
        default: false,
        allowValues: false,
      }),
      countInput(),
    ],
    expr: (
      ctx,
    ) => `twitchHelix("search/channels", { query: String(${ctx.input("query")}), live_only: ${ctx.raw("live") === true}, first: Math.min(100, Math.max(1, Number(${ctx.input("count")}) || 5)) }).then(async (channels) => (channels || []).map(channel => ({
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
})))`,
  }),
  loop({
    id: "twitch_each_video",
    label: "For each recent Twitch video",
    description: `Runs once for each of a channel's latest videos or clips (clips from the last 30 days), newest first. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-film",
    keywords: ["videos", "vods", "clips", "highlights"],
    variable: VIDEO,
    noun: "Twitch video",
    fields: VIDEO_FIELDS,
    info: videoInfo,
    block: {
      type: "twitch_forEachVideo",
      text: [
        "for each recent {type} of Twitch channel: {channel}",
        "max results (1-100): {count}",
        "do {code}",
      ],
      parts: { channel: { check: "String" }, type: { options: VIDEO_TYPES } },
      tooltip:
        'Runs the blocks inside once for each of the channel\'s latest videos or clips (clips from the last 30 days), newest first. Use "get ... of Twitch video" inside. Needs "log in to Twitch".',
    },
    inputs: [videoType(), channelInput, countInput()],
    expr: (ctx) =>
      `twitchVideos(${ctx.input("channel")}, "${ctx.raw("type")}", ${ctx.input("count")})`,
  }),
  lookup({
    id: "twitch_latest_video",
    label: "Get a Twitch channel's latest video",
    description: `Gets a channel's newest video or clip. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-clapperboard",
    keywords: ["latest", "newest", "video", "clip", "vod"],
    variable: VIDEO,
    noun: "Twitch video",
    fields: VIDEO_FIELDS,
    block: {
      type: "twitch_getLatestVideo",
      text: ["get latest {type} of Twitch channel: {channel}", "then {code}"],
      parts: { channel: { check: "String" }, type: { options: VIDEO_TYPES } },
      tooltip:
        'Gets the channel\'s newest video or clip, then runs the blocks inside. Needs "log in to Twitch".',
    },
    inputs: [videoType(), channelInput],
    expr: (ctx) =>
      `twitchVideos(${ctx.input("channel")}, "${ctx.raw("type")}", 1).then(async (videos) => videos[0])`,
  }),
  loop({
    id: "twitch_each_top_stream",
    label: "For each top live Twitch stream",
    description: `Runs once for each of the most watched live streams. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-ranking-star",
    keywords: ["top streams", "popular", "directory"],
    variable: STREAM,
    noun: "Twitch stream",
    fields: STREAM_FIELDS,
    block: {
      type: "twitch_forEachTopStream",
      text: [
        "for each top live Twitch stream, max (1-100): {count}",
        "in game / category (empty for all): {game}",
        "do {code}",
      ],
      tooltip:
        'Runs the blocks inside once for each of the most watched live streams. Use "get ... of Twitch stream" inside. Needs "log in to Twitch".',
    },
    inputs: [
      countInput(),
      input.text("game", "Game or category (optional)", {
        default: "",
        help: "Leave it empty for every category.",
      }),
    ],
    expr: (ctx) => `(async () => {
  const game = String(${ctx.input("game")} ?? "").trim();
  const gameId = game ? await twitchGameId(game) : null;
  if (game && !gameId) return [];
  const streams = await twitchHelix("streams", { first: Math.min(100, Math.max(1, Number(${ctx.input("count")}) || 5)), game_id: gameId });
  return (streams || []).map(twitchStreamShape);
})()`,
  }),
];

/* ---- Events ----------------------------------------------------------- */

const events = [
  watcher({
    id: "twitch_channel_live",
    label: "When a Twitch channel goes live",
    description:
      "Runs when a channel starts (or ends) a stream, for live notifications. It's checked every few minutes.",
    icon: "fa-solid fa-tower-broadcast",
    keywords: ["live", "stream started", "goes offline", "notification"],
    variable: STREAM,
    fields: STREAM_FIELDS,
    block: {
      type: "twitch_onLive",
      text: [
        "when Twitch channel: {channel}",
        "{when}",
        "check every (minutes): {minutes}",
      ],
      parts: { channel: { check: "String" } },
      tooltip:
        'Runs when a channel starts (or ends) a stream. Use "get ... of Twitch stream" inside it. The channel is checked every few minutes (at least 1).',
    },
    settings: [
      { ...channelInput, allowValues: false },
      input.dropdown("when", "When it", [
        ["goes live", "live"],
        ["goes offline", "offline"],
      ]),
      minutesInput(),
    ],
    watch: (ctx, body) =>
      liveChangeCode({
        minutes: ctx.input("minutes"),
        label: "Twitch",
        stream: `twitchStream(${ctx.input("channel")})`,
        variable: STREAM,
        when: ctx.raw("when"),
        code: body,
      }),
  }),
  watcher({
    id: "twitch_new_video",
    label: "When a Twitch channel posts a new video",
    description: `Runs once for each new video or clip on a channel. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-film",
    keywords: ["new video", "new clip", "vod", "upload"],
    variable: VIDEO,
    fields: VIDEO_FIELDS,
    block: {
      type: "twitch_onNewVideo",
      text: [
        "when Twitch channel: {channel}",
        "posts a new {type}",
        "check every (minutes): {minutes}",
      ],
      parts: { channel: { check: "String" }, type: { options: VIDEO_TYPES } },
      tooltip:
        'Runs once for each new video or clip on a channel. Use "get ... of Twitch video" inside. Needs "log in to Twitch".',
    },
    settings: [
      { ...channelInput, allowValues: false },
      videoType(),
      minutesInput(),
    ],
    watch: (ctx, body) =>
      newItemsCode({
        minutes: ctx.input("minutes"),
        label: "Twitch",
        list: `twitchVideos(${ctx.input("channel")}, "${ctx.raw("type")}", 20)`,
        variable: VIDEO,
        code: body,
      }),
  }),
];

/* ---- Values ----------------------------------------------------------- */

const QUICK_INFO = [
  ["follower count", "followcount", "Number"],
  ["stream title", "title", "String"],
  ["game / category", "game", "String"],
  ["viewer count", "viewercount", "Number"],
  ["uptime", "uptime", "String"],
  ["profile picture URL", "avatar", "String"],
  ["user ID", "id", "String"],
  ["account creation date", "creation", "String"],
  ["account age", "accountage", "String"],
  ["link to latest past broadcast", "videos", "String"],
  ["channel link", "link", "String"],
];

const values = [
  check({
    id: "twitch_is_live",
    label: "Twitch channel is live?",
    description: "True if a Twitch channel is streaming right now.",
    icon: "fa-solid fa-circle-dot",
    keywords: ["live", "streaming", "online"],
    block: {
      type: "twitch_isLive",
      text: ["Twitch channel: {channel}", "is live right now?"],
      parts: { channel: { check: "String" } },
      tooltip: "Checks whether a Twitch channel is streaming",
    },
    output: "Boolean",
    inputs: [channelInput],
    code: (ctx) => `!!(await twitchStream(${ctx.input("channel")}))`,
  }),
  check({
    id: "twitch_quick_info",
    label: "Info about a Twitch channel",
    description:
      "Quick public info about a Twitch channel, with no login. Title and game are the last ones used, even when offline.",
    icon: "fa-solid fa-circle-info",
    keywords: ["followers", "uptime", "title", "avatar", "follower count"],
    block: {
      type: "twitch_quickInfo",
      text: "{info} of Twitch channel: {channel}",
      parts: {
        channel: { check: "String" },
        info: { options: QUICK_INFO.map(([label, value]) => [label, value]) },
      },
      inline: false,
      tooltip:
        "Quick public info about a Twitch channel. Title and game are the last ones used, even when offline. Uptime is null and viewer count 0 when offline.",
    },
    output: null,
    inputs: [
      input.dropdown(
        "info",
        "What to get",
        QUICK_INFO.map(([label, value]) => [
          label.charAt(0).toUpperCase() + label.slice(1),
          value,
        ]),
      ),
      channelInput,
    ],
    code: (ctx) => {
      const channel = ctx.input("channel");
      const info = ctx.raw("info");
      if (info === "link")
        return `("https://www.twitch.tv/" + twitchLoginName(${channel}))`;
      let code;
      if (info === "followcount")
        code = `twitchDecapi("followcount", ${channel}).then(async (text) => text === null ? null : Number(text) || 0)`;
      else if (info === "viewercount")
        code = `twitchDecapi("viewercount", ${channel}).then(async (text) => Number(text) || 0)`;
      else if (info === "uptime")
        code = `twitchDecapi("uptime", ${channel}).then(async (text) => !text || /is offline$/i.test(text) ? null : text)`;
      else if (info === "videos")
        code = `twitchDecapi("videos", ${channel}, "?limit=1").then(async (text) => (String(text ?? "").match(/https:\\/\\/www\\.twitch\\.tv\\/videos\\/\\d+/) || [])[0] ?? null)`;
      else code = `twitchDecapi("${info}", ${channel})`;
      return `(await ${code}.catch(async () => null))`;
    },
  }),
  check({
    id: "twitch_top_games",
    label: "Top Twitch games",
    description: `The names of the most watched games and categories right now, as a list. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-gamepad",
    keywords: ["games", "categories", "top", "popular"],
    block: {
      type: "twitch_topGames",
      text: "list of top Twitch games / categories, max (1-100): {count}",
      inline: false,
      tooltip:
        'The names of the most watched games and categories right now. Needs "log in to Twitch".',
    },
    output: "Array",
    inputs: [countInput(10)],
    code: (ctx) =>
      `(await twitchHelix("games/top", { first: Math.min(100, Math.max(1, Number(${ctx.input("count")}) || 10)) }).then(async (games) => (games || []).map(game => game.name)).catch(async () => []))`,
  }),
];

export default {
  events,
  actions,
  values,
  components: [],
  contexts: [],
  blocks: [],
};
