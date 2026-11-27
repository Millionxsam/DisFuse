/* Generated from the block editor's twitch blocks: the helper functions
   their code uses, each emitted once at the top of the bot. */

export const HELPERS = {
  /* Everything above the "log in" line in the toolbox works without any
   account. It reads public stream info from DecAPI (decapi.me), a free
   API made for Twitch chat bots, so it never needs keys.

   Twitch's official API (Helix) needs an app: a free Client ID and
   secret from dev.twitch.tv/console. Once "log in to Twitch" has run,
   the stream blocks above use Helix too (which gives more info), and
   the channel, video, clip and directory blocks below work. Those only
   read public data, so an app access token (no user login) is enough. 

/** Turns "twitch.tv/name", "@name" or "Name" into a login name. */
  twitchLoginName: {
    key: "twitchLoginName",
    code: `function twitchLoginName(channel) {
  return String(channel ?? "")
    .trim()
    .replace(/^(https?:\\/\\/)?(www\\.|m\\.)?twitch\\.tv\\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
}`,
  },
  /* Reads one DecAPI endpoint as text, or null if the user doesn't exist. */
  twitchDecapi: {
    key: "twitchDecapi",
    code: `async function twitchDecapi(path, channel, query = "") {
  const login = twitchLoginName(channel);
  if (!login) return null;
  const res = await fetch("https://decapi.me/twitch/" + path + "/" + encodeURIComponent(login) + query, {
    headers: { "User-Agent": "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)" }
  });
  const text = (await res.text()).trim();
  if (!res.ok || /^(User not found|Invalid Twitch username|An error occurred)/i.test(text)) return null;
  return text;
}`,
  },
  /* Gets (and caches) an app access token once "log in to Twitch" has run. */
  twitchToken: {
    key: "twitchToken",
    code: `async function twitchToken() {
  const login = globalThis.twitchLogin;
  if (!login) return null;
  if (login.token && login.expires > Date.now()) return login.token;

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: login.clientId, client_secret: login.clientSecret, grant_type: "client_credentials" })
  });
  const json = await res.json().catch(async () => null);
  if (!res.ok || !json?.access_token) {
    console.error("Twitch login failed (" + res.status + "):", json?.message || json);
    return null;
  }

  login.token = json.access_token;
  login.expires = Date.now() + (json.expires_in - 60) * 1000;
  return login.token;
}`,
  },
  /* Calls Twitch's official API (Helix). Returns the response's "data" list. */
  twitchHelix: {
    key: "twitchHelix",
    code: `async function twitchHelix(path, params = {}) {
  if (!globalThis.twitchLogin) {
    console.error('Twitch: use "log in to Twitch" (in "when the bot is logged in") before using this block.');
    return null;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    for (const item of [].concat(value)) query.append(key, String(item));
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const accessToken = await twitchToken();
    if (!accessToken) return null;

    const res = await fetch("https://api.twitch.tv/helix/" + path + "?" + query, {
      headers: { "Client-Id": globalThis.twitchLogin.clientId, Authorization: "Bearer " + accessToken }
    });

    if (res.status === 401 && attempt === 0) {
      globalThis.twitchLogin.token = null;
      continue;
    }
    if (!res.ok) {
      console.error("Twitch API error (" + res.status + "):", await res.text().catch(async () => ""));
      return null;
    }
    return (await res.json()).data ?? [];
  }
  return null;
}`,
  },
  /* The Helix user for a login name. */
  twitchHelixUser: {
    key: "twitchHelixUser",
    code: `async function twitchHelixUser(channel) {
  const login = twitchLoginName(channel);
  if (!login) return null;
  return (await twitchHelix("users", { login }))?.[0] ?? null;
}`,
  },
  /* Turns a Helix stream into the shape the stream info block reads. */
  twitchStreamShape: {
    key: "twitchStreamShape",
    code: `function twitchStreamShape(stream) {
  return {
    channel: stream.user_login,
    channelName: stream.user_name,
    channelId: stream.user_id,
    title: stream.title,
    game: stream.game_name,
    viewers: stream.viewer_count,
    url: "https://www.twitch.tv/" + stream.user_login,
    thumbnailUrl: String(stream.thumbnail_url || "").replace("{width}", "1280").replace("{height}", "720") + "?t=" + Date.now(),
    startedAt: stream.started_at ? new Date(stream.started_at) : null,
    language: stream.language,
    tags: stream.tags || [],
    isMature: !!stream.is_mature
  };
}`,
  },
  /* * The stream a channel has live right now, null when it is offline, or undefined when Twitch couldn't be reached. */
  twitchStream: {
    key: "twitchStream",
    code: `async function twitchStream(channel) {
  const login = twitchLoginName(channel);
  if (!login) return null;

  try {
    if (globalThis.twitchLogin) {
      const streams = await twitchHelix("streams", { user_login: login });
      if (!streams) return undefined;
      return streams[0] ? twitchStreamShape(streams[0]) : null;
    }

    const uptime = await twitchDecapi("uptime", login);
    if (uptime === null) return null;
    if (/is offline$/i.test(uptime)) return null;

    const [title, game, viewers] = await Promise.all([
      twitchDecapi("title", login),
      twitchDecapi("game", login),
      twitchDecapi("viewercount", login)
    ]);

    const units = { day: 86400, hour: 3600, minute: 60, second: 1 };
    let seconds = 0;
    for (const [, amount, unit] of uptime.matchAll(/(\\d+)\\s+(day|hour|minute|second)s?/g)) seconds += Number(amount) * units[unit];

    return {
      channel: login,
      channelName: login,
      channelId: null,
      title,
      game,
      viewers: Number(viewers) || 0,
      url: "https://www.twitch.tv/" + login,
      thumbnailUrl: "https://static-cdn.jtvnw.net/previews-ttv/live_user_" + login + "-1280x720.jpg?t=" + Date.now(),
      startedAt: new Date(Date.now() - seconds * 1000),
      language: null,
      tags: [],
      isMature: null
    };
  } catch (error) {
    console.error("Error checking Twitch stream:", error);
    return undefined;
  }
}`,
  },
  /* A channel's profile and channel settings, from Helix. */
  twitchChannel: {
    key: "twitchChannel",
    code: `async function twitchChannel(channel) {
  const user = await twitchHelixUser(channel);
  if (!user) return null;

  const [info, streams] = await Promise.all([
    twitchHelix("channels", { broadcaster_id: user.id }),
    twitchHelix("streams", { user_id: user.id })
  ]);
  const settings = info?.[0] || {};

  return {
    id: user.id,
    login: user.login,
    name: user.display_name,
    description: user.description,
    url: "https://www.twitch.tv/" + user.login,
    avatarUrl: user.profile_image_url,
    offlineImageUrl: user.offline_image_url || null,
    broadcasterType: user.broadcaster_type || "normal",
    createdAt: user.created_at ? new Date(user.created_at) : null,
    title: settings.title ?? null,
    game: settings.game_name ?? null,
    language: settings.broadcaster_language ?? null,
    tags: settings.tags || [],
    isLive: !!streams?.length
  };
}`,
  },
  /* Turns a Helix video or clip into the shape the video info block reads. */
  twitchVideoShape: {
    key: "twitchVideoShape",
    code: `function twitchVideoShape(video, type) {
  const duration = String(video.duration ?? "").match(/^(?:(\\d+)h)?(?:(\\d+)m)?(?:(\\d+)s)?$/);
  const seconds = typeof video.duration === "number"
    ? Math.round(video.duration)
    : duration ? Number(duration[1] || 0) * 3600 + Number(duration[2] || 0) * 60 + Number(duration[3] || 0) : null;

  return {
    id: video.id,
    title: video.title,
    description: video.description ?? "",
    url: video.url,
    thumbnailUrl: String(video.thumbnail_url || "").replace("%{width}", "1280").replace("%{height}", "720") || null,
    views: video.view_count ?? 0,
    lengthSeconds: seconds,
    createdAt: video.created_at ? new Date(video.created_at) : null,
    type: type || video.type,
    channelName: video.user_name || video.broadcaster_name,
    clippedBy: video.creator_name ?? null
  };
}`,
  },
  /* A channel's videos ("archive", "highlight", "upload" or "all") or recent clips, newest first. */
  twitchVideos: {
    key: "twitchVideos",
    code: `async function twitchVideos(channel, type = "all", count = 20) {
  const user = await twitchHelixUser(channel);
  if (!user) return [];
  const first = Math.min(100, Math.max(1, Number(count) || 20));

  if (type === "clip") {
    const clips = await twitchHelix("clips", { broadcaster_id: user.id, first: 100, started_at: new Date(Date.now() - 30 * 86400000).toISOString() });
    return (clips || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, first)
      .map(clip => twitchVideoShape(clip, "clip"));
  }

  const videos = await twitchHelix("videos", { user_id: user.id, type, first, sort: "time" });
  return (videos || []).map(video => twitchVideoShape(video));
}`,
  },
  /* The game (category) ID for a name, or null. */
  twitchGameId: {
    key: "twitchGameId",
    code: `async function twitchGameId(name) {
  if (!String(name ?? "").trim()) return null;
  return (await twitchHelix("games", { name: String(name).trim() }))?.[0]?.id ?? null;
}`,
  },
};

/** Every helper, for a step's `setup` (unused ones are harmless but are left out by the caller). */
export const ALL_HELPERS = Object.values(HELPERS);
