/* =====================================================================
   YouTube
   ---------------------------------------------------------------------
   Videos, channels, playlists, new uploads and livestreams, read from
   YouTube's public pages and feeds, so most steps need no account. The
   "exact" stats, search and comments use the YouTube Data API, which
   needs a free API key (console.cloud.google.com).
   ===================================================================== */

import { group, input } from "../../define.js";
import { ALL_HELPERS } from "./youtube.helpers.js";
import { infoBlock, minutesInput, site } from "./shared.js";

const colour = "#FF0000";
const { lookup, loop, watcher, check } = site(
  { name: "YouTube", colour, setup: ALL_HELPERS },
  group({ colour }),
);

const KINDS = [
  ["upload (video or Short)", "any"],
  ["video (not a Short)", "video"],
  ["Short", "short"],
];
const kindInput = () =>
  input.dropdown(
    "kind",
    "Kind of upload",
    [
      ["Any upload (video or Short)", "any"],
      ["Video (not a Short)", "video"],
      ["Short", "short"],
    ],
    { default: "any" },
  );

const videoInput = input.text("video", "YouTube video (link or ID)", {
  default: "",
  placeholder: "https://youtu.be/...",
});
const channelInput = input.text("channel", "YouTube channel", {
  default: "",
  placeholder: "@handle, link or channel ID",
});
const keyInput = input.text("key", "API key", {
  default: "",
  help: "A YouTube Data API key. Keep it in a Secret, and use the Secret here.",
});

/* ---- What the info blocks read --------------------------------------- */

const VIDEO = "youtubeVideoInformation";
const VIDEO_FIELDS = [
  ["title", "title"],
  ["description", "description"],
  ["link", "url", "String", "Video link"],
  ["video ID", "id"],
  ["channel name", "channelName"],
  ["channel ID", "channelId"],
  ["channel link", "channelUrl"],
  ["views", "views", "Number"],
  ["likes", "likes", "Number"],
  ["upload date", "publishedAt", "date"],
  ["length in seconds", "lengthSeconds", "Number"],
  ["thumbnail image URL", "thumbnailUrl", "String", "Thumbnail link"],
  ["is a Short", "isShort", "Boolean", "Is a Short?"],
  ["is live right now", "isLive", "Boolean", "Is live right now?"],
  ["category", "category"],
  ["tags (list)", "keywords", "Array", "Tags"],
];

const CHANNEL = "youtubeChannelInformation";
const CHANNEL_FIELDS = [
  ["name", "name", "String", "Channel name"],
  ["@handle", "handle"],
  ["description", "description"],
  ["channel ID", "id"],
  ["link", "url", "String", "Channel link"],
  ["subscribers (rounded number)", "subscribers", "Number"],
  [
    'subscribers (text like "1.2M")',
    "subscribersText",
    "String",
    "Subscribers (as text, like 1.2M)",
  ],
  ["video count (number)", "videos", "Number", "Number of videos"],
  ["video count (text)", "videosText", "String", "Number of videos (as text)"],
  ["creation date", "createdAt", "date"],
  ["profile picture URL", "avatarUrl", "String", "Profile picture link"],
  ["banner image URL", "bannerUrl", "String", "Banner picture link"],
  ["is family safe", "isFamilySafe", "Boolean", "Is family safe?"],
];

const COMMENT = "youtubeCommentInformation";
const COMMENT_FIELDS = [
  ["text", "text", "String", "Comment text"],
  ["author name", "author"],
  [
    "author profile picture URL",
    "authorAvatarUrl",
    "String",
    "Author's profile picture link",
  ],
  [
    "author channel link",
    "authorChannelUrl",
    "String",
    "Author's channel link",
  ],
  ["likes", "likes", "Number"],
  ["reply count", "replies", "Number", "Number of replies"],
  ["date", "publishedAt", "date"],
  ["link", "url", "String", "Comment link"],
  ["comment ID", "id"],
];

const VIDEO_HOLDERS = [
  "youtube_getVideo",
  "youtube_getLatestVideo",
  "youtube_forEachVideo",
  "youtube_forEachPlaylistVideo",
  "youtube_onNewVideo",
  "youtube_onLive",
  "youtube_apiSearch",
];

