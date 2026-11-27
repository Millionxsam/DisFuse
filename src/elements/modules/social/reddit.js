/* =====================================================================
   Reddit
   ---------------------------------------------------------------------
   Subreddits, posts, comments and users. Reading works without an
   account (Reddit's public JSON, or its RSS feeds when JSON is blocked).
   "Log in to Reddit" makes every step use the official API, which is
   more reliable, and with a username and password the bot can post,
   reply and send messages as that account.
   ===================================================================== */

import { group, input } from "../../define.js";
import { ALL_HELPERS } from "./reddit.helpers.js";
import { infoBlock, minutesInput, site } from "./shared.js";

const colour = "#FF4500";
const { lookup, loop, watcher, step, check } = site(
  { name: "Reddit", colour, setup: ALL_HELPERS },
  group({ colour }),
);

const NEEDS_LOGIN = 'Needs "Log in to Reddit" with a username and password.';

const SORTS = [
  ["hot", "hot"],
  ["new", "new"],
  ["rising", "rising"],
  ["top of today", "top:day"],
  ["top of this week", "top:week"],
  ["top of this month", "top:month"],
  ["top of this year", "top:year"],
  ["top of all time", "top:all"],
  ["controversial", "controversial:day"],
];
const sortInput = () =>
  input.dropdown(
    "sort",
    "Sorted by",
    SORTS.map(([label, value]) => [
      label.charAt(0).toUpperCase() + label.slice(1),
      value,
    ]),
  );

function sortOf(sort) {
  const [name, time] = String(sort).split(":");
  return { name, params: time ? `, t: "${time}"` : "" };
}

const subredditName = (subreddit) =>
  `String(${subreddit}).trim().replace(/^(https?:\\/\\/)?(www\\.|old\\.|new\\.)?reddit\\.com\\//i, "").replace(/^\\/?r\\//i, "").split(/[/?#]/)[0]`;
const userName = (user) =>
  `String(${user}).trim().replace(/^(https?:\\/\\/)?(www\\.|old\\.|new\\.)?reddit\\.com\\//i, "").replace(/^\\/?(u|user)\\//i, "").split(/[/?#]/)[0]`;
const limitOf = (ctx, fallback = 10) =>
  `String(Math.min(100, Math.max(1, Number(${ctx.input("limit")}) || ${fallback})))`;

const subredditInput = input.text("subreddit", "Subreddit", {
  default: "",
  placeholder: "memes or r/memes",
});
const userInput = input.text("user", "Reddit user", {
  default: "",
  placeholder: "spez or u/spez",
});
const postInput = input.text("post", "Post (link or ID)", { default: "" });
const limitInput = (label = "How many (1-100)", fallback = 10) =>
  input.number("limit", label, {
    default: fallback,
    min: 1,
    max: 100,
    integer: true,
  });

/* ---- What the info blocks read --------------------------------------- */

const SUBREDDIT = "redditSubredditInformation";
const SUBREDDIT_FIELDS = [
  ["name", "name", "String", "Subreddit name"],
  ["title", "title"],
  ["description", "description"],
  ["sidebar text", "sidebar"],
  ["member count", "members", "Number", "Number of members"],
  ["members online", "online", "Number"],
  ["creation date", "createdAt", "date"],
  ["is NSFW", "nsfw", "Boolean", "Is NSFW?"],
  [
    "type (public, restricted, private)",
    "type",
    "String",
    "Type (public, restricted or private)",
  ],
  ["icon image URL", "iconUrl", "String", "Icon link"],
  ["banner image URL", "bannerUrl", "String", "Banner picture link"],
  ["theme color", "colour", "String", "Theme color"],
  ["link", "url", "String", "Subreddit link"],
  ["ID", "id", "String", "Subreddit ID"],
];

