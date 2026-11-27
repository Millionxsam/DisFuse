/* =====================================================================
   Kick
   ---------------------------------------------------------------------
   Kick only shares channel and stream info through its official API
   (api.kick.com), which needs an app: a free client ID and secret from
   kick.com/settings/developer. Everything here only reads public data,
   so an app access token (no user login) is enough.
   ===================================================================== */

import { group, input } from "../../define.js";
import { infoBlock, liveChangeCode, minutesInput, site } from "./shared.js";

const colour = "#2BA52E";
const fns = group({ colour });

const SETUP = [
  {
    key: "kickSlug",
    code: `function kickSlug(channel) {
  return String(channel ?? "")
    .trim()
    .replace(/^(https?:\\/\\/)?(www\\.)?kick\\.com\\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
}`,
  },
  {
    key: "kickToken",
    code: `async function kickToken() {
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
  },
  {
    key: "kickApi",
    code: `async function kickApi(path, params = {}) {
  if (!globalThis.kickLogin) {
    console.error('Kick: use "Log in to Kick" (when the bot starts) before using Kick steps.');
    return null;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.append(key, String(value));
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const accessToken = await kickToken();
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
  },
  {
    key: "kickChannelShape",
    code: `function kickChannelShape(channel) {
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
  },
  {
    key: "kickChannel",
    code: `async function kickChannel(channel) {
  const slug = kickSlug(channel);
  if (!slug) return null;
  const channels = await kickApi("channels", { slug });
  if (!channels) return undefined;
  return channels[0] ? kickChannelShape(channels[0]) : null;
}`,
  },
];

const { lookup, loop, watcher, step, check } = site(
  { name: "Kick", colour, setup: SETUP },
  fns,
);

const VARIABLE = "kickChannelInformation";
const HOLDERS = ["kick_getChannel", "kick_onLive", "kick_forEachLivestream"];

const CHANNEL_FIELDS = [
  ["name", "slug", "String", "Channel name"],
  ["link", "url", "String", "Channel link"],
  ["user ID", "userId", "Number"],
  ["description", "description"],
  ["is live right now", "isLive", "Boolean", "Is live right now?"],
  ["stream title", "title"],
  ["category", "category"],
  ["viewer count", "viewers", "Number"],
  ["stream start time", "startedAt", "date"],
  ["stream thumbnail URL", "thumbnailUrl", "String", "Stream thumbnail link"],
  ["stream language", "language"],
  [
    "is for mature audiences",
    "isMature",
    "Boolean",
    "Is for mature audiences?",
  ],
  ["banner image URL", "bannerUrl", "String", "Banner picture link"],
  [
    "profile picture URL",
    "profilePictureUrl",
    "String",
    "Profile picture link",
  ],
];

const channelInput = input.text("channel", "Kick channel", {
  default: "",
  placeholder: "kick.com/name or name",
});

const actions = [
  step({
    id: "kick_login",
    label: "Log in to Kick",
    description:
      "Lets the Kick steps use Kick's official API. Make a free app at kick.com/settings/developer for the client ID and secret. Use it when the bot starts.",
    icon: "fa-solid fa-key",
    keywords: ["login", "api key", "client id"],
    block: {
      type: "kick_login",
      text: [
        "log in to Kick",
        "app client ID: {clientId}",
        "app client secret: {clientSecret}",
      ],
      parts: { clientId: { check: null }, clientSecret: { check: null } },
      tooltip:
        'Lets the Kick blocks use Kick\'s official API. Create a free app at kick.com/settings/developer for the client ID and secret. Put this in "when the bot is logged in".',
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
      `globalThis.kickLogin = { clientId: String(${ctx.input("clientId")} ?? "").trim(), clientSecret: String(${ctx.input("clientSecret")} ?? "").trim() };
await kickToken();\n`,
  }),
  lookup({
    id: "kick_get_channel",
    label: "Look up a Kick channel",
    description: "Finds a Kick channel and its stream.",
    icon: "fa-solid fa-tv",
    keywords: ["channel", "streamer", "stream"],
    variable: VARIABLE,
    noun: "Kick channel",
    fields: CHANNEL_FIELDS,
    info: infoBlock("kick_channelInfo", "Kick channel", CHANNEL_FIELDS, {
      inside: HOLDERS,
      also: ["kick_channel_live", "kick_each_livestream"],
      tooltip:
        'Information about the Kick channel and its stream. The profile picture is only known for channels from "for each live Kick stream"; the description and banner only for channels you got by name.',
    }),
    block: {
      type: "kick_getChannel",
      text: ["get Kick channel: {channel}", "then {code}"],
      parts: { channel: { check: "String" } },
      tooltip:
        'Looks up a Kick channel and its stream, then runs the blocks inside. Use "get ... of Kick channel" inside.',
    },
    inputs: [channelInput],
    expr: (ctx) => `kickChannel(${ctx.input("channel")})`,
  }),
  loop({
    id: "kick_each_livestream",
    label: "For each top live Kick stream",
    description: "Runs once for each of the most watched live streams on Kick.",
    icon: "fa-solid fa-ranking-star",
    keywords: ["top streams", "popular", "live"],
    variable: VARIABLE,
    noun: "Kick stream",
    fields: CHANNEL_FIELDS,
    block: {
      type: "kick_forEachLivestream",
      text: [
        "for each top live Kick stream, max (1-100): {count}",
        "in category (empty for all): {category}",
        "do {code}",
      ],
      tooltip:
        'Runs the blocks inside once for each of the most watched live streams on Kick. Use "get ... of Kick channel" inside.',
    },
    inputs: [
      input.number("count", "How many (1-100)", {
        default: 5,
        min: 1,
        max: 100,
        integer: true,
      }),
      input.text("category", "Category (optional)", {
        default: "",
        help: "Leave it empty for every category.",
      }),
    ],
    expr: (ctx) => `(async () => {
  const category = String(${ctx.input("category")} ?? "").trim();
  let categoryId = null;
  if (category) {
    const found = (await kickApi("categories", { q: category })) || [];
    categoryId = (found.find(item => item.name?.toLowerCase() === category.toLowerCase()) || found[0])?.id;
    if (!categoryId) return [];
  }
  const streams = await kickApi("livestreams", { limit: Math.min(100, Math.max(1, Number(${ctx.input("count")}) || 5)), sort: "viewer_count", category_id: categoryId });
  return (streams || []).map(kickChannelShape);
})()`,
  }),
];

const events = [
  watcher({
    id: "kick_channel_live",
    label: "When a Kick channel goes live",
    description:
      "Runs when a Kick channel starts (or ends) a stream. It's checked every few minutes.",
    icon: "fa-solid fa-tower-broadcast",
    keywords: ["live", "stream started", "goes offline", "notification"],
    variable: VARIABLE,
    fields: CHANNEL_FIELDS,
    block: {
      type: "kick_onLive",
      text: [
        "when Kick channel: {channel}",
        "{when}",
        "check every (minutes): {minutes}",
      ],
      parts: { channel: { check: "String" } },
      tooltip:
        'Runs when a channel starts (or ends) a stream. Use "get ... of Kick channel" inside it. The channel is checked every few minutes (at least 1).',
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
        label: "Kick",
        stream: `kickChannel(${ctx.input("channel")}).then(async (channel) => channel === undefined ? undefined : channel?.isLive ? channel : null)`,
        variable: VARIABLE,
        when: ctx.raw("when"),
        code: body,
      }),
  }),
];

const values = [
  check({
    id: "kick_is_live",
    label: "Kick channel is live?",
    description: "True if a Kick channel is streaming right now.",
    icon: "fa-solid fa-circle-dot",
    keywords: ["live", "streaming", "online"],
    block: {
      type: "kick_isLive",
      text: ["Kick channel: {channel}", "is live right now?"],
      parts: { channel: { check: "String" } },
      tooltip: "Checks whether a Kick channel is streaming",
    },
    output: "Boolean",
    inputs: [channelInput],
    code: (ctx) =>
      `await kickChannel(${ctx.input("channel")}).then(async (channel) => !!channel?.isLive).catch(async () => false)`,
  }),
  check({
    id: "kick_viewer_count",
    label: "Viewers of a Kick channel",
    description:
      "How many people are watching a Kick channel (0 when it's offline).",
    icon: "fa-solid fa-eye",
    keywords: ["viewers", "watching", "count"],
    block: {
      type: "kick_viewerCount",
      text: "viewer count of Kick channel: {channel}",
      parts: { channel: { check: "String" } },
      inline: false,
      tooltip: "How many people are watching a Kick channel (0 when offline)",
    },
    output: "Number",
    inputs: [channelInput],
    code: (ctx) =>
      `await kickChannel(${ctx.input("channel")}).then(async (channel) => channel?.viewers ?? 0).catch(async () => 0)`,
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
