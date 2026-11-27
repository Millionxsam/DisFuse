/* =====================================================================
   Bluesky
   ---------------------------------------------------------------------
   Reading needs no account: Bluesky's official public API
   (public.api.bsky.app) shares profiles and posts with anyone.

   Posting, replying, liking, following, searching and notifications act
   as an account, so they need "Log in to Bluesky" with the account's
   handle and an app password (Settings → Privacy and security → App
   passwords), never the real password.
   ===================================================================== */

import { group, input } from "../../define.js";
import { ALL_HELPERS } from "./bluesky.helpers.js";
import {
  fieldsOf,
  infoBlock,
  minutesInput,
  newItemsCode,
  site,
} from "./shared.js";

const colour = "#1185FE";
const { lookup, loop, watcher, step, check } = site(
  { name: "Bluesky", colour, setup: ALL_HELPERS },
  group({ colour }),
);

const NEEDS_LOGIN = 'Needs "Log in to Bluesky" first.';

const KINDS = [
  ["post (no replies or reposts)", "posts"],
  ["post or repost", "reposts"],
  ["post or reply", "replies"],
];
const kindInput = () =>
  input.dropdown(
    "kind",
    "Kind of post",
    [
      ["Post (no replies or reposts)", "posts"],
      ["Post or repost", "reposts"],
      ["Post or reply", "replies"],
    ],
    { default: "posts" },
  );

const userInput = input.text("user", "Bluesky user", {
  default: "",
  placeholder: "@handle or link",
});
const postInput = input.text("post", "Bluesky post (link)", { default: "" });

/* ---- What the info blocks read --------------------------------------- */

const POST = "blueskyPostInformation";
const POST_FIELDS = [
  ["text", "text", "String", "Post text"],
  ["link", "url", "String", "Post link"],
  ["author @handle", "authorHandle", "String", "Author's @handle"],
  ["author display name", "authorName", "String", "Author's display name"],
  ["author link", "authorUrl", "String", "Author's profile link"],
  [
    "author profile picture URL",
    "authorAvatarUrl",
    "String",
    "Author's profile picture link",
  ],
  ["likes", "likes", "Number"],
  ["reposts", "reposts", "Number"],
  ["replies", "replies", "Number"],
  ["quotes", "quotes", "Number"],
  ["post date", "createdAt", "date"],
  ["image URLs (list)", "imageUrls", "Array", "Picture links"],
  [
    "video thumbnail URL",
    "videoThumbnailUrl",
    "String",
    "Video thumbnail link",
  ],
  ["link card URL", "linkUrl", "String", "Link card link"],
  ["is a reply", "isReply", "Boolean", "Is a reply?"],
  ["is a repost", "isRepost", "Boolean", "Is a repost?"],
  ["reposted by @handle", "repostedBy", "String", "Reposted by (@handle)"],
  ["language", "language"],
  ["post URI (at://)", "uri", "String", "Post URI (at://)"],
];

const USER = "blueskyUserInformation";
const USER_FIELDS = [
  ["@handle", "handle"],
  ["display name", "name"],
  ["DID", "did"],
  ["bio", "description"],
  ["link", "url", "String", "Profile link"],
  ["followers count", "followers", "Number", "Number of followers"],
  ["following count", "following", "Number", "Number following"],
  ["posts count", "posts", "Number", "Number of posts"],
  ["profile picture URL", "avatarUrl", "String", "Profile picture link"],
  ["banner image URL", "bannerUrl", "String", "Banner picture link"],
  ["join date", "joinedAt", "date"],
];

const postInfo = infoBlock("bluesky_postInfo", "Bluesky post", POST_FIELDS, {
  inside: [
    "bluesky_getPost",
    "bluesky_getLatestPost",
    "bluesky_forEachPost",
    "bluesky_onNewPost",
    "bluesky_createPost",
    "bluesky_searchPosts",
    "bluesky_onNotification",
  ],
  also: [
    "bluesky_latest_post",
    "bluesky_each_post",
    "bluesky_new_post",
    "bluesky_create_post",
    "bluesky_search",
    "bluesky_notification",
  ],
});
const userInfo = infoBlock("bluesky_userInfo", "Bluesky user", USER_FIELDS, {
  inside: ["bluesky_getUser", "bluesky_onNotification"],
  tooltip:
    "Information about the Bluesky user. Users from notifications have no counts (null).",
});