const POST = "redditPostInformation";
const POST_FIELDS = [
  ["title", "title"],
  ["text", "text", "String", "Post text"],
  ["link to post", "url", "String", "Link to the post"],
  ["linked URL", "link", "String", "Link it shares"],
  ["image URL", "imageUrl", "String", "Picture link"],
  ["thumbnail URL", "thumbnailUrl", "String", "Thumbnail link"],
  ["author", "author"],
  ["subreddit", "subreddit"],
  ["score (upvotes)", "score", "Number", "Score (upvotes)"],
  ["upvote ratio", "upvoteRatio", "Number"],
  ["comment count", "comments", "Number", "Number of comments"],
  ["post date", "createdAt", "date"],
  ["flair", "flair"],
  ["is NSFW", "nsfw", "Boolean", "Is NSFW?"],
  ["is spoiler", "spoiler", "Boolean", "Is a spoiler?"],
  ["is pinned", "pinned", "Boolean", "Is pinned?"],
  ["is a video", "isVideo", "Boolean", "Is a video?"],
  ["is a text post", "isText", "Boolean", "Is a text post?"],
  ["ID", "id", "String", "Post ID"],
];

const COMMENT = "redditCommentInformation";
const COMMENT_FIELDS = [
  ["text", "text", "String", "Comment text"],
  ["author", "author"],
  ["score (upvotes)", "score", "Number", "Score (upvotes)"],
  ["reply count", "replies", "Number", "Number of replies"],
  ["date", "createdAt", "date"],
  ["link", "url", "String", "Comment link"],
  ["is by the post's author", "isOp", "Boolean", "Is by the post's author?"],
  ["is pinned", "pinned", "Boolean", "Is pinned?"],
  ["ID", "id", "String", "Comment ID"],
];

const USER = "redditUserInformation";
const USER_FIELDS = [
  ["username", "name"],
  ["total karma", "karma", "Number"],
  ["post karma", "postKarma", "Number"],
  ["comment karma", "commentKarma", "Number"],
  ["account creation date", "createdAt", "date"],
  ["avatar image URL", "avatarUrl", "String", "Avatar link"],
  ["bio", "bio"],
  ["has verified email", "verified", "Boolean", "Has a verified email?"],
  ["has Reddit Premium", "premium", "Boolean", "Has Reddit Premium?"],
  ["is a moderator", "moderator", "Boolean", "Is a moderator?"],
  ["is a Reddit employee", "employee", "Boolean", "Is a Reddit employee?"],
  ["profile link", "url"],
  ["ID", "id", "String", "User ID"],
];

const postInfo = infoBlock("reddit_postInfo", "Reddit post", POST_FIELDS, {
  inside: [
    "reddit_forEachPost",
    "reddit_getRandomPost",
    "reddit_getPost",
    "reddit_searchPosts",
    "reddit_onNewPost",
    "reddit_forEachUserPost",
  ],
  also: [
    "reddit_random_post",
    "reddit_get_post",
    "reddit_search_posts",
    "reddit_new_post",
    "reddit_each_user_post",
  ],
  tooltip:
    "Information about the Reddit post you got. If Reddit only allowed its RSS feed, score, comment count, NSFW and flair are null.",
});

/* ---- Steps ------------------------------------------------------------ */

