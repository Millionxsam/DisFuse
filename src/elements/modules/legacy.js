import { group } from "../define.js";

/* Blocks that never set allowedMentions leave it out while every ping
   is allowed, so they generate exactly what they always did. */
const legacyMentions = (ctx) => {
  const code = ctx.allowedMentions(null);
  return code ? `${code}, ` : "";
};

const { block } = group({ colour: "#4fb88a" });

const blocks = [
  block({
    type: "slash_reply_rows",
    pings: true,
    text: [
      "reply to the interaction",
      "content: {content}",
      "embed name(s): {embeds}",
      "visible only to the user? {ephemeral}",
      "rows: {rows}",
    ],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      ephemeral: { part: "value", check: "Boolean" },
      rows: { part: "statement", check: "rows" },
    },
    colour: "#3366CC",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["slash_received", "slash_received_named", "modal_handle_interaction", "contextMenu_received"],
        message: "This block must be under an interaction event",
      },
    ],
    code: (ctx) => {
      var value_content = ctx.code("content");
      var value_embeds = ctx.code("embeds");
      var value_ephemeral = ctx.code("ephemeral");
      var rows = ctx.branch("rows");

      var code = `await interaction.reply({
        ${legacyMentions(ctx)}content: ${value_content || "''"},
        embeds: [${value_embeds.replaceAll("'", "")}],
        ephemeral: ${value_ephemeral || "false"},
        components: [
        ${rows}]
      });\n`;
      return code;
    },
  }),
  block({
    type: "slash_editreply",
    pings: true,
    text: ["edit the reply", "content: {content}", "embed name(s): {embeds}", "rows: {rows}"],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
    },
    colour: "#3366CC",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["slash_received", "slash_received_named"],
        message: 'This block must be under "when slash command received" event',
      },
      {
        type: "hasBlockInParent",
        blockTypes: ["slash_reply"],
        message: 'This block must be used AFTER "reply to the command" block',
      },
      {
        type: "hasHat",
        blockTypes: ["slash_received", "slash_received_named", "contextMenu_received"],
        message:
          'This block must be under "when slash command received" or "when context menu clicked" event',
      },
      {
        type: "hasBlockInParent",
        blockTypes: ["slash_reply"],
        message: 'This block must be used AFTER "reply to the command" block',
      },
    ],
    code: (ctx) => {
      var value_content = ctx.code("content");
      var value_embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");

      var code = `await interaction.editReply({
        ${legacyMentions(ctx)}content: ${value_content || "''"},
        embeds: [${value_embeds.replaceAll("'", "")}],
        components: [
        ${rows}]
      });`;
      return code;
    },
  }),
  block({
    type: "slash_createcontainer",
    text: [
      "set slash commands",
      "guild ID (leave blank for global commands): {guild}",
      "{commands}",
    ],
    parts: {
      guild: { part: "value", check: "String" },
      commands: { part: "statement", check: ["contextMenuCreate", "slashCreate"] },
    },
    colour: "#3366CC",
    inline: false,
    previous: "default",
    next: "default",
    code: (ctx) => {
      var value_guild = ctx.code("guild");
      var statements_code = ctx.branch("commands");

      var code;

      if (value_guild?.length > 10)
        code = `(await getCollection(client, "guilds")).get(${value_guild}).commands.set([${statements_code}]);`;
      else code = `client.application.commands.set([${statements_code}]);`;

      return code;
    },
  }),
  block({
    type: "slash_create",
    text: [
      "add slash command",
      "name: {name}",
      "description: {dsc}",
      "NSFW: {nsfw}",
      "usable in DMs: {dm}",
      "required user permission(s): {perms}",
      "option(s): {options}",
    ],
    parts: {
      name: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      nsfw: { part: "value", check: "Boolean" },
      dm: { part: "value", check: "Boolean" },
      perms: { part: "value", check: ["Array", "permission"] },
      options: { part: "statement", check: "default" },
    },
    colour: "#3366CC",
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
    type: "msg_reply",
    pings: true,
    text: ["reply to the message", "content: {content}", "embed name(s): {embeds}", "then: {then}"],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      then: { part: "statement", check: null },
    },
    colour: "#336EFF",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["msg_received", "message_author_not_bot", "msg_dm_received"],
        message: 'This block must be in a "when a message is received" event',
      },
      {
        type: "notEmpty",
        blockTypes: ["content", "embeds"],
        message: "You must specify the content and/or embed(s) to send",
      },
      {
        type: "validator",
        blockTypes: ["content"],
        check: (val) => val.length <= 2000,
        message: "Content cannot be greater than 2,000 characters",
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
                  (b) => b.type === "embed_create" && b.getFieldValue("name") === embedName.trim(),
                )
            )
              pass = false;
          });

          return pass;
        },
        message: "No embed with that name exists",
      },
    ],
    code: (ctx) => {
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");
      var then = ctx.branch("then");

      var code = `message.reply({
        ${legacyMentions(ctx)}content: ${content || "''"},
        embeds: [${embeds.replaceAll("'", "")}]
      }).then((messageSent) => {
        ${then}});\n`;
      return code;
    },
  }),
  block({
    type: "msg_reply_rows",
    pings: true,
    text: [
      "reply to the message",
      "content: {content}",
      "embed name(s): {embeds}",
      "rows: {rows}",
      "then: {then}",
    ],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
      then: { part: "statement", check: null },
    },
    colour: "#336EFF",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["msg_received", "message_author_not_bot", "msg_dm_received"],
        message: 'This block must be in a "when a message is received" event',
      },
      {
        type: "notEmpty",
        blockTypes: ["content", "embeds"],
        message: "You must specify the content and/or embed(s) to send",
      },
      {
        type: "validator",
        blockTypes: ["content"],
        check: (val) => val.length <= 2000,
        message: "Content cannot be greater than 2,000 characters",
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
                  (b) => b.type === "embed_create" && b.getFieldValue("name") === embedName.trim(),
                )
            )
              pass = false;
          });

          return pass;
        },
        message: "No embed with that name exists",
      },
    ],
    code: (ctx) => {
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");
      var then = ctx.branch("then");

      var code = `message.reply({
        ${legacyMentions(ctx)}content: ${content || "''"},
        embeds: [${embeds.replaceAll("'", "") || ""}],
        components: [
        ${rows}]
      }).then((messageSent) => {
        ${then}});\n`;
      return code;
    },
  }),
  block({
    type: "misc_int_reply",
    pings: true,
    text: [
      "reply to the interaction",
      "content: {content}",
      "embed name(s): {embeds}",
      "visible only to the user? {ephemeral}",
    ],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      ephemeral: { part: "value", check: "Boolean" },
    },
    colour: "#4192E9",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
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
          "slash_received_named",
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
                  (b) => b.type === "embed_create" && b.getFieldValue("name") === embedName.trim(),
                )
            )
              pass = false;
          });

          return pass;
        },
        message: "No embed with that name exists",
      },
    ],
    code: (ctx) => {
      var value_content = ctx.code("content");
      var value_embeds = ctx.code("embeds");
      var value_ephemeral = ctx.code("ephemeral");

      var code = `await interaction.reply({
      ${legacyMentions(ctx)}content: ${value_content || "''"},
      embeds: [${value_embeds.replaceAll("'", "")}],
      ephemeral: ${value_ephemeral || "false"}
    });\n`;
      return code;
    },
  }),
  block({
    type: "misc_int_reply_rows",
    pings: true,
    text: [
      "reply to the interaction",
      "content: {content}",
      "embed name(s): {embeds}",
      "visible only to the user? {ephemeral}",
      "rows: {rows}",
    ],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      ephemeral: { part: "value", check: "Boolean" },
      rows: { part: "statement", check: "rows" },
    },
    colour: "#4192E9",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
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
          "slash_received_named",
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
                  (b) => b.type === "embed_create" && b.getFieldValue("name") === embedName.trim(),
                )
            )
              pass = false;
          });

          return pass;
        },
        message: "No embed with that name exists",
      },
    ],
    code: (ctx) => {
      var value_content = ctx.code("content");
      var value_embeds = ctx.code("embeds");
      var value_ephemeral = ctx.code("ephemeral");
      var rows = ctx.branch("rows");

      var code = `await interaction.reply({
      ${legacyMentions(ctx)}content: ${value_content || "''"},
      embeds: [${value_embeds.replaceAll("'", "")}],
      ephemeral: ${value_ephemeral || "false"},
      components: [${rows}]
    });\n`;
      return code;
    },
  }),
  block({
    type: "misc_int_edit",
    pings: true,
    text: ["edit the reply", "content: {content}", "embed name(s): {embeds}", "rows: {rows}"],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
    },
    colour: "#4192E9",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
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
          "slash_received_named",
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
                  (b) => b.type === "embed_create" && b.getFieldValue("name") === embedName.trim(),
                )
            )
              pass = false;
          });

          return pass;
        },
        message: "No embed with that name exists",
      },
    ],
    code: (ctx) => {
      var value_content = ctx.code("content");
      var value_embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");

      var code = `await interaction.editReply({
      ${legacyMentions(ctx)}content: ${value_content || "''"},
      embeds: [${value_embeds.replaceAll("'", "")}],
      components: [${rows}]
    });\n`;
      return code;
    },
  }),
  block({
    type: "main_amountservers",
    text: "number of servers of the bot",
    colour: "#FF6E33",
    inline: true,
    output: "Number",
    code: (ctx) => {
      const { Order } = ctx;
      return [`(await getCollection(client, "guilds")).size`, Order.NONE];
    },
  }),
  block({
    type: "colour_hex",
    text: "hex color {colour}",
    parts: {
      colour: {
        part: "text",
        value: "#ffffff",
        validator: (value) => (/^#([0-9a-fA-F]{3}){1,2}$/i.test(value) ? value : null),
      },
    },
    colour: "#ad794c",
    output: "Colour",
    code: (ctx) => {
      const { generator, Order } = ctx;
      var colour = ctx.field("colour");
      return [generator.quote_(colour), Order.ATOMIC];
    },
  }),
  block({
    type: "modal_add_text_input",
    text: [
      "add text input with label: {label}",
      "set custom ID to: {customId}",
      "set required to: {required}",
      "set style to {style}",
    ],
    parts: {
      label: { part: "value", check: "String" },
      customId: { part: "value", check: "String" },
      required: { part: "value", check: "Boolean" },
      style: {
        part: "dropdown",
        options: [
          ["short", "Short"],
          ["paragraph", "Paragraph"],
        ],
      },
    },
    colour: "#1A8793",
    inline: false,
    tooltip: "Adds a text input to a modal.",
    previous: "Array",
    next: "Array",
    code: (ctx) => {
      var label = ctx.code("label");
      var required = ctx.code("required");
      var customId = ctx.code("customId");
      var style = ctx.field("style");

      const code = `new Discord.ActionRowBuilder().addComponents(
      new Discord.TextInputBuilder()
        .setCustomId(${customId})
        .setLabel(${label})
        .setRequired(${required})
        .setStyle('${style}')
    ),\n`;
      return code;
    },
  }),
  block({
    type: "modal_add_text_input_advanced",
    text: [
      "add advanced text input with label: {label}",
      "set custom ID to: {customId}",
      "set required to: {required}",
      "set style to {style}",
      "set placeholder to: {placeholder}",
      "maximum length: {max}",
      "minimum length: {min}",
    ],
    parts: {
      label: { part: "value", check: "String" },
      customId: { part: "value", check: "String" },
      required: { part: "value", check: "Boolean" },
      style: {
        part: "dropdown",
        options: [
          ["short", "Short"],
          ["paragraph", "Paragraph"],
        ],
      },
      placeholder: { part: "value", check: "String" },
      max: { part: "value", check: "Number" },
      min: { part: "value", check: "Number" },
    },
    colour: "#1A8793",
    inline: false,
    tooltip: "Adds a text input to a modal. (Advanced creation)",
    previous: "Array",
    next: "Array",
    code: (ctx) => {
      var label = ctx.code("label");
      var required = ctx.code("required");
      var customId = ctx.code("customId");
      var placeholder = ctx.code("placeholder");
      var max = ctx.code("max");
      var min = ctx.code("min");
      var style = ctx.field("style");

      const code = `new Discord.TextInputBuilder()
        .setCustomId(${customId})
        .setLabel(${label})
        .setRequired(${required})
        .setPlaceholder(${placeholder})
        .setMaxLength(${max})
        .setMinLength(${min})
        .setStyle('${style}'),\n`;
      return code;
    },
  }),
  block({
    type: "embed_create",
    text: ["create an embed with name: {name}", "then {config}"],
    parts: {
      name: {
        part: "text",
        value: "name",
        validator: (value) => (/^(?![_$a-zA-Z])|[^_$a-zA-Z0-9]/.test(value) ? null : value),
      },
      config: { part: "statement", check: "embedBlockCreatorBlock" },
    },
    colour: "00A58E",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var value_name = ctx.field("name");
      var statements_config = ctx.branch("config");

      var code = `let ${value_name} = new Discord.EmbedBuilder()${statements_config};\n`;
      return code;
    },
  }),
  block({
    type: "embed_settitle",
    text: "set embed title to: {value}",
    parts: { value: { part: "value", check: "String" } },
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["value"],
        check: (val) => val.length <= 256,
        message: "Title cannot be greater than 256 characters",
      },
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      var value_value = ctx.code("value");

      var code = `.setTitle(${value_value})`;
      return code;
    },
  }),
  block({
    type: "embed_setdsc",
    text: "set embed description to: {value}",
    parts: { value: { part: "value", check: "String" } },
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["value"],
        check: (val) => val.length <= 4096,
        message: "Description cannot be greater than 4096 characters",
      },
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      var value_value = ctx.code("value");

      var code = `.setDescription(${value_value})`;
      return code;
    },
  }),
  block({
    type: "embed_setcolor",
    text: "set embed color to: {value}",
    parts: { value: { part: "value", check: ["Colour", "String"] } },
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["value"],
        check: (val) =>
          /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val) || String(val).toLowerCase() === "Random",
        message: 'Color must be a valid hex color, or "Random"',
      },
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      var value_value = ctx.code("value");

      var code = `.setColor(${value_value})`;
      return code;
    },
  }),
  block({
    type: "embed_seturl",
    text: "set embed title URL to: {value}",
    parts: { value: { part: "value", check: "String" } },
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["value"],
        check: (val) => {
          if (val === "") return true;
          try {
            new URL(val);
            return true;
          } catch (_) {
            return false;
          }
        },
        message: "URL must be a valid URL",
      },
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      var value_value = ctx.code("value");

      var code = `.setURL(${value_value})`;
      return code;
    },
  }),
  block({
    type: "embed_setauthor",
    text: ["set embed author name to: {name}", "icon URL: {icon}", "click URL: {url}"],
    parts: {
      name: { part: "value", check: "String" },
      icon: { part: "value", check: "String" },
      url: { part: "value", check: "String" },
    },
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => val.length <= 256,
        message: "Author name cannot be greater than 256 characters",
      },
      {
        type: "validator",
        blockTypes: ["icon"],
        check: (val) => {
          if (val === "") return true;
          try {
            new URL(val);
            return true;
          } catch (_) {
            return false;
          }
        },
        message: "Icon must be a valid URL",
      },
      {
        type: "validator",
        blockTypes: ["url"],
        check: (val) => {
          if (val === "") return true;
          try {
            new URL(val);
            return true;
          } catch (_) {
            return false;
          }
        },
        message: "Click URL must be a valid URL",
      },
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      const name = ctx.code("name");
      const icon = ctx.code("icon");
      const url = ctx.code("url");

      const options = [`name: ${name}`];
      if (icon && icon !== "") options.push(`iconURL: ${icon}`);
      if (url && url !== "") options.push(`url: ${url}`);

      return `.setAuthor({ ${options.join(", ")} })`;
    },
  }),
  block({
    type: "embed_setfooter",
    text: ["set embed footer to: {text}", "icon URL: {icon}"],
    parts: { text: { part: "value", check: "String" }, icon: { part: "value", check: "String" } },
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["text"],
        check: (val) => val.length <= 2048,
        message: "Footer cannot be greater than 2048 characters",
      },
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      const text = ctx.code("text");
      const icon = ctx.code("icon");

      const options = [`text: ${text}`];
      if (icon && icon !== "") options.push(`iconURL: ${icon}`);

      return `.setFooter({ ${options.join(", ")} })`;
    },
  }),
  block({
    type: "embed_setimage",
    text: "set embed image URL to: {value}",
    parts: { value: { part: "value", check: "String" } },
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["value"],
        check: (val) => {
          if (val === "") return true;
          try {
            new URL(val);
            return true;
          } catch (_) {
            return false;
          }
        },
        message: "Image URL must be a valid URL",
      },
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      const value = ctx.code("value");
      return `.setImage(${value})`;
    },
  }),
  block({
    type: "embed_setthumb",
    text: "set embed thumbnail URL to: {value}",
    parts: { value: { part: "value", check: "String" } },
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["value"],
        check: (val) => {
          if (val === "") return true;
          try {
            new URL(val);
            return true;
          } catch (_) {
            return false;
          }
        },
        message: "Thumbnail URL must be a valid URL",
      },
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      const value = ctx.code("value");
      return `.setThumbnail(${value})`;
    },
  }),
  block({
    type: "embed_addfield",
    text: ["add embed field", "field name: {name}", "field value: {val}", "inline: {inline}"],
    parts: {
      name: { part: "value", check: "String" },
      val: { part: "value", check: "String" },
      inline: { part: "value", check: "Boolean" },
    },
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "validator",
        blockTypes: ["name"],
        check: (val) => val.length <= 256,
        message: "Field name cannot be greater than 256 characters",
      },
      {
        type: "validator",
        blockTypes: ["val"],
        check: (val) => val.length <= 1024,
        message: "Field value cannot be greater than 1024 characters",
      },
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      const value_name = ctx.code("name");
      const value_val = ctx.code("val");
      const value_inline = ctx.code("inline") ?? false;
      return `.addFields({ name: ${value_name}, value: ${value_val}, inline: ${value_inline} })`;
    },
  }),
  block({
    type: "embed_settimestamp",
    text: "add timestamp",
    colour: "00A58E",
    previous: "embedBlockCreatorBlock",
    next: "embedBlockCreatorBlock",
    restrictions: [
      {
        type: "surroundParent",
        blockTypes: ["embed_create"],
        message: "This block must be under a 'create embed' block",
      },
    ],
    code: (ctx) => {
      return `.setTimestamp()`;
    },
  }),
  block({
    type: "game_2048",
    text: [
      "start a 2048 game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");

      var code = `new discord_gamecord.TwoZeroFourEight({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color}
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_connect4",
    text: [
      "start a Connect4 game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "status title: {status}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      status: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");
      var value_status = ctx.code("status");

      var code = `new discord_gamecord.Connect4({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
                statusTitle: ${value_status}
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_fasttype",
    text: [
      "start a FastType game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "description/body: {dsc}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");
      var value_dsc = ctx.code("dsc");

      var code = `new discord_gamecord.FastType({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
                description: ${value_dsc}
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_findemoji",
    text: [
      "start a FindEmoji game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "description/body: {dsc}",
      "second description: {finddsc}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      finddsc: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");
      var value_dsc = ctx.code("dsc");
      var value_finddsc = ctx.code("finddsc");

      var code = `new discord_gamecord.FindEmoji({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
                description: ${value_dsc},
                findDescription: ${value_finddsc}
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_flood",
    text: [
      "start a Flood game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");

      var code = `new discord_gamecord.Flood({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_hangman",
    text: [
      "start a Hangman game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");

      var code = `new discord_gamecord.Hangman({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_matchpairs",
    text: [
      "start a MatchPairs game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "description/body: {dsc}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");
      var value_dsc = ctx.code("dsc");

      var code = `new discord_gamecord.MatchPairs({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
                description: ${value_dsc},
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_minesweeper",
    text: [
      "start a Minesweeper game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "description/body: {dsc}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");
      var value_dsc = ctx.code("dsc");

      var code = `new discord_gamecord.Minesweeper({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
                description: ${value_dsc},
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_rps",
    text: [
      "start a RockPaperScissors game from {slash}",
      "opponent: {opponent}",
      "configure embed ↓",
      "title: {title}",
      "description/body: {dsc}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      opponent: { part: "value", check: "user" },
      title: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");
      var value_dsc = ctx.code("dsc");

      var code = `new discord_gamecord.RockPaperScissors({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
                description: ${value_dsc},
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_slots",
    text: [
      "start a Slots game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");

      var code = `new discord_gamecord.Slots({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_snake",
    text: [
      "start a Snake game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "game over title: {overtitle}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      overtitle: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");
      var value_overtitle = ctx.code("overtitle");

      var code = `new discord_gamecord.Snake({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
                overTitle: ${value_overtitle}
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_tictactoe",
    text: [
      "start a TicTacToe game from {slash}",
      "opponent: {opponent}",
      "configure embed ↓",
      "title: {title}",
      "game over title: {overtitle}",
      "status title: {statustitle}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      opponent: { part: "value", check: "user" },
      title: { part: "value", check: "String" },
      overtitle: { part: "value", check: "String" },
      statustitle: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");
      var value_overtitle = ctx.code("overtitle");
      var value_statustitle = ctx.code("statustitle");

      var code = `new discord_gamecord.TicTacToe({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
                overTitle: ${value_overtitle},
                statusTitle: ${value_statustitle}
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_wordle",
    text: [
      "start a Wordle game from {slash}",
      "configure embed ↓",
      "title: {title}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      title: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");

      var code = `new discord_gamecord.Wordle({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
            }
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "game_trivia",
    text: [
      "start a Trivia game from {slash}",
      "mode: {mode}",
      "difficulty: {difficulty}",
      "configure embed ↓",
      "title: {title}",
      "description/body: {dsc}",
      "color: {color}",
    ],
    parts: {
      slash: {
        part: "dropdown",
        options: [
          ["text command", "false"],
          ["slash command", "true"],
        ],
      },
      mode: {
        part: "dropdown",
        options: [
          ["single", "single"],
          ["multiple", "multiple"],
        ],
      },
      difficulty: {
        part: "dropdown",
        options: [
          ["easy", "easy"],
          ["medium", "medium"],
          ["hard", "hard"],
        ],
      },
      title: { part: "value", check: "String" },
      dsc: { part: "value", check: "String" },
      color: { part: "value", check: ["Colour", "String"] },
    },
    inline: false,
    tooltip: "",
    helpUrl: "",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var dropdown_slash = ctx.field("slash");
      var value_title = ctx.code("title");
      var value_color = ctx.code("color");
      var value_dsc = ctx.code("dsc");
      var value_mode = ctx.field("mode");
      var value_dif = ctx.field("difficulty");

      var code = `new discord_gamecord.Trivia({
            message: ${dropdown_slash === "true" ? "interaction" : "message"},
            isSlashGame: ${dropdown_slash},
            embed: {
                title: ${value_title},
                color: ${value_color},
                description: ${value_dsc},
            },
            difficulty: "${value_dif}",
            mode: "${value_mode}"
        }).startGame();`;
      return code;
    },
  }),
  block({
    type: "events_joins_guildmemberadd",
    text: ["when a member joins a server", "{code}"],
    parts: { code: { part: "statement", check: null } },
    colour: "#3c9e56",
    code: (ctx) =>
      `client.on('guildMemberAdd', async (joinedMember) => {\n\n${ctx.branch("code")}});\n`,
  }),
  block({
    type: "events_joins_guildmemberadd_member",
    text: "joining member",
    colour: "#3c9e56",
    output: "member",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["events_joins_guildmemberadd"],
        message: "This block must be in the 'when a member joins a server' event",
      },
    ],
    code: () => "joinedMember",
  }),
  block({
    type: "events_joins_guildmemberadd_server",
    text: "joining server",
    colour: "#3c9e56",
    output: "server",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["events_joins_guildmemberadd"],
        message: "This block must be in the 'when a member joins a server' event",
      },
    ],
    code: () => "joinedMember.guild",
  }),
  block({
    type: "localVars_set",
    text: "set {variable} to {value}",
    parts: {
      variable: {
        part: "text",
        value: "variable",
        validator: (value) => (/^(?![_$a-zA-Z])|[^_$a-zA-Z0-9]/.test(value) ? null : value),
      },
      value: { part: "value", check: null },
    },
    colour: "#d98e2b",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var variable = ctx.field("variable");
      var value = ctx.code("value") || "null";

      return `var ${variable} = ${value};\n`;
    },
  }),
  block({
    type: "localVars_change",
    text: "change {variable} by {value}",
    parts: {
      variable: {
        part: "text",
        value: "variable",
        validator: (value) => (/^(?![_$a-zA-Z])|[^_$a-zA-Z0-9]/.test(value) ? null : value),
      },
      value: { part: "value", check: "Number" },
    },
    colour: "#d98e2b",
    previous: "default",
    next: "default",
    code: (ctx) => {
      var variable = ctx.field("variable");
      var value = ctx.code("value") || "null";

      return `${variable} += ${value};\n`;
    },
  }),
  block({
    type: "localVars_get",
    text: "value of variable {variable}",
    parts: {
      variable: {
        part: "text",
        value: "variable",
        validator: (value) => (/^(?![_$a-zA-Z])|[^_$a-zA-Z0-9]/.test(value) ? null : value),
      },
    },
    colour: "#d98e2b",
    output: null,
    code: (ctx) => {
      const { Order } = ctx;
      var variable = ctx.field("variable");
      return [`${variable}`, Order.NONE];
    },
  }),
];

export default { blocks };
