/* =====================================================================
   Builder catalog: message pieces, buttons and menus
   ---------------------------------------------------------------------
   The pieces the message builder puts messages together from (text,
   containers, sections, galleries, files, and rows of buttons and
   menus), the events for clicking a button or picking from a menu, and
   the steps that answer them. Each piece's code() writes the same
   discord.js builder the matching block did, and preview() returns it
   the way Discord's API delivers it, as src/functions/messagePreview/
   buildMessage.js does for the block editor.
   ===================================================================== */

import { CV2_SEND_TYPES, findComponentOwner } from "../../blocks/lib/componentLoopTypes.js";
import { ALLOWED_MENTIONS } from "../../blocks/lib/generatorUtils.js";
import { group, input } from "../define.js";

/* Blocks that never set allowedMentions leave it out while every ping
   is allowed, so they generate exactly what they always did. */
const legacyMentions = (ctx) => {
  const code = ctx.allowedMentions(null);
  return code ? `${code}, ` : "";
};

const { event, action, value, component, block } = group({ colour: "#26A4AF" });

/* Discord's button styles, by the block editor's dropdown values. */
const BUTTON_STYLES = { Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5 };

/* An emoji input that holds something worth sending. Discord rejects
   an empty emoji. */
function hasEmoji(ctx, key) {
  return ctx.has(key);
}

function idFilter(ctx) {
  if (!ctx.has("filterId")) return "";
  const id = ctx.input("filterId");
  return ctx.raw("filterMode") === "startsWith"
    ? `if (!interaction.customId.startsWith(${id})) return;\n`
    : `if (interaction.customId !== ${id}) return;\n`;
}

/* Answers an interaction. The builder only lets a reply go where
   nothing has answered yet (see model/replies.js), but a project saved
   before that rule, or a step moved since, still shouldn't crash the
   bot: a second reply goes out as a follow-up instead. */
const REPLY_HELPER = {
  key: "disfuseReply",
  code: `async function disfuseReply(interaction, options) {
  if (interaction.replied || interaction.deferred) return await interaction.followUp(options);
  return await interaction.reply(options);
}`,
};

const events = [
  event({
    id: "button_clicked",
    label: "When a button is clicked",
    description: "Runs when someone clicks one of the bot's buttons.",
    category: "components",
    icon: "fa-solid fa-hand-pointer",
    keywords: ["button", "click", "press"],
    block: {
      type: "buttons_event",
      body: { name: "event", check: "default" },
      text: "when a button is clicked",
      colour: "#2677AF",
      inline: false,
    },
    listen: "Discord.Events.InteractionCreate",
    params: ["interaction"],
    provides: ["interaction", "repliable", "showModal", "component", "button"],
    values: [
      {
        key: "id",
        label: "Button ID",
        type: "String",
        code: "interaction.customId",
        block: {
          type: "buttons_id",
          text: "ID of the clicked button",
          colour: "#2677AF",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["buttons_event"],
              message: 'This block must be in a "when a button is clicked" event',
            },
          ],
        },
      },
      {
        key: "message",
        label: "Message with the button",
        type: "message",
        code: "interaction.message",
      },
    ],
    settings: [
      input.text("filterId", "Only for this button ID", {
        default: "",
        allowValues: false,
        help: "Leave it empty to run for every button. Buttons get their ID in the message builder.",
        placeholder: "my-button",
      }),
      input.dropdown(
        "filterMode",
        "Match",
        [
          ["The ID exactly", "equals"],
          ["IDs that start with it", "startsWith"],
        ],
        { default: "equals" },
      ),
    ],
    prelude: (ctx) => "if (!interaction.isButton()) return;\n" + idFilter(ctx),
  }),
  event({
    id: "menu_picked",
    label: "When someone picks from a menu",
    description: "Runs when someone picks an option from one of the bot's select menus.",
    category: "components",
    icon: "fa-solid fa-list-check",
    keywords: ["select menu", "dropdown", "pick", "choose"],
    block: {
      type: "menus_event",
      body: { name: "event", check: "default" },
      text: "when a menu is clicked",
      colour: "#26A483",
      inline: false,
    },
    listen: "Discord.Events.InteractionCreate",
    params: ["interaction"],
    provides: ["interaction", "repliable", "showModal", "component", "selectMenu"],
    values: [
      {
        key: "id",
        label: "Menu ID",
        type: "String",
        code: "interaction.customId",
        block: {
          type: "menus_id",
          text: "ID of the clicked menu",
          colour: "#26A483",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["menus_event"],
              message: 'This block must be in a "when a menu is clicked" event',
            },
          ],
        },
      },
      {
        key: "value",
        label: "Picked option",
        type: "String",
        code: "interaction.values[0]",
        description: "For user, role and channel menus this is the picked item's ID.",
        block: {
          type: "menus_value",
          text: "the value of the selected option",
          colour: "#26A483",
          output: ["String", "user", "role", "channel"],
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["menus_event"],
              message: 'This block must be in a "when a menu is clicked" event',
            },
          ],
        },
      },
      { key: "values", label: "All picked options", type: "Array", code: "interaction.values" },
      {
        key: "message",
        label: "Message with the menu",
        type: "message",
        code: "interaction.message",
      },
    ],
    settings: [
      input.text("filterId", "Only for this menu ID", {
        default: "",
        allowValues: false,
        help: "Leave it empty to run for every menu. Menus get their ID in the message builder.",
        placeholder: "my-menu",
      }),
      input.dropdown(
        "filterMode",
        "Match",
        [
          ["The ID exactly", "equals"],
          ["IDs that start with it", "startsWith"],
        ],
        { default: "equals" },
      ),
    ],
    prelude: (ctx) => "if (!interaction.isAnySelectMenu()) return;\n" + idFilter(ctx),
  }),
];

