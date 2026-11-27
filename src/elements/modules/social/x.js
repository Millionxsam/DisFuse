/* =====================================================================
   X (Twitter)
   ---------------------------------------------------------------------
   Reading needs no account: X's own API has no free reading, so public
   posts and profiles are read through FxTwitter (api.fxtwitter.com), a
   free, open-source API built for embedding X posts.

   Posting, liking, reposting, following and searching go through X's
   official API (api.x.com), which needs a developer app with "Read and
   write" permissions: its API key and secret plus an access token and
   secret, from developer.x.com. Requests are signed with OAuth 1.0a.
   Search uses X's paid read access, so it depends on the app's plan.
   ===================================================================== */

import { group, input } from "../../define.js";
import { ALL_HELPERS } from "./x.helpers.js";
import {
  fieldsOf,
  infoBlock,
  minutesInput,
  newItemsCode,
  site,
} from "./shared.js";

const colour = "#1D9BF0";
const { lookup, loop, watcher, step, check } = site(
  { name: "X", colour, setup: ALL_HELPERS },
  group({ colour }),
);

const NEEDS_LOGIN = 'Needs "Log in to X" first.';

const KINDS = [
  ["post (not a repost)", "posts"],
  ["post or repost", "all"],
  ["repost", "reposts"],
];
const kindInput = () =>
  input.dropdown(
    "kind",
    "Kind of post",
    [
      ["Post (not a repost)", "posts"],
      ["Post or repost", "all"],
      ["Repost", "reposts"],
    ],
    { default: "posts" },
  );

const userInput = input.text("user", "X user", {
  default: "",
  placeholder: "@username or link",
});
const postInput = input.text("post", "X post (link or ID)", { default: "" });

/* ---- What the info blocks read --------------------------------------- */

const POST = "xPostInformation";
const POST_FIELDS = [
  ["text", "text", "String", "Post text"],
  ["link", "url", "String", "Post link"],
  ["post ID", "id"],
  ["author @username", "authorUsername", "String", "Author's @username"],
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
  ["bookmarks", "bookmarks", "Number"],
  ["views", "views", "Number"],
  ["post date", "createdAt", "date"],
  ["image URLs (list)", "imageUrls", "Array", "Picture links"],
  ["video URL", "videoUrl", "String", "Video link"],
  ["all media URLs (list)", "mediaUrls", "Array", "All media links"],
  ["is a reply", "isReply", "Boolean", "Is a reply?"],
  ["replying to @username", "replyingTo", "String", "Replying to (@username)"],
  ["is a repost", "isRepost", "Boolean", "Is a repost?"],
  ["reposted by @username", "repostedBy", "String", "Reposted by (@username)"],
  ["language", "language"],
  ["is marked sensitive", "isSensitive", "Boolean", "Is marked sensitive?"],
];

const USER = "xUserInformation";
const USER_FIELDS = [
  ["@username", "username"],
  ["display name", "name"],
  ["user ID", "id"],
  ["bio", "description"],
  ["location", "location"],
  ["website", "website"],
  ["link", "url", "String", "Profile link"],
  ["followers count", "followers", "Number", "Number of followers"],
  ["following count", "following", "Number", "Number following"],
  ["posts count", "posts", "Number", "Number of posts"],
  ["likes count", "likes", "Number", "Number of likes"],
  ["media count", "mediaCount", "Number", "Number of media posts"],
  ["profile picture URL", "avatarUrl", "String", "Profile picture link"],
  ["banner image URL", "bannerUrl", "String", "Banner picture link"],
  ["join date", "joinedAt", "date"],
  ["is verified", "isVerified", "Boolean", "Is verified?"],
  [
    "is protected (private)",
    "isProtected",
    "Boolean",
    "Is protected (private)?",
  ],
];

const postInfo = infoBlock("x_postInfo", "X post", POST_FIELDS, {
  inside: [
    "x_getPost",
    "x_getLatestPost",
    "x_forEachPost",
    "x_onNewPost",
    "x_createPost",
    "x_apiSearch",
  ],
  also: [
    "x_latest_post",
    "x_each_post",
    "x_new_post",
    "x_create_post",
    "x_search",
  ],
  tooltip: "Information about the X post. Missing info is null.",
});
const userInfo = infoBlock("x_userInfo", "X user", USER_FIELDS, {
  inside: ["x_getUser", "x_getMe"],
  also: ["x_get_me"],
});

