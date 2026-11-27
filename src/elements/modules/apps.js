/* =====================================================================
   Builder catalog: apps: Scratch, Roblox, Minecraft, captchas and web requests
   ---------------------------------------------------------------------
   Looking things up on other sites (Scratch, Roblox, Minecraft),
   making captchas, and sending web requests to any site.

   Lookups run the steps inside once the answer comes back, with what was
   found. If nothing was found, the steps inside don't run.
   ===================================================================== */

import {
  ALLOWED_MENTIONS,
  formatEmbeds,
} from "../../blocks/lib/generatorUtils.js";
import { ANY, group, input } from "../define.js";

const { action, value, block } = group({ colour: "#e2231a" });

/* What a Roblox user lookup provides (also "get Roblox user with ID", in social/roblox_minecraft.js). */
export const ROBLOX_USER_VALUES = [
  {
    key: "name",
    label: "Username",
    type: "String",
    code: "robloxUserInformation.name",
  },
  {
    key: "displayName",
    label: "Display name",
    type: "String",
    code: "robloxUserInformation.displayName",
  },
  {
    key: "description",
    label: "About",
    type: "String",
    code: "robloxUserInformation.description",
  },
  {
    key: "id",
    label: "User ID",
    type: "Number",
    code: "robloxUserInformation.id",
  },
  {
    key: "created",
    label: "Join date",
    type: "String",
    code: "robloxUserInformation.created",
  },
  {
    key: "isBanned",
    label: "Is banned?",
    type: "Boolean",
    code: "robloxUserInformation.isBanned",
  },
  {
    key: "hasVerifiedBadge",
    label: "Has the verified badge?",
    type: "Boolean",
    code: "robloxUserInformation.hasVerifiedBadge",
  },
  {
    key: "friendsCount",
    label: "Number of friends",
    type: "Number",
    code: "robloxUserInformation.friendsCount",
  },
  {
    key: "followersCount",
    label: "Number of followers",
    type: "Number",
    code: "robloxUserInformation.followersCount",
  },
  {
    key: "followingCount",
    label: "Number following",
    type: "Number",
    code: "robloxUserInformation.followingCount",
  },
  {
    key: "avatarUrl",
    label: "Avatar picture link",
    type: "String",
    code: "robloxUserInformation.avatarUrl",
  },
  {
    key: "profileUrl",
    label: "Profile link",
    type: "String",
    code: "robloxUserInformation.profileUrl",
  },
];

/* What a Minecraft server lookup provides (also "when a Minecraft server goes online"). */
export const MINECRAFT_SERVER_VALUES = [
  {
    key: "online",
    label: "Is online?",
    type: "Boolean",
    code: "minecraftServerInformation.online",
  },
  {
    key: "motd",
    label: "Message of the day",
    type: "String",
    code: "minecraftServerInformation.motd",
  },
  {
    key: "playersOnline",
    label: "Players online",
    type: "Number",
    code: "minecraftServerInformation.playersOnline",
  },
  {
    key: "playersMax",
    label: "Max players",
    type: "Number",
    code: "minecraftServerInformation.playersMax",
  },
  {
    key: "playerList",
    label: "Names of players online (list)",
    type: "Array",
    code: "minecraftServerInformation.playerList",
    description: "Some servers hide this.",
  },
  {
    key: "version",
    label: "Version",
    type: "String",
    code: "minecraftServerInformation.version",
  },
  {
    key: "hostname",
    label: "Hostname",
    type: "String",
    code: "minecraftServerInformation.hostname",
  },
  {
    key: "ip",
    label: "IP address",
    type: "String",
    code: "minecraftServerInformation.ip",
  },
  {
    key: "port",
    label: "Port",
    type: "Number",
    code: "minecraftServerInformation.port",
  },
  {
    key: "iconUrl",
    label: "Server icon",
    type: "String",
    code: "minecraftServerInformation.iconUrl",
    description: "The picture as data, not a link.",
  },
];

/* A Roblox user's ID from their username, or null. */
const userIdOf = (username) =>
  `fetch("https://users.roblox.com/v1/usernames/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usernames: [${username}] }) })
    .then(async (res) => res.json())
    .then(async (json) => json.data[0]?.id ?? null)`;

/* A Minecraft (Mojang) profile from a username, or null. */
const mojangProfileOf = (username) =>
  `fetch("https://api.mojang.com/users/profiles/minecraft/" + encodeURIComponent(${username}))
    .then(res => res.ok ? res.json() : null)`;

const CAPTCHA = {
  package: "@ddededodediamante/captcha-generator",
  code: `const { Captcha } = require("@ddededodediamante/captcha-generator");`,
};

const events = [];

