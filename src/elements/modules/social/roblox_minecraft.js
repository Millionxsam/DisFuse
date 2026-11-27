/* =====================================================================
   More Roblox and Minecraft
   ---------------------------------------------------------------------
   The Roblox and Minecraft steps added after the first ones (which live
   in ../apps.js): users by ID, badges, gamepasses, catalog items, game
   servers, and Open Cloud (messages, DataStores and bans for a game you
   own, with an API key from create.roblox.com/dashboard/credentials);
   and Minecraft server status, icons and versions.
   ===================================================================== */

import { ANY, group, input } from "../../define.js";
import { MINECRAFT_SERVER_VALUES, ROBLOX_USER_VALUES } from "../apps.js";
import { infoBlock, minutesInput, site } from "./shared.js";

/* A Roblox user's ID from their username, or null. */
const userIdOf = (username) =>
  `fetch("https://users.roblox.com/v1/usernames/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usernames: [${username}] }) })
    .then(async (res) => res.json())
    .then(async (json) => json.data[0]?.id ?? null)`;

const OPEN_CLOUD = {
  key: "robloxOpenCloud",
  code: `async function robloxOpenCloud(placeId, path, key, options = {}) {
  const universeId = await fetch("https://apis.roblox.com/universes/v1/places/" + placeId + "/universe")
    .then(async (res) => res.json())
    .then(async (json) => json.universeId)
    .catch(async () => null);
  if (!universeId) {
    console.error("Roblox: couldn't find a game with place ID " + placeId);
    return null;
  }
  const res = await fetch("https://apis.roblox.com" + path.replace("{universe}", universeId), {
    method: options.method || "GET",
    headers: {
      "x-api-key": String(key ?? ""),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {})
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    if (res.status !== 404) console.error("Roblox Open Cloud error (" + res.status + "):", await res.text().catch(async () => ""));
    return null;
  }
  const text = await res.text();
  try { return text ? JSON.parse(text) : true; } catch { return text; }
}`,
};

const roblox = site(
  { name: "Roblox", colour: "#e2231a", setup: [] },
  group({ colour: "#e2231a" }),
);
const minecraft = site(
  { name: "Minecraft", colour: "#5A8F3C", setup: [] },
  group({ colour: "#5A8F3C" }),
);

const idInput = (label) =>
  input.number("id", label, { default: 0, min: 0, integer: true });
const placeInput = input.number("place", "Game place ID", {
  default: 0,
  min: 0,
  integer: true,
});
const keyInput = input.text("key", "Open Cloud API key", {
  default: "",
  help: "Made at create.roblox.com/dashboard/credentials. Keep it in a Secret, and use the Secret here.",
});
const usernameInput = input.text("username", "Roblox username", {
  default: "",
});

/* ---- Roblox: what the info blocks read --------------------------------- */

const SERVER_FIELDS = [
  ["players", "playing", "Number", "Players"],
  ["max players", "maxPlayers", "Number"],
  ["FPS", "fps", "Number", "FPS"],
  ["ping", "ping", "Number"],
  ["server ID", "id", "String", "Server ID"],
  ["join link", "joinUrl"],
];
const BADGE_FIELDS = [
  ["name", "name", "String", "Badge name"],
  ["description", "description"],
  ["times awarded", "awardedCount", "Number"],
  ["times awarded yesterday", "pastDayAwardedCount", "Number"],
  ["win rate (%)", "winRate", "Number", "Win rate (%)"],
  ["is enabled", "enabled", "Boolean", "Is enabled?"],
  ["game name", "gameName"],
  ["game place ID", "placeId", "Number"],
  ["created date", "created"],
  ["last updated date", "updated"],
  ["badge ID", "id", "Number", "Badge ID"],
  ["icon image URL", "iconUrl", "String", "Icon link"],
  ["badge link", "badgeUrl"],
];
const GAMEPASS_FIELDS = [
  ["name", "name", "String", "Gamepass name"],
  ["description", "description"],
  ["price (Robux)", "price", "Number", "Price (Robux)"],
  ["is for sale", "forSale", "Boolean", "Is for sale?"],
  ["creator name", "creatorName"],
  ["creator ID", "creatorId", "Number", "Creator ID"],
  ["created date", "created"],
  ["last updated date", "updated"],
  ["gamepass ID", "id", "Number", "Gamepass ID"],
  ["icon image URL", "iconUrl", "String", "Icon link"],
  ["gamepass link", "gamepassUrl"],
];
const ITEM_FIELDS = [
  ["name", "name", "String", "Item name"],
  ["description", "description"],
  ["price (Robux)", "price", "Number", "Price (Robux)"],
  ["is for sale", "forSale", "Boolean", "Is for sale?"],
  ["is limited", "isLimited", "Boolean", "Is limited?"],
  ["copies remaining", "remaining", "Number"],
  ["creator name", "creatorName"],
  ["creator ID", "creatorId", "Number", "Creator ID"],
  ["created date", "created"],
  ["last updated date", "updated"],
  ["item ID", "id", "Number", "Item ID"],
  ["image URL", "imageUrl", "String", "Picture link"],
  ["item link", "itemUrl"],
];

