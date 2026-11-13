import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../lib/restrictions";
import {
  appBlocks,
  loopGenerator,
  newItemsCode,
  thenGenerator,
  value,
} from "../lib/appBlocks";

const colour = "#1D9BF0";
const { thenBlock, loopBlock, hatBlock, statementBlock, outputBlock, infoBlock } =
  appBlocks(colour);

/* Everything above the "log in" line in the toolbox works without an
   account. X's own API has no free reading, so those blocks read public
   posts and profiles through FxTwitter (api.fxtwitter.com), a free,
   open-source API built for embedding X posts.

   Posting, liking, reposting, following and searching go through X's
   official API (api.x.com), which needs a developer app with "Read and
   write" permissions: its API key and secret plus an access token and
   secret, from developer.x.com. Requests are signed with OAuth 1.0a.
   Search uses X's paid read access, so it depends on the app's plan. */

const USER_AGENT = "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)";

/** Turns "@name", "x.com/name" or a twitter.com link into a username. */
const usernameOf = () =>
  javascriptGenerator.provideFunction_(
    "xUsername",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  return String(user ?? "")
    .trim()
    .replace(/^(https?:\\/\\/)?(www\\.|mobile\\.)?(x|twitter)\\.com\\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
}`,
  );

/** Turns a post link or ID into the post ID. */
const postIdOf = () =>
  javascriptGenerator.provideFunction_(
    "xPostId",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post) {
  const text = String(post ?? "").trim();
  const match = text.match(/\\/status(?:es)?\\/(\\d+)/);
  if (match) return match[1];
  return /^\\d+$/.test(text) ? text : null;
}`,
  );

/** Reads FxTwitter's public API. */
const fx = () =>
  javascriptGenerator.provideFunction_(
    "xFxTwitter",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(path) {
  /* FxTwitter sometimes answers 404 for accounts that do exist, so a
     404 is retried a couple of times before it is believed. */
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    const res = await fetch("https://api.fxtwitter.com/2/" + path, { headers: { "User-Agent": "${USER_AGENT}" } });
    if (res.ok) return res.json();
    if (res.status !== 404) {
      console.error("X (FxTwitter) error (" + res.status + ")");
      return null;
    }
  }
  return null;
}`,
  );

/** Turns an FxTwitter post into the shape the post info block reads. */
const postShape = () =>
  javascriptGenerator.provideFunction_(
    "xPostShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post) {
  const media = post.media || {};
  return {
    id: post.id,
    text: post.text ?? "",
    url: post.url || "https://x.com/i/status/" + post.id,
    authorUsername: post.author?.screen_name ?? null,
    authorName: post.author?.name ?? null,
    authorUrl: post.author?.screen_name ? "https://x.com/" + post.author.screen_name : null,
    authorAvatarUrl: post.author?.avatar_url ?? null,
    likes: post.likes ?? null,
    reposts: post.reposts ?? null,
    replies: post.replies ?? null,
    quotes: post.quotes ?? null,
    bookmarks: post.bookmarks ?? null,
    views: post.views ?? null,
    createdAt: post.created_timestamp ? new Date(post.created_timestamp * 1000) : post.created_at ? new Date(post.created_at) : null,
    imageUrls: (media.photos || []).map(photo => photo.url),
    videoUrl: media.videos?.[0]?.url ?? null,
    mediaUrls: (media.all || []).map(item => item.url),
    isReply: !!post.replying_to,
    replyingTo: post.replying_to?.screen_name ?? null,
    isRepost: !!post.reposted_by,
    repostedBy: post.reposted_by?.screen_name ?? null,
    language: post.lang ?? null,
    isSensitive: !!post.possibly_sensitive
  };
}`,
  );