const actions = [
  action({
    id: "interaction_reply",
    label: "Reply to the interaction",
    description:
      "Answers the command, button, menu or form with a message you build. It can only be answered once, so use Send a follow-up to the interaction for more.",
    category: "interactions",
    group: "Answering",
    icon: "fa-solid fa-reply",
    keywords: ["reply", "respond", "answer", "send"],
    block: {
      type: "cv2_replyInteraction",
      text: [
        "reply to the interaction",
        "visible only to the user? {ephemeral}",
        "components: {components}",
      ],
      parts: {
        components: { part: "statement", check: "rootComponents" },
        files: { part: "statement", check: "files" },
      },
      colour: "#4192E9",
      tooltip:
        "Replies to a slash command / button / menu interaction using Components V2. Cannot use content or embeds.",
      restrictions: [
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
          message: "This block must be under an interaction event",
        },
        {
          type: "notEmpty",
          blockTypes: ["components"],
          message: "You must add at least one component",
        },
      ],
      mutator: {
        options: "cv2_replyInteraction_mutator",
        fields: [
          {
            name: "files",
            label: "include files",
            inputType: "statement",
            inputLabel: "files:",
            valueCheck: "files",
          },
        ],
      },
    },
    requires: ["repliable"],
    answers: "message",
    inputs: [
      input.message("content", "Reply"),
      input.boolean("ephemeral", "Only they can see it", { default: false }),
    ],
    setup: [REPLY_HELPER],
    special: "message",
    code: (ctx) =>
      `await disfuseReply(interaction, ${ctx.message("content", { ephemeral: ctx.input("ephemeral") })});\n`,
  }),
  action({
    id: "interaction_defer",
    label: "Show that the bot is thinking",
    description:
      'Shows "Bot is thinking..." so you get more time to answer. Answer later with Edit the interaction reply.',
    category: "interactions",
    group: "Answering",
    icon: "fa-solid fa-spinner",
    keywords: ["defer", "thinking", "wait", "loading"],
    block: {
      type: "misc_int_deferReply",
      text: ["defer reply", "visible only to the user? {ephemeral}"],
      colour: "4192E9",
      tooltip:
        'This displays the "Bot is thinking..." message. Use this when you need to allow more time for your bot to reply to a command.',
      restrictions: [
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
      ],
    },
    requires: ["repliable"],
    answers: "message",
    inputs: [input.boolean("ephemeral", "Only they can see it", { default: false })],
    code: (ctx) =>
      `await interaction.deferReply(${ctx.input("ephemeral")} ? { flags: Discord.MessageFlags.Ephemeral } : {});\n`,
  }),
  action({
    id: "interaction_edit_reply",
    label: "Edit the interaction reply",
    description: 'Changes the bot\'s reply (or its "thinking" message) to a new message you build.',
    category: "interactions",
    group: "Answering",
    icon: "fa-solid fa-pen-to-square",
    keywords: ["edit reply", "update reply", "change"],
    block: {
      type: "cv2_editReplyInteraction",
      text: ["edit the bot's reply", "components: {components}"],
      parts: {
        components: { part: "statement", check: "rootComponents" },
        files: { part: "statement", check: "files" },
      },
      colour: "#4192E9",
      tooltip: "Edits a deferred or previously sent interaction reply using Components V2.",
      restrictions: [
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
          message: "This block must be under an interaction event",
        },
        {
          type: "notEmpty",
          blockTypes: ["components"],
          message: "You must add at least one component",
        },
      ],
      mutator: {
        options: "cv2_editReplyInteraction_mutator",
        fields: [
          {
            name: "files",
            label: "include files",
            inputType: "statement",
            inputLabel: "files:",
            valueCheck: "files",
          },
        ],
      },
    },
    requires: ["repliable"],
    afterAnswer: true,
    inputs: [input.message("content", "New message")],
    special: "message",
    code: (ctx) => `await interaction.editReply(${ctx.message("content", { edit: true })});\n`,
  }),
  action({
    id: "interaction_delete_reply",
    label: "Delete the interaction reply",
    description: "Deletes the bot's reply.",
    category: "interactions",
    group: "Answering",
    icon: "fa-solid fa-trash-can",
    keywords: ["delete reply", "remove"],
    block: [
      {
        type: "buttons_del",
        text: "delete the reply by the bot",
        colour: "2677AF",
        inline: false,
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["buttons_event"],
            message: 'This block must be in a "when a button is clicked" event',
          },
        ],
      },
      {
        type: "menus_del",
        text: "delete the reply by the bot",
        colour: "26A483",
        inline: false,
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["menus_event"],
            message: 'This block must be in a "when a menu is clicked" event',
          },
        ],
      },
    ],
    requires: ["repliable"],
    afterAnswer: true,
    code: () => "await interaction.deleteReply();\n",
  }),
  action({
    id: "interaction_follow_up",
    label: "Send a follow-up to the interaction",
    description: "Sends another message after the bot has answered, like a second reply.",
    category: "interactions",
    group: "Answering",
    icon: "fa-solid fa-comments",
    keywords: ["follow up", "followup", "another reply", "second message", "send"],
    block: {
      type: "cv2_followUpInteraction",
      text: [
        "send a follow-up to the interaction",
        "visible only to the user? {ephemeral}",
        "components: {components}",
      ],
      parts: {
        components: { part: "statement", check: "rootComponents" },
        files: { part: "statement", check: "files" },
      },
      colour: "#4192E9",
      tooltip:
        "Sends another message after the bot has replied to the interaction, using Components V2.",
      restrictions: [
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
          message: "This block must be under an interaction event",
        },
        {
          type: "notEmpty",
          blockTypes: ["components"],
          message: "You must add at least one component",
        },
      ],
      mutator: {
        options: "cv2_followUpInteraction_mutator",
        fields: [
          {
            name: "files",
            label: "include files",
            inputType: "statement",
            inputLabel: "files:",
            valueCheck: "files",
          },
        ],
      },
    },
    requires: ["repliable"],
    afterAnswer: true,
    inputs: [
      input.message("content", "Message"),
      input.boolean("ephemeral", "Only they can see it", { default: false }),
    ],
    special: "message",
    code: (ctx) =>
      `await interaction.followUp(${ctx.message("content", { ephemeral: ctx.input("ephemeral") })});\n`,
  }),
  action({
    id: "component_update_message",
    label: "Answer by editing the button or menu's message",
    description: "Changes the message whose button or menu was used, instead of sending a new one.",
    category: "components",
    group: "Answering",
    icon: "fa-solid fa-arrows-rotate",
    keywords: ["update", "edit", "change message"],
    block: [
      {
        type: "cv2_updateInteraction",
        text: ["update the original message", "components: {components}"],
        parts: {
          components: { part: "statement", check: "rootComponents" },
          files: { part: "statement", check: "files" },
        },
        colour: "#4192E9",
        tooltip: "Updates the message the button / menu is attached to using Components V2.",
        previous: "default",
        next: "default",
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["buttons_event", "menus_event"],
            message: "This block must be under a button or menu event",
          },
          {
            type: "notEmpty",
            blockTypes: ["components"],
            message: "You must add at least one component",
          },
        ],
        mutator: {
          options: "cv2_updateInteraction_mutator",
          fields: [
            {
              name: "files",
              label: "include files",
              inputType: "statement",
              inputLabel: "files:",
              valueCheck: "files",
            },
          ],
        },
      },
      {
        type: "menus_update",
        pings: true,
        text: [
          "update the original message",
          "content: {content}",
          "embed(s): {embeds}",
          "rows: {rows}",
        ],
        parts: {
          content: { part: "value", check: "String" },
          embeds: { part: "value", check: "String" },
          rows: { part: "statement", check: "rows" },
        },
        colour: "26A483",
        inline: false,
        restrictions: [
          {
            type: "hasHat",
            blockTypes: ["menus_event"],
            message: 'This block must be in a "when a menu is clicked" event',
          },
          {
            type: "notEmpty",
            blockTypes: ["content", "embeds"],
            message: "You must specify the content and/or embed(s)",
          },
        ],
        code: (ctx) => `interaction.update({
  ${ctx.allowedMentions()},
  content: ${ctx.code("content") || "''"},
  embeds: [${ctx.code("embeds").replaceAll("'", "")}],
  components: [
  ${ctx.branch("rows")}]
});`,
      },
    ],
    requires: ["component"],
    answers: "update",
    inputs: [input.message("content", "New message")],
    special: "message",
    code: (ctx) => `await interaction.update(${ctx.message("content", { edit: true })});\n`,
  }),
  action({
    id: "component_defer_update",
    label: "Answer the button or menu silently",
    description:
      "Tells Discord the click or pick worked, without sending or changing anything. Change the message later with Edit the interaction reply.",
    category: "components",
    group: "Answering",
    icon: "fa-solid fa-check-double",
    keywords: ["defer update", "acknowledge", "silent", "no reply", "ignore"],
    block: {
      type: "misc_int_deferUpdate",
      text: "defer update",
      colour: "4192E9",
      tooltip:
        "Tells Discord the button or menu worked without changing the message. Edit the reply later.",
      restrictions: [
        {
          type: "hasHat",
          blockTypes: ["buttons_event", "menus_event"],
          message: "This must be under a button or menu event",
        },
      ],
    },

    requires: ["component"],
    answers: "update",
    code: () => "await interaction.deferUpdate();\n",
  }),
];

