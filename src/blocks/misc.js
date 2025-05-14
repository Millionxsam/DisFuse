import * as Blockly from "blockly";
import javascript, { javascriptGenerator, Order } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";
import { createMutatorBlock } from "../functions/createMutator.ts";

createMutatorBlock({
  id: "misc_int_reply_mutator",
  optionsBlockId: "misc_int_reply_mutator_options",
  colour: "#4192E9",
  inputs: [
    { type: "dummy", label: "Reply to the interaction" },
    { type: "value", name: "content", check: "String", label: "content:" },
    {
      type: "value",
      name: "ephemeral",
      check: "Boolean",
      label: "visible only to the user?",
    },
  ],
  mutatorFields: [
    {
      name: "embeds",
      label: "include embeds",
      default: false,
      inputType: "value",
      inputLabel: "embed name(s):",
    },
    {
      name: "rows",
      label: "include rows",
      default: false,
      inputType: "statement",
      inputLabel: "rows:",
    },
  ],
  previousStatement: "default",
  nextStatement: "default",
});

javascript.javascriptGenerator.forBlock["misc_int_reply_mutator"] = function (
  block,
  generator
) {
  const content = generator.valueToCode(block, "content", Order.ATOMIC) || "''";
  const embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  const ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);
  const rows = generator.statementToCode(block, "rows");

  const options = [`content: ${content}`];
  if (embeds) options.push(`embeds: [${embeds.replaceAll("'", "")}]`);
  if (rows) options.push(`components: [\n${rows}]`);
  if (ephemeral) options.push(`ephemeral: ${ephemeral}`);

  return `await interaction.reply({
  ${options.join(",\n  ")}
});\n`;
};

createMutatorBlock({
  id: "misc_int_edit_mutator",
  optionsBlockId: "misc_int_edit_mutator_options",
  colour: "#4192E9",
  inputs: [
    { type: "dummy", label: "Edit the reply" },
    { type: "value", name: "content", check: "String", label: "content:" },
  ],
  mutatorFields: [
    {
      name: "embeds",
      label: "include embeds",
      default: false,
      inputType: "value",
      inputLabel: "embed name(s):",
    },
    {
      name: "rows",
      label: "include rows",
      default: false,
      inputType: "statement",
      inputLabel: "rows:",
    },
  ],
  previousStatement: "default",
  nextStatement: "default",
});

javascript.javascriptGenerator.forBlock["misc_int_edit_mutator"] = function (
  block,
  generator
) {
  const content = generator.valueToCode(block, "content", Order.ATOMIC) || "''";
  const embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  const rows = generator.statementToCode(block, "rows");

  const options = [`content: ${content}`];
  if (embeds) options.push(`embeds: [${embeds.replaceAll("'", "")}]`);
  if (rows) options.push(`components: [\n${rows}]`);

  return `await interaction.editReply({
  ${options.join(",\n  ")}
});\n`;
};

createRestrictions(
  [
    "misc_int_reply",
    "misc_int_reply_rows",
    "misc_int_reply_mutator",
    "misc_int_edit",
    "misc_int_edit_mutator",
  ],
  [
    {
      type: "validator",
      blockTypes: ["content"],
      check: (val) => val.length <= 2000,
      message: "The content cannot be greater than 2,000 characters",
    },
    {
      type: "hasHat",
      blockTypes: [
        "slash_received",
        "buttons_event",
        "modal_handle_interaction",
        "menus_event",
        "contextMenu_received",
      ],
      message: "This must be under a interaction event",
    },
    {
      type: "notEmpty",
      blockTypes: ["content", "embeds"],
      message: "You must specify the content or embed(s) to send",
    },
    {
      type: "validator",
      blockTypes: ["embeds"],
      check: (val, workspace) => {
        if (!val.length) return true;

        let embeds = val.split(",");
        let pass = true;

        embeds.forEach((embedName) => {
          if (
            !workspace
              .getAllBlocks(false)
              .find(
                (b) =>
                  b.type === "embed_create" &&
                  b.getFieldValue("name") === embedName.trim()
              )
          )
            pass = false;
        });

        return pass;
      },
      message: "No embed with that name exists",
    },
  ]
);

createRestrictions(
  [
    "misc_int_reply_mutator",
    "misc_int_edit_mutator",
    "misc_int_deferReply",
    "misc_int_user",
    "misc_int_member",
    "misc_int_channel",
    "misc_int_server",
  ],
  [
    {
      type: "hasHat",
      blockTypes: [
        "slash_received",
        "buttons_event",
        "modal_handle_interaction",
        "menus_event",
        "contextMenu_received",
      ],
      message: "This must be under a interaction event",
    },
  ]
);

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

  return `await interaction.deferReply({ ephemeral: ${
    ephemeral || "false"
  } });\n`;
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
        "msg_reply_mutator",
        "msg_reply_rows",
        "misc_reply_rows",
        "channel_send_rows",
        "member_dm_rows",
        "misc_int_reply_rows",
        "misc_int_edit",
        "misc_int_reply_mutator",
        "slash_editreply",
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

Blockly.Blocks["misc_channelType"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("channel type")
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
    this.setOutput(true, "channelType");
    this.setColour("4192E9");
  },
};

javascript.javascriptGenerator.forBlock["misc_channelType"] = (
  block,
  generator
) => {
  return [`Discord.ChannelType.${block.getFieldValue("type")}`, Order.NONE];
};

Blockly.Blocks["misc_int_id"] = {
  init: function () {
    this.appendDummyInput().appendField("id of the interaction");
    this.setInputsInline(false);
    this.setOutput(true, "String");
    this.setColour("#4192E9");
    this.setTooltip("Returns the unique ID of the interaction.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["misc_int_id"] = function (block, generator) {
  return ["interaction.id", Order.NONE];
};

Blockly.Blocks["misc_int_user"] = {
  init: function () {
    this.appendDummyInput().appendField("user of the interaction");
    this.setInputsInline(false);
    this.setOutput(true, "user");
    this.setColour("#4192E9");
    this.setTooltip("Returns the user who triggered the interaction.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["misc_int_user"] = function (block, generator) {
  return ["interaction.user", Order.NONE];
};

Blockly.Blocks["misc_int_member"] = {
  init: function () {
    this.appendDummyInput().appendField("member of the interaction");
    this.setInputsInline(false);
    this.setOutput(true, "member");
    this.setColour("#4192E9");
    this.setTooltip(
      "Returns the member who triggered the interaction (only available in servers)."
    );
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["misc_int_member"] = function (block, generator) {
  return ["interaction.member", Order.NONE];
};

Blockly.Blocks["misc_int_channel"] = {
  init: function () {
    this.appendDummyInput().appendField("channel of the interaction");
    this.setInputsInline(false);
    this.setOutput(true, "channel");
    this.setColour("#4192E9");
    this.setTooltip("Returns the channel where the interaction was invoked.");
    this.setHelpUrl("");
  },
};
javascriptGenerator.forBlock["misc_int_channel"] = function (block, generator) {
  return ["interaction.channel", Order.NONE];
};

Blockly.Blocks["misc_int_server"] = {
  init: function () {
    this.appendDummyInput().appendField("server of the interaction");
    this.setInputsInline(false);
    this.setOutput(true, "server");
    this.setColour("#4192E9");
    this.setTooltip("Returns the server where the interaction occurred.");
    this.setHelpUrl("");
  },
};
javascriptGenerator.forBlock["misc_int_server"] = function (block, generator) {
  return ["interaction.guild", Order.NONE];
};
