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

const colour = "#1185FE";
const { thenBlock, loopBlock, hatBlock, statementBlock, outputBlock, infoBlock } =
  appBlocks(colour);

/* Everything above the "log in" line in the toolbox works without an
   account: Bluesky's official public API (public.api.bsky.app) shares
   profiles and posts with anyone.

   Posting, replying, liking, following, searching and notifications act
   as an account, so they need "log in to Bluesky" with the account's
   handle and an app password (Settings → Privacy and security → App
   passwords), never the real password. */

const PUBLIC_API = "https://public.api.bsky.app/xrpc/";

/** Turns "@handle", a profile/post link or a DID into a handle or DID. */
const actorOf = () =>
  javascriptGenerator.provideFunction_(
    "blueskyActor",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  const text = String(user ?? "").trim();
  const match = text.match(/bsky\\.app\\/profile\\/([^/?#]+)/i) || text.match(/^at:\\/\\/([^/]+)/);
  return (match ? match[1] : text.replace(/^@/, "")).toLowerCase();
}`,
  );

/** Reads Bluesky's public API. */
const publicApi = () =>
  javascriptGenerator.provideFunction_(
    "blueskyPublic",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(method, params = {}) {
  const res = await fetch("${PUBLIC_API}" + method + "?" + new URLSearchParams(params));
  if (!res.ok) {
    if (res.status !== 400 && res.status !== 404) console.error("Bluesky error (" + res.status + "):", await res.text().catch(async () => ""));
    return null;
  }
  return res.json();
}`,
  );

/** Turns a post link (bsky.app/profile/x/post/y) or at:// URI into an at:// URI with a DID. */
const postUriOf = () =>
  javascriptGenerator.provideFunction_(
    "blueskyPostUri",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post) {
  const text = String(post ?? "").trim();
  const match = text.match(/bsky\\.app\\/profile\\/([^/]+)\\/post\\/([A-Za-z0-9]+)/i) || text.match(/^at:\\/\\/([^/]+)\\/app\\.bsky\\.feed\\.post\\/([A-Za-z0-9]+)/);
  if (!match) return null;
  let actor = decodeURIComponent(match[1]);
  if (!actor.startsWith("did:")) {
    actor = (await ${publicApi()}("com.atproto.identity.resolveHandle", { handle: actor }))?.did;
    if (!actor) return null;
  }
  return "at://" + actor + "/app.bsky.feed.post/" + match[2];
}`,
  );

/** Turns a Bluesky post view into the shape the post info block reads. */
const postShape = () =>
  javascriptGenerator.provideFunction_(
    "blueskyPostShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post, reason) {
  const record = post.record || {};
  const embed = post.embed || {};
  const media = embed.media || embed;
  const images = (media.images || []).map(image => image.fullsize);
  const rkey = String(post.uri).split("/").pop();

  return {
    id: post.uri,
    uri: post.uri,
    cid: post.cid,
    text: record.text ?? "",
    url: "https://bsky.app/profile/" + (post.author?.handle || post.author?.did) + "/post/" + rkey,
    authorHandle: post.author?.handle ?? null,
    authorName: post.author?.displayName || post.author?.handle || null,
    authorUrl: "https://bsky.app/profile/" + (post.author?.handle || post.author?.did),
    authorAvatarUrl: post.author?.avatar ?? null,
    likes: post.likeCount ?? 0,
    reposts: post.repostCount ?? 0,
    replies: post.replyCount ?? 0,
    quotes: post.quoteCount ?? 0,
    createdAt: record.createdAt ? new Date(record.createdAt) : post.indexedAt ? new Date(post.indexedAt) : null,
    imageUrls: images,
    videoThumbnailUrl: media.thumbnail ?? null,
    linkUrl: media.external?.uri ?? null,
    isReply: !!record.reply,
    isRepost: reason?.$type === "app.bsky.feed.defs#reasonRepost",
    repostedBy: reason?.by?.handle ?? null,
    language: record.langs?.[0] ?? null
  };
}`,
  );

/** Turns a Bluesky profile into the shape the user info block reads. */
const userShape = () =>
  javascriptGenerator.provideFunction_(
    "blueskyUserShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  return {
    handle: user.handle,
    name: user.displayName || user.handle,
    did: user.did,
    description: user.description ?? "",
    url: "https://bsky.app/profile/" + (user.handle || user.did),
    followers: user.followersCount ?? null,
    following: user.followsCount ?? null,
    posts: user.postsCount ?? null,
    avatarUrl: user.avatar ?? null,
    bannerUrl: user.banner ?? null,
    joinedAt: user.createdAt ? new Date(user.createdAt) : null
  };
}`,
  );

/** A user's recent posts: "posts" (no replies or reposts), "reposts" (posts and reposts) or "replies" (posts and replies). */
const postsOf = () =>
  javascriptGenerator.provideFunction_(
    "blueskyUserPosts",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user, kind = "posts", count = 30) {
  const actor = ${actorOf()}(user);
  if (!actor) return [];
  const json = await ${publicApi()}("app.bsky.feed.getAuthorFeed", {
    actor,
    limit: Math.min(100, Math.max(1, Number(count) || 30)),
    filter: kind === "replies" ? "posts_with_replies" : "posts_no_replies"
  });
  return (json?.feed || [])
    .filter(item => kind === "reposts" || !item.reason)
    .filter(item => !(item.reason?.$type === "app.bsky.feed.defs#reasonPin"))
    .map(item => ${postShape()}(item.post, item.reason));
}`,
  );

