import * as Blockly from "blockly";
import javascript, { Order } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["misc_int_reply"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply to the interaction");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendValueInput("ephemeral")
      .setCheck("Boolean")
      .appendField("visible only to the user?");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#4192E9");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["misc_int_reply_rows"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply to the interaction");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendValueInput("ephemeral")
      .setCheck("Boolean")
      .appendField("visible only to the user?");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#4192E9");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["misc_int_edit"] = {
  init: function () {
    this.appendDummyInput().appendField("Edit the reply");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds")
      .setCheck("String")
      .appendField("embed name(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#4192E9");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["misc_int_edit"] = function (
  block,
  generator
) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `interaction.editReply({
    content: ${value_content || "''"},
    embeds: [${value_embeds.replaceAll("'", "")}],
    components: [
    ${rows}]
  });`;
  return code;
};

javascript.javascriptGenerator.forBlock["misc_int_reply"] = function (
  block,
  generator
) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var value_ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);

  var code = `interaction.reply({
    content: ${value_content || "''"},
    embeds: [${value_embeds.replaceAll("'", "")}],
    ephemeral: ${value_ephemeral || "false"}
  });`;
  return code;
};

javascript.javascriptGenerator.forBlock["misc_int_reply_rows"] = function (
  block,
  generator
) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var value_ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `interaction.reply({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  ephemeral: ${value_ephemeral || "false"},
  components: [
  ${rows}]
  });`;
  return code;
};

