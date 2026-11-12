import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../lib/restrictions";

const colour = "#FF0000";

/* Everything above the "API key" line in the toolbox works without any
   key or account. It reads YouTube's public RSS feeds (the latest 15
   uploads of a channel or playlist), its oEmbed endpoint, and the public
   video and channel pages.

   A few things — search, comments and exact statistics — are only
   available through the YouTube Data API, which needs a free API key
   from Google Cloud. Those blocks take a key input that the toolbox
   fills with a "get secret YOUTUBE_API_KEY" block. */

const HEADERS = `{ "User-Agent": "Mozilla/5.0 (compatible; DisFuse-Bot)", "Accept-Language": "en-US,en;q=0.9", Cookie: "SOCS=CAI; CONSENT=YES+1" }`;

/** Turns a video link (watch, youtu.be, Shorts, live, embed) or ID into the video ID. */
const videoIdOf = () =>
  javascriptGenerator.provideFunction_(
    "youtubeVideoId",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(video) {
  const text = String(video ?? "").trim();
  const match = text.match(/(?:v=|youtu\\.be\\/|\\/shorts\\/|\\/live\\/|\\/embed\\/|\\/v\\/)([A-Za-z0-9_-]{11})/);
  if (match) return match[1];
  return /^[A-Za-z0-9_-]{11}$/.test(text) ? text : null;
}`,
  );

/** Turns a channel ID, @handle or channel link into the channel ID (UC...). */
const channelIdOf = () =>
  javascriptGenerator.provideFunction_(
    "youtubeChannelId",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  const text = String(channel ?? "").trim();
  const direct = text.match(/(?:^|\\/channel\\/)(UC[A-Za-z0-9_-]{22})/);
  if (direct) return direct[1];
  if (!text) return null;

  globalThis.youtubeChannelIdCache ??= new Map();
  if (globalThis.youtubeChannelIdCache.has(text)) return globalThis.youtubeChannelIdCache.get(text);

  let url = text;
  if (!/^https?:\\/\\//i.test(url)) {
    url = /^(www\\.|m\\.)?youtube\\.com\\//i.test(url)
      ? "https://" + url
      : "https://www.youtube.com/" + (url.startsWith("@") ? url : "@" + url);
  }

  const html = await fetch(url, { headers: ${HEADERS} }).then(async (res) => res.ok ? res.text() : "").catch(async () => "");
  const id = (html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/) || html.match(/<link rel="canonical" href="https:\\/\\/www\\.youtube\\.com\\/channel\\/(UC[A-Za-z0-9_-]{22})"/) || [])[1] || null;
  if (id) globalThis.youtubeChannelIdCache.set(text, id);
  return id;
}`,
  );

