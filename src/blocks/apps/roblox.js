import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../lib/restrictions";

const colour = "#e2231a";

/* All Roblox blocks use Roblox's public (open) API endpoints, so users never
   have to provide an API key, cookie or any other credential. */
const userIdOf = (username) =>
  `fetch("https://users.roblox.com/v1/usernames/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usernames: [${username}] }) })
    .then(async (res) => res.json())
    .then(async (json) => json.data[0]?.id ?? null)`;

Blockly.Blocks["roblox_getUser"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("get Roblox user:");
    this.appendStatementInput("code").appendField("then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Looks up a Roblox user by their username, then runs the blocks inside",
    );
  },
};

/** Runs `code` with robloxUserInformation set, for the user whose ID `idCode` resolves to. */
function userGenerator(idCode, code) {
  return `await ${idCode}
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
}

javascriptGenerator.forBlock["roblox_getUser"] = function (block, generator) {
  const username = generator.valueToCode(block, "username", Order.NONE);
  const code = generator.statementToCode(block, "code");

  return userGenerator(userIdOf(username), code);
};

Blockly.Blocks["roblox_getUserById"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("get Roblox user with ID:");
    this.appendStatementInput("code").appendField("then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Looks up a Roblox user by their user ID (the number in their profile link), then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["roblox_getUserById"] = function (
  block,
  generator,
) {
  const id = generator.valueToCode(block, "id", Order.NONE) || "0";
  const code = generator.statementToCode(block, "code");

  return userGenerator(`Promise.resolve(Number(${id}) || null)`, code);
};

Blockly.Blocks["roblox_userInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
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
        ]),
        "info",
      )
      .appendField("of Roblox user");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip("Information about the Roblox user you got");
  },
};

javascriptGenerator.forBlock["roblox_userInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`robloxUserInformation.${info}`, Order.ATOMIC];
};

Blockly.Blocks["roblox_userId"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("user ID of Roblox user:");
    this.setOutput(true, "Number");
    this.setColour(colour);
    this.setTooltip("The Roblox user ID belonging to a username");
  },
};

javascriptGenerator.forBlock["roblox_userId"] = function (block, generator) {
  const username = generator.valueToCode(block, "username", Order.NONE);

  return [
    `await ${userIdOf(username)}.catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_userAvatar"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("avatar image URL of Roblox user:");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip("A link to the user's avatar image, great inside embeds");
  },
};

javascriptGenerator.forBlock["roblox_userAvatar"] = function (block, generator) {
  const username = generator.valueToCode(block, "username", Order.NONE);

  return [
    `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://thumbnails.roblox.com/v1/users/avatar?userIds=" + robloxId + "&size=420x420&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl) : null)
    .catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_profileLink"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("profile link of Roblox user:");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip("A link to the user's Roblox profile page");
  },
};

javascriptGenerator.forBlock["roblox_profileLink"] = function (
  block,
  generator,
) {
  const username = generator.valueToCode(block, "username", Order.NONE);

  return [
    `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? "https://www.roblox.com/users/" + robloxId + "/profile" : null)
    .catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_getGroup"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("get Roblox group with ID:");
    this.appendStatementInput("code").appendField("then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Looks up a Roblox group by its ID, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["roblox_getGroup"] = function (block, generator) {
  const id = generator.valueToCode(block, "id", Order.NONE);
  const code = generator.statementToCode(block, "code");

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
};

Blockly.Blocks["roblox_groupInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
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
        ]),
        "info",
      )
      .appendField("of Roblox group");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip("Information about the Roblox group you got");
  },
};

javascriptGenerator.forBlock["roblox_groupInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`robloxGroupInformation.${info}`, Order.ATOMIC];
};

Blockly.Blocks["roblox_userInGroup"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("Roblox user:");
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("is in group with ID:");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(colour);
    this.setTooltip("Checks whether a Roblox user is a member of a group");
  },
};