const actions = [
  lookup({
    id: "reddit_get_subreddit",
    label: "Look up a subreddit",
    description: 'Finds a subreddit (like "memes" or "r/memes").',
    icon: "fa-brands fa-reddit-alien",
    keywords: ["subreddit", "community", "r/"],
    variable: SUBREDDIT,
    noun: "subreddit",
    fields: SUBREDDIT_FIELDS,
    info: infoBlock(
      "reddit_subredditInfo",
      "Reddit subreddit",
      SUBREDDIT_FIELDS,
      {
        inside: ["reddit_getSubreddit"],
      },
    ),
    block: {
      type: "reddit_getSubreddit",
      text: ["get subreddit: {subreddit}", "then {code}"],
      parts: { subreddit: { check: "String" } },
      inline: false,
      tooltip:
        'Looks up a subreddit (like "memes" or "r/memes"), then runs the blocks inside',
    },
    inputs: [subredditInput],
    expr: (ctx) => `redditSubreddit(${subredditName(ctx.input("subreddit"))})`,
  }),
  loop({
    id: "reddit_each_post",
    label: "For each post in a subreddit",
    description: "Runs once for each post in a subreddit.",
    icon: "fa-solid fa-list",
    keywords: ["posts", "feed", "hot", "top"],
    variable: POST,
    noun: "Reddit post",
    fields: POST_FIELDS,
    info: postInfo,
    block: {
      type: "reddit_forEachPost",
      text: [
        "for each {sort} post in subreddit: {subreddit}",
        "max posts (1-100): {limit}",
        "do {code}",
      ],
      parts: { subreddit: { check: "String" }, sort: { options: SORTS } },
      inline: false,
      tooltip:
        'Runs the blocks inside once for each post. Use "get ... of Reddit post" inside it.',
    },
    inputs: [sortInput(), subredditInput, limitInput()],
    expr: (ctx) => {
      const { name, params } = sortOf(ctx.raw("sort"));
      return `redditPosts("/r/" + encodeURIComponent(${subredditName(ctx.input("subreddit"))}) + "/${name}", { limit: ${limitOf(ctx)}${params} })`;
    },
  }),
  lookup({
    id: "reddit_random_post",
    label: "Get a random post from a subreddit",
    description:
      "Picks a random post from a subreddit's hot posts. Great for meme commands. Pinned posts are skipped.",
    icon: "fa-solid fa-shuffle",
    keywords: ["random", "meme", "image"],
    variable: POST,
    noun: "Reddit post",
    fields: POST_FIELDS,
    block: {
      type: "reddit_getRandomPost",
      text: [
        "get random {kind} from subreddit: {subreddit}",
        "allow NSFW {nsfw}",
        "then {code}",
      ],
      parts: {
        subreddit: { check: "String" },
        kind: {
          options: [
            ["post", "any"],
            ["image post", "image"],
            ["text post", "text"],
          ],
        },
        nsfw: { part: "checkbox" },
      },
      inline: false,
      tooltip:
        "Picks a random post from the subreddit's hot posts, then runs the blocks inside. Great for meme commands. Pinned posts are skipped.",
    },
    inputs: [
      input.dropdown("kind", "Kind of post", [
        ["Any post", "any"],
        ["Image post", "image"],
        ["Text post", "text"],
      ]),
      subredditInput,
      input.boolean("nsfw", "Allow NSFW posts", {
        default: false,
        allowValues: false,
      }),
    ],
    expr: (ctx) => {
      const kind = ctx.raw("kind");
      const filters = [
        "!post.pinned",
        ...(ctx.raw("nsfw") === true ? [] : ["post.nsfw !== true"]),
        ...(kind === "image"
          ? ["!!post.imageUrl", "!post.isVideo", "!post.isText"]
          : []),
        ...(kind === "text" ? ["post.isText"] : []),
      ].join(" && ");
      return `redditPosts("/r/" + encodeURIComponent(${subredditName(ctx.input("subreddit"))}) + "/hot", { limit: "100" }).then(async (posts) => {
    const choices = posts.filter(post => ${filters});
    return choices[Math.floor(Math.random() * choices.length)];
  })`;
    },
  }),
  lookup({
    id: "reddit_get_post",
    label: "Look up a Reddit post",
    description: "Finds a Reddit post by its link or ID.",
    icon: "fa-solid fa-file-lines",
    keywords: ["post", "link"],
    variable: POST,
    noun: "Reddit post",
    fields: POST_FIELDS,
    block: {
      type: "reddit_getPost",
      text: ["get Reddit post (link or ID): {post}", "then {code}"],
      parts: { post: { check: "String" } },
      inline: false,
      tooltip: "Looks up a Reddit post, then runs the blocks inside",
    },
    inputs: [postInput],
    expr: (ctx) => `(async () => {
    const id = redditThingId(${ctx.input("post")}).replace(/^t[13]_/, "");
    const json = await redditRequest("/comments/" + id, { limit: "1" }, { quiet: true });
    const post = Array.isArray(json) ? json[0]?.data?.children?.[0]?.data : null;
    if (post) return redditPost(post);
    if (globalThis.redditLogin) return null;
    return (await redditRss("/comments/" + id))[0] ?? null;
  })()`,
  }),
  loop({
    id: "reddit_search_posts",
    label: "For each Reddit post found",
    description:
      "Searches Reddit (or one subreddit) and runs once for each post found.",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["search", "find"],
    variable: POST,
    noun: "Reddit post",
    fields: POST_FIELDS,
    block: {
      type: "reddit_searchPosts",
      text: [
        "for each Reddit post found searching: {query}",
        "in subreddit (empty for all of Reddit): {subreddit}",
        "sorted by {sort}",
        "max posts (1-100): {limit}",
        "do {code}",
      ],
      parts: { query: { check: "String" }, subreddit: { check: "String" } },
      inline: false,
      tooltip:
        'Searches Reddit and runs the blocks inside once for each post found. Use "get ... of Reddit post" inside it.',
    },
    inputs: [
      input.text("query", "Search for", { default: "" }),
      {
        ...subredditInput,
        label: "Subreddit (optional)",
        help: "Leave it empty to search all of Reddit.",
      },
      input.dropdown("sort", "Sorted by", [
        ["relevance", "relevance"],
        ["new", "new"],
        ["top", "top"],
        ["most comments", "comments"],
      ]),
      limitInput(),
    ],
    expr: (ctx) => `(async () => {
    const subreddit = ${subredditName(ctx.input("subreddit"))};
    return redditPosts((subreddit ? "/r/" + encodeURIComponent(subreddit) : "") + "/search", { q: String(${ctx.input("query")}), sort: "${ctx.raw("sort")}", limit: ${limitOf(ctx)}, ...(subreddit ? { restrict_sr: "1" } : {}) });
  })()`,
  }),
  loop({
    id: "reddit_each_comment",
    label: "For each comment on a Reddit post",
    description: "Runs once for each top-level comment on a post.",
    icon: "fa-solid fa-comments",
    keywords: ["comments", "replies"],
    variable: COMMENT,
    noun: "Reddit comment",
    fields: COMMENT_FIELDS,
    info: infoBlock("reddit_commentInfo", "Reddit comment", COMMENT_FIELDS, {
      inside: ["reddit_forEachComment"],
    }),
    block: {
      type: "reddit_forEachComment",
      text: [
        "for each {sort} comment on Reddit post (link or ID): {post}",
        "max comments (1-100): {limit}",
        "do {code}",
      ],
      parts: { post: { check: "String" } },
      inline: false,
      tooltip:
        'Runs the blocks inside once for each top-level comment on a post. Use "get ... of Reddit comment" inside it.',
    },
    inputs: [
      input.dropdown("sort", "Sorted by", [
        ["best", "confidence"],
        ["top", "top"],
        ["new", "new"],
        ["controversial", "controversial"],
      ]),
      postInput,
      limitInput(),
    ],
    expr: (ctx) =>
      `redditComments(${ctx.input("post")}, "${ctx.raw("sort")}", Number(${limitOf(ctx)}))`,
  }),
  lookup({
    id: "reddit_get_user",
    label: "Look up a Reddit user",
    description: 'Finds a Reddit user (like "spez" or "u/spez").',
    icon: "fa-solid fa-user",
    keywords: ["user", "profile", "karma", "u/"],
    variable: USER,
    noun: "Reddit user",
    fields: USER_FIELDS,
    info: infoBlock("reddit_userInfo", "Reddit user", USER_FIELDS, {
      inside: ["reddit_getUser"],
    }),
    block: {
      type: "reddit_getUser",
      text: ["get Reddit user: {user}", "then {code}"],
      parts: { user: { check: "String" } },
      inline: false,
      tooltip:
        'Looks up a Reddit user (like "spez" or "u/spez"), then runs the blocks inside',
    },
    inputs: [userInput],
    expr: (ctx) => `redditUser(${userName(ctx.input("user"))})`,
  }),
  loop({
    id: "reddit_each_user_post",
    label: "For each post by a Reddit user",
    description: "Runs once for each post a user made.",
    icon: "fa-solid fa-user-pen",
    keywords: ["user posts", "submitted"],
    variable: POST,
    noun: "Reddit post",
    fields: POST_FIELDS,
    block: {
      type: "reddit_forEachUserPost",
      text: [
        "for each {sort} post by Reddit user: {user}",
        "max posts (1-100): {limit}",
        "do {code}",
      ],
      parts: { user: { check: "String" } },
      inline: false,
      tooltip:
        'Runs the blocks inside once for each post a user made. Use "get ... of Reddit post" inside it.',
    },
    inputs: [
      input.dropdown("sort", "Sorted by", [
        ["new", "new"],
        ["hot", "hot"],
        ["top", "top"],
      ]),
      userInput,
      limitInput(),
    ],
    expr: (ctx) =>
      `redditPosts("/user/" + encodeURIComponent(${userName(ctx.input("user"))}) + "/submitted", { sort: "${ctx.raw("sort")}", limit: ${limitOf(ctx)} })`,
  }),
  step({
    id: "reddit_login",
    label: "Log in to Reddit",
    description:
      'Makes every Reddit step use Reddit\'s official API, which is more reliable. Make a "script" app at reddit.com/prefs/apps for the client ID and secret. Add a username and password to post, reply and send messages as that account.',
    icon: "fa-solid fa-key",
    keywords: ["login", "api", "client id", "account"],
    block: {
      type: "reddit_login",
      text: [
        "log in to Reddit",
        "app client ID: {clientId}",
        "app secret: {clientSecret}",
        "username (only for posting): {username}",
        "password (only for posting): {password}",
      ],
      parts: {
        clientId: { check: null },
        clientSecret: { check: null },
        username: { check: null },
        password: { check: null },
      },
      tooltip:
        'Makes every Reddit block use Reddit\'s official API, which is more reliable. Create a "script" app at reddit.com/prefs/apps for the client ID and secret. Add a username and password to post, reply and send messages as that account. Put this in "when the bot is logged in".',
    },
    inputs: [
      input.text("clientId", "App client ID", {
        default: "",
        help: "Keep it in a Secret, and use the Secret here.",
      }),
      input.text("clientSecret", "App secret", {
        default: "",
        help: "Keep it in a Secret, and use the Secret here.",
      }),
      input.text("username", "Username (only for posting)", { default: "" }),
      input.text("password", "Password (only for posting)", {
        default: "",
        help: "Keep it in a Secret, and use the Secret here.",
      }),
    ],
    code: (ctx) =>
      `globalThis.redditLogin = { clientId: String(${ctx.input("clientId")} ?? ""), clientSecret: String(${ctx.input("clientSecret")} ?? ""), username: ${ctx.input("username")} ? String(${ctx.input("username")}) : null, password: String(${ctx.input("password")} ?? "") };
await redditToken();\n`,
  }),
  step({
    id: "reddit_submit_post",
    label: "Post to Reddit",
    description: `Submits a text or link post as the logged in account. Follow each subreddit's rules on bots. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-paper-plane",
    keywords: ["post", "submit", "share"],
    block: {
      type: "reddit_submitPost",
      text: [
        "post a {kind} post to Reddit",
        "subreddit: {subreddit}",
        "title: {title}",
        "text or link: {content}",
        "NSFW {nsfw}",
      ],
      parts: { nsfw: { part: "checkbox" } },
      tooltip:
        'Submits a post as the account from "log in to Reddit". Follow each subreddit\'s rules on bots.',
    },
    inputs: [
      input.dropdown("kind", "Kind of post", [
        ["text", "self"],
        ["link", "link"],
      ]),
      subredditInput,
      input.text("title", "Title", { default: "" }),
      input.text("content", "Text or link", { default: "", multiline: true }),
      input.boolean("nsfw", "NSFW", { default: false, allowValues: false }),
    ],
    code: (ctx) =>
      `await redditAction("/api/submit", { sr: ${subredditName(ctx.input("subreddit"))}, kind: "${ctx.raw("kind")}", title: String(${ctx.input("title")}), ${ctx.raw("kind") === "link" ? "url" : "text"}: String(${ctx.input("content")})${ctx.raw("nsfw") === true ? ', nsfw: "true"' : ""} });\n`,
  }),
  step({
    id: "reddit_reply",
    label: "Reply on Reddit",
    description: `Comments on a post, or replies to a comment, as the logged in account. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-reply",
    keywords: ["comment", "reply"],
    block: {
      type: "reddit_reply",
      text: [
        "reply on Reddit with: {text}",
        "to post or comment (link): {thing}",
      ],
      tooltip:
        'Comments on a post, or replies to a comment, as the account from "log in to Reddit"',
    },
    inputs: [
      input.text("text", "Reply", { default: "", multiline: true }),
      input.text("thing", "Post or comment (link)", { default: "" }),
    ],
    code: (ctx) =>
      `await redditAction("/api/comment", { thing_id: redditThingId(${ctx.input("thing")}), text: String(${ctx.input("text")}) });\n`,
  }),
  step({
    id: "reddit_send_message",
    label: "Send a Reddit message",
    description: `Sends a private message as the logged in account. ${NEEDS_LOGIN}`,
    icon: "fa-solid fa-envelope",
    keywords: ["message", "pm", "dm"],
    block: {
      type: "reddit_sendMessage",
      text: [
        "send Reddit message to user: {user}",
        "subject: {subject}",
        "message: {text}",
      ],
      tooltip: 'Sends a private message as the account from "log in to Reddit"',
    },
    inputs: [
      userInput,
      input.text("subject", "Subject", { default: "" }),
      input.text("text", "Message", { default: "", multiline: true }),
    ],
    code: (ctx) =>
      `await redditAction("/api/compose", { to: ${userName(ctx.input("user"))}, subject: String(${ctx.input("subject")}), text: String(${ctx.input("text")}) });\n`,
  }),
];