/** Turns an FxTwitter profile into the shape the user info block reads. */
const userShape = () =>
  javascriptGenerator.provideFunction_(
    "xUserShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  return {
    username: user.screen_name,
    name: user.name,
    id: user.id,
    description: user.description ?? "",
    location: user.location || null,
    website: user.website?.url ?? (typeof user.website === "string" ? user.website : null),
    url: "https://x.com/" + user.screen_name,
    followers: user.followers ?? null,
    following: user.following ?? null,
    posts: user.statuses ?? null,
    likes: user.likes ?? null,
    mediaCount: user.media_count ?? null,
    avatarUrl: user.avatar_url ? user.avatar_url.replace(/_normal(\\.\\w+)$/, "_400x400$1") : null,
    bannerUrl: user.banner_url ?? null,
    joinedAt: user.joined ? new Date(user.joined) : null,
    isVerified: !!user.verification?.verified,
    isProtected: !!user.protected
  };
}`,
  );

/** A user's recent posts: "posts" (no reposts), "reposts" or "all". Newest first. */
const postsOf = () =>
  javascriptGenerator.provideFunction_(
    "xUserPosts",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user, kind = "posts") {
  const username = ${usernameOf()}(user);
  if (!username) return [];
  const json = await ${fx()}("profile/" + encodeURIComponent(username) + "/statuses");
  const posts = (json?.results || [])
    .map(${postShape()})
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (kind === "posts") return posts.filter(post => !post.isRepost);
  if (kind === "reposts") return posts.filter(post => post.isRepost);
  return posts;
}`,
  );

const postOf = () =>
  javascriptGenerator.provideFunction_(
    "xPost",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post) {
  const id = ${postIdOf()}(post);
  if (!id) return null;
  const json = await ${fx()}("status/" + id);
  return json?.status ? ${postShape()}(json.status) : null;
}`,
  );

const userOf = () =>
  javascriptGenerator.provideFunction_(
    "xUser",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  const username = ${usernameOf()}(user);
  if (!username) return null;
  const json = await ${fx()}("profile/" + encodeURIComponent(username));
  return json?.user ? ${userShape()}(json.user) : null;
}`,
  );

const KINDS = [
  ["post (not a repost)", "posts"],
  ["post or repost", "all"],
  ["repost", "reposts"],
];

/* ------------------------------------------------------------------ */
/* Posts (no login needed)                                              */
/* ------------------------------------------------------------------ */

Blockly.Blocks["x_getPost"] = {
  init: function () {
    this.appendValueInput("post")
      .setCheck("String")
      .appendField("get X post (link or ID):");
    thenBlock(
      this,
      'Looks up a public post on X (Twitter), then runs the blocks inside. Use "get ... of X post" inside.',
    );
  },
};

javascriptGenerator.forBlock["x_getPost"] = thenGenerator(
  "xPostInformation",
  "X post",
  (block, generator) => `${postOf()}(${value(block, generator, "post")})`,
);

Blockly.Blocks["x_getLatestPost"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("get latest")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind")
      .appendField("of X user:");
    thenBlock(this, "Gets a user's newest post, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["x_getLatestPost"] = thenGenerator(
  "xPostInformation",
  "X posts",
  (block, generator) =>
    `${postsOf()}(${value(block, generator, "user")}, "${block.getFieldValue("kind")}").then(async (posts) => posts[0])`,
);

Blockly.Blocks["x_forEachPost"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("for each recent")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind")
      .appendField("of X user:");
    loopBlock(
      this,
      "Runs the blocks inside once for each of a user's latest posts (up to 20), newest first",
    );
  },
};

javascriptGenerator.forBlock["x_forEachPost"] = loopGenerator(
  "xPostInformation",
  "X posts",
  (block, generator) =>
    `${postsOf()}(${value(block, generator, "user")}, "${block.getFieldValue("kind")}")`,
);

Blockly.Blocks["x_onNewPost"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("when X user:");
    this.appendDummyInput()
      .appendField("posts a new")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind");
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    hatBlock(
      this,
      'Runs once for each new post from a user — great for post notifications. Use "get ... of X post" inside. The user is checked every few minutes (at least 1).',
    );
  },
};

