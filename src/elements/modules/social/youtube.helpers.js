/* Generated from the block editor's youtube blocks: the helper functions
   their code uses, each emitted once at the top of the bot. */

export const HELPERS = {
  /* Everything above the "API key" line in the toolbox works without any
   key or account. It reads YouTube's public RSS feeds (the latest 15
   uploads of a channel or playlist), its oEmbed endpoint, and the public
   video and channel pages.

   A few things — search, comments and exact statistics — are only
   available through the YouTube Data API, which needs a free API key
   from Google Cloud. Those blocks take a key input that the toolbox
   fills with a "get secret YOUTUBE_API_KEY" block. 

const HEADERS = `{ "User-Agent": "Mozilla/5.0 (compatible; DisFuse-Bot)", "Accept-Language": "en-US,en;q=0.9", Cookie: "SOCS=CAI; CONSENT=YES+1" }`;

/** Turns a video link (watch, youtu.be, Shorts, live, embed) or ID into the video ID. */
  youtubeVideoId: {
    key: "youtubeVideoId",
    code: `function youtubeVideoId(video) {
  const text = String(video ?? "").trim();
  const match = text.match(/(?:v=|youtu\\.be\\/|\\/shorts\\/|\\/live\\/|\\/embed\\/|\\/v\\/)([A-Za-z0-9_-]{11})/);
  if (match) return match[1];
  return /^[A-Za-z0-9_-]{11}$/.test(text) ? text : null;
}`,
  },
  /* Turns a channel ID, @handle or channel link into the channel ID (UC...). */
  youtubeChannelId: {
    key: "youtubeChannelId",
    code: `async function youtubeChannelId(channel) {
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

  const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; DisFuse-Bot)", "Accept-Language": "en-US,en;q=0.9", Cookie: "SOCS=CAI; CONSENT=YES+1" } }).then(async (res) => res.ok ? res.text() : "").catch(async () => "");
  const id = (html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/) || html.match(/<link rel="canonical" href="https:\\/\\/www\\.youtube\\.com\\/channel\\/(UC[A-Za-z0-9_-]{22})"/) || [])[1] || null;
  if (id) globalThis.youtubeChannelIdCache.set(text, id);
  return id;
}`,
  },
  /* Reads a channel's or playlist's RSS feed: its latest 15 videos, newest first. */
  youtubeFeed: {
    key: "youtubeFeed",
    code: `async function youtubeFeed(query) {
  const xml = await fetch("https://www.youtube.com/feeds/videos.xml?" + query, { headers: { "User-Agent": "Mozilla/5.0 (compatible; DisFuse-Bot)", "Accept-Language": "en-US,en;q=0.9", Cookie: "SOCS=CAI; CONSENT=YES+1" } })
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
  },
  /* The latest uploads of a channel, optionally only videos or only Shorts. */
  youtubeUploads: {
    key: "youtubeUploads",
    code: `async function youtubeUploads(channel, kind = "any") {
  const channelId = await youtubeChannelId(channel);
  if (!channelId) return [];
  const videos = await youtubeFeed("channel_id=" + channelId);
  if (kind === "video") return videos.filter(video => !video.isShort);
  if (kind === "short") return videos.filter(video => video.isShort);
  return videos;
}`,
  },
  /* Reads a public video page. Falls back to oEmbed (title, channel, thumbnail) if the page can't be read. */
  youtubeVideo: {
    key: "youtubeVideo",
    code: `async function youtubeVideo(video) {
  const id = youtubeVideoId(video);
  if (!id) return null;

  const html = await fetch("https://www.youtube.com/watch?v=" + id + "&hl=en", { headers: { "User-Agent": "Mozilla/5.0 (compatible; DisFuse-Bot)", "Accept-Language": "en-US,en;q=0.9", Cookie: "SOCS=CAI; CONSENT=YES+1" } })
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
  },
  /* Reads a public channel page and its feed. */
  youtubeChannel: {
    key: "youtubeChannel",
    code: `async function youtubeChannel(channel) {
  const id = await youtubeChannelId(channel);
  if (!id) return null;

  const [html, xml] = await Promise.all([
    fetch("https://www.youtube.com/channel/" + id + "?hl=en", { headers: { "User-Agent": "Mozilla/5.0 (compatible; DisFuse-Bot)", "Accept-Language": "en-US,en;q=0.9", Cookie: "SOCS=CAI; CONSENT=YES+1" } }).then(async (res) => res.ok ? res.text() : "").catch(async () => ""),
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
  },
  /* The video a channel is streaming right now, or null. */
  youtubeLiveVideo: {
    key: "youtubeLiveVideo",
    code: `async function youtubeLiveVideo(channel) {
  const id = await youtubeChannelId(channel);
  if (!id) return null;

  const html = await fetch("https://www.youtube.com/channel/" + id + "/live?hl=en", { headers: { "User-Agent": "Mozilla/5.0 (compatible; DisFuse-Bot)", "Accept-Language": "en-US,en;q=0.9", Cookie: "SOCS=CAI; CONSENT=YES+1" } })
    .then(async (res) => res.ok ? res.text() : "")
    .catch(async () => "");

  /* The /live page only shows a video while the channel is streaming;
     otherwise it is the channel's home page, which has no video info. */
  const primary = html.indexOf('"videoPrimaryInfoRenderer"');
  if (primary === -1) return null;

  const videoId = (html.match(/"videoDetails":\\{"videoId":"([A-Za-z0-9_-]{11})"/) || html.match(/"likeEndpoint":\\{"status":"LIKE","target":\\{"videoId":"([A-Za-z0-9_-]{11})"/) || html.match(/<link rel="canonical" href="https:\\/\\/www\\.youtube\\.com\\/watch\\?v=([A-Za-z0-9_-]{11})"/) || [])[1];
  const live = /"videoViewCountRenderer":\\{[^{}]*(?:\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}[^{}]*)*"isLive":true/.test(html.slice(primary, primary + 5000));
  if (!videoId || !live) return null;

  const video = await youtubeVideo(videoId);
  return video ? { ...video, isLive: true } : null;
}`,
  },
  /* Calls the YouTube Data API v3 with an API key. */
  youtubeApi: {
    key: "youtubeApi",
    code: `async function youtubeApi(path, params, key) {
  const query = new URLSearchParams({ ...params, key: String(key ?? "") });
  const res = await fetch("https://www.googleapis.com/youtube/v3/" + path + "?" + query);
  if (!res.ok) {
    console.error("YouTube API error (" + res.status + "):", await res.text().catch(async () => ""));
    return null;
  }
  return res.json();
}`,
  },
  /* Turns a Data API video resource into the same shape the other blocks use. */
  youtubeApiVideo: {
    key: "youtubeApiVideo",
    code: `function youtubeApiVideo(item) {
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
  },
  /* Runs a callback every few minutes, or every time something new shows up. */
  youtubeWatch: {
    key: "youtubeWatch",
    code: `function youtubeWatch(minutes, check) {
  const every = Math.max(1, Number(minutes) || 5) * 60 * 1000;
  const run = async () => {
    try { await check(); } catch (error) { console.error("Error checking YouTube:", error); }
  };
  setTimeout(run, 5000);
  setInterval(run, every);
}`,
  },
};

/** Every helper, for a step's `setup` (unused ones are harmless but are left out by the caller). */
export const ALL_HELPERS = Object.values(HELPERS);