const postOf = () =>
  javascriptGenerator.provideFunction_(
    "blueskyPost",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post) {
  const uri = await ${postUriOf()}(post);
  if (!uri) return null;
  const json = await ${publicApi()}("app.bsky.feed.getPosts", { uris: uri });
  return json?.posts?.[0] ? ${postShape()}(json.posts[0]) : null;
}`,
  );

const userOf = () =>
  javascriptGenerator.provideFunction_(
    "blueskyUser",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  const actor = ${actorOf()}(user);
  if (!actor) return null;
  const json = await ${publicApi()}("app.bsky.actor.getProfile", { actor });
  return json?.did ? ${userShape()}(json) : null;
}`,
  );

const KINDS = [
  ["post (no replies or reposts)", "posts"],
  ["post or repost", "reposts"],
  ["post or reply", "replies"],
];

/* ------------------------------------------------------------------ */
/* Posts (no login needed)                                              */
/* ------------------------------------------------------------------ */

Blockly.Blocks["bluesky_getPost"] = {
  init: function () {
    this.appendValueInput("post")
      .setCheck("String")
      .appendField("get Bluesky post (link):");
    thenBlock(
      this,
      'Looks up a public Bluesky post by its link, then runs the blocks inside. Use "get ... of Bluesky post" inside.',
    );
  },
};

javascriptGenerator.forBlock["bluesky_getPost"] = thenGenerator(
  "blueskyPostInformation",
  "Bluesky post",
  (block, generator) => `${postOf()}(${value(block, generator, "post")})`,
);

Blockly.Blocks["bluesky_getLatestPost"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("get latest")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind")
      .appendField("of Bluesky user:");
    thenBlock(this, "Gets a user's newest post, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["bluesky_getLatestPost"] = thenGenerator(
  "blueskyPostInformation",
  "Bluesky posts",
  (block, generator) =>
    `${postsOf()}(${value(block, generator, "user")}, "${block.getFieldValue("kind")}").then(async (posts) => posts[0])`,
);

Blockly.Blocks["bluesky_forEachPost"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("for each recent")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind")
      .appendField("of Bluesky user:");
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("max results (1-100):");
    loopBlock(this, "Runs the blocks inside once for each of a user's latest posts, newest first");
  },
};