javascriptGenerator.forBlock["x_onNewPost"] = function (block, generator) {
  return newItemsCode({
    minutes: value(block, generator, "minutes", "5"),
    label: "X",
    list: `${postsOf()}(${value(block, generator, "user")}, "${block.getFieldValue("kind")}")`,
    variable: "xPostInformation",
    code: generator.statementToCode(block, "code"),
  });
};

infoBlock(
  "x_postInfo",
  "xPostInformation",
  "X post",
  [
    ["text", "text"],
    ["link", "url"],
    ["post ID", "id"],
    ["author @username", "authorUsername"],
    ["author display name", "authorName"],
    ["author link", "authorUrl"],
    ["author profile picture URL", "authorAvatarUrl"],
    ["likes", "likes"],
    ["reposts", "reposts"],
    ["replies", "replies"],
    ["quotes", "quotes"],
    ["bookmarks", "bookmarks"],
    ["views", "views"],
    ["post date", "createdAt"],
    ["image URLs (list)", "imageUrls"],
    ["video URL", "videoUrl"],
    ["all media URLs (list)", "mediaUrls"],
    ["is a reply", "isReply"],
    ["replying to @username", "replyingTo"],
    ["is a repost", "isRepost"],
    ["reposted by @username", "repostedBy"],
    ["language", "language"],
    ["is marked sensitive", "isSensitive"],
  ],
  "Information about the X post. Missing info is null.",
);

/* ------------------------------------------------------------------ */
/* Users (no login needed)                                              */
/* ------------------------------------------------------------------ */

Blockly.Blocks["x_getUser"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("get X user (@username or link):");
    thenBlock(this, "Looks up a public X profile, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["x_getUser"] = thenGenerator(
  "xUserInformation",
  "X user",
  (block, generator) => `${userOf()}(${value(block, generator, "user")})`,
);

infoBlock(
  "x_userInfo",
  "xUserInformation",
  "X user",
  [
    ["@username", "username"],
    ["display name", "name"],
    ["user ID", "id"],
    ["bio", "description"],
    ["location", "location"],
    ["website", "website"],
    ["link", "url"],
    ["followers count", "followers"],
    ["following count", "following"],
    ["posts count", "posts"],
    ["likes count", "likes"],
    ["media count", "mediaCount"],
    ["profile picture URL", "avatarUrl"],
    ["banner image URL", "bannerUrl"],
    ["join date", "joinedAt"],
    ["is verified", "isVerified"],
    ["is protected (private)", "isProtected"],
  ],
);

/* ------------------------------------------------------------------ */
/* Quick info                                                           */
/* ------------------------------------------------------------------ */

Blockly.Blocks["x_followers"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("follower count of X user:");
    outputBlock(this, "Number", "How many followers an X account has");
  },
};