const videoInfo = infoBlock(
  "youtube_videoInfo",
  "YouTube video",
  VIDEO_FIELDS,
  {
    inside: VIDEO_HOLDERS,
    also: [
      "youtube_latest_video",
      "youtube_each_video",
      "youtube_each_playlist_video",
      "youtube_new_video",
      "youtube_channel_live",
      "youtube_search",
    ],
    tooltip:
      "Information about the YouTube video you got. Videos from a channel's uploads have likes but no length or tags; videos you get by link have length and tags but no likes. Missing info is null.",
  },
);

/* ---- Steps ------------------------------------------------------------ */

const actions = [
  lookup({
    id: "youtube_get_video",
    label: "Look up a YouTube video",
    description: "Finds a public YouTube video by its link or ID.",
    icon: "fa-brands fa-youtube",
    keywords: ["video", "watch", "link"],
    variable: VIDEO,
    noun: "YouTube video",
    fields: VIDEO_FIELDS,
    info: videoInfo,
    block: {
      type: "youtube_getVideo",
      text: ["get YouTube video (link or ID): {video}", "then {code}"],
      parts: { video: { check: "String" } },
      tooltip:
        "Looks up a public YouTube video by its link or ID, then runs the blocks inside",
    },
    inputs: [videoInput],
    expr: (ctx) => `youtubeVideo(${ctx.input("video")})`,
  }),
  lookup({
    id: "youtube_latest_video",
    label: "Get a YouTube channel's latest upload",
    description: "Gets the newest video or Short of a channel.",
    icon: "fa-solid fa-clapperboard",
    keywords: ["latest", "newest", "upload", "video"],
    variable: VIDEO,
    noun: "YouTube video",
    fields: VIDEO_FIELDS,
    block: {
      type: "youtube_getLatestVideo",
      text: ["get latest {kind} of YouTube channel: {channel}", "then {code}"],
      parts: { channel: { check: "String" }, kind: { options: KINDS } },
      tooltip:
        "Gets the newest upload of a channel (by @handle, link or channel ID), then runs the blocks inside",
    },
    inputs: [kindInput(), channelInput],
    expr: (ctx) =>
      `youtubeUploads(${ctx.input("channel")}, "${ctx.raw("kind")}").then(async (videos) => videos[0])`,
  }),
  loop({
    id: "youtube_each_video",
    label: "For each recent YouTube upload",
    description:
      "Runs once for each of a channel's latest uploads (up to 15), newest first.",
    icon: "fa-solid fa-film",
    keywords: ["uploads", "videos", "shorts"],
    variable: VIDEO,
    noun: "YouTube video",
    fields: VIDEO_FIELDS,
    block: {
      type: "youtube_forEachVideo",
      text: [
        "for each recent {kind} of YouTube channel: {channel}",
        "do {code}",
      ],
      parts: { channel: { check: "String" }, kind: { options: KINDS } },
      tooltip:
        "Runs the blocks inside once for each of the channel's latest uploads (up to 15), newest first",
    },
    inputs: [kindInput(), channelInput],
    expr: (ctx) =>
      `youtubeUploads(${ctx.input("channel")}, "${ctx.raw("kind")}")`,
  }),
  loop({
    id: "youtube_each_playlist_video",
    label: "For each video in a YouTube playlist",
    description:
      "Runs once for each video in a public playlist (the first 15).",
    icon: "fa-solid fa-list",
    keywords: ["playlist", "videos"],
    variable: VIDEO,
    noun: "YouTube video",
    fields: VIDEO_FIELDS,
    block: {
      type: "youtube_forEachPlaylistVideo",
      text: [
        "for each video in YouTube playlist (link or ID): {playlist}",
        "do {code}",
      ],
      parts: { playlist: { check: "String" } },
      tooltip:
        "Runs the blocks inside once for each video in a public playlist (the first 15)",
    },
    inputs: [input.text("playlist", "Playlist (link or ID)", { default: "" })],
    expr: (ctx) =>
      `youtubeFeed("playlist_id=" + encodeURIComponent((String(${ctx.input("playlist")}).match(/[?&]list=([A-Za-z0-9_-]+)/) || [])[1] || String(${ctx.input("playlist")}).trim()))`,
  }),
  loop({
    id: "youtube_search",
    label: "For each YouTube video found",
    description:
      "Searches YouTube for videos and runs once per result. Needs a YouTube Data API key.",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["search", "find", "api"],
    variable: VIDEO,
    noun: "YouTube video",
    fields: VIDEO_FIELDS,
    block: {
      type: "youtube_apiSearch",
      text: [
        "for each YouTube video found searching: {query}",
        "sorted by {order}",
        "max results (1-50): {count}",
        "with API key: {key}",
        "do {code}",
      ],
      parts: { key: { check: null } },
      inline: false,
      tooltip:
        'Searches YouTube for videos and runs the blocks inside once per result. Use "get ... of YouTube video" inside it. Needs a YouTube Data API key.',
    },
    inputs: [
      input.text("query", "Search for", { default: "" }),
      input.dropdown("order", "Sorted by", [
        ["Relevance", "relevance"],
        ["Upload date", "date"],
        ["View count", "viewCount"],
        ["Rating", "rating"],
      ]),
      input.number("count", "How many (1-50)", {
        default: 5,
        min: 1,
        max: 50,
        integer: true,
      }),
      keyInput,
    ],
    expr: (ctx) =>
      `youtubeApi("search", { part: "snippet", type: "video", order: "${ctx.raw("order")}", q: String(${ctx.input("query")}), maxResults: String(Math.min(50, Math.max(1, Number(${ctx.input("count")}) || 5))) }, ${ctx.input("key")}).then(async (json) => (json?.items ?? []).map(youtubeApiVideo))`,
  }),
  loop({
    id: "youtube_each_comment",
    label: "For each comment on a YouTube video",
    description:
      "Runs once for each top comment on a video. Needs a YouTube Data API key.",
    icon: "fa-solid fa-comments",
    keywords: ["comments", "replies", "api"],
    variable: COMMENT,
    noun: "YouTube comment",
    fields: COMMENT_FIELDS,
    info: infoBlock("youtube_commentInfo", "YouTube comment", COMMENT_FIELDS, {
      inside: ["youtube_apiForEachComment"],
      tooltip: "Information about the YouTube comment",
    }),
    block: {
      type: "youtube_apiForEachComment",
      text: [
        "for each top comment on YouTube video (link or ID): {video}",
        "sorted by {order}",
        "max comments (1-100): {count}",
        "with API key: {key}",
        "do {code}",
      ],
      parts: { key: { check: null } },
      inline: false,
      tooltip:
        'Runs the blocks inside once for each comment on a video. Use "get ... of YouTube comment" inside it. Needs a YouTube Data API key.',
    },
    inputs: [
      videoInput,
      input.dropdown("order", "Sorted by", [
        ["Most relevant", "relevance"],
        ["Newest", "time"],
      ]),
      input.number("count", "How many (1-100)", {
        default: 20,
        min: 1,
        max: 100,
        integer: true,
      }),
      keyInput,
    ],
    expr: (
      ctx,
    ) => `youtubeApi("commentThreads", { part: "snippet", textFormat: "plainText", order: "${ctx.raw("order")}", videoId: String(youtubeVideoId(${ctx.input("video")})), maxResults: String(Math.min(100, Math.max(1, Number(${ctx.input("count")}) || 20))) }, ${ctx.input("key")}).then(async (json) => (json?.items ?? []).map(thread => {
  const comment = thread.snippet.topLevelComment.snippet;
  return {
    id: thread.snippet.topLevelComment.id,
    text: comment.textDisplay,
    author: comment.authorDisplayName,
    authorAvatarUrl: comment.authorProfileImageUrl,
    authorChannelUrl: comment.authorChannelUrl,
    likes: comment.likeCount,
    replies: thread.snippet.totalReplyCount,
    publishedAt: new Date(comment.publishedAt),
    url: "https://www.youtube.com/watch?v=" + thread.snippet.videoId + "&lc=" + thread.snippet.topLevelComment.id
  };
}))`,
  }),
  lookup({
    id: "youtube_get_channel",
    label: "Look up a YouTube channel",
    description: "Finds a YouTube channel by its @handle, link or ID.",
    icon: "fa-solid fa-user",
    keywords: ["channel", "subscribers", "creator"],
    variable: CHANNEL,
    noun: "YouTube channel",
    fields: CHANNEL_FIELDS,
    info: infoBlock("youtube_channelInfo", "YouTube channel", CHANNEL_FIELDS, {
      inside: ["youtube_getChannel"],
      tooltip:
        "Information about the YouTube channel you got. YouTube rounds public subscriber counts (like 1.23M).",
    }),
    block: {
      type: "youtube_getChannel",
      text: [
        "get YouTube channel (@handle, link or ID): {channel}",
        "then {code}",
      ],
      parts: { channel: { check: "String" } },
      tooltip: "Looks up a YouTube channel, then runs the blocks inside",
    },
    inputs: [channelInput],
    expr: (ctx) => `youtubeChannel(${ctx.input("channel")})`,
  }),
];