/** Reads a channel's or playlist's RSS feed: its latest 15 videos, newest first. */
const feedOf = () =>
  javascriptGenerator.provideFunction_(
    "youtubeFeed",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(query) {
  const xml = await fetch("https://www.youtube.com/feeds/videos.xml?" + query, { headers: ${HEADERS} })
    .then(async (res) => res.ok ? res.text() : "")
    .catch(async () => "");

  const decode = (value) => String(value ?? "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  const tag = (source, name) => decode((source.match(new RegExp("<" + name + "(?:\\\\s[^>]*)?>([\\\\s\\\\S]*?)</" + name + ">")) || [])[1]);
  const attr = (source, name, attribute) => decode((source.match(new RegExp("<" + name + "\\\\s[^>]*" + attribute + '="([^"]*)"')) || [])[1]);

  return (xml.match(/<entry>[\\s\\S]*?<\\/entry>/g) || []).map(entry => {
    const id = tag(entry, "yt:videoId");
    const url = attr(entry, "link", "href") || "https://www.youtube.com/watch?v=" + id;
    const channelId = tag(entry, "yt:channelId");
    const author = entry.match(/<author>([\\s\\S]*?)<\\/author>/)?.[1] || "";

    return {
      id,
      title: tag(entry, "title"),
      description: tag(entry, "media:description"),
      url,
      isShort: url.includes("/shorts/"),
      channelName: tag(author, "name"),
      channelId,
      channelUrl: tag(author, "uri") || "https://www.youtube.com/channel/" + channelId,
      publishedAt: new Date(tag(entry, "published")),
      updatedAt: new Date(tag(entry, "updated")),
      views: Number(attr(entry, "media:statistics", "views")) || 0,
      likes: Number(attr(entry, "media:starRating", "count")) || 0,
      thumbnailUrl: attr(entry, "media:thumbnail", "url") || "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg",
      lengthSeconds: null,
      keywords: [],
      category: null,
      isLive: false
    };
  });
}`,
  );

/** The latest uploads of a channel, optionally only videos or only Shorts. */
const uploadsOf = () =>
  javascriptGenerator.provideFunction_(
    "youtubeUploads",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel, kind = "any") {
  const channelId = await ${channelIdOf()}(channel);
  if (!channelId) return [];
  const videos = await ${feedOf()}("channel_id=" + channelId);
  if (kind === "video") return videos.filter(video => !video.isShort);
  if (kind === "short") return videos.filter(video => video.isShort);
  return videos;
}`,
  );

/** Reads a public video page. Falls back to oEmbed (title, channel, thumbnail) if the page can't be read. */
const videoOf = () =>
  javascriptGenerator.provideFunction_(
    "youtubeVideo",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(video) {
  const id = ${videoIdOf()}(video);
  if (!id) return null;

  const html = await fetch("https://www.youtube.com/watch?v=" + id + "&hl=en", { headers: ${HEADERS} })
    .then(async (res) => res.ok ? res.text() : "")
    .catch(async () => "");

  let player = null;
  const start = html.indexOf("ytInitialPlayerResponse = ");
  if (start !== -1) {
    const from = start + "ytInitialPlayerResponse = ".length;
    const end = html.indexOf(";</script>", from);
    try { player = JSON.parse(html.slice(from, end === -1 ? undefined : end).replace(/;\\s*var\\s+meta[\\s\\S]*$/, "")); } catch {}
  }

  const details = player?.videoDetails;
  const micro = player?.microformat?.playerMicroformatRenderer;

  if (!details) {
    const oembed = await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id))
      .then(async (res) => res.ok ? res.json() : null)
      .catch(async () => null);
    if (!oembed) return null;

    return {
      id,
      title: oembed.title,
      description: null,
      url: "https://www.youtube.com/watch?v=" + id,
      isShort: false,
      channelName: oembed.author_name,
      channelId: null,
      channelUrl: oembed.author_url,
      publishedAt: null,
      updatedAt: null,
      views: null,
      likes: null,
      thumbnailUrl: oembed.thumbnail_url,
      lengthSeconds: null,
      keywords: [],
      category: null,
      isLive: false
    };
  }

  const thumbnails = details.thumbnail?.thumbnails || [];

  return {
    id,
    title: details.title,
    description: details.shortDescription || "",
    url: "https://www.youtube.com/watch?v=" + id,
    isShort: html.includes('"/shorts/' + id + '"') || html.includes("youtube.com/shorts/" + id),
    channelName: details.author,
    channelId: details.channelId,
    channelUrl: "https://www.youtube.com/channel/" + details.channelId,
    publishedAt: micro?.publishDate ? new Date(micro.publishDate) : null,
    updatedAt: null,
    views: Number(details.viewCount) || 0,
    likes: null,
    thumbnailUrl: thumbnails[thumbnails.length - 1]?.url || "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg",
    lengthSeconds: Number(details.lengthSeconds) || 0,
    keywords: details.keywords || [],
    category: micro?.category || null,
    isLive: details.isLive === true
  };
}`,
  );

/** Reads a public channel page and its feed. */
const channelOf = () =>
  javascriptGenerator.provideFunction_(
    "youtubeChannel",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  const id = await ${channelIdOf()}(channel);
  if (!id) return null;

  const [html, xml] = await Promise.all([
    fetch("https://www.youtube.com/channel/" + id + "?hl=en", { headers: ${HEADERS} }).then(async (res) => res.ok ? res.text() : "").catch(async () => ""),
    fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + id).then(async (res) => res.ok ? res.text() : "").catch(async () => "")
  ]);

  if (!html && !xml) return null;

  const decode = (value) => value == null ? null : String(value)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  const meta = (property) => decode((html.match(new RegExp('<meta (?:property|name)="' + property + '" content="([^"]*)"')) || [])[1]);
  const handle = (html.match(/"vanityChannelUrl":"https?:\\/\\/www\\.youtube\\.com\\/(@[^"]+)"/) || html.match(/"canonicalBaseUrl":"\\/(@[^"]+)"/) || [])[1] || null;
  const subscribers = (html.match(/"content":"([0-9.,]+[KMB]?) subscribers?"/) || html.match(/"subscriberCountText":\\{[^}]*?"simpleText":"([0-9.,]+[KMB]?) subscribers?"/) || [])[1] || null;
  const videos = (html.match(/"content":"([0-9.,]+[KMB]?) videos?"/) || html.match(/"videosCountText":\\{"runs":\\[\\{"text":"([0-9.,]+[KMB]?)"/) || [])[1] || null;
  const banner = (html.match(/"banner":\\{"imageBannerViewModel":\\{"image":\\{"sources":\\[\\{"url":"([^"]+)"/) || html.match(/"banner":\\{"thumbnails":\\[\\{"url":"([^"]+)"/) || [])[1] || null;
  const feedName = decode((xml.match(/<author>\\s*<name>([\\s\\S]*?)<\\/name>/) || [])[1]);
  const created = (xml.match(/<\\/author>\\s*<published>([^<]+)<\\/published>/) || [])[1];

  const toNumber = (value) => {
    if (!value) return null;
    const multiplier = { K: 1e3, M: 1e6, B: 1e9 }[value.slice(-1)] || 1;
    return Math.round(parseFloat(value.replace(/,/g, "")) * multiplier);
  };

  return {
    id,
    name: meta("og:title") || feedName,
    handle,
    description: meta("og:description") || "",
    url: "https://www.youtube.com/channel/" + id,
    avatarUrl: meta("og:image"),
    bannerUrl: banner ? banner.replace(/\\\\u0026/g, "&") : null,
    subscribersText: subscribers,
    subscribers: toNumber(subscribers),
    videosText: videos,
    videos: toNumber(videos),
    createdAt: created ? new Date(created) : null,
    isFamilySafe: html.includes('"isFamilySafe":true')
  };
}`,
  );

