/* =====================================================================
   Instagram
   ---------------------------------------------------------------------
   Instagram has no public API for reading profiles or posts without an
   account, so every step uses the official Instagram API
   (graph.instagram.com) with an access token for a professional
   (Business or Creator) account. Make an app at developers.facebook.com,
   add "Instagram API with Instagram Login", and generate a token for
   your account. Tokens last 60 days; the bot refreshes its copy every
   day while it's running.

   The API works on the logged in account: its profile, its posts, the
   comments on them, and publishing new photos, reels and stories.
   ===================================================================== */

import { group, input } from "../../define.js";
import { ALL_HELPERS } from "./instagram.helpers.js";
import {
  fieldsOf,
  infoBlock,
  minutesInput,
  newItemsCode,
  site,
} from "./shared.js";

const colour = "#E1306C";
const { lookup, loop, watcher, step, check } = site(
  { name: "Instagram", colour, setup: ALL_HELPERS },
  group({ colour }),
);

const NEEDS_LOGIN = 'Needs "Log in to Instagram" first.';
const postInput = input.text("post", "Your post (link or ID)", { default: "" });

/* ---- What the info blocks read --------------------------------------- */

const ACCOUNT = "instagramAccountInformation";
const ACCOUNT_FIELDS = [
  ["username", "username"],
  ["name", "name"],
  ["user ID", "id"],
  ["bio", "bio"],
  ["website", "website"],
  ["link", "url", "String", "Profile link"],
  ["profile picture URL", "avatarUrl", "String", "Profile picture link"],
  ["followers count", "followers", "Number", "Number of followers"],
  ["following count", "following", "Number", "Number following"],
  ["posts count", "posts", "Number", "Number of posts"],
  ["account type", "accountType"],
];

const POST = "instagramPostInformation";
const POST_FIELDS = [
  ["caption", "caption"],
  ["link", "url", "String", "Post link"],
  ["post ID", "id"],
  ["type (photo, video, reel, carousel)", "type", "String", "Kind of post"],
  ["image or video URL", "mediaUrl", "String", "Picture or video link"],
  ["thumbnail image URL", "thumbnailUrl", "String", "Thumbnail link"],
  ["post date", "createdAt", "date"],
  ["likes", "likes", "Number"],
  ["comments count", "comments", "Number", "Number of comments"],
  ["username", "username"],
  ["shortcode", "shortcode"],
];

const COMMENT = "instagramCommentInformation";
const COMMENT_FIELDS = [
  ["text", "text", "String", "Comment text"],
  ["username", "username"],
  ["comment ID", "id"],
  ["likes", "likes", "Number"],
  ["date", "createdAt", "date"],
  ["is hidden", "isHidden", "Boolean", "Is hidden?"],
  ["post ID", "postId"],
];

const postInfo = infoBlock(
  "instagram_postInfo",
  "Instagram post",
  POST_FIELDS,
  {
    inside: [
      "instagram_getLatestPost",
      "instagram_forEachPost",
      "instagram_getPost",
      "instagram_onNewPost",
      "instagram_publish",
    ],
    also: [
      "instagram_each_post",
      "instagram_get_post",
      "instagram_new_post",
      "instagram_publish",
    ],
  },
);

/* ---- Steps ------------------------------------------------------------ */

const PUBLISH_PARAMS = {
  IMAGE: `{ image_url: url, caption }`,
  REELS: `{ video_url: url, media_type: "REELS", caption }`,
  STORY_IMAGE: `{ image_url: url, media_type: "STORIES" }`,
  STORY_VIDEO: `{ video_url: url, media_type: "STORIES" }`,
};