javascriptGenerator.forBlock["bluesky_forEachPost"] = loopGenerator(
  "blueskyPostInformation",
  "Bluesky posts",
  (block, generator) =>
    `${postsOf()}(${value(block, generator, "user")}, "${block.getFieldValue("kind")}", ${value(block, generator, "count", "10")})`,
);

Blockly.Blocks["bluesky_onNewPost"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("when Bluesky user:");
    this.appendDummyInput()
      .appendField("posts a new")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind");
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    hatBlock(
      this,
      'Runs once for each new post from a user — great for post notifications. Use "get ... of Bluesky post" inside. The user is checked every few minutes (at least 1).',
    );
  },
};

javascriptGenerator.forBlock["bluesky_onNewPost"] = function (block, generator) {
  return newItemsCode({
    minutes: value(block, generator, "minutes", "5"),
    label: "Bluesky",
    list: `${postsOf()}(${value(block, generator, "user")}, "${block.getFieldValue("kind")}")`,
    variable: "blueskyPostInformation",
    code: generator.statementToCode(block, "code"),
  });
};

infoBlock(
  "bluesky_postInfo",
  "blueskyPostInformation",
  "Bluesky post",
  [
    ["text", "text"],
    ["link", "url"],
    ["author @handle", "authorHandle"],
    ["author display name", "authorName"],
    ["author link", "authorUrl"],
    ["author profile picture URL", "authorAvatarUrl"],
    ["likes", "likes"],
    ["reposts", "reposts"],
    ["replies", "replies"],
    ["quotes", "quotes"],
    ["post date", "createdAt"],
    ["image URLs (list)", "imageUrls"],
    ["video thumbnail URL", "videoThumbnailUrl"],
    ["link card URL", "linkUrl"],
    ["is a reply", "isReply"],
    ["is a repost", "isRepost"],
    ["reposted by @handle", "repostedBy"],
    ["language", "language"],
    ["post URI (at://)", "uri"],
  ],
);

/* ------------------------------------------------------------------ */
/* Users (no login needed)                                              */
/* ------------------------------------------------------------------ */

Blockly.Blocks["bluesky_getUser"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("get Bluesky user (@handle or link):");
    thenBlock(this, "Looks up a Bluesky profile, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["bluesky_getUser"] = thenGenerator(
  "blueskyUserInformation",
  "Bluesky user",
  (block, generator) => `${userOf()}(${value(block, generator, "user")})`,
);

infoBlock(
  "bluesky_userInfo",
  "blueskyUserInformation",
  "Bluesky user",
  [
    ["@handle", "handle"],
    ["display name", "name"],
    ["DID", "did"],
    ["bio", "description"],
    ["link", "url"],
    ["followers count", "followers"],
    ["following count", "following"],
    ["posts count", "posts"],
    ["profile picture URL", "avatarUrl"],
    ["banner image URL", "bannerUrl"],
    ["join date", "joinedAt"],
  ],
  "Information about the Bluesky user. Users from notifications have no counts (null).",
);

Blockly.Blocks["bluesky_followers"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("follower count of Bluesky user:");
    outputBlock(this, "Number", "How many followers a Bluesky account has");
  },
};

