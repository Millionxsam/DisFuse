import * as Blockly from "blockly";
import javascript from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

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
        "type"
      )
      .appendField("equal to");
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("on the server");
    this.setOutput(true, null);
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
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
        "type"
      )
      .appendField("equal to");
    this.setOutput(true, "user");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_foreach"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("For each member in server:");
    this.appendStatementInput("code").setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_member"] = {
  init: function () {
    this.appendDummyInput().appendField("current member in loop");
    this.setOutput(true, "member");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_ban"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("Ban member:")
      .setCheck("member");
    this.appendValueInput("reason").appendField("reason:").setCheck("String");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_timeout"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("Timeout member:")
      .setCheck("member");
    this.appendValueInput("seconds").appendField("seconds:").setCheck("Number");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_kick"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("Kick member:")
      .setCheck("member");
    this.appendValueInput("reason").appendField("reason:").setCheck("String");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_dm"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("Send direct message to user/member:")
      .setCheck(["user", "member"]);
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_dm_rows"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("Send direct message to user/member:")
      .setCheck(["user", "member"]);
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck(null).appendField("rows:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_setnick"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("Change nickname of member:")
      .setCheck("member");
    this.appendValueInput("nickname").setCheck("String").appendField("to:");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_removetimeout"] = {
  init: function () {
    this.appendValueInput("member")
      .appendField("Remove timeout from member:")
      .setCheck("member");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_bannable"] = {
  init: function () {
    this.appendValueInput("member").setCheck("member").appendField("member");
    this.appendDummyInput().appendField("is bannable by the bot?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_kickable"] = {
  init: function () {
    this.appendValueInput("member").setCheck("member").appendField("member");
    this.appendDummyInput().appendField("is kickable by the bot?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_timedout"] = {
  init: function () {
    this.appendValueInput("member").setCheck("member").appendField("member");
    this.appendDummyInput().appendField("is timed out?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_color"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("display color of member:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_id"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck(["member", "user"])
      .appendField("ID of user/member:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
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
        "type"
      )
      .appendField("of member:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_nickname"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("nickname of member:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_user"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("user of member:");
    this.setInputsInline(true);
    this.setOutput(true, "user");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_username"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("user")
      .appendField("username of user:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_bot"] = {
  init: function () {
    this.appendValueInput("member").setCheck("user").appendField("user");
    this.appendDummyInput().appendField("is a bot?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_system"] = {
  init: function () {
    this.appendValueInput("member").setCheck("user").appendField("user");
    this.appendDummyInput().appendField("is official Discord?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["member_accent"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("user")
      .appendField("accent color of user:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
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
        "type"
      )
      .appendField("of user:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#00A018");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["member_created"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);
  var type = block.getFieldValue("type");

  var code = `${member}.${type}`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_accent"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.hexAccentColor`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_system"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.system`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_bot"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.bot`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_username"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.username`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_user"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.user`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_nickname"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.nickname`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_joined"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);
  var type = block.getFieldValue("type");

  var code = `${member}.${type}`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_id"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.id`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_color"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.displayHexColor`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_timedout"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.isCommunicationDisabled()`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_kickable"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);

  var code = `${member}.kickable`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_removetimeout"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", javascript.Order.ATOMIC);

  var code = `${member}.timeout(null, ${reason || "''"});`;
  return code;
};

javascript.javascriptGenerator.forBlock["member_setnick"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);
  var nickname = generator.valueToCode(
    block,
    "nickname",
    javascript.Order.ATOMIC
  );
  var reason = generator.valueToCode(block, "reason", javascript.Order.ATOMIC);

  var code = `${member}.setNickname(${nickname || "''"}, ${reason || "''"});`;
  return code;
};

javascript.javascriptGenerator.forBlock["member_dm"] = function (
  block,
  generator
) {
  var user = generator.valueToCode(block, "member", javascript.Order.ATOMIC);
  var content = generator.valueToCode(
    block,
    "content",
    javascript.Order.ATOMIC
  );
  var embeds = generator.valueToCode(block, "embeds", javascript.Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `${user}.send({
    content: ${content || "''"},
    embeds: [${embeds}],
    components: [${rows}]
  });`;
  return code;
};

javascript.javascriptGenerator.forBlock["member_dm"] = function (
  block,
  generator
) {
  var user = generator.valueToCode(block, "member", javascript.Order.ATOMIC);
  var content = generator.valueToCode(
    block,
    "content",
    javascript.Order.ATOMIC
  );
  var embeds = generator.valueToCode(block, "embeds", javascript.Order.ATOMIC);

  var code = `${user}.send({
    content: ${content || "''"},
    embeds: [${embeds}]
  });`;
  return code;
};

javascript.javascriptGenerator.forBlock["member_kick"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", javascript.Order.ATOMIC);

  var code = `${member}.kick(${reason});`;
  return code;
};

javascript.javascriptGenerator.forBlock["member_timeout"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);
  var seconds = generator.valueToCode(
    block,
    "seconds",
    javascript.Order.ATOMIC
  );
  var reason = generator.valueToCode(block, "reason", javascript.Order.ATOMIC);

  var code = `${member}.timeout(${seconds} * 1000, ${reason});`;
  return code;
};

javascript.javascriptGenerator.forBlock["member_ban"] = function (
  block,
  generator
) {
  var member = generator.valueToCode(block, "member", javascript.Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", javascript.Order.ATOMIC);

  var code = `${member}.ban({ reason: ${reason} });`;
  return code;
};

javascript.javascriptGenerator.forBlock["member_member"] = function (
  block,
  generator
) {
  var code = `member`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_foreach"] = function (
  block,
  generator
) {
  var server = generator.valueToCode(block, "server", javascript.Order.ATOMIC);
  var foreach = generator.statementToCode(block, "code");

  var code = `${server}.members.cache.forEach(member => {
        ${foreach}
    });`;
  return code;
};

javascript.javascriptGenerator.forBlock["member_getuser"] = function (
  block,
  generator
) {
  var dropdown_type = block.getFieldValue("type");
  var value_value = generator.valueToCode(
    block,
    "value",
    javascript.Order.ATOMIC
  );

  var code = `client.users.cache${
    dropdown_type === "id"
      ? `.get(${value_value})`
      : `.find(u => u.username == ${value_value})`
  }`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["member_getone"] = function (
  block,
  generator
) {
  var dropdown_type = block.getFieldValue("type");
  var value_value = generator.valueToCode(
    block,
    "value",
    javascript.Order.ATOMIC
  );
  var value_server = generator.valueToCode(
    block,
    "server",
    javascript.Order.ATOMIC
  );

  var code = `${value_server}.members.cache${
    dropdown_type === "id"
      ? `.get(${value_value})`
      : `.find(m => m.username == ${value_value})`
  }`;
  return [code, javascript.Order.NONE];
};

createRestrictions(
  ["member_member"],
  [
    {
      type: "hasParent",
      blockTypes: ["member_foreach"],
      message: "This block must be under a 'for each member in server' block",
    },
  ]
);
