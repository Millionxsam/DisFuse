/* =====================================================================
   TikTok
   ---------------------------------------------------------------------
   TikTok's only public, keyless API is oEmbed, which can tell whether a
   profile exists and its display name. Those values need no login.

   Everything else uses TikTok's official APIs (open.tiktokapis.com)
   with an app from developers.tiktok.com: the Display API reads the
   logged in account's profile and videos, and the Content Posting API
   uploads videos. The app's client key and secret plus a refresh token
   (from authorizing the app once with Login Kit) let the bot get fresh
   access tokens by itself, since those only last 24 hours.
   ===================================================================== */

import { group, input } from "../../define.js";
import { ALL_HELPERS } from "./tiktok.helpers.js";
import { infoBlock, minutesInput, newItemsCode, site } from "./shared.js";

const colour = "#EE1D52";
const { lookup, loop, watcher, step, check } = site(
  { name: "TikTok", colour, setup: ALL_HELPERS },
  group({ colour }),
);

const NEEDS_LOGIN = 'Needs "Log in to TikTok" first.';
const VIDEO_QUERY_FIELDS =
  "id,title,video_description,duration,cover_image_url,share_url,embed_link,create_time,like_count,comment_count,share_count,view_count";

const userInput = input.text("user", "TikTok user", {
  default: "",
  placeholder: "@username or link",
});

/* ---- What the info blocks read --------------------------------------- */

const ACCOUNT = "tiktokAccountInformation";
const ACCOUNT_FIELDS = [
  ["@username", "username"],
  ["display name", "name"],
  ["bio", "bio"],
  ["link", "url", "String", "Profile link"],
  ["profile picture URL", "avatarUrl", "String", "Profile picture link"],
  ["is verified", "isVerified", "Boolean", "Is verified?"],
  ["followers count", "followers", "Number", "Number of followers"],
  ["following count", "following", "Number", "Number following"],
  ["total likes", "likes", "Number"],
  ["video count", "videos", "Number", "Number of videos"],
  ["open ID", "id"],
];

const VIDEO = "tiktokVideoInformation";
const VIDEO_FIELDS = [
  ["title", "title"],
  ["description", "description"],
  ["link", "url", "String", "Video link"],
  ["video ID", "id"],
  ["embed link", "embedUrl"],
  ["cover image URL", "coverUrl", "String", "Cover picture link"],
  ["length in seconds", "lengthSeconds", "Number"],
  ["post date", "createdAt", "date"],
  ["views", "views", "Number"],
  ["likes", "likes", "Number"],
  ["comments", "comments", "Number"],
  ["shares", "shares", "Number"],
];

/* ---- Steps ------------------------------------------------------------ */