const values = [
  value({
    id: "component_message",
    label: "Message with the button or menu",
    description: "The message whose button or menu was just used.",
    category: "components",
    icon: "fa-solid fa-message",
    keywords: ["message", "button message"],
    block: { type: "buttons_message", text: "message of the clicked button", colour: "#2677AF" },
    requires: ["component"],
    output: "message",
    code: () => "interaction.message",
  }),
  value({
    id: "interaction_member",
    label: "Member who used it",
    description: "The member who used the command, button, menu or form. Empty in DMs.",
    category: "interactions",
    group: "Who and where",
    icon: "fa-solid fa-user-tag",
    keywords: ["member", "author", "who ran the command", "user who ran"],
    block: {
      type: "misc_int_member",
      text: "member of the interaction",
      colour: "#4192E9",
      inline: false,
      tooltip: "Returns the member who triggered the interaction (only available in servers).",
      restrictions: [
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
      ],
    },
    requires: ["interaction"],
    output: "member",
    code: () => "interaction.member",
  }),
  value({
    id: "interaction_user",
    label: "User who used it",
    description: "The person who used the command, button, menu or form.",
    category: "interactions",
    group: "Who and where",
    icon: "fa-solid fa-user",
    keywords: ["user", "author", "who ran the command", "user who ran"],
    block: {
      type: "misc_int_user",
      text: "user of the interaction",
      colour: "#4192E9",
      inline: false,
      tooltip: "Returns the user who triggered the interaction.",
      restrictions: [
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
      ],
    },
    requires: ["interaction"],
    output: "user",
    code: () => "interaction.user",
  }),
  value({
    id: "interaction_channel",
    label: "Channel it was used in",
    description: "The channel where the command, button, menu or form was used.",
    category: "interactions",
    group: "Who and where",
    icon: "fa-solid fa-hashtag",
    keywords: ["channel"],
    block: {
      type: "misc_int_channel",
      text: "channel of the interaction",
      colour: "#4192E9",
      inline: false,
      tooltip: "Returns the channel where the interaction was invoked.",
      restrictions: [
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
      ],
    },
    requires: ["interaction"],
    output: "channel",
    code: () => "interaction.channel",
  }),
  value({
    id: "interaction_server",
    label: "Server it was used in",
    description: "The server where the command, button, menu or form was used. Empty in DMs.",
    category: "interactions",
    group: "Who and where",
    icon: "fa-solid fa-server",
    keywords: ["server", "guild"],
    block: {
      type: "misc_int_server",
      text: "server of the interaction",
      colour: "#4192E9",
      inline: false,
      tooltip: "Returns the server where the interaction occurred.",
      restrictions: [
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
      ],
    },
    requires: ["interaction"],
    output: "server",
    code: () => "interaction.guild",
  }),
  value({
    id: "channel_type_value",
    label: "Kind of channel",
    description:
      "A kind of channel, like text or voice. Used to limit which channels can be picked.",
    category: "channels",
    icon: "fa-solid fa-layer-group",
    keywords: ["channel type", "text", "voice", "category"],
    block: {
      type: "misc_channelType",
      text: "channel type {type}",
      parts: {
        type: {
          options: [
            ["announcements", "GuildAnnouncement"],
            ["category", "GuildCategory"],
            ["forum", "GuildForum"],
            ["media", "GuildMedia"],
            ["stage", "GuildStageVoice"],
            ["text", "GuildText"],
            ["voice", "GuildVoice"],
          ],
        },
      },
      colour: "4192E9",
    },
    output: "channelType",
    inputs: [
      input.dropdown(
        "type",
        "Type",
        [
          ["Text", "GuildText"],
          ["Voice", "GuildVoice"],
          ["Category", "GuildCategory"],
          ["Announcement", "GuildAnnouncement"],
          ["Stage", "GuildStageVoice"],
          ["Forum", "GuildForum"],
          ["Media", "GuildMedia"],
        ],
        { default: "GuildText" },
      ),
    ],
    code: (ctx) => `Discord.ChannelType.${ctx.raw("type")}`,
  }),
];

