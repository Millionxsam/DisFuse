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

const colour = "#E1306C";
const { thenBlock, loopBlock, hatBlock, statementBlock, outputBlock, infoBlock } =
  appBlocks(colour);

/* Instagram has no public API for reading profiles or posts without an
   account, so every Instagram block uses the official Instagram API
   (graph.instagram.com) with an access token for a professional
   (Business or Creator) account. Get one by making an app at
   developers.facebook.com, adding "Instagram API with Instagram Login",
   and generating a token for your account. Tokens last 60 days; the bot
   refreshes its copy every day while it is running.

   The API works on the logged-in account: its profile, its posts, the
   comments on them, and publishing new photos, reels and stories. */

/** Calls the Instagram API with the token from "log in to Instagram". */
const api = () =>
  javascriptGenerator.provideFunction_(
    "instagramApi",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(method, path, params = {}) {
  const login = globalThis.instagramLogin;
  if (!login?.token) {
    console.error('Instagram: use "log in to Instagram" (in "when the bot is logged in") before using Instagram blocks.');
    return null;
  }

  const query = new URLSearchParams({ access_token: login.token });
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.append(key, String(value));
  }

  const res = await fetch("https://graph.instagram.com/" + path + "?" + query, { method });
  const json = await res.json().catch(async () => null);
  if (!res.ok || json?.error) {
    console.error("Instagram API error (" + res.status + "):", json?.error?.message || json);
    return null;
  }
  return json;
}`,
  );

/** Turns a post ID or link into the media ID (links only work for the logged-in account's posts). */
const mediaIdOf = () =>
  javascriptGenerator.provideFunction_(
    "instagramMediaId",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post) {
  const text = String(post ?? "").trim();
  if (/^\\d+$/.test(text)) return text;
  const shortcode = (text.match(/instagram\\.com\\/(?:[^/]+\\/)?(?:p|reel|reels|tv)\\/([A-Za-z0-9_-]+)/) || [])[1];
  if (!shortcode) return null;

  let path = "me/media";
  let params = { fields: "id,shortcode,permalink", limit: 100 };
  for (let page = 0; page < 5 && path; page++) {
    const json = await ${api()}("GET", path, params);
    const found = (json?.data || []).find(item => item.shortcode === shortcode || String(item.permalink).includes("/" + shortcode));
    if (found) return found.id;
    const next = json?.paging?.cursors?.after;
    params = next && json?.paging?.next ? { ...params, after: next } : null;
    if (!params) path = null;
  }
  console.error("Instagram: couldn't find that post on your account. Use the post's ID instead.");
  return null;
}`,
  );

const POST_FIELDS =
  "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,shortcode,timestamp,like_count,comments_count,username";

/** Turns an Instagram media object into the shape the post info block reads. */
const postShape = () =>
  javascriptGenerator.provideFunction_(
    "instagramPostShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post) {
  const type = post.media_product_type === "REELS" ? "reel"
    : post.media_product_type === "STORY" ? "story"
    : ({ IMAGE: "photo", VIDEO: "video", CAROUSEL_ALBUM: "carousel" })[post.media_type] || String(post.media_type || "").toLowerCase();

  return {
    id: post.id,
    caption: post.caption ?? "",
    type,
    url: post.permalink ?? null,
    shortcode: post.shortcode ?? null,
    mediaUrl: post.media_url ?? null,
    thumbnailUrl: post.thumbnail_url || post.media_url || null,
    createdAt: post.timestamp ? new Date(post.timestamp) : null,
    likes: post.like_count ?? null,
    comments: post.comments_count ?? null,
    username: post.username ?? null
  };
}`,
  );

/** The logged-in account's latest posts, newest first. */
const postsOf = () =>
  javascriptGenerator.provideFunction_(
    "instagramPosts",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(count = 25) {
  const json = await ${api()}("GET", "me/media", { fields: "${POST_FIELDS}", limit: Math.min(100, Math.max(1, Number(count) || 25)) });
  return (json?.data || []).map(${postShape()});
}`,
  );