/* ---- Steps ------------------------------------------------------------ */

const POST_ACTIONS = {
  like: `blueskyCreateRecord("app.bsky.feed.like", { subject: { uri: post.uri, cid: post.cid } })`,
  repost: `blueskyCreateRecord("app.bsky.feed.repost", { subject: { uri: post.uri, cid: post.cid } })`,
  unlike: `(post.viewer?.like ? blueskyDeleteRecord(post.viewer.like) : null)`,
  unrepost: `(post.viewer?.repost ? blueskyDeleteRecord(post.viewer.repost) : null)`,
  delete: `blueskyDeleteRecord(post.uri)`,
};

const actions = [
  lookup({
    id: "bluesky_get_post",
    label: "Look up a Bluesky post",
    description: "Finds a public Bluesky post by its link.",
    icon: "fa-brands fa-bluesky",
    keywords: ["post", "skeet", "link"],
    variable: POST,
    noun: "Bluesky post",
    fields: POST_FIELDS,
    info: postInfo,
    block: {
      type: "bluesky_getPost",
      text: ["get Bluesky post (link): {post}", "then {code}"],
      parts: { post: { check: "String" } },
      tooltip:
        'Looks up a public Bluesky post by its link, then runs the blocks inside. Use "get ... of Bluesky post" inside.',
    },
    inputs: [postInput],
    expr: (ctx) => `blueskyPost(${ctx.input("post")})`,
  }),
  lookup({
    id: "bluesky_latest_post",
    label: "Get a Bluesky user's latest post",
    description: "Gets a user's newest post.",
    icon: "fa-solid fa-clock-rotate-left",
    keywords: ["latest", "newest", "post"],
    variable: POST,
    noun: "Bluesky post",
    fields: POST_FIELDS,
    block: {
      type: "bluesky_getLatestPost",
      text: ["get latest {kind} of Bluesky user: {user}", "then {code}"],
      parts: { user: { check: "String" }, kind: { options: KINDS } },
      tooltip: "Gets a user's newest post, then runs the blocks inside",
    },
    inputs: [kindInput(), userInput],
    expr: (ctx) =>
      `blueskyUserPosts(${ctx.input("user")}, "${ctx.raw("kind")}").then(async (posts) => posts[0])`,
  }),
  loop({
    id: "bluesky_each_post",
    label: "For each recent Bluesky post",
    description: "Runs once for each of a user's latest posts, newest first.",
    icon: "fa-solid fa-list",
    keywords: ["posts", "feed"],
    variable: POST,
    noun: "Bluesky post",
    fields: POST_FIELDS,
    block: {
      type: "bluesky_forEachPost",
      text: [
        "for each recent {kind} of Bluesky user: {user}",
        "max results (1-100): {count}",
        "do {code}",
      ],
      parts: { user: { check: "String" }, kind: { options: KINDS } },
      tooltip:
        "Runs the blocks inside once for each of a user's latest posts, newest first",
    },
    inputs: [
      kindInput(),
      userInput,
      input.number("count", "How many (1-100)", {
        default: 10,
        min: 1,
        max: 100,
        integer: true,
      }),
    ],
    expr: (ctx) =>
      `blueskyUserPosts(${ctx.input("user")}, "${ctx.raw("kind")}", ${ctx.input("count")})`,
  }),
  lookup({
    id: "bluesky_get_user",
    label: "Look up a Bluesky user",
    description: "Finds a Bluesky profile.",
    icon: "fa-solid fa-user",
    keywords: ["profile", "account", "handle"],
    variable: USER,
    noun: "Bluesky user",
    fields: USER_FIELDS,
    info: userInfo,
    block: {
      type: "bluesky_getUser",
      text: ["get Bluesky user (@handle or link): {user}", "then {code}"],
      parts: { user: { check: "String" } },
      tooltip: "Looks up a Bluesky profile, then runs the blocks inside",
    },
    inputs: [userInput],
    expr: (ctx) => `blueskyUser(${ctx.input("user")})`,
  }),
  step({
    id: "bluesky_login",
    label: "Log in to Bluesky",
    description:
      "Lets the bot post and act as a Bluesky account. Make an app password in Bluesky (Settings, Privacy and security, App passwords). Never use the real password. Use it when the bot starts.",
    icon: "fa-solid fa-key",
    keywords: ["login", "app password", "account"],
    block: {
      type: "bluesky_login",
      text: [
        "log in to Bluesky",
        "handle: {handle}",
        "app password: {password}",
      ],
      parts: { handle: { check: null }, password: { check: null } },
      tooltip:
        'Lets the bot post and act as a Bluesky account. Make an app password in Bluesky (Settings → Privacy and security → App passwords) — never use your real password. Put this in "when the bot is logged in".',
    },
    inputs: [
      input.text("handle", "Handle", {
        default: "",
        placeholder: "name.bsky.social",
      }),
      input.text("password", "App password", {
        default: "",
        help: "Keep it in a Secret, and use the Secret here.",
      }),
    ],
    code: (
      ctx,
    ) => `globalThis.blueskyLogin = { identifier: String(${ctx.input("handle")} ?? "").trim(), password: String(${ctx.input("password")} ?? "").trim() };
await blueskyApi("GET", "com.atproto.server.getSession");\n`,
  }),
  step({
    id: "bluesky_create_post",
    label: "Post on Bluesky",
    description: `Posts on Bluesky (up to 300 characters; links, @mentions and #hashtags work), with a picture or as a reply if you like. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-paper-plane",
    keywords: ["post", "skeet", "share", "reply"],
    block: {
      type: "bluesky_createPost",
      text: [
        "post on Bluesky: {text}",
        "image URL (optional): {image}",
        "image description (alt text): {alt}",
        "in reply to post link (optional): {replyTo}",
        "then {code}",
      ],
      parts: { code: { check: "default" } },
      tooltip:
        'Posts on Bluesky (up to 300 characters; links, @mentions and #hashtags work), then runs the blocks inside. Inside, "get link of Bluesky post" is the new post\'s link.',
    },
    inputs: [
      input.text("text", "Text", {
        default: "",
        multiline: true,
        maxLength: 300,
      }),
      input.text("image", "Picture link (optional)", { default: "" }),
      input.text("alt", "Picture description (alt text)", { default: "" }),
      input.text("replyTo", "Reply to post (optional)", {
        default: "",
        help: "A post link.",
      }),
    ],
    branches: [
      {
        key: "code",
        label: "After it's posted",
        provides: fieldsOf(POST, POST_FIELDS),
      },
    ],
    code: (ctx) => `await (async () => {
  const record = await blueskyPostRecord(${ctx.input("text")}, ${ctx.input("image")}, ${ctx.input("alt")});
  const replyTo = String(${ctx.input("replyTo")} ?? "").trim();
  if (replyTo) {
    const parent = await blueskyPostView(replyTo);
    if (!parent) return;
    const root = parent.record?.reply?.root || { uri: parent.uri, cid: parent.cid };
    record.reply = { root, parent: { uri: parent.uri, cid: parent.cid } };
  }
  const created = await blueskyCreateRecord("app.bsky.feed.post", record);
  if (!created?.uri) return;
  const ${POST} = (await blueskyPost(created.uri)) || { id: created.uri, uri: created.uri, cid: created.cid, text: record.text, url: "https://bsky.app/profile/" + globalThis.blueskyLogin.handle + "/post/" + created.uri.split("/").pop(), isReply: !!record.reply, isRepost: false, imageUrls: [] };
  ${ctx.branch("code")}})().catch(async (error) => console.error("Error posting on Bluesky:", error));\n`,
  }),
  step({
    id: "bluesky_post_action",
    label: "Like, repost or delete a Bluesky post",
    description: `Likes, reposts or deletes a post as the logged in account. You can only delete your own posts. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-heart",
    keywords: ["like", "repost", "delete"],
    block: {
      type: "bluesky_postAction",
      text: "{action} Bluesky post (link): {post}",
      parts: { post: { check: "String" } },
      inline: false,
      tooltip:
        'Likes, reposts or deletes a post as the account from "log in to Bluesky". You can only delete your own posts.',
    },
    inputs: [
      input.dropdown("action", "What to do", [
        ["like", "like"],
        ["unlike", "unlike"],
        ["repost", "repost"],
        ["undo repost of", "unrepost"],
        ["delete", "delete"],
      ]),
      postInput,
    ],
    code: (ctx) => `await (async () => {
  const post = await blueskyPostView(${ctx.input("post")});
  if (!post) return;
  await ${POST_ACTIONS[ctx.raw("action")] ?? POST_ACTIONS.like};
})().catch(async (error) => console.error("Error with Bluesky post:", error));\n`,
  }),
  step({
    id: "bluesky_follow_user",
    label: "Follow or unfollow a Bluesky user",
    description: `Follows or unfollows a user as the logged in account. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-user-plus",
    keywords: ["follow", "unfollow"],
    block: {
      type: "bluesky_followUser",
      text: "{action} Bluesky user: {user}",
      parts: { user: { check: "String" } },
      inline: false,
      tooltip:
        'Follows or unfollows a user as the account from "log in to Bluesky"',
    },
    inputs: [
      input.dropdown("action", "What to do", [
        ["follow", "follow"],
        ["unfollow", "unfollow"],
      ]),
      userInput,
    ],
    code: (ctx) => `await (async () => {
  const profile = await blueskyApi("GET", "app.bsky.actor.getProfile", { query: { actor: blueskyActor(${ctx.input("user")}) } });
  if (!profile?.did) return;
  ${
    ctx.raw("action") === "follow"
      ? `if (!profile.viewer?.following) await blueskyCreateRecord("app.bsky.graph.follow", { subject: profile.did });`
      : `if (profile.viewer?.following) await blueskyDeleteRecord(profile.viewer.following);`
  }
})().catch(async (error) => console.error("Error following Bluesky user:", error));\n`,
  }),
  loop({
    id: "bluesky_search",
    label: "For each Bluesky post found",
    description: `Searches Bluesky posts ("from:handle" and #hashtags work), and runs once for each. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["search", "hashtag", "find"],
    variable: POST,
    noun: "Bluesky post",
    fields: POST_FIELDS,
    block: {
      type: "bluesky_searchPosts",
      text: [
        "for each Bluesky post found searching: {query}",
        "sorted by {sort}",
        "max results (1-100): {count}",
        "do {code}",
      ],
      parts: { query: { check: "String" } },
      tooltip:
        'Searches Bluesky posts (supports "from:handle" and #hashtags), then runs the blocks inside once for each. Needs "log in to Bluesky".',
    },
    inputs: [
      input.text("query", "Search for", { default: "" }),
      input.dropdown("sort", "Sorted by", [
        ["newest", "latest"],
        ["top", "top"],
      ]),
      input.number("count", "How many (1-100)", {
        default: 10,
        min: 1,
        max: 100,
        integer: true,
      }),
    ],
    expr: (ctx) =>
      `blueskyApi("GET", "app.bsky.feed.searchPosts", { query: { q: String(${ctx.input("query")}), sort: "${ctx.raw("sort")}", limit: Math.min(100, Math.max(1, Number(${ctx.input("count")}) || 10)) } }).then(async (json) => (json?.posts || []).map(post => blueskyPostShape(post)))`,
  }),
];

/* ---- Events ----------------------------------------------------------- */

const REASONS = [
  ["mentions", "mention"],
  ["replies to", "reply"],
  ["quotes", "quote"],
  ["follows", "follow"],
  ["likes a post of", "like"],
  ["reposts a post of", "repost"],
];

/* Who did it, in a notification. Its keys can't clash with the post's. */
const BY_FIELDS = fieldsOf(USER, USER_FIELDS).map((field) => ({
  ...field,
  key: `by_${field.key}`,
  label: `Who did it: ${field.label.charAt(0).toLowerCase()}${field.label.slice(1)}`,
}));

const events = [
  watcher({
    id: "bluesky_new_post",
    label: "When a Bluesky user posts",
    description:
      "Runs once for each new post from a user, for post notifications. It's checked every few minutes.",
    icon: "fa-brands fa-bluesky",
    keywords: ["new post", "notification"],
    variable: POST,
    fields: POST_FIELDS,
    block: {
      type: "bluesky_onNewPost",
      text: [
        "when Bluesky user: {user}",
        "posts a new {kind}",
        "check every (minutes): {minutes}",
      ],
      parts: { user: { check: "String" }, kind: { options: KINDS } },
      tooltip:
        'Runs once for each new post from a user — great for post notifications. Use "get ... of Bluesky post" inside. The user is checked every few minutes (at least 1).',
    },
    settings: [
      { ...userInput, allowValues: false },
      kindInput(),
      minutesInput(),
    ],
    watch: (ctx, body) =>
      newItemsCode({
        minutes: ctx.input("minutes"),
        label: "Bluesky",
        list: `blueskyUserPosts(${ctx.input("user")}, "${ctx.raw("kind")}")`,
        variable: POST,
        code: body,
      }),
  }),
  watcher({
    id: "bluesky_notification",
    label: "When someone interacts with my Bluesky account",
    description: `Runs once for each new mention, reply, quote, follow, like or repost. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-bell",
    keywords: ["notification", "mention", "reply", "follow", "like"],
    variable: POST,
    fields: POST_FIELDS,
    extraValues: BY_FIELDS,
    block: {
      type: "bluesky_onNotification",
      text: [
        "when someone {reason} my Bluesky account",
        "check every (minutes): {minutes}",
      ],
      parts: { reason: { options: REASONS } },
      tooltip:
        'Runs once for each new notification of that kind. Inside, "get ... of Bluesky user" is who did it, and "get ... of Bluesky post" is their post (mentions, replies, quotes) or your post they liked or reposted. Needs "log in to Bluesky".',
    },
    settings: [
      input.dropdown(
        "reason",
        "When someone",
        REASONS.map(([label, value]) => [
          label.charAt(0).toUpperCase() + label.slice(1),
          value,
        ]),
      ),
      minutesInput(),
    ],
    watch: (ctx, body) => {
      const reason = ctx.raw("reason");
      const postUri =
        reason === "like" || reason === "repost"
          ? "notification.reasonSubject"
          : "notification.uri";
      return newItemsCode({
        minutes: ctx.input("minutes"),
        label: "Bluesky",
        list: `blueskyApi("GET", "app.bsky.notification.listNotifications", { query: { limit: 50, reasons: "${reason}" } }).then(async (json) => (json?.notifications || []).filter(notification => notification.reason === "${reason}").map(notification => ({ ...notification, id: notification.uri })))`,
        variable: "notification",
        code: `const ${USER} = blueskyUserShape(notification.author || {});
      const ${POST} = ${
        reason === "follow"
          ? "null"
          : `await blueskyApi("GET", "app.bsky.feed.getPosts", { query: { uris: ${postUri} } }).then(async (json) => json?.posts?.[0] ? blueskyPostShape(json.posts[0]) : null)`
      };
      ${body}`,
      });
    },
  }),
];

/* ---- Values ----------------------------------------------------------- */

const values = [
  check({
    id: "bluesky_followers",
    label: "Followers of a Bluesky user",
    description: "How many followers a Bluesky account has.",
    icon: "fa-solid fa-users",
    keywords: ["followers", "count"],
    block: {
      type: "bluesky_followers",
      text: "follower count of Bluesky user: {user}",
      parts: { user: { check: "String" } },
      inline: false,
      tooltip: "How many followers a Bluesky account has",
    },
    output: "Number",
    inputs: [userInput],
    code: (ctx) =>
      `(await blueskyUser(${ctx.input("user")}).then(async (user) => user?.followers ?? null).catch(async () => null))`,
  }),
  check({
    id: "bluesky_user_exists",
    label: "Bluesky user exists?",
    description: "True if a Bluesky account exists.",
    icon: "fa-solid fa-user-check",
    keywords: ["exists", "valid"],
    block: {
      type: "bluesky_userExists",
      text: ["Bluesky user: {user}", "exists?"],
      parts: { user: { check: "String" } },
      tooltip: "Checks whether a Bluesky account exists",
    },
    output: "Boolean",
    inputs: [userInput],
    code: (ctx) =>
      `(await blueskyUser(${ctx.input("user")}).then(async (user) => !!user).catch(async () => false))`,
  }),
  check({
    id: "bluesky_latest_post_link",
    label: "Link to a Bluesky user's latest post",
    description: "The link to a user's newest post, or nothing.",
    icon: "fa-solid fa-link",
    keywords: ["latest", "link"],
    block: {
      type: "bluesky_latestPostLink",
      text: "link to latest {kind} of Bluesky user: {user}",
      parts: { user: { check: "String" }, kind: { options: KINDS } },
      inline: false,
      tooltip: "The link to a user's newest post, or null",
    },
    output: "String",
    inputs: [kindInput(), userInput],
    code: (ctx) =>
      `(await blueskyUserPosts(${ctx.input("user")}, "${ctx.raw("kind")}", 10).then(async (posts) => posts[0]?.url ?? null).catch(async () => null))`,
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