javascriptGenerator.forBlock["bluesky_followers"] = function (block, generator) {
  const user = value(block, generator, "user");
  return [
    `await ${userOf()}(${user}).then(async (user) => user?.followers ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["bluesky_userExists"] = {
  init: function () {
    this.appendValueInput("user").setCheck("String").appendField("Bluesky user:");
    this.appendDummyInput().appendField("exists?");
    this.setInputsInline(true);
    outputBlock(this, "Boolean", "Checks whether a Bluesky account exists");
  },
};

javascriptGenerator.forBlock["bluesky_userExists"] = function (block, generator) {
  const user = value(block, generator, "user");
  return [
    `await ${userOf()}(${user}).then(async (user) => !!user).catch(async () => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["bluesky_latestPostLink"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("link to latest")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind")
      .appendField("of Bluesky user:");
    outputBlock(this, "String", "The link to a user's newest post, or null");
  },
};

javascriptGenerator.forBlock["bluesky_latestPostLink"] = function (block, generator) {
  const user = value(block, generator, "user");
  const kind = block.getFieldValue("kind");
  return [
    `await ${postsOf()}(${user}, "${kind}", 10).then(async (posts) => posts[0]?.url ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* Logged in                                                            */
/* ------------------------------------------------------------------ */

/** Calls the logged-in account's server, refreshing the session when it expires. */
const api = () =>
  javascriptGenerator.provideFunction_(
    "blueskyApi",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(httpMethod, method, { query, body, blob, contentType } = {}) {
  const login = globalThis.blueskyLogin;
  if (!login) {
    console.error('Bluesky: use "log in to Bluesky" (in "when the bot is logged in") before using this block.');
    return null;
  }

  const startSession = async () => {
    if (!login.service) {
      login.service = "https://bsky.social";
      const did = login.identifier.startsWith("did:") ? login.identifier : (await ${publicApi()}("com.atproto.identity.resolveHandle", { handle: login.identifier.replace(/^@/, "") }))?.did;
      if (did?.startsWith("did:plc:")) {
        const doc = await fetch("https://plc.directory/" + did).then(async (res) => res.ok ? res.json() : null).catch(async () => null);
        const pds = doc?.service?.find(service => service.id === "#atproto_pds")?.serviceEndpoint;
        if (pds) login.service = pds;
      }
    }
    const res = await fetch(login.service + "/xrpc/com.atproto.server.createSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: login.identifier.replace(/^@/, ""), password: login.password })
    });
    const json = await res.json().catch(async () => null);
    if (!res.ok) {
      console.error("Bluesky login failed:", json?.message || res.status);
      return false;
    }
    Object.assign(login, { accessJwt: json.accessJwt, refreshJwt: json.refreshJwt, did: json.did, handle: json.handle });
    return true;
  };

  const refreshSession = async () => {
    const res = await fetch(login.service + "/xrpc/com.atproto.server.refreshSession", {
      method: "POST",
      headers: { Authorization: "Bearer " + login.refreshJwt }
    });
    const json = await res.json().catch(async () => null);
    if (!res.ok) return startSession();
    Object.assign(login, { accessJwt: json.accessJwt, refreshJwt: json.refreshJwt });
    return true;
  };

  if (!login.accessJwt && !(await startSession())) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(login.service + "/xrpc/" + method + (query ? "?" + new URLSearchParams(query) : ""), {
      method: httpMethod,
      headers: {
        Authorization: "Bearer " + login.accessJwt,
        ...(blob ? { "Content-Type": contentType || "application/octet-stream" } : body ? { "Content-Type": "application/json" } : {})
      },
      body: blob || (body ? JSON.stringify(body) : undefined)
    });
    const json = await res.json().catch(async () => ({}));

    if (attempt === 0 && (json?.error === "ExpiredToken" || res.status === 401)) {
      if (!(await refreshSession())) return null;
      continue;
    }
    if (!res.ok) {
      console.error("Bluesky error (" + res.status + "):", json?.message || json?.error || json);
      return null;
    }
    return json;
  }
  return null;
}`,
  );

/** Makes a post record with links, @mentions and #hashtags turned into rich text. */
const postRecord = () =>
  javascriptGenerator.provideFunction_(
    "blueskyPostRecord",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(text, imageUrl, altText) {
  text = String(text ?? "");
  const bytes = (index) => Buffer.byteLength(text.slice(0, index));
  const facets = [];

  for (const match of text.matchAll(/https?:\\/\\/[^\\s]+/g)) {
    const url = match[0].replace(/[.,;:!?)\\]]+$/, "");
    facets.push({ index: { byteStart: bytes(match.index), byteEnd: bytes(match.index + url.length) }, features: [{ $type: "app.bsky.richtext.facet#link", uri: url }] });
  }
  for (const match of text.matchAll(/(^|\\s)(@([a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)+))/g)) {
    const start = match.index + match[1].length;
    const did = (await ${publicApi()}("com.atproto.identity.resolveHandle", { handle: match[3] }))?.did;
    if (did) facets.push({ index: { byteStart: bytes(start), byteEnd: bytes(start + match[2].length) }, features: [{ $type: "app.bsky.richtext.facet#mention", did }] });
  }
  for (const match of text.matchAll(/(^|\\s)(#([^\\s#.,!?]+))/g)) {
    if (/^\\d+$/.test(match[3])) continue;
    const start = match.index + match[1].length;
    facets.push({ index: { byteStart: bytes(start), byteEnd: bytes(start + match[2].length) }, features: [{ $type: "app.bsky.richtext.facet#tag", tag: match[3] }] });
  }

  const record = { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString() };
  if (facets.length) record.facets = facets;

  const url = String(imageUrl ?? "").trim();
  if (url) {
    const res = await fetch(url).catch(async () => null);
    if (res?.ok) {
      const uploaded = await ${api()}("POST", "com.atproto.repo.uploadBlob", { blob: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") || "image/jpeg" });
      if (uploaded?.blob) record.embed = { $type: "app.bsky.embed.images", images: [{ alt: String(altText ?? ""), image: uploaded.blob }] };
    } else {
      console.error("Bluesky: couldn't download the image " + url);
    }
  }
  return record;
}`,
  );

/** Gets a post (as the logged-in account, so it knows whether it's liked or reposted). */
const myView = () =>
  javascriptGenerator.provideFunction_(
    "blueskyPostView",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post) {
  const uri = await ${postUriOf()}(post);
  if (!uri) return null;
  return (await ${api()}("GET", "app.bsky.feed.getPosts", { query: { uris: uri } }))?.posts?.[0] ?? null;
}`,
  );

/** Deletes a record by its at:// URI. */
const deleteRecord = () =>
  javascriptGenerator.provideFunction_(
    "blueskyDeleteRecord",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(uri) {
  const [, repo, collection, rkey] = String(uri).match(/^at:\\/\\/([^/]+)\\/([^/]+)\\/([^/]+)$/) || [];
  if (!rkey) return null;
  return ${api()}("POST", "com.atproto.repo.deleteRecord", { body: { repo, collection, rkey } });
}`,
  );

/** Creates a record in the logged-in account's repository. */
const createRecord = () =>
  javascriptGenerator.provideFunction_(
    "blueskyCreateRecord",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(collection, record) {
  if (!globalThis.blueskyLogin?.did && !(await ${api()}("GET", "com.atproto.server.getSession"))) return null;
  return ${api()}("POST", "com.atproto.repo.createRecord", { body: { repo: globalThis.blueskyLogin.did, collection, record: { $type: collection, createdAt: new Date().toISOString(), ...record } } });
}`,
  );

Blockly.Blocks["bluesky_login"] = {
  init: function () {
    this.appendDummyInput().appendField("log in to Bluesky");
    this.appendValueInput("handle").setCheck(null).appendField("handle:");
    this.appendValueInput("password").setCheck(null).appendField("app password:");
    statementBlock(
      this,
      'Lets the bot post and act as a Bluesky account. Make an app password in Bluesky (Settings → Privacy and security → App passwords) — never use your real password. Put this in "when the bot is logged in".',
    );
  },
};

javascriptGenerator.forBlock["bluesky_login"] = function (block, generator) {
  const handle = value(block, generator, "handle");
  const password = value(block, generator, "password");

  return `globalThis.blueskyLogin = { identifier: String(${handle} ?? "").trim(), password: String(${password} ?? "").trim() };
await ${api()}("GET", "com.atproto.server.getSession");\n`;
};

Blockly.Blocks["bluesky_createPost"] = {
  init: function () {
    this.appendValueInput("text").setCheck("String").appendField("post on Bluesky:");
    this.appendValueInput("image")
      .setCheck("String")
      .appendField("image URL (optional):");
    this.appendValueInput("alt")
      .setCheck("String")
      .appendField("image description (alt text):");
    this.appendValueInput("replyTo")
      .setCheck("String")
      .appendField("in reply to post link (optional):");
    thenBlock(
      this,
      'Posts on Bluesky (up to 300 characters; links, @mentions and #hashtags work), then runs the blocks inside. Inside, "get link of Bluesky post" is the new post\'s link.',
    );
  },
};

javascriptGenerator.forBlock["bluesky_createPost"] = function (block, generator) {
  const text = value(block, generator, "text");
  const image = value(block, generator, "image");
  const alt = value(block, generator, "alt");
  const replyTo = value(block, generator, "replyTo");
  const code = generator.statementToCode(block, "code");

  return `await (async () => {
  const record = await ${postRecord()}(${text}, ${image}, ${alt});
  const replyTo = String(${replyTo} ?? "").trim();
  if (replyTo) {
    const parent = await ${myView()}(replyTo);
    if (!parent) return;
    const root = parent.record?.reply?.root || { uri: parent.uri, cid: parent.cid };
    record.reply = { root, parent: { uri: parent.uri, cid: parent.cid } };
  }

  const created = await ${createRecord()}("app.bsky.feed.post", record);
  if (!created?.uri) return;

  const blueskyPostInformation = (await ${postOf()}(created.uri)) || { id: created.uri, uri: created.uri, cid: created.cid, text: record.text, url: "https://bsky.app/profile/" + globalThis.blueskyLogin.handle + "/post/" + created.uri.split("/").pop(), isReply: !!record.reply, isRepost: false, imageUrls: [] };
  ${code}})().catch(async (error) => console.error("Error posting on Bluesky:", error));\n`;
};

Blockly.Blocks["bluesky_postAction"] = {
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
      .appendField("Bluesky post (link):");
    statementBlock(
      this,
      'Likes, reposts or deletes a post as the account from "log in to Bluesky". You can only delete your own posts.',
    );
  },
};

javascriptGenerator.forBlock["bluesky_postAction"] = function (block, generator) {
  const post = value(block, generator, "post");
  const action = block.getFieldValue("action");

  const calls = {
    like: `${createRecord()}("app.bsky.feed.like", { subject: { uri: post.uri, cid: post.cid } })`,
    repost: `${createRecord()}("app.bsky.feed.repost", { subject: { uri: post.uri, cid: post.cid } })`,
    unlike: `(post.viewer?.like ? ${deleteRecord()}(post.viewer.like) : null)`,
    unrepost: `(post.viewer?.repost ? ${deleteRecord()}(post.viewer.repost) : null)`,
    delete: `${deleteRecord()}(post.uri)`,
  };

  return `await (async () => {
  const post = await ${myView()}(${post});
  if (!post) return;
  await ${calls[action]};
})().catch(async (error) => console.error("Error with Bluesky post:", error));\n`;
};

Blockly.Blocks["bluesky_followUser"] = {
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
      .appendField("Bluesky user:");
    statementBlock(this, 'Follows or unfollows a user as the account from "log in to Bluesky"');
  },
};

javascriptGenerator.forBlock["bluesky_followUser"] = function (block, generator) {
  const user = value(block, generator, "user");
  const follow = block.getFieldValue("action") === "follow";

  return `await (async () => {
  const profile = await ${api()}("GET", "app.bsky.actor.getProfile", { query: { actor: ${actorOf()}(${user}) } });
  if (!profile?.did) return;
  ${
    follow
      ? `if (!profile.viewer?.following) await ${createRecord()}("app.bsky.graph.follow", { subject: profile.did });`
      : `if (profile.viewer?.following) await ${deleteRecord()}(profile.viewer.following);`
  }
})().catch(async (error) => console.error("Error following Bluesky user:", error));\n`;
};

Blockly.Blocks["bluesky_searchPosts"] = {
  init: function () {
    this.appendValueInput("query")
      .setCheck("String")
      .appendField("for each Bluesky post found searching:");
    this.appendDummyInput()
      .appendField("sorted by")
      .appendField(
        new Blockly.FieldDropdown([
          ["newest", "latest"],
          ["top", "top"],
        ]),
        "sort",
      );
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("max results (1-100):");
    loopBlock(
      this,
      'Searches Bluesky posts (supports "from:handle" and #hashtags), then runs the blocks inside once for each. Needs "log in to Bluesky".',
    );
  },
};

javascriptGenerator.forBlock["bluesky_searchPosts"] = loopGenerator(
  "blueskyPostInformation",
  "Bluesky search",
  (block, generator) => {
    const query = value(block, generator, "query");
    const count = value(block, generator, "count", "10");
    const sort = block.getFieldValue("sort");

    return `${api()}("GET", "app.bsky.feed.searchPosts", { query: { q: String(${query}), sort: "${sort}", limit: Math.min(100, Math.max(1, Number(${count}) || 10)) } }).then(async (json) => (json?.posts || []).map(post => ${postShape()}(post)))`;
  },
);

Blockly.Blocks["bluesky_onNotification"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when someone")
      .appendField(
        new Blockly.FieldDropdown([
          ["mentions", "mention"],
          ["replies to", "reply"],
          ["quotes", "quote"],
          ["follows", "follow"],
          ["likes a post of", "like"],
          ["reposts a post of", "repost"],
        ]),
        "reason",
      )
      .appendField("my Bluesky account");
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    hatBlock(
      this,
      'Runs once for each new notification of that kind. Inside, "get ... of Bluesky user" is who did it, and "get ... of Bluesky post" is their post (mentions, replies, quotes) or your post they liked or reposted. Needs "log in to Bluesky".',
    );
  },
};

javascriptGenerator.forBlock["bluesky_onNotification"] = function (block, generator) {
  const reason = block.getFieldValue("reason");
  const code = generator.statementToCode(block, "code");
  const postUri =
    reason === "like" || reason === "repost"
      ? "notification.reasonSubject"
      : "notification.uri";

  return newItemsCode({
    minutes: value(block, generator, "minutes", "5"),
    label: "Bluesky",
    list: `${api()}("GET", "app.bsky.notification.listNotifications", { query: { limit: 50, reasons: "${reason}" } }).then(async (json) => (json?.notifications || []).filter(notification => notification.reason === "${reason}").map(notification => ({ ...notification, id: notification.uri })))`,
    variable: "notification",
    code: `const blueskyUserInformation = ${userShape()}(notification.author || {});
      const blueskyPostInformation = ${
        reason === "follow"
          ? "null"
          : `await ${api()}("GET", "app.bsky.feed.getPosts", { query: { uris: ${postUri} } }).then(async (json) => json?.posts?.[0] ? ${postShape()}(json.posts[0]) : null)`
      };
      ${code}`,
  });
};

/* ------------------------------------------------------------------ */
/* Where the info blocks can go                                         */
/* ------------------------------------------------------------------ */

createRestrictions(
  ["bluesky_postInfo"],
  [
    {
      type: "hasParent",
      blockTypes: [
        "bluesky_getPost",
        "bluesky_getLatestPost",
        "bluesky_forEachPost",
        "bluesky_onNewPost",
        "bluesky_createPost",
        "bluesky_searchPosts",
        "bluesky_onNotification",
      ],
      message:
        'This block must be inside a "get Bluesky post", "for each ... Bluesky post", "when Bluesky user posts" or "when someone ... my Bluesky account" block.',
    },
  ],
);

createRestrictions(
  ["bluesky_userInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["bluesky_getUser", "bluesky_onNotification"],
      message:
        'This block must be inside a "get Bluesky user" or "when someone ... my Bluesky account" block.',
    },
  ],
);