/** The video a channel is streaming right now, or null. */
const liveOf = () =>
  javascriptGenerator.provideFunction_(
    "youtubeLiveVideo",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(channel) {
  const id = await ${channelIdOf()}(channel);
  if (!id) return null;

  const html = await fetch("https://www.youtube.com/channel/" + id + "/live?hl=en", { headers: ${HEADERS} })
    .then(async (res) => res.ok ? res.text() : "")
    .catch(async () => "");

  /* The /live page only shows a video while the channel is streaming;
     otherwise it is the channel's home page, which has no video info. */
  const primary = html.indexOf('"videoPrimaryInfoRenderer"');
  if (primary === -1) return null;

  const videoId = (html.match(/"videoDetails":\\{"videoId":"([A-Za-z0-9_-]{11})"/) || html.match(/"likeEndpoint":\\{"status":"LIKE","target":\\{"videoId":"([A-Za-z0-9_-]{11})"/) || html.match(/<link rel="canonical" href="https:\\/\\/www\\.youtube\\.com\\/watch\\?v=([A-Za-z0-9_-]{11})"/) || [])[1];
  const live = /"videoViewCountRenderer":\\{[^{}]*(?:\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}[^{}]*)*"isLive":true/.test(html.slice(primary, primary + 5000));
  if (!videoId || !live) return null;

  const video = await ${videoOf()}(videoId);
  return video ? { ...video, isLive: true } : null;
}`,
  );

/** Calls the YouTube Data API v3 with an API key. */
const apiRequest = () =>
  javascriptGenerator.provideFunction_(
    "youtubeApi",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(path, params, key) {
  const query = new URLSearchParams({ ...params, key: String(key ?? "") });
  const res = await fetch("https://www.googleapis.com/youtube/v3/" + path + "?" + query);
  if (!res.ok) {
    console.error("YouTube API error (" + res.status + "):", await res.text().catch(async () => ""));
    return null;
  }
  return res.json();
}`,
  );

/** Turns a Data API video resource into the same shape the other blocks use. */
const apiVideo = () =>
  javascriptGenerator.provideFunction_(
    "youtubeApiVideo",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(item) {
  const id = typeof item.id === "string" ? item.id : item.id?.videoId;
  const snippet = item.snippet || {};
  const thumbnails = snippet.thumbnails || {};
  const duration = item.contentDetails?.duration?.match(/P(?:(\\d+)D)?T?(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?/);

  return {
    id,
    title: snippet.title,
    description: snippet.description,
    url: "https://www.youtube.com/watch?v=" + id,
    isShort: false,
    channelName: snippet.channelTitle,
    channelId: snippet.channelId,
    channelUrl: "https://www.youtube.com/channel/" + snippet.channelId,
    publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
    updatedAt: null,
    views: item.statistics ? Number(item.statistics.viewCount) || 0 : null,
    likes: item.statistics ? Number(item.statistics.likeCount) || 0 : null,
    thumbnailUrl: (thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default || {}).url || "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg",
    lengthSeconds: duration ? (Number(duration[1] || 0) * 86400 + Number(duration[2] || 0) * 3600 + Number(duration[3] || 0) * 60 + Number(duration[4] || 0)) : null,
    keywords: snippet.tags || [],
    category: null,
    isLive: snippet.liveBroadcastContent === "live"
  };
}`,
  );

/** Runs a callback every few minutes, or every time something new shows up. */
const watch = () =>
  javascriptGenerator.provideFunction_(
    "youtubeWatch",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(minutes, check) {
  const every = Math.max(1, Number(minutes) || 5) * 60 * 1000;
  const run = async () => {
    try { await check(); } catch (error) { console.error("Error checking YouTube:", error); }
  };
  setTimeout(run, 5000);
  setInterval(run, every);
}`,
  );

const value = (block, generator, name, fallback = "''") =>
  generator.valueToCode(block, name, Order.NONE) || fallback;

const KINDS = [
  ["upload (video or Short)", "any"],
  ["video (not a Short)", "video"],
  ["Short", "short"],
];

/** Common shape for a statement block with a "then" section. */
function thenBlock(block, tooltip) {
  block.appendStatementInput("code").appendField("then").setCheck("default");
  block.setPreviousStatement(true, "default");
  block.setNextStatement(true, "default");
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/** Common shape for a "when..." block. */
function hatBlock(block, tooltip) {
  block.appendStatementInput("code").setCheck("default");
  block.setInputsInline(false);
  block.setPreviousStatement(false);
  block.setNextStatement(false);
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/** Common shape for a plain statement block. */
function statementBlock(block, tooltip) {
  block.setPreviousStatement(true, "default");
  block.setNextStatement(true, "default");
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/** Common shape for a reporter block. */
function outputBlock(block, output, tooltip) {
  block.setOutput(true, output);
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/** Adds an "API key:" input to a block. */
function appendKey(block) {
  block.appendValueInput("key").setCheck(null).appendField("with API key:");
}

/* ------------------------------------------------------------------ */
/* Videos                                                               */
/* ------------------------------------------------------------------ */

Blockly.Blocks["youtube_getVideo"] = {
  init: function () {
    this.appendValueInput("video")
      .setCheck("String")
      .appendField("get YouTube video (link or ID):");
    thenBlock(
      this,
      "Looks up a public YouTube video by its link or ID, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["youtube_getVideo"] = function (block, generator) {
  const video = value(block, generator, "video");
  const code = generator.statementToCode(block, "code");

  return `await ${videoOf()}(${video})
  .then(async (youtubeVideoInformation) => {
    if (!youtubeVideoInformation) return;

    ${code}})
  .catch(async (error) => console.error("Error fetching YouTube video:", error));\n`;
};

Blockly.Blocks["youtube_videoInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["title", "title"],
          ["description", "description"],
          ["link", "url"],
          ["video ID", "id"],
          ["channel name", "channelName"],
          ["channel ID", "channelId"],
          ["channel link", "channelUrl"],
          ["views", "views"],
          ["likes", "likes"],
          ["upload date", "publishedAt"],
          ["length in seconds", "lengthSeconds"],
          ["thumbnail image URL", "thumbnailUrl"],
          ["is a Short", "isShort"],
          ["is live right now", "isLive"],
          ["category", "category"],
          ["tags (list)", "keywords"],
        ]),
        "info",
      )
      .appendField("of YouTube video");
    outputBlock(
      this,
      null,
      "Information about the YouTube video you got. Videos from a channel's uploads have likes but no length or tags; videos you get by link have length and tags but no likes. Missing info is null.",
    );
  },
};

javascriptGenerator.forBlock["youtube_videoInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`youtubeVideoInformation.${info}`, Order.MEMBER];
};

Blockly.Blocks["youtube_getLatestVideo"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("get latest")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind")
      .appendField("of YouTube channel:");
    thenBlock(
      this,
      "Gets the newest upload of a channel (by @handle, link or channel ID), then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["youtube_getLatestVideo"] = function (
  block,
  generator,
) {
  const channel = value(block, generator, "channel");
  const kind = block.getFieldValue("kind");
  const code = generator.statementToCode(block, "code");

  return `await ${uploadsOf()}(${channel}, "${kind}")
  .then(async (videos) => {
    const youtubeVideoInformation = videos[0];
    if (!youtubeVideoInformation) return;

    ${code}})
  .catch(async (error) => console.error("Error fetching YouTube uploads:", error));\n`;
};

Blockly.Blocks["youtube_forEachVideo"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("for each recent")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind")
      .appendField("of YouTube channel:");
    this.appendStatementInput("code").appendField("do").setCheck("default");
    statementBlock(
      this,
      "Runs the blocks inside once for each of the channel's latest uploads (up to 15), newest first",
    );
  },
};

javascriptGenerator.forBlock["youtube_forEachVideo"] = function (
  block,
  generator,
) {
  const channel = value(block, generator, "channel");
  const kind = block.getFieldValue("kind");
  const code = generator.statementToCode(block, "code");

  return `for (const youtubeVideoInformation of await ${uploadsOf()}(${channel}, "${kind}").catch(async (error) => { console.error("Error fetching YouTube uploads:", error); return []; })) {
  ${code}}\n`;
};

Blockly.Blocks["youtube_forEachPlaylistVideo"] = {
  init: function () {
    this.appendValueInput("playlist")
      .setCheck("String")
      .appendField("for each video in YouTube playlist (link or ID):");
    this.appendStatementInput("code").appendField("do").setCheck("default");
    statementBlock(
      this,
      "Runs the blocks inside once for each video in a public playlist (the first 15)",
    );
  },
};

javascriptGenerator.forBlock["youtube_forEachPlaylistVideo"] = function (
  block,
  generator,
) {
  const playlist = value(block, generator, "playlist");
  const code = generator.statementToCode(block, "code");

  return `for (const youtubeVideoInformation of await ${feedOf()}("playlist_id=" + encodeURIComponent((String(${playlist}).match(/[?&]list=([A-Za-z0-9_-]+)/) || [])[1] || String(${playlist}).trim())).catch(async (error) => { console.error("Error fetching YouTube playlist:", error); return []; })) {
  ${code}}\n`;
};

Blockly.Blocks["youtube_onNewVideo"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("when YouTube channel:");
    this.appendDummyInput()
      .appendField("posts a new")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind");
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    hatBlock(
      this,
      'Runs when a channel uploads something new — great for upload notifications. Use "get ... of YouTube video" inside it. The channel is checked every few minutes (at least 1), so it may take that long to notice.',
    );
  },
};

javascriptGenerator.forBlock["youtube_onNewVideo"] = function (block, generator) {
  const channel = value(block, generator, "channel");
  const minutes = value(block, generator, "minutes", "5");
  const kind = block.getFieldValue("kind");
  const code = generator.statementToCode(block, "code");

  return `(() => {
  let seenVideos = null;
  ${watch()}(${minutes}, async () => {
    const videos = await ${uploadsOf()}(${channel}, "${kind}");
    if (!videos.length) return;

    if (!seenVideos) {
      seenVideos = new Set(videos.map(video => video.id));
      return;
    }

    for (const youtubeVideoInformation of videos.filter(video => !seenVideos.has(video.id)).reverse()) {
      seenVideos.add(youtubeVideoInformation.id);
      ${code}}
  });
})();\n`;
};

Blockly.Blocks["youtube_onLive"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("when YouTube channel:");
    this.appendDummyInput().appendField("goes live");
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    hatBlock(
      this,
      'Runs when a channel starts a livestream. Use "get ... of YouTube video" inside it for the stream\'s title, link and thumbnail. The channel is checked every few minutes (at least 1).',
    );
  },
};

javascriptGenerator.forBlock["youtube_onLive"] = function (block, generator) {
  const channel = value(block, generator, "channel");
  const minutes = value(block, generator, "minutes", "5");
  const code = generator.statementToCode(block, "code");

  return `(() => {
  let lastLiveVideo;
  ${watch()}(${minutes}, async () => {
    const youtubeVideoInformation = await ${liveOf()}(${channel});
    const liveId = youtubeVideoInformation?.id ?? null;

    if (lastLiveVideo === undefined) {
      lastLiveVideo = liveId;
      return;
    }

    if (!liveId || liveId === lastLiveVideo) {
      lastLiveVideo = liveId;
      return;
    }

    lastLiveVideo = liveId;
    ${code}});
})();\n`;
};

/* ------------------------------------------------------------------ */
/* Channels                                                             */
/* ------------------------------------------------------------------ */

Blockly.Blocks["youtube_getChannel"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("get YouTube channel (@handle, link or ID):");
    thenBlock(
      this,
      "Looks up a YouTube channel, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["youtube_getChannel"] = function (
  block,
  generator,
) {
  const channel = value(block, generator, "channel");
  const code = generator.statementToCode(block, "code");

  return `await ${channelOf()}(${channel})
  .then(async (youtubeChannelInformation) => {
    if (!youtubeChannelInformation) return;

    ${code}})
  .catch(async (error) => console.error("Error fetching YouTube channel:", error));\n`;
};

Blockly.Blocks["youtube_channelInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["@handle", "handle"],
          ["description", "description"],
          ["channel ID", "id"],
          ["link", "url"],
          ["subscribers (rounded number)", "subscribers"],
          ['subscribers (text like "1.2M")', "subscribersText"],
          ["video count (number)", "videos"],
          ["video count (text)", "videosText"],
          ["creation date", "createdAt"],
          ["profile picture URL", "avatarUrl"],
          ["banner image URL", "bannerUrl"],
          ["is family safe", "isFamilySafe"],
        ]),
        "info",
      )
      .appendField("of YouTube channel");
    outputBlock(
      this,
      null,
      "Information about the YouTube channel you got. YouTube rounds public subscriber counts (like 1.23M).",
    );
  },
};

javascriptGenerator.forBlock["youtube_channelInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`youtubeChannelInformation.${info}`, Order.MEMBER];
};

/* ------------------------------------------------------------------ */
/* Quick info                                                           */
/* ------------------------------------------------------------------ */

Blockly.Blocks["youtube_isLive"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("YouTube channel:");
    this.appendDummyInput().appendField("is live right now?");
    this.setInputsInline(true);
    outputBlock(this, "Boolean", "Checks whether a channel is livestreaming");
  },
};