const components = [
  component({
    id: "msg_text",
    family: "message",
    label: "Text",
    description: "A block of text. Supports Discord formatting like **bold**, lists and links.",
    icon: "fa-solid fa-font",
    block: {
      type: "cv2_textDisplay",
      text: "text display: {content}",
      tooltip:
        "Displays markdown text inside a Components V2 message. Supports full Discord markdown.",
      previous: ["rootComponents", "containerComponents"],
      next: ["rootComponents", "containerComponents"],
      restrictions: [
        {
          type: "custom",
          check: (block) => {
            const owner = findComponentOwner(block);
            return Boolean(
              owner && (CV2_SEND_TYPES.includes(owner.type) || owner.type === "cv2_container"),
            );
          },
          message: 'This block must be inside the "components" of a message or container',
        },
      ],
    },
    placement: ["root", "container"],
    fields: [
      input.text("content", "Text", {
        default: "",
        multiline: true,
        placeholder: "Hello there!",
        maxLength: 4000,
      }),
    ],
    code: (ctx) => `new Discord.TextDisplayBuilder().setContent(${ctx.input("content")})`,
    preview: (p) => ({ type: 10, content: p.text("content") }),
  }),
  component({
    id: "msg_separator",
    family: "message",
    label: "Divider",
    description: "Space between pieces, with or without a line.",
    icon: "fa-solid fa-grip-lines",
    block: {
      type: "cv2_separator",
      text: ["separator with {spacing}", "show line? {divider}"],
      parts: {
        spacing: {
          options: [
            ["small spacing", "Small"],
            ["large spacing", "Large"],
          ],
        },
        divider: { part: "checkbox", value: "TRUE" },
      },
      inline: false,
      tooltip: "Adds a visual space (and optional horizontal line) between components.",
      previous: "rootComponents",
      next: "rootComponents",
      restrictions: [
        {
          type: "custom",
          check: (block) => {
            const owner = findComponentOwner(block);
            return Boolean(
              owner && (CV2_SEND_TYPES.includes(owner.type) || owner.type === "cv2_container"),
            );
          },
          message: 'This block must be inside the "components" of a message or container',
        },
      ],
    },
    placement: ["root", "container"],
    fields: [
      input.dropdown("spacing", "Space", [
        ["Small", "Small"],
        ["Large", "Large"],
      ]),
      input.boolean("divider", "Show a line", { default: true, allowValues: false }),
    ],
    code: (ctx) =>
      `new Discord.SeparatorBuilder().setDivider(${ctx.raw("divider") === true}).setSpacing(Discord.SeparatorSpacingSize.${ctx.raw("spacing") === "Large" ? "Large" : "Small"})`,
    preview: (p) => ({
      type: 14,
      divider: p.raw("divider") === true,
      spacing: p.raw("spacing") === "Large" ? 2 : 1,
    }),
  }),
  component({
    id: "msg_container",
    family: "message",
    label: "Container",
    description: "A box around other pieces, with an optional colored stripe on the side.",
    icon: "fa-regular fa-square",
    block: {
      type: "cv2_container",
      text: ["container", "accent color (optional): {color}", "components: {components}"],
      parts: {
        color: { check: ["Colour", "String"] },
        useColor: { part: "fixed", when: "color" },
        components: { part: "statement", check: "containerComponents" },
      },
      tooltip:
        "Groups components in a visually distinct rounded box with an optional colored stripe on the left.",
      previous: "rootComponents",
      next: "rootComponents",
      restrictions: [
        {
          type: "custom",
          check: (block) => {
            const owner = findComponentOwner(block);
            return Boolean(
              owner && (CV2_SEND_TYPES.includes(owner.type) || owner.type === "cv2_container"),
            );
          },
          message: 'This block must be inside the "components" of a message or container',
        },
        {
          type: "custom",
          check: (block) => findComponentOwner(block)?.type !== "cv2_container",
          message: "A container can't be inside another container",
        },
      ],
    },
    placement: ["root"],
    children: { accepts: "container", label: "Inside the container", min: 1 },
    fields: [
      input.boolean("useColor", "Colored stripe", { default: false, allowValues: false }),
      input.colour("color", "Stripe color", { default: "#5865F2", showIf: { useColor: true } }),
    ],
    code: (ctx) => {
      const color =
        ctx.raw("useColor") === true
          ? `_container.setAccentColor(parseInt(String(${ctx.input("color")}).replace("#", ""), 16));\n`
          : "";
      return `await (async () => {
const _container = new Discord.ContainerBuilder();
${color}for (const comp of [${ctx.children().join(",\n")}]) {
  if (comp instanceof Discord.TextDisplayBuilder) _container.addTextDisplayComponents(comp);
  else if (comp instanceof Discord.SeparatorBuilder) _container.addSeparatorComponents(comp);
  else if (comp instanceof Discord.SectionBuilder) _container.addSectionComponents(comp);
  else if (comp instanceof Discord.MediaGalleryBuilder) _container.addMediaGalleryComponents(comp);
  else if (comp instanceof Discord.ActionRowBuilder) _container.addActionRowComponents(comp);
  else if (comp instanceof Discord.FileBuilder) _container.addFileComponents(comp);
}
return _container;
})()`;
    },
    preview: (p) => ({
      type: 17,
      accent_color: p.raw("useColor") === true ? p.colour("color") : null,
      components: p.children(),
    }),
  }),
  component({
    id: "msg_section_image",
    family: "message",
    label: "Text with a picture",
    description: "Text with a small picture (a thumbnail) on the right.",
    icon: "fa-solid fa-image",
    block: {
      type: "cv2_section_thumbnail",
      text: [
        "section with thumbnail",
        "text: {text}",
        "thumbnail URL: {thumbnailUrl}",
        "alt text: {thumbnailAlt}",
      ],
      tooltip: "A section with 1-3 lines of text and a thumbnail image on the right.",
      previous: ["rootComponents", "containerComponents"],
      next: ["rootComponents", "containerComponents"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["text"], message: "You must specify the section text" },
        {
          type: "notEmpty",
          blockTypes: ["thumbnailUrl"],
          message: "You must specify the thumbnail URL",
        },
        {
          type: "custom",
          check: (block) => {
            const owner = findComponentOwner(block);
            return Boolean(
              owner && (CV2_SEND_TYPES.includes(owner.type) || owner.type === "cv2_container"),
            );
          },
          message: 'This block must be inside the "components" of a message or container',
        },
      ],
    },
    placement: ["root", "container"],
    weight: 3,
    fields: [
      input.text("text", "Text", {
        default: "Text goes here, with a picture next to it",
        multiline: true,
      }),
      input.text("thumbnailUrl", "Picture link", {
        default: "",
        placeholder: "https://example.com/image.png",
      }),
      input.text("thumbnailAlt", "Picture description", {
        default: "",
        help: "Read out by screen readers.",
      }),
    ],
    code: (ctx) => `new Discord.SectionBuilder()
  .addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(${ctx.input("text")}))
  .setThumbnailAccessory(new Discord.ThumbnailBuilder().setURL(${ctx.input("thumbnailUrl")}).setDescription(${ctx.input("thumbnailAlt")}))`,
    preview: (p) => ({
      type: 9,
      components: [{ type: 10, content: p.text("text") }],
      accessory: {
        type: 11,
        media: { url: p.url("thumbnailUrl", p.display("thumbnailAlt") || "thumbnail") },
        description: p.display("thumbnailAlt"),
      },
    }),
  }),
  component({
    id: "msg_section_button",
    family: "message",
    label: "Text with a button",
    description: "Text with a button on the right.",
    icon: "fa-solid fa-square-caret-right",
    block: {
      type: "cv2_section_button",
      text: [
        "section with button",
        "text: {text}",
        "button label: {buttonLabel}",
        "button emoji: {buttonEmoji}",
        "button custom ID: {buttonId}",
        "button style: {style}",
        "button URL (only for link style): {url}",
      ],
      inline: false,
      tooltip: "A section with text and a button as the accessory on the right.",
      previous: ["rootComponents", "containerComponents"],
      next: ["rootComponents", "containerComponents"],
      restrictions: [
        { type: "notEmpty", blockTypes: ["text"], message: "You must specify the section text" },
        {
          type: "notEmpty",
          blockTypes: ["buttonLabel"],
          message: "You must specify the button label",
        },
        {
          type: "notEmpty",
          blockTypes: ["buttonId"],
          message: "You must specify the button custom ID",
        },
        {
          type: "custom",
          check: (block) => {
            const owner = findComponentOwner(block);
            return Boolean(
              owner && (CV2_SEND_TYPES.includes(owner.type) || owner.type === "cv2_container"),
            );
          },
          message: 'This block must be inside the "components" of a message or container',
        },
      ],
    },
    placement: ["root", "container"],
    weight: 3,
    fields: [
      input.text("text", "Text", {
        default: "Text goes here, with a button next to it",
        multiline: true,
      }),
      input.text("buttonLabel", "Button label", { default: "Click me", maxLength: 80 }),
      input.text("buttonEmoji", "Button emoji (optional)", { default: "" }),
      input.dropdown("style", "Button color", [
        ["Blurple", "Primary"],
        ["Gray", "Secondary"],
        ["Green", "Success"],
        ["Red", "Danger"],
        ["Link", "Link"],
      ]),
      input.text("buttonId", "Button ID", {
        default: "my-button",
        showIf: { style: ["Primary", "Secondary", "Success", "Danger"] },
        help: 'Used by "When a button is clicked" to know which button it was.',
      }),
      input.text("url", "Link", {
        default: "",
        placeholder: "https://",
        showIf: { style: "Link" },
      }),
    ],
    code: (ctx) => {
      const style = ctx.raw("style") in BUTTON_STYLES ? ctx.raw("style") : "Primary";
      return `new Discord.SectionBuilder()
  .addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(${ctx.input("text")}))
  .setButtonAccessory(
    new Discord.ButtonBuilder()
      .setLabel(${ctx.input("buttonLabel")})
      .setStyle(Discord.ButtonStyle.${style})${hasEmoji(ctx, "buttonEmoji") ? `\n      .setEmoji(${ctx.input("buttonEmoji")})` : ""}
      ${style === "Link" ? `.setURL(${ctx.input("url")})` : `.setCustomId(${ctx.input("buttonId")})`}
  )`;
    },
    preview: (p) => {
      const style = BUTTON_STYLES[p.raw("style")] ?? 1;
      const emoji = p.emoji("buttonEmoji");
      return {
        type: 9,
        components: [{ type: 10, content: p.text("text") }],
        accessory: {
          type: 2,
          style,
          label: p.display("buttonLabel"),
          ...(emoji ? { emoji } : {}),
          ...(style === 5
            ? { url: p.raw("url") || undefined }
            : { custom_id: p.display("buttonId") }),
        },
      };
    },
  }),
  component({
    id: "msg_gallery",
    family: "message",
    label: "Picture gallery",
    description: "A grid of up to 10 pictures or videos.",
    icon: "fa-solid fa-images",
    block: {
      type: "cv2_mediaGallery",
      text: ["media gallery", "images: {items}"],
      parts: { items: { part: "statement", check: "cv2galleryitem" } },
      tooltip:
        "Displays a grid of up to 10 images or videos (URLs). Put 'gallery image' blocks inside.",
      previous: ["rootComponents", "containerComponents"],
      next: ["rootComponents", "containerComponents"],
      restrictions: [
        {
          type: "custom",
          check: (block) => {
            const owner = findComponentOwner(block);
            return Boolean(
              owner && (CV2_SEND_TYPES.includes(owner.type) || owner.type === "cv2_container"),
            );
          },
          message: 'This block must be inside the "components" of a message or container',
        },
      ],
    },
    placement: ["root", "container"],
    children: { accepts: "gallery", label: "Pictures", min: 1, max: 10 },
    fields: [],
    code: (ctx) => `new Discord.MediaGalleryBuilder().addItems(${ctx.children().join(", ")})`,
    preview: (p) => ({ type: 12, items: p.children() }),
  }),
  component({
    id: "msg_gallery_item",
    family: "message",
    label: "Picture",
    description: "One picture or video in a gallery.",
    icon: "fa-regular fa-image",
    block: {
      type: "cv2_mediaGalleryItem",
      text: ["image with URL: {url}", "description: {alt}", "spoiler? {spoiler}"],
      parts: { spoiler: { part: "checkbox" } },
      inline: false,
      tooltip: "A single image item inside a media gallery.",
      previous: "cv2galleryitem",
      next: "cv2galleryitem",
      restrictions: [
        {
          type: "surroundParent",
          blockTypes: ["cv2_mediaGallery"],
          through: [
            "controls_repeat_ext",
            "controls_repeat",
            "controls_whileUntil",
            "controls_for",
            "controls_forEach",
            "controls_if",
            "server_getall",
            "member_foreach",
            "roles_foreach",
            "roles_foreachMember",
            "channel_foreach",
            "emoji_getallinserver",
            "sticker_getallinserver",
            "invite_foreach",
            "invite_channel_foreach",
            "msg_get_reactions",
            "fs_readdir",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "github_forEachRepo",
            "github_searchRepos",
            "github_forEachIssue",
            "github_forEachPullRequest",
            "github_forEachCommit",
            "github_forEachRelease",
          ],
          message: "Gallery image blocks must be inside a 'media gallery' block",
        },
      ],
    },
    placement: ["gallery"],
    weight: 0,
    fields: [
      input.text("url", "Picture link", {
        default: "",
        placeholder: "https://example.com/image.png",
        help: "Or attachment://name for a file in this message's Files.",
      }),
      input.text("alt", "Description", { default: "" }),
      input.boolean("spoiler", "Hide as spoiler", { default: false, allowValues: false }),
    ],
    code: (ctx) =>
      `new Discord.MediaGalleryItemBuilder().setURL(${ctx.input("url")}).setDescription(${ctx.input("alt")}).setSpoiler(${ctx.raw("spoiler") === true})`,
    preview: (p) => ({
      media: { url: p.url("url", p.display("alt") || "image") },
      description: p.display("alt"),
      spoiler: p.raw("spoiler") === true,
    }),
  }),
  component({
    id: "msg_file",
    family: "message",
    label: "File",
    description: "Shows one of this message's attached files. Attach it in Files first.",
    icon: "fa-solid fa-file",
    block: {
      type: "cv2_file",
      text: ["show file with name: {file}", "spoiler? {spoiler}"],
      parts: { spoiler: { part: "checkbox" } },
      inline: false,
      tooltip:
        "Displays an uploaded file inside a Components V2 message. Use an 'add file' block as the input.",
      previous: ["rootComponents", "containerComponents"],
      next: ["rootComponents", "containerComponents"],
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["file"],
          message: "You must attach a file to the file component",
        },
        {
          type: "custom",
          check: (block) => {
            const owner = findComponentOwner(block);
            return Boolean(
              owner && (CV2_SEND_TYPES.includes(owner.type) || owner.type === "cv2_container"),
            );
          },
          message: 'This block must be inside the "components" of a message or container',
        },
      ],
    },
    placement: ["root", "container"],
    fields: [
      input.text("file", "File name", {
        default: "",
        placeholder: "notes.txt",
        help: "The name of a file in this message's Files list.",
      }),
      input.boolean("spoiler", "Hide as spoiler", { default: false, allowValues: false }),
    ],
    code: (ctx) =>
      `new Discord.FileBuilder().setURL("attachment://" + ${ctx.input("file")}).setSpoiler(${ctx.raw("spoiler") === true})`,
    preview: (p) => ({
      type: 13,
      file: { url: "attachment://" + p.display("file") },
      spoiler: p.raw("spoiler") === true,
    }),
  }),
  component({
    id: "msg_row",
    family: "message",
    label: "Row of buttons or a menu",
    description: "Holds up to 5 buttons, or one select menu.",
    icon: "fa-solid fa-table-columns",
    block: {
      type: "misc_addrow",
      text: ["interactive row (buttons/menus)", "with: {components}"],
      parts: { components: { part: "statement", check: "default" } },
      tooltip:
        "An action row inside a Components V2 message. Place button or select menu blocks inside.",
      previous: ["rows", "rootComponents", "containerComponents"],
      next: ["rows", "rootComponents", "containerComponents"],
      restrictions: [
        {
          type: "surroundParent",
          blockTypes: [
            "msg_reply_mutator",
            "misc_int_edit_mutator",
            "misc_int_reply_mutator",
            "channel_send_mutator",
            "member_dm_mutator",
            "msg_reply_rows",
            "misc_reply_rows",
            "channel_send_rows",
            "member_dm_rows",
            "misc_int_reply_rows",
            "slash_editreply",
            "cv2_sendMessage",
            "cv2_sendDm",
            "cv2_replyInteraction",
            "cv2_replyMsg",
            "cv2_editReplyInteraction",
            "cv2_updateInteraction",
            "cv2_editMsg",
            "cv2_container",
          ],
          through: [
            "controls_repeat_ext",
            "controls_repeat",
            "controls_whileUntil",
            "controls_for",
            "controls_forEach",
            "controls_if",
            "server_getall",
            "member_foreach",
            "roles_foreach",
            "roles_foreachMember",
            "channel_foreach",
            "emoji_getallinserver",
            "sticker_getallinserver",
            "invite_foreach",
            "invite_channel_foreach",
            "msg_get_reactions",
            "fs_readdir",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "github_forEachRepo",
            "github_searchRepos",
            "github_forEachIssue",
            "github_forEachPullRequest",
            "github_forEachCommit",
            "github_forEachRelease",
          ],
          message: "This block must be under a block that has a 'components' section",
        },
      ],
    },
    placement: ["root", "container"],
    children: { accepts: "row", label: "In the row", min: 1, max: 5 },
    fields: [],
    code: (ctx) => `new Discord.ActionRowBuilder().addComponents(${ctx.children().join(", ")})`,
    preview: (p) => ({ type: 1, components: p.children() }),
  }),
  component({
    id: "msg_button",
    family: "message",
    label: "Button",
    description: 'A button people can click. Handle clicks with "When a button is clicked".',
    icon: "fa-solid fa-hand-pointer",
    block: {
      type: "buttons_add",
      text: [
        "add a button",
        "label: {label}",
        "emoji: {emoji}",
        "style: {style}",
        "ID: {id}",
        "disabled? {disabled}",
        "URL (only with link style): {url}",
      ],
      colour: "2677AF",
      inline: false,
      previous: "default",
      next: "default",
      restrictions: [
        {
          type: "surroundParent",
          blockTypes: ["misc_addrow"],
          through: [
            "controls_repeat_ext",
            "controls_repeat",
            "controls_whileUntil",
            "controls_for",
            "controls_forEach",
            "controls_if",
            "server_getall",
            "member_foreach",
            "roles_foreach",
            "roles_foreachMember",
            "channel_foreach",
            "emoji_getallinserver",
            "sticker_getallinserver",
            "invite_foreach",
            "invite_channel_foreach",
            "msg_get_reactions",
            "fs_readdir",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "github_forEachRepo",
            "github_searchRepos",
            "github_forEachIssue",
            "github_forEachPullRequest",
            "github_forEachCommit",
            "github_forEachRelease",
          ],
          message: 'This block must be under a "add row" block',
        },
        {
          type: "notEmpty",
          blockTypes: ["label"],
          message: "You must specify a label to show to the user",
        },
        {
          type: "validator",
          blockTypes: ["label"],
          check: (val) => val.length <= 80,
          message: "Label cannot be greater than 80 characters",
        },
        {
          type: "validator",
          blockTypes: ["emoji"],
          check: (val) => /^\p{Emoji}$/u.test(val),
          message: "Emoji must be a single valid emoji",
        },
        {
          type: "validator",
          blockTypes: ["id"],
          check: (val) => val.length <= 100,
          message: "ID cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["id"],
          check: (val) => /^(|[a-z0-9_-]+)$/.test(val),
          message: "The ID only have lowercase letters, numbers, hyphens, and/or underscores",
        },
      ],
    },
    placement: ["row"],
    fields: [
      input.text("label", "Label", { default: "Click me", maxLength: 80 }),
      input.text("emoji", "Emoji (optional)", { default: "" }),
      input.dropdown("style", "Color", [
        ["Blurple", "1"],
        ["Gray", "2"],
        ["Green", "3"],
        ["Red", "4"],
        ["Link", "5"],
      ]),
      input.text("id", "Button ID", {
        default: "my-button",
        showIf: { style: ["1", "2", "3", "4"] },
        help: 'Used by "When a button is clicked" to know which button it was.',
      }),
      input.text("url", "Link", { default: "", placeholder: "https://", showIf: { style: "5" } }),
      input.boolean("disabled", "Grayed out (can't be clicked)", { default: false }),
    ],
    code: (ctx) => {
      const style = Number(ctx.raw("style")) || 1;
      const parts = [
        "new Discord.ButtonBuilder()",
        `.setLabel(${ctx.input("label")})`,
        `.setStyle(${style})`,
        `.setDisabled(${ctx.input("disabled")})`,
      ];
      if (style === 5) parts.push(`.setURL(${ctx.input("url")})`);
      else parts.push(`.setCustomId(${ctx.input("id")})`);
      if (hasEmoji(ctx, "emoji")) parts.push(`.setEmoji(${ctx.input("emoji")})`);
      return parts.join("");
    },
    preview: (p) => {
      const style = Number(p.raw("style")) || 1;
      const emoji = p.emoji("emoji");
      return {
        type: 2,
        style,
        label: p.display("label"),
        disabled: p.raw("disabled") === true,
        ...(emoji ? { emoji } : {}),
        ...(style === 5 ? { url: p.raw("url") || undefined } : { custom_id: p.display("id") }),
      };
    },
  }),
  component({
    id: "msg_menu",
    family: "message",
    label: "Menu",
    description:
      'A dropdown menu of options you write. Handle picks with "When someone picks from a menu".',
    icon: "fa-solid fa-list",
    block: {
      type: "menus_add",
      text: [
        "add a menu",
        "placeholder: {placeholder}",
        "ID: {id}",
        "disabled? {disabled}",
        "options: {options}",
      ],
      parts: { options: { part: "statement", check: "default" } },
      colour: "26A483",
      inline: false,
      tooltip: "This represents the whole menu",
      previous: "default",
      next: "default",
      restrictions: [
        {
          type: "surroundParent",
          blockTypes: ["misc_addrow"],
          through: [
            "controls_repeat_ext",
            "controls_repeat",
            "controls_whileUntil",
            "controls_for",
            "controls_forEach",
            "controls_if",
            "server_getall",
            "member_foreach",
            "roles_foreach",
            "roles_foreachMember",
            "channel_foreach",
            "emoji_getallinserver",
            "sticker_getallinserver",
            "invite_foreach",
            "invite_channel_foreach",
            "msg_get_reactions",
            "fs_readdir",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "github_forEachRepo",
            "github_searchRepos",
            "github_forEachIssue",
            "github_forEachPullRequest",
            "github_forEachCommit",
            "github_forEachRelease",
          ],
          message: 'This block must be under an "add row" block',
        },
        {
          type: "notEmpty",
          blockTypes: ["options"],
          message: "You must add options that the user can click",
        },
        { type: "notEmpty", blockTypes: ["id"], message: "You must specify an ID for the menu" },
        {
          type: "validator",
          blockTypes: ["placeholder"],
          check: (val) => val.length <= 100,
          message: "Placeholder cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["id"],
          check: (val) => val.length <= 100,
          message: "ID cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["id"],
          check: (val) => /^[a-z0-9_-]+$/.test(val),
          message: "The ID only have lowercase letters, numbers, hyphens, and/or underscores",
        },
      ],
    },
    placement: ["row"],
    weight: 5,
    children: { accepts: "options", label: "Options", min: 1, max: 25 },
    fields: [
      input.text("placeholder", "Placeholder", { default: "Pick something", maxLength: 150 }),
      input.text("id", "Menu ID", {
        default: "my-menu",
        help: 'Used by "When someone picks from a menu" to know which menu it was.',
      }),
      input.boolean("disabled", "Grayed out (can't be used)", { default: false }),
    ],
    code: (ctx) => `new Discord.StringSelectMenuBuilder()
  .setPlaceholder(${ctx.input("placeholder")})
  .setCustomId(${ctx.input("id")})
  .setDisabled(${ctx.input("disabled")})
  .addOptions([${ctx.children().join(", ")}])`,
    preview: (p) => ({
      type: 3,
      custom_id: p.display("id"),
      placeholder: p.display("placeholder"),
      disabled: p.raw("disabled") === true,
      options: p.children(),
    }),
  }),
  component({
    id: "msg_menu_option",
    family: "message",
    label: "Option",
    description: "One choice in a menu.",
    icon: "fa-solid fa-circle-dot",
    block: {
      type: "menus_addoption",
      text: [
        "add an option",
        "label: {label}",
        "description: {dsc}",
        "emoji: {emoji}",
        "selected by default? {default}",
        "value (not shown to user): {value}",
      ],
      colour: "26A483",
      inline: false,
      tooltip: "This represents one clickable option inside the menu",
      previous: "default",
      next: "default",
      restrictions: [
        {
          type: "surroundParent",
          blockTypes: ["menus_add"],
          through: [
            "controls_repeat_ext",
            "controls_repeat",
            "controls_whileUntil",
            "controls_for",
            "controls_forEach",
            "controls_if",
            "server_getall",
            "member_foreach",
            "roles_foreach",
            "roles_foreachMember",
            "channel_foreach",
            "emoji_getallinserver",
            "sticker_getallinserver",
            "invite_foreach",
            "invite_channel_foreach",
            "msg_get_reactions",
            "fs_readdir",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "github_forEachRepo",
            "github_searchRepos",
            "github_forEachIssue",
            "github_forEachPullRequest",
            "github_forEachCommit",
            "github_forEachRelease",
          ],
          message: 'This block must be under a "add menu" block',
        },
        {
          type: "notEmpty",
          blockTypes: ["label"],
          message: "You must specify a label to show to the user",
        },
        { type: "notEmpty", blockTypes: ["value"], message: "You must specify a value" },
        {
          type: "validator",
          blockTypes: ["label"],
          check: (val) => val.length <= 25,
          message: "Label cannot be greater than 25 characters",
        },
        {
          type: "validator",
          blockTypes: ["dsc"],
          check: (val) => val.length <= 100,
          message: "Description cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["value"],
          check: (val) => val.length > 0 && val.length <= 100,
          message: "Value must be between 1 - 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["emoji"],
          check: (val) => /^(|([\p{Emoji}]{1}))$/u.test(val),
          message: "Emoji must be a single valid emoji",
        },
      ],
    },
    placement: ["options"],
    weight: 0,
    fields: [
      input.text("label", "Label", { default: "Option", maxLength: 100 }),
      input.text("dsc", "Description (optional)", { default: "", maxLength: 100 }),
      input.text("emoji", "Emoji (optional)", { default: "" }),
      input.text("value", "Value", {
        default: "option",
        maxLength: 100,
        help: "What your steps get when this option is picked.",
      }),
      input.boolean("default", "Picked to start with", { default: false }),
    ],
    code: (ctx) =>
      `{ label: ${ctx.input("label")}, ${ctx.has("dsc") ? `description: ${ctx.input("dsc")}, ` : ""}${hasEmoji(ctx, "emoji") ? `emoji: ${ctx.input("emoji")}, ` : ""}default: ${ctx.input("default")}, value: ${ctx.input("value")} }`,
    preview: (p) => {
      const emoji = p.emoji("emoji");
      return {
        label: p.display("label"),
        description: p.display("dsc"),
        value: p.display("value"),
        default: p.raw("default") === true,
        ...(emoji ? { emoji } : {}),
      };
    },
  }),
  ...[
    {
      id: "msg_user_menu",
      block: {
        type: "menus_addUserMenu",
        text: [
          "add a user menu",
          "placeholder: {placeholder}",
          "ID: {id}",
          "disabled? {disabled}",
          "default selected user IDs: {defaultUsers}",
        ],
      },
      builder: "UserSelectMenuBuilder",
      setter: "setDefaultUsers",
      key: "defaultUsers",
      label: "User menu",
      noun: "people",
      type: 5,
      icon: "fa-solid fa-user",
    },
    {
      id: "msg_role_menu",
      block: {
        type: "menus_addRoleMenu",
        text: [
          "add a role menu",
          "placeholder: {placeholder}",
          "ID: {id}",
          "disabled? {disabled}",
          "default selected role IDs: {defaultRoles}",
        ],
      },
      builder: "RoleSelectMenuBuilder",
      setter: "setDefaultRoles",
      key: "defaultRoles",
      label: "Role menu",
      noun: "roles",
      type: 6,
      icon: "fa-solid fa-shield-halved",
    },
    {
      id: "msg_mentionable_menu",
      block: {
        type: "menus_addMentionableMenu",
        text: [
          "add a mentionable menu",
          "placeholder: {placeholder}",
          "ID: {id}",
          "disabled? {disabled}",
          "default selected value IDs: {defaultVals}",
        ],
      },
      builder: "MentionableSelectMenuBuilder",
      setter: "setDefaultValues",
      key: "defaultVals",
      label: "User or role menu",
      noun: "people or roles",
      type: 7,
      icon: "fa-solid fa-at",
    },
    {
      id: "msg_channel_menu",
      block: {
        type: "menus_addChannelMenu",
        text: [
          "add a channel menu",
          "placeholder: {placeholder}",
          "ID: {id}",
          "disabled? {disabled}",
          "accepted channel types: {channelTypes}",
          "default selected channel IDs: {defaultChannels}",
        ],
        parts: { channelTypes: { check: "Array" } },
      },
      builder: "ChannelSelectMenuBuilder",
      setter: "setDefaultChannels",
      key: "defaultChannels",
      label: "Channel menu",
      noun: "channels",
      type: 8,
      icon: "fa-solid fa-hashtag",
    },
  ].map((menu) =>
    component({
      id: menu.id,
      block: {
        colour: "26A483",
        inline: false,
        tooltip: "This represents the whole menu",
        previous: "default",
        next: "default",
        ...menu.block,
      },
      family: "message",
      label: menu.label,
      description: `A menu of ${menu.noun} from the server. Handle picks with "When someone picks from a menu".`,
      icon: menu.icon,

      placement: ["row"],
      weight: 5,
      fields: [
        input.text("placeholder", "Placeholder", { default: "Pick something", maxLength: 150 }),
        input.text("id", "Menu ID", { default: "my-menu" }),
        input.boolean("disabled", "Grayed out (can't be used)", { default: false }),
        ...(menu.type === 8
          ? [
              input.multi(
                "channelTypes",
                "Only these kinds of channels",
                [
                  ["Text", "GuildText"],
                  ["Voice", "GuildVoice"],
                  ["Category", "GuildCategory"],
                  ["Announcement", "GuildAnnouncement"],
                  ["Stage", "GuildStageVoice"],
                  ["Forum", "GuildForum"],
                  ["Media", "GuildMedia"],
                ],
                { help: "Leave empty to allow every kind." },
              ),
            ]
          : []),
        input.slot(menu.key, "Picked to start with (list of IDs)", "Array", { optional: true }),
      ],
      code: (ctx) => {
        const types =
          menu.type === 8 && ctx.isValue("channelTypes")
            ? `\n  .setChannelTypes(${ctx.input("channelTypes")})`
            : menu.type === 8 && (ctx.raw("channelTypes") ?? []).length
              ? `\n  .setChannelTypes([${ctx
                  .raw("channelTypes")
                  .map((t) => `Discord.ChannelType.${t}`)
                  .join(", ")}])`
              : "";
        return `new Discord.${menu.builder}()
  .setPlaceholder(${ctx.input("placeholder")})
  .setCustomId(${ctx.input("id")})
  .setDisabled(${ctx.input("disabled")})${ctx.has(menu.key) ? `\n  .${menu.setter}(${ctx.input(menu.key)})` : ""}${types}`;
      },
      preview: (p) => ({
        type: menu.type,
        custom_id: p.display("id"),
        placeholder: p.display("placeholder"),
        disabled: p.raw("disabled") === true,
      }),
    }),
  ),
];

