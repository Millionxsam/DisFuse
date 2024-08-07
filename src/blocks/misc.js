import * as Blockly from "blockly";
import javascript, { Order } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

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

  var code = `new Discord.ActionRowBuilder().addComponents([${statements_components}]),`;
  return code;
};

createRestrictions(
  ["misc_addrow"],
  [
    {
      type: "surroundParent",
      blockTypes: ["msg_reply_rows", "slash_reply_rows", "channel_send_rows", "member_dm_rows"],
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

  if (value_guild)
    code = `client.guilds.cache.get(${value_guild}).commands.set([${statements_code}
]);`;
  else
    code = `client.application.commands.set([${statements_code}
]);`;

  return code;
};