javascriptGenerator.forBlock["youtube_isLive"] = function (block, generator) {
  const channel = value(block, generator, "channel");
  return [
    `await ${liveOf()}(${channel}).then(async (video) => !!video).catch(async () => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["youtube_videoExists"] = {
  init: function () {
    this.appendValueInput("video")
      .setCheck("String")
      .appendField("YouTube video (link or ID):");
    this.appendDummyInput().appendField("exists?");
    this.setInputsInline(true);
    outputBlock(
      this,
      "Boolean",
      "Checks whether a link or ID points to a public (or unlisted) YouTube video",
    );
  },
};

javascriptGenerator.forBlock["youtube_videoExists"] = function (
  block,
  generator,
) {
  const video = value(block, generator, "video");
  return [
    `await (async () => {
      const id = ${videoIdOf()}(${video});
      if (!id) return false;
      return fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id)).then(async (res) => res.ok).catch(async () => false);
    })()`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["youtube_videoId"] = {
  init: function () {
    this.appendValueInput("video")
      .setCheck("String")
      .appendField("video ID from YouTube link:");
    outputBlock(
      this,
      "String",
      "Takes the 11-character video ID out of any YouTube link (watch, youtu.be, Shorts, live). Null if there isn't one.",
    );
  },
};

javascriptGenerator.forBlock["youtube_videoId"] = function (block, generator) {
  const video = value(block, generator, "video");
  return [`${videoIdOf()}(${video})`, Order.FUNCTION_CALL];
};

Blockly.Blocks["youtube_thumbnail"] = {
  init: function () {
    this.appendValueInput("video")
      .setCheck("String")
      .appendField("YouTube")
      .appendField(
        new Blockly.FieldDropdown([
          ["high quality (480x360)", "hqdefault"],
          ["max quality (1280x720)", "maxresdefault"],
          ["medium quality (320x180)", "mqdefault"],
          ["standard quality (640x480)", "sddefault"],
        ]),
        "quality",
      )
      .appendField("thumbnail of video (link or ID):");
    outputBlock(
      this,
      "String",
      "A link to a video's thumbnail image, great inside embeds. Not every video has a max quality thumbnail.",
    );
  },
};

javascriptGenerator.forBlock["youtube_thumbnail"] = function (block, generator) {
  const video = value(block, generator, "video");
  const quality = block.getFieldValue("quality");
  return [
    `"https://i.ytimg.com/vi/" + ${videoIdOf()}(${video}) + "/${quality}.jpg"`,
    Order.ADDITION,
  ];
};

Blockly.Blocks["youtube_channelId"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("channel ID of YouTube channel (@handle or link):");
    outputBlock(
      this,
      "String",
      'The channel ID (starting with "UC") of a channel, or null if it doesn\'t exist',
    );
  },
};

javascriptGenerator.forBlock["youtube_channelId"] = function (block, generator) {
  const channel = value(block, generator, "channel");
  return [
    `await ${channelIdOf()}(${channel}).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["youtube_subscribers"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("subscriber count of YouTube channel:");
    outputBlock(
      this,
      "String",
      'The channel\'s public subscriber count as YouTube shows it, like "1.23M"',
    );
  },
};