/* ---- Events ----------------------------------------------------------- */

const events = [
  watcher({
    id: "reddit_new_post",
    label: "When a new post is made in a subreddit",
    description:
      "Runs for every new post in a subreddit, for feeds in a Discord channel. It's checked every few minutes.",
    icon: "fa-brands fa-reddit-alien",
    keywords: ["new post", "feed", "notification"],
    variable: POST,
    fields: POST_FIELDS,
    block: {
      type: "reddit_onNewPost",
      text: [
        "when a new post is made in subreddit: {subreddit}",
        "check every (minutes): {minutes}",
      ],
      parts: { subreddit: { check: "String" } },
      tooltip:
        'Runs for every new post in a subreddit — great for feeds in a Discord channel. Use "get ... of Reddit post" inside it. The subreddit is checked every few minutes (at least 1).',
    },
    settings: [{ ...subredditInput, allowValues: false }, minutesInput()],
    watch: (ctx, body) => `(() => {
  let seenPosts = null;
  const check = async () => {
    try {
      const posts = await redditPosts("/r/" + encodeURIComponent(${subredditName(ctx.input("subreddit"))}) + "/new", { limit: "25" });
      if (!posts.length) return;

      if (!seenPosts) {
        seenPosts = new Set(posts.map(post => post.id));
        return;
      }

      for (const ${POST} of posts.filter(post => !seenPosts.has(post.id)).reverse()) {
        seenPosts.add(${POST}.id);
        ${body}}
    } catch (error) {
      console.error("Error checking Reddit:", error);
    }
  };
  setTimeout(check, 5000);
  setInterval(check, Math.max(1, Number(${ctx.input("minutes")}) || 5) * 60 * 1000);
})();\n`,
  }),
];

