import * as Blockly from "blockly";
import javascript, { Order } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["misc_int_reply_mutator_options"] = {
  init() {
    this.appendDummyInput()
      .appendField("include embeds")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "embeds");
    this.appendDummyInput()
      .appendField("include rows")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "rows");
    this.setColour("#4192E9");
    this.setInputsInline(false);
    this.contextMenu = false;
  },
};

Blockly.Blocks["misc_int_reply_mutator"] = {
  init() {
    this.appendDummyInput().appendField("Reply to the interaction");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("ephemeral")
      .setCheck("Boolean")
      .appendField("visible only to the user?");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#4192E9");

    this.setMutator(new Blockly.icons.MutatorIcon([], this));
    this.settings_ = { embeds: false, rows: false };
    this.update_();
  },
  mutationToDom() {
    const mutation = document.createElement("mutation");
    mutation.setAttribute("embed", this.settings_.embeds);
    mutation.setAttribute("rows", this.settings_.rows);
    return mutation;
  },
  domToMutation(xml) {
    this.settings_ = {
      embeds: xml.getAttribute("embed") === "true",
      rows: xml.getAttribute("rows") === "true",
    };
    this.update_();
  },
  decompose(ws) {
    const block = ws.newBlock("misc_int_reply_mutator_options");
    block.initSvg();
    block.setFieldValue(this.settings_.embeds ? "TRUE" : "FALSE", "embeds");
    block.setFieldValue(this.settings_.rows ? "TRUE" : "FALSE", "rows");
    return block;
  },
  compose(opt) {
    this.settings_ = {
      embeds: opt.getFieldValue("embeds") === "TRUE",
      rows: opt.getFieldValue("rows") === "TRUE",
    };
    this.update_();
  },
  update_() {
    const saved = {
      embeds: this.getInput("embeds")?.connection?.targetConnection || null,
      rows: this.getInput("rows")?.connection?.targetConnection || null,
    };

    if (this.getInput("embeds")) this.removeInput("embeds");
    if (this.getInput("rows")) this.removeInput("rows");

    if (this.settings_.embeds) {
      const input = this.appendValueInput("embeds")
        .setCheck("String")
        .appendField("embed name(s):");

      if (saved.embeds) input.connection.connect(saved.embeds);
    }

    if (this.settings_.rows) {
      const input = this.appendStatementInput("rows")
        .setCheck("rows")
        .appendField("rows:");

      if (saved.rows) input.connection.connect(saved.rows);
    }

    this._saved = null;
  },
};

/* deprecated */
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

/* deprecated */
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

/* deprecated */
javascript.javascriptGenerator.forBlock["misc_int_reply"] = function (
  block,
  generator
) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var value_ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);

  var code = `await interaction.reply({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  ephemeral: ${value_ephemeral || "false"}
});\n`;
  return code;
};

/* deprecated */
javascript.javascriptGenerator.forBlock["misc_int_reply_rows"] = function (
  block,
  generator
) {
  var value_content = generator.valueToCode(block, "content", Order.ATOMIC);
  var value_embeds = generator.valueToCode(block, "embeds", Order.ATOMIC);
  var value_ephemeral = generator.valueToCode(block, "ephemeral", Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `await interaction.reply({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  ephemeral: ${value_ephemeral || "false"},
  components: [${rows}]
});\n`;
  return code;
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

  var code = `await interaction.editReply({
  content: ${value_content || "''"},
  embeds: [${value_embeds.replaceAll("'", "")}],
  components: [${rows}]
});\n`;
  return code;
};

createRestrictions(
  [
    "misc_int_reply",
    "misc_int_reply_rows",
    "misc_int_reply_mutator",
    "misc_int_edit",
  ],
  [
    {
      type: "validator",
      blockTypes: ["content"],
      check: (val) => val.length <= 2000,
      message: "Content cannot be greator than 2,000 characters",
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
  ["misc_int_deferReply"],
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