const actions = [
  action({
    id: "scratch_profile",
    label: "Look up a Scratch profile",
    description: "Finds a Scratch user's profile.",
    category: "apps",
    group: "Scratch",
    icon: "fa-solid fa-cat",
    keywords: ["scratch", "profile", "user"],
    block: {
      type: "scratch_getprofile",
      text: ["get Scratch profile of user: {username}", "then {code}"],
      parts: { code: { check: "default" } },
      colour: "#e6a53e",
    },
    inputs: [input.text("username", "Scratch username", { default: "" })],
    branches: [
      {
        key: "code",
        label: "With the profile",
        provides: [
          {
            key: "profile_bio",
            label: "About me",
            type: "String",
            code: "scratchUserProfileInformation.profile.bio",
          },
          {
            key: "profile_country",
            label: "Country",
            type: "String",
            code: "scratchUserProfileInformation.profile.country",
          },
          {
            key: "profile_status",
            label: "What I'm working on",
            type: "String",
            code: "scratchUserProfileInformation.profile.status",
          },
          {
            key: "history_joined",
            label: "Join date",
            type: "String",
            code: "scratchUserProfileInformation.history.joined",
          },
          {
            key: "profile_images_90x90_",
            label: "Profile picture link",
            type: "String",
            code: "scratchUserProfileInformation.profile.images['90x90']",
          },
          {
            key: "scratchteam",
            label: "Is on the Scratch Team?",
            type: "Boolean",
            code: "scratchUserProfileInformation.scratchteam",
          },
        ],
        valuesBlock: {
          type: "scratch_getprofileinfo",
          text: "get {info} of Scratch profile",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["bio", "profile.bio"],
                ["country", "profile.country"],
                ["status", "profile.status"],
                ["join date", "history.joined"],
                ["profile picture (90x90)", "profile.images['90x90']"],
                ["is part of the Scratch Team", "scratchteam"],
              ],
            },
          },
          colour: "#e6a53e",
          pick: {
            field: "info",
            keys: {
              "profile.bio": "profile_bio",
              "profile.country": "profile_country",
              "profile.status": "profile_status",
              "history.joined": "history_joined",
              "profile.images['90x90']": "profile_images_90x90_",
            },
          },
        },
      },
    ],
    code: (ctx) => {
      var user = ctx.input("username");
      var code = ctx.branch("code");

      return `await fetch('https://api.scratch.mit.edu/users/' + ${user})
  .then(async (response) => response.json())
  .then(async (scratchUserProfileInformation) => {
    ${code}})
  .catch(async (error) => console.error('Error fetching Scratch user profile:', error));`;
    },
  }),
  action({
    id: "roblox_user",
    label: "Look up a Roblox user",
    description: "Finds a Roblox user by their username.",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-user",
    keywords: ["roblox", "user", "profile"],
    block: {
      type: "roblox_getUser",
      text: ["get Roblox user: {username}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip:
        "Looks up a Roblox user by their username, then runs the blocks inside",
    },
    inputs: [input.text("username", "Roblox username", { default: "" })],
    branches: [
      {
        key: "code",
        label: "With the user",
        provides: ROBLOX_USER_VALUES,
        valuesBlock: {
          type: "roblox_userInfo",
          text: "get {info} of Roblox user",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["username", "name"],
                ["display name", "displayName"],
                ["description", "description"],
                ["user ID", "id"],
                ["join date", "created"],
                ["is banned", "isBanned"],
                ["has verified badge", "hasVerifiedBadge"],
                ["friends count", "friendsCount"],
                ["followers count", "followersCount"],
                ["following count", "followingCount"],
                ["avatar image URL", "avatarUrl"],
                ["profile link", "profileUrl"],
              ],
            },
          },
          tooltip: "Information about the Roblox user you got",
          also: ["roblox_user_by_id"],
          pick: "info",
        },
      },
    ],
    code: (ctx) => {
      const username = ctx.input("username");
      const code = ctx.branch("code");

      return `await ${userIdOf(username)}
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

    ${code}})
  .catch(async (error) => console.error("Error fetching Roblox user:", error));`;
    },
  }),
  action({
    id: "roblox_group",
    label: "Look up a Roblox group",
    description: "Finds a Roblox group by its ID.",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-users",
    keywords: ["roblox", "group"],
    block: {
      type: "roblox_getGroup",
      text: ["get Roblox group with ID: {id}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip: "Looks up a Roblox group by its ID, then runs the blocks inside",
    },
    inputs: [
      input.number("id", "Group ID", { default: 0, min: 0, integer: true }),
    ],
    branches: [
      {
        key: "code",
        label: "With the group",
        provides: [
          {
            key: "name",
            label: "Group name",
            type: "String",
            code: "robloxGroupInformation.name",
          },
          {
            key: "description",
            label: "Description",
            type: "String",
            code: "robloxGroupInformation.description",
          },
          {
            key: "memberCount",
            label: "Number of members",
            type: "Number",
            code: "robloxGroupInformation.memberCount",
          },
          {
            key: "id",
            label: "Group ID",
            type: "Number",
            code: "robloxGroupInformation.id",
          },
          {
            key: "owner_username",
            label: "Owner's username",
            type: "String",
            code: "robloxGroupInformation.owner?.username",
          },
          {
            key: "owner_displayName",
            label: "Owner's display name",
            type: "String",
            code: "robloxGroupInformation.owner?.displayName",
          },
          {
            key: "owner_userId",
            label: "Owner's user ID",
            type: "Number",
            code: "robloxGroupInformation.owner?.userId",
          },
          {
            key: "publicEntryAllowed",
            label: "Anyone can join?",
            type: "Boolean",
            code: "robloxGroupInformation.publicEntryAllowed",
          },
          {
            key: "hasVerifiedBadge",
            label: "Has the verified badge?",
            type: "Boolean",
            code: "robloxGroupInformation.hasVerifiedBadge",
          },
          {
            key: "iconUrl",
            label: "Icon picture link",
            type: "String",
            code: "robloxGroupInformation.iconUrl",
          },
          {
            key: "groupUrl",
            label: "Group link",
            type: "String",
            code: "robloxGroupInformation.groupUrl",
          },
        ],
        valuesBlock: {
          type: "roblox_groupInfo",
          text: "get {info} of Roblox group",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["name", "name"],
                ["description", "description"],
                ["member count", "memberCount"],
                ["group ID", "id"],
                ["owner username", "owner?.username"],
                ["owner display name", "owner?.displayName"],
                ["owner user ID", "owner?.userId"],
                ["anyone can join", "publicEntryAllowed"],
                ["has verified badge", "hasVerifiedBadge"],
                ["icon image URL", "iconUrl"],
                ["group link", "groupUrl"],
              ],
            },
          },
          tooltip: "Information about the Roblox group you got",
          pick: {
            field: "info",
            keys: {
              "owner?.username": "owner_username",
              "owner?.displayName": "owner_displayName",
              "owner?.userId": "owner_userId",
            },
          },
        },
      },
    ],
    code: (ctx) => {
      const id = ctx.input("id");
      const code = ctx.branch("code");

      return `await fetch("https://groups.roblox.com/v1/groups/" + ${id})
  .then(async (res) => res.json())
  .then(async (robloxGroup) => {
    if (!robloxGroup || !robloxGroup.id) return;

    const robloxGroupIcon = await fetch("https://thumbnails.roblox.com/v1/groups/icons?groupIds=" + robloxGroup.id + "&size=420x420&format=Png")
      .then(async (res) => res.json())
      .then(async (json) => json.data[0]?.imageUrl)
      .catch(async () => null);

    const robloxGroupInformation = Object.assign({}, robloxGroup, {
      iconUrl: robloxGroupIcon,
      groupUrl: "https://www.roblox.com/groups/" + robloxGroup.id
    });

    ${code}})
  .catch(async (error) => console.error("Error fetching Roblox group:", error));`;
    },
  }),
  action({
    id: "roblox_game",
    label: "Look up a Roblox game",
    description:
      "Finds a Roblox game by its place ID (the number in the game's link).",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-gamepad",
    keywords: ["roblox", "game", "experience", "place"],
    block: {
      type: "roblox_getGame",
      text: ["get Roblox game with place ID: {id}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip:
        "Looks up a Roblox game by the place ID in its link, then runs the blocks inside",
    },
    inputs: [
      input.number("id", "Place ID", { default: 0, min: 0, integer: true }),
    ],
    branches: [
      {
        key: "code",
        label: "With the game",
        provides: [
          {
            key: "name",
            label: "Game name",
            type: "String",
            code: "robloxGameInformation.name",
          },
          {
            key: "description",
            label: "Description",
            type: "String",
            code: "robloxGameInformation.description",
          },
          {
            key: "playing",
            label: "Players right now",
            type: "Number",
            code: "robloxGameInformation.playing",
          },
          {
            key: "visits",
            label: "Total visits",
            type: "Number",
            code: "robloxGameInformation.visits",
          },
          {
            key: "favoritedCount",
            label: "Favorites",
            type: "Number",
            code: "robloxGameInformation.favoritedCount",
          },
          {
            key: "maxPlayers",
            label: "Max players per server",
            type: "Number",
            code: "robloxGameInformation.maxPlayers",
          },
          {
            key: "price",
            label: "Price",
            type: "Number",
            code: "robloxGameInformation.price",
            description: "Empty if the game is free.",
          },
          {
            key: "creator_name",
            label: "Creator's name",
            type: "String",
            code: "robloxGameInformation.creator?.name",
          },
          {
            key: "creator_type",
            label: "Made by a User or a Group",
            type: "String",
            code: "robloxGameInformation.creator?.type",
          },
          {
            key: "created",
            label: "Date made",
            type: "String",
            code: "robloxGameInformation.created",
          },
          {
            key: "updated",
            label: "Last updated",
            type: "String",
            code: "robloxGameInformation.updated",
          },
          {
            key: "rootPlaceId",
            label: "Place ID",
            type: "Number",
            code: "robloxGameInformation.rootPlaceId",
          },
          {
            key: "iconUrl",
            label: "Icon picture link",
            type: "String",
            code: "robloxGameInformation.iconUrl",
          },
          {
            key: "gameUrl",
            label: "Game link",
            type: "String",
            code: "robloxGameInformation.gameUrl",
          },
          {
            key: "likes",
            label: "Likes",
            type: "Number",
            code: "robloxGameInformation.likes",
          },
          {
            key: "dislikes",
            label: "Dislikes",
            type: "Number",
            code: "robloxGameInformation.dislikes",
          },
          {
            key: "likeRatio",
            label: "Like percentage",
            type: "Number",
            code: "robloxGameInformation.likeRatio",
          },
          {
            key: "genre",
            label: "Genre",
            type: "String",
            code: "robloxGameInformation.genre",
          },
          {
            key: "universeId",
            label: "Universe ID",
            type: "Number",
            code: "robloxGameInformation.universeId",
          },
          {
            key: "thumbnailUrl",
            label: "Thumbnail picture link",
            type: "String",
            code: "robloxGameInformation.thumbnailUrl",
          },
        ],
        valuesBlock: {
          type: "roblox_gameInfo",
          text: "get {info} of Roblox game",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["name", "name"],
                ["description", "description"],
                ["players right now", "playing"],
                ["total visits", "visits"],
                ["favorites", "favoritedCount"],
                ["likes", "likes"],
                ["dislikes", "dislikes"],
                ["like percentage", "likeRatio"],
                ["genre", "genre"],
                ["max players", "maxPlayers"],
                ["price", "price"],
                ["creator name", "creator?.name"],
                ["creator type", "creator?.type"],
                ["created date", "created"],
                ["last updated date", "updated"],
                ["place ID", "rootPlaceId"],
                ["universe ID", "universeId"],
                ["icon image URL", "iconUrl"],
                ["thumbnail image URL", "thumbnailUrl"],
                ["game link", "gameUrl"],
              ],
            },
          },
          tooltip: "Information about the Roblox game you got",
          pick: {
            field: "info",
            keys: {
              "creator?.name": "creator_name",
              "creator?.type": "creator_type",
            },
          },
        },
      },
    ],
    code: (ctx) => {
      const id = ctx.input("id");
      const code = ctx.branch("code");

      return `await fetch("https://apis.roblox.com/universes/v1/places/" + ${id} + "/universe")
  .then(async (res) => res.json())
  .then(async (json) => json.universeId)
  .then(async (robloxUniverseId) => {
    if (!robloxUniverseId) return;

    const [robloxGame, robloxGameIcon, robloxGameVotes, robloxGameThumbnail] = await Promise.all([
      fetch("https://games.roblox.com/v1/games?universeIds=" + robloxUniverseId).then(async (res) => res.json()).then(async (json) => json.data[0]).catch(async () => null),
      fetch("https://thumbnails.roblox.com/v1/games/icons?universeIds=" + robloxUniverseId + "&size=512x512&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl).catch(async () => null),
      fetch("https://games.roblox.com/v1/games/votes?universeIds=" + robloxUniverseId).then(async (res) => res.json()).then(async (json) => json.data[0] ?? {}).catch(async () => ({})),
      fetch("https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=" + robloxUniverseId + "&size=768x432&format=Png&countPerUniverse=1").then(async (res) => res.json()).then(async (json) => json.data[0]?.thumbnails?.[0]?.imageUrl).catch(async () => null)
    ]);

    if (!robloxGame) return;

    const robloxGameInformation = Object.assign({}, robloxGame, {
      iconUrl: robloxGameIcon,
      thumbnailUrl: robloxGameThumbnail ?? null,
      gameUrl: "https://www.roblox.com/games/" + robloxGame.rootPlaceId,
      universeId: robloxUniverseId,
      likes: robloxGameVotes.upVotes ?? 0,
      dislikes: robloxGameVotes.downVotes ?? 0,
      likeRatio: (robloxGameVotes.upVotes ?? 0) + (robloxGameVotes.downVotes ?? 0) ? Math.round((robloxGameVotes.upVotes / (robloxGameVotes.upVotes + robloxGameVotes.downVotes)) * 100) : 0
    });

    ${code}})
  .catch(async (error) => console.error("Error fetching Roblox game:", error));`;
    },
  }),
  action({
    id: "minecraft_user",
    label: "Look up a Minecraft player",
    description: "Finds a Minecraft Java player by their username.",
    category: "apps",
    group: "Minecraft",
    icon: "fa-solid fa-cube",
    keywords: ["minecraft", "player", "user", "skin"],
    block: {
      type: "minecraft_getUser",
      text: ["get Minecraft user: {username}", "then {code}"],
      parts: { code: { check: "default" } },
      colour: "#5A8F3C",
      tooltip:
        "Looks up a Minecraft (Java Edition) account by username, then runs the blocks inside",
    },
    inputs: [input.text("username", "Minecraft username", { default: "" })],
    branches: [
      {
        key: "code",
        label: "With the player",
        provides: [
          {
            key: "name",
            label: "Username",
            type: "String",
            code: "minecraftUserInformation.name",
          },
          {
            key: "uuid",
            label: "UUID",
            type: "String",
            code: "minecraftUserInformation.uuid",
          },
          {
            key: "id",
            label: "ID (no dashes)",
            type: "String",
            code: "minecraftUserInformation.id",
          },
          {
            key: "skinUrl",
            label: "Skin file link",
            type: "String",
            code: "minecraftUserInformation.skinUrl",
          },
          {
            key: "capeUrl",
            label: "Cape file link",
            type: "String",
            code: "minecraftUserInformation.capeUrl",
            description: "Empty if they don't have a cape.",
          },
          {
            key: "skinModel",
            label: "Skin model (classic or slim)",
            type: "String",
            code: "minecraftUserInformation.skinModel",
          },
          {
            key: "avatarUrl",
            label: "Face picture link",
            type: "String",
            code: "minecraftUserInformation.avatarUrl",
          },
          {
            key: "bodyUrl",
            label: "Full body picture link",
            type: "String",
            code: "minecraftUserInformation.bodyUrl",
          },
          {
            key: "profileUrl",
            label: "Profile link",
            type: "String",
            code: "minecraftUserInformation.profileUrl",
          },
        ],
        valuesBlock: {
          type: "minecraft_userInfo",
          text: "get {info} of Minecraft user",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["username", "name"],
                ["UUID", "uuid"],
                ["ID (no dashes)", "id"],
                ["skin texture URL", "skinUrl"],
                ["cape texture URL", "capeUrl"],
                ["skin model (classic or slim)", "skinModel"],
                ["avatar image URL", "avatarUrl"],
                ["full body render URL", "bodyUrl"],
                ["profile link", "profileUrl"],
              ],
            },
          },
          tooltip: "Information about the Minecraft user you got",
          colour: "#5A8F3C",
          pick: "info",
        },
      },
    ],
    code: (ctx) => {
      const username = ctx.input("username");
      const code = ctx.branch("code");

      return `await ${mojangProfileOf(username)}
  .then(async (minecraftProfile) => {
    if (!minecraftProfile) return;

    const minecraftTextures = await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + minecraftProfile.id)
      .then(res => res.json())
      .then(json => JSON.parse(Buffer.from(json.properties?.find(p => p.name === "textures")?.value || "", "base64").toString() || "{}"))
      .catch(() => ({}));

    const minecraftUserInformation = {
      id: minecraftProfile.id,
      uuid: minecraftProfile.id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"),
      name: minecraftProfile.name,
      skinUrl: minecraftTextures.textures?.SKIN?.url || null,
      capeUrl: minecraftTextures.textures?.CAPE?.url || null,
      skinModel: minecraftTextures.textures?.SKIN?.metadata?.model === "slim" ? "slim (Alex)" : "classic (Steve)",
      avatarUrl: "https://crafatar.com/avatars/" + minecraftProfile.id,
      bodyUrl: "https://crafatar.com/renders/body/" + minecraftProfile.id,
      profileUrl: "https://namemc.com/profile/" + minecraftProfile.id
    };

    ${code}})
  .catch(error => console.error("Error fetching Minecraft user:", error));`;
    },
  }),
  action({
    id: "minecraft_server",
    label: "Look up a Minecraft server",
    description:
      "Checks a Minecraft server by its address: if it's online, who's playing and more.",
    category: "apps",
    group: "Minecraft",
    icon: "fa-solid fa-server",
    keywords: ["minecraft", "server", "status", "players", "ping"],
    block: {
      type: "minecraft_getServer",
      text: [
        "get Minecraft {edition} server with address: {address}",
        "then {code}",
      ],
      parts: { code: { check: "default" } },
      colour: "#5A8F3C",
      tooltip:
        "Looks up a Minecraft server's live status by its address (e.g. play.hypixel.net, optionally with :port), then runs the blocks inside",
      helpUrl: "https://api.mcsrvstat.us/",
    },
    inputs: [
      input.dropdown(
        "edition",
        "Edition",
        [
          ["Java", "java"],
          ["Bedrock", "bedrock"],
        ],
        { default: "java" },
      ),
      input.text("address", "Server address", {
        default: "",
        placeholder: "play.example.com",
      }),
    ],
    branches: [
      {
        key: "code",
        label: "With the server",
        provides: MINECRAFT_SERVER_VALUES,
        valuesBlock: {
          type: "minecraft_serverInfo",
          text: "get {info} of Minecraft server",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["is online", "online"],
                ["MOTD (message of the day)", "motd"],
                ["players online", "playersOnline"],
                ["max players", "playersMax"],
                ["list of online player names", "playerList"],
                ["version", "version"],
                ["hostname", "hostname"],
                ["IP address", "ip"],
                ["port", "port"],
                ["icon (base64 image)", "iconUrl"],
              ],
            },
          },
          tooltip: "Information about the Minecraft server you got",
          also: ["minecraft_server_status"],
          colour: "#5A8F3C",
          pick: "info",
        },
      },
    ],
    code: (ctx) => {
      const address = ctx.input("address");
      const edition = ctx.raw("edition");
      const code = ctx.branch("code");
      const path = edition === "bedrock" ? "bedrock/3" : "3";

      return `await fetch("https://api.mcsrvstat.us/${path}/" + ${address})
  .then(res => res.json())
  .then(async (minecraftServer) => {
    const minecraftServerInformation = Object.assign({}, minecraftServer, {
      motd: minecraftServer.motd?.clean?.join("\\n") || "",
      playersOnline: minecraftServer.players?.online ?? 0,
      playersMax: minecraftServer.players?.max ?? 0,
      playerList: minecraftServer.players?.list ?? [],
      iconUrl: minecraftServer.icon || null
    });

    ${code}})
  .catch(error => console.error("Error fetching Minecraft server:", error));`;
    },
  }),
  action({
    id: "captcha_make",
    label: "Make a captcha",
    description:
      "Makes a captcha picture with random letters, to check someone is a real person. Send the picture in a message, then compare their answer with the captcha text.",
    category: "apps",
    group: "Captcha",
    icon: "fa-solid fa-robot",
    keywords: ["captcha", "verify", "verification", "human check"],
    block: {
      type: "captcha_create_mutator",
      text: "create new captcha",
      colour: "#0fbd8c",
      mutator: {
        options: "captcha_create_mutator_options",
        fields: [
          {
            name: "width",
            label: "include width",
            inputType: "value",
            inputLabel: "width:",
            valueCheck: "Number",
          },
          {
            name: "height",
            label: "include height",
            inputType: "value",
            inputLabel: "height:",
            valueCheck: "Number",
          },
          {
            name: "backgroundcolor",
            label: "include background color",
            inputType: "value",
            inputLabel: "background color:",
            valueCheck: "Colour",
          },
          {
            name: "textcolor",
            label: "include text color",
            inputType: "value",
            inputLabel: "text color:",
            valueCheck: "Colour",
          },
          {
            name: "font",
            label: "include font",
            inputType: "value",
            inputLabel: "font:",
            valueCheck: "String",
          },
          {
            name: "fontsize",
            label: "include font size",
            inputType: "value",
            inputLabel: "font size:",
            valueCheck: "Number",
          },
          {
            name: "characters",
            label: "include characters",
            inputType: "value",
            inputLabel: "characters:",
            valueCheck: "String",
          },
          {
            name: "charlength",
            label: "include character length",
            inputType: "value",
            inputLabel: "amount of characters:",
            valueCheck: "Number",
          },
          {
            name: "noiselines",
            label: "include noise lines",
            inputType: "value",
            inputLabel: "noise lines:",
            valueCheck: "Number",
          },
          {
            name: "noisedots",
            label: "include noise dots",
            inputType: "value",
            inputLabel: "noise dots:",
            valueCheck: "Number",
          },
          {
            name: "noisecolor",
            label: "include noise color",
            inputType: "value",
            inputLabel: "noise color:",
            valueCheck: "Colour",
          },
        ],
      },
    },
    inputs: [
      input.number("charlength", "Number of letters", {
        optional: true,
        min: 1,
        max: 20,
        integer: true,
      }),
      input.text("characters", "Letters to pick from (optional)", {
        default: "",
        placeholder: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
      }),
      input.number("width", "Width", {
        optional: true,
        min: 50,
        integer: true,
      }),
      input.number("height", "Height", {
        optional: true,
        min: 30,
        integer: true,
      }),
      input.colour("backgroundcolor", "Background color", {
        default: "#ffffff",
      }),
      input.colour("textcolor", "Letter color", { default: "#000000" }),
      input.text("font", "Font (optional)", { default: "" }),
      input.number("fontsize", "Letter size", {
        optional: true,
        min: 8,
        integer: true,
      }),
      input.number("noiselines", "Scribble lines", {
        optional: true,
        min: 0,
        integer: true,
      }),
      input.number("noisedots", "Noise dots", {
        optional: true,
        min: 0,
        integer: true,
      }),
      input.colour("noisecolor", "Scribble color", { default: "#888888" }),
    ],
    branches: [
      {
        key: "then",
        label: "After it's made",
        provides: [
          {
            key: "text",
            label: "Captcha text",
            type: "String",
            code: "captcha@@.text",
            description: "The letters in the picture.",
            block: {
              type: "captcha_value",
              text: "get text of captcha",
              colour: "#0fbd8c",
              tooltip: "Gets the text of the captcha",
              restrictions: [
                {
                  type: "hasBlockInParent",
                  blockTypes: ["captcha_create", "captcha_create_mutator"],
                  message:
                    'This block must be used AFTER a "create new captcha" block',
                },
              ],
            },
          },
          {
            key: "picture",
            label: "Captcha picture",
            type: "buffer",
            code: "captcha@@.buffer",
            description: "Add it to a message as a file.",
          },
        ],
      },
    ],
    dependencies: [CAPTCHA],
    code: (ctx) => {
      const map = {
        width: "width",
        height: "height",
        backgroundcolor: "backgroundColor",
        textcolor: "textColor",
        font: "font",
        fontsize: "fontSize",
        characters: "characters",
        charlength: "charLength",
        noiselines: "noiseLines",
        noisedots: "noiseDots",
        noisecolor: "noiseColor",
      };
      const options = Object.entries(map)
        .filter(([key]) => ctx.has(key))
        .map(([key, name]) => `${name}: ${ctx.input(key)}`);
      return `{\nconst ${ctx.local("captcha")} = new Captcha(${options.length ? `{ ${options.join(", ")} }` : ""}).generate("image/png");\n${ctx.branch("then")}}\n`;
    },
  }),
  action({
    id: "web_request",
    label: "Send a web request",
    description:
      "Asks a website or API for something, or sends it data, then runs the steps inside with its answer.",
    category: "apps",
    group: "Web requests",
    icon: "fa-solid fa-globe",
    keywords: [
      "fetch",
      "http",
      "api",
      "request",
      "get",
      "post",
      "axios",
      "webhook url",
    ],
    block: [
      {
        type: "fetch_send",
        text: ["send {method} request", "URL: {url}", "then: {then}"],
        parts: {
          method: {
            options: [
              ["GET", "get"],
              ["POST", "post"],
              ["PATCH", "patch"],
              ["DELETE", "delete"],
            ],
          },
          then: { check: "default" },
        },
        colour: "#0fbd8c",
        tooltip: "Sends a fetch request to a url",
      },
      {
        type: "fetch_sendAdvanced",
        text: [
          "send {method} request",
          "URL: {url}",
          "configs: {config}",
          "then: {then}",
        ],
        parts: {
          method: {
            options: [
              ["GET", "get"],
              ["POST", "post"],
              ["PATCH", "patch"],
              ["DELETE", "delete"],
            ],
          },
          config: { check: "requestConfigSection" },
          then: { check: "default" },
        },
        colour: "#0fbd8c",
        tooltip: "Sends a fetch request to a url",
      },
    ],
    inputs: [
      input.dropdown(
        "method",
        "Kind",
        [
          ["GET (read)", "get"],
          ["POST (send)", "post"],
          ["PUT (replace)", "put"],
          ["PATCH (change)", "patch"],
          ["DELETE (remove)", "delete"],
        ],
        { default: "get" },
      ),
      input.text("url", "Link", {
        default: "",
        placeholder: "https://api.example.com/...",
      }),
      input.slot("body", "Data to send (optional)", ANY, {
        optional: true,
        showIf: { method: ["post", "put", "patch", "delete"] },
      }),
      input.group(
        "headers",
        "Headers",
        [
          input.text("name", "Name", { allowValues: false }),
          input.text("value", "Value"),
        ],
        { itemLabel: "Header" },
      ),
      input.group(
        "config",
        "Other request settings",
        [
          input.text("key", "Setting", {
            allowValues: false,
            placeholder: "timeout",
          }),
          input.slot("value", "Value", ANY),
        ],
        {
          itemLabel: "Setting",
          help: "Anything else axios accepts, like timeout or params.",
          block: {
            type: "fetch_configSection",
            text: ["add config: {key}", "with value: {value}"],
            parts: {
              key: { part: "value", check: "String" },
              value: { check: null },
            },
            colour: "#0fbd8c",
            tooltip: "Sends a fetch request to a url",
            previous: "requestConfigSection",
            next: "requestConfigSection",
          },
        },
      ),
    ],
    branches: [
      {
        key: "then",
        label: "With the answer",
        provides: [
          {
            key: "data",
            label: "Answer data",
            type: ANY,
            code: "response@@.data",
            description: "What the site sent back. Often an object.",
            block: {
              type: "fetch_responseData",
              text: "data of the response",
              colour: "#0fbd8c",
              output: "object",
            },
          },
          {
            key: "status",
            label: "Status code",
            type: "Number",
            code: "response@@.status",
            description: "200 means it worked. 404 means not found.",
            block: {
              type: "fetch_responseStatus",
              text: "status of the response",
              colour: "#0fbd8c",
            },
          },
          {
            key: "headers",
            label: "Answer headers",
            type: "object",
            code: "response@@.headers",
            block: {
              type: "fetch_responseHeaders",
              text: "headers of the response",
              colour: "#0fbd8c",
            },
          },
        ],
      },
    ],
    dependencies: ["axios"],
    code: (ctx) => {
      const parts = [
        `url: ${ctx.input("url")}`,
        `method: ${ctx.input("method")}`,
        "validateStatus: () => true",
      ];
      if (ctx.raw("method") !== "get" && ctx.has("body"))
        parts.push(`data: ${ctx.input("body")}`);
      const headers = ctx
        .group("headers")
        .filter((h) => h.has("name"))
        .map((h) => `[${h.input("name")}]: ${h.input("value")}`);
      if (headers.length) parts.push(`headers: { ${headers.join(", ")} }`);
      for (const item of ctx.group("config")) {
        const key = String(item.raw("key") ?? "").trim();
        if (/^[A-Za-z_$][\w$]*$/.test(key))
          parts.push(
            `${key}: ${item.has("value") ? item.input("value") : "undefined"}`,
          );
      }
      return `{\nconst ${ctx.local("response")} = await axios({ ${parts.join(", ")} });\n${ctx.branch("then")}}\n`;
    },
  }),
];

