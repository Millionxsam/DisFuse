/* =====================================================================
   Builder catalog: forms
   ---------------------------------------------------------------------
   Forms (Discord calls them modals): showing one, reading the answers,
   and the pieces the form builder makes them from. Each piece writes
   the same discord.js builder as its block, and preview() returns it
   the way src/functions/modalPreview/buildModal.js does.
   ===================================================================== */

import { group, input } from "../define.js";

const { event, action, value, component, block } = group({ colour: "#1A8793" });

/* `.setX(value)`, only when the input holds something. */
function optional(ctx, method, key) {
  return ctx.has(key) ? `\n    .${method}(${ctx.input(key)})` : "";
}

const ANSWER_ID = input.text("customId", "Answer ID", {
  default: "",
  placeholder: "answer",
  maxLength: 100,
  help: 'Read the answer later with this ID, in "When a form is submitted".',
});
const REQUIRED = input.boolean("required", "Must be answered", { default: true });
const MIN = (label) => input.number("min", label, { optional: true, min: 0 });
const MAX = (label) => input.number("max", label, { optional: true, min: 1 });
const numberOrNull = (p, key) => (typeof p.raw(key) === "number" ? p.raw(key) : null);

const events = [
  event({
    id: "form_submitted",
    label: "When a form is submitted",
    description: "Runs when someone fills in and sends one of the bot's forms.",
    category: "forms",
    icon: "fa-solid fa-paper-plane",
    keywords: ["modal", "form", "submit", "answers"],
    block: {
      type: "modal_handle_interaction",
      body: { name: "code", check: "default" },
      text: "when a modal is submitted",
      tooltip: "Runs the code when a modal is sub",
    },
    listen: "Discord.Events.InteractionCreate",
    params: ["interaction"],
    provides: ["interaction", "repliable", "modalSubmit"],
    values: [
      {
        key: "id",
        label: "Form ID",
        type: "String",
        code: "interaction.customId",
        block: {
          type: "modal_get_customId",
          text: "custom ID of the modal",
          tooltip: "Gets the custom ID of the modal.",
        },
      },
      {
        key: "user",
        label: "Who sent it",
        type: "user",
        code: "interaction.user",
        block: {
          type: "modal_get_author",
          text: "user that submited the modal",
          tooltip: "Gets the author that submited the modal.",
          restrictions: [
            {
              type: "hasHat",
              blockTypes: ["modal_handle_interaction"],
              message: 'This block must be under a "when a modal is submited" event',
            },
          ],
        },
      },
    ],
    settings: [
      input.text("filterId", "Only for this form ID", {
        default: "",
        allowValues: false,
        help: "Leave it empty to run for every form. Forms get their ID in the form builder.",
        placeholder: "my-form",
      }),
    ],
    prelude: (ctx) =>
      "if (!interaction.isModalSubmit()) return;\n" +
      (ctx.has("filterId")
        ? `if (interaction.customId !== ${ctx.input("filterId")}) return;\n`
        : ""),
  }),
];

const actions = [
  action({
    id: "form_show",
    label: "Show a form",
    description:
      'Opens a pop-up form for the person to fill in. Handle their answers with "When a form is submitted".',
    category: "forms",
    icon: "fa-solid fa-window-maximize",
    keywords: ["modal", "form", "popup", "ask", "questions"],
    block: {
      type: "modal_show",
      text: "show modal: {form}",
      parts: { form: { part: "value", name: "modal", check: "modal" } },
      tooltip: "Shows the modal on the interaction.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["modal"], message: "You must specify the modal to show" },
        {
          type: "hasHat",
          blockTypes: [
            "modal_handle_interaction",
            "slash_received",
            "slash_received_named",
            "contextMenu_received",
            "buttons_event",
            "menus_event",
          ],
          message: "This block must be under an interaction event",
        },
      ],
    },
    requires: ["showModal"],
    answers: "form",
    inputs: [input.modal("form", "Form")],
    special: "modal",
    code: (ctx) => `await interaction.showModal(${ctx.modal("form")});\n`,
  }),
];

