import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["channel_send"] = {
  init: function () {
    this.appendDummyInput().appendField("Send a message");
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("in channel:");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("then").appendField("then:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_send_rows"] = {
  init: function () {
    this.appendDummyInput().appendField("Send a message");
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("in channel:");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.appendStatementInput("then").appendField("then:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_setnsfw"] = {
  init: function () {
    this.appendValueInput("set")
      .setCheck("Boolean")
      .appendField("Set NSFW to:");
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("on channel:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_foreach"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("For each channel on the server:");
    this.appendStatementInput("code").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_fetchLastMessages"] = {
  init: function () {
    this.appendValueInput("amount").setCheck("Number").appendField("Get last");
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("messages of channel:");
    this.appendStatementInput("code").appendField("then:").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#AD509B");
    this.setInputsInline(true);
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_fetchedLastMessages"] = {
  init: function () {
    this.appendValueInput("number").appendField("message #").setCheck("Number");
    this.setOutput(true, "message");
    this.setColour("#AD509B");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_channel"] = {
  init: function () {
    this.appendDummyInput().appendField("current channel on the loop");
    this.setOutput(true, "channel");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_setslowmode"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("Set slowmode of channel:");
    this.appendValueInput("time")
      .setCheck("Number")
      .appendField("to (seconds):");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_settopic"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("Set topic of channel:");
    this.appendValueInput("topic").setCheck("String").appendField("to:");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_syncPerms"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("Sync permissions of channel:");
    this.appendDummyInput().appendField("to its category");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_starttyping"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("Start typing on channel:");
    this.appendValueInput("wait")
      .setCheck("Number")
      .appendField("and wait (seconds):");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_bulkdelete"] = {
  init: function () {
    this.appendValueInput("amount")
      .appendField("Delete the last")
      .setCheck("Number");
    this.appendValueInput("channel")
      .appendField("messages on channel:")
      .setCheck("channel");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setInputsInline(true);
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_setautoarchive"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Set thread auto archive duration to:")
      .appendField(
        new Blockly.FieldDropdown([
          ["One hour", "60"],
          ["One day", "1440"],
          ["One week", "10080"],
          ["Three days", "4320"],
        ]),
        "duration"
      );
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("for channel:");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_getslowmode"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("slowmode (seconds) of channel:");
    this.setOutput(true, "Number");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_getnsfw"] = {
  init: function () {
    this.appendValueInput("channel").setCheck("channel").appendField("channel");
    this.appendDummyInput().appendField("is NSFW?");
    this.setOutput(true, "Boolean");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_getParent"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("category of channel:");
    this.setOutput(true, "channel");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_gettopic"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("topic of channel:");
    this.setOutput(true, "String");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_gettype"] = {
  init: function () {
    this.appendValueInput("channel").setCheck("channel").appendField("channel");
    this.appendDummyInput()
      .appendField("is")
      .appendField(
        new Blockly.FieldDropdown([
          ["Text channel", "0"],
          ["Voice channel", "2"],
          ["Category", "4"],
          ["Public thread", "11"],
          ["Private thread", "12"],
          ["Announcement channel", "5"],
          ["Announcement thread", "10"],
          ["Forum channel", "15"],
          ["Stage channel", "13"],
          ["Media channel", "16"],
          ["DM", "1"],
        ]),
        "type"
      )
      .appendField("?");
    this.setOutput(true, "Boolean");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_getone"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("get the channel with the")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["id", "id"],
        ]),
        "type"
      )
      .appendField("equal to");
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("on the server");
    this.setOutput(true, "channel");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_deletable"] = {
  init: function () {
    this.appendValueInput("channel").setCheck("channel").appendField("channel");
    this.appendDummyInput().appendField("is deletable by the bot?");
    this.setOutput(true, "Boolean");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_manageable"] = {
  init: function () {
    this.appendValueInput("channel").setCheck("channel").appendField("channel");
    this.appendDummyInput().appendField("is manageable by the bot?");
    this.setOutput(true, "Boolean");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_name"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("name of channel:");
    this.setOutput(true, "String");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_id"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("ID of channel:");
    this.setOutput(true, "String");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_url"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("URL of channel:");
    this.setOutput(true, "String");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_created"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("creation")
      .appendField(
        new Blockly.FieldDropdown([
          ["date", "createdAt"],
          ["timestamp", "createdTimestamp"],
        ]),
        "type"
      )
      .appendField("of channel:");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_clone"] = {
  init: function () {
    this.appendValueInput("channel")
      .appendField("Clone the channel:")
      .setCheck("channel");
    this.appendValueInput("name").appendField("new name:").setCheck("String");
    this.appendStatementInput("then").appendField("then:");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_setParent"] = {
  init: function () {
    this.appendValueInput("channel")
      .appendField("Move the channel:")
      .setCheck("channel");
    this.appendValueInput("category")
      .appendField("to category:")
      .setCheck("channel");
    this.appendValueInput("syncPerms")
      .appendField("sync permissions?")
      .setCheck("Boolean");
    this.appendValueInput("reason").appendField("reason:").setCheck("String");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["channel_setParent"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var category = generator.valueToCode(block, "category", Order.NONE);
  var lockPerms = generator.valueToCode(block, "syncPerms", Order.NONE);
  var reason = generator.valueToCode(block, "reason", Order.NONE);

  var code = `${channel}.setParent(${category}, {
    lockPermissions: ${lockPerms || "true"},
    reason: ${reason || "undefined"}
  });`;
  return code;
};

Blockly.Blocks["channel_setPosition"] = {
  init: function () {
    this.appendValueInput("channel")
      .appendField("Move the channel:")
      .setCheck("channel");
    this.appendValueInput("position")
      .appendField("to position #:")
      .setCheck("Number");
    this.appendValueInput("reason").appendField("reason:").setCheck("String");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["channel_setPosition"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var position = generator.valueToCode(block, "position", Order.NONE);
  var reason = generator.valueToCode(block, "reason", Order.NONE);

  var code = `${channel}.setPosition(${position}, {
    reason: ${reason || "undefined"}
  });`;
  return code;
};

Blockly.Blocks["channel_create"] = {
  init: function () {
    this.appendDummyInput().appendField("Create a channel");
    this.appendValueInput("guild")
      .appendField("in the server:")
      .setCheck("server");
    this.appendValueInput("name").appendField("name:").setCheck("String");
    this.appendValueInput("parent")
      .appendField("in category:")
      .setCheck("channel");
    this.appendDummyInput()
      .appendField("type:")
      .appendField(
        new Blockly.FieldDropdown([
          ["announcements", "GuildAnnouncement"],
          ["category", "GuildCategory"],
          ["forum", "GuildForum"],
          ["media", "GuildMedia"],
          ["stage", "GuildStageVoice"],
          ["text", "GuildText"],
          ["voice", "GuildVoice"],
        ]),
        "type"
      );
    this.appendStatementInput("then").appendField("then:");
    this.setInputsInline(false);
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_createdChannel"] = {
  init: function () {
    this.appendDummyInput().appendField("created channel");
    this.setOutput(true, "channel");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["channel_createdChannel"] = function (
  block,
  generator
) {
  var code = `createdChannel`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_create"] = function (block, generator) {
  const guild = generator.valueToCode(block, "guild", Order.ATOMIC);
  const name = generator.valueToCode(block, "name", Order.NONE);
  const parent = generator.valueToCode(block, "parent", Order.NONE);
  const type = block.getFieldValue("type");
  const then = generator.statementToCode(block, "then");

  return `${guild}.channels.create({
    name: ${name || "''"},
    parent: ${parent || "null"},
    type: Discord.ChannelType.${type}
  })${then
      ? `.then(async (createdChannel) => {
  ${then}});`
      : ";"
    }`;
};

Blockly.Blocks["channel_del"] = {
  init: function () {
    this.appendValueInput("channel")
      .appendField("Delete the channel:")
      .setCheck("channel");
    this.appendValueInput("reason").appendField("reason:").setCheck("String");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["channel_setname"] = {
  init: function () {
    this.appendValueInput("channel")
      .appendField("Rename channel:")
      .setCheck("channel");
    this.appendValueInput("name").appendField("new name:").setCheck("String");
    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["channel_setname"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var name = generator.valueToCode(block, "name", Order.NONE);

  var code = `${channel}.setName(${name});`;
  return code;
};

javascriptGenerator.forBlock["channel_del"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", Order.NONE);

  var code = `${channel}.delete(${reason});`;
  return code;
};

javascriptGenerator.forBlock["channel_clone"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var name = generator.valueToCode(block, "name", Order.NONE);
  var then = generator.statementToCode(block, "then");

  var code = `${channel}.clone({ name: ${name || `${channel}.name`
    } }).then(async (createdChannel) => {
    ${then}});\n`;

  return code;
};

javascriptGenerator.forBlock["channel_created"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var type = block.getFieldValue("type");

  var code = `${channel}.${type}`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_url"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.url`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_id"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.id`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_name"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.name`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_manageable"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.manageable`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_deletable"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.deleteable`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_getone"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.channels.cache${dropdown_type === "id"
    ? `.get(${value_value})`
    : `.find(c => c.name == ${value_value})`
    }`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_gettype"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var type = block.getFieldValue("type");

  var code = `${channel}.type === ${type}`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_gettopic"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.topic`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_getnsfw"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.nsfw`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_getParent"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.parent`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_getslowmode"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.rateLimitPerUser`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_setautoarchive"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", Order.ATOMIC);
  var duration = block.getFieldValue("duration");

  var code = `${channel}.setDefaultAutoArchiveDuration(${duration}, ${reason})`;
  return code;
};

javascriptGenerator.forBlock["channel_bulkdelete"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var amount = generator.valueToCode(block, "amount", Order.ATOMIC);

  var code = `${channel}.bulkDelete(${amount});`;
  return code;
};

javascriptGenerator.forBlock["channel_starttyping"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var wait = generator.valueToCode(block, "wait", Order.ATOMIC);

  var code = `${channel}.sendTyping();\nwait(${wait} * 1000);`;
  return code;
};

javascriptGenerator.forBlock["channel_settopic"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var topic = generator.valueToCode(block, "topic", Order.ATOMIC);

  var code = `${channel}.setTopic(${topic});`;
  return code;
};

javascriptGenerator.forBlock["channel_syncPerms"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);

  var code = `${channel}.lockPermissions();`;
  return code;
};

javascriptGenerator.forBlock["channel_setslowmode"] = function (
  block,
  generator
) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var time = generator.valueToCode(block, "time", Order.ATOMIC);
  var reason = generator.valueToCode(block, "reason", Order.ATOMIC);

  var code = `${channel}.setRateLimitPerUser(${time}, ${reason});`;
  return code;
};

javascriptGenerator.forBlock["channel_channel"] = function (block, generator) {
  var code = `channel`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_foreach"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);
  var codeVal = generator.statementToCode(block, "code");

  var code = `${value_server}.channels.cache.forEach(channel => {
    ${codeVal}});\n`;
  return code;
};

javascriptGenerator.forBlock["channel_fetchLastMessages"] = function (
  block,
  generator
) {
  var amount = generator.valueToCode(block, "amount", Order.ATOMIC);
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var statement = generator.statementToCode(block, "code");

  var code = `${channel}.messages.fetch({
    limit: ${amount}
  }).then(fetchedMessages => {
    ${statement}
  });`;
  return code;
};

javascriptGenerator.forBlock["channel_fetchedLastMessages"] = function (
  block,
  generator
) {
  var number = generator.valueToCode(block, "number", Order.ATOMIC);

  var code = `fetchedMessages.at(${number} - 1)`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["channel_setnsfw"] = function (block, generator) {
  var value_channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var value_enabled = generator.valueToCode(block, "set", Order.ATOMIC);

  var code = `${value_channel}.setNSFW(${value_enabled});`;
  return code;
};

javascriptGenerator.forBlock["channel_send"] = function (block, generator) {
  var value_channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var then = generator.statementToCode(block, "then");

  var code = `${value_channel}.send({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}]
}).then((messageSent) => {
  ${then}});\n`;
  return code;
};

javascriptGenerator.forBlock["channel_send_rows"] = function (
  block,
  generator
) {
  var value_channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");
  var then = generator.statementToCode(block, "then");

  var code = `${value_channel}.send({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  components: [
  ${rows}]
}).then((messageSent) => {
  ${then}});\n`;

  return code;
};

createRestrictions(
  ["channel_send", "channel_send_rows"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel to send the message in",
    },
    {
      type: "notEmpty",
      blockTypes: ["content", "embeds"],
      message: "You must specify the content or embeds to send",
    },
  ]
);

createRestrictions(
  ["channel_setParent"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel to move",
    },
    {
      type: "notEmpty",
      blockTypes: ["category"],
      message: "You must specify the category to move the channel to",
    },
  ]
);

createRestrictions(
  ["channel_setPosition"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel to move",
    },
    {
      type: "notEmpty",
      blockTypes: ["position"],
      message: "You must specify the position to move the channel to",
    },
  ]
);

createRestrictions(
  ["channel_create"],
  [
    {
      type: "notEmpty",
      blockTypes: ["guild"],
      message: "You must specify what server to create a channel in",
    },
    {
      type: "notEmpty",
      blockTypes: ["name"],
      message: "You must specify the name of the channel",
    },
  ]
);

createRestrictions(
  ["channel_createdChannel"],
  [
    {
      type: "hasParent",
      blockTypes: ["channel_create", "channel_clone"],
      message:
        "This block must be under a 'create channel' or 'clone channel' block",
    },
  ]
);

createRestrictions(
  ["channel_fetchedLastMessages"],
  [
    {
      type: "hasParent",
      blockTypes: ["channel_fetchLastMessages"],
      message:
        "This block must be under a 'get last messages of channel' block",
    },
  ]
);

createRestrictions(
  ["channel_foreach"],
  [
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify the server to iterate channels from.",
    },
  ]
);

Blockly.Blocks["channel_set_permission"] = {
  init: function () {
    this.appendValueInput("permission")
      .setCheck("permissionChannel")
      .appendField("Set");
    this.appendDummyInput()
      .appendField("to")
      .appendField(
        new Blockly.FieldDropdown([
          ["Allow", "allow"],
          ["Block", "block"],
        ]),
        "action"
      );
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("on channel:");
    this.appendValueInput("role")
      .setCheck(["role", "everyone", "member"])
      .appendField("for role/everyone/member:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#AD509B");
    this.setTooltip(
      "Sets a permission for a role, everyone or a member on a channel."
    );
  },
};

javascriptGenerator.forBlock["channel_set_permission"] = function (
  block,
  generator
) {
  const permission = generator.valueToCode(block, "permission", Order.NONE);
  const action = block.getFieldValue("action");
  const channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  const role = generator.valueToCode(block, "role", Order.ATOMIC);

  const allow = action === "allow" ? "true" : "false";

  if (role === "(everyone)") {
    return `let permsChannel = ${channel};
permsChannel.permissionOverwrites.edit(permsChannel.guild.roles.everyone, { ${permission}: ${allow} });\n`;
  } else {
    return `${channel}.permissionOverwrites.edit(${role}, { ${permission}: ${allow} });\n`;
  }
};

createRestrictions(
  ["channel_getParent", "channel_syncPerms"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel",
    },
  ]
);

createRestrictions(
  ["channel_set_permission"],
  [
    {
      type: "notEmpty",
      blockTypes: ["permission"],
      message: "You must specify the permission to edit",
    },
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel",
    },
    {
      type: "notEmpty",
      blockTypes: ["role"],
      message: "You must specify the role, everyone or the member",
    },
  ]
);