const values = [
  value({
    id: "scratch_messages",
    label: "Scratch messages waiting",
    description: "How many unread messages a Scratch user has.",
    category: "apps",
    group: "Scratch",
    icon: "fa-solid fa-envelope",
    keywords: ["scratch", "messages", "notifications"],
    block: {
      type: "scratch_getmessages",
      text: "amount of messages of Scratch user: {username}",
      colour: "#e6a53e",
    },
    output: "Number",
    inputs: [input.text("username", "Scratch username", { default: "" })],
    code: (ctx) => {
      var user = ctx.input("username");

      return `await fetch('https://api.scratch.mit.edu/users/' + ${user} + '/messages/count')
  .then(async (response) => response.json())
  .then(async (json) => json['count'])
  .catch(async (error) => console.error('Error fetching Scratch user profile:', error))`;
    },
  }),
  value({
    id: "roblox_user_id",
    label: "Roblox user ID",
    description:
      "The ID of a Roblox user, from their username. Empty if there's no such user.",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-fingerprint",
    keywords: ["roblox", "user id"],
    block: {
      type: "roblox_userId",
      text: "user ID of Roblox user: {username}",
      tooltip: "The Roblox user ID belonging to a username",
    },
    output: "Number",
    inputs: [input.text("username", "Roblox username", { default: "" })],
    code: (ctx) => {
      const username = ctx.input("username");

      return `await ${userIdOf(username)}.catch(async () => null)`;
    },
  }),
  value({
    id: "roblox_avatar",
    label: "Roblox avatar picture",
    description: "A link to a picture of a Roblox user's avatar.",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-image-portrait",
    keywords: ["roblox", "avatar", "picture"],
    block: {
      type: "roblox_userAvatar",
      text: "avatar image URL of Roblox user: {username}",
      tooltip: "A link to the user's avatar image, great inside embeds",
    },
    output: "String",
    inputs: [input.text("username", "Roblox username", { default: "" })],
    code: (ctx) => {
      const username = ctx.input("username");

      return `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://thumbnails.roblox.com/v1/users/avatar?userIds=" + robloxId + "&size=420x420&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl) : null)
    .catch(async () => null)`;
    },
  }),
  value({
    id: "roblox_profile_link",
    label: "Roblox profile link",
    description: "A link to a Roblox user's profile.",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-link",
    keywords: ["roblox", "profile", "link"],
    block: {
      type: "roblox_profileLink",
      text: "profile link of Roblox user: {username}",
      tooltip: "A link to the user's Roblox profile page",
    },
    output: "String",
    inputs: [input.text("username", "Roblox username", { default: "" })],
    code: (ctx) => {
      const username = ctx.input("username");

      return `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? "https://www.roblox.com/users/" + robloxId + "/profile" : null)
    .catch(async () => null)`;
    },
  }),
  value({
    id: "roblox_in_group",
    label: "Roblox user is in a group?",
    description: "True if a Roblox user is a member of a group.",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-user-check",
    keywords: ["roblox", "group", "member"],
    block: {
      type: "roblox_userInGroup",
      text: ["Roblox user: {username}", "is in group with ID: {id}"],
      inline: true,
      tooltip: "Checks whether a Roblox user is a member of a group",
    },
    output: "Boolean",
    inputs: [
      input.text("username", "Roblox username", { default: "" }),
      input.number("id", "Group ID", { default: 0, min: 0, integer: true }),
    ],
    code: (ctx) => {
      const username = ctx.input("username");
      const id = ctx.input("id");

      return `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://groups.roblox.com/v1/users/" + robloxId + "/groups/roles").then(async (res) => res.json()).then(async (json) => json.data.some(entry => entry.group.id == ${id})) : false)
    .catch(async () => false)`;
    },
  }),
  value({
    id: "roblox_group_rank",
    label: "Roblox rank in a group",
    description:
      "The name of a Roblox user's rank in a group. \"Guest\" if they aren't in it.",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-ranking-star",
    keywords: ["roblox", "group", "rank", "role"],
    block: {
      type: "roblox_userGroupRank",
      text: ["rank of Roblox user: {username}", "in group with ID: {id}"],
      inline: true,
      tooltip:
        "The name of the user's role in a group, or 'Guest' if they aren't in it",
    },
    output: "String",
    inputs: [
      input.text("username", "Roblox username", { default: "" }),
      input.number("id", "Group ID", { default: 0, min: 0, integer: true }),
    ],
    code: (ctx) => {
      const username = ctx.input("username");
      const id = ctx.input("id");

      return `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://groups.roblox.com/v1/users/" + robloxId + "/groups/roles").then(async (res) => res.json()).then(async (json) => json.data.find(entry => entry.group.id == ${id})?.role?.name || "Guest") : "Guest")
    .catch(async () => "Guest")`;
    },
  }),
  value({
    id: "roblox_owns_gamepass",
    label: "Roblox user owns a game pass?",
    description: "True if a Roblox user owns a game pass.",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-ticket",
    keywords: ["roblox", "gamepass", "game pass", "owns"],
    block: {
      type: "roblox_ownsGamepass",
      text: ["Roblox user: {username}", "owns gamepass with ID: {id}"],
      inline: true,
      tooltip: "Checks whether a Roblox user owns a gamepass",
    },
    output: "Boolean",
    inputs: [
      input.text("username", "Roblox username", { default: "" }),
      input.number("id", "Game pass ID", { default: 0, min: 0, integer: true }),
    ],
    code: (ctx) => {
      const username = ctx.input("username");
      const id = ctx.input("id");

      return `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://inventory.roblox.com/v1/users/" + robloxId + "/items/GamePass/" + ${id} + "/is-owned").then(async (res) => res.text()).then(async (text) => text.trim() === "true") : false)
    .catch(async () => false)`;
    },
  }),
  value({
    id: "roblox_owns_badge",
    label: "Roblox user has a badge?",
    description: "True if a Roblox user has earned a badge.",
    category: "apps",
    group: "Roblox",
    icon: "fa-solid fa-award",
    keywords: ["roblox", "badge", "owns"],
    block: {
      type: "roblox_ownsBadge",
      text: ["Roblox user: {username}", "owns badge with ID: {id}"],
      inline: true,
      tooltip: "Checks whether a Roblox user has earned a badge",
    },
    output: "Boolean",
    inputs: [
      input.text("username", "Roblox username", { default: "" }),
      input.number("id", "Badge ID", { default: 0, min: 0, integer: true }),
    ],
    code: (ctx) => {
      const username = ctx.input("username");
      const id = ctx.input("id");

      return `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://inventory.roblox.com/v1/users/" + robloxId + "/items/Badge/" + ${id} + "/is-owned").then(async (res) => res.text()).then(async (text) => text.trim() === "true") : false)
    .catch(async () => false)`;
    },
  }),
  value({
    id: "minecraft_user_exists",
    label: "Minecraft username exists?",
    description: "True if a Minecraft Java account has this username.",
    category: "apps",
    group: "Minecraft",
    icon: "fa-solid fa-circle-question",
    keywords: ["minecraft", "exists", "username"],
    block: {
      type: "minecraft_userExists",
      text: ["Minecraft username {username}", "exists?"],
      colour: "#5A8F3C",
      inline: true,
      tooltip:
        "Checks whether a Minecraft (Java Edition) account has this username",
    },
    output: "Boolean",
    inputs: [input.text("username", "Minecraft username", { default: "" })],
    code: (ctx) => {
      const username = ctx.input("username");

      return `await ${mojangProfileOf(username)}.then(profile => !!profile).catch(() => false)`;
    },
  }),
  value({
    id: "minecraft_uuid",
    label: "Minecraft UUID",
    description: "The UUID of a Minecraft Java player.",
    category: "apps",
    group: "Minecraft",
    icon: "fa-solid fa-fingerprint",
    keywords: ["minecraft", "uuid", "id"],
    block: {
      type: "minecraft_userUUID",
      text: "UUID of Minecraft user: {username}",
      colour: "#5A8F3C",
      tooltip:
        "The Minecraft account UUID belonging to a username, or null if it doesn't exist",
    },
    output: "String",
    inputs: [input.text("username", "Minecraft username", { default: "" })],
    code: (ctx) => {
      const username = ctx.input("username");

      return `await ${mojangProfileOf(username)}
    .then(profile => profile ? profile.id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5") : null)
    .catch(() => null)`;
    },
  }),
  value({
    id: "minecraft_avatar",
    label: "Minecraft skin picture",
    description:
      "A link to a picture of a Minecraft player's skin: their face, head, body or the flat skin.",
    category: "apps",
    group: "Minecraft",
    icon: "fa-solid fa-image-portrait",
    keywords: ["minecraft", "skin", "avatar", "head", "render"],
    block: {
      type: "minecraft_userAvatar",
      text: "Minecraft {type} image URL of user: {username}",
      parts: {
        type: {
          options: [
            ["avatar (2D face)", "avatars"],
            ["head (3D render)", "renders/head"],
            ["full body (3D render)", "renders/body"],
            ["skin (2D, flat)", "skins"],
          ],
        },
      },
      colour: "#5A8F3C",
      inline: false,
      tooltip:
        "A link to an image built from the player's current skin, great inside embeds",
      helpUrl: "https://crafatar.com/",
    },
    output: "String",
    inputs: [
      input.dropdown(
        "type",
        "Picture",
        [
          ["Face", "avatars"],
          ["3D head", "renders/head"],
          ["3D body", "renders/body"],
          ["Flat skin", "skins"],
        ],
        { default: "avatars" },
      ),
      input.text("username", "Minecraft username", { default: "" }),
    ],
    code: (ctx) => `(await ${mojangProfileOf(ctx.input("username"))}
    .then((profile) => (profile ? "https://crafatar.com/${{ avatars: "avatars", "renders/head": "renders/head", "renders/body": "renders/body", skins: "skins" }[ctx.raw("type")] ?? "avatars"}/" + profile.id : null))
    .catch(() => null))`,
  }),
  value({
    id: "minecraft_server_online",
    label: "Minecraft server is online?",
    description: "True if a Minecraft server is up right now.",
    category: "apps",
    group: "Minecraft",
    icon: "fa-solid fa-signal",
    keywords: ["minecraft", "server", "online", "up"],
    block: {
      type: "minecraft_serverOnline",
      text: [
        "Minecraft {edition} server with address: {address}",
        "is online?",
      ],
      colour: "#5A8F3C",
      inline: true,
    },
    output: "Boolean",
    inputs: [
      input.dropdown(
        "edition",
        "Edition",
        [
          ["Java", "java"],
          ["Bedrock", "bedrock"],
        ],
        { default: "java" },
      ),
      input.text("address", "Server address", {
        default: "",
        placeholder: "play.example.com",
      }),
    ],
    code: (ctx) => {
      const address = ctx.input("address");
      const edition = ctx.raw("edition");
      const path = edition === "bedrock" ? "bedrock/3" : "3";

      return `await fetch("https://api.mcsrvstat.us/${path}/" + ${address})
    .then(res => res.json())
    .then(json => json.online ?? false)
    .catch(() => false)`;
    },
  }),
  value({
    id: "minecraft_player_online",
    label: "Player is on a Minecraft server?",
    description:
      "True if a player is on a Minecraft Java server right now. Some servers hide who's online.",
    category: "apps",
    group: "Minecraft",
    icon: "fa-solid fa-user-check",
    keywords: ["minecraft", "player", "online"],
    block: {
      type: "minecraft_isPlayerOnServer",
      text: [
        "Minecraft server with address: {address}",
        "has player online: {username}",
      ],
      colour: "#5A8F3C",
      inline: true,
      tooltip:
        "Not every server exposes its player list in its status ping — some will say false here even while the player is online",
    },
    output: "Boolean",
    inputs: [
      input.text("address", "Server address", {
        default: "",
        placeholder: "play.example.com",
      }),
      input.text("username", "Player's username", { default: "" }),
    ],
    code: (ctx) => {
      const address = ctx.input("address");
      const username = ctx.input("username");

      return `await fetch("https://api.mcsrvstat.us/3/" + ${address})
    .then(res => res.json())
    .then(json => (json.players?.list || []).some(name => name.toLowerCase() === (${username} || "").toLowerCase()))
    .catch(() => false)`;
    },
  }),
  value({
    id: "object_get",
    label: "Value of a key in an object",
    description:
      'What\'s stored under a key in an object, like "name" in { name: "Sam" }.',
    category: "objects",
    group: "Objects",
    icon: "fa-solid fa-key",
    keywords: ["object", "get key", "property", "json", "field"],
    block: {
      type: "object_getkey",
      text: ["get key: {key}", "from object: {object}"],
      parts: { object: { check: "object" } },
      colour: "#BA59CE",
      inline: true,
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["object"],
          message: "You must specify the object",
        },
      ],
    },
    output: ANY,
    inputs: [
      input.text("key", "Key", { default: "" }),
      input.slot("object", "From object", ["object", null]),
    ],
    code: (ctx) => `${ctx.input("object")}?.[${ctx.input("key")}]`,
  }),
];

