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

const colour = "#EE1D52";
const { thenBlock, loopBlock, hatBlock, statementBlock, outputBlock, infoBlock } =
  appBlocks(colour);

/* TikTok's only public, keyless API is oEmbed, which can tell whether a
   profile exists and its display name. Those blocks sit above the "log
   in" line in the toolbox.

   Everything else uses TikTok's official APIs (open.tiktokapis.com) with
   an app from developers.tiktok.com: the Display API reads the logged-in
   account's profile and videos, and the Content Posting API uploads
   videos. The app's client key and secret plus a refresh token (from
   authorizing the app once with Login Kit) let the bot get fresh access
   tokens by itself, since those only last 24 hours. */

/** Turns "@name", "name" or a profile link into a username. */
const usernameOf = () =>
  javascriptGenerator.provideFunction_(
    "tiktokUsername",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  const text = String(user ?? "").trim();
  const match = text.match(/tiktok\\.com\\/@([^/?#]+)/i);
  return (match ? match[1] : text.replace(/^@/, "")).split(/[/?#]/)[0];
}`,
  );

/** Turns a video link (including short vm.tiktok.com links) or ID into the video ID. */
const videoIdOf = () =>
  javascriptGenerator.provideFunction_(
    "tiktokVideoId",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(video) {
  let text = String(video ?? "").trim();
  if (/^\\d+$/.test(text)) return text;

  if (/^(https?:\\/\\/)?(vm|vt)\\.tiktok\\.com\\//i.test(text) || /tiktok\\.com\\/t\\//i.test(text)) {
    const url = /^https?:/i.test(text) ? text : "https://" + text;
    text = await fetch(url, { redirect: "follow" }).then(async (res) => res.url).catch(async () => text);
  }

  return (text.match(/\\/(?:video|photo|v)\\/(\\d+)/) || [])[1] ?? null;
}`,
  );

/** Reads TikTok's public oEmbed for a profile. */
const profileEmbed = () =>
  javascriptGenerator.provideFunction_(
    "tiktokProfileEmbed",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(user) {
  const username = ${usernameOf()}(user);
  if (!username) return null;
  const res = await fetch("https://www.tiktok.com/oembed?url=" + encodeURIComponent("https://www.tiktok.com/@" + username), {
    headers: { "User-Agent": "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)" }
  });
  return res.ok ? res.json().catch(async () => null) : null;
}`,
  );

/* ------------------------------------------------------------------ */
/* No login needed                                                      */
/* ------------------------------------------------------------------ */

Blockly.Blocks["tiktok_userExists"] = {
  init: function () {
    this.appendValueInput("user").setCheck("String").appendField("TikTok user:");
    this.appendDummyInput().appendField("exists?");
    this.setInputsInline(true);
    outputBlock(this, "Boolean", "Checks whether a public TikTok account exists");
  },
};

javascriptGenerator.forBlock["tiktok_userExists"] = function (block, generator) {
  const user = value(block, generator, "user");
  return [
    `await ${profileEmbed()}(${user}).then(async (embed) => !!embed?.author_url).catch(async () => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["tiktok_displayName"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("display name of TikTok user:");
    outputBlock(this, "String", "The display name of a public TikTok account, or null");
  },
};

javascriptGenerator.forBlock["tiktok_displayName"] = function (block, generator) {
  const user = value(block, generator, "user");
  return [
    `await ${profileEmbed()}(${user}).then(async (embed) => embed?.author_name ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["tiktok_profileLink"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("link to TikTok profile:");
    outputBlock(this, "String", 'The profile link for a username, like "https://www.tiktok.com/@tiktok"');
  },
};

javascriptGenerator.forBlock["tiktok_profileLink"] = function (block, generator) {
  const user = value(block, generator, "user");
  return [`("https://www.tiktok.com/@" + ${usernameOf()}(${user}))`, Order.ATOMIC];
};

Blockly.Blocks["tiktok_videoId"] = {
  init: function () {
    this.appendValueInput("video")
      .setCheck("String")
      .appendField("video ID from TikTok link:");
    outputBlock(this, "String", "Gets the video ID out of a TikTok link (short vm.tiktok.com links work too)");
  },
};

javascriptGenerator.forBlock["tiktok_videoId"] = function (block, generator) {
  const video = value(block, generator, "video");
  return [`await ${videoIdOf()}(${video}).catch(async () => null)`, Order.AWAIT];
};

/* ------------------------------------------------------------------ */
/* With a TikTok app                                                    */
/* ------------------------------------------------------------------ */

/** Gets (and caches) an access token from the refresh token. */
const token = () =>
  javascriptGenerator.provideFunction_(
    "tiktokToken",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  const login = globalThis.tiktokLogin;
  if (!login) return null;
  if (login.token && login.expires > Date.now()) return login.token;

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: login.clientKey, client_secret: login.clientSecret, grant_type: "refresh_token", refresh_token: login.refreshToken })
  });
  const json = await res.json().catch(async () => null);
  if (!res.ok || !json?.access_token) {
    console.error("TikTok login failed (" + res.status + "):", json?.error_description || json?.error || json);
    return null;
  }

  login.token = json.access_token;
  login.expires = Date.now() + ((json.expires_in || 86400) - 60) * 1000;
  if (json.refresh_token) login.refreshToken = json.refresh_token;
  return login.token;
}`,
  );

/** Calls TikTok's official API. Returns the response's "data". */
const api = () =>
  javascriptGenerator.provideFunction_(
    "tiktokApi",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(method, path, { query, body } = {}) {
  if (!globalThis.tiktokLogin) {
    console.error('TikTok: use "log in to TikTok" (in "when the bot is logged in") before using this block.');
    return null;
  }
  const accessToken = await ${token()}();
  if (!accessToken) return null;

  const res = await fetch("https://open.tiktokapis.com/v2/" + path + (query ? "?" + new URLSearchParams(query) : ""), {
    method,
    headers: { Authorization: "Bearer " + accessToken, ...(body ? { "Content-Type": "application/json; charset=UTF-8" } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(async () => null);
  if (!res.ok || (json?.error?.code && json.error.code !== "ok")) {
    console.error("TikTok API error (" + res.status + "):", json?.error?.message || json?.error?.code || json);
    return null;
  }
  return json?.data ?? {};
}`,
  );

const VIDEO_FIELDS =
  "id,title,video_description,duration,cover_image_url,share_url,embed_link,create_time,like_count,comment_count,share_count,view_count";

/** Turns a Display API video into the shape the video info block reads. */
const videoShape = () =>
  javascriptGenerator.provideFunction_(
    "tiktokVideoShape",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(video) {
  return {
    id: video.id,
    title: video.title ?? "",
    description: video.video_description ?? "",
    url: video.share_url ?? null,
    embedUrl: video.embed_link ?? null,
    coverUrl: video.cover_image_url ?? null,
    lengthSeconds: video.duration ?? null,
    createdAt: video.create_time ? new Date(video.create_time * 1000) : null,
    views: video.view_count ?? null,
    likes: video.like_count ?? null,
    comments: video.comment_count ?? null,
    shares: video.share_count ?? null
  };
}`,
  );

/** The logged-in account's latest videos, newest first. */
const videosOf = () =>
  javascriptGenerator.provideFunction_(
    "tiktokVideos",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(count = 20) {
  const data = await ${api()}("POST", "video/list/", { query: { fields: "${VIDEO_FIELDS}" }, body: { max_count: Math.min(20, Math.max(1, Number(count) || 20)) } });
  return (data?.videos || []).map(${videoShape()});
}`,
  );

const accountOf = () =>
  javascriptGenerator.provideFunction_(
    "tiktokAccount",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}() {
  const data = await ${api()}("GET", "user/info/", { query: { fields: "open_id,avatar_url,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,username,follower_count,following_count,likes_count,video_count" } });
  const user = data?.user;
  if (!user) return null;
  return {
    id: user.open_id,
    username: user.username ?? null,
    name: user.display_name ?? null,
    bio: user.bio_description ?? "",
    url: user.username ? "https://www.tiktok.com/@" + user.username : user.profile_deep_link ?? null,
    avatarUrl: user.avatar_large_url || user.avatar_url || null,
    isVerified: !!user.is_verified,
    followers: user.follower_count ?? null,
    following: user.following_count ?? null,
    likes: user.likes_count ?? null,
    videos: user.video_count ?? null
  };
}`,
  );

Blockly.Blocks["tiktok_login"] = {
  init: function () {
    this.appendDummyInput().appendField("log in to TikTok");
    this.appendValueInput("clientKey").setCheck(null).appendField("app client key:");
    this.appendValueInput("clientSecret")
      .setCheck(null)
      .appendField("app client secret:");
    this.appendValueInput("refreshToken")
      .setCheck(null)
      .appendField("refresh token:");
    statementBlock(
      this,
      'Lets the TikTok blocks use your account. Make an app at developers.tiktok.com with Login Kit (and Content Posting to upload), authorize it once to get a refresh token, and save all three as secrets. Put this in "when the bot is logged in".',
    );
  },
};

javascriptGenerator.forBlock["tiktok_login"] = function (block, generator) {
  const field = (name) => `String(${value(block, generator, name)} ?? "").trim()`;

  return `globalThis.tiktokLogin = { clientKey: ${field("clientKey")}, clientSecret: ${field("clientSecret")}, refreshToken: ${field("refreshToken")} };
await ${token()}();\n`;
};

Blockly.Blocks["tiktok_getAccount"] = {
  init: function () {
    this.appendDummyInput().appendField("get my TikTok account");
    thenBlock(
      this,
      'Gets the account from "log in to TikTok", then runs the blocks inside. Use "get ... of TikTok account" inside.',
    );
  },
};

javascriptGenerator.forBlock["tiktok_getAccount"] = thenGenerator(
  "tiktokAccountInformation",
  "TikTok account",
  () => `${accountOf()}()`,
);

infoBlock(
  "tiktok_accountInfo",
  "tiktokAccountInformation",
  "TikTok account",
  [
    ["@username", "username"],
    ["display name", "name"],
    ["bio", "bio"],
    ["link", "url"],
    ["profile picture URL", "avatarUrl"],
    ["is verified", "isVerified"],
    ["followers count", "followers"],
    ["following count", "following"],
    ["total likes", "likes"],
    ["video count", "videos"],
    ["open ID", "id"],
  ],
  "Information about your TikTok account. Some info needs the matching scope on your app (user.info.profile, user.info.stats); missing info is null.",
);

Blockly.Blocks["tiktok_followers"] = {
  init: function () {
    this.appendDummyInput().appendField("my TikTok follower count");
    outputBlock(this, "Number", 'How many followers the account from "log in to TikTok" has');
  },
};

javascriptGenerator.forBlock["tiktok_followers"] = function () {
  return [
    `await ${accountOf()}().then(async (account) => account?.followers ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["tiktok_getLatestVideo"] = {
  init: function () {
    this.appendDummyInput().appendField("get my latest TikTok video");
    thenBlock(this, "Gets your newest public video, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["tiktok_getLatestVideo"] = thenGenerator(
  "tiktokVideoInformation",
  "TikTok videos",
  () => `${videosOf()}(1).then(async (videos) => videos[0])`,
);

Blockly.Blocks["tiktok_forEachVideo"] = {
  init: function () {
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("for each of my recent TikTok videos, max (1-20):");
    loopBlock(this, "Runs the blocks inside once for each of your latest public videos, newest first");
  },
};

javascriptGenerator.forBlock["tiktok_forEachVideo"] = loopGenerator(
  "tiktokVideoInformation",
  "TikTok videos",
  (block, generator) => `${videosOf()}(${value(block, generator, "count", "10")})`,
);

Blockly.Blocks["tiktok_getVideo"] = {
  init: function () {
    this.appendValueInput("video")
      .setCheck("String")
      .appendField("get my TikTok video (link or ID):");
    thenBlock(this, "Looks up one of your videos (with its views, likes and more), then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["tiktok_getVideo"] = thenGenerator(
  "tiktokVideoInformation",
  "TikTok video",
  (block, generator) =>
    `${videoIdOf()}(${value(block, generator, "video")}).then(async (id) => {
  if (!id) return null;
  const data = await ${api()}("POST", "video/query/", { query: { fields: "${VIDEO_FIELDS}" }, body: { filters: { video_ids: [id] } } });
  return data?.videos?.[0] ? ${videoShape()}(data.videos[0]) : null;
})`,
);

Blockly.Blocks["tiktok_onNewVideo"] = {
  init: function () {
    this.appendDummyInput().appendField("when I post on TikTok");
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    hatBlock(
      this,
      'Runs once for each new public video on your account — great for sharing your TikToks in Discord. Use "get ... of TikTok video" inside. Needs "log in to TikTok".',
    );
  },
};

javascriptGenerator.forBlock["tiktok_onNewVideo"] = function (block, generator) {
  return newItemsCode({
    minutes: value(block, generator, "minutes", "5"),
    label: "TikTok",
    list: `${videosOf()}(20)`,
    variable: "tiktokVideoInformation",
    code: generator.statementToCode(block, "code"),
  });
};

infoBlock(
  "tiktok_videoInfo",
  "tiktokVideoInformation",
  "TikTok video",
  [
    ["title", "title"],
    ["description", "description"],
    ["link", "url"],
    ["video ID", "id"],
    ["embed link", "embedUrl"],
    ["cover image URL", "coverUrl"],
    ["length in seconds", "lengthSeconds"],
    ["post date", "createdAt"],
    ["views", "views"],
    ["likes", "likes"],
    ["comments", "comments"],
    ["shares", "shares"],
  ],
);

Blockly.Blocks["tiktok_uploadVideo"] = {
  init: function () {
    this.appendValueInput("url")
      .setCheck("String")
      .appendField("upload video to TikTok from URL:");
    this.appendDummyInput()
      .appendField("as")
      .appendField(
        new Blockly.FieldDropdown([
          ["a draft in my TikTok inbox", "inbox"],
          ["a post visible to only me", "SELF_ONLY"],
          ["a post visible to friends", "MUTUAL_FOLLOW_FRIENDS"],
          ["a post visible to followers", "FOLLOWER_OF_CREATOR"],
          ["a public post", "PUBLIC_TO_EVERYONE"],
        ]),
        "mode",
      );
    this.appendValueInput("caption")
      .setCheck("String")
      .appendField("caption (posts only):");
    statementBlock(
      this,
      'Uploads an MP4 video from a URL. Drafts show up in your TikTok app\'s inbox to finish there (needs the video.upload scope). Posting directly needs the video.publish scope, and until TikTok audits your app, only "only me" posts are allowed.',
    );
  },
};

javascriptGenerator.forBlock["tiktok_uploadVideo"] = function (block, generator) {
  const url = value(block, generator, "url");
  const caption = value(block, generator, "caption");
  const mode = block.getFieldValue("mode");

  const init =
    mode === "inbox"
      ? `${api()}("POST", "post/publish/inbox/video/init/", { body: { source_info: source } })`
      : `${api()}("POST", "post/publish/video/init/", { body: { post_info: { title: String(${caption} ?? ""), privacy_level: "${mode}" }, source_info: source } })`;

  return `await (async () => {
  const video = await fetch(String(${url} ?? "").trim()).then(async (res) => res.ok ? Buffer.from(await res.arrayBuffer()) : null).catch(async () => null);
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
};

/* ------------------------------------------------------------------ */
/* Where the info blocks can go                                         */
/* ------------------------------------------------------------------ */

createRestrictions(
  ["tiktok_accountInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["tiktok_getAccount"],
      message: 'This block must be inside a "get my TikTok account" block.',
    },
  ],
);

createRestrictions(
  ["tiktok_videoInfo"],
  [
    {
      type: "hasParent",
      blockTypes: [
        "tiktok_getLatestVideo",
        "tiktok_forEachVideo",
        "tiktok_getVideo",
        "tiktok_onNewVideo",
      ],
      message:
        'This block must be inside a "get my TikTok video", "for each of my TikTok videos" or "when I post on TikTok" block.',
    },
  ],
);