/* ---- Values ----------------------------------------------------------- */

const values = [
  check({
    id: "reddit_subreddit_exists",
    label: "Subreddit exists?",
    description: "True if a subreddit exists and is public.",
    icon: "fa-solid fa-circle-check",
    keywords: ["exists", "valid"],
    block: {
      type: "reddit_subredditExists",
      text: ["subreddit: {subreddit}", "exists?"],
      parts: { subreddit: { check: "String" } },
      tooltip: "Checks whether a subreddit exists and is public",
    },
    output: "Boolean",
    inputs: [subredditInput],
    code: (ctx) =>
      `(await redditSubreddit(${subredditName(ctx.input("subreddit"))}).then(async (sub) => !!sub).catch(async () => false))`,
  }),
  check({
    id: "reddit_member_count",
    label: "Members of a subreddit",
    description: "How many members a subreddit has.",
    icon: "fa-solid fa-users",
    keywords: ["members", "subscribers", "count"],
    block: {
      type: "reddit_memberCount",
      text: "member count of subreddit: {subreddit}",
      parts: { subreddit: { check: "String" } },
      inline: false,
      tooltip: "How many members a subreddit has",
    },
    output: "Number",
    inputs: [subredditInput],
    code: (ctx) =>
      `(await redditSubreddit(${subredditName(ctx.input("subreddit"))}).then(async (sub) => sub?.members ?? null).catch(async () => null))`,
  }),
  check({
    id: "reddit_user_exists",
    label: "Reddit user exists?",
    description: "True if a Reddit account exists (and isn't suspended).",
    icon: "fa-solid fa-user-check",
    keywords: ["exists", "valid", "account"],
    block: {
      type: "reddit_userExists",
      text: ["Reddit user: {user}", "exists?"],
      parts: { user: { check: "String" } },
      tooltip: "Checks whether a Reddit account exists (and isn't suspended)",
    },
    output: "Boolean",
    inputs: [userInput],
    code: (ctx) =>
      `(await redditUser(${userName(ctx.input("user"))}).then(async (user) => !!user).catch(async () => false))`,
  }),
  check({
    id: "reddit_user_karma",
    label: "Karma of a Reddit user",
    description: "A Reddit user's total karma.",
    icon: "fa-solid fa-arrow-up",
    keywords: ["karma", "points"],
    block: {
      type: "reddit_userKarma",
      text: "karma of Reddit user: {user}",
      parts: { user: { check: "String" } },
      inline: false,
      tooltip: "A Reddit user's total karma",
    },
    output: "Number",
    inputs: [userInput],
    code: (ctx) =>
      `(await redditUser(${userName(ctx.input("user"))}).then(async (user) => user?.karma ?? null).catch(async () => null))`,
  }),
  check({
    id: "reddit_post_list",
    label: "List from a subreddit's posts",
    description:
      "The titles, links or picture links of a subreddit's posts, as a list.",
    icon: "fa-solid fa-list-ul",
    keywords: ["list", "titles", "links", "images"],
    block: {
      type: "reddit_postList",
      text: [
        "list of {pick} of {sort} posts in subreddit: {subreddit}",
        "max posts (1-100): {limit}",
      ],
      parts: { subreddit: { check: "String" }, sort: { options: SORTS } },
      inline: false,
      tooltip: "A list made from a subreddit's posts",
    },
    output: "Array",
    inputs: [
      input.dropdown("pick", "List of", [
        ["titles", "title"],
        ["links", "url"],
        ["image URLs", "imageUrl"],
      ]),
      sortInput(),
      subredditInput,
      limitInput(),
    ],
    code: (ctx) => {
      const { name, params } = sortOf(ctx.raw("sort"));
      return `(await redditPosts("/r/" + encodeURIComponent(${subredditName(ctx.input("subreddit"))}) + "/${name}", { limit: ${limitOf(ctx)}${params} }).then(async (posts) => posts.map(post => post.${ctx.raw("pick")}).filter(item => item != null)).catch(async () => []))`;
    },
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