/* ---- Events ----------------------------------------------------------- */

const events = [
  watcher({
    id: "youtube_new_video",
    label: "When a YouTube channel posts a new upload",
    description:
      "Runs when a channel uploads something new, for upload notifications. It's checked every few minutes.",
    icon: "fa-brands fa-youtube",
    keywords: ["new video", "upload", "notification", "short"],
    variable: VIDEO,
    fields: VIDEO_FIELDS,
    block: {
      type: "youtube_onNewVideo",
      text: [
        "when YouTube channel: {channel}",
        "posts a new {kind}",
        "check every (minutes): {minutes}",
      ],
      parts: { channel: { check: "String" }, kind: { options: KINDS } },
      tooltip:
        'Runs when a channel uploads something new — great for upload notifications. Use "get ... of YouTube video" inside it. The channel is checked every few minutes (at least 1), so it may take that long to notice.',
    },
    settings: [
      { ...channelInput, allowValues: false },
      kindInput(),
      minutesInput(),
    ],
    watch: (ctx, body) => `(() => {
  let seenVideos = null;
  youtubeWatch(${ctx.input("minutes")}, async () => {
    const videos = await youtubeUploads(${ctx.input("channel")}, "${ctx.raw("kind")}");
    if (!videos.length) return;

    if (!seenVideos) {
      seenVideos = new Set(videos.map(video => video.id));
      return;
    }

    for (const ${VIDEO} of videos.filter(video => !seenVideos.has(video.id)).reverse()) {
      seenVideos.add(${VIDEO}.id);
      ${body}}
  });
})();\n`,
  }),
  watcher({
    id: "youtube_channel_live",
    label: "When a YouTube channel goes live",
    description:
      "Runs when a channel starts a livestream. It's checked every few minutes.",
    icon: "fa-solid fa-tower-broadcast",
    keywords: ["live", "livestream", "stream", "notification"],
    variable: VIDEO,
    fields: VIDEO_FIELDS,
    block: {
      type: "youtube_onLive",
      text: [
        "when YouTube channel: {channel}",
        "goes live",
        "check every (minutes): {minutes}",
      ],
      parts: { channel: { check: "String" } },
      tooltip:
        'Runs when a channel starts a livestream. Use "get ... of YouTube video" inside it for the stream\'s title, link and thumbnail. The channel is checked every few minutes (at least 1).',
    },
    settings: [{ ...channelInput, allowValues: false }, minutesInput()],
    watch: (ctx, body) => `(() => {
  let lastLiveVideo;
  youtubeWatch(${ctx.input("minutes")}, async () => {
    const ${VIDEO} = await youtubeLiveVideo(${ctx.input("channel")});
    const liveId = ${VIDEO}?.id ?? null;

    if (lastLiveVideo === undefined) {
      lastLiveVideo = liveId;
      return;
    }

    if (!liveId || liveId === lastLiveVideo) {
      lastLiveVideo = liveId;
      return;
    }

    lastLiveVideo = liveId;
    ${body}});
})();\n`,
  }),
];