const actions = [
  step({
    id: "instagram_login",
    label: "Log in to Instagram",
    description:
      'Lets the Instagram steps use your professional account. Make an app at developers.facebook.com with "Instagram API with Instagram Login" and generate an access token. Use it when the bot starts.',
    icon: "fa-solid fa-key",
    keywords: ["login", "access token", "api"],
    block: {
      type: "instagram_login",
      text: "log in to Instagram with access token: {token}",
      parts: { token: { check: null } },
      inline: false,
      tooltip:
        'Lets the Instagram blocks use your professional account. Make an app at developers.facebook.com with "Instagram API with Instagram Login" and generate an access token. Put this in "when the bot is logged in".',
    },
    inputs: [
      input.text("token", "Access token", {
        default: "",
        help: "Keep it in a Secret, and use the Secret here.",
      }),
    ],
    code: (
      ctx,
    ) => `globalThis.instagramLogin = { token: String(${ctx.input("token")} ?? "").trim() };
if (!globalThis.instagramRefresh) {
  globalThis.instagramRefresh = setInterval(async () => {
    const login = globalThis.instagramLogin;
    if (!login?.token) return;
    const json = await fetch("https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=" + encodeURIComponent(login.token))
      .then(async (res) => res.ok ? res.json() : null)
      .catch(async () => null);
    if (json?.access_token) login.token = json.access_token;
  }, 24 * 60 * 60 * 1000);
}\n`,
  }),
  lookup({
    id: "instagram_get_account",
    label: "Get my Instagram account",
    description: `Gets the logged in account's profile. ${NEEDS_LOGIN}`,
    icon: "fa-brands fa-instagram",
    keywords: ["account", "profile", "followers"],
    variable: ACCOUNT,
    noun: "Instagram account",
    fields: ACCOUNT_FIELDS,
    info: infoBlock(
      "instagram_accountInfo",
      "Instagram account",
      ACCOUNT_FIELDS,
      {
        inside: ["instagram_getAccount"],
      },
    ),
    block: {
      type: "instagram_getAccount",
      text: ["get my Instagram account", "then {code}"],
      tooltip:
        'Gets the account from "log in to Instagram", then runs the blocks inside. Use "get ... of Instagram account" inside.',
    },
    expr: () => "instagramAccount()",
  }),
  lookup({
    id: "instagram_latest_post",
    label: "Get my latest Instagram post",
    description: `Gets your newest post. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-image",
    keywords: ["latest", "newest", "post"],
    variable: POST,
    noun: "Instagram post",
    fields: POST_FIELDS,
    info: postInfo,
    block: {
      type: "instagram_getLatestPost",
      text: ["get my latest Instagram post", "then {code}"],
      tooltip: "Gets your newest post, then runs the blocks inside",
    },
    expr: () => "instagramPosts(1).then(async (posts) => posts[0])",
  }),
  loop({
    id: "instagram_each_post",
    label: "For each of my recent Instagram posts",
    description: `Runs once for each of your latest posts, newest first. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-images",
    keywords: ["posts", "feed"],
    variable: POST,
    noun: "Instagram post",
    fields: POST_FIELDS,
    block: {
      type: "instagram_forEachPost",
      text: [
        "for each of my recent Instagram posts, max (1-100): {count}",
        "do {code}",
      ],
      tooltip:
        "Runs the blocks inside once for each of your latest posts, newest first",
    },
    inputs: [
      input.number("count", "How many (1-100)", {
        default: 10,
        min: 1,
        max: 100,
        integer: true,
      }),
    ],
    expr: (ctx) => `instagramPosts(${ctx.input("count")})`,
  }),
  lookup({
    id: "instagram_get_post",
    label: "Look up one of my Instagram posts",
    description: `Finds one of your posts by its link or ID. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["post", "link"],
    variable: POST,
    noun: "Instagram post",
    fields: POST_FIELDS,
    block: {
      type: "instagram_getPost",
      text: ["get my Instagram post (link or ID): {post}", "then {code}"],
      parts: { post: { check: null } },
      tooltip:
        "Looks up one of your posts by its link or ID, then runs the blocks inside",
    },
    inputs: [postInput],
    expr: (ctx) => `instagramPost(${ctx.input("post")})`,
  }),
  step({
    id: "instagram_publish",
    label: "Post on Instagram",
    description: `Publishes a photo (JPEG), reel or story (MP4) from a public link. Stories have no caption, and videos can take a minute to process. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-paper-plane",
    keywords: ["post", "publish", "reel", "story", "upload"],
    block: {
      type: "instagram_publish",
      text: [
        "post {kind} on Instagram from URL: {url}",
        "caption: {caption}",
        "then {code}",
      ],
      parts: { code: { check: "default" } },
      tooltip:
        'Publishes a photo (JPEG), reel or story (MP4) from a public URL to your account, then runs the blocks inside. Use "get ... of Instagram post" inside. Stories have no caption. Videos can take a minute to process.',
    },
    inputs: [
      input.dropdown("kind", "What to post", [
        ["photo", "IMAGE"],
        ["reel", "REELS"],
        ["photo story", "STORY_IMAGE"],
        ["video story", "STORY_VIDEO"],
      ]),
      input.text("url", "Picture or video link", {
        default: "",
        help: "It has to be a public link.",
      }),
      input.text("caption", "Caption", { default: "", multiline: true }),
    ],
    branches: [
      {
        key: "code",
        label: "After it's posted",
        provides: fieldsOf(POST, POST_FIELDS),
      },
    ],
    code: (ctx) => {
      const kind = PUBLISH_PARAMS[ctx.raw("kind")] ? ctx.raw("kind") : "IMAGE";
      const isVideo = kind === "REELS" || kind === "STORY_VIDEO";
      return `await (async () => {
  const url = String(${ctx.input("url")} ?? "").trim();
  const caption = String(${ctx.input("caption")} ?? "");
  const container = await instagramApi("POST", "me/media", ${PUBLISH_PARAMS[kind]});
  if (!container?.id) return;
  for (let attempt = 0; attempt < ${isVideo ? 60 : 12}; attempt++) {
    const status = await instagramApi("GET", container.id, { fields: "status_code" });
    if (status?.status_code === "FINISHED") break;
    if (status?.status_code === "ERROR" || status?.status_code === "EXPIRED") {
      console.error("Instagram couldn't process that ${isVideo ? "video" : "image"}. Check the URL is public and the file is a supported format.");
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  const published = await instagramApi("POST", "me/media_publish", { creation_id: container.id });
  if (!published?.id) return;
  const ${POST} = (await instagramPost(published.id)) || { id: published.id, caption, type: "${kind === "IMAGE" ? "photo" : kind === "REELS" ? "reel" : "story"}" };
  ${ctx.branch("code")}})().catch(async (error) => console.error("Error posting on Instagram:", error));\n`;
    },
  }),
  loop({
    id: "instagram_each_comment",
    label: "For each comment on my Instagram post",
    description: `Runs once for each comment on one of your posts. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-comments",
    keywords: ["comments", "replies"],
    variable: COMMENT,
    noun: "Instagram comment",
    fields: COMMENT_FIELDS,
    info: infoBlock(
      "instagram_commentInfo",
      "Instagram comment",
      COMMENT_FIELDS,
      {
        inside: ["instagram_forEachComment"],
      },
    ),
    block: {
      type: "instagram_forEachComment",
      text: [
        "for each comment on my Instagram post (link or ID): {post}",
        "max comments (1-50): {count}",
        "do {code}",
      ],
      parts: { post: { check: null } },
      tooltip:
        'Runs the blocks inside once for each comment on one of your posts. Use "get ... of Instagram comment" inside.',
    },
    inputs: [
      postInput,
      input.number("count", "How many (1-50)", {
        default: 10,
        min: 1,
        max: 50,
        integer: true,
      }),
    ],
    expr: (ctx) => `instagramMediaId(${ctx.input("post")}).then(async (id) => {
  if (!id) return [];
  const json = await instagramApi("GET", id + "/comments", { fields: "id,text,username,timestamp,like_count,hidden", limit: Math.min(50, Math.max(1, Number(${ctx.input("count")}) || 10)) });
  return (json?.data || []).map(comment => ({
    id: comment.id,
    text: comment.text ?? "",
    username: comment.username ?? null,
    likes: comment.like_count ?? 0,
    createdAt: comment.timestamp ? new Date(comment.timestamp) : null,
    isHidden: !!comment.hidden,
    postId: id
  }));
})`,
  }),
  step({
    id: "instagram_comment",
    label: "Comment on Instagram",
    description: `Comments on one of your posts, or replies to a comment on one. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-comment",
    keywords: ["comment", "reply"],
    block: {
      type: "instagram_comment",
      text: ["comment on Instagram: {text}", "on {kind} {target}"],
      parts: { target: { check: null } },
      tooltip: "Comments on one of your posts, or replies to a comment on one",
    },
    inputs: [
      input.text("text", "Comment", { default: "", multiline: true }),
      input.dropdown("kind", "On", [
        ["my post (link or ID)", "post"],
        ["reply to comment (ID)", "comment"],
      ]),
      input.text("target", "Post or comment", { default: "" }),
    ],
    code: (ctx) => {
      const post = ctx.raw("kind") === "post";
      const id = post
        ? `await instagramMediaId(${ctx.input("target")})`
        : `String(${ctx.input("target")} ?? "").trim()`;
      return `await (async () => {
  const id = ${id};
  if (!id) return;
  await instagramApi("POST", id + "/${post ? "comments" : "replies"}", { message: String(${ctx.input("text")}) });
})().catch(async (error) => console.error("Error commenting on Instagram:", error));\n`;
    },
  }),
  step({
    id: "instagram_comment_action",
    label: "Hide or delete an Instagram comment",
    description: `Hides, unhides or deletes a comment on one of your posts. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-eye-slash",
    keywords: ["hide", "delete", "moderate", "comment"],
    block: {
      type: "instagram_commentAction",
      text: "{action} Instagram comment (ID): {comment}",
      parts: { comment: { check: null } },
      inline: false,
      tooltip: "Hides, unhides or deletes a comment on one of your posts",
    },
    inputs: [
      input.dropdown("action", "What to do", [
        ["hide", "hide"],
        ["unhide", "unhide"],
        ["delete", "delete"],
      ]),
      input.text("comment", "Comment ID", { default: "" }),
    ],
    code: (ctx) => {
      const action = ctx.raw("action");
      const call =
        action === "delete"
          ? `instagramApi("DELETE", id)`
          : `instagramApi("POST", id, { hide: ${action === "hide"} })`;
      return `await (async () => {
  const id = String(${ctx.input("comment")} ?? "").trim();
  if (!id) return;
  await ${call};
})().catch(async (error) => console.error("Error changing Instagram comment:", error));\n`;
    },
  }),
];

/* ---- Events ----------------------------------------------------------- */

const events = [
  watcher({
    id: "instagram_new_post",
    label: "When I post on Instagram",
    description: `Runs once for each new post on your account, for sharing your posts in Discord. ${NEEDS_LOGIN}`,
    icon: "fa-brands fa-instagram",
    keywords: ["new post", "notification", "share"],
    variable: POST,
    fields: POST_FIELDS,
    block: {
      type: "instagram_onNewPost",
      text: ["when I post on Instagram", "check every (minutes): {minutes}"],
      tooltip:
        'Runs once for each new post on your account — great for sharing your posts in Discord. Use "get ... of Instagram post" inside. Needs "log in to Instagram".',
    },
    settings: [minutesInput()],
    watch: (ctx, body) =>
      newItemsCode({
        minutes: ctx.input("minutes"),
        label: "Instagram",
        list: "instagramPosts(25)",
        variable: POST,
        code: body,
      }),
  }),
];

/* ---- Values ----------------------------------------------------------- */

const values = [
  check({
    id: "instagram_followers",
    label: "My Instagram followers",
    description: `How many followers the logged in account has. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-users",
    keywords: ["followers", "count"],
    block: {
      type: "instagram_followers",
      text: "my Instagram follower count",
      tooltip: 'How many followers the account from "log in to Instagram" has',
    },
    output: "Number",
    code: () =>
      "(await instagramAccount().then(async (account) => account?.followers ?? null).catch(async () => null))",
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