javascriptGenerator.forBlock["roblox_userInGroup"] = function (
  block,
  generator,
) {
  const username = generator.valueToCode(block, "username", Order.NONE);
  const id = generator.valueToCode(block, "id", Order.NONE);

  return [
    `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://groups.roblox.com/v1/users/" + robloxId + "/groups/roles").then(async (res) => res.json()).then(async (json) => json.data.some(entry => entry.group.id == ${id})) : false)
    .catch(async () => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_userGroupRank"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("rank of Roblox user:");
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("in group with ID:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip(
      "The name of the user's role in a group, or 'Guest' if they aren't in it",
    );
  },
};

javascriptGenerator.forBlock["roblox_userGroupRank"] = function (
  block,
  generator,
) {
  const username = generator.valueToCode(block, "username", Order.NONE);
  const id = generator.valueToCode(block, "id", Order.NONE);

  return [
    `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://groups.roblox.com/v1/users/" + robloxId + "/groups/roles").then(async (res) => res.json()).then(async (json) => json.data.find(entry => entry.group.id == ${id})?.role?.name || "Guest") : "Guest")
    .catch(async () => "Guest")`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_getGame"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("get Roblox game with place ID:");
    this.appendStatementInput("code").appendField("then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Looks up a Roblox game by the place ID in its link, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["roblox_getGame"] = function (block, generator) {
  const id = generator.valueToCode(block, "id", Order.NONE);
  const code = generator.statementToCode(block, "code");

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
};

Blockly.Blocks["roblox_gameInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
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
        ]),
        "info",
      )
      .appendField("of Roblox game");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip("Information about the Roblox game you got");
  },
};

javascriptGenerator.forBlock["roblox_gameInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`robloxGameInformation.${info}`, Order.ATOMIC];
};

Blockly.Blocks["roblox_ownsGamepass"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("Roblox user:");
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("owns gamepass with ID:");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(colour);
    this.setTooltip("Checks whether a Roblox user owns a gamepass");
  },
};

javascriptGenerator.forBlock["roblox_ownsGamepass"] = function (
  block,
  generator,
) {
  const username = generator.valueToCode(block, "username", Order.NONE);
  const id = generator.valueToCode(block, "id", Order.NONE);

  return [
    `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://inventory.roblox.com/v1/users/" + robloxId + "/items/GamePass/" + ${id} + "/is-owned").then(async (res) => res.text()).then(async (text) => text.trim() === "true") : false)
    .catch(async () => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_ownsBadge"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("Roblox user:");
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("owns badge with ID:");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(colour);
    this.setTooltip("Checks whether a Roblox user has earned a badge");
  },
};

javascriptGenerator.forBlock["roblox_ownsBadge"] = function (block, generator) {
  const username = generator.valueToCode(block, "username", Order.NONE);
  const id = generator.valueToCode(block, "id", Order.NONE);

  return [
    `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://inventory.roblox.com/v1/users/" + robloxId + "/items/Badge/" + ${id} + "/is-owned").then(async (res) => res.text()).then(async (text) => text.trim() === "true") : false)
    .catch(async () => false)`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* More users                                                           */
/* ------------------------------------------------------------------ */

Blockly.Blocks["roblox_usernameFromId"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField(
        new Blockly.FieldDropdown([
          ["username", "name"],
          ["display name", "displayName"],
        ]),
        "info",
      )
      .appendField("of Roblox user with ID:");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip("The username or display name belonging to a Roblox user ID");
  },
};

javascriptGenerator.forBlock["roblox_usernameFromId"] = function (
  block,
  generator,
) {
  const id = generator.valueToCode(block, "id", Order.NONE) || "0";
  const info = block.getFieldValue("info");

  return [
    `await fetch("https://users.roblox.com/v1/users/" + ${id}).then(async (res) => res.ok ? res.json() : null).then(async (user) => user?.${info} ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_userThumbnail"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("Roblox")
      .appendField(
        new Blockly.FieldDropdown([
          ["headshot", "avatar-headshot"],
          ["bust (head and shoulders)", "avatar-bust"],
          ["full avatar", "avatar"],
        ]),
        "type",
      )
      .appendField("image URL of user:");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip("A link to a picture of the user's avatar, great inside embeds");
  },
};

javascriptGenerator.forBlock["roblox_userThumbnail"] = function (
  block,
  generator,
) {
  const username = generator.valueToCode(block, "username", Order.NONE) || "''";
  const type = block.getFieldValue("type");

  return [
    `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch("https://thumbnails.roblox.com/v1/users/${type}?userIds=" + robloxId + "&size=420x420&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl ?? null) : null)
    .catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_userList"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("list of")
      .appendField(
        new Blockly.FieldDropdown([
          ["group names", "groups"],
          ["group IDs", "groupIds"],
          ["previous usernames", "usernames"],
          ["games they made", "games"],
        ]),
        "list",
      )
      .appendField("of Roblox user:");
    this.setOutput(true, "Array");
    this.setColour(colour);
    this.setTooltip("A list about a Roblox user (up to 100 items)");
  },
};

javascriptGenerator.forBlock["roblox_userList"] = function (block, generator) {
  const username = generator.valueToCode(block, "username", Order.NONE) || "''";
  const list = block.getFieldValue("list");

  const request = {
    groups: `"https://groups.roblox.com/v2/users/" + robloxId + "/groups/roles"`,
    groupIds: `"https://groups.roblox.com/v2/users/" + robloxId + "/groups/roles"`,
    usernames: `"https://users.roblox.com/v1/users/" + robloxId + "/username-history?limit=100&sortOrder=Desc"`,
    games: `"https://games.roblox.com/v2/users/" + robloxId + "/games?limit=50&sortOrder=Desc"`,
  }[list];

  const pick = {
    groups: "item.group.name",
    groupIds: "item.group.id",
    usernames: "item.name",
    games: "item.name",
  }[list];

  return [
    `await ${userIdOf(username)}
    .then(async (robloxId) => robloxId ? fetch(${request}).then(async (res) => res.json()).then(async (json) => (json.data ?? []).map(item => ${pick})) : [])
    .catch(async () => [])`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_searchUsers"] = {
  init: function () {
    this.appendValueInput("keyword")
      .setCheck("String")
      .appendField("list of Roblox usernames found searching:");
    this.setOutput(true, "Array");
    this.setColour(colour);
    this.setTooltip("Searches Roblox users by name (up to 10 results)");
  },
};

javascriptGenerator.forBlock["roblox_searchUsers"] = function (
  block,
  generator,
) {
  const keyword = generator.valueToCode(block, "keyword", Order.NONE) || "''";

  return [
    `await fetch("https://users.roblox.com/v1/users/search?limit=10&keyword=" + encodeURIComponent(${keyword})).then(async (res) => res.json()).then(async (json) => (json.data ?? []).map(user => user.name)).catch(async () => [])`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* More groups and games                                                */
/* ------------------------------------------------------------------ */

Blockly.Blocks["roblox_groupRoles"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("list of role names in Roblox group with ID:");
    this.setOutput(true, "Array");
    this.setColour(colour);
    this.setTooltip("Every role in a group, from lowest to highest rank");
  },
};

javascriptGenerator.forBlock["roblox_groupRoles"] = function (
  block,
  generator,
) {
  const id = generator.valueToCode(block, "id", Order.NONE) || "0";

  return [
    `await fetch("https://groups.roblox.com/v1/groups/" + ${id} + "/roles").then(async (res) => res.json()).then(async (json) => (json.roles ?? []).filter(role => role.rank > 0).sort((a, b) => a.rank - b.rank).map(role => role.name).filter((name, index, names) => names.indexOf(name) === index)).catch(async () => [])`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_gamePlayers"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("players right now in Roblox game with place ID:");
    this.setOutput(true, "Number");
    this.setColour(colour);
    this.setTooltip("How many people are playing a game right now");
  },
};

javascriptGenerator.forBlock["roblox_gamePlayers"] = function (
  block,
  generator,
) {
  const id = generator.valueToCode(block, "id", Order.NONE) || "0";

  return [
    `await fetch("https://apis.roblox.com/universes/v1/places/" + ${id} + "/universe").then(async (res) => res.json()).then(async (json) => json.universeId ? fetch("https://games.roblox.com/v1/games?universeIds=" + json.universeId).then(async (res) => res.json()).then(async (json) => json.data[0]?.playing ?? 0) : 0).catch(async () => 0)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_forEachServer"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("for each public server of Roblox game with place ID:");
    this.appendStatementInput("code").appendField("do").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      'Runs the blocks inside once for each public server of a game (up to 100, fullest first). Use "get ... of Roblox server" inside it.',
    );
  },
};

javascriptGenerator.forBlock["roblox_forEachServer"] = function (
  block,
  generator,
) {
  const id = generator.valueToCode(block, "id", Order.NONE) || "0";
  const code = generator.statementToCode(block, "code");

  return `for (const robloxServerInformation of await fetch("https://games.roblox.com/v1/games/" + ${id} + "/servers/Public?sortOrder=Desc&limit=100")
  .then(async (res) => res.json())
  .then(async (json) => (json.data ?? []).map(server => ({
    id: server.id,
    playing: server.playing ?? 0,
    maxPlayers: server.maxPlayers,
    fps: Math.round(server.fps ?? 0),
    ping: server.ping ?? 0,
    joinUrl: "https://www.roblox.com/games/start?placeId=" + ${id} + "&gameInstanceId=" + server.id
  })))
  .catch(async (error) => { console.error("Error fetching Roblox servers:", error); return []; })) {
  ${code}}\n`;
};

Blockly.Blocks["roblox_serverInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["players", "playing"],
          ["max players", "maxPlayers"],
          ["FPS", "fps"],
          ["ping", "ping"],
          ["server ID", "id"],
          ["join link", "joinUrl"],
        ]),
        "info",
      )
      .appendField("of Roblox server");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip("Information about the Roblox server");
  },
};

javascriptGenerator.forBlock["roblox_serverInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`robloxServerInformation.${info}`, Order.MEMBER];
};

/* ------------------------------------------------------------------ */
/* Badges, gamepasses and catalog items                                 */
/* ------------------------------------------------------------------ */

Blockly.Blocks["roblox_getBadge"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("get Roblox badge with ID:");
    this.appendStatementInput("code").appendField("then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip("Looks up a badge by its ID, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["roblox_getBadge"] = function (block, generator) {
  const id = generator.valueToCode(block, "id", Order.NONE) || "0";
  const code = generator.statementToCode(block, "code");

  return `await Promise.all([
    fetch("https://badges.roblox.com/v1/badges/" + ${id}).then(async (res) => res.ok ? res.json() : null),
    fetch("https://thumbnails.roblox.com/v1/badges/icons?badgeIds=" + ${id} + "&size=150x150&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl ?? null).catch(async () => null)
  ])
  .then(async ([badge, icon]) => {
    if (!badge?.id) return;

    const robloxBadgeInformation = {
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
    };

    ${code}})
  .catch(async (error) => console.error("Error fetching Roblox badge:", error));\n`;
};

Blockly.Blocks["roblox_badgeInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["description", "description"],
          ["times awarded", "awardedCount"],
          ["times awarded yesterday", "pastDayAwardedCount"],
          ["win rate (%)", "winRate"],
          ["is enabled", "enabled"],
          ["game name", "gameName"],
          ["game place ID", "placeId"],
          ["created date", "created"],
          ["last updated date", "updated"],
          ["badge ID", "id"],
          ["icon image URL", "iconUrl"],
          ["badge link", "badgeUrl"],
        ]),
        "info",
      )
      .appendField("of Roblox badge");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip("Information about the Roblox badge you got");
  },
};

javascriptGenerator.forBlock["roblox_badgeInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`robloxBadgeInformation.${info}`, Order.MEMBER];
};

Blockly.Blocks["roblox_getGamepass"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("get Roblox gamepass with ID:");
    this.appendStatementInput("code").appendField("then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip("Looks up a gamepass by its ID, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["roblox_getGamepass"] = function (
  block,
  generator,
) {
  const id = generator.valueToCode(block, "id", Order.NONE) || "0";
  const code = generator.statementToCode(block, "code");

  return `await Promise.all([
    fetch("https://apis.roblox.com/game-passes/v1/game-passes/" + ${id} + "/product-info").then(async (res) => res.ok ? res.json() : null),
    fetch("https://thumbnails.roblox.com/v1/game-passes?gamePassIds=" + ${id} + "&size=150x150&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl ?? null).catch(async () => null)
  ])
  .then(async ([pass, icon]) => {
    if (!pass?.TargetId) return;

    const robloxGamepassInformation = {
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
    };

    ${code}})
  .catch(async (error) => console.error("Error fetching Roblox gamepass:", error));\n`;
};

Blockly.Blocks["roblox_gamepassInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["description", "description"],
          ["price (Robux)", "price"],
          ["is for sale", "forSale"],
          ["creator name", "creatorName"],
          ["creator ID", "creatorId"],
          ["created date", "created"],
          ["last updated date", "updated"],
          ["gamepass ID", "id"],
          ["icon image URL", "iconUrl"],
          ["gamepass link", "gamepassUrl"],
        ]),
        "info",
      )
      .appendField("of Roblox gamepass");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip("Information about the Roblox gamepass you got");
  },
};

javascriptGenerator.forBlock["roblox_gamepassInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`robloxGamepassInformation.${info}`, Order.MEMBER];
};

Blockly.Blocks["roblox_getItem"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("Number")
      .appendField("get Roblox catalog item with ID:");
    this.appendStatementInput("code").appendField("then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Looks up an avatar shop item or other asset (hats, shirts, models...) by the ID in its link, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["roblox_getItem"] = function (block, generator) {
  const id = generator.valueToCode(block, "id", Order.NONE) || "0";
  const code = generator.statementToCode(block, "code");

  return `await Promise.all([
    fetch("https://economy.roblox.com/v2/assets/" + ${id} + "/details").then(async (res) => res.ok ? res.json() : null),
    fetch("https://thumbnails.roblox.com/v1/assets?assetIds=" + ${id} + "&size=420x420&format=Png").then(async (res) => res.json()).then(async (json) => json.data[0]?.imageUrl ?? null).catch(async () => null)
  ])
  .then(async ([item, image]) => {
    if (!item?.AssetId) return;

    const robloxItemInformation = {
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
    };

    ${code}})
  .catch(async (error) => console.error("Error fetching Roblox item:", error));\n`;
};

Blockly.Blocks["roblox_itemInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["description", "description"],
          ["price (Robux)", "price"],
          ["is for sale", "forSale"],
          ["is limited", "isLimited"],
          ["copies remaining", "remaining"],
          ["creator name", "creatorName"],
          ["creator ID", "creatorId"],
          ["created date", "created"],
          ["last updated date", "updated"],
          ["item ID", "id"],
          ["image URL", "imageUrl"],
          ["item link", "itemUrl"],
        ]),
        "info",
      )
      .appendField("of Roblox item");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip("Information about the Roblox catalog item you got");
  },
};

javascriptGenerator.forBlock["roblox_itemInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`robloxItemInformation.${info}`, Order.MEMBER];
};

/* ------------------------------------------------------------------ */
/* Open Cloud: these need an API key                                    */
/* ------------------------------------------------------------------ */

/* Talking *to* a game (sending it messages, reading and writing its
   data stores, banning players) can only be done by the game's owner,
   so these blocks take an Open Cloud API key, made at
   create.roblox.com/dashboard/credentials. The toolbox fills the key
   input with a "get secret ROBLOX_API_KEY" block. */

/** Sends a request to Open Cloud for the game with this place ID. */
const openCloud = () =>
  javascriptGenerator.provideFunction_(
    "robloxOpenCloud",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(placeId, path, key, options = {}) {
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
  );

const placeValue = (block, generator) =>
  generator.valueToCode(block, "place", Order.NONE) || "0";

const keyValue = (block, generator) =>
  generator.valueToCode(block, "key", Order.NONE) || "''";

Blockly.Blocks["roblox_publishMessage"] = {
  init: function () {
    this.appendValueInput("message")
      .setCheck(null)
      .appendField("send message to Roblox game:");
    this.appendValueInput("topic").setCheck("String").appendField("topic:");
    this.appendValueInput("place")
      .setCheck("Number")
      .appendField("game place ID:");
    this.appendValueInput("key").setCheck(null).appendField("with API key:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Sends a message to every running server of your game. In the game, receive it with MessagingService:SubscribeAsync(topic). Needs an Open Cloud API key with the messaging-service:publish permission.",
    );
  },
};

javascriptGenerator.forBlock["roblox_publishMessage"] = function (
  block,
  generator,
) {
  const message = generator.valueToCode(block, "message", Order.NONE) || "''";
  const topic = generator.valueToCode(block, "topic", Order.NONE) || "''";

  return `await ${openCloud()}(${placeValue(block, generator)}, "/messaging-service/v1/universes/{universe}/topics/" + encodeURIComponent(${topic}), ${keyValue(block, generator)}, { method: "POST", body: { message: typeof ${message} === "string" ? ${message} : JSON.stringify(${message}) } });\n`;
};

Blockly.Blocks["roblox_getDataStore"] = {
  init: function () {
    this.appendValueInput("entry")
      .setCheck("String")
      .appendField("value of key:");
    this.appendValueInput("datastore")
      .setCheck("String")
      .appendField("in Roblox DataStore:");
    this.appendValueInput("place")
      .setCheck("Number")
      .appendField("game place ID:");
    this.appendValueInput("key").setCheck(null).appendField("with API key:");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip(
      "Reads a value your game saved with DataStoreService, or null if there isn't one. Needs an Open Cloud API key with the universe-datastores.objects:read permission.",
    );
  },
};

javascriptGenerator.forBlock["roblox_getDataStore"] = function (
  block,
  generator,
) {
  const entry = generator.valueToCode(block, "entry", Order.NONE) || "''";
  const datastore = generator.valueToCode(block, "datastore", Order.NONE) || "''";

  return [
    `await ${openCloud()}(${placeValue(block, generator)}, "/datastores/v1/universes/{universe}/standard-datastores/datastore/entries/entry?" + new URLSearchParams({ datastoreName: String(${datastore}), entryKey: String(${entry}) }), ${keyValue(block, generator)}).then(async (value) => value ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["roblox_setDataStore"] = {
  init: function () {
    this.appendValueInput("entry")
      .setCheck("String")
      .appendField("set key:");
    this.appendValueInput("value").setCheck(null).appendField("to:");
    this.appendValueInput("datastore")
      .setCheck("String")
      .appendField("in Roblox DataStore:");
    this.appendValueInput("place")
      .setCheck("Number")
      .appendField("game place ID:");
    this.appendValueInput("key").setCheck(null).appendField("with API key:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Saves a value your game can read with DataStoreService. Needs an Open Cloud API key with the universe-datastores.objects:create and update permissions.",
    );
  },
};

javascriptGenerator.forBlock["roblox_setDataStore"] = function (
  block,
  generator,
) {
  const entry = generator.valueToCode(block, "entry", Order.NONE) || "''";
  const datastore = generator.valueToCode(block, "datastore", Order.NONE) || "''";
  const value = generator.valueToCode(block, "value", Order.NONE) || "null";

  return `await ${openCloud()}(${placeValue(block, generator)}, "/datastores/v1/universes/{universe}/standard-datastores/datastore/entries/entry?" + new URLSearchParams({ datastoreName: String(${datastore}), entryKey: String(${entry}) }), ${keyValue(block, generator)}, { method: "POST", body: ${value} });\n`;
};

Blockly.Blocks["roblox_banUser"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["ban", "ban"],
          ["unban", "unban"],
        ]),
        "action",
      )
      .appendField("Roblox user:");
    this.appendValueInput("place")
      .setCheck("Number")
      .appendField("from game with place ID:");
    this.appendValueInput("duration")
      .setCheck("Number")
      .appendField("for (seconds, 0 = forever):");
    this.appendValueInput("reason")
      .setCheck("String")
      .appendField("reason shown to them:");
    this.appendValueInput("key").setCheck(null).appendField("with API key:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Bans (or unbans) a player from your game, including servers that are already running. The duration and reason are ignored when unbanning. Needs an Open Cloud API key with the universe.user-restriction:write permission.",
    );
  },
};

javascriptGenerator.forBlock["roblox_banUser"] = function (block, generator) {
  const username = generator.valueToCode(block, "username", Order.NONE) || "''";
  const duration = generator.valueToCode(block, "duration", Order.NONE) || "0";
  const reason = generator.valueToCode(block, "reason", Order.NONE) || "''";
  const ban = block.getFieldValue("action") === "ban";

  const restriction = ban
    ? `{ active: true, ...(Number(${duration}) > 0 ? { duration: Math.round(Number(${duration})) + "s" } : {}), privateReason: String(${reason} || "Banned from Discord"), displayReason: String(${reason} || "You are banned from this experience."), excludeAltAccounts: false }`
    : `{ active: false }`;

  return `await ${userIdOf(username)}
  .then(async (robloxId) => robloxId ? ${openCloud()}(${placeValue(block, generator)}, "/cloud/v2/universes/{universe}/user-restrictions/" + robloxId + "?updateMask=gameJoinRestriction", ${keyValue(block, generator)}, { method: "PATCH", body: { gameJoinRestriction: ${restriction} } }) : console.error("Roblox: no user is called " + ${username}))
  .catch(async (error) => console.error("Error changing Roblox ban:", error));\n`;
};

/* ------------------------------------------------------------------ */
/* Where the info blocks can go                                         */
/* ------------------------------------------------------------------ */

createRestrictions(
  ["roblox_serverInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["roblox_forEachServer"],
      message: 'This block must be inside a "for each public server of Roblox game" block.',
    },
  ],
);

createRestrictions(
  ["roblox_badgeInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["roblox_getBadge"],
      message: 'This block must be inside a "get Roblox badge" block.',
    },
  ],
);

createRestrictions(
  ["roblox_gamepassInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["roblox_getGamepass"],
      message: 'This block must be inside a "get Roblox gamepass" block.',
    },
  ],
);

createRestrictions(
  ["roblox_itemInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["roblox_getItem"],
      message: 'This block must be inside a "get Roblox catalog item" block.',
    },
  ],
);
