import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";
import { buildDmSend, forEachCollection } from "../functions/generatorUtils";

Blockly.Blocks["member_getone"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("get the member with the")
      .appendField(
        new Blockly.FieldDropdown([
          ["username", "username"],
          ["id", "id"],
        ]),
        "type",
      )
      .appendField("equal to");
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("on the server");
    this.setOutput(true, "member");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_getuser"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("get the user with the")
      .appendField(
        new Blockly.FieldDropdown([
          ["username", "username"],
          ["id", "id"],
        ]),
        "type",
      )
      .appendField("equal to");
    this.setOutput(true, "user");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_foreach"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("for each member in server:");
    this.appendStatementInput("code").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_member"] = {
  init: function () {
    this.appendDummyInput().appendField("current member in loop");
    this.setOutput(true, "member");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_ban"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("ban member:")
      .setCheck("member");
    this.appendValueInput("reason").appendField("reason:").setCheck("String");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_timeout"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("timeout member:")
      .setCheck("member");
    this.appendValueInput("seconds").appendField("seconds:").setCheck("Number");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_kick"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("kick member:")
      .setCheck("member");
    this.appendValueInput("reason").appendField("reason:").setCheck("String");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_dm"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("send direct message to user/member:")
      .setCheck(["user", "member"]);
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_dm_rows"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("send direct message to user/member:")
      .setCheck(["user", "member"]);
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3c9e56");
  },
};

javascriptGenerator.forBlock["member_dm"] = function (block, generator) {
  var user = generator.valueToCode(block, "member", Order.ATOMIC);
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);

  return buildDmSend(user, { content, embeds });
};

javascriptGenerator.forBlock["member_dm_rows"] = function (block, generator) {
  var user = generator.valueToCode(block, "member", Order.ATOMIC);
  var content = generator.valueToCode(block, "content", Order.ATOMIC);
  var embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  return buildDmSend(user, { content, embeds, rows });
};