const postOf = () =>
  javascriptGenerator.provideFunction_(
    "instagramPost",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(post) {
  const id = await ${mediaIdOf()}(post);
  if (!id) return null;
  const json = await ${api()}("GET", id, { fields: "${POST_FIELDS}" });
  return json ? ${postShape()}(json) : null;
}`,
  );

const accountOf = () =>
  javascriptGenerator.provideFunction_(
    "instagramAccount",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  const json = await ${api()}("GET", "me", { fields: "id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography,website" });
  if (!json) return null;
  return {
    id: json.user_id ?? json.id,
    username: json.username,
    name: json.name ?? null,
    bio: json.biography ?? "",
    website: json.website || null,
    url: "https://www.instagram.com/" + json.username + "/",
    avatarUrl: json.profile_picture_url ?? null,
    followers: json.followers_count ?? null,
    following: json.follows_count ?? null,
    posts: json.media_count ?? null,
    accountType: json.account_type ?? null
  };
}`,
  );

Blockly.Blocks["instagram_login"] = {
  init: function () {
    this.appendValueInput("token")
      .setCheck(null)
      .appendField("log in to Instagram with access token:");
    statementBlock(
      this,
      'Lets the Instagram blocks use your professional account. Make an app at developers.facebook.com with "Instagram API with Instagram Login" and generate an access token. Put this in "when the bot is logged in".',
    );
  },
};

javascriptGenerator.forBlock["instagram_login"] = function (block, generator) {
  const token = value(block, generator, "token");

  return `globalThis.instagramLogin = { token: String(${token} ?? "").trim() };
if (!globalThis.instagramRefresh) {
  globalThis.instagramRefresh = setInterval(async () => {
    const login = globalThis.instagramLogin;
    if (!login?.token) return;
    const json = await fetch("https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=" + encodeURIComponent(login.token))
      .then(async (res) => res.ok ? res.json() : null)
      .catch(async () => null);
    if (json?.access_token) login.token = json.access_token;
  }, 24 * 60 * 60 * 1000);
}\n`;
};

/* ------------------------------------------------------------------ */
/* Account                                                              */
/* ------------------------------------------------------------------ */

Blockly.Blocks["instagram_getAccount"] = {
  init: function () {
    this.appendDummyInput().appendField("get my Instagram account");
    thenBlock(
      this,
      'Gets the account from "log in to Instagram", then runs the blocks inside. Use "get ... of Instagram account" inside.',
    );
  },
};

javascriptGenerator.forBlock["instagram_getAccount"] = thenGenerator(
  "instagramAccountInformation",
  "Instagram account",
  () => `${accountOf()}()`,
);

infoBlock(
  "instagram_accountInfo",
  "instagramAccountInformation",
  "Instagram account",
  [
    ["username", "username"],
    ["name", "name"],
    ["user ID", "id"],
    ["bio", "bio"],
    ["website", "website"],
    ["link", "url"],
    ["profile picture URL", "avatarUrl"],
    ["followers count", "followers"],
    ["following count", "following"],
    ["posts count", "posts"],
    ["account type", "accountType"],
  ],
);

Blockly.Blocks["instagram_followers"] = {
  init: function () {
    this.appendDummyInput().appendField("my Instagram follower count");
    outputBlock(this, "Number", 'How many followers the account from "log in to Instagram" has');
  },
};