/* ---- Roblox steps ----------------------------------------------------- */

const actions = [
  roblox.step({
    id: "roblox_user_by_id",
    label: "Look up a Roblox user by ID",
    description:
      "Finds a Roblox user by their user ID (the number in their profile link).",
    icon: "fa-solid fa-id-card",
    keywords: ["user id", "profile"],
    block: {
      type: "roblox_getUserById",
      text: ["get Roblox user with ID: {id}", "then {code}"],
      parts: { id: { check: "Number" }, code: { check: "default" } },
      tooltip:
        "Looks up a Roblox user by their user ID (the number in their profile link), then runs the blocks inside",
    },
    inputs: [idInput("User ID")],
    branches: [
      { key: "code", label: "With the user", provides: ROBLOX_USER_VALUES },
    ],
    code: (ctx) => `await Promise.resolve(Number(${ctx.input("id")}) || null)
  .then(async (robloxId) => {
    if (!robloxId) return;

    const [robloxProfile, robloxFriends, robloxFollowers, robloxFollowing, robloxAvatar] = await Promise.all([
      fetch("https://users.roblox.com/v1/users/" + robloxId).then(async (res) => res.json()).catch(async () => ({})),
      fetch("https://friends.roblox.com/v1/users/" + robloxId + "/friends/count").then(async (res) => res.json()).then(async (json) => json.count).catch(async () => 0),
      fetch("https://friends.roblox.com/v1/users/" + robloxId + "/followers/count").then(async (res) => res.json()).then(async (json) => json.count).catch(async () => 0),
      fetch("https://friends.roblox.com/v1/users/" + robloxId + "/followings/count").then(async (res) => res.json()).then(async (json) => json.count).catch(async () => 0),
      fetch("https://thumbnails.roblox.com/v1/users/avatar?userIds=" + robloxId + "&size=420x420&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl).catch(async () => null)
    ]);

    if (!robloxProfile?.id) return;

    const robloxUserInformation = Object.assign({}, robloxProfile, {
      friendsCount: robloxFriends,
      followersCount: robloxFollowers,
      followingCount: robloxFollowing,
      avatarUrl: robloxAvatar,
      profileUrl: "https://www.roblox.com/users/" + robloxId + "/profile"
    });

    ${ctx.branch("code")}})
  .catch(async (error) => console.error("Error fetching Roblox user:", error));\n`,
  }),
  roblox.loop({
    id: "roblox_each_server",
    label: "For each public server of a Roblox game",
    description:
      "Runs once for each public server of a game (up to 100, fullest first).",
    icon: "fa-solid fa-server",
    keywords: ["servers", "players", "join"],
    variable: "robloxServerInformation",
    noun: "Roblox server",
    fields: SERVER_FIELDS,
    info: infoBlock("roblox_serverInfo", "Roblox server", SERVER_FIELDS, {
      inside: ["roblox_forEachServer"],
    }),
    block: {
      type: "roblox_forEachServer",
      text: [
        "for each public server of Roblox game with place ID: {id}",
        "do {code}",
      ],
      parts: { id: { check: "Number" } },
      tooltip:
        'Runs the blocks inside once for each public server of a game (up to 100, fullest first). Use "get ... of Roblox server" inside it.',
    },
    inputs: [idInput("Place ID")],
    expr: (
      ctx,
    ) => `fetch("https://games.roblox.com/v1/games/" + ${ctx.input("id")} + "/servers/Public?sortOrder=Desc&limit=100")
  .then(async (res) => res.json())
  .then(async (json) => (json.data ?? []).map(server => ({
    id: server.id,
    playing: server.playing ?? 0,
    maxPlayers: server.maxPlayers,
    fps: Math.round(server.fps ?? 0),
    ping: server.ping ?? 0,
    joinUrl: "https://www.roblox.com/games/start?placeId=" + ${ctx.input("id")} + "&gameInstanceId=" + server.id
  })))`,
  }),
  roblox.lookup({
    id: "roblox_badge",
    label: "Look up a Roblox badge",
    description: "Finds a badge by its ID.",
    icon: "fa-solid fa-award",
    keywords: ["badge", "award"],
    variable: "robloxBadgeInformation",
    noun: "Roblox badge",
    fields: BADGE_FIELDS,
    info: infoBlock("roblox_badgeInfo", "Roblox badge", BADGE_FIELDS, {
      inside: ["roblox_getBadge"],
    }),
    block: {
      type: "roblox_getBadge",
      text: ["get Roblox badge with ID: {id}", "then {code}"],
      parts: { id: { check: "Number" } },
      tooltip: "Looks up a badge by its ID, then runs the blocks inside",
    },
    inputs: [idInput("Badge ID")],
    expr: (ctx) => `Promise.all([
    fetch("https://badges.roblox.com/v1/badges/" + ${ctx.input("id")}).then(async (res) => res.ok ? res.json() : null),
    fetch("https://thumbnails.roblox.com/v1/badges/icons?badgeIds=" + ${ctx.input("id")} + "&size=150x150&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl ?? null).catch(async () => null)
  ]).then(async ([badge, icon]) => badge?.id ? {
      id: badge.id,
      name: badge.displayName || badge.name,
      description: badge.displayDescription || badge.description || "",
      enabled: badge.enabled,
      awardedCount: badge.statistics?.awardedCount ?? 0,
      pastDayAwardedCount: badge.statistics?.pastDayAwardedCount ?? 0,
      winRate: Math.round((badge.statistics?.winRatePercentage ?? 0) * 10000) / 100,
      created: badge.created,
      updated: badge.updated,
      gameName: badge.awardingUniverse?.name ?? null,
      placeId: badge.awardingUniverse?.rootPlaceId ?? null,
      iconUrl: icon,
      badgeUrl: "https://www.roblox.com/badges/" + badge.id
    } : null)`,
  }),
  roblox.lookup({
    id: "roblox_gamepass",
    label: "Look up a Roblox gamepass",
    description: "Finds a gamepass by its ID.",
    icon: "fa-solid fa-ticket",
    keywords: ["gamepass", "pass", "price"],
    variable: "robloxGamepassInformation",
    noun: "Roblox gamepass",
    fields: GAMEPASS_FIELDS,
    info: infoBlock("roblox_gamepassInfo", "Roblox gamepass", GAMEPASS_FIELDS, {
      inside: ["roblox_getGamepass"],
    }),
    block: {
      type: "roblox_getGamepass",
      text: ["get Roblox gamepass with ID: {id}", "then {code}"],
      parts: { id: { check: "Number" } },
      tooltip: "Looks up a gamepass by its ID, then runs the blocks inside",
    },
    inputs: [idInput("Gamepass ID")],
    expr: (ctx) => `Promise.all([
    fetch("https://apis.roblox.com/game-passes/v1/game-passes/" + ${ctx.input("id")} + "/product-info").then(async (res) => res.ok ? res.json() : null),
    fetch("https://thumbnails.roblox.com/v1/game-passes?gamePassIds=" + ${ctx.input("id")} + "&size=150x150&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl ?? null).catch(async () => null)
  ]).then(async ([pass, icon]) => pass?.TargetId ? {
      id: pass.TargetId,
      name: pass.Name,
      description: pass.Description || "",
      price: pass.PriceInRobux ?? null,
      forSale: !!pass.IsForSale,
      creatorName: pass.Creator?.Name ?? null,
      creatorId: pass.Creator?.CreatorTargetId ?? null,
      created: pass.Created,
      updated: pass.Updated,
      iconUrl: icon,
      gamepassUrl: "https://www.roblox.com/game-pass/" + pass.TargetId
    } : null)`,
  }),
  roblox.lookup({
    id: "roblox_item",
    label: "Look up a Roblox catalog item",
    description:
      "Finds an avatar shop item or other asset (hats, shirts, models...) by the ID in its link.",
    icon: "fa-solid fa-shirt",
    keywords: ["catalog", "item", "asset", "hat", "shirt", "limited"],
    variable: "robloxItemInformation",
    noun: "Roblox item",
    fields: ITEM_FIELDS,
    info: infoBlock("roblox_itemInfo", "Roblox item", ITEM_FIELDS, {
      inside: ["roblox_getItem"],
    }),
    block: {
      type: "roblox_getItem",
      text: ["get Roblox catalog item with ID: {id}", "then {code}"],
      parts: { id: { check: "Number" } },
      tooltip:
        "Looks up an avatar shop item or other asset (hats, shirts, models...) by the ID in its link, then runs the blocks inside",
    },
    inputs: [idInput("Item ID")],
    expr: (ctx) => `Promise.all([
    fetch("https://economy.roblox.com/v2/assets/" + ${ctx.input("id")} + "/details").then(async (res) => res.ok ? res.json() : null),
    fetch("https://thumbnails.roblox.com/v1/assets?assetIds=" + ${ctx.input("id")} + "&size=420x420&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl ?? null).catch(async () => null)
  ]).then(async ([item, image]) => item?.AssetId ? {
      id: item.AssetId,
      name: item.Name,
      description: item.Description || "",
      price: item.PriceInRobux ?? null,
      forSale: !!item.IsForSale,
      isLimited: !!(item.IsLimited || item.IsLimitedUnique),
      remaining: item.Remaining ?? null,
      sales: item.Sales ?? null,
      creatorName: item.Creator?.Name ?? null,
      creatorId: item.Creator?.CreatorTargetId ?? null,
      created: item.Created,
      updated: item.Updated,
      imageUrl: image,
      itemUrl: "https://www.roblox.com/catalog/" + item.AssetId
    } : null)`,
  }),
  roblox.step({
    id: "roblox_publish_message",
    label: "Send a message to a Roblox game",
    description:
      "Sends a message to every running server of your game. In the game, receive it with MessagingService:SubscribeAsync(topic). Needs an Open Cloud API key.",
    icon: "fa-solid fa-satellite-dish",
    keywords: ["messaging service", "open cloud", "announce"],
    setup: [OPEN_CLOUD],
    block: {
      type: "roblox_publishMessage",
      text: [
        "send message to Roblox game: {message}",
        "topic: {topic}",
        "game place ID: {place}",
        "with API key: {key}",
      ],
      parts: {
        message: { check: null },
        place: { check: "Number" },
        key: { check: null },
      },
      tooltip:
        "Sends a message to every running server of your game. In the game, receive it with MessagingService:SubscribeAsync(topic). Needs an Open Cloud API key with the messaging-service:publish permission.",
    },
    inputs: [
      input.slot("message", "Message", ANY),
      input.text("topic", "Topic", { default: "" }),
      placeInput,
      keyInput,
    ],
    code: (ctx) => {
      const message = ctx.has("message") ? ctx.input("message") : "''";
      return `await robloxOpenCloud(${ctx.input("place")}, "/messaging-service/v1/universes/{universe}/topics/" + encodeURIComponent(${ctx.input("topic")}), ${ctx.input("key")}, { method: "POST", body: { message: typeof ${message} === "string" ? ${message} : JSON.stringify(${message}) } });\n`;
    },
  }),
  roblox.step({
    id: "roblox_set_datastore",
    label: "Save to a Roblox DataStore",
    description:
      "Saves a value your game can read with DataStoreService. Needs an Open Cloud API key.",
    icon: "fa-solid fa-floppy-disk",
    keywords: ["datastore", "save", "open cloud"],
    setup: [OPEN_CLOUD],
    block: {
      type: "roblox_setDataStore",
      text: [
        "set key: {entry}",
        "to: {value}",
        "in Roblox DataStore: {datastore}",
        "game place ID: {place}",
        "with API key: {key}",
      ],
      parts: {
        value: { check: null },
        place: { check: "Number" },
        key: { check: null },
      },
      tooltip:
        "Saves a value your game can read with DataStoreService. Needs an Open Cloud API key with the universe-datastores.objects:create and update permissions.",
    },
    inputs: [
      input.text("entry", "Key", { default: "" }),
      input.slot("value", "Value", ANY),
      input.text("datastore", "DataStore name", { default: "" }),
      placeInput,
      keyInput,
    ],
    code: (ctx) =>
      `await robloxOpenCloud(${ctx.input("place")}, "/datastores/v1/universes/{universe}/standard-datastores/datastore/entries/entry?" + new URLSearchParams({ datastoreName: String(${ctx.input("datastore")}), entryKey: String(${ctx.input("entry")}) }), ${ctx.input("key")}, { method: "POST", body: ${ctx.has("value") ? ctx.input("value") : "null"} });\n`,
  }),
  roblox.step({
    id: "roblox_ban_user",
    label: "Ban or unban a Roblox player",
    description:
      "Bans (or unbans) a player from your game, including servers already running. Needs an Open Cloud API key.",
    icon: "fa-solid fa-gavel",
    keywords: ["ban", "unban", "moderation", "open cloud"],
    setup: [OPEN_CLOUD],
    block: {
      type: "roblox_banUser",
      text: [
        "{action} Roblox user: {username}",
        "from game with place ID: {place}",
        "for (seconds, 0 = forever): {duration}",
        "reason shown to them: {reason}",
        "with API key: {key}",
      ],
      parts: { place: { check: "Number" }, key: { check: null } },
      tooltip:
        "Bans (or unbans) a player from your game, including servers that are already running. The duration and reason are ignored when unbanning. Needs an Open Cloud API key with the universe.user-restriction:write permission.",
    },
    inputs: [
      input.dropdown("action", "What to do", [
        ["ban", "ban"],
        ["unban", "unban"],
      ]),
      usernameInput,
      placeInput,
      input.number("duration", "For how long (seconds, 0 = forever)", {
        default: 0,
        min: 0,
        integer: true,
      }),
      input.text("reason", "Reason shown to them", { default: "" }),
      keyInput,
    ],
    code: (ctx) => {
      const restriction =
        ctx.raw("action") === "ban"
          ? `{ active: true, ...(Number(${ctx.input("duration")}) > 0 ? { duration: Math.round(Number(${ctx.input("duration")})) + "s" } : {}), privateReason: String(${ctx.input("reason")} || "Banned from Discord"), displayReason: String(${ctx.input("reason")} || "You are banned from this experience."), excludeAltAccounts: false }`
          : `{ active: false }`;
      return `await ${userIdOf(ctx.input("username"))}
  .then(async (robloxId) => robloxId ? robloxOpenCloud(${ctx.input("place")}, "/cloud/v2/universes/{universe}/user-restrictions/" + robloxId + "?updateMask=gameJoinRestriction", ${ctx.input("key")}, { method: "PATCH", body: { gameJoinRestriction: ${restriction} } }) : console.error("Roblox: no user is called " + ${ctx.input("username")}))
  .catch(async (error) => console.error("Error changing Roblox ban:", error));\n`;
    },
  }),
];