/* ---- Values ----------------------------------------------------------- */

const values = [
  check({
    id: "youtube_is_live",
    label: "YouTube channel is live?",
    description: "True if a channel is livestreaming right now.",
    icon: "fa-solid fa-circle-dot",
    keywords: ["live", "streaming"],
    block: {
      type: "youtube_isLive",
      text: ["YouTube channel: {channel}", "is live right now?"],
      parts: { channel: { check: "String" } },
      tooltip: "Checks whether a channel is livestreaming",
    },
    output: "Boolean",
    inputs: [channelInput],
    code: (ctx) =>
      `(await youtubeLiveVideo(${ctx.input("channel")}).then(async (video) => !!video).catch(async () => false))`,
  }),
  check({
    id: "youtube_video_exists",
    label: "YouTube video exists?",
    description:
      "True if a link or ID points to a public (or unlisted) YouTube video.",
    icon: "fa-solid fa-circle-check",
    keywords: ["exists", "valid", "check link"],
    block: {
      type: "youtube_videoExists",
      text: ["YouTube video (link or ID): {video}", "exists?"],
      parts: { video: { check: "String" } },
      tooltip:
        "Checks whether a link or ID points to a public (or unlisted) YouTube video",
    },
    output: "Boolean",
    inputs: [videoInput],
    code: (ctx) => `(await (async () => {
      const id = youtubeVideoId(${ctx.input("video")});
      if (!id) return false;
      return fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id)).then(async (res) => res.ok).catch(async () => false);
    })())`,
  }),
  check({
    id: "youtube_video_id",
    label: "Video ID from a YouTube link",
    description:
      "The 11-character video ID in any YouTube link (watch, youtu.be, Shorts, live). Empty if there isn't one.",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id", "parse link"],
    block: {
      type: "youtube_videoId",
      text: "video ID from YouTube link: {video}",
      parts: { video: { check: "String" } },
      inline: false,
      tooltip:
        "Takes the 11-character video ID out of any YouTube link (watch, youtu.be, Shorts, live). Null if there isn't one.",
    },
    output: "String",
    inputs: [videoInput],
    code: (ctx) => `youtubeVideoId(${ctx.input("video")})`,
  }),
  check({
    id: "youtube_thumbnail",
    label: "Thumbnail of a YouTube video",
    description:
      "A link to a video's thumbnail picture. Not every video has a max quality one.",
    icon: "fa-solid fa-image",
    keywords: ["thumbnail", "image", "picture"],
    block: {
      type: "youtube_thumbnail",
      text: "YouTube {quality} thumbnail of video (link or ID): {video}",
      parts: { video: { check: "String" } },
      inline: false,
      tooltip:
        "A link to a video's thumbnail image, great inside embeds. Not every video has a max quality thumbnail.",
    },
    output: "String",
    inputs: [
      input.dropdown("quality", "Quality", [
        ["high quality (480x360)", "hqdefault"],
        ["max quality (1280x720)", "maxresdefault"],
        ["medium quality (320x180)", "mqdefault"],
        ["standard quality (640x480)", "sddefault"],
      ]),
      videoInput,
    ],
    code: (ctx) =>
      `("https://i.ytimg.com/vi/" + youtubeVideoId(${ctx.input("video")}) + "/${ctx.raw("quality")}.jpg")`,
  }),
  check({
    id: "youtube_channel_id",
    label: "ID of a YouTube channel",
    description:
      'The channel ID (starting with "UC") of a channel, or nothing if it doesn\'t exist.',
    icon: "fa-solid fa-fingerprint",
    keywords: ["channel id", "uc"],
    block: {
      type: "youtube_channelId",
      text: "channel ID of YouTube channel (@handle or link): {channel}",
      parts: { channel: { check: "String" } },
      inline: false,
      tooltip:
        'The channel ID (starting with "UC") of a channel, or null if it doesn\'t exist',
    },
    output: "String",
    inputs: [channelInput],
    code: (ctx) =>
      `(await youtubeChannelId(${ctx.input("channel")}).catch(async () => null))`,
  }),
  check({
    id: "youtube_subscribers",
    label: "Subscribers of a YouTube channel",
    description:
      'A channel\'s public subscriber count as YouTube shows it, like "1.23M".',
    icon: "fa-solid fa-users",
    keywords: ["subscribers", "subs", "count"],
    block: {
      type: "youtube_subscribers",
      text: "subscriber count of YouTube channel: {channel}",
      parts: { channel: { check: "String" } },
      inline: false,
      tooltip:
        'The channel\'s public subscriber count as YouTube shows it, like "1.23M"',
    },
    output: "String",
    inputs: [channelInput],
    code: (ctx) =>
      `(await youtubeChannel(${ctx.input("channel")}).then(async (channel) => channel?.subscribersText ?? null).catch(async () => null))`,
  }),
  check({
    id: "youtube_latest_video_link",
    label: "Link to a YouTube channel's latest upload",
    description:
      "A link to a channel's newest upload, or nothing if it has none.",
    icon: "fa-solid fa-link",
    keywords: ["latest", "newest", "link"],
    block: {
      type: "youtube_latestVideoLink",
      text: "link to latest {kind} of YouTube channel: {channel}",
      parts: { channel: { check: "String" }, kind: { options: KINDS } },
      inline: false,
      tooltip: "A link to a channel's newest upload, or null if it has none",
    },
    output: "String",
    inputs: [kindInput(), channelInput],
    code: (ctx) =>
      `(await youtubeUploads(${ctx.input("channel")}, "${ctx.raw("kind")}").then(async (videos) => videos[0]?.url ?? null).catch(async () => null))`,
  }),
  check({
    id: "youtube_video_stat",
    label: "Exact stats of a YouTube video",
    description:
      "The exact views, likes or comments of a video. Needs a YouTube Data API key.",
    icon: "fa-solid fa-chart-simple",
    keywords: ["views", "likes", "comments", "stats", "api"],
    block: {
      type: "youtube_apiVideoStat",
      text: [
        "exact {stat}",
        "of YouTube video (link or ID): {video}",
        "with API key: {key}",
      ],
      parts: { video: { check: "String" }, key: { check: null } },
      inline: false,
      tooltip:
        "An exact statistic of a video from the YouTube Data API. Needs an API key.",
    },
    output: "Number",
    inputs: [
      input.dropdown("stat", "Stat", [
        ["views", "viewCount"],
        ["likes", "likeCount"],
        ["comments", "commentCount"],
      ]),
      videoInput,
      keyInput,
    ],
    code: (ctx) =>
      `(await youtubeApi("videos", { part: "statistics", id: String(youtubeVideoId(${ctx.input("video")})) }, ${ctx.input("key")}).then(async (json) => json?.items?.[0] ? Number(json.items[0].statistics.${ctx.raw("stat")}) || 0 : null).catch(async () => null))`,
  }),
  check({
    id: "youtube_channel_stat",
    label: "Exact stats of a YouTube channel",
    description:
      "A channel's subscribers, total views or video count. YouTube still rounds subscribers to 3 digits. Needs a YouTube Data API key.",
    icon: "fa-solid fa-chart-simple",
    keywords: ["subscribers", "views", "videos", "stats", "api"],
    block: {
      type: "youtube_apiChannelStat",
      text: [
        "exact {stat}",
        "of YouTube channel: {channel}",
        "with API key: {key}",
      ],
      parts: { channel: { check: "String" }, key: { check: null } },
      inline: false,
      tooltip:
        "A statistic of a channel from the YouTube Data API. YouTube still rounds subscriber counts to 3 digits. Needs an API key.",
    },
    output: "Number",
    inputs: [
      input.dropdown("stat", "Stat", [
        ["subscribers", "subscriberCount"],
        ["total views", "viewCount"],
        ["video count", "videoCount"],
      ]),
      channelInput,
      keyInput,
    ],
    code: (ctx) =>
      `(await youtubeChannelId(${ctx.input("channel")}).then(async (id) => id ? youtubeApi("channels", { part: "statistics", id }, ${ctx.input("key")}) : null).then(async (json) => json?.items?.[0] ? Number(json.items[0].statistics.${ctx.raw("stat")}) || 0 : null).catch(async () => null))`,
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