javascriptGenerator.forBlock["instagram_followers"] = function () {
  return [
    `await ${accountOf()}().then(async (account) => account?.followers ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* Posts                                                                */
/* ------------------------------------------------------------------ */

Blockly.Blocks["instagram_getLatestPost"] = {
  init: function () {
    this.appendDummyInput().appendField("get my latest Instagram post");
    thenBlock(this, "Gets your newest post, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["instagram_getLatestPost"] = thenGenerator(
  "instagramPostInformation",
  "Instagram posts",
  () => `${postsOf()}(1).then(async (posts) => posts[0])`,
);

Blockly.Blocks["instagram_forEachPost"] = {
  init: function () {
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("for each of my recent Instagram posts, max (1-100):");
    loopBlock(this, "Runs the blocks inside once for each of your latest posts, newest first");
  },
};

javascriptGenerator.forBlock["instagram_forEachPost"] = loopGenerator(
  "instagramPostInformation",
  "Instagram posts",
  (block, generator) => `${postsOf()}(${value(block, generator, "count", "10")})`,
);

Blockly.Blocks["instagram_getPost"] = {
  init: function () {
    this.appendValueInput("post")
      .setCheck(null)
      .appendField("get my Instagram post (link or ID):");
    thenBlock(this, "Looks up one of your posts by its link or ID, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["instagram_getPost"] = thenGenerator(
  "instagramPostInformation",
  "Instagram post",
  (block, generator) => `${postOf()}(${value(block, generator, "post")})`,
);

Blockly.Blocks["instagram_onNewPost"] = {
  init: function () {
    this.appendDummyInput().appendField("when I post on Instagram");
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    hatBlock(
      this,
      'Runs once for each new post on your account — great for sharing your posts in Discord. Use "get ... of Instagram post" inside. Needs "log in to Instagram".',
    );
  },
};

javascriptGenerator.forBlock["instagram_onNewPost"] = function (block, generator) {
  return newItemsCode({
    minutes: value(block, generator, "minutes", "5"),
    label: "Instagram",
    list: `${postsOf()}(25)`,
    variable: "instagramPostInformation",
    code: generator.statementToCode(block, "code"),
  });
};

infoBlock(
  "instagram_postInfo",
  "instagramPostInformation",
  "Instagram post",
  [
    ["caption", "caption"],
    ["link", "url"],
    ["post ID", "id"],
    ["type (photo, video, reel, carousel)", "type"],
    ["image or video URL", "mediaUrl"],
    ["thumbnail image URL", "thumbnailUrl"],
    ["post date", "createdAt"],
    ["likes", "likes"],
    ["comments count", "comments"],
    ["username", "username"],
    ["shortcode", "shortcode"],
  ],
);

Blockly.Blocks["instagram_publish"] = {
  init: function () {
    this.appendValueInput("url")
      .setCheck("String")
      .appendField("post")
      .appendField(
        new Blockly.FieldDropdown([
          ["photo", "IMAGE"],
          ["reel", "REELS"],
          ["photo story", "STORY_IMAGE"],
          ["video story", "STORY_VIDEO"],
        ]),
        "kind",
      )
      .appendField("on Instagram from URL:");
    this.appendValueInput("caption")
      .setCheck("String")
      .appendField("caption:");
    thenBlock(
      this,
      'Publishes a photo (JPEG), reel or story (MP4) from a public URL to your account, then runs the blocks inside. Use "get ... of Instagram post" inside. Stories have no caption. Videos can take a minute to process.',
    );
  },
};

javascriptGenerator.forBlock["instagram_publish"] = function (block, generator) {
  const url = value(block, generator, "url");
  const caption = value(block, generator, "caption");
  const kind = block.getFieldValue("kind");
  const code = generator.statementToCode(block, "code");

  const isVideo = kind === "REELS" || kind === "STORY_VIDEO";
  const params = {
    IMAGE: `{ image_url: url, caption }`,
    REELS: `{ video_url: url, media_type: "REELS", caption }`,
    STORY_IMAGE: `{ image_url: url, media_type: "STORIES" }`,
    STORY_VIDEO: `{ video_url: url, media_type: "STORIES" }`,
  }[kind];

  return `await (async () => {
  const url = String(${url} ?? "").trim();
  const caption = String(${caption} ?? "");
  const container = await ${api()}("POST", "me/media", ${params});
  if (!container?.id) return;

  for (let attempt = 0; attempt < ${isVideo ? 60 : 12}; attempt++) {
    const status = await ${api()}("GET", container.id, { fields: "status_code" });
    if (status?.status_code === "FINISHED") break;
    if (status?.status_code === "ERROR" || status?.status_code === "EXPIRED") {
      console.error("Instagram couldn't process that ${isVideo ? "video" : "image"}. Check the URL is public and the file is a supported format.");
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const published = await ${api()}("POST", "me/media_publish", { creation_id: container.id });
  if (!published?.id) return;

  const instagramPostInformation = (await ${postOf()}(published.id)) || { id: published.id, caption, type: "${kind === "IMAGE" ? "photo" : kind === "REELS" ? "reel" : "story"}" };
  ${code}})().catch(async (error) => console.error("Error posting on Instagram:", error));\n`;
};

/* ------------------------------------------------------------------ */
/* Comments                                                             */
/* ------------------------------------------------------------------ */

Blockly.Blocks["instagram_forEachComment"] = {
  init: function () {
    this.appendValueInput("post")
      .setCheck(null)
      .appendField("for each comment on my Instagram post (link or ID):");
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("max comments (1-50):");
    loopBlock(
      this,
      'Runs the blocks inside once for each comment on one of your posts. Use "get ... of Instagram comment" inside.',
    );
  },
};

javascriptGenerator.forBlock["instagram_forEachComment"] = loopGenerator(
  "instagramCommentInformation",
  "Instagram comments",
  (block, generator) => {
    const post = value(block, generator, "post");
    const count = value(block, generator, "count", "10");

    return `${mediaIdOf()}(${post}).then(async (id) => {
  if (!id) return [];
  const json = await ${api()}("GET", id + "/comments", { fields: "id,text,username,timestamp,like_count,hidden", limit: Math.min(50, Math.max(1, Number(${count}) || 10)) });
  return (json?.data || []).map(comment => ({
    id: comment.id,
    text: comment.text ?? "",
    username: comment.username ?? null,
    likes: comment.like_count ?? 0,
    createdAt: comment.timestamp ? new Date(comment.timestamp) : null,
    isHidden: !!comment.hidden,
    postId: id
  }));
})`;
  },
);

infoBlock(
  "instagram_commentInfo",
  "instagramCommentInformation",
  "Instagram comment",
  [
    ["text", "text"],
    ["username", "username"],
    ["comment ID", "id"],
    ["likes", "likes"],
    ["date", "createdAt"],
    ["is hidden", "isHidden"],
    ["post ID", "postId"],
  ],
);

Blockly.Blocks["instagram_comment"] = {
  init: function () {
    this.appendValueInput("text")
      .setCheck("String")
      .appendField("comment on Instagram:");
    this.appendValueInput("target")
      .setCheck(null)
      .appendField("on")
      .appendField(
        new Blockly.FieldDropdown([
          ["my post (link or ID)", "post"],
          ["reply to comment (ID)", "comment"],
        ]),
        "kind",
      );
    statementBlock(this, "Comments on one of your posts, or replies to a comment on one");
  },
};

javascriptGenerator.forBlock["instagram_comment"] = function (block, generator) {
  const text = value(block, generator, "text");
  const target = value(block, generator, "target");
  const kind = block.getFieldValue("kind");

  const id =
    kind === "post"
      ? `await ${mediaIdOf()}(${target})`
      : `String(${target} ?? "").trim()`;

  return `await (async () => {
  const id = ${id};
  if (!id) return;
  await ${api()}("POST", id + "/${kind === "post" ? "comments" : "replies"}", { message: String(${text}) });
})().catch(async (error) => console.error("Error commenting on Instagram:", error));\n`;
};

Blockly.Blocks["instagram_commentAction"] = {
  init: function () {
    this.appendValueInput("comment")
      .setCheck(null)
      .appendField(
        new Blockly.FieldDropdown([
          ["hide", "hide"],
          ["unhide", "unhide"],
          ["delete", "delete"],
        ]),
        "action",
      )
      .appendField("Instagram comment (ID):");
    statementBlock(this, "Hides, unhides or deletes a comment on one of your posts");
  },
};

javascriptGenerator.forBlock["instagram_commentAction"] = function (block, generator) {
  const comment = value(block, generator, "comment");
  const action = block.getFieldValue("action");

  const call =
    action === "delete"
      ? `${api()}("DELETE", id)`
      : `${api()}("POST", id, { hide: ${action === "hide"} })`;

  return `await (async () => {
  const id = String(${comment} ?? "").trim();
  if (!id) return;
  await ${call};
})().catch(async (error) => console.error("Error changing Instagram comment:", error));\n`;
};

/* ------------------------------------------------------------------ */
/* Where the info blocks can go                                         */
/* ------------------------------------------------------------------ */

createRestrictions(
  ["instagram_accountInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["instagram_getAccount"],
      message: 'This block must be inside a "get my Instagram account" block.',
    },
  ],
);

createRestrictions(
  ["instagram_postInfo"],
  [
    {
      type: "hasParent",
      blockTypes: [
        "instagram_getLatestPost",
        "instagram_forEachPost",
        "instagram_getPost",
        "instagram_onNewPost",
        "instagram_publish",
      ],
      message:
        'This block must be inside a "get my Instagram post", "for each of my Instagram posts", "when I post on Instagram" or "post on Instagram" block.',
    },
  ],
);

createRestrictions(
  ["instagram_commentInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["instagram_forEachComment"],
      message: 'This block must be inside a "for each comment on my Instagram post" block.',
    },
  ],
);
