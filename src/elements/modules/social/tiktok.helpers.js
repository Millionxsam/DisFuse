/* Generated from the block editor's tiktok blocks: the helper functions
   their code uses, each emitted once at the top of the bot. */

export const HELPERS = {
  /* TikTok's only public, keyless API is oEmbed, which can tell whether a
   profile exists and its display name. Those blocks sit above the "log
   in" line in the toolbox.

   Everything else uses TikTok's official APIs (open.tiktokapis.com) with
   an app from developers.tiktok.com: the Display API reads the logged-in
   account's profile and videos, and the Content Posting API uploads
   videos. The app's client key and secret plus a refresh token (from
   authorizing the app once with Login Kit) let the bot get fresh access
   tokens by itself, since those only last 24 hours. 

/** Turns "@name", "name" or a profile link into a username. */
  tiktokUsername: {
    key: "tiktokUsername",
    code: `function tiktokUsername(user) {
  const text = String(user ?? "").trim();
  const match = text.match(/tiktok\\.com\\/@([^/?#]+)/i);
  return (match ? match[1] : text.replace(/^@/, "")).split(/[/?#]/)[0];
}`,
  },
  /* Turns a video link (including short vm.tiktok.com links) or ID into the video ID. */
  tiktokVideoId: {
    key: "tiktokVideoId",
    code: `async function tiktokVideoId(video) {
  let text = String(video ?? "").trim();
  if (/^\\d+$/.test(text)) return text;

  if (/^(https?:\\/\\/)?(vm|vt)\\.tiktok\\.com\\//i.test(text) || /tiktok\\.com\\/t\\//i.test(text)) {
    const url = /^https?:/i.test(text) ? text : "https://" + text;
    text = await fetch(url, { redirect: "follow" }).then(async (res) => res.url).catch(async () => text);
  }

  return (text.match(/\\/(?:video|photo|v)\\/(\\d+)/) || [])[1] ?? null;
}`,
  },
  /* Reads TikTok's public oEmbed for a profile. */
  tiktokProfileEmbed: {
    key: "tiktokProfileEmbed",
    code: `async function tiktokProfileEmbed(user) {
  const username = tiktokUsername(user);
  if (!username) return null;
  const res = await fetch("https://www.tiktok.com/oembed?url=" + encodeURIComponent("https://www.tiktok.com/@" + username), {
    headers: { "User-Agent": "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)" }
  });
  return res.ok ? res.json().catch(async () => null) : null;
}`,
  },
  /* ------------------------------------------------------------------ 
/* No login needed                                                      
/* ------------------------------------------------------------------ 

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

/* ------------------------------------------------------------------ 
/* With a TikTok app                                                    
/* ------------------------------------------------------------------ 

/** Gets (and caches) an access token from the refresh token. */
  tiktokToken: {
    key: "tiktokToken",
    code: `async function tiktokToken() {
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
  },
  /* Calls TikTok's official API. Returns the response's "data". */
  tiktokApi: {
    key: "tiktokApi",
    code: `async function tiktokApi(method, path, { query, body } = {}) {
  if (!globalThis.tiktokLogin) {
    console.error('TikTok: use "log in to TikTok" (in "when the bot is logged in") before using this block.');
    return null;
  }
  const accessToken = await tiktokToken();
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
  },
  /* Turns a Display API video into the shape the video info block reads. */
  tiktokVideoShape: {
    key: "tiktokVideoShape",
    code: `function tiktokVideoShape(video) {
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
  },
  /* The logged-in account's latest videos, newest first. */
  tiktokVideos: {
    key: "tiktokVideos",
    code: `async function tiktokVideos(count = 20) {
  const data = await tiktokApi("POST", "video/list/", { query: { fields: "id,title,video_description,duration,cover_image_url,share_url,embed_link,create_time,like_count,comment_count,share_count,view_count" }, body: { max_count: Math.min(20, Math.max(1, Number(count) || 20)) } });
  return (data?.videos || []).map(tiktokVideoShape);
}`,
  },
  tiktokAccount: {
    key: "tiktokAccount",
    code: `async function tiktokAccount() {
  const data = await tiktokApi("GET", "user/info/", { query: { fields: "open_id,avatar_url,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,username,follower_count,following_count,likes_count,video_count" } });
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
  },
};

/** Every helper, for a step's `setup` (unused ones are harmless but are left out by the caller). */
export const ALL_HELPERS = Object.values(HELPERS);