const blocks = [
  block({
    type: "buttons_member",
    text: "member who clicked the button",
    colour: "#2677AF",
    output: "member",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["buttons_event"],
        message: 'This block must be in a "when a button is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = `interaction.member`;
      return [code, Order.NONE];
    },
  }),
  block({
    type: "buttons_user",
    text: "user who clicked the button",
    colour: "#2677AF",
    output: "user",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["buttons_event"],
        message: 'This block must be in a "when a button is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = `interaction.member.user`;
      return [code, Order.NONE];
    },
  }),
  block({
    type: "buttons_channel",
    text: "channel of the button",
    colour: "#2677AF",
    output: "channel",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["buttons_event"],
        message: 'This block must be in a "when a button is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = `interaction.channel`;
      return [code, Order.NONE];
    },
  }),
  block({
    type: "buttons_server",
    text: "server of the button",
    colour: "#2677AF",
    output: "server",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["buttons_event"],
        message: 'This block must be in a "when a button is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = `interaction.guild`;
      return [code, Order.NONE];
    },
  }),
  block({
    type: "slash_reply",
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

      var code = `await interaction.reply({
          ${legacyMentions(ctx)}content: ${value_content || "''"},
          embeds: [${value_embeds.replaceAll("'", "")}],
          ephemeral: ${value_ephemeral || "false"}
        });`;
      return code;
    },
  }),
  block({
    type: "slash_edit",
    text: ["edit the reply", "content: {content}", "embed(s): {embeds}"],
    parts: { content: { part: "value", check: "String" }, embeds: { part: "text", value: "name" } },
    colour: "2677AF",
    inline: false,
    previous: "default",
    next: "default",
    code: () => "",
  }),
  block({
    type: "cv2_addFile",
    text: ["add file from URL/path: {path}", "with name: {name}"],
    parts: { path: { part: "value", check: "String" }, name: { part: "value", check: "String" } },
    inline: false,
    previous: "files",
    next: "files",
    code: (ctx) => {
      var path = ctx.code("path");
      var name = ctx.code("name");
      return `new Discord.AttachmentBuilder(${path}, { name: ${name} }),\n`;
    },
  }),
  block({
    type: "menus_member",
    text: "member who clicked the menu",
    colour: "#26A483",
    output: "member",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["menus_event"],
        message: 'This block must be in a "when a menu is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = `interaction.member`;
      return [code, Order.NONE];
    },
  }),
  block({
    type: "menus_user",
    text: "user who clicked the menu",
    colour: "#26A483",
    output: "user",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["menus_event"],
        message: 'This block must be in a "when a menu is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = `interaction.member.user`;
      return [code, Order.NONE];
    },
  }),
  block({
    type: "menus_channel",
    text: "channel of the menu",
    colour: "#26A483",
    output: "channel",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["menus_event"],
        message: 'This block must be in a "when a menu is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = `interaction.channel`;
      return [code, Order.NONE];
    },
  }),
  block({
    type: "menus_server",
    text: "server of the menu",
    colour: "#26A483",
    output: "server",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["menus_event"],
        message: 'This block must be in a "when a menu is clicked" event',
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var code = `interaction.guild`;
      return [code, Order.NONE];
    },
  }),
  block({
    type: "menus_reply",
    pings: true,
    text: ["reply to the click", "content: {content}", "embed(s): {embeds}"],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
    },
    colour: "26A483",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["menus_event"],
        message: 'This block must be in a "when a menu is clicked" event',
      },
      {
        type: "notEmpty",
        blockTypes: ["content", "embeds"],
        message: "You must specify the content and/or embed(s)",
      },
    ],
    code: (ctx) => {
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");

      var code = `interaction.reply({
      ${ctx.allowedMentions()},
      content: ${content || "''"},
      embeds: [${embeds.replaceAll("'", "")}]
    });`;
      return code;
    },
  }),
  block({
    type: "menus_edit",
    pings: true,
    text: ["edit the reply", "content: {content}", "embed(s): {embeds}"],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
    },
    colour: "26A483",
    inline: false,
    previous: "default",
    next: "default",
    restrictions: [
      {
        type: "hasHat",
        blockTypes: ["menus_event"],
        message: 'This block must be in a "when a menu is clicked" event',
      },
      {
        type: "notEmpty",
        blockTypes: ["content", "embeds"],
        message: "You must specify the content and/or embed(s)",
      },
    ],
    code: (ctx) => {
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");

      var code = `interaction.editReply({
      ${ctx.allowedMentions()},
      content: ${content || "''"},
      embeds: [${embeds.replaceAll("'", "")}]
    });`;
      return code;
    },
  }),
  block({
    type: "misc_int_reply_mutator",
    pings: true,
    text: [
      "reply to the interaction",
      "content: {content}",
      "visible only to the user? {ephemeral}",
    ],
    parts: {
      content: { part: "value", check: "String" },
      ephemeral: { part: "value", check: "Boolean" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
      files: { part: "statement", check: "files" },
    },
    colour: "#4192E9",
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
    mutator: {
      options: "misc_int_reply_mutator_options",
      fields: [
        {
          name: "embeds",
          label: "include embeds",
          default: false,
          inputType: "value",
          inputLabel: "embed name(s):",
          valueCheck: "String",
        },
        {
          name: "rows",
          label: "include rows",
          default: false,
          inputType: "statement",
          inputLabel: "rows:",
          valueCheck: "rows",
        },
        {
          name: "files",
          label: "include files",
          default: false,
          inputType: "statement",
          inputLabel: "files:",
          valueCheck: "files",
        },
      ],
    },
    code: (ctx) => {
      const content = ctx.code("content") || "''";
      const embeds = ctx.code("embeds");
      const ephemeral = ctx.code("ephemeral");
      const rows = ctx.branch("rows");
      const files = ctx.branch("files");

      const options = [`content: ${content}`];
      if (embeds) options.push(`embeds: [${embeds.replaceAll("'", "")}]`);
      if (rows) options.push(`components: [\n${rows}]`);
      if (files) options.push(`files: [\n${files}]`);
      if (ephemeral) options.push(`ephemeral: ${ephemeral}`);
      options.push(ctx.allowedMentions());

      return `await interaction.reply({
      ${options.join(",\n  ")}
    });\n`;
    },
  }),
  block({
    type: "misc_int_edit_mutator",
    pings: true,
    text: ["edit the reply", "content: {content}"],
    parts: {
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
      files: { part: "statement", check: "files" },
    },
    colour: "#4192E9",
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
    mutator: {
      options: "misc_int_edit_mutator_options",
      fields: [
        {
          name: "embeds",
          label: "include embeds",
          default: false,
          inputType: "value",
          inputLabel: "embed name(s):",
          valueCheck: "String",
        },
        {
          name: "rows",
          label: "include rows",
          default: false,
          inputType: "statement",
          inputLabel: "rows:",
          valueCheck: "rows",
        },
        {
          name: "files",
          label: "include files",
          default: false,
          inputType: "statement",
          inputLabel: "files:",
          valueCheck: "files",
        },
      ],
    },
    code: (ctx) => {
      const content = ctx.code("content") || "''";
      const embeds = ctx.code("embeds");
      const rows = ctx.branch("rows");
      const files = ctx.branch("files");

      const options = [`content: ${content}`];
      if (embeds) options.push(`embeds: [${embeds.replaceAll("'", "")}]`);
      if (rows) options.push(`components: [\n${rows}]`);
      if (files) options.push(`files: [\n${files}]`);
      options.push(ctx.allowedMentions());

      return `await interaction.editReply({
      ${options.join(",\n  ")}
    });\n`;
    },
  }),
  block({
    type: "misc_addFile",
    text: "add file from path: {path}",
    parts: { path: { part: "value", check: "String" } },
    colour: "4192E9",
    previous: "files",
    next: "files",
    code: (ctx) => {
      var path = ctx.code("path");
      return `new Discord.AttachmentBuilder(${path}),\n`;
    },
  }),
  block({
    type: "misc_createcontainer",
    text: [
      "set slash commands / context menus",
      "guild ID (leave blank for global commands and menus): {guild}",
      "{code}",
    ],
    parts: {
      guild: { part: "value", check: "String" },
      code: { part: "statement", check: ["contextMenuCreate", "slashCreate"] },
    },
    colour: "4192E9",
    inline: false,
    previous: "default",
    next: "default",
    code: (ctx) => {
      var value_guild = ctx.code("guild");
      var statements_code = ctx.branch("code");

      var code;
      if (value_guild?.length > 15)
        code = `(await getCollection(client, "guilds")).get(${value_guild}).commands.set([${statements_code}
    ]);`;
      else
        code = `client.application.commands.set([${statements_code}
    ]);`;

      return code;
    },
  }),
  block({
    type: "misc_createcontainer_global",
    text: [
      "create slash commands / context menus",
      "test guild ID (blank = global commands and menus): {guild}",
      "{code}",
    ],
    parts: {
      guild: { part: "value", check: "String" },
      code: { part: "statement", check: ["contextMenuCreate", "slashCreate"] },
    },
    colour: "4192E9",
    inline: false,
    restrictions: [
      {
        type: "blockAlreadyExists",
        blockTypes: ["misc_createcontainer_global"],
        message: "It is recommended you use this block only once",
      },
    ],
    code: (ctx) => {
      let guild = ctx.code("guild");
      let setCode = ctx.branch("code");

      let code =
        guild && guild.length > 5
          ? `(await getCollection(client, "guilds")).get(${guild})`
          : "client.application";

      code = code + `.commands.set([${setCode}\n]);\n`;

      return `client.on("clientReady", async () => {
          ${code}
        });`;
    },
  }),
  block({
    type: "misc_int_id",
    text: "id of the interaction",
    colour: "#4192E9",
    inline: false,
    tooltip: "Returns the unique ID of the interaction.",
    output: "String",
    code: (ctx) => {
      const { Order } = ctx;
      return ["interaction.id", Order.NONE];
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
