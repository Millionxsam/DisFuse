/* =====================================================================
   Discord odds and ends
   ---------------------------------------------------------------------
   CDN URLs, colours, permission tests and the little formatting rules
   the Control interface needs to look like Discord rather than like a
   list of JSON. Nothing here talks to Discord — every URL below is a
   plain image on Discord's CDN, and every request that needs the bot's
   authority goes through the DisFuse API over Socket.IO.
   ===================================================================== */

const CDN = "https://cdn.discordapp.com";

/** Discord's own fallback avatars, picked the way Discord picks them. */
export function defaultAvatar(user) {
  if (!user?.id) return `${CDN}/embed/avatars/0.png`;

  if (user.discriminator && user.discriminator !== "0") {
    return `${CDN}/embed/avatars/${Number(user.discriminator) % 5}.png`;
  }

  /* Post-migration usernames index by the snowflake instead. */
  try {
    return `${CDN}/embed/avatars/${Number((BigInt(user.id) >> 22n) % 6n)}.png`;
  } catch {
    return `${CDN}/embed/avatars/0.png`;
  }
}

export function avatarUrl(user, size = 64) {
  if (!user) return `${CDN}/embed/avatars/0.png`;
  if (!user.avatar) return defaultAvatar(user);

  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `${CDN}/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
}

/** A member's server-specific avatar, falling back to their account one. */
export function memberAvatarUrl(member, guildId, size = 64) {
  if (member?.avatar && guildId && member.user?.id) {
    const ext = member.avatar.startsWith("a_") ? "gif" : "png";
    return `${CDN}/guilds/${guildId}/users/${member.user.id}/avatars/${member.avatar}.${ext}?size=${size}`;
  }

  return avatarUrl(member?.user, size);
}

export function guildIconUrl(guild, size = 128) {
  if (!guild?.icon) return null;

  const ext = guild.icon.startsWith("a_") ? "gif" : "png";
  return `${CDN}/icons/${guild.id}/${guild.icon}.${ext}?size=${size}`;
}

export function guildBannerUrl(guild, size = 512) {
  if (!guild?.banner) return null;

  const ext = guild.banner.startsWith("a_") ? "gif" : "png";
  return `${CDN}/banners/${guild.id}/${guild.banner}.${ext}?size=${size}`;
}

export function emojiUrl(id, animated, size = 44) {
  return `${CDN}/emojis/${id}.${animated ? "gif" : "webp"}?size=${size}`;
}

export function roleIconUrl(role, size = 32) {
  if (!role?.icon) return null;
  return `${CDN}/role-icons/${role.id}/${role.icon}.png?size=${size}`;
}

/** Two initials, for a server with no icon — exactly what Discord shows. */
export function guildInitials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0])
      .join("") || "?"
  );
}

/* ---- Channels ---------------------------------------------------------- */

export const CHANNEL_TYPES = {
  TEXT: 0,
  DM: 1,
  VOICE: 2,
  GROUP_DM: 3,
  CATEGORY: 4,
  ANNOUNCEMENT: 5,
  ANNOUNCEMENT_THREAD: 10,
  PUBLIC_THREAD: 11,
  PRIVATE_THREAD: 12,
  STAGE: 13,
  DIRECTORY: 14,
  FORUM: 15,
  MEDIA: 16,
};

export const THREAD_TYPES = [10, 11, 12];
export const VOICE_TYPES = [2, 13];
/** Channel types a message can actually be sent to. */
export const SENDABLE_TYPES = [0, 1, 3, 5, 10, 11, 12];

export function channelIcon(channel) {
  switch (channel?.type) {
    case CHANNEL_TYPES.VOICE:
      return "fa-solid fa-volume-high";
    case CHANNEL_TYPES.STAGE:
      return "fa-solid fa-signal-stream";
    case CHANNEL_TYPES.ANNOUNCEMENT:
      return "fa-solid fa-bullhorn";
    case CHANNEL_TYPES.FORUM:
      return "fa-solid fa-comments";
    case CHANNEL_TYPES.MEDIA:
      return "fa-solid fa-image";
    case CHANNEL_TYPES.PUBLIC_THREAD:
    case CHANNEL_TYPES.PRIVATE_THREAD:
    case CHANNEL_TYPES.ANNOUNCEMENT_THREAD:
      return "fa-solid fa-comment-dots";
    case CHANNEL_TYPES.DM:
    case CHANNEL_TYPES.GROUP_DM:
      return "fa-solid fa-at";
    default:
      return "fa-solid fa-hashtag";
  }
}

export function isThread(channel) {
  return THREAD_TYPES.includes(channel?.type);
}

export function isVoice(channel) {
  return VOICE_TYPES.includes(channel?.type);
}

/** Forums and media channels hold posts (threads), never messages. */
export function isForum(channel) {
  return channel?.type === CHANNEL_TYPES.FORUM || channel?.type === CHANNEL_TYPES.MEDIA;
}

export function canSendIn(channel) {
  return SENDABLE_TYPES.includes(channel?.type);
}

/** A DM's title: the person on the other end. */
export function dmName(channel) {
  const names = (channel?.recipients || [])
    .map((user) => user.globalName || user.username)
    .filter(Boolean);

  return names.length ? names.join(", ") : "Direct Message";
}

export function channelLabel(channel) {
  if (!channel) return "";
  if (channel.type === CHANNEL_TYPES.DM || channel.type === CHANNEL_TYPES.GROUP_DM)
    return dmName(channel);

  return channel.name || "unknown";
}

/* ---- Permissions -------------------------------------------------------- */

/**
 * Does the bot have this permission here?
 *
 * The backend sends the names it already computed (`permissionNames`) so
 * the browser never does bitfield maths — and, more importantly, so the
 * UI and the API can't disagree about what the bot may do. A `null`
 * permission list means "no permission system here", i.e. a DM.
 */
export function botCan(target, permission) {
  if (!target) return false;
  if (target.permissionNames === null) return true;
  if (!Array.isArray(target.permissionNames)) return false;

  return (
    target.permissionNames.includes("Administrator") ||
    target.permissionNames.includes(permission)
  );
}

/* ---- Members and roles -------------------------------------------------- */

export function displayName(member, user) {
  return (
    member?.nick ||
    member?.user?.globalName ||
    member?.user?.username ||
    user?.globalName ||
    user?.username ||
    "Unknown User"
  );
}

/** The colour Discord paints a name: the highest coloured role. */
export function memberColor(member, roles) {
  if (!member?.roles?.length || !roles?.length) return null;

  const coloured = member.roles
    .map((id) => roles.find((role) => role.id === id))
    .filter((role) => role && role.color)
    .sort((a, b) => b.position - a.position);

  if (!coloured.length) return null;
  return `#${coloured[0].color.toString(16).padStart(6, "0")}`;
}

