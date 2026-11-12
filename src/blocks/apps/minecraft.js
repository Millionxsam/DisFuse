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
      skinModel: minecraftTextures.textures?.SKIN?.metadata?.model === "slim" ? "slim (Alex)" : "classic (Steve)",
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
          ["skin model (classic or slim)", "skinModel"],
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

const serverPath = (edition) => (edition === "bedrock" ? "bedrock/3" : "3");

const editionDropdown = () =>
  new Blockly.FieldDropdown([
    ["Java", "java"],
    ["Bedrock", "bedrock"]
  ]);

Blockly.Blocks["minecraft_usernameFromUUID"] = {
  init: function () {
    this.appendValueInput("uuid")
      .setCheck("String")
      .appendField("username of Minecraft UUID:");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip(
      "The current username of a Minecraft account, from its UUID (with or without dashes). Null if there's no such account."
    );
  }
};

javascriptGenerator.forBlock["minecraft_usernameFromUUID"] = function (
  block,
  generator
) {
  const uuid = generator.valueToCode(block, "uuid", Order.NONE) || "''";

  return [
    `await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + String(${uuid}).replace(/-/g, "").trim())
    .then(res => res.ok ? res.json() : null)
    .then(profile => profile?.name ?? null)
    .catch(() => null)`,
    Order.AWAIT
  ];
};

Blockly.Blocks["minecraft_serverQuickInfo"] = {
  init: function () {
    this.appendValueInput("address")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["players online", "playersOnline"],
          ["max players", "playersMax"],
          ["MOTD (message of the day)", "motd"],
          ["version", "version"],
          ["list of online player names", "playerList"]
        ]),
        "info"
      )
      .appendField("of Minecraft")
      .appendField(editionDropdown(), "edition")
      .appendField("server:");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip(
      "One piece of a server's live status, without getting the server first"
    );
  }
};

javascriptGenerator.forBlock["minecraft_serverQuickInfo"] = function (
  block,
  generator
) {
  const address = generator.valueToCode(block, "address", Order.NONE) || "''";
  const info = block.getFieldValue("info");
  const edition = block.getFieldValue("edition");

  const pick = {
    playersOnline: "json.players?.online ?? 0",
    playersMax: "json.players?.max ?? 0",
    motd: 'json.motd?.clean?.join("\\n") ?? ""',
    version: "json.version ?? null",
    playerList: "json.players?.list?.map(player => player.name ?? player) ?? []"
  }[info];

  const fallback = { playersOnline: "0", playersMax: "0", motd: '""', version: "null", playerList: "[]" }[info];

  return [
    `await fetch("https://api.mcsrvstat.us/${serverPath(edition)}/" + ${address})
    .then(res => res.json())
    .then(json => ${pick})
    .catch(() => ${fallback})`,
    Order.AWAIT
  ];
};

Blockly.Blocks["minecraft_serverImage"] = {
  init: function () {
    this.appendValueInput("address")
      .setCheck("String")
      .appendField("Minecraft server")
      .appendField(
        new Blockly.FieldDropdown([
          ["icon", "icon"],
          ["status banner", "banner"]
        ]),
        "type"
      )
      .appendField("image URL of address:");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip(
      "A link to a Java server's icon (64x64), or to a banner image showing its live status and player count. Great inside embeds."
    );
  }
};

javascriptGenerator.forBlock["minecraft_serverImage"] = function (
  block,
  generator
) {
  const address = generator.valueToCode(block, "address", Order.NONE) || "''";
  const type = block.getFieldValue("type");

  const base =
    type === "banner"
      ? "https://api.mcstatus.io/v2/widget/java/"
      : "https://api.mcsrvstat.us/icon/";

  return [
    `"${base}" + encodeURIComponent(String(${address}).trim())`,
    Order.ADDITION
  ];
};

Blockly.Blocks["minecraft_latestVersion"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("latest Minecraft")
      .appendField(
        new Blockly.FieldDropdown([
          ["release", "release"],
          ["snapshot", "snapshot"]
        ]),
        "type"
      )
      .appendField("version");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip("The newest Minecraft: Java Edition version number");
  }
};

javascriptGenerator.forBlock["minecraft_latestVersion"] = function (block) {
  const type = block.getFieldValue("type");

  return [
    `await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json")
    .then(res => res.json())
    .then(json => json.latest?.${type} ?? null)
    .catch(() => null)`,
    Order.AWAIT
  ];
};

Blockly.Blocks["minecraft_onServerStatus"] = {
  init: function () {
    this.appendValueInput("address")
      .setCheck("String")
      .appendField("when Minecraft")
      .appendField(editionDropdown(), "edition")
      .appendField("server:");
    this.appendDummyInput()
      .appendField("goes")
      .appendField(
        new Blockly.FieldDropdown([
          ["online", "online"],
          ["offline", "offline"]
        ]),
        "status"
      );
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    this.appendStatementInput("code").setCheck("default");
    this.setInputsInline(false);
    this.setColour(colour);
    this.setTooltip(
      'Runs when a server comes online or goes down — great for status channels. Use "get ... of Minecraft server" inside it. The server is checked every few minutes (at least 1).'
    );
  }
};

javascriptGenerator.forBlock["minecraft_onServerStatus"] = function (
  block,
  generator
) {
  const address = generator.valueToCode(block, "address", Order.NONE) || "''";
  const minutes = generator.valueToCode(block, "minutes", Order.NONE) || "5";
  const edition = block.getFieldValue("edition");
  const status = block.getFieldValue("status");
  const code = generator.statementToCode(block, "code");

  return `(() => {
  let wasOnline = null;
  const check = async () => {
    try {
      const minecraftServer = await fetch("https://api.mcsrvstat.us/${serverPath(edition)}/" + ${address}).then(res => res.json());
      const online = !!minecraftServer.online;
      const changed = wasOnline !== null && online !== wasOnline;
      wasOnline = online;
      if (!changed || online !== ${status === "online"}) return;

      const minecraftServerInformation = Object.assign({}, minecraftServer, {
        motd: minecraftServer.motd?.clean?.join("\\n") || "",
        playersOnline: minecraftServer.players?.online ?? 0,
        playersMax: minecraftServer.players?.max ?? 0,
        playerList: minecraftServer.players?.list ?? [],
        iconUrl: minecraftServer.icon || null
      });

      ${code}} catch (error) {
      console.error("Error checking Minecraft server:", error);
    }
  };
  setTimeout(check, 5000);
  setInterval(check, Math.max(1, Number(${minutes}) || 5) * 60 * 1000);
})();\n`;
};