const components = [];

const blocks = [
  block({
    type: "captcha_create",
    text: "create new captcha",
    colour: "#0fbd8c",
    previous: "default",
    next: "default",
    code: (ctx) => "let captcha = new Captcha().generate('image/png');\n",
  }),
  block({
    type: "captcha_addFile",
    text: "add captcha as file",
    colour: "#0fbd8c",
    previous: "files",
    next: "files",
    restrictions: [
      {
        type: "hasBlockInParent",
        blockTypes: ["captcha_create", "captcha_create_mutator"],
        message: 'This block must be used AFTER a "create new captcha" block',
      },
    ],
    code: (ctx) => {
      return `new Discord.AttachmentBuilder(captcha.buffer, { name: "captcha.png" }),\n`;
    },
  }),
  block({
    type: "captcha_send",
    pings: true,
    text: [
      "send captcha to channel: {channel}",
      "with content: {content}",
      "embed name(s): {embeds}",
      "rows: {rows}",
    ],
    parts: {
      channel: { part: "value", check: "channel" },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
    },
    colour: "#0fbd8c",
    tooltip: "Sends a captcha image in a channel",
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasBlockInParent",
        blockTypes: ["captcha_create", "captcha_create_mutator"],
        message: 'This block must be used AFTER a "create new captcha" block',
      },
      {
        type: "notEmpty",
        blockTypes: ["channel"],
        message: "You must specify the channel to send the captcha in",
      },
    ],
    code: (ctx) => {
      var channel = ctx.code("channel");
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");

      const code = `await ${channel}.send({
      ${ctx.allowedMentions()},
      files: [{ attachment: captcha.buffer, name: "captcha.png" }],
      content: ${content || "''"},
      embeds: [${embeds.replaceAll("'", "") || ""}],
      components: [
      ${rows}]
    });\n`;

      return code;
    },
  }),
  block({
    type: "captcha_reply",
    pings: true,
    text: [
      "reply captcha to message: {message}",
      "with content: {content}",
      "embed name(s): {embeds}",
      "rows: {rows}",
    ],
    parts: {
      message: { part: "value", check: "message" },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
    },
    colour: "#0fbd8c",
    tooltip: "Replies to a message with a captcha",
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasBlockInParent",
        blockTypes: ["captcha_create", "captcha_create_mutator"],
        message: 'This block must be used AFTER a "create new captcha" block',
      },
      {
        type: "notEmpty",
        blockTypes: ["message"],
        message: "You must specify the message to reply with the captcha",
      },
    ],
    code: (ctx) => {
      var message = ctx.code("message");
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");

      return `${message}.reply({
      ${ctx.allowedMentions()},
      files: [{ attachment: captcha.PNGStream, name: "captcha.png" }],
      content: ${content || "''"},
      embeds: [${formatEmbeds(embeds)}],
      components: [
      ${rows}]
    });\n`;
    },
  }),
  block({
    type: "captcha_replyInteraction",
    pings: true,
    text: [
      "reply captcha to interaction",
      "with content: {content}",
      "embed name(s): {embeds}",
      "visible only to the user? {ephemeral}",
      "rows: {rows}",
    ],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      ephemeral: { part: "value", check: "Boolean" },
      rows: { part: "statement", check: "rows" },
    },
    colour: "#0fbd8c",
    tooltip: "Replies to the interaction with a captcha",
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: [
          "slash_received",
          "slash_received_named",
          "buttons_event",
          "modal_handle_interaction",
          "menus_event",
          "contextMenu_received",
        ],
        message: "This must be under a interaction event",
      },
    ],
    code: (ctx) => {
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");
      var value_ephemeral = ctx.code("ephemeral");

      return `interaction.reply({
      ${ctx.allowedMentions()},
      files: [{ attachment: captcha.buffer, name: "captcha.png" }],
      content: ${content || "''"},
      embeds: [${embeds.replaceAll("'", "") || ""}],
      ephemeral: ${value_ephemeral || "false"},
      components: [
      ${rows}]
    });\n`;
    },
  }),
];

export default {
  events,
  actions,
  values,
  components,
  contexts: [],

  blocks,
};