javascriptGenerator.forBlock["youtube_subscribers"] = function (
  block,
  generator,
) {
  const channel = value(block, generator, "channel");
  return [
    `await ${channelOf()}(${channel}).then(async (channel) => channel?.subscribersText ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["youtube_latestVideoLink"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("link to latest")
      .appendField(new Blockly.FieldDropdown(KINDS), "kind")
      .appendField("of YouTube channel:");
    outputBlock(
      this,
      "String",
      "A link to a channel's newest upload, or null if it has none",
    );
  },
};

javascriptGenerator.forBlock["youtube_latestVideoLink"] = function (
  block,
  generator,
) {
  const channel = value(block, generator, "channel");
  const kind = block.getFieldValue("kind");
  return [
    `await ${uploadsOf()}(${channel}, "${kind}").then(async (videos) => videos[0]?.url ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* With an API key                                                      */
/* ------------------------------------------------------------------ */

Blockly.Blocks["youtube_apiSearch"] = {
  init: function () {
    this.appendValueInput("query")
      .setCheck("String")
      .appendField("for each YouTube video found searching:");
    this.appendDummyInput()
      .appendField("sorted by")
      .appendField(
        new Blockly.FieldDropdown([
          ["relevance", "relevance"],
          ["upload date", "date"],
          ["view count", "viewCount"],
          ["rating", "rating"],
        ]),
        "order",
      );
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("max results (1-50):");
    this.setInputsInline(false);
    appendKey(this);
    this.appendStatementInput("code").appendField("do").setCheck("default");
    statementBlock(
      this,
      'Searches YouTube for videos and runs the blocks inside once per result. Use "get ... of YouTube video" inside it. Needs a YouTube Data API key.',
    );
  },
};

javascriptGenerator.forBlock["youtube_apiSearch"] = function (block, generator) {
  const query = value(block, generator, "query");
  const count = value(block, generator, "count", "5");
  const key = value(block, generator, "key");
  const order = block.getFieldValue("order");
  const code = generator.statementToCode(block, "code");

  return `for (const youtubeVideoInformation of ((await ${apiRequest()}("search", { part: "snippet", type: "video", order: "${order}", q: String(${query}), maxResults: String(Math.min(50, Math.max(1, Number(${count}) || 5))) }, ${key}).catch(async (error) => console.error("Error searching YouTube:", error)))?.items ?? []).map(${apiVideo()})) {
  ${code}}\n`;
};

Blockly.Blocks["youtube_apiVideoStat"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("exact")
      .appendField(
        new Blockly.FieldDropdown([
          ["views", "viewCount"],
          ["likes", "likeCount"],
          ["comments", "commentCount"],
        ]),
        "stat",
      );
    this.appendValueInput("video")
      .setCheck("String")
      .appendField("of YouTube video (link or ID):");
    appendKey(this);
    outputBlock(
      this,
      "Number",
      "An exact statistic of a video from the YouTube Data API. Needs an API key.",
    );
  },
};

javascriptGenerator.forBlock["youtube_apiVideoStat"] = function (
  block,
  generator,
) {
  const video = value(block, generator, "video");
  const key = value(block, generator, "key");
  const stat = block.getFieldValue("stat");

  return [
    `await ${apiRequest()}("videos", { part: "statistics", id: String(${videoIdOf()}(${video})) }, ${key}).then(async (json) => json?.items?.[0] ? Number(json.items[0].statistics.${stat}) || 0 : null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["youtube_apiChannelStat"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("exact")
      .appendField(
        new Blockly.FieldDropdown([
          ["subscribers", "subscriberCount"],
          ["total views", "viewCount"],
          ["video count", "videoCount"],
        ]),
        "stat",
      );
    this.appendValueInput("channel")
      .setCheck("String")
      .appendField("of YouTube channel:");
    appendKey(this);
    outputBlock(
      this,
      "Number",
      "A statistic of a channel from the YouTube Data API. YouTube still rounds subscriber counts to 3 digits. Needs an API key.",
    );
  },
};

javascriptGenerator.forBlock["youtube_apiChannelStat"] = function (
  block,
  generator,
) {
  const channel = value(block, generator, "channel");
  const key = value(block, generator, "key");
  const stat = block.getFieldValue("stat");

  return [
    `await ${channelIdOf()}(${channel}).then(async (id) => id ? ${apiRequest()}("channels", { part: "statistics", id }, ${key}) : null).then(async (json) => json?.items?.[0] ? Number(json.items[0].statistics.${stat}) || 0 : null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["youtube_apiForEachComment"] = {
  init: function () {
    this.appendValueInput("video")
      .setCheck("String")
      .appendField("for each top comment on YouTube video (link or ID):");
    this.appendDummyInput()
      .appendField("sorted by")
      .appendField(
        new Blockly.FieldDropdown([
          ["most relevant", "relevance"],
          ["newest", "time"],
        ]),
        "order",
      );
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("max comments (1-100):");
    this.setInputsInline(false);
    appendKey(this);
    this.appendStatementInput("code").appendField("do").setCheck("default");
    statementBlock(
      this,
      'Runs the blocks inside once for each comment on a video. Use "get ... of YouTube comment" inside it. Needs a YouTube Data API key.',
    );
  },
};

javascriptGenerator.forBlock["youtube_apiForEachComment"] = function (
  block,
  generator,
) {
  const video = value(block, generator, "video");
  const count = value(block, generator, "count", "20");
  const key = value(block, generator, "key");
  const order = block.getFieldValue("order");
  const code = generator.statementToCode(block, "code");

  return `for (const youtubeCommentInformation of ((await ${apiRequest()}("commentThreads", { part: "snippet", textFormat: "plainText", order: "${order}", videoId: String(${videoIdOf()}(${video})), maxResults: String(Math.min(100, Math.max(1, Number(${count}) || 20))) }, ${key}).catch(async (error) => console.error("Error fetching YouTube comments:", error)))?.items ?? []).map(thread => {
  const comment = thread.snippet.topLevelComment.snippet;
  return {
    id: thread.snippet.topLevelComment.id,
    text: comment.textDisplay,
    author: comment.authorDisplayName,
    authorAvatarUrl: comment.authorProfileImageUrl,
    authorChannelUrl: comment.authorChannelUrl,
    likes: comment.likeCount,
    replies: thread.snippet.totalReplyCount,
    publishedAt: new Date(comment.publishedAt),
    url: "https://www.youtube.com/watch?v=" + thread.snippet.videoId + "&lc=" + thread.snippet.topLevelComment.id
  };
})) {
  ${code}}\n`;
};

Blockly.Blocks["youtube_commentInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["text", "text"],
          ["author name", "author"],
          ["author profile picture URL", "authorAvatarUrl"],
          ["author channel link", "authorChannelUrl"],
          ["likes", "likes"],
          ["reply count", "replies"],
          ["date", "publishedAt"],
          ["link", "url"],
          ["comment ID", "id"],
        ]),
        "info",
      )
      .appendField("of YouTube comment");
    outputBlock(this, null, "Information about the YouTube comment");
  },
};

javascriptGenerator.forBlock["youtube_commentInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`youtubeCommentInformation.${info}`, Order.MEMBER];
};

/* ------------------------------------------------------------------ */
/* Where the info blocks can go                                         */
/* ------------------------------------------------------------------ */

createRestrictions(
  ["youtube_videoInfo"],
  [
    {
      type: "hasParent",
      blockTypes: [
        "youtube_getVideo",
        "youtube_getLatestVideo",
        "youtube_forEachVideo",
        "youtube_forEachPlaylistVideo",
        "youtube_onNewVideo",
        "youtube_onLive",
        "youtube_apiSearch",
      ],
      message:
        'This block must be inside a "get YouTube video", "for each video" or "when YouTube channel..." block.',
    },
  ],
);

createRestrictions(
  ["youtube_channelInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["youtube_getChannel"],
      message: 'This block must be inside a "get YouTube channel" block.',
    },
  ],
);

createRestrictions(
  ["youtube_commentInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["youtube_apiForEachComment"],
      message:
        'This block must be inside a "for each top comment on YouTube video" block.',
    },
  ],
);
