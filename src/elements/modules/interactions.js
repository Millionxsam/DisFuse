/* =====================================================================
   Builder catalog: commands and right-click commands
   ---------------------------------------------------------------------
   Slash commands and right-click (context menu) commands. In the
   builder they're made on the Commands page, so the block editor's
   "add slash command" blocks have no step of their own; what's here
   are the events for handling any command by hand, and the values
   that read a command.
   ===================================================================== */

import { ANY, group, input } from "../define.js";

const { event, value, block } = group({ colour: "#3366CC" });

const events = [
  event({
    id: "slash_command_used",
    label: "When a slash command is used",
    description:
      "Runs for every slash command, for custom handling. Most of the time, build commands on the Commands page instead.",
    category: "interactions",
    icon: "fa-solid fa-terminal",
    keywords: ["slash command", "interaction", "command received"],
    block: [
      {
        type: "slash_received",
        body: { name: "event", check: "default" },
        text: "when a slash command is received",
        inline: false,
      },
      {
        type: "slash_received_named",
        body: { name: "event", check: "default" },
        text: ["when slash command named {commandName}", "is received"],
        parts: { commandName: { name: "name" } },
        inline: true,
      },
    ],
    listen: "Discord.Events.InteractionCreate",
    params: ["interaction"],
    provides: ["interaction", "repliable", "showModal", "chatInput"],
    values: [
      {
        key: "name",
        label: "Command name",
        type: "String",
        code: "interaction.commandName",
        block: {
          type: "slash_name",
          text: "name of the command",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["slash_received", "slash_received_named"],
              message: 'This block must be under "when slash command received" event',
            },
          ],
        },
      },
      {
        key: "subcommand",
        label: "Subcommand name",
        type: "String",
        code: "interaction.options.getSubcommand(false)",
        description: "Empty if the command has no subcommands.",
      },
      {
        key: "group",
        label: "Subcommand group name",
        type: "String",
        code: "interaction.options.getSubcommandGroup(false)",
      },
    ],
    settings: [
      input.text("commandName", "Only for the command named", {
        default: "",
        allowValues: false,
        help: "Leave it empty to run for every slash command.",
        placeholder: "ping",
      }),
    ],
    prelude: (ctx) =>
      "if (!interaction.isChatInputCommand()) return;\n" +
      (ctx.has("commandName")
        ? `if (interaction.commandName !== ${ctx.input("commandName")}) return;\n`
        : ""),
  }),
  event({
    id: "context_menu_used",
    label: "When a right-click command is used",
    description:
      "Runs for every right-click (Apps menu) command, for custom handling. Most of the time, build them on the Commands page instead.",
    category: "interactions",
    icon: "fa-solid fa-computer-mouse",
    keywords: ["context menu", "right click", "apps", "user command", "message command"],
    block: {
      type: "contextMenu_received",
      body: { name: "event", check: "default" },
      text: "when a context menu is clicked",
      colour: "#00A859",
      inline: false,
    },
    listen: "Discord.Events.InteractionCreate",
    params: ["interaction"],
    provides: ["interaction", "repliable", "showModal", "contextMenu"],
    values: [
      {
        key: "name",
        label: "Command name",
        type: "String",
        code: "interaction.commandName",
        block: {
          type: "contextMenu_name",
          text: "name of the context menu",
          colour: "#00A859",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["contextMenu_received"],
              message: 'This block must be under "when a context menu is clicked" event',
            },
          ],
        },
      },
      {
        key: "onUser",
        label: "Was it used on a user?",
        type: "Boolean",
        code: "interaction.isUserContextMenuCommand()",
        block: {
          type: "contextMenu_userMenu",
          text: "is the menu an user menu?",
          colour: "#00A859",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["contextMenu_received"],
              message: 'This block must be under "when a context menu is clicked" event',
            },
          ],
        },
      },
      {
        key: "onMessage",
        label: "Was it used on a message?",
        type: "Boolean",
        code: "interaction.isMessageContextMenuCommand()",
        block: {
          type: "contextMenu_messageMenu",
          text: "is the menu a message menu?",
          colour: "#00A859",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["contextMenu_received"],
              message: 'This block must be under "when a context menu is clicked" event',
            },
          ],
        },
      },
      {
        key: "user",
        label: "Right-clicked user",
        type: "user",
        code: "interaction.targetUser",
        description: "Empty when it was used on a message.",
        block: {
          type: "contextMenu_targetUser",
          text: "selected user of the menu",
          colour: "#00A859",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["contextMenu_received"],
              message: 'This block must be under "when a context menu is clicked" event',
            },
          ],
        },
      },
      {
        key: "message",
        label: "Right-clicked message",
        type: "message",
        code: "interaction.targetMessage",
        description: "Empty when it was used on a user.",
        block: {
          type: "contextMenu_targetMessage",
          text: "selected message of the menu",
          colour: "#00A859",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["contextMenu_received"],
              message: 'This block must be under "when a context menu is clicked" event',
            },
          ],
        },
      },
    ],
    settings: [
      input.text("commandName", "Only for the command named", {
        default: "",
        allowValues: false,
        help: "Leave it empty to run for every right-click command.",
      }),
    ],
    prelude: (ctx) =>
      "if (!interaction.isContextMenuCommand()) return;\n" +
      (ctx.has("commandName")
        ? `if (interaction.commandName !== ${ctx.input("commandName")}) return;\n`
        : ""),
  }),
  event({
    id: "interaction_any",
    label: "When anything is used",
    description: "Runs whenever someone uses any command, button, menu or form of the bot.",
    category: "interactions",
    icon: "fa-solid fa-hand-sparkles",
    keywords: ["interaction", "interaction received", "any"],
    block: {
      type: "events_interaction_any",
      body: { name: "event", check: "default" },
      text: "when any interaction is received",
      colour: "#00A859",
      inline: false,
    },
    listen: "Discord.Events.InteractionCreate",
    params: ["interaction"],
    provides: ["interaction"],
    values: [
      {
        key: "id",
        label: "Command name, or button, menu or form ID",
        type: "String",
        code: "(interaction.commandName ?? interaction.customId)",
      },
      {
        key: "isCommand",
        label: "Is it a command?",
        type: "Boolean",
        code: "interaction.isCommand()",
      },
      {
        key: "isButton",
        label: "Is it a button?",
        type: "Boolean",
        code: "interaction.isButton()",
      },
      {
        key: "isMenu",
        label: "Is it a menu?",
        type: "Boolean",
        code: "interaction.isAnySelectMenu()",
      },
      {
        key: "isForm",
        label: "Is it a form?",
        type: "Boolean",
        code: "interaction.isModalSubmit()",
      },
    ],
  }),
];