const ME_FIELDS =
  "created_at,description,location,profile_image_url,protected,public_metrics,url,verified";

/* ---- Steps ------------------------------------------------------------ */

const actions = [
  lookup({
    id: "x_get_post",
    label: "Look up an X post",
    description: "Finds a public post on X (Twitter) by its link or ID.",
    icon: "fa-brands fa-x-twitter",
    keywords: ["twitter", "tweet", "post"],
    variable: POST,
    noun: "X post",
    fields: POST_FIELDS,
    info: postInfo,
    block: {
      type: "x_getPost",
      text: ["get X post (link or ID): {post}", "then {code}"],
      parts: { post: { check: "String" } },
      tooltip:
        'Looks up a public post on X (Twitter), then runs the blocks inside. Use "get ... of X post" inside.',
    },
    inputs: [postInput],
    expr: (ctx) => `xPost(${ctx.input("post")})`,
  }),
  lookup({
    id: "x_latest_post",
    label: "Get an X user's latest post",
    description: "Gets a user's newest post.",
    icon: "fa-solid fa-clock-rotate-left",
    keywords: ["twitter", "latest", "newest", "tweet"],
    variable: POST,
    noun: "X post",
    fields: POST_FIELDS,
    block: {
      type: "x_getLatestPost",
      text: ["get latest {kind} of X user: {user}", "then {code}"],
      parts: { user: { check: "String" }, kind: { options: KINDS } },
      tooltip: "Gets a user's newest post, then runs the blocks inside",
    },
    inputs: [kindInput(), userInput],
    expr: (ctx) =>
      `xUserPosts(${ctx.input("user")}, "${ctx.raw("kind")}").then(async (posts) => posts[0])`,
  }),
  loop({
    id: "x_each_post",
    label: "For each recent X post",
    description:
      "Runs once for each of a user's latest posts (up to 20), newest first.",
    icon: "fa-solid fa-list",
    keywords: ["twitter", "tweets", "posts"],
    variable: POST,
    noun: "X post",
    fields: POST_FIELDS,
    block: {
      type: "x_forEachPost",
      text: ["for each recent {kind} of X user: {user}", "do {code}"],
      parts: { user: { check: "String" }, kind: { options: KINDS } },
      tooltip:
        "Runs the blocks inside once for each of a user's latest posts (up to 20), newest first",
    },
    inputs: [kindInput(), userInput],
    expr: (ctx) => `xUserPosts(${ctx.input("user")}, "${ctx.raw("kind")}")`,
  }),
  lookup({
    id: "x_get_user",
    label: "Look up an X user",
    description: "Finds a public X profile.",
    icon: "fa-solid fa-user",
    keywords: ["twitter", "profile", "account"],
    variable: USER,
    noun: "X user",
    fields: USER_FIELDS,
    info: userInfo,
    block: {
      type: "x_getUser",
      text: ["get X user (@username or link): {user}", "then {code}"],
      parts: { user: { check: "String" } },
      tooltip: "Looks up a public X profile, then runs the blocks inside",
    },
    inputs: [userInput],
    expr: (ctx) => `xUser(${ctx.input("user")})`,
  }),
  step({
    id: "x_login",
    label: "Log in to X",
    description:
      'Lets the bot post and act as your X account. Make an app at developer.x.com with "Read and write" permissions, then generate its keys and an access token. Use it when the bot starts.',
    icon: "fa-solid fa-key",
    keywords: ["twitter", "login", "api key", "token"],
    block: {
      type: "x_login",
      text: [
        "log in to X",
        "API key: {apiKey}",
        "API key secret: {apiSecret}",
        "access token: {accessToken}",
        "access token secret: {accessSecret}",
      ],
      parts: {
        apiKey: { check: null },
        apiSecret: { check: null },
        accessToken: { check: null },
        accessSecret: { check: null },
      },
      tooltip:
        'Lets the bot post and act as your X account. Make an app at developer.x.com with "Read and write" permissions, then generate its keys and an access token. Put this in "when the bot is logged in".',
    },
    inputs: ["apiKey", "apiSecret", "accessToken", "accessSecret"].map(
      (key, i) =>
        input.text(
          key,
          ["API key", "API key secret", "Access token", "Access token secret"][
            i
          ],
          {
            default: "",
            help: "Keep it in a Secret, and use the Secret here.",
          },
        ),
    ),
    code: (ctx) => {
      const field = (name) => `String(${ctx.input(name)} ?? "").trim()`;
      return `globalThis.xLogin = { apiKey: ${field("apiKey")}, apiSecret: ${field("apiSecret")}, accessToken: ${field("accessToken")}, accessSecret: ${field("accessSecret")} };\n`;
    },
  }),
  step({
    id: "x_create_post",
    label: "Post on X",
    description: `Posts on X as the logged in account, with a picture or as a reply if you like. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-paper-plane",
    keywords: ["twitter", "tweet", "post", "share"],
    block: {
      type: "x_createPost",
      text: [
        "post on X: {text}",
        "image URL (optional): {image}",
        "in reply to post (optional): {replyTo}",
        "then {code}",
      ],
      parts: { code: { check: "default" } },
      tooltip:
        'Posts on X as the account from "log in to X", then runs the blocks inside. Inside, "get link of X post" is the new post\'s link.',
    },
    inputs: [
      input.text("text", "Text", { default: "", multiline: true }),
      input.text("image", "Picture link (optional)", { default: "" }),
      input.text("replyTo", "Reply to post (optional)", {
        default: "",
        help: "A post link or ID.",
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
  const text = String(${ctx.input("text")} ?? "");
  const imageUrl = String(${ctx.input("image")} ?? "").trim();
  const replyTo = xPostId(${ctx.input("replyTo")});
  const post = { text };
  if (imageUrl) {
    const image = await fetch(imageUrl).then(async (res) => res.ok ? res.blob() : null).catch(async () => null);
    if (!image) {
      console.error("X: couldn't download the image " + imageUrl);
    } else {
      const form = new FormData();
      form.append("media", image, "image");
      form.append("media_category", "tweet_image");
      const media = await xApi("POST", "media/upload", { form });
      if (media?.data?.id) post.media = { media_ids: [media.data.id] };
    }
  }
  if (replyTo) post.reply = { in_reply_to_tweet_id: replyTo };
  const json = await xApi("POST", "tweets", { body: post });
  if (!json?.data?.id) return;
  const ${POST} = { id: json.data.id, text: json.data.text ?? text, url: "https://x.com/i/status/" + json.data.id, isReply: !!replyTo, isRepost: false, createdAt: new Date(), imageUrls: [], mediaUrls: [] };
  ${ctx.branch("code")}})().catch(async (error) => console.error("Error posting on X:", error));\n`,
  }),
  step({
    id: "x_post_action",
    label: "Like, repost or delete an X post",
    description: `Likes, reposts or deletes a post as the logged in account. You can only delete your own posts. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-heart",
    keywords: ["twitter", "like", "retweet", "repost", "delete"],
    block: {
      type: "x_postAction",
      text: "{action} X post (link or ID): {post}",
      parts: { post: { check: "String" } },
      inline: false,
      tooltip:
        'Likes, reposts or deletes a post as the account from "log in to X". You can only delete your own posts.',
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
    code: (ctx) => {
      const action = ctx.raw("action");
      const calls = {
        like: `xApi("POST", "users/" + me + "/likes", { body: { tweet_id: id } })`,
        unlike: `xApi("DELETE", "users/" + me + "/likes/" + id)`,
        repost: `xApi("POST", "users/" + me + "/retweets", { body: { tweet_id: id } })`,
        unrepost: `xApi("DELETE", "users/" + me + "/retweets/" + id)`,
        delete: `xApi("DELETE", "tweets/" + id)`,
      };
      return `await (async () => {
  const id = xPostId(${ctx.input("post")});
  if (!id) return;
  ${action === "delete" ? "" : `const me = await xMyId();\n  if (!me) return;\n  `}await ${calls[action] ?? calls.like};
})().catch(async (error) => console.error("Error with X post:", error));\n`;
    },
  }),
  step({
    id: "x_follow_user",
    label: "Follow or unfollow an X user",
    description: `Follows or unfollows a user as the logged in account. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-user-plus",
    keywords: ["twitter", "follow", "unfollow"],
    block: {
      type: "x_followUser",
      text: "{action} X user: {user}",
      parts: { user: { check: "String" } },
      inline: false,
      tooltip: 'Follows or unfollows a user as the account from "log in to X"',
    },
    inputs: [
      input.dropdown("action", "What to do", [
        ["follow", "follow"],
        ["unfollow", "unfollow"],
      ]),
      userInput,
    ],
    code: (ctx) => `await (async () => {
  const [me, target] = await Promise.all([xMyId(), xApiUserId(${ctx.input("user")})]);
  if (!me || !target) return;
  await ${
    ctx.raw("action") === "follow"
      ? `xApi("POST", "users/" + me + "/following", { body: { target_user_id: target } })`
      : `xApi("DELETE", "users/" + me + "/following/" + target)`
  };
})().catch(async (error) => console.error("Error following X user:", error));\n`,
  }),
  lookup({
    id: "x_get_me",
    label: "Get my X account",
    description: `Gets the logged in account. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-id-badge",
    keywords: ["twitter", "me", "my account"],
    variable: USER,
    noun: "X account",
    fields: USER_FIELDS,
    block: {
      type: "x_getMe",
      text: ["get my X account", "then {code}"],
      tooltip:
        'Gets the account from "log in to X", then runs the blocks inside. Use "get ... of X user" inside.',
    },
    expr: () =>
      `xApi("GET", "users/me", { query: { "user.fields": "${ME_FIELDS}" } }).then(async (json) => json?.data ? xApiUserShape(json.data) : null)`,
  }),
  loop({
    id: "x_search",
    label: "For each X post found",
    description: `Searches posts from the last 7 days (operators like "from:user" and "#tag" work). ${NEEDS_LOGIN} It also needs an X API plan with read access.`,
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["twitter", "search", "hashtag", "find"],
    variable: POST,
    noun: "X post",
    fields: POST_FIELDS,
    block: {
      type: "x_apiSearch",
      text: [
        "for each X post from the last 7 days matching: {query}",
        "max results (10-100): {count}",
        "do {code}",
      ],
      parts: { query: { check: "String" } },
      tooltip:
        'Searches recent posts with X\'s official API (supports operators like "from:user" and "#tag"), then runs the blocks inside once for each. Needs "log in to X" and an X API plan with read access.',
    },
    inputs: [
      input.text("query", "Search for", { default: "" }),
      input.number("count", "How many (10-100)", {
        default: 10,
        min: 10,
        max: 100,
        integer: true,
      }),
    ],
    expr: (ctx) => `xApi("GET", "tweets/search/recent", { query: {
  query: String(${ctx.input("query")}),
  max_results: Math.min(100, Math.max(10, Number(${ctx.input("count")}) || 10)),
  "tweet.fields": "created_at,public_metrics,lang,in_reply_to_user_id,referenced_tweets,possibly_sensitive",
  expansions: "author_id,attachments.media_keys",
  "user.fields": "username,name,profile_image_url",
  "media.fields": "url,type,preview_image_url"
} }).then(async (json) => {
  const users = new Map((json?.includes?.users || []).map(user => [user.id, user]));
  const media = new Map((json?.includes?.media || []).map(item => [item.media_key, item]));
  return (json?.data || []).map(post => {
    const author = users.get(post.author_id) || {};
    const metrics = post.public_metrics || {};
    const items = (post.attachments?.media_keys || []).map(key => media.get(key)).filter(Boolean);
    const repliedTo = (post.referenced_tweets || []).some(ref => ref.type === "replied_to");
    return {
      id: post.id,
      text: post.text,
      url: "https://x.com/" + (author.username || "i") + "/status/" + post.id,
      authorUsername: author.username ?? null,
      authorName: author.name ?? null,
      authorUrl: author.username ? "https://x.com/" + author.username : null,
      authorAvatarUrl: author.profile_image_url ?? null,
      likes: metrics.like_count ?? null,
      reposts: metrics.retweet_count ?? null,
      replies: metrics.reply_count ?? null,
      quotes: metrics.quote_count ?? null,
      bookmarks: metrics.bookmark_count ?? null,
      views: metrics.impression_count ?? null,
      createdAt: post.created_at ? new Date(post.created_at) : null,
      imageUrls: items.filter(item => item.type === "photo").map(item => item.url),
      videoUrl: null,
      mediaUrls: items.map(item => item.url || item.preview_image_url).filter(Boolean),
      isReply: repliedTo,
      replyingTo: null,
      isRepost: (post.referenced_tweets || []).some(ref => ref.type === "retweeted"),
      repostedBy: null,
      language: post.lang ?? null,
      isSensitive: !!post.possibly_sensitive
    };
  });
})`,
  }),
];

/* ---- Events ----------------------------------------------------------- */

const events = [
  watcher({
    id: "x_new_post",
    label: "When an X user posts",
    description:
      "Runs once for each new post from a user, for post notifications. It's checked every few minutes.",
    icon: "fa-brands fa-x-twitter",
    keywords: ["twitter", "new tweet", "new post", "notification"],
    variable: POST,
    fields: POST_FIELDS,
    block: {
      type: "x_onNewPost",
      text: [
        "when X user: {user}",
        "posts a new {kind}",
        "check every (minutes): {minutes}",
      ],
      parts: { user: { check: "String" }, kind: { options: KINDS } },
      tooltip:
        'Runs once for each new post from a user — great for post notifications. Use "get ... of X post" inside. The user is checked every few minutes (at least 1).',
    },
    settings: [
      { ...userInput, allowValues: false },
      kindInput(),
      minutesInput(),
    ],
    watch: (ctx, body) =>
      newItemsCode({
        minutes: ctx.input("minutes"),
        label: "X",
        list: `xUserPosts(${ctx.input("user")}, "${ctx.raw("kind")}")`,
        variable: POST,
        code: body,
      }),
  }),
];

/* ---- Values ----------------------------------------------------------- */

const values = [
  check({
    id: "x_followers",
    label: "Followers of an X user",
    description: "How many followers an X account has.",
    icon: "fa-solid fa-users",
    keywords: ["twitter", "followers", "count"],
    block: {
      type: "x_followers",
      text: "follower count of X user: {user}",
      parts: { user: { check: "String" } },
      inline: false,
      tooltip: "How many followers an X account has",
    },
    output: "Number",
    inputs: [userInput],
    code: (ctx) =>
      `(await xUser(${ctx.input("user")}).then(async (user) => user?.followers ?? null).catch(async () => null))`,
  }),
  check({
    id: "x_user_exists",
    label: "X user exists?",
    description: "True if an X account exists.",
    icon: "fa-solid fa-user-check",
    keywords: ["twitter", "exists", "valid"],
    block: {
      type: "x_userExists",
      text: ["X user: {user}", "exists?"],
      parts: { user: { check: "String" } },
      tooltip: "Checks whether an X account exists",
    },
    output: "Boolean",
    inputs: [userInput],
    code: (ctx) =>
      `(await xUser(${ctx.input("user")}).then(async (user) => !!user).catch(async () => false))`,
  }),
  check({
    id: "x_latest_post_link",
    label: "Link to an X user's latest post",
    description: "The link to a user's newest post, or nothing.",
    icon: "fa-solid fa-link",
    keywords: ["twitter", "latest", "link"],
    block: {
      type: "x_latestPostLink",
      text: "link to latest {kind} of X user: {user}",
      parts: { user: { check: "String" }, kind: { options: KINDS } },
      inline: false,
      tooltip: "The link to a user's newest post, or null",
    },
    output: "String",
    inputs: [kindInput(), userInput],
    code: (ctx) =>
      `(await xUserPosts(${ctx.input("user")}, "${ctx.raw("kind")}").then(async (posts) => posts[0]?.url ?? null).catch(async () => null))`,
  }),
  check({
    id: "x_post_id",
    label: "Post ID from an X link",
    description: "The ID in a post link, like x.com/user/status/123.",
    icon: "fa-solid fa-fingerprint",
    keywords: ["twitter", "id", "parse link"],
    block: {
      type: "x_postId",
      text: "post ID from X link: {post}",
      parts: { post: { check: "String" } },
      inline: false,
      tooltip: "Gets the ID out of a post link, like x.com/user/status/123",
    },
    output: "String",
    inputs: [postInput],
    code: (ctx) => `xPostId(${ctx.input("post")})`,
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