/* ---- Roblox values ---------------------------------------------------- */

const values = [
  roblox.check({
    id: "roblox_username_from_id",
    label: "Username of a Roblox user ID",
    description: "The username or display name of a Roblox user ID.",
    icon: "fa-solid fa-signature",
    keywords: ["username", "display name", "id"],
    block: {
      type: "roblox_usernameFromId",
      text: "{info} of Roblox user with ID: {id}",
      parts: { id: { check: "Number" } },
      inline: false,
      tooltip: "The username or display name belonging to a Roblox user ID",
    },
    output: "String",
    inputs: [
      input.dropdown("info", "Which name", [
        ["username", "name"],
        ["display name", "displayName"],
      ]),
      idInput("User ID"),
    ],
    code: (ctx) =>
      `(await fetch("https://users.roblox.com/v1/users/" + ${ctx.input("id")}).then(async (res) => res.ok ? res.json() : null).then(async (user) => user?.${ctx.raw("info") === "displayName" ? "displayName" : "name"} ?? null).catch(async () => null))`,
  }),
  roblox.check({
    id: "roblox_user_thumbnail",
    label: "Picture of a Roblox avatar",
    description:
      "A link to a picture of a user's avatar (headshot, bust or full). Great inside messages.",
    icon: "fa-solid fa-image-portrait",
    keywords: ["avatar", "headshot", "thumbnail", "picture"],
    block: {
      type: "roblox_userThumbnail",
      text: "Roblox {type} image URL of user: {username}",
      parts: { username: { check: "String" } },
      inline: false,
      tooltip: "A link to a picture of the user's avatar, great inside embeds",
    },
    output: "String",
    inputs: [
      input.dropdown("type", "Kind of picture", [
        ["headshot", "avatar-headshot"],
        ["bust (head and shoulders)", "avatar-bust"],
        ["full avatar", "avatar"],
      ]),
      usernameInput,
    ],
    code: (ctx) => `(await ${userIdOf(ctx.input("username"))}
    .then(async (robloxId) => robloxId ? fetch("https://thumbnails.roblox.com/v1/users/${ctx.raw("type")}?userIds=" + robloxId + "&size=420x420&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl ?? null) : null)
    .catch(async () => null))`,
  }),
  roblox.check({
    id: "roblox_user_list",
    label: "List about a Roblox user",
    description:
      "A user's groups, previous usernames or the games they made, as a list (up to 100).",
    icon: "fa-solid fa-list-ul",
    keywords: ["groups", "usernames", "games", "list"],
    block: {
      type: "roblox_userList",
      text: "list of {list} of Roblox user: {username}",
      parts: { username: { check: "String" } },
      inline: false,
      tooltip: "A list about a Roblox user (up to 100 items)",
    },
    output: "Array",
    inputs: [
      input.dropdown("list", "List of", [
        ["group names", "groups"],
        ["group IDs", "groupIds"],
        ["previous usernames", "usernames"],
        ["games they made", "games"],
      ]),
      usernameInput,
    ],
    code: (ctx) => {
      const list = ctx.raw("list");
      const request =
        {
          groups: `"https://groups.roblox.com/v2/users/" + robloxId + "/groups/roles"`,
          groupIds: `"https://groups.roblox.com/v2/users/" + robloxId + "/groups/roles"`,
          usernames: `"https://users.roblox.com/v1/users/" + robloxId + "/username-history?limit=100&sortOrder=Desc"`,
          games: `"https://games.roblox.com/v2/users/" + robloxId + "/games?limit=50&sortOrder=Desc"`,
        }[list] ??
        `"https://groups.roblox.com/v2/users/" + robloxId + "/groups/roles"`;
      const pick =
        {
          groups: "item.group.name",
          groupIds: "item.group.id",
          usernames: "item.name",
          games: "item.name",
        }[list] ?? "item.group.name";
      return `(await ${userIdOf(ctx.input("username"))}
    .then(async (robloxId) => robloxId ? fetch(${request}).then(async (res) => res.json()).then(async (json) => (json.data ?? []).map(item => ${pick})) : [])
    .catch(async () => []))`;
    },
  }),
  roblox.check({
    id: "roblox_search_users",
    label: "Roblox usernames found searching",
    description:
      "Searches Roblox users by name, and gives up to 10 usernames as a list.",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["search", "find", "users"],
    block: {
      type: "roblox_searchUsers",
      text: "list of Roblox usernames found searching: {keyword}",
      parts: { keyword: { check: "String" } },
      inline: false,
      tooltip: "Searches Roblox users by name (up to 10 results)",
    },
    output: "Array",
    inputs: [input.text("keyword", "Search for", { default: "" })],
    code: (ctx) =>
      `(await fetch("https://users.roblox.com/v1/users/search?limit=10&keyword=" + encodeURIComponent(${ctx.input("keyword")})).then(async (res) => res.json()).then(async (json) => (json.data ?? []).map(user => user.name)).catch(async () => []))`,
  }),
  roblox.check({
    id: "roblox_group_roles",
    label: "Roles in a Roblox group",
    description:
      "Every role name in a group, from lowest to highest rank, as a list.",
    icon: "fa-solid fa-ranking-star",
    keywords: ["group", "roles", "ranks"],
    block: {
      type: "roblox_groupRoles",
      text: "list of role names in Roblox group with ID: {id}",
      parts: { id: { check: "Number" } },
      inline: false,
      tooltip: "Every role in a group, from lowest to highest rank",
    },
    output: "Array",
    inputs: [idInput("Group ID")],
    code: (ctx) =>
      `(await fetch("https://groups.roblox.com/v1/groups/" + ${ctx.input("id")} + "/roles").then(async (res) => res.json()).then(async (json) => (json.roles ?? []).filter(role => role.rank > 0).sort((a, b) => a.rank - b.rank).map(role => role.name).filter((name, index, names) => names.indexOf(name) === index)).catch(async () => []))`,
  }),
  roblox.check({
    id: "roblox_game_players",
    label: "Players in a Roblox game right now",
    description: "How many people are playing a game right now.",
    icon: "fa-solid fa-users",
    keywords: ["players", "playing", "online", "ccu"],
    block: {
      type: "roblox_gamePlayers",
      text: "players right now in Roblox game with place ID: {id}",
      parts: { id: { check: "Number" } },
      inline: false,
      tooltip: "How many people are playing a game right now",
    },
    output: "Number",
    inputs: [idInput("Place ID")],
    code: (ctx) =>
      `(await fetch("https://apis.roblox.com/universes/v1/places/" + ${ctx.input("id")} + "/universe").then(async (res) => res.json()).then(async (json) => json.universeId ? fetch("https://games.roblox.com/v1/games?universeIds=" + json.universeId).then(async (res) => res.json()).then(async (json) => json.data[0]?.playing ?? 0) : 0).catch(async () => 0))`,
  }),
  roblox.check({
    id: "roblox_get_datastore",
    label: "Value from a Roblox DataStore",
    description:
      "Reads a value your game saved with DataStoreService. Needs an Open Cloud API key.",
    icon: "fa-solid fa-database",
    keywords: ["datastore", "read", "open cloud"],
    setup: [OPEN_CLOUD],
    block: {
      type: "roblox_getDataStore",
      text: [
        "value of key: {entry}",
        "in Roblox DataStore: {datastore}",
        "game place ID: {place}",
        "with API key: {key}",
      ],
      parts: { place: { check: "Number" }, key: { check: null } },
      inline: false,
      tooltip:
        "Reads a value your game saved with DataStoreService, or null if there isn't one. Needs an Open Cloud API key with the universe-datastores.objects:read permission.",
    },
    output: ANY,
    inputs: [
      input.text("entry", "Key", { default: "" }),
      input.text("datastore", "DataStore name", { default: "" }),
      placeInput,
      keyInput,
    ],
    code: (ctx) =>
      `(await robloxOpenCloud(${ctx.input("place")}, "/datastores/v1/universes/{universe}/standard-datastores/datastore/entries/entry?" + new URLSearchParams({ datastoreName: String(${ctx.input("datastore")}), entryKey: String(${ctx.input("entry")}) }), ${ctx.input("key")}).then(async (value) => value ?? null).catch(async () => null))`,
  }),

  /* ---- Minecraft values ----------------------------------------------- */

  minecraft.check({
    id: "minecraft_username_from_uuid",
    label: "Username of a Minecraft UUID",
    description:
      "The current username of a Minecraft account, from its UUID (with or without dashes).",
    icon: "fa-solid fa-signature",
    keywords: ["uuid", "username", "name"],
    block: {
      type: "minecraft_usernameFromUUID",
      text: "username of Minecraft UUID: {uuid}",
      parts: { uuid: { check: "String" } },
      inline: false,
      tooltip:
        "The current username of a Minecraft account, from its UUID (with or without dashes). Null if there's no such account.",
    },
    output: "String",
    inputs: [input.text("uuid", "UUID", { default: "" })],
    code: (
      ctx,
    ) => `(await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + String(${ctx.input("uuid")}).replace(/-/g, "").trim())
    .then(res => res.ok ? res.json() : null)
    .then(profile => profile?.name ?? null)
    .catch(() => null))`,
  }),
  minecraft.check({
    id: "minecraft_server_quick_info",
    label: "Info about a Minecraft server",
    description:
      "One piece of a server's live status, without looking the server up first.",
    icon: "fa-solid fa-circle-info",
    keywords: ["players online", "motd", "version", "status"],
    block: {
      type: "minecraft_serverQuickInfo",
      text: "{info} of Minecraft {edition} server: {address}",
      parts: { address: { check: "String" } },
      inline: false,
      tooltip:
        "One piece of a server's live status, without getting the server first",
    },
    output: ANY,
    inputs: [
      input.dropdown("info", "What to get", [
        ["players online", "playersOnline"],
        ["max players", "playersMax"],
        ["MOTD (message of the day)", "motd"],
        ["version", "version"],
        ["list of online player names", "playerList"],
      ]),
      input.dropdown("edition", "Edition", [
        ["Java", "java"],
        ["Bedrock", "bedrock"],
      ]),
      input.text("address", "Server address", {
        default: "",
        placeholder: "play.example.com",
      }),
    ],
    code: (ctx) => {
      const info = ctx.raw("info");
      const pick =
        {
          playersOnline: "json.players?.online ?? 0",
          playersMax: "json.players?.max ?? 0",
          motd: 'json.motd?.clean?.join("\\n") ?? ""',
          version: "json.version ?? null",
          playerList:
            "json.players?.list?.map(player => player.name ?? player) ?? []",
        }[info] ?? "json.players?.online ?? 0";
      const fallback =
        {
          playersOnline: "0",
          playersMax: "0",
          motd: '""',
          version: "null",
          playerList: "[]",
        }[info] ?? "0";
      return `(await fetch("https://api.mcsrvstat.us/${ctx.raw("edition") === "bedrock" ? "bedrock/3" : "3"}/" + ${ctx.input("address")})
    .then(res => res.json())
    .then(json => ${pick})
    .catch(() => ${fallback}))`;
    },
  }),
  minecraft.check({
    id: "minecraft_server_image",
    label: "Picture of a Minecraft server",
    description:
      "A link to a Java server's icon (64x64), or a banner showing its live status and player count.",
    icon: "fa-solid fa-image",
    keywords: ["icon", "banner", "image", "status"],
    block: {
      type: "minecraft_serverImage",
      text: "Minecraft server {type} image URL of address: {address}",
      parts: { address: { check: "String" } },
      inline: false,
      tooltip:
        "A link to a Java server's icon (64x64), or to a banner image showing its live status and player count. Great inside embeds.",
    },
    output: "String",
    inputs: [
      input.dropdown("type", "Kind of picture", [
        ["icon", "icon"],
        ["status banner", "banner"],
      ]),
      input.text("address", "Server address", {
        default: "",
        placeholder: "play.example.com",
      }),
    ],
    code: (ctx) =>
      `("${ctx.raw("type") === "banner" ? "https://api.mcstatus.io/v2/widget/java/" : "https://api.mcsrvstat.us/icon/"}" + encodeURIComponent(String(${ctx.input("address")}).trim()))`,
  }),
  minecraft.check({
    id: "minecraft_latest_version",
    label: "Latest Minecraft version",
    description: "The newest Minecraft: Java Edition version number.",
    icon: "fa-solid fa-code-branch",
    keywords: ["version", "release", "snapshot", "update"],
    block: {
      type: "minecraft_latestVersion",
      text: "latest Minecraft {type} version",
      tooltip: "The newest Minecraft: Java Edition version number",
    },
    output: "String",
    inputs: [
      input.dropdown("type", "Kind", [
        ["release", "release"],
        ["snapshot", "snapshot"],
      ]),
    ],
    code: (
      ctx,
    ) => `(await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json")
    .then(res => res.json())
    .then(json => json.latest?.${ctx.raw("type") === "snapshot" ? "snapshot" : "release"} ?? null)
    .catch(() => null))`,
  }),
];