javascriptGenerator.forBlock["x_followers"] = function (block, generator) {
  const user = value(block, generator, "user");
  return [
    `await ${userOf()}(${user}).then(async (user) => user?.followers ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["x_userExists"] = {
  init: function () {
    this.appendValueInput("user").setCheck("String").appendField("X user:");
    this.appendDummyInput().appendField("exists?");
    this.setInputsInline(true);
    outputBlock(this, "Boolean", "Checks whether an X account exists");
  },
};

javascriptGenerator.forBlock["x_userExists"] = function (block, generator) {
  const user = value(block, generator, "user");
  return [
    `await ${userOf()}(${user}).then(async (user) => !!user).catch(async () => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["x_latestPostLink"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("link to latest")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind")
      .appendField("of X user:");
    outputBlock(this, "String", "The link to a user's newest post, or null");
  },
};

javascriptGenerator.forBlock["x_latestPostLink"] = function (block, generator) {
  const user = value(block, generator, "user");
  const kind = block.getFieldValue("kind");
  return [
    `await ${postsOf()}(${user}, "${kind}").then(async (posts) => posts[0]?.url ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["x_postId"] = {
  init: function () {
    this.appendValueInput("post")
      .setCheck("String")
      .appendField("post ID from X link:");
    outputBlock(this, "String", "Gets the ID out of a post link, like x.com/user/status/123");
  },
};

javascriptGenerator.forBlock["x_postId"] = function (block, generator) {
  const post = value(block, generator, "post");
  return [`${postIdOf()}(${post})`, Order.FUNCTION_CALL];
};

/* ------------------------------------------------------------------ */
/* With an X developer app                                              */
/* ------------------------------------------------------------------ */

/** Calls X's official API, signed as the account from "log in to X". */
const api = () =>
  javascriptGenerator.provideFunction_(
    "xApi",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(method, path, { query = {}, body, form } = {}) {
  const login = globalThis.xLogin;
  if (!login) {
    console.error('X: use "log in to X" (in "when the bot is logged in") before using this block.');
    return null;
  }

  const crypto = require("crypto");
  const encode = (text) => encodeURIComponent(String(text)).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const url = "https://api.x.com/2/" + path;
  const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== "").map(([key, value]) => [key, String(value)]));

  const oauth = {
    oauth_consumer_key: login.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: login.accessToken,
    oauth_version: "1.0"
  };
  const signed = Object.entries({ ...params, ...oauth })
    .map(([key, value]) => [encode(key), encode(value)])
    .sort((a, b) => a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : (a[0] < b[0] ? -1 : 1))
    .map(([key, value]) => key + "=" + value)
    .join("&");
  oauth.oauth_signature = crypto
    .createHmac("sha1", encode(login.apiSecret) + "&" + encode(login.accessSecret))
    .update([method, encode(url), encode(signed)].join("&"))
    .digest("base64");

  const search = new URLSearchParams(params).toString();
  const res = await fetch(url + (search ? "?" + search : ""), {
    method,
    headers: {
      Authorization: "OAuth " + Object.entries(oauth).map(([key, value]) => encode(key) + '="' + encode(value) + '"').join(", "),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: form || (body ? JSON.stringify(body) : undefined)
  });

  const json = await res.json().catch(async () => null);
  if (!res.ok) {
    console.error("X API error (" + res.status + "):", json?.detail || json?.title || json);
    return null;
  }
  return json;
}`,
  );

/** The logged-in account's user ID (cached). */
const meId = () =>
  javascriptGenerator.provideFunction_(
    "xMyId",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  if (globalThis.xLogin?.id) return globalThis.xLogin.id;
  const json = await ${api()}("GET", "users/me");
  if (json?.data?.id && globalThis.xLogin) globalThis.xLogin.id = json.data.id;
  return json?.data?.id ?? null;
}`,
  );

/** Turns an X API v2 user into the same shape as the public user blocks. */
const apiUserShape = () =>
  javascriptGenerator.provideFunction_(
    "xApiUserShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  const metrics = user.public_metrics || {};
  return {
    username: user.username,
    name: user.name,
    id: user.id,
    description: user.description ?? "",
    location: user.location || null,
    website: user.url || null,
    url: "https://x.com/" + user.username,
    followers: metrics.followers_count ?? null,
    following: metrics.following_count ?? null,
    posts: metrics.tweet_count ?? null,
    likes: metrics.like_count ?? null,
    mediaCount: metrics.media_count ?? null,
    avatarUrl: user.profile_image_url ? user.profile_image_url.replace(/_normal(\\.\\w+)$/, "_400x400$1") : null,
    bannerUrl: null,
    joinedAt: user.created_at ? new Date(user.created_at) : null,
    isVerified: !!user.verified,
    isProtected: !!user.protected
  };
}`,
  );

/** Looks up a user ID by username with the official API. */
const apiUserId = () =>
  javascriptGenerator.provideFunction_(
    "xApiUserId",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  const username = ${usernameOf()}(user);
  if (/^\\d+$/.test(username)) return username;
  const json = await ${api()}("GET", "users/by/username/" + encodeURIComponent(username));
  return json?.data?.id ?? null;
}`,
  );

Blockly.Blocks["x_login"] = {
  init: function () {
    this.appendDummyInput().appendField("log in to X");
    this.appendValueInput("apiKey").setCheck(null).appendField("API key:");
    this.appendValueInput("apiSecret").setCheck(null).appendField("API key secret:");
    this.appendValueInput("accessToken").setCheck(null).appendField("access token:");
    this.appendValueInput("accessSecret")
      .setCheck(null)
      .appendField("access token secret:");
    statementBlock(
      this,
      'Lets the bot post and act as your X account. Make an app at developer.x.com with "Read and write" permissions, then generate its keys and an access token. Put this in "when the bot is logged in".',
    );
  },
};

javascriptGenerator.forBlock["x_login"] = function (block, generator) {
  const field = (name) => `String(${value(block, generator, name)} ?? "").trim()`;

  return `globalThis.xLogin = { apiKey: ${field("apiKey")}, apiSecret: ${field("apiSecret")}, accessToken: ${field("accessToken")}, accessSecret: ${field("accessSecret")} };\n`;
};

Blockly.Blocks["x_createPost"] = {
  init: function () {
    this.appendValueInput("text").setCheck("String").appendField("post on X:");
    this.appendValueInput("image")
      .setCheck("String")
      .appendField("image URL (optional):");
    this.appendValueInput("replyTo")
      .setCheck("String")
      .appendField("in reply to post (optional):");
    thenBlock(
      this,
      'Posts on X as the account from "log in to X", then runs the blocks inside. Inside, "get link of X post" is the new post\'s link.',
    );
  },
};

javascriptGenerator.forBlock["x_createPost"] = function (block, generator) {
  const text = value(block, generator, "text");
  const image = value(block, generator, "image");
  const replyTo = value(block, generator, "replyTo");
  const code = generator.statementToCode(block, "code");

  return `await (async () => {
  const text = String(${text} ?? "");
  const imageUrl = String(${image} ?? "").trim();
  const replyTo = ${postIdOf()}(${replyTo});
  const post = { text };

  if (imageUrl) {
    const image = await fetch(imageUrl).then(async (res) => res.ok ? res.blob() : null).catch(async () => null);
    if (!image) {
      console.error("X: couldn't download the image " + imageUrl);
    } else {
      const form = new FormData();
      form.append("media", image, "image");
      form.append("media_category", "tweet_image");
      const media = await ${api()}("POST", "media/upload", { form });
      if (media?.data?.id) post.media = { media_ids: [media.data.id] };
    }
  }
  if (replyTo) post.reply = { in_reply_to_tweet_id: replyTo };

  const json = await ${api()}("POST", "tweets", { body: post });
  if (!json?.data?.id) return;

  const xPostInformation = { id: json.data.id, text: json.data.text ?? text, url: "https://x.com/i/status/" + json.data.id, isReply: !!replyTo, isRepost: false, createdAt: new Date(), imageUrls: [], mediaUrls: [] };
  ${code}})().catch(async (error) => console.error("Error posting on X:", error));\n`;
};

Blockly.Blocks["x_postAction"] = {
  init: function () {
    this.appendValueInput("post")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["like", "like"],
          ["unlike", "unlike"],
          ["repost", "repost"],
          ["undo repost of", "unrepost"],
          ["delete", "delete"],
        ]),
        "action",
      )
      .appendField("X post (link or ID):");
    statementBlock(
      this,
      'Likes, reposts or deletes a post as the account from "log in to X". You can only delete your own posts.',
    );
  },
};

javascriptGenerator.forBlock["x_postAction"] = function (block, generator) {
  const post = value(block, generator, "post");
  const action = block.getFieldValue("action");

  const calls = {
    like: `${api()}("POST", "users/" + me + "/likes", { body: { tweet_id: id } })`,
    unlike: `${api()}("DELETE", "users/" + me + "/likes/" + id)`,
    repost: `${api()}("POST", "users/" + me + "/retweets", { body: { tweet_id: id } })`,
    unrepost: `${api()}("DELETE", "users/" + me + "/retweets/" + id)`,
    delete: `${api()}("DELETE", "tweets/" + id)`,
  };

  return `await (async () => {
  const id = ${postIdOf()}(${post});
  if (!id) return;
  ${action === "delete" ? "" : `const me = await ${meId()}();\n  if (!me) return;\n  `}await ${calls[action]};
})().catch(async (error) => console.error("Error with X post:", error));\n`;
};

Blockly.Blocks["x_followUser"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["follow", "follow"],
          ["unfollow", "unfollow"],
        ]),
        "action",
      )
      .appendField("X user:");
    statementBlock(this, 'Follows or unfollows a user as the account from "log in to X"');
  },
};

javascriptGenerator.forBlock["x_followUser"] = function (block, generator) {
  const user = value(block, generator, "user");
  const follow = block.getFieldValue("action") === "follow";

  return `await (async () => {
  const [me, target] = await Promise.all([${meId()}(), ${apiUserId()}(${user})]);
  if (!me || !target) return;
  await ${
    follow
      ? `${api()}("POST", "users/" + me + "/following", { body: { target_user_id: target } })`
      : `${api()}("DELETE", "users/" + me + "/following/" + target)`
  };
})().catch(async (error) => console.error("Error following X user:", error));\n`;
};

Blockly.Blocks["x_getMe"] = {
  init: function () {
    this.appendDummyInput().appendField("get my X account");
    thenBlock(
      this,
      'Gets the account from "log in to X", then runs the blocks inside. Use "get ... of X user" inside.',
    );
  },
};

javascriptGenerator.forBlock["x_getMe"] = thenGenerator(
  "xUserInformation",
  "X account",
  () =>
    `${api()}("GET", "users/me", { query: { "user.fields": "created_at,description,location,profile_image_url,protected,public_metrics,url,verified" } }).then(async (json) => json?.data ? ${apiUserShape()}(json.data) : null)`,
);

Blockly.Blocks["x_apiSearch"] = {
  init: function () {
    this.appendValueInput("query")
      .setCheck("String")
      .appendField("for each X post from the last 7 days matching:");
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("max results (10-100):");
    loopBlock(
      this,
      'Searches recent posts with X\'s official API (supports operators like "from:user" and "#tag"), then runs the blocks inside once for each. Needs "log in to X" and an X API plan with read access.',
    );
  },
};

javascriptGenerator.forBlock["x_apiSearch"] = loopGenerator(
  "xPostInformation",
  "X search",
  (block, generator) => {
    const query = value(block, generator, "query");
    const count = value(block, generator, "count", "10");

    return `${api()}("GET", "tweets/search/recent", { query: {
  query: String(${query}),
  max_results: Math.min(100, Math.max(10, Number(${count}) || 10)),
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
})`;
  },
);

/* ------------------------------------------------------------------ */
/* Where the info blocks can go                                         */
/* ------------------------------------------------------------------ */

createRestrictions(
  ["x_postInfo"],
  [
    {
      type: "hasParent",
      blockTypes: [
        "x_getPost",
        "x_getLatestPost",
        "x_forEachPost",
        "x_onNewPost",
        "x_createPost",
        "x_apiSearch",
      ],
      message:
        'This block must be inside a "get X post", "for each ... X post" or "when X user posts" block.',
    },
  ],
);

createRestrictions(
  ["x_userInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["x_getUser", "x_getMe"],
      message: 'This block must be inside a "get X user" or "get my X account" block.',
    },
  ],
);