const actions = [];

const values = [
  value({
    id: "permission_value",
    label: "Permission",
    description: "One of Discord's permissions, like Ban Members.",
    category: "roles",
    group: "Permissions",
    icon: "fa-solid fa-key",
    keywords: ["permission", "perms", "admin"],
    block: {
      type: "misc_permission",
      text: "permission {permission}",
      parts: {
        permission: {
          options: [
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
            ["ViewCreatorMonetizationAnalytics", "ViewCreatorMonetizationAnalytics"],
            ["ViewGuildInsights", "ViewGuildInsights"],
          ],
        },
      },
      colour: "4192E9",
    },
    output: "permission",
    inputs: [
      input.dropdown(
        "permission",
        "Permission",
        [
          ["Administrator", "Administrator"],
          ["Add Reactions", "AddReactions"],
          ["Attach Files", "AttachFiles"],
          ["Ban Members", "BanMembers"],
          ["Change Nickname", "ChangeNickname"],
          ["Connect", "Connect"],
          ["Create Events", "CreateEvents"],
          ["Create Expressions", "CreateGuildExpressions"],
          ["Create Invite", "CreateInstantInvite"],
          ["Create Private Threads", "CreatePrivateThreads"],
          ["Create Public Threads", "CreatePublicThreads"],
          ["Deafen Members", "DeafenMembers"],
          ["Embed Links", "EmbedLinks"],
          ["Kick Members", "KickMembers"],
          ["Manage Channels", "ManageChannels"],
          ["Manage Events", "ManageEvents"],
          ["Manage Server", "ManageGuild"],
          ["Manage Expressions", "ManageGuildExpressions"],
          ["Manage Messages", "ManageMessages"],
          ["Manage Nicknames", "ManageNicknames"],
          ["Manage Roles", "ManageRoles"],
          ["Manage Threads", "ManageThreads"],
          ["Manage Webhooks", "ManageWebhooks"],
          ["Mention Everyone", "MentionEveryone"],
          ["Timeout Members", "ModerateMembers"],
          ["Move Members", "MoveMembers"],
          ["Mute Members", "MuteMembers"],
          ["Priority Speaker", "PrioritySpeaker"],
          ["Read Message History", "ReadMessageHistory"],
          ["Request To Speak", "RequestToSpeak"],
          ["Send Messages", "SendMessages"],
          ["Send Messages In Threads", "SendMessagesInThreads"],
          ["Send Polls", "SendPolls"],
          ["Send Text-to-Speech Messages", "SendTTSMessages"],
          ["Send Voice Messages", "SendVoiceMessages"],
          ["Speak", "Speak"],
          ["Video", "Stream"],
          ["Use Application Commands", "UseApplicationCommands"],
          ["Use Activities", "UseEmbeddedActivities"],
          ["Use External Apps", "UseExternalApps"],
          ["Use External Emojis", "UseExternalEmojis"],
          ["Use External Sounds", "UseExternalSounds"],
          ["Use External Stickers", "UseExternalStickers"],
          ["Use Soundboard", "UseSoundboard"],
          ["Use Voice Activity", "UseVAD"],
          ["View Audit Log", "ViewAuditLog"],
          ["View Channel", "ViewChannel"],
          ["View Creator Analytics", "ViewCreatorMonetizationAnalytics"],
          ["View Server Insights", "ViewGuildInsights"],
        ],
        { default: "Administrator" },
      ),
    ],
    code: (ctx) => `Discord.PermissionFlagsBits.${ctx.raw("permission")}`,
  }),
  value({
    id: "slash_option_by_name",
    label: "Slash command option by name",
    description:
      "What someone entered for an option, found by the option's name. On the Commands page, options are already listed as values.",
    category: "interactions",
    icon: "fa-solid fa-sliders",
    keywords: ["option", "argument", "get option"],
    block: {
      type: "slash_getoption",
      text: ["get {type}", "option value with name: {name}"],
      parts: {
        type: {
          options: [
            ["text", "String"],
            ["attachment", "Attachment"],
            ["true/false", "Boolean"],
            ["channel", "Channel"],
            ["integer", "Integer"],
            ["mentionable", "Mentionable"],
            ["number", "Number"],
            ["role", "Role"],
            ["user", "User"],
            ["member", "Member"],
            ["subcommand", "Subcommand"],
            ["subcommand group", "SubcommandGroup"],
          ],
        },
      },
      inline: true,
    },
    requires: ["chatInput"],
    output: ANY,
    inputs: [
      input.dropdown(
        "type",
        "Option type",
        [
          ["Text", "String"],
          ["File", "Attachment"],
          ["True or false", "Boolean"],
          ["Channel", "Channel"],
          ["Whole number", "Integer"],
          ["User or role", "Mentionable"],
          ["Number", "Number"],
          ["Role", "Role"],
          ["User", "User"],
          ["Member", "Member"],
          ["Subcommand", "Subcommand"],
          ["Subcommand group", "SubcommandGroup"],
        ],
        { default: "String" },
      ),
      input.text("name", "Option name", { default: "" }),
    ],
    code: (ctx) =>
      `interaction.options.get${ctx.raw("type")}(${ctx.has("name") ? ctx.input("name") : ""})`,
  }),
  value({
    id: "context_menu_target_user",
    label: "Right-clicked user",
    description: "The user the command was used on.",
    category: "interactions",
    group: "Right-click commands",
    icon: "fa-solid fa-user",
    keywords: ["target", "selected user"],
    block: { type: "contextMenu_targetUser", builtin: true },
    requires: ["userContextMenu"],
    output: "user",
    code: () => "interaction.targetUser",
  }),
  value({
    id: "context_menu_target_member",
    label: "Right-clicked member",
    description: "The server member the command was used on. Empty outside servers.",
    category: "interactions",
    group: "Right-click commands",
    icon: "fa-solid fa-user-tag",
    keywords: ["target", "selected member"],
    block: {
      type: "contextMenu_targetMember",
      text: "selected member of the menu",
      colour: "#00A859",
      restrictions: [
        {
          type: "hasHat",
          blockTypes: ["contextMenu_received"],
          message: 'This block must be under "when a context menu is clicked" event',
        },
      ],
    },
    requires: ["userContextMenu"],
    output: "member",
    code: () => "interaction.targetMember",
  }),
  value({
    id: "context_menu_target_message",
    label: "Right-clicked message",
    description: "The message the command was used on.",
    category: "interactions",
    group: "Right-click commands",
    icon: "fa-solid fa-message",
    keywords: ["target", "selected message"],
    block: { type: "contextMenu_targetMessage", builtin: true },
    requires: ["messageContextMenu"],
    output: "message",
    code: () => "interaction.targetMessage",
  }),
];

