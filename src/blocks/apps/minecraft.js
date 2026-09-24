import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";

const colour = "#5A8F3C";

const mojangProfileOf = (username) =>
  `fetch("https://api.mojang.com/users/profiles/minecraft/" + encodeURIComponent(${username}))
    .then(res => res.ok ? res.json() : null)`;

Blockly.Blocks["minecraft_getUser"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("get Minecraft user:");
    this.appendStatementInput("code").appendField("then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Looks up a Minecraft (Java Edition) account by username, then runs the blocks inside"
    );
  }
};

javascriptGenerator.forBlock["minecraft_getUser"] = function (
  block,
  generator
) {
  const username = generator.valueToCode(block, "username", Order.NONE);
  const code = generator.statementToCode(block, "code");

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
      avatarUrl: "https://crafatar.com/avatars/" + minecraftProfile.id,
      bodyUrl: "https://crafatar.com/renders/body/" + minecraftProfile.id,
      profileUrl: "https://namemc.com/profile/" + minecraftProfile.id
    };

    ${code}})
  .catch(error => console.error("Error fetching Minecraft user:", error));`;
};

Blockly.Blocks["minecraft_userInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["username", "name"],
          ["UUID", "uuid"],
          ["ID (no dashes)", "id"],
          ["skin texture URL", "skinUrl"],
          ["cape texture URL", "capeUrl"],
          ["avatar image URL", "avatarUrl"],
          ["full body render URL", "bodyUrl"],
          ["profile link", "profileUrl"]
        ]),
        "info"
      )
      .appendField("of Minecraft user");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip("Information about the Minecraft user you got");
  }
};

javascriptGenerator.forBlock["minecraft_userInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`minecraftUserInformation.${info}`, Order.ATOMIC];
};

Blockly.Blocks["minecraft_userExists"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("Minecraft username");
    this.appendDummyInput().appendField("exists?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(colour);
    this.setTooltip(
      "Checks whether a Minecraft (Java Edition) account has this username"
    );
  }
};

javascriptGenerator.forBlock["minecraft_userExists"] = function (
  block,
  generator
) {
  const username = generator.valueToCode(block, "username", Order.NONE);

  return [
    `await ${mojangProfileOf(username)}.then(profile => !!profile).catch(() => false)`,
    Order.AWAIT
  ];
};

Blockly.Blocks["minecraft_userUUID"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("UUID of Minecraft user:");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip(
      "The Minecraft account UUID belonging to a username, or null if it doesn't exist"
    );
  }
};

javascriptGenerator.forBlock["minecraft_userUUID"] = function (
  block,
  generator
) {
  const username = generator.valueToCode(block, "username", Order.NONE);

  return [
    `await ${mojangProfileOf(username)}
    .then(profile => profile ? profile.id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5") : null)
    .catch(() => null)`,
    Order.AWAIT
  ];
};

Blockly.Blocks["minecraft_userAvatar"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("Minecraft")
      .appendField(
        new Blockly.FieldDropdown([
          ["avatar (2D face)", "avatars"],
          ["head (3D render)", "renders/head"],
          ["full body (3D render)", "renders/body"],
          ["skin (2D, flat)", "skins"]
        ]),
        "type"
      )
      .appendField("image URL of user:");
    this.setInputsInline(false);
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip(
      "A link to an image built from the player's current skin, great inside embeds"
    );
    this.setHelpUrl("https://crafatar.com/");
  }
};

javascriptGenerator.forBlock["minecraft_userAvatar"] = function (
  block,
  generator
) {
  const username = generator.valueToCode(block, "username", Order.NONE);
  const type = block.getFieldValue("type");

  return [
    `await ${mojangProfileOf(username)}
    .then(profile => profile ? "https://crafatar.com/${type}/" + profile.id : null)
    .catch(() => null)`,
    Order.AWAIT
  ];
};

Blockly.Blocks["minecraft_getServer"] = {
  init: function () {
    this.appendValueInput("address")
      .setCheck("String")
      .appendField("get Minecraft")
      .appendField(
        new Blockly.FieldDropdown([
          ["Java", "java"],
          ["Bedrock", "bedrock"]
        ]),
        "edition"
      )
      .appendField("server with address:");
    this.appendStatementInput("code").appendField("then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Looks up a Minecraft server's live status by its address (e.g. play.hypixel.net, optionally with :port), then runs the blocks inside"
    );
    this.setHelpUrl("https://api.mcsrvstat.us/");
  }
};

javascriptGenerator.forBlock["minecraft_getServer"] = function (
  block,
  generator
) {
  const address = generator.valueToCode(block, "address", Order.NONE);
  const edition = block.getFieldValue("edition");
  const code = generator.statementToCode(block, "code");
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
};

Blockly.Blocks["minecraft_serverInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["is online", "online"],
          ["MOTD (message of the day)", "motd"],
          ["players online", "playersOnline"],
          ["max players", "playersMax"],
          ["list of online player names", "playerList"],
          ["version", "version"],
          ["hostname", "hostname"],
          ["IP address", "ip"],
          ["port", "port"],
          ["icon (base64 image)", "iconUrl"]
        ]),
        "info"
      )
      .appendField("of Minecraft server");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip("Information about the Minecraft server you got");
  }
};

javascriptGenerator.forBlock["minecraft_serverInfo"] = function (block) {
  const info = block.getFieldValue("info");
  return [`minecraftServerInformation.${info}`, Order.ATOMIC];
};

Blockly.Blocks["minecraft_serverOnline"] = {
  init: function () {
    this.appendValueInput("address")
      .setCheck("String")
      .appendField("Minecraft")
      .appendField(
        new Blockly.FieldDropdown([
          ["Java", "java"],
          ["Bedrock", "bedrock"]
        ]),
        "edition"
      )
      .appendField("server with address:");
    this.appendDummyInput().appendField("is online?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(colour);
  }
};

javascriptGenerator.forBlock["minecraft_serverOnline"] = function (
  block,
  generator
) {
  const address = generator.valueToCode(block, "address", Order.NONE);
  const edition = block.getFieldValue("edition");
  const path = edition === "bedrock" ? "bedrock/3" : "3";

  return [
    `await fetch("https://api.mcsrvstat.us/${path}/" + ${address})
    .then(res => res.json())
    .then(json => json.online ?? false)
    .catch(() => false)`,
    Order.AWAIT
  ];
};

Blockly.Blocks["minecraft_isPlayerOnServer"] = {
  init: function () {
    this.appendValueInput("address")
      .setCheck("String")
      .appendField("Minecraft server with address:");
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("has player online:");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(colour);
    this.setTooltip(
      "Not every server exposes its player list in its status ping — some will say false here even while the player is online"
    );
  }
};

javascriptGenerator.forBlock["minecraft_isPlayerOnServer"] = function (
  block,
  generator
) {
  const address = generator.valueToCode(block, "address", Order.NONE);
  const username = generator.valueToCode(block, "username", Order.NONE);

  return [
    `await fetch("https://api.mcsrvstat.us/3/" + ${address})
    .then(res => res.json())
    .then(json => (json.players?.list || []).some(name => name.toLowerCase() === (${username} || "").toLowerCase()))
    .catch(() => false)`,
    Order.AWAIT
  ];
};
