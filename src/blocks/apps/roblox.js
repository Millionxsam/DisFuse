import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";

const colour = "#e2231a";

/* All Roblox blocks use Roblox's public (open) API endpoints, so users never
   have to provide an API key, cookie or any other credential. */
const userIdOf = (username) =>
  `fetch("https://users.roblox.com/v1/usernames/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usernames: [${username}] }) })
    .then(res => res.json())
    .then(json => json.data[0]?.id ?? null)`;

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

javascriptGenerator.forBlock["roblox_getUser"] = function (block, generator) {
  const username = generator.valueToCode(block, "username", Order.NONE);
  const code = generator.statementToCode(block, "code");

  return `await ${userIdOf(username)}
  .then(async (robloxId) => {
    if (!robloxId) return;

    const [robloxProfile, robloxFriends, robloxFollowers, robloxFollowing, robloxAvatar] = await Promise.all([
      fetch("https://users.roblox.com/v1/users/" + robloxId).then(res => res.json()).catch(() => ({})),
      fetch("https://friends.roblox.com/v1/users/" + robloxId + "/friends/count").then(res => res.json()).then(json => json.count).catch(() => 0),
      fetch("https://friends.roblox.com/v1/users/" + robloxId + "/followers/count").then(res => res.json()).then(json => json.count).catch(() => 0),
      fetch("https://friends.roblox.com/v1/users/" + robloxId + "/followings/count").then(res => res.json()).then(json => json.count).catch(() => 0),
      fetch("https://thumbnails.roblox.com/v1/users/avatar?userIds=" + robloxId + "&size=420x420&format=Png").then(res => res.json()).then(json => json.data[0]?.imageUrl).catch(() => null)
    ]);

    const robloxUserInformation = Object.assign({}, robloxProfile, {
      friendsCount: robloxFriends,
      followersCount: robloxFollowers,
      followingCount: robloxFollowing,
      avatarUrl: robloxAvatar,
      profileUrl: "https://www.roblox.com/users/" + robloxId + "/profile"
    });

    ${code}})
  .catch(error => console.error("Error fetching Roblox user:", error));`;
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
    `await ${userIdOf(username)}.catch(() => null)`,
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
    .then(robloxId => robloxId ? fetch("https://thumbnails.roblox.com/v1/users/avatar?userIds=" + robloxId + "&size=420x420&format=Png").then(res => res.json()).then(json => json.data[0]?.imageUrl) : null)
    .catch(() => null)`,
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
    .then(robloxId => robloxId ? "https://www.roblox.com/users/" + robloxId + "/profile" : null)
    .catch(() => null)`,
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
  .then(res => res.json())
  .then(async (robloxGroup) => {
    if (!robloxGroup || !robloxGroup.id) return;

    const robloxGroupIcon = await fetch("https://thumbnails.roblox.com/v1/groups/icons?groupIds=" + robloxGroup.id + "&size=420x420&format=Png")
      .then(res => res.json())
      .then(json => json.data[0]?.imageUrl)
      .catch(() => null);

    const robloxGroupInformation = Object.assign({}, robloxGroup, {
      iconUrl: robloxGroupIcon,
      groupUrl: "https://www.roblox.com/groups/" + robloxGroup.id
    });

    ${code}})
  .catch(error => console.error("Error fetching Roblox group:", error));`;
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
    .then(robloxId => robloxId ? fetch("https://groups.roblox.com/v1/users/" + robloxId + "/groups/roles").then(res => res.json()).then(json => json.data.some(entry => entry.group.id == ${id})) : false)
    .catch(() => false)`,
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
    .then(robloxId => robloxId ? fetch("https://groups.roblox.com/v1/users/" + robloxId + "/groups/roles").then(res => res.json()).then(json => json.data.find(entry => entry.group.id == ${id})?.role?.name || "Guest") : "Guest")
    .catch(() => "Guest")`,
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
  .then(res => res.json())
  .then(json => json.universeId)
  .then(async (robloxUniverseId) => {
    if (!robloxUniverseId) return;

    const [robloxGame, robloxGameIcon] = await Promise.all([
      fetch("https://games.roblox.com/v1/games?universeIds=" + robloxUniverseId).then(res => res.json()).then(json => json.data[0]).catch(() => null),
      fetch("https://thumbnails.roblox.com/v1/games/icons?universeIds=" + robloxUniverseId + "&size=512x512&format=Png").then(res => res.json()).then(json => json.data[0]?.imageUrl).catch(() => null)
    ]);

    if (!robloxGame) return;

    const robloxGameInformation = Object.assign({}, robloxGame, {
      iconUrl: robloxGameIcon,
      gameUrl: "https://www.roblox.com/games/" + robloxGame.rootPlaceId
    });

    ${code}})
  .catch(error => console.error("Error fetching Roblox game:", error));`;
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
          ["max players", "maxPlayers"],
          ["price", "price"],
          ["creator name", "creator?.name"],
          ["creator type", "creator?.type"],
          ["created date", "created"],
          ["last updated date", "updated"],
          ["place ID", "rootPlaceId"],
          ["icon image URL", "iconUrl"],
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
    .then(robloxId => robloxId ? fetch("https://inventory.roblox.com/v1/users/" + robloxId + "/items/GamePass/" + ${id} + "/is-owned").then(res => res.text()).then(text => text.trim() === "true") : false)
    .catch(() => false)`,
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
    .then(robloxId => robloxId ? fetch("https://inventory.roblox.com/v1/users/" + robloxId + "/items/Badge/" + ${id} + "/is-owned").then(res => res.text()).then(text => text.trim() === "true") : false)
    .catch(() => false)`,
    Order.AWAIT,
  ];
};
