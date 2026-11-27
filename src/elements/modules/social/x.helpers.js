/* Generated from the block editor's x blocks: the helper functions
   their code uses, each emitted once at the top of the bot. */

export const HELPERS = {
  /* Everything above the "log in" line in the toolbox works without an
   account. X's own API has no free reading, so those blocks read public
   posts and profiles through FxTwitter (api.fxtwitter.com), a free,
   open-source API built for embedding X posts.

   Posting, liking, reposting, following and searching go through X's
   official API (api.x.com), which needs a developer app with "Read and
   write" permissions: its API key and secret plus an access token and
   secret, from developer.x.com. Requests are signed with OAuth 1.0a.
   Search uses X's paid read access, so it depends on the app's plan. 

const USER_AGENT = "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)";

/** Turns "@name", "x.com/name" or a twitter.com link into a username. */
  xUsername: {
    key: "xUsername",
    code: `function xUsername(user) {
  return String(user ?? "")
    .trim()
    .replace(/^(https?:\\/\\/)?(www\\.|mobile\\.)?(x|twitter)\\.com\\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
}`,
  },
  /* Turns a post link or ID into the post ID. */
  xPostId: {
    key: "xPostId",
    code: `function xPostId(post) {
  const text = String(post ?? "").trim();
  const match = text.match(/\\/status(?:es)?\\/(\\d+)/);
  if (match) return match[1];
  return /^\\d+$/.test(text) ? text : null;
}`,
  },
  /* Reads FxTwitter's public API. */
  xFxTwitter: {
    key: "xFxTwitter",
    code: `async function xFxTwitter(path) {
  /* FxTwitter sometimes answers 404 for accounts that do exist, so a
     404 is retried a couple of times before it is believed. */
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    const res = await fetch("https://api.fxtwitter.com/2/" + path, { headers: { "User-Agent": "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)" } });
    if (res.ok) return res.json();
    if (res.status !== 404) {
      console.error("X (FxTwitter) error (" + res.status + ")");
      return null;
    }
  }
  return null;
}`,
  },
  /* Turns an FxTwitter post into the shape the post info block reads. */
  xPostShape: {
    key: "xPostShape",
    code: `function xPostShape(post) {
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
  },
  /* Turns an FxTwitter profile into the shape the user info block reads. */
  xUserShape: {
    key: "xUserShape",
    code: `function xUserShape(user) {
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
  },
  /* A user's recent posts: "posts" (no reposts), "reposts" or "all". Newest first. */
  xUserPosts: {
    key: "xUserPosts",
    code: `async function xUserPosts(user, kind = "posts") {
  const username = xUsername(user);
  if (!username) return [];
  const json = await xFxTwitter("profile/" + encodeURIComponent(username) + "/statuses");
  const posts = (json?.results || [])
    .map(xPostShape)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (kind === "posts") return posts.filter(post => !post.isRepost);
  if (kind === "reposts") return posts.filter(post => post.isRepost);
  return posts;
}`,
  },
  xPost: {
    key: "xPost",
    code: `async function xPost(post) {
  const id = xPostId(post);
  if (!id) return null;
  const json = await xFxTwitter("status/" + id);
  return json?.status ? xPostShape(json.status) : null;
}`,
  },
  xUser: {
    key: "xUser",
    code: `async function xUser(user) {
  const username = xUsername(user);
  if (!username) return null;
  const json = await xFxTwitter("profile/" + encodeURIComponent(username));
  return json?.user ? xUserShape(json.user) : null;
}`,
  },
  /* ------------------------------------------------------------------ 
/* Posts (no login needed)                                              
/* ------------------------------------------------------------------ 

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

/* ------------------------------------------------------------------ 
/* Users (no login needed)                                              
/* ------------------------------------------------------------------ 

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

/* ------------------------------------------------------------------ 
/* Quick info                                                           
/* ------------------------------------------------------------------ 

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

/* ------------------------------------------------------------------ 
/* With an X developer app                                              
/* ------------------------------------------------------------------ 

/** Calls X's official API, signed as the account from "log in to X". */
  xApi: {
    key: "xApi",
    code: `async function xApi(method, path, { query = {}, body, form } = {}) {
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
  },
  /* The logged-in account's user ID (cached). */
  xMyId: {
    key: "xMyId",
    code: `async function xMyId() {
  if (globalThis.xLogin?.id) return globalThis.xLogin.id;
  const json = await xApi("GET", "users/me");
  if (json?.data?.id && globalThis.xLogin) globalThis.xLogin.id = json.data.id;
  return json?.data?.id ?? null;
}`,
  },
  /* Turns an X API v2 user into the same shape as the public user blocks. */
  xApiUserShape: {
    key: "xApiUserShape",
    code: `function xApiUserShape(user) {
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
  },
  /* Looks up a user ID by username with the official API. */
  xApiUserId: {
    key: "xApiUserId",
    code: `async function xApiUserId(user) {
  const username = xUsername(user);
  if (/^\\d+$/.test(username)) return username;
  const json = await xApi("GET", "users/by/username/" + encodeURIComponent(username));
  return json?.data?.id ?? null;
}`,
  },
};

/** Every helper, for a step's `setup` (unused ones are harmless but are left out by the caller). */
export const ALL_HELPERS = Object.values(HELPERS);