const values = [
  value({
    id: "form_answer_text",
    label: "Text typed in a form",
    description: "What someone typed into a text question of the form.",
    category: "forms",
    icon: "fa-solid fa-i-cursor",
    keywords: ["modal", "input", "answer", "text"],
    block: {
      type: "modal_get_input_value",
      text: ["get text from input with custom id: {customId}", "from the modal"],
      parts: { customId: { check: null } },
      inline: true,
      tooltip: "Gets the value of a text input in a modal.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the input to get the value from",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submited" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "String",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) => `(interaction).fields.getTextInputValue(${ctx.input("customId")})`,
  }),
  value({
    id: "form_answer_picked",
    label: "Options picked in a form menu",
    description: "The values someone picked in a menu question.",
    category: "forms",
    icon: "fa-solid fa-list-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getStringSelectValues",
      text: ["selected values of the select menu with custom ID: {customId}", "from the modal"],
      inline: true,
      tooltip:
        "Gets the list of values the user picked in a select menu. Returns an empty list if nothing was picked.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "Array",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) =>
      ((id) => `[...(interaction).fields.getStringSelectValues(${id})]`)(ctx.input("customId")),
  }),
  value({
    id: "form_answer_users",
    label: "Users picked in a form",
    description: "The users someone picked in a user menu question.",
    category: "forms",
    icon: "fa-solid fa-list-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getSelectedUsers",
      text: ["selected users of the user menu with custom ID: {customId}", "from the modal"],
      inline: true,
      tooltip: "Gets the list of users the user picked in a user select menu.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "Array",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) =>
      ((id) => `[...((interaction).fields.getSelectedUsers(${id})?.values() ?? [])]`)(
        ctx.input("customId"),
      ),
  }),
  value({
    id: "form_answer_members",
    label: "Members picked in a form",
    description: "The server members someone picked in a user menu question.",
    category: "forms",
    icon: "fa-solid fa-list-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getSelectedMembers",
      text: ["selected members of the user menu with custom ID: {customId}", "from the modal"],
      inline: true,
      tooltip: "Gets the list of server members the user picked in a user select menu.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "Array",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) =>
      ((id) => `[...((interaction).fields.getSelectedMembers(${id})?.values() ?? [])]`)(
        ctx.input("customId"),
      ),
  }),
  value({
    id: "form_answer_roles",
    label: "Roles picked in a form",
    description: "The roles someone picked in a role menu question.",
    category: "forms",
    icon: "fa-solid fa-list-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getSelectedRoles",
      text: ["selected roles of the role menu with custom ID: {customId}", "from the modal"],
      inline: true,
      tooltip: "Gets the list of roles the user picked in a role select menu.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "Array",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) =>
      ((id) => `[...((interaction).fields.getSelectedRoles(${id})?.values() ?? [])]`)(
        ctx.input("customId"),
      ),
  }),
  value({
    id: "form_answer_channels",
    label: "Channels picked in a form",
    description: "The channels someone picked in a channel menu question.",
    category: "forms",
    icon: "fa-solid fa-list-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getSelectedChannels",
      text: ["selected channels of the channel menu with custom ID: {customId}", "from the modal"],
      inline: true,
      tooltip: "Gets the list of channels the user picked in a channel select menu.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "Array",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) =>
      ((id) => `[...((interaction).fields.getSelectedChannels(${id})?.values() ?? [])]`)(
        ctx.input("customId"),
      ),
  }),
  value({
    id: "form_answer_mentionables",
    label: "Users and roles picked in a form",
    description: "Everything someone picked in a user or role menu question, as one list.",
    category: "forms",
    icon: "fa-solid fa-list-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getSelectedMentionables",
      text: [
        "selected users and roles of the mentionable menu with custom ID: {customId}",
        "from the modal",
      ],
      inline: true,
      tooltip:
        "Gets everything the user picked in a mentionable select menu, as one list of users and roles.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "Array",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) =>
      ((id) =>
        `(await (async () => {\n  const _selected = (interaction).fields.getSelectedMentionables(${id});\n  if (!_selected) return [];\n  return [...(_selected.users?.values() ?? []), ...(_selected.roles?.values() ?? [])];\n})())`)(
        ctx.input("customId"),
      ),
  }),
  value({
    id: "form_answer_files",
    label: "Links to files uploaded in a form",
    description: "Links to the files someone uploaded in a file question.",
    category: "forms",
    icon: "fa-solid fa-list-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getUploadedFileUrls",
      text: [
        "links of the files uploaded to the file upload with custom ID: {customId}",
        "from the modal",
      ],
      inline: true,
      tooltip:
        "Gets the download links of the files the user uploaded. Discord does not send the file itself, only a link to it.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "Array",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) =>
      ((id) =>
        `[...((interaction).fields.getUploadedFiles(${id})?.values() ?? [])].map(f => f.url)`)(
        ctx.input("customId"),
      ),
  }),
  value({
    id: "form_answer_radio",
    label: "Choice picked in a form's radio buttons",
    description: "The value of the choice someone picked in a radio button question.",
    category: "forms",
    icon: "fa-solid fa-list-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getRadioGroup",
      text: ["selected value of the radio buttons with custom ID: {customId}", "from the modal"],
      inline: true,
      tooltip: "Gets the value of the radio button the user picked.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "String",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) =>
      ((id) => `((interaction).fields.getRadioGroup(${id}) ?? '')`)(ctx.input("customId")),
  }),
  value({
    id: "form_answer_checked",
    label: "Boxes checked in a form",
    description: "The values of the boxes someone checked in a checkboxes question.",
    category: "forms",
    icon: "fa-solid fa-list-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getCheckboxGroup",
      text: ["checked values of the checkboxes with custom ID: {customId}", "from the modal"],
      inline: true,
      tooltip: "Gets the list of values the user checked.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "Array",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) =>
      ((id) => `[...(interaction).fields.getCheckboxGroup(${id})]`)(ctx.input("customId")),
  }),
  value({
    id: "form_answer_checkbox",
    label: "Form checkbox is checked?",
    description: "True if someone checked a single checkbox question.",
    category: "forms",
    icon: "fa-solid fa-square-check",
    keywords: ["modal", "form", "answer"],
    block: {
      type: "modalc_getCheckbox",
      text: ["is the checkbox with custom ID checked: {customId}", "from the modal"],
      inline: true,
      tooltip: "Whether the user checked a single checkbox.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["customId"],
          message: "You must specify the custom ID of the component",
        },
        {
          type: "hasHat",
          blockTypes: ["modal_handle_interaction"],
          message: 'This block must be under a "when a modal is submitted" event',
        },
      ],
    },
    requires: ["modalSubmit"],
    output: "Boolean",
    inputs: [
      input.text("customId", "Answer ID", {
        default: "",
        help: "The ID you gave the question in the form.",
      }),
    ],
    code: (ctx) => ((id) => `(interaction).fields.getCheckbox(${id})`)(ctx.input("customId")),
  }),
];