Blockly.Blocks["misc_addrow"] = {
  init: function () {
    this.appendDummyInput().appendField("Add a row");
    this.appendStatementInput("components")
      .setCheck("default")
      .appendField("with:");
    this.setPreviousStatement(true, "rows");
    this.setNextStatement(true, "rows");
    this.setColour("4192E9");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["misc_int_deferReply"] = {
  init: function () {
    this.appendDummyInput().appendField("Defer reply");
    this.appendValueInput("ephemeral")
      .appendField("visible only to the user?")
      .setCheck("Boolean");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("4192E9");
    this.setTooltip(
      'This displays the "Bot is thinking..." message. Use this when you need to allow more time for your bot to reply to a command.'
    );
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["misc_int_deferReply"] = function (
  block,
  generator
) {
  var ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);

  var code = `await interaction.deferReply({ ephemeral: ${
    ephemeral || "false"
  } });`;
  return code;
};

Blockly.Blocks["misc_permission"] = {
  init: function () {
    this.setOutput(true, "permission");
    this.setColour("4192E9");
    this.appendDummyInput()
      .appendField("permission")
      .appendField(
        new Blockly.FieldDropdown([
          ["Administrator", "Administrator"],
          ["AddReactions", "AddReactions"],
          ["AttachFiles", "AttachFiles"],
          ["BanMembers", "BanMembers"],
          ["ChangeNickname", "ChangeNickname"],
          ["Connect", "Connect"],
          ["CreateEvents", "CreateEvents"],
          ["CreateGuildExpressions", "CreateGuildExpressions"],
          ["CreateInstantInvite", "CreateInstantInvite"],
          ["CreatePrivateThreads", "CreatePrivateThreads"],
          ["CreatePublicThreads", "CreatePublicThreads"],
          ["DeafenMembers", "DeafenMembers"],
          ["EmbedLinks", "EmbedLinks"],
          ["KickMembers", "KickMembers"],
          ["ManageChannels", "ManageChannels"],
          ["ManageEvents", "ManageEvents"],
          ["ManageGuild", "ManageGuild"],
          ["ManageGuildExpressions", "ManageGuildExpressions"],
          ["ManageMessages", "ManageMessages"],
          ["ManageNicknames", "ManageNicknames"],
          ["ManageRoles", "ManageRoles"],
          ["ManageThreads", "ManageThreads"],
          ["ManageWebhooks", "ManageWebhooks"],
          ["MentionEveryone", "MentionEveryone"],
          ["ModerateMembers", "ModerateMembers"],
          ["MoveMembers", "MoveMembers"],
          ["MuteMembers", "MuteMembers"],
          ["PrioritySpeaker", "PrioritySpeaker"],
          ["ReadMessageHistory", "ReadMessageHistory"],
          ["RequestToSpeak", "RequestToSpeak"],
          ["SendMessages", "SendMessages"],
          ["SendMessagesInThreads", "SendMessagesInThreads"],
          ["SendPolls", "SendPolls"],
          ["SendTTSMessages", "SendTTSMessages"],
          ["SendVoiceMessages", "SendVoiceMessages"],
          ["Speak", "Speak"],
          ["Stream", "Stream"],
          ["UseApplicationCommands", "UseApplicationCommands"],
          ["UseEmbeddedActivities", "UseEmbeddedActivities"],
          ["UseExternalApps", "UseExternalApps"],
          ["UseExternalEmojis", "UseExternalEmojis"],
          ["UseExternalSounds", "UseExternalSounds"],
          ["UseExternalStickers", "UseExternalStickers"],
          ["UseSoundboard", "UseSoundboard"],
          ["UseVAD", "UseVAD"],
          ["ViewAuditLog", "ViewAuditLog"],
          ["ViewChannel", "ViewChannel"],
          [
            "ViewCreatorMonetizationAnalytics",
            "ViewCreatorMonetizationAnalytics",
          ],
          ["ViewGuildInsights", "ViewGuildInsights"],
        ]),
        "permission"
      );
  },
};

javascript.javascriptGenerator.forBlock["misc_permission"] = function (
  block,
  generator
) {
  var perm = block.getFieldValue("permission");
  return [`Discord.PermissionFlagsBits.${perm}`, Order.NONE];
};

javascript.javascriptGenerator.forBlock["misc_addrow"] = function (
  block,
  generator
) {
  var statements_components = generator.statementToCode(block, "components");

  var code = `new Discord.ActionRowBuilder().addComponents(
  ${statements_components}),\n`;
  return code;
};

createRestrictions(
  ["misc_addrow"],
  [
    {
      type: "surroundParent",
      blockTypes: [
        "msg_reply_rows",
        "misc_reply_rows",
        "channel_send_rows",
        "member_dm_rows",
        "misc_int_reply_rows",
      ],
      message: "This block must be under a block that has a 'rows' section",
    },
  ]
);

Blockly.Blocks["misc_createcontainer"] = {
  init: function () {
    this.appendDummyInput().appendField("Set slash commands / context menus");
    this.appendValueInput("guild")
      .setCheck("String")
      .appendField("guild ID (leave blank for global commands and menus):");
    this.appendStatementInput("code").setCheck([
      "contextMenuCreate",
      "slashCreate",
    ]);
    this.setInputsInline(false);
    this.setColour("4192E9");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
};

javascript.javascriptGenerator.forBlock["misc_createcontainer"] = function (
  block,
  generator
) {
  var value_guild = generator.valueToCode(block, "guild", Order.ATOMIC);
  var statements_code = generator.statementToCode(block, "code");

  var code;

  if (value_guild?.length > 15)
    code = `client.guilds.cache.get(${value_guild}).commands.set([${statements_code}
]);`;
  else
    code = `client.application.commands.set([${statements_code}
]);`;

  return code;
};

Blockly.Blocks["misc_everyone"] = {
  init: function () {
    this.appendDummyInput().appendField("@everyone");
    this.setOutput(true, "everyone");
    this.setColour("4192E9");
  },
};

javascript.javascriptGenerator.forBlock["misc_everyone"] = () => [
  "everyone",
  Order.NONE,
];

Blockly.Blocks["misc_permissionChannel"] = {
  init: function () {
    this.setOutput(true, "permissionChannel");
    this.setColour("4192E9");
    this.appendDummyInput()
      .appendField("permission")
      .appendField(
        new Blockly.FieldDropdown([
          ["ViewChannel", "ViewChannel"],
          ["SendMessages", "SendMessages"],
          ["SendTTSMessages", "SendTTSMessages"],
          ["ManageMessages", "ManageMessages"],
          ["EmbedLinks", "EmbedLinks"],
          ["AttachFiles", "AttachFiles"],
          ["ReadMessageHistory", "ReadMessageHistory"],
          ["MentionEveryone", "MentionEveryone"],
          ["UseExternalEmojis", "UseExternalEmojis"],
          ["AddReactions", "AddReactions"],
          ["ManageThreads", "ManageThreads"],
          ["CreatePublicThreads", "CreatePublicThreads"],
          ["CreatePrivateThreads", "CreatePrivateThreads"],
          ["SendMessagesInThreads", "SendMessagesInThreads"],
          ["UseSlashCommands", "UseSlashCommands"],
          ["UseExternalStickers", "UseExternalStickers"],
        ]),
        "permission"
      );
  },
};

javascript.javascriptGenerator.forBlock["misc_permissionChannel"] = function (
  block
) {
  var perm = block.getFieldValue("permission");
  return [`'${perm}'`, Order.NONE];
};

createRestrictions(
  ["misc_permissionChannel"],
  [
    {
      type: "hasParent",
      blockTypes: ["channel_set_permission"],
      message:
        "This block must be be in a 'set permission ... to ... in channel' block",
    },
  ]
);

Blockly.Blocks["misc_messageSent"] = {
  init: function () {
    this.appendDummyInput().appendField("message sent by the bot");
    this.setOutput(true, "message");
    this.setColour("4192E9");
  },
};

javascript.javascriptGenerator.forBlock["misc_messageSent"] = () => [
  "messageSent",
  Order.NONE,
];

createRestrictions(
  ["misc_messageSent"],
  [
    {
      type: "hasParent",
      blockTypes: [
        "msg_reply",
        "msg_reply_rows",
        "channel_send",
        "channel_send_rows",
      ],
      message:
        "This block must be be in a 'reply to message' or 'send in channel' block",
    },
  ]
);