const actions = [
  step({
    id: "tiktok_login",
    label: "Log in to TikTok",
    description:
      "Lets the TikTok steps use your account. Make an app at developers.tiktok.com with Login Kit (and Content Posting to upload), authorize it once to get a refresh token, and save all three as Secrets. Use it when the bot starts.",
    icon: "fa-solid fa-key",
    keywords: ["login", "api", "client key", "refresh token"],
    block: {
      type: "tiktok_login",
      text: [
        "log in to TikTok",
        "app client key: {clientKey}",
        "app client secret: {clientSecret}",
        "refresh token: {refreshToken}",
      ],
      parts: {
        clientKey: { check: null },
        clientSecret: { check: null },
        refreshToken: { check: null },
      },
      tooltip:
        'Lets the TikTok blocks use your account. Make an app at developers.tiktok.com with Login Kit (and Content Posting to upload), authorize it once to get a refresh token, and save all three as secrets. Put this in "when the bot is logged in".',
    },
    inputs: [
      ["clientKey", "App client key"],
      ["clientSecret", "App client secret"],
      ["refreshToken", "Refresh token"],
    ].map(([key, label]) =>
      input.text(key, label, {
        default: "",
        help: "Keep it in a Secret, and use the Secret here.",
      }),
    ),
    code: (ctx) => {
      const field = (name) => `String(${ctx.input(name)} ?? "").trim()`;
      return `globalThis.tiktokLogin = { clientKey: ${field("clientKey")}, clientSecret: ${field("clientSecret")}, refreshToken: ${field("refreshToken")} };
await tiktokToken();\n`;
    },
  }),
  lookup({
    id: "tiktok_get_account",
    label: "Get my TikTok account",
    description: `Gets the logged in account's profile. ${NEEDS_LOGIN}`,
    icon: "fa-brands fa-tiktok",
    keywords: ["account", "profile", "followers"],
    variable: ACCOUNT,
    noun: "TikTok account",
    fields: ACCOUNT_FIELDS,
    info: infoBlock("tiktok_accountInfo", "TikTok account", ACCOUNT_FIELDS, {
      inside: ["tiktok_getAccount"],
      tooltip:
        "Information about your TikTok account. Some info needs the matching scope on your app (user.info.profile, user.info.stats); missing info is null.",
    }),
    block: {
      type: "tiktok_getAccount",
      text: ["get my TikTok account", "then {code}"],
      tooltip:
        'Gets the account from "log in to TikTok", then runs the blocks inside. Use "get ... of TikTok account" inside.',
    },
    expr: () => "tiktokAccount()",
  }),
  lookup({
    id: "tiktok_latest_video",
    label: "Get my latest TikTok video",
    description: `Gets your newest public video. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-clapperboard",
    keywords: ["latest", "newest", "video"],
    variable: VIDEO,
    noun: "TikTok video",
    fields: VIDEO_FIELDS,
    info: infoBlock("tiktok_videoInfo", "TikTok video", VIDEO_FIELDS, {
      inside: [
        "tiktok_getLatestVideo",
        "tiktok_forEachVideo",
        "tiktok_getVideo",
        "tiktok_onNewVideo",
      ],
      also: ["tiktok_each_video", "tiktok_get_video", "tiktok_new_video"],
    }),
    block: {
      type: "tiktok_getLatestVideo",
      text: ["get my latest TikTok video", "then {code}"],
      tooltip: "Gets your newest public video, then runs the blocks inside",
    },
    expr: () => "tiktokVideos(1).then(async (videos) => videos[0])",
  }),
  loop({
    id: "tiktok_each_video",
    label: "For each of my recent TikTok videos",
    description: `Runs once for each of your latest public videos, newest first. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-film",
    keywords: ["videos", "feed"],
    variable: VIDEO,
    noun: "TikTok video",
    fields: VIDEO_FIELDS,
    block: {
      type: "tiktok_forEachVideo",
      text: [
        "for each of my recent TikTok videos, max (1-20): {count}",
        "do {code}",
      ],
      tooltip:
        "Runs the blocks inside once for each of your latest public videos, newest first",
    },
    inputs: [
      input.number("count", "How many (1-20)", {
        default: 10,
        min: 1,
        max: 20,
        integer: true,
      }),
    ],
    expr: (ctx) => `tiktokVideos(${ctx.input("count")})`,
  }),
  lookup({
    id: "tiktok_get_video",
    label: "Look up one of my TikTok videos",
    description: `Finds one of your videos, with its views, likes and more. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["video", "link", "views"],
    variable: VIDEO,
    noun: "TikTok video",
    fields: VIDEO_FIELDS,
    block: {
      type: "tiktok_getVideo",
      text: ["get my TikTok video (link or ID): {video}", "then {code}"],
      parts: { video: { check: "String" } },
      tooltip:
        "Looks up one of your videos (with its views, likes and more), then runs the blocks inside",
    },
    inputs: [input.text("video", "Your video (link or ID)", { default: "" })],
    expr: (ctx) => `tiktokVideoId(${ctx.input("video")}).then(async (id) => {
  if (!id) return null;
  const data = await tiktokApi("POST", "video/query/", { query: { fields: "${VIDEO_QUERY_FIELDS}" }, body: { filters: { video_ids: [id] } } });
  return data?.videos?.[0] ? tiktokVideoShape(data.videos[0]) : null;
})`,
  }),
  step({
    id: "tiktok_upload_video",
    label: "Upload a video to TikTok",
    description:
      'Uploads an MP4 video from a link, as a draft in your TikTok inbox or as a post. Until TikTok audits your app, only "only me" posts are allowed.',
    icon: "fa-solid fa-upload",
    keywords: ["upload", "post", "publish", "draft"],
    block: {
      type: "tiktok_uploadVideo",
      text: [
        "upload video to TikTok from URL: {url}",
        "as {mode}",
        "caption (posts only): {caption}",
      ],
      tooltip:
        'Uploads an MP4 video from a URL. Drafts show up in your TikTok app\'s inbox to finish there (needs the video.upload scope). Posting directly needs the video.publish scope, and until TikTok audits your app, only "only me" posts are allowed.',
    },
    inputs: [
      input.text("url", "Video link", { default: "" }),
      input.dropdown("mode", "As", [
        ["a draft in my TikTok inbox", "inbox"],
        ["a post visible to only me", "SELF_ONLY"],
        ["a post visible to friends", "MUTUAL_FOLLOW_FRIENDS"],
        ["a post visible to followers", "FOLLOWER_OF_CREATOR"],
        ["a public post", "PUBLIC_TO_EVERYONE"],
      ]),
      input.text("caption", "Caption (posts only)", {
        default: "",
        multiline: true,
      }),
    ],
    code: (ctx) => {
      const mode = ctx.raw("mode");
      const init =
        mode === "inbox"
          ? `tiktokApi("POST", "post/publish/inbox/video/init/", { body: { source_info: source } })`
          : `tiktokApi("POST", "post/publish/video/init/", { body: { post_info: { title: String(${ctx.input("caption")} ?? ""), privacy_level: "${mode}" }, source_info: source } })`;
      return `await (async () => {
  const video = await fetch(String(${ctx.input("url")} ?? "").trim()).then(async (res) => res.ok ? Buffer.from(await res.arrayBuffer()) : null).catch(async () => null);
  if (!video?.length) {
    console.error("TikTok: couldn't download the video to upload.");
    return;
  }
  const size = video.length;
  const chunkSize = size <= 64 * 1024 * 1024 ? size : 10 * 1024 * 1024;
  const chunks = Math.max(1, Math.floor(size / chunkSize));
  const source = { source: "FILE_UPLOAD", video_size: size, chunk_size: chunkSize, total_chunk_count: chunks };
  const upload = await ${init};
  if (!upload?.upload_url) return;
  for (let index = 0; index < chunks; index++) {
    const start = index * chunkSize;
    const end = index === chunks - 1 ? size : start + chunkSize;
    const res = await fetch(upload.upload_url, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4", "Content-Length": String(end - start), "Content-Range": "bytes " + start + "-" + (end - 1) + "/" + size },
      body: video.subarray(start, end)
    });
    if (!res.ok && res.status !== 206) {
      console.error("TikTok upload failed (" + res.status + "):", await res.text().catch(async () => ""));
      return;
    }
  }
})().catch(async (error) => console.error("Error uploading to TikTok:", error));\n`;
    },
  }),
];

/* ---- Events ----------------------------------------------------------- */

const events = [
  watcher({
    id: "tiktok_new_video",
    label: "When I post on TikTok",
    description: `Runs once for each new public video on your account, for sharing your TikToks in Discord. ${NEEDS_LOGIN}`,
    icon: "fa-brands fa-tiktok",
    keywords: ["new video", "notification", "share"],
    variable: VIDEO,
    fields: VIDEO_FIELDS,
    block: {
      type: "tiktok_onNewVideo",
      text: ["when I post on TikTok", "check every (minutes): {minutes}"],
      tooltip:
        'Runs once for each new public video on your account — great for sharing your TikToks in Discord. Use "get ... of TikTok video" inside. Needs "log in to TikTok".',
    },
    settings: [minutesInput()],
    watch: (ctx, body) =>
      newItemsCode({
        minutes: ctx.input("minutes"),
        label: "TikTok",
        list: "tiktokVideos(20)",
        variable: VIDEO,
        code: body,
      }),
  }),
];

/* ---- Values ----------------------------------------------------------- */

const values = [
  check({
    id: "tiktok_user_exists",
    label: "TikTok user exists?",
    description: "True if a public TikTok account exists. Needs no login.",
    icon: "fa-solid fa-user-check",
    keywords: ["exists", "valid", "account"],
    block: {
      type: "tiktok_userExists",
      text: ["TikTok user: {user}", "exists?"],
      parts: { user: { check: "String" } },
      tooltip: "Checks whether a public TikTok account exists",
    },
    output: "Boolean",
    inputs: [userInput],
    code: (ctx) =>
      `(await tiktokProfileEmbed(${ctx.input("user")}).then(async (embed) => !!embed?.author_url).catch(async () => false))`,
  }),
  check({
    id: "tiktok_display_name",
    label: "Display name of a TikTok user",
    description: "The display name of a public TikTok account. Needs no login.",
    icon: "fa-solid fa-signature",
    keywords: ["name", "display name"],
    block: {
      type: "tiktok_displayName",
      text: "display name of TikTok user: {user}",
      parts: { user: { check: "String" } },
      inline: false,
      tooltip: "The display name of a public TikTok account, or null",
    },
    output: "String",
    inputs: [userInput],
    code: (ctx) =>
      `(await tiktokProfileEmbed(${ctx.input("user")}).then(async (embed) => embed?.author_name ?? null).catch(async () => null))`,
  }),
  check({
    id: "tiktok_profile_link",
    label: "Link to a TikTok profile",
    description:
      'The profile link for a username, like "https://www.tiktok.com/@tiktok".',
    icon: "fa-solid fa-link",
    keywords: ["link", "profile", "url"],
    block: {
      type: "tiktok_profileLink",
      text: "link to TikTok profile: {user}",
      parts: { user: { check: "String" } },
      inline: false,
      tooltip:
        'The profile link for a username, like "https://www.tiktok.com/@tiktok"',
    },
    output: "String",
    inputs: [userInput],
    code: (ctx) =>
      `("https://www.tiktok.com/@" + tiktokUsername(${ctx.input("user")}))`,
  }),
  check({
    id: "tiktok_video_id",
    label: "Video ID from a TikTok link",
    description:
      "The video ID in a TikTok link (short vm.tiktok.com links work too).",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id", "parse link"],
    block: {
      type: "tiktok_videoId",
      text: "video ID from TikTok link: {video}",
      parts: { video: { check: "String" } },
      inline: false,
      tooltip:
        "Gets the video ID out of a TikTok link (short vm.tiktok.com links work too)",
    },
    output: "String",
    inputs: [input.text("video", "TikTok link", { default: "" })],
    code: (ctx) =>
      `(await tiktokVideoId(${ctx.input("video")}).catch(async () => null))`,
  }),
  check({
    id: "tiktok_followers",
    label: "My TikTok followers",
    description: `How many followers the logged in account has. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-users",
    keywords: ["followers", "count"],
    block: {
      type: "tiktok_followers",
      text: "my TikTok follower count",
      tooltip: 'How many followers the account from "log in to TikTok" has',
    },
    output: "Number",
    code: () =>
      "(await tiktokAccount().then(async (account) => account?.followers ?? null).catch(async () => null))",
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