Blockly.Blocks["member_setnick"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("change nickname of member:")
      .setCheck("member");
    this.appendValueInput("nickname").setCheck("String").appendField("to:");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_removetimeout"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("remove timeout from member:")
      .setCheck("member");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_bannable"] = {
  init: function () {
    this.appendValueInput("member").setCheck("member").appendField("is member");
    this.appendDummyInput().appendField("bannable by the bot?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_kickable"] = {
  init: function () {
    this.appendValueInput("member").setCheck("member").appendField("is member");
    this.appendDummyInput().appendField("kickable by the bot?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_timedout"] = {
  init: function () {
    this.appendValueInput("member").setCheck("member").appendField("is member");
    this.appendDummyInput().appendField("timed out?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_color"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("display color of member:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_status"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("status of member:");
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
    this.setTooltip('Returns "idle", "online", "dnd", or "offline" as a text');
  },
};

javascriptGenerator.forBlock["member_status"] = function (block, generator) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);

  return [`${member}?.presence?.status || 'offline'`, Order.NONE];
};

Blockly.Blocks["member_userFlags"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("user")
      .appendField("flags of user:");
    this.setOutput(true, "Array");
    this.setColour("#3c9e56");
    this.setTooltip(
      "Returns the flags of a user as a list/array (this includes the user's badges as well as other info",
    );
    this.setHelpUrl(
      "https://discord-api-types.dev/api/discord-api-types-v10/enum/UserFlags",
    );
  },
};

javascriptGenerator.forBlock["member_userFlags"] = function (block, generator) {
  return [
    `${generator.valueToCode(block, "member", Order.ATOMIC)}.flags.toArray()`,
    Order.NONE,
  ];
};

Blockly.Blocks["member_id"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck(["member", "user"])
      .appendField("ID of user/member:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_joined"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("join")
      .appendField(
        new Blockly.FieldDropdown([
          ["date", "joinedAt"],
          ["timestamp", "joinedTimestamp"],
        ]),
        "type",
      )
      .appendField("of member:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_nickname"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("nickname of member:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_user"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("user of member:");
    this.setInputsInline(true);
    this.setOutput(true, "user");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_username"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("user")
      .appendField("username of user:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_dmChannel"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("user")
      .appendField("dM channel of user:");
    this.setInputsInline(true);
    this.setOutput(true, "channel");
    this.setColour("#3c9e56");
  },
};

javascriptGenerator.forBlock["member_dmChannel"] = function (block, generator) {
  return [
    `${generator.valueToCode(block, "member", Order.ATOMIC)}.dmChannel`,
    Order.NONE,
  ];
};

Blockly.Blocks["member_avatarURL"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck(["user", "member"])
      .appendField("avatar URL of user/member:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_bannerURL"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("user")
      .appendField("banner URL of user:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_bot"] = {
  init: function () {
    this.appendValueInput("member").setCheck("user").appendField("is user");
    this.appendDummyInput().appendField("a bot?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_system"] = {
  init: function () {
    this.appendValueInput("member").setCheck("user").appendField("is user");
    this.appendDummyInput().appendField("official Discord?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_accent"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("user")
      .appendField("accent color of user:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
  },
};

Blockly.Blocks["member_created"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("user")
      .appendField("creation")
      .appendField(
        new Blockly.FieldDropdown([
          ["date", "createdAt"],
          ["timestamp", "createdTimestamp"],
        ]),
        "type",
      )
      .appendField("of user:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#3c9e56");
  },
};

javascriptGenerator.forBlock["member_created"] = function (block, generator) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);
  var type = block.getFieldValue("type");

  return [`${member}.${type}`, Order.NONE];
};

javascriptGenerator.forBlock["member_accent"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.hexAccentColor`,
  Order.NONE,
];
javascriptGenerator.forBlock["member_system"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.system`,
  Order.NONE,
];
javascriptGenerator.forBlock["member_bot"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.bot`,
  Order.NONE,
];
javascriptGenerator.forBlock["member_username"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.username`,
  Order.NONE,
];

javascriptGenerator.forBlock["member_avatarURL"] = function (block, generator) {
  return [
    `${generator.valueToCode(block, "user", Order.ATOMIC)}.displayAvatarURL()`,
    Order.NONE,
  ];
};

javascriptGenerator.forBlock["member_bannerURL"] = function (block, generator) {
  return [
    `${generator.valueToCode(block, "user", Order.ATOMIC)}.bannerURL()`,
    Order.NONE,
  ];
};

javascriptGenerator.forBlock["member_user"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.user`,
  Order.NONE,
];
javascriptGenerator.forBlock["member_nickname"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.nickname`,
  Order.NONE,
];

javascriptGenerator.forBlock["member_joined"] = function (block, generator) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);
  var type = block.getFieldValue("type");

  return [`${member}.${type}`, Order.NONE];
};

javascriptGenerator.forBlock["member_id"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.id`,
  Order.NONE,
];
javascriptGenerator.forBlock["member_color"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.displayHexColor`,
  Order.NONE,
];
javascriptGenerator.forBlock["member_timedout"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.isCommunicationDisabled()`,
  Order.NONE,
];
javascriptGenerator.forBlock["member_kickable"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.kickable`,
  Order.NONE,
];
javascriptGenerator.forBlock["member_bannable"] = (b, g) => [
  `${g.valueToCode(b, "member", Order.ATOMIC)}.bannable`,
  Order.NONE,
];

javascriptGenerator.forBlock["member_removetimeout"] = function (
  block,
  generator,
) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", Order.ATOMIC);

  return `${member}.timeout(null, ${reason || "''"});`;
};

javascriptGenerator.forBlock["member_setnick"] = function (block, generator) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);
  var nickname = generator.valueToCode(block, "nickname", Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", Order.ATOMIC);

  return `${member}.setNickname(${nickname || "''"}, ${reason || "''"});`;
};

javascriptGenerator.forBlock["member_kick"] = function (block, generator) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", Order.ATOMIC);

  return `${member}.kick(${reason});`;
};

javascriptGenerator.forBlock["member_timeout"] = function (block, generator) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);
  var seconds = generator.valueToCode(block, "seconds", Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", Order.ATOMIC);

  return `${member}.timeout(${seconds} * 1000, ${reason});`;
};

javascriptGenerator.forBlock["member_ban"] = function (block, generator) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", Order.ATOMIC);

  return `${member}.ban({ reason: ${reason} });`;
};

javascriptGenerator.forBlock["member_member"] = () => [`member`, Order.NONE];

javascriptGenerator.forBlock["member_foreach"] = function (block, generator) {
  var server = generator.valueToCode(block, "server", Order.ATOMIC);
  var codeVal = generator.statementToCode(block, "code");

  return `await ${forEachCollection}(${server}, "members", async (member) => {
    ${codeVal}
  });`;
};

javascriptGenerator.forBlock["member_getuser"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `client.users.cache${
    dropdown_type === "id"
      ? `.get(${value_value})`
      : `.find(u => u.username == ${value_value})`
  }`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["member_getone"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.members.cache${
    dropdown_type === "id"
      ? `.get(${value_value})`
      : `.find(m => m.user.username == ${value_value})`
  }`;
  return [code, Order.NONE];
};

Blockly.Blocks["member_hasPermission"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("does member");
    this.appendValueInput("permission")
      .setCheck("permission")
      .appendField("have the");
    this.appendDummyInput().appendField("?");
    this.setOutput(true, "Boolean");
    this.setColour("#3c9e56");
  },
};

javascriptGenerator.forBlock["member_hasPermission"] = function (
  block,
  generator,
) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);
  var permission = generator.valueToCode(block, "permission", Order.ATOMIC);

  return [`${member}.permissions.has(${permission})`, Order.NONE];
};

createRestrictions(
  ["member_avatarURL", "member_bannerURL"],
  [
    {
      type: "notEmpty",
      blockTypes: ["user"],
      message: "You must specify a user or member",
    },
  ],
);

createRestrictions(
  ["member_member"],
  [
    {
      type: "hasParent",
      blockTypes: ["member_foreach"],
      message: "This block must be under a 'For each member in server' block",
    },
  ],
);

createRestrictions(
  ["member_foreach"],
  [
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify the server to iterate member from.",
    },
  ],
);

createRestrictions(
  [
    "member_bot",
    "member_dm",
    "member_dm_rows",
    "member_kick",
    "member_timeout",
    "member_ban",
    "member_setnick",
    "member_created",
    "member_accent",
    "member_system",
    "member_username",
    "member_user",
    "member_nickname",
    "member_joined",
    "member_id",
    "member_color",
    "member_timedout",
    "member_userFlags",
    "member_removetimeout",
  ],
  [
    {
      type: "notEmpty",
      blockTypes: ["member"],
      message: "You must specify the user/member.",
    },
  ],
);

createRestrictions(
  [
    "member_ban",
    "member_timeout",
    "member_kick",
    "member_setnick",
    "member_removetimeout",
  ],
  [
    {
      type: "validator",
      blockTypes: ["reason"],
      check: (val) => val.length <= 512,
      message: "Reason cannot be greater than 512 characters",
    },
  ],
);