export function roleColor(role) {
  if (!role?.color) return "#99aab5";
  return `#${role.color.toString(16).padStart(6, "0")}`;
}

/** The role a member is grouped under in the sidebar, if any. */
export function hoistRole(member, roles) {
  if (!member?.roles?.length) return null;

  const hoisted = member.roles
    .map((id) => roles.find((role) => role.id === id))
    .filter((role) => role?.hoist)
    .sort((a, b) => b.position - a.position);

  return hoisted[0] || null;
}

export function isTimedOut(member) {
  if (!member?.communicationDisabledUntil) return false;
  return new Date(member.communicationDisabledUntil) > new Date();
}

export const STATUS_LABELS = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  offline: "Offline",
  invisible: "Invisible",
};

/* ---- Snowflakes and dates ------------------------------------------------ */

const DISCORD_EPOCH = 1420070400000n;

export function snowflakeDate(id) {
  try {
    return new Date(Number((BigInt(id) >> 22n) + DISCORD_EPOCH));
  } catch {
    return null;
  }
}

export function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Discord's own message timestamp wording. */
export function formatMessageDate(value) {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) => a.toDateString() === b.toDateString();

  if (sameDay(date, today)) return `Today at ${formatTime(date)}`;
  if (sameDay(date, yesterday)) return `Yesterday at ${formatTime(date)}`;

  return `${date.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${formatTime(date)}`;
}

export function formatDayDivider(value) {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );

  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

/** Two messages from the same person, close together, render as one block. */
export function groupsWith(previous, message) {
  if (!previous || !message) return false;
  if (previous.author?.id !== message.author?.id) return false;
  if (message.type !== 0 && message.type !== 19) return false;
  if (previous.type !== 0 && previous.type !== 19) return false;
  if (message.messageReference) return false;

  const gap =
    new Date(message.timestamp).getTime() -
    new Date(previous.timestamp).getTime();

  return gap >= 0 && gap < 7 * 60 * 1000;
}

/* ---- Message types ------------------------------------------------------- */

/** System messages Discord renders as a line of text rather than a message. */
export const SYSTEM_MESSAGE_TEXT = {
  1: "added someone to the group.",
  2: "removed someone from the group.",
  3: "started a call.",
  4: "changed the channel name.",
  5: "changed the channel icon.",
  6: "pinned a message to this channel.",
  7: "joined the server.",
  8: "boosted the server.",
  9: "boosted the server to Level 1.",
  10: "boosted the server to Level 2.",
  11: "boosted the server to Level 3.",
  12: "added this channel to their server.",
  15: "is here! Say hi.",
  18: "created a thread.",
  32: "started a thread.",
};

export function isSystemMessage(message) {
  return Boolean(SYSTEM_MESSAGE_TEXT[message?.type]);
}