const components = [];

const blocks = [
  block({
    type: "contextMenu_create",
    text: ["add context menu with name: {name}", "set type to {type}", "usable in DMs: {dms}"],
    parts: {
      name: { part: "value", check: "String" },
      type: {
        part: "dropdown",
        options: [
          ["message", "Discord.ApplicationCommandType.Message"],
          ["user", "Discord.ApplicationCommandType.User"],
        ],
      },
      dms: { part: "value", check: "Boolean" },
    },
    colour: "#00A859",
    inline: false,
    previous: ["slashCreate", "contextMenuCreate"],
    next: ["slashCreate", "contextMenuCreate"],
    restrictions: [
      {
        type: "surroundParent",
        blockTypes: [
          "slash_createcontainer",
          "misc_createcontainer",
          "misc_createcontainer_global",
        ],
        message: 'This block must be under a "Create slash commands / context menus" block',
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => val.length <= 32,
        message: "Name cannot be greater than 32 characters",
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => /^[a-z0-9_-]+$/.test(val),
        message: "The name can only have lowercase letters, numbers, hyphens, and/or underscores",
      },
    ],
    code: (ctx) => {
      var val_name = ctx.code("name");
      var val_dms = ctx.code("dms");
      var field_type = ctx.field("type");
      var code = `\n{
      name: ${val_name},
      type: ${field_type},
      dmPermission: ${val_dms || true}
    },`;
      return code;
    },
  }),
  block({
    type: "contextMenu_member",
    text: "member who clicked the menu",
    colour: "#00A859",
    output: "member",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["contextMenu_received"],
        message: 'This block must be under "when a context menu is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      return ["interaction.member", Order.NONE];
    },
  }),
  block({
    type: "contextMenu_user",
    text: "user who clicked the menu",
    colour: "#00A859",
    output: "user",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["contextMenu_received"],
        message: 'This block must be under "when a context menu is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      return ["interaction.user", Order.NONE];
    },
  }),
  block({
    type: "contextMenu_channel",
    text: "channel the menu was clicked in",
    colour: "#00A859",
    output: "channel",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["contextMenu_received"],
        message: 'This block must be under "when a context menu is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      return ["interaction.channel", Order.NONE];
    },
  }),
  block({
    type: "contextMenu_server",
    text: "server the menu was clicked in",
    colour: "#00A859",
    output: "server",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["contextMenu_received"],
        message: 'This block must be under "when a context menu is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      return ["interaction.guild", Order.NONE];
    },
  }),
  block({
    type: "slash_create_mutator",
    text: ["add slash command", "name: {name}", "description: {dsc}"],
    parts: {
      name: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      nsfw: { part: "value" },
      dm: { part: "value" },
      perms: { part: "value" },
      options: { part: "statement" },
    },
    previous: ["slashCreate", "contextMenuCreate"],
    next: ["slashCreate", "contextMenuCreate"],
    restrictions: [
      {
        type: "surroundParent",
        blockTypes: [
          "slash_createcontainer",
          "misc_createcontainer",
          "misc_createcontainer_global",
        ],
        message: 'This block must be under a "Create slash commands / context menus" block',
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => /^[a-z0-9_-]+$/.test(val),
        message: "The name can only have lowercase letters, numbers, hyphens, and/or underscores",
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => val.length <= 32,
        message: "The name cannot be greater than 32 characters",
      },
      {
        type: "validator",
        blockTypes: ["dsc"],
        check: (val) => val.length <= 100,
        message: "The description cannot be greater than 100 characters",
      },
    ],
    mutator: {
      options: "slash_create_mutator_options",
      fields: [
        {
          name: "nsfw",
          label: "include NSFW",
          inputLabel: "NSFW:",
          inputType: "value",
          check: "Boolean",
        },
        {
          name: "dm",
          label: 'include "usable in DMs"',
          inputLabel: "usable in DMs:",
          inputType: "value",
          check: "Boolean",
        },
        {
          name: "perms",
          label: "include permissions",
          inputLabel: "required user permission(s):",
          inputType: "value",
          check: ["Array", "permission"],
        },
        {
          name: "options",
          label: "include options",
          inputLabel: "option(s):",
          inputType: "statement",
          check: "default",
        },
      ],
    },
    code: (ctx) => {
      var name = ctx.code("name");
      var dsc = ctx.code("dsc");
      var options = ctx.branch("options");
      var nsfw = ctx.code("nsfw");
      var perm = ctx.code("perms");
      var dm = ctx.code("dm");

      var code = `\n{
            name: ${name},
            type: Discord.ApplicationCommandType.ChatInput,
            description: ${dsc},
            nsfw: ${nsfw || false},
            dmPermission: ${dm || true},
            options: [${options}],
            ${
              perm.length > 0
                ? `defaultMemberPermissions: ${
                    perm.startsWith("[") && perm.endsWith("]") ? perm : `[${perm}]`
                  }`
                : ""
            }
          },`;

      return code;
    },
  }),
  block({
    type: "slash_addoption",
    text: [
      "add {type} option",
      "name: {name}",
      "description: {dsc}",
      "required: {required}",
      "choices (only with text type & optional): {choices}",
    ],
    parts: {
      type: {
        part: "dropdown",
        options: [
          ["text", "3"],
          ["attachment", "11"],
          ["true/false", "5"],
          ["channel", "7"],
          ["integer", "4"],
          ["mentionable", "9"],
          ["number", "10"],
          ["role", "8"],
          ["user/member", "6"],
        ],
      },
      name: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      required: { part: "value", check: "Boolean" },
      choices: { part: "statement", check: "default" },
    },
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "surroundParent",
        blockTypes: ["slash_create", "slash_addsubcommand", "slash_create_mutator"],
        message: 'This block must be under "add slash command" OR "add subcommand" block',
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => /^[a-z0-9_-]+$/.test(val),
        message: "The name can only have lowercase letters, numbers, hyphens, and/or underscores",
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => val.length <= 32,
        message: "The name cannot be greater than 32 characters",
      },
      {
        type: "validator",
        blockTypes: ["dsc"],
        check: (val) => val.length <= 100,
        message: "The description cannot be greater than 100 characters",
      },
    ],
    code: (ctx) => {
      var dropdown_type = ctx.field("type");
      var value_name = ctx.code("name");
      var value_dsc = ctx.code("dsc");
      var value_required = ctx.code("required");
      var statements_choices = ctx.branch("choices");

      var code = `{
        type: ${dropdown_type},
        name: ${value_name},
        description: ${value_dsc},
        required: ${value_required || "false"},
        choices: [${statements_choices}]
      },`;
      return code;
    },
  }),
  block({
    type: "slash_addchoice",
    text: ["add choice", "name (shown to user): {name}", "value (returned in code): {value}"],
    parts: { name: { part: "value", check: "String" }, value: { part: "value", check: "String" } },
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "surroundParent",
        blockTypes: ["slash_addoption"],
        message: 'This block must be under "add option" block',
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => /^[a-z0-9_-]+$/.test(val),
        message: "The name can only have lowercase letters, numbers, hyphens, and/or underscores",
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => val.length <= 25,
        message: "The name cannot be greater than 25 characters",
      },
      {
        type: "validator",
        blockTypes: ["value"],
        check: (val) => val.length <= 100,
        message: "The name cannot be greater than 100 characters",
      },
    ],
    code: (ctx) => {
      var value_name = ctx.code("name");
      var value_value = ctx.code("value");

      var code = `{
        name: ${value_name},
        value: ${value_value}
      },`;
      return code;
    },
  }),
  block({
    type: "slash_addsubcommandgroup",
    text: [
      "add subcommand group",
      "name: {name}",
      "description: {dsc}",
      "subcommands: {subcommands}",
    ],
    parts: {
      name: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      subcommands: { part: "statement", check: "default" },
    },
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "surroundParent",
        blockTypes: ["slash_create", "slash_create_mutator"],
        message: 'This block must be under "add slash command" block',
      },
    ],
    code: (ctx) => {
      var value_name = ctx.code("name");
      var value_dsc = ctx.code("dsc");
      var statements_subcommands = ctx.branch("subcommands");

      var code = `{
        type: 2,
        name: ${value_name},
        description: ${value_dsc},
        options: [${statements_subcommands}]
      },`;
      return code;
    },
  }),
  block({
    type: "slash_addsubcommand",
    text: ["add subcommand", "name: {name}", "description: {dsc}", "options: {options}"],
    parts: {
      name: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      options: { part: "statement", check: "default" },
    },
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "surroundParent",
        blockTypes: ["slash_create", "slash_addsubcommandgroup", "slash_create_mutator"],
        message: 'This block must be under "add slash command" OR "add subcommand group" block',
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => /^[a-z0-9_-]+$/.test(val),
        message: "The name can only have lowercase letters, numbers, hyphens, and/or underscores",
      },
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => val.length <= 32,
        message: "The name cannot be greater than 32 characters",
      },
      {
        type: "validator",
        blockTypes: ["dsc"],
        check: (val) => val.length <= 100,
        message: "The description cannot be greater than 100 characters",
      },
    ],
    code: (ctx) => {
      var value_name = ctx.code("name");
      var value_dsc = ctx.code("dsc");
      var statements_options = ctx.branch("options");

      var code = `{
        type: 1,
        name: ${value_name},
        description: ${value_dsc},
        options: [${statements_options}]
      },`;
      return code;
    },
  }),
  block({
    type: "slash_member",
    text: "member who ran the command",
    inline: false,
    output: "member",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["slash_received", "slash_received_named"],
        message: 'This block must be under "when slash command received" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = "interaction.member";
      return [code, Order.NONE];
    },
  }),
  block({
    type: "slash_user",
    text: "user who ran the command",
    inline: false,
    output: "user",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["slash_received", "slash_received_named"],
        message: 'This block must be under "when slash command received" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = "interaction.member.user";
      return [code, Order.NONE];
    },
  }),
  block({
    type: "slash_channel",
    text: "channel the command was run in",
    inline: false,
    output: "channel",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["slash_received", "slash_received_named"],
        message: 'This block must be under "when slash command received" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = "interaction.channel";
      return [code, Order.NONE];
    },
  }),
  block({
    type: "slash_server",
    text: "server the command was run in",
    inline: false,
    output: "server",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["slash_received", "slash_received_named"],
        message: 'This block must be under "when slash command received" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = "interaction.guild";
      return [code, Order.NONE];
    },
  }),
];

export default {
  events,
  actions,
  values,
  components,
  contexts: [],

  blocks,
};