/* ---- Minecraft events ------------------------------------------------- */

const events = [
  minecraft.watcher({
    id: "minecraft_server_status",
    label: "When a Minecraft server goes online or offline",
    description:
      "Runs when a server comes online or goes down, for status channels. It's checked every few minutes.",
    icon: "fa-solid fa-power-off",
    keywords: ["status", "online", "offline", "down", "uptime"],
    variable: "minecraftServerInformation",
    fields: [],
    extraValues: MINECRAFT_SERVER_VALUES,
    block: {
      type: "minecraft_onServerStatus",
      text: [
        "when Minecraft {edition} server: {address}",
        "goes {status}",
        "check every (minutes): {minutes}",
      ],
      parts: { address: { check: "String" } },
      tooltip:
        'Runs when a server comes online or goes down — great for status channels. Use "get ... of Minecraft server" inside it. The server is checked every few minutes (at least 1).',
    },
    settings: [
      input.dropdown("edition", "Edition", [
        ["Java", "java"],
        ["Bedrock", "bedrock"],
      ]),
      input.text("address", "Server address", {
        default: "",
        placeholder: "play.example.com",
        allowValues: false,
      }),
      input.dropdown("status", "When it goes", [
        ["online", "online"],
        ["offline", "offline"],
      ]),
      minutesInput(),
    ],
    watch: (ctx, body) => `(() => {
  let wasOnline = null;
  const check = async () => {
    try {
      const minecraftServer = await fetch("https://api.mcsrvstat.us/${ctx.raw("edition") === "bedrock" ? "bedrock/3" : "3"}/" + ${ctx.input("address")}).then(res => res.json());
      const online = !!minecraftServer.online;
      const changed = wasOnline !== null && online !== wasOnline;
      wasOnline = online;
      if (!changed || online !== ${ctx.raw("status") !== "offline"}) return;

      const minecraftServerInformation = Object.assign({}, minecraftServer, {
        motd: minecraftServer.motd?.clean?.join("\\n") || "",
        playersOnline: minecraftServer.players?.online ?? 0,
        playersMax: minecraftServer.players?.max ?? 0,
        playerList: minecraftServer.players?.list ?? [],
        iconUrl: minecraftServer.icon || null
      });
      ${body}} catch (error) {
      console.error("Error checking Minecraft server:", error);
    }
  };
  setTimeout(check, 5000);
  setInterval(check, Math.max(1, Number(${ctx.input("minutes")}) || 5) * 60 * 1000);
})();\n`,
  }),
];

export default {
  events,
  actions,
  values,
  components: [],
  contexts: [],
  blocks: [],
};