const components = [
  component({
    id: "form_question",
    family: "modal",
    label: "Question",
    description: "A question with a title, an optional hint, and one way to answer it.",
    icon: "fa-solid fa-circle-question",
    block: {
      type: "modalc_label",
      text: [
        "add component with label: {label}",
        "description (optional): {description}",
        "component: {component}",
      ],
      parts: { component: { part: "value", check: "modalComponent" } },
      children: "component",
      inline: false,
      tooltip:
        "Adds a labeled component to a modal. Every interactive modal component (text input, select menu, file upload, radio group, checkbox) must be wrapped in one of these.",
      previous: "Array",
      next: "Array",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["label"],
          message: "You must specify the label for the component",
        },
        {
          type: "notEmpty",
          blockTypes: ["component"],
          message: "You must add a component to the label",
        },
        {
          type: "hasParent",
          blockTypes: ["modal_create"],
          message: 'This block must be inside a "create modal with title" block',
        },
        {
          type: "validator",
          blockTypes: ["label"],
          check: (val) => val.length <= 45,
          message: "Label cannot be greater than 45 characters",
        },
        {
          type: "validator",
          blockTypes: ["description"],
          check: (val) => val.length <= 100,
          message: "Description cannot be greater than 100 characters",
        },
      ],
    },
    placement: ["modal"],
    children: { accepts: "label", label: "Answer with", min: 1, max: 1 },
    fields: [
      input.text("label", "Question", { default: "What's your name?", maxLength: 45 }),
      input.text("description", "Hint (optional)", { default: "", maxLength: 100 }),
    ],
    code: (ctx) => `await (async () => {
  const _label = new Discord.LabelBuilder().setLabel(${ctx.input("label")});${ctx.has("description") ? `\n  _label.setDescription(${ctx.input("description")});` : ""}
  const _component = ${ctx.children()[0] ?? "null"};
  if (_component instanceof Discord.TextInputBuilder) _label.setTextInputComponent(_component);
  else if (_component instanceof Discord.StringSelectMenuBuilder) _label.setStringSelectMenuComponent(_component);
  else if (_component instanceof Discord.UserSelectMenuBuilder) _label.setUserSelectMenuComponent(_component);
  else if (_component instanceof Discord.RoleSelectMenuBuilder) _label.setRoleSelectMenuComponent(_component);
  else if (_component instanceof Discord.MentionableSelectMenuBuilder) _label.setMentionableSelectMenuComponent(_component);
  else if (_component instanceof Discord.ChannelSelectMenuBuilder) _label.setChannelSelectMenuComponent(_component);
  else if (_component instanceof Discord.FileUploadBuilder) _label.setFileUploadComponent(_component);
  else if (_component instanceof Discord.RadioGroupBuilder) _label.setRadioGroupComponent(_component);
  else if (_component instanceof Discord.CheckboxGroupBuilder) _label.setCheckboxGroupComponent(_component);
  else if (_component instanceof Discord.CheckboxBuilder) _label.setCheckboxComponent(_component);
  return _label;
})()`,
    preview: (p) => ({
      type: 18,
      label: p.text("label"),
      description: p.text("description"),
      component: p.children()[0] ?? null,
    }),
  }),
  component({
    id: "form_text",
    family: "modal",
    label: "Text",
    description: "Some text in the form, like instructions. It isn't a question.",
    icon: "fa-solid fa-align-left",
    block: {
      type: "modalc_textDisplay",
      text: "add text to the modal: {content}",
      inline: false,
      tooltip:
        "Shows plain text (markdown supported) inside a modal. Useful for extra context that doesn't fit in a label.",
      previous: "Array",
      next: "Array",
      restrictions: [
        { type: "notEmpty", blockTypes: ["content"], message: "You must specify the text to show" },
        {
          type: "hasParent",
          blockTypes: ["modal_create"],
          message: 'This block must be inside a "create modal with title" block',
        },
      ],
    },
    placement: ["modal"],
    fields: [input.text("content", "Text", { default: "", multiline: true })],
    code: (ctx) => `new Discord.TextDisplayBuilder().setContent(${ctx.input("content")})`,
    preview: (p) => ({ type: 10, content: p.text("content") }),
  }),
  component({
    id: "form_text_input",
    family: "modal",
    label: "Text box",
    description: "A box to type an answer into: one line, or a bigger box for paragraphs.",
    icon: "fa-solid fa-i-cursor",
    block: {
      type: "modalc_textInput",
      text: [
        "text input",
        "custom ID: {customId}",
        "style {style}",
        "placeholder (optional): {placeholder}",
        "prefilled value (optional): {value}",
        "minimum length: {min}",
        "maximum length: {max}",
        "required? {required}",
      ],
      parts: {
        style: {
          options: [
            ["short", "Short"],
            ["paragraph", "Paragraph"],
          ],
        },
      },
      inline: false,
      tooltip: "A single or multi line free-form text field.",
      output: "modalComponent",
      restrictions: [
        { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => val.length <= 100,
          message: "Custom ID cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => /^[a-z0-9_-]+$/.test(val),
          message:
            "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
        },
        {
          type: "surroundParent",
          blockTypes: ["modalc_label"],
          message: 'This block must be plugged into an "add component with label" block',
        },
      ],
    },
    placement: ["label"],
    fields: [
      ANSWER_ID,
      input.dropdown("style", "Size", [
        ["One line", "Short"],
        ["Paragraph", "Paragraph"],
      ]),
      input.text("placeholder", "Placeholder (optional)", { default: "", maxLength: 100 }),
      input.text("value", "Filled in to start with (optional)", { default: "" }),
      MIN("Shortest answer (characters)"),
      MAX("Longest answer (characters)"),
      REQUIRED,
    ],
    code: (ctx) => `new Discord.TextInputBuilder()
    .setCustomId(${ctx.input("customId")})
    .setStyle(Discord.TextInputStyle.${ctx.raw("style") === "Paragraph" ? "Paragraph" : "Short"})${optional(ctx, "setPlaceholder", "placeholder")}${optional(ctx, "setValue", "value")}${optional(ctx, "setMinLength", "min")}${optional(ctx, "setMaxLength", "max")}
    .setRequired(${ctx.input("required")})`,
    preview: (p) => ({
      type: 4,
      style: p.raw("style") === "Paragraph" ? 2 : 1,
      placeholder: p.text("placeholder"),
      value: p.text("value"),
      min_length: numberOrNull(p, "min"),
      max_length: numberOrNull(p, "max"),
      required: p.raw("required") !== false,
    }),
  }),
  component({
    id: "form_menu",
    family: "modal",
    label: "Menu",
    description: "A dropdown of options you write.",
    icon: "fa-solid fa-list",
    block: {
      type: "modalc_stringSelect",
      text: [
        "select menu",
        "custom ID: {customId}",
        "placeholder (optional): {placeholder}",
        "minimum selections: {min}",
        "maximum selections: {max}",
        "required? {required}",
        "options: {options}",
      ],
      parts: { options: { part: "statement", check: "modalSelectOptions" } },
      inline: false,
      tooltip: "A dropdown of options you define yourself.",
      output: "modalComponent",
      restrictions: [
        { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => val.length <= 100,
          message: "Custom ID cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => /^[a-z0-9_-]+$/.test(val),
          message:
            "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
        },
        {
          type: "surroundParent",
          blockTypes: ["modalc_label"],
          message: 'This block must be plugged into an "add component with label" block',
        },
        {
          type: "notEmpty",
          blockTypes: ["options"],
          message: "You must add options that the user can pick",
        },
      ],
    },
    placement: ["label"],
    children: { accepts: "formOptions", label: "Options", min: 1, max: 25 },
    fields: [
      ANSWER_ID,
      input.text("placeholder", "Placeholder (optional)", { default: "" }),
      MIN("Fewest options to pick"),
      MAX("Most options to pick"),
      REQUIRED,
    ],
    code: (ctx) => `new Discord.StringSelectMenuBuilder()
    .setCustomId(${ctx.input("customId")})${optional(ctx, "setPlaceholder", "placeholder")}${optional(ctx, "setMinValues", "min")}${optional(ctx, "setMaxValues", "max")}
    .setRequired(${ctx.input("required")})
    .addOptions([${ctx.children().join(", ")}])`,
    preview: (p) => ({
      type: 3,
      placeholder: p.text("placeholder"),
      min_values: numberOrNull(p, "min"),
      max_values: numberOrNull(p, "max"),
      required: p.raw("required") !== false,
      options: p.children(),
    }),
  }),
  component({
    id: "form_menu_option",
    family: "modal",
    label: "Option",
    description: "One choice in a menu.",
    icon: "fa-solid fa-circle-dot",
    block: {
      type: "modalc_selectOption",
      text: [
        "add an option",
        "label: {label}",
        "description: {description}",
        "emoji: {emoji}",
        "value (not shown to user): {value}",
        "selected by default? {default}",
      ],
      inline: false,
      tooltip: "One option the user can pick inside a select menu.",
      previous: "modalSelectOptions",
      next: "modalSelectOptions",
      restrictions: [
        {
          type: "surroundParent",
          blockTypes: ["modalc_stringSelect"],
          message: 'This block must be inside a "select menu" block',
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
          check: (val) => val.length <= 100,
          message: "Label cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["description"],
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
    placement: ["formOptions"],
    weight: 0,
    fields: [
      input.text("label", "Label", { default: "Option", maxLength: 100 }),
      input.text("description", "Description (optional)", { default: "", maxLength: 100 }),
      input.text("emoji", "Emoji (optional)", { default: "" }),
      input.text("value", "Value", {
        default: "option",
        maxLength: 100,
        help: "What your steps get when this option is picked.",
      }),
      input.boolean("default", "Picked to start with", { default: false }),
    ],
    code: (ctx) =>
      `{ label: ${ctx.input("label")}, ${ctx.has("description") ? `description: ${ctx.input("description")}, ` : ""}${ctx.has("emoji") ? `emoji: ${ctx.input("emoji")}, ` : ""}value: ${ctx.input("value")}, default: ${ctx.input("default")} }`,
    preview: (p) => {
      const emoji = p.emoji("emoji");
      return {
        label: p.text("label"),
        description: p.text("description"),
        value: p.display("value"),
        default: p.raw("default") === true,
        ...(emoji ? { emoji } : {}),
      };
    },
  }),
  component({
    id: "form_choice",
    family: "modal",
    label: "Choice",
    description: "One choice in a set of radio buttons or checkboxes.",
    icon: "fa-regular fa-circle-dot",
    block: {
      type: "modalc_choiceOption",
      text: [
        "add an option",
        "label: {label}",
        "description: {description}",
        "value (not shown to user): {value}",
        "selected by default? {default}",
      ],
      inline: false,
      tooltip: "One option the user can pick inside a radio button or checkbox group.",
      previous: "modalChoiceOptions",
      next: "modalChoiceOptions",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["label"],
          message: "You must specify a label to show to the user",
        },
        { type: "notEmpty", blockTypes: ["value"], message: "You must specify a value" },
        {
          type: "validator",
          blockTypes: ["label"],
          check: (val) => val.length <= 100,
          message: "Label cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["description"],
          check: (val) => val.length <= 100,
          message: "Description cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["value"],
          check: (val) => val.length > 0 && val.length <= 100,
          message: "Value must be between 1 - 100 characters",
        },
      ],
    },
    placement: ["formChoices"],
    weight: 0,
    fields: [
      input.text("label", "Label", { default: "Choice", maxLength: 100 }),
      input.text("description", "Description (optional)", { default: "", maxLength: 100 }),
      input.text("value", "Value", { default: "choice", maxLength: 100 }),
      input.boolean("default", "Picked to start with", { default: false }),
    ],
    code: (ctx) =>
      `{ label: ${ctx.input("label")}, ${ctx.has("description") ? `description: ${ctx.input("description")}, ` : ""}value: ${ctx.input("value")}, default: ${ctx.input("default")} }`,
    preview: (p) => ({
      label: p.text("label"),
      description: p.text("description"),
      value: p.display("value"),
      default: p.raw("default") === true,
    }),
  }),
  ...[
    {
      id: "form_user_menu",
      block: {
        type: "modalc_userSelect",
        tooltip: "A dropdown that lets the user pick users from the server.",
        text: [
          "User select menu",
          "custom ID: {customId}",
          "placeholder (optional): {placeholder}",
          "minimum selections: {min}",
          "maximum selections: {max}",
          "required? {required}",
          "default selected user IDs: {defaultUsers}",
        ],
        restrictions: [
          { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
          {
            type: "validator",
            blockTypes: ["customId"],
            check: (val) => val.length <= 100,
            message: "Custom ID cannot be greater than 100 characters",
          },
          {
            type: "validator",
            blockTypes: ["customId"],
            check: (val) => /^[a-z0-9_-]+$/.test(val),
            message:
              "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
          },
          {
            type: "surroundParent",
            blockTypes: ["modalc_label"],
            message: 'This block must be plugged into an "add component with label" block',
          },
        ],
      },
      builder: "UserSelectMenuBuilder",
      type: 5,
      label: "User menu",
      noun: "people",
      defaults: "defaultUsers",
      setter: "setDefaultUsers",
      icon: "fa-solid fa-user",
    },
    {
      id: "form_role_menu",
      block: {
        type: "modalc_roleSelect",
        tooltip: "A dropdown that lets the user pick roles from the server.",
        text: [
          "Role select menu",
          "custom ID: {customId}",
          "placeholder (optional): {placeholder}",
          "minimum selections: {min}",
          "maximum selections: {max}",
          "required? {required}",
          "default selected role IDs: {defaultRoles}",
        ],
        restrictions: [
          { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
          {
            type: "validator",
            blockTypes: ["customId"],
            check: (val) => val.length <= 100,
            message: "Custom ID cannot be greater than 100 characters",
          },
          {
            type: "validator",
            blockTypes: ["customId"],
            check: (val) => /^[a-z0-9_-]+$/.test(val),
            message:
              "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
          },
          {
            type: "surroundParent",
            blockTypes: ["modalc_label"],
            message: 'This block must be plugged into an "add component with label" block',
          },
        ],
      },
      builder: "RoleSelectMenuBuilder",
      type: 6,
      label: "Role menu",
      noun: "roles",
      defaults: "defaultRoles",
      setter: "setDefaultRoles",
      icon: "fa-solid fa-shield-halved",
    },
    {
      id: "form_mentionable_menu",
      block: {
        type: "modalc_mentionableSelect",
        tooltip: "A dropdown that lets the user pick mentionables from the server.",
        text: [
          "Mentionable select menu",
          "custom ID: {customId}",
          "placeholder (optional): {placeholder}",
          "minimum selections: {min}",
          "maximum selections: {max}",
          "required? {required}",
          "default selected mentionable IDs: {defaultValues}",
        ],
        restrictions: [
          { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
          {
            type: "validator",
            blockTypes: ["customId"],
            check: (val) => val.length <= 100,
            message: "Custom ID cannot be greater than 100 characters",
          },
          {
            type: "validator",
            blockTypes: ["customId"],
            check: (val) => /^[a-z0-9_-]+$/.test(val),
            message:
              "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
          },
          {
            type: "surroundParent",
            blockTypes: ["modalc_label"],
            message: 'This block must be plugged into an "add component with label" block',
          },
        ],
      },
      builder: "MentionableSelectMenuBuilder",
      type: 7,
      label: "User or role menu",
      noun: "people or roles",
      defaults: "defaultValues",
      setter: "setDefaultValues",
      icon: "fa-solid fa-at",
    },
    {
      id: "form_channel_menu",
      block: {
        type: "modalc_channelSelect",
        tooltip: "A dropdown that lets the user pick channels from the server.",
        text: [
          "Channel select menu",
          "custom ID: {customId}",
          "placeholder (optional): {placeholder}",
          "minimum selections: {min}",
          "maximum selections: {max}",
          "required? {required}",
          "accepted channel types: {channelTypes}",
          "default selected channel IDs: {defaultChannels}",
        ],
        parts: { channelTypes: { check: "Array" } },
        restrictions: [
          { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
          {
            type: "validator",
            blockTypes: ["customId"],
            check: (val) => val.length <= 100,
            message: "Custom ID cannot be greater than 100 characters",
          },
          {
            type: "validator",
            blockTypes: ["customId"],
            check: (val) => /^[a-z0-9_-]+$/.test(val),
            message:
              "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
          },
          {
            type: "surroundParent",
            blockTypes: ["modalc_label"],
            message: 'This block must be plugged into an "add component with label" block',
          },
        ],
      },
      builder: "ChannelSelectMenuBuilder",
      type: 8,
      label: "Channel menu",
      noun: "channels",
      defaults: "defaultChannels",
      setter: "setDefaultChannels",
      icon: "fa-solid fa-hashtag",
    },
  ].map((menu) =>
    component({
      id: menu.id,
      block: { inline: false, output: "modalComponent", ...menu.block },
      family: "modal",
      label: menu.label,
      description: `A dropdown of ${menu.noun} from the server.`,
      icon: menu.icon,

      placement: ["label"],
      fields: [
        ANSWER_ID,
        input.text("placeholder", "Placeholder (optional)", { default: "" }),
        MIN("Fewest to pick"),
        MAX("Most to pick"),
        REQUIRED,
        ...(menu.type === 8
          ? [
              input.multi("channelTypes", "Only these kinds of channels", [
                ["Text", "GuildText"],
                ["Voice", "GuildVoice"],
                ["Category", "GuildCategory"],
                ["Announcement", "GuildAnnouncement"],
                ["Stage", "GuildStageVoice"],
                ["Forum", "GuildForum"],
                ["Media", "GuildMedia"],
              ]),
            ]
          : []),
        input.slot(menu.defaults, "Picked to start with (list of IDs)", "Array", {
          optional: true,
        }),
      ],
      code: (ctx) => {
        const types =
          menu.type === 8 && ctx.isValue("channelTypes")
            ? `\n    .setChannelTypes(${ctx.input("channelTypes")})`
            : menu.type === 8 && (ctx.raw("channelTypes") ?? []).length
              ? `\n    .setChannelTypes([${ctx
                  .raw("channelTypes")
                  .map((t) => `Discord.ChannelType.${t}`)
                  .join(", ")}])`
              : "";
        return `new Discord.${menu.builder}()
    .setCustomId(${ctx.input("customId")})${optional(ctx, "setPlaceholder", "placeholder")}${optional(ctx, "setMinValues", "min")}${optional(ctx, "setMaxValues", "max")}
    .setRequired(${ctx.input("required")})${types}${optional(ctx, menu.setter, menu.defaults)}`;
      },
      preview: (p) => ({
        type: menu.type,
        placeholder: p.text("placeholder"),
        min_values: numberOrNull(p, "min"),
        max_values: numberOrNull(p, "max"),
        required: p.raw("required") !== false,
        hasDefaults: p.has(menu.defaults),
      }),
    }),
  ),
  component({
    id: "form_file_upload",
    family: "modal",
    label: "File upload",
    description: "Lets people attach files. Your steps get links to them.",
    icon: "fa-solid fa-upload",
    block: {
      type: "modalc_fileUpload",
      text: [
        "file upload",
        "custom ID: {customId}",
        "minimum files (0 - 10): {min}",
        "maximum files (1 - 10): {max}",
        "required? {required}",
      ],
      inline: false,
      tooltip:
        "Lets the user upload files from their device. Discord only sends you a link to the file, so you have to download it yourself.",
      output: "modalComponent",
      restrictions: [
        { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => val.length <= 100,
          message: "Custom ID cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => /^[a-z0-9_-]+$/.test(val),
          message:
            "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
        },
        {
          type: "surroundParent",
          blockTypes: ["modalc_label"],
          message: 'This block must be plugged into an "add component with label" block',
        },
      ],
    },
    placement: ["label"],
    fields: [ANSWER_ID, MIN("Fewest files (0 to 10)"), MAX("Most files (1 to 10)"), REQUIRED],
    code: (ctx) => `new Discord.FileUploadBuilder()
    .setCustomId(${ctx.input("customId")})${optional(ctx, "setMinValues", "min")}${optional(ctx, "setMaxValues", "max")}
    .setRequired(${ctx.input("required")})`,
    preview: (p) => ({
      type: 19,
      min_values: numberOrNull(p, "min"),
      max_values: numberOrNull(p, "max"),
      required: p.raw("required") !== false,
    }),
  }),
  component({
    id: "form_radio",
    family: "modal",
    label: "Radio buttons",
    description: "A list of choices where only one can be picked.",
    icon: "fa-regular fa-circle-dot",
    block: {
      type: "modalc_radioGroup",
      text: [
        "radio buttons",
        "custom ID: {customId}",
        "required? {required}",
        "options (2 - 10): {options}",
      ],
      parts: { options: { part: "statement", check: "modalChoiceOptions" } },
      inline: false,
      tooltip:
        "A list of options where the user can only pick one. Needs at least 2 and at most 10 options.",
      output: "modalComponent",
      restrictions: [
        { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => val.length <= 100,
          message: "Custom ID cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => /^[a-z0-9_-]+$/.test(val),
          message:
            "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
        },
        {
          type: "surroundParent",
          blockTypes: ["modalc_label"],
          message: 'This block must be plugged into an "add component with label" block',
        },
        {
          type: "notEmpty",
          blockTypes: ["options"],
          message: "You must add options that the user can pick",
        },
      ],
    },
    placement: ["label"],
    children: { accepts: "formChoices", label: "Choices", min: 2, max: 10 },
    fields: [ANSWER_ID, REQUIRED],
    code: (ctx) => `new Discord.RadioGroupBuilder()
    .setCustomId(${ctx.input("customId")})
    .setRequired(${ctx.input("required")})
    .addOptions([${ctx.children().join(", ")}])`,
    preview: (p) => ({ type: 21, required: p.raw("required") !== false, options: p.children() }),
  }),
  component({
    id: "form_checkboxes",
    family: "modal",
    label: "Checkboxes",
    description: "A list of choices where several can be checked.",
    icon: "fa-solid fa-list-check",
    block: {
      type: "modalc_checkboxGroup",
      text: [
        "checkboxes",
        "custom ID: {customId}",
        "minimum checked (0 - 10): {min}",
        "maximum checked (1 - 10): {max}",
        "required? {required}",
        "options (up to 10): {options}",
      ],
      parts: { options: { part: "statement", check: "modalChoiceOptions" } },
      inline: false,
      tooltip: "A list of options where the user can check more than one box.",
      output: "modalComponent",
      restrictions: [
        { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => val.length <= 100,
          message: "Custom ID cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => /^[a-z0-9_-]+$/.test(val),
          message:
            "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
        },
        {
          type: "surroundParent",
          blockTypes: ["modalc_label"],
          message: 'This block must be plugged into an "add component with label" block',
        },
        {
          type: "notEmpty",
          blockTypes: ["options"],
          message: "You must add options that the user can pick",
        },
      ],
    },
    placement: ["label"],
    children: { accepts: "formChoices", label: "Choices", min: 1, max: 10 },
    fields: [ANSWER_ID, MIN("Fewest to check (0 to 10)"), MAX("Most to check (1 to 10)"), REQUIRED],
    code: (ctx) => `new Discord.CheckboxGroupBuilder()
    .setCustomId(${ctx.input("customId")})${optional(ctx, "setMinValues", "min")}${optional(ctx, "setMaxValues", "max")}
    .setRequired(${ctx.input("required")})
    .addOptions([${ctx.children().join(", ")}])`,
    preview: (p) => ({
      type: 22,
      min_values: numberOrNull(p, "min"),
      max_values: numberOrNull(p, "max"),
      required: p.raw("required") !== false,
      options: p.children(),
    }),
  }),
  component({
    id: "form_checkbox",
    family: "modal",
    label: "Single checkbox",
    description: 'One box to check, like "I agree to the rules".',
    icon: "fa-regular fa-square-check",
    block: {
      type: "modalc_checkbox",
      text: ["single checkbox", "custom ID: {customId}", "checked by default? {checked}"],
      inline: false,
      tooltip:
        "A single yes/no checkbox. Single checkboxes can never be required - use the 'checkboxes' block if you need that.",
      output: "modalComponent",
      restrictions: [
        { type: "notEmpty", blockTypes: ["customId"], message: "You must specify a custom ID" },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => val.length <= 100,
          message: "Custom ID cannot be greater than 100 characters",
        },
        {
          type: "validator",
          blockTypes: ["customId"],
          check: (val) => /^[a-z0-9_-]+$/.test(val),
          message:
            "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
        },
        {
          type: "surroundParent",
          blockTypes: ["modalc_label"],
          message: 'This block must be plugged into an "add component with label" block',
        },
      ],
    },
    placement: ["label"],
    fields: [ANSWER_ID, input.boolean("checked", "Checked to start with", { default: false })],
    code: (ctx) => `new Discord.CheckboxBuilder()
    .setCustomId(${ctx.input("customId")})
    .setDefault(${ctx.input("checked")})`,
    preview: (p) => ({ type: 23, default: p.raw("checked") === true, required: false }),
  }),
];

const blocks = [
  block({
    type: "modal_create",
    element: "form_show",
    text: ["create modal with title: {title}", "custom ID: {customId}", "components: {components}"],
    parts: {
      title: { part: "value", check: "String" },
      customId: { part: "value", check: "String" },
      components: { part: "statement", check: "Array" },
    },
    children: "components",
    tooltip: "Creates a modal.",
    output: "modal",
    restrictions: [
      {
        type: "notEmpty",
        blockTypes: ["title"],
        message: "You must specify the title for the modal",
      },
      {
        type: "notEmpty",
        blockTypes: ["customId"],
        message: "You must specify the custom ID for the modal",
      },
      {
        type: "notEmpty",
        blockTypes: ["components"],
        message: "You must specify the components for the modal",
      },
      {
        type: "validator",
        blockTypes: ["title"],
        check: (val) => val.length <= 100,
        message: "Title cannot be greater than 100 characters",
      },
      {
        type: "validator",
        blockTypes: ["customId"],
        check: (val) => val.length <= 100,
        message: "Custom ID cannot be greater than 100 characters",
      },
      {
        type: "validator",
        blockTypes: ["customId"],
        check: (val) => /^[a-z0-9_-]+$/.test(val),
        message: "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
      },
    ],
    code: (ctx) => `new Discord.ModalBuilder()
  .setTitle(${ctx.code("title")})
  .setCustomId(${ctx.code("customId")})
  .addComponents(
${ctx.children().join(",\n")}
  )`,
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
