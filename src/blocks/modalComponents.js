import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";
import { isValidEmoji } from "../functions/fixers";

/**
 * Modal components (Discord "Components in Modals").
 *
 * Modals used to only accept text inputs wrapped in action rows. Discord now
 * accepts up to 5 top level components per modal, each being either a Label
 * (which wraps exactly one interactive component) or a Text Display.
 *
 * Interactive components available inside a Label:
 *   text input, string select, user/role/mentionable/channel select,
 *   file upload, radio group, checkbox group, checkbox
 */

const COLOUR = "#1A8793";

// Whether the user actually typed something into a text input
function notEmptyText(value) {
  if (value === undefined || value === null) return false;
  const trimmed = `${value}`.trim();
  return Boolean(trimmed) && trimmed !== "''" && trimmed !== '""';
}

// Returns `.setX(value)` only when the user actually plugged something in
function optional(method, value) {
  if (!notEmptyText(value)) return "";
  return `\n    .${method}(${`${value}`.trim()})`;
}

// Turns a statement stack of `{...},` entries into an array literal
function optionsArray(options) {
  if (!options || !options.trim()) return "[]";
  return `[${options
    .split(",\n")
    .map((o) => o.trim().replace(/,$/, ""))
    .filter(Boolean)
    .join(", ")}]`;
}

/* -------------------------------------------------------------------------- */
/*                            Top level: Label                                */
/* -------------------------------------------------------------------------- */

Blockly.Blocks["modalc_label"] = {
  init: function () {
    this.appendValueInput("label")
      .setCheck("String")
      .appendField("add component with label:");
    this.appendValueInput("description")
      .setCheck("String")
      .appendField("description (optional):");
    this.appendValueInput("component")
      .setCheck("modalComponent")
      .appendField("component:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(COLOUR);
    this.setTooltip(
      "Adds a labelled component to a modal. Every interactive modal component (text input, select menu, file upload, radio group, checkbox) must be wrapped in one of these.",
    );
  },
};

javascriptGenerator.forBlock["modalc_label"] = function (block, generator) {
  const label = generator.valueToCode(block, "label", Order.ATOMIC);
  const description = generator.valueToCode(block, "description", Order.ATOMIC);
  const component = generator.valueToCode(block, "component", Order.ATOMIC);

  return `(() => {
  const _label = new Discord.LabelBuilder().setLabel(${label || "''"});${
    notEmptyText(description)
      ? `\n  _label.setDescription(${description});`
      : ""
  }
  const _component = ${component || "null"};
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
})(),\n`;
};

/* -------------------------------------------------------------------------- */
/*                          Top level: Text display                           */
/* -------------------------------------------------------------------------- */

Blockly.Blocks["modalc_textDisplay"] = {
  init: function () {
    this.appendValueInput("content")
      .setCheck("String")
      .appendField("add text to the modal:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(COLOUR);
    this.setTooltip(
      "Shows plain text (markdown supported) inside a modal. Useful for extra context that doesn't fit in a label.",
    );
  },
};

javascriptGenerator.forBlock["modalc_textDisplay"] = function (
  block,
  generator,
) {
  const content = generator.valueToCode(block, "content", Order.ATOMIC);
  return `new Discord.TextDisplayBuilder().setContent(${content || "''"}),\n`;
};

/* -------------------------------------------------------------------------- */
/*                              Text input                                    */
/* -------------------------------------------------------------------------- */

Blockly.Blocks["modalc_textInput"] = {
  init: function () {
    this.appendDummyInput().appendField("text input");
    this.appendValueInput("customId")
      .setCheck("String")
      .appendField("custom ID:");
    this.appendDummyInput()
      .appendField("style")
      .appendField(
        new Blockly.FieldDropdown([
          ["short", "Short"],
          ["paragraph", "Paragraph"],
        ]),
        "style",
      );
    this.appendValueInput("placeholder")
      .setCheck("String")
      .appendField("placeholder (optional):");
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("prefilled value (optional):");
    this.appendValueInput("min")
      .setCheck("Number")
      .appendField("minimum length:");
    this.appendValueInput("max")
      .setCheck("Number")
      .appendField("maximum length:");
    this.appendValueInput("required")
      .setCheck("Boolean")
      .appendField("required?");
    this.setInputsInline(false);
    this.setOutput(true, "modalComponent");
    this.setColour(COLOUR);
    this.setTooltip("A single or multi line free-form text field.");
  },
};

javascriptGenerator.forBlock["modalc_textInput"] = function (block, generator) {
  const customId = generator.valueToCode(block, "customId", Order.ATOMIC);
  const placeholder = generator.valueToCode(block, "placeholder", Order.ATOMIC);
  const value = generator.valueToCode(block, "value", Order.ATOMIC);
  const min = generator.valueToCode(block, "min", Order.ATOMIC);
  const max = generator.valueToCode(block, "max", Order.ATOMIC);
  const required = generator.valueToCode(block, "required", Order.ATOMIC);
  const style = block.getFieldValue("style");

  const code = `new Discord.TextInputBuilder()
    .setCustomId(${customId || "''"})
    .setStyle(Discord.TextInputStyle.${style})${optional("setPlaceholder", placeholder)}${optional("setValue", value)}${optional("setMinLength", min)}${optional("setMaxLength", max)}${optional("setRequired", required)}`;
  return [code, Order.NEW];
};

/* -------------------------------------------------------------------------- */
/*                              String select                                 */
/* -------------------------------------------------------------------------- */

Blockly.Blocks["modalc_stringSelect"] = {
  init: function () {
    this.appendDummyInput().appendField("select menu");
    this.appendValueInput("customId")
      .setCheck("String")
      .appendField("custom ID:");
    this.appendValueInput("placeholder")
      .setCheck("String")
      .appendField("placeholder (optional):");
    this.appendValueInput("min")
      .setCheck("Number")
      .appendField("minimum selections:");
    this.appendValueInput("max")
      .setCheck("Number")
      .appendField("maximum selections:");
    this.appendValueInput("required")
      .setCheck("Boolean")
      .appendField("required?");
    this.appendStatementInput("options")
      .setCheck("modalSelectOptions")
      .appendField("options:");
    this.setInputsInline(false);
    this.setOutput(true, "modalComponent");
    this.setColour(COLOUR);
    this.setTooltip("A dropdown of options you define yourself.");
  },
};

javascriptGenerator.forBlock["modalc_stringSelect"] = function (
  block,
  generator,
) {
  const customId = generator.valueToCode(block, "customId", Order.ATOMIC);
  const placeholder = generator.valueToCode(block, "placeholder", Order.ATOMIC);
  const min = generator.valueToCode(block, "min", Order.ATOMIC);
  const max = generator.valueToCode(block, "max", Order.ATOMIC);
  const required = generator.valueToCode(block, "required", Order.ATOMIC);
  const options = generator.statementToCode(block, "options");

  const code = `new Discord.StringSelectMenuBuilder()
    .setCustomId(${customId || "''"})${optional("setPlaceholder", placeholder)}${optional("setMinValues", min)}${optional("setMaxValues", max)}${optional("setRequired", required)}
    .addOptions(${optionsArray(options)})`;
  return [code, Order.NEW];
};

/* -------------------------------------------------------------------------- */
/*                    User / Role / Mentionable / Channel                     */
/* -------------------------------------------------------------------------- */

function entitySelect(type, { name, builder, defaultsInput, defaultsMethod }) {
  Blockly.Blocks[type] = {
    init: function () {
      this.appendDummyInput().appendField(`${name} select menu`);
      this.appendValueInput("customId")
        .setCheck("String")
        .appendField("custom ID:");
      this.appendValueInput("placeholder")
        .setCheck("String")
        .appendField("placeholder (optional):");
      this.appendValueInput("min")
        .setCheck("Number")
        .appendField("minimum selections:");
      this.appendValueInput("max")
        .setCheck("Number")
        .appendField("maximum selections:");
      this.appendValueInput("required")
        .setCheck("Boolean")
        .appendField("required?");
      if (type === "modalc_channelSelect") {
        this.appendValueInput("channelTypes")
          .setCheck("Array")
          .appendField("accepted channel types:");
      }
      if (defaultsInput) {
        this.appendValueInput(defaultsInput)
          .setCheck("Array")
          .appendField(`default selected ${name.toLowerCase()} IDs:`);
      }
      this.setInputsInline(false);
      this.setOutput(true, "modalComponent");
      this.setColour(COLOUR);
      this.setTooltip(
        `A dropdown that lets the user pick ${name.toLowerCase()}s from the server.`,
      );
    },
  };

  javascriptGenerator.forBlock[type] = function (block, generator) {
    const customId = generator.valueToCode(block, "customId", Order.ATOMIC);
    const placeholder = generator.valueToCode(
      block,
      "placeholder",
      Order.ATOMIC,
    );
    const min = generator.valueToCode(block, "min", Order.ATOMIC);
    const max = generator.valueToCode(block, "max", Order.ATOMIC);
    const required = generator.valueToCode(block, "required", Order.ATOMIC);
    const channelTypes =
      type === "modalc_channelSelect"
        ? generator.valueToCode(block, "channelTypes", Order.ATOMIC)
        : "";
    const defaults = defaultsInput
      ? generator.valueToCode(block, defaultsInput, Order.ATOMIC)
      : "";

    const code = `new Discord.${builder}()
    .setCustomId(${customId || "''"})${optional("setPlaceholder", placeholder)}${optional("setMinValues", min)}${optional("setMaxValues", max)}${optional("setRequired", required)}${optional("setChannelTypes", channelTypes)}${defaultsMethod ? optional(defaultsMethod, defaults) : ""}`;
    return [code, Order.NEW];
  };
}

entitySelect("modalc_userSelect", {
  name: "User",
  builder: "UserSelectMenuBuilder",
  defaultsInput: "defaultUsers",
  defaultsMethod: "setDefaultUsers",
});

entitySelect("modalc_roleSelect", {
  name: "Role",
  builder: "RoleSelectMenuBuilder",
  defaultsInput: "defaultRoles",
  defaultsMethod: "setDefaultRoles",
});

entitySelect("modalc_mentionableSelect", {
  name: "Mentionable",
  builder: "MentionableSelectMenuBuilder",
  defaultsInput: "defaultValues",
  defaultsMethod: "setDefaultValues",
});

entitySelect("modalc_channelSelect", {
  name: "Channel",
  builder: "ChannelSelectMenuBuilder",
  defaultsInput: "defaultChannels",
  defaultsMethod: "setDefaultChannels",
});

/* -------------------------------------------------------------------------- */
/*                               File upload                                  */
/* -------------------------------------------------------------------------- */

Blockly.Blocks["modalc_fileUpload"] = {
  init: function () {
    this.appendDummyInput().appendField("file upload");
    this.appendValueInput("customId")
      .setCheck("String")
      .appendField("custom ID:");
    this.appendValueInput("min")
      .setCheck("Number")
      .appendField("minimum files (0 - 10):");
    this.appendValueInput("max")
      .setCheck("Number")
      .appendField("maximum files (1 - 10):");
    this.appendValueInput("required")
      .setCheck("Boolean")
      .appendField("required?");
    this.setInputsInline(false);
    this.setOutput(true, "modalComponent");
    this.setColour(COLOUR);
    this.setTooltip(
      "Lets the user upload files from their device. Discord only sends you a link to the file, so you have to download it yourself.",
    );
  },
};

javascriptGenerator.forBlock["modalc_fileUpload"] = function (
  block,
  generator,
) {
  const customId = generator.valueToCode(block, "customId", Order.ATOMIC);
  const min = generator.valueToCode(block, "min", Order.ATOMIC);
  const max = generator.valueToCode(block, "max", Order.ATOMIC);
  const required = generator.valueToCode(block, "required", Order.ATOMIC);

  const code = `new Discord.FileUploadBuilder()
    .setCustomId(${customId || "''"})${optional("setMinValues", min)}${optional("setMaxValues", max)}${optional("setRequired", required)}`;
  return [code, Order.NEW];
};

/* -------------------------------------------------------------------------- */
/*                          Radio group / Checkboxes                          */
/* -------------------------------------------------------------------------- */

Blockly.Blocks["modalc_radioGroup"] = {
  init: function () {
    this.appendDummyInput().appendField("radio buttons");
    this.appendValueInput("customId")
      .setCheck("String")
      .appendField("custom ID:");
    this.appendValueInput("required")
      .setCheck("Boolean")
      .appendField("required?");
    this.appendStatementInput("options")
      .setCheck("modalChoiceOptions")
      .appendField("options (2 - 10):");
    this.setInputsInline(false);
    this.setOutput(true, "modalComponent");
    this.setColour(COLOUR);
    this.setTooltip(
      "A list of options where the user can only pick one. Needs at least 2 and at most 10 options.",
    );
  },
};

javascriptGenerator.forBlock["modalc_radioGroup"] = function (
  block,
  generator,
) {
  const customId = generator.valueToCode(block, "customId", Order.ATOMIC);
  const required = generator.valueToCode(block, "required", Order.ATOMIC);
  const options = generator.statementToCode(block, "options");

  const code = `new Discord.RadioGroupBuilder()
    .setCustomId(${customId || "''"})${optional("setRequired", required)}
    .addOptions(${optionsArray(options)})`;
  return [code, Order.NEW];
};

Blockly.Blocks["modalc_checkboxGroup"] = {
  init: function () {
    this.appendDummyInput().appendField("checkboxes");
    this.appendValueInput("customId")
      .setCheck("String")
      .appendField("custom ID:");
    this.appendValueInput("min")
      .setCheck("Number")
      .appendField("minimum checked (0 - 10):");
    this.appendValueInput("max")
      .setCheck("Number")
      .appendField("maximum checked (1 - 10):");
    this.appendValueInput("required")
      .setCheck("Boolean")
      .appendField("required?");
    this.appendStatementInput("options")
      .setCheck("modalChoiceOptions")
      .appendField("options (up to 10):");
    this.setInputsInline(false);
    this.setOutput(true, "modalComponent");
    this.setColour(COLOUR);
    this.setTooltip(
      "A list of options where the user can check more than one box.",
    );
  },
};

javascriptGenerator.forBlock["modalc_checkboxGroup"] = function (
  block,
  generator,
) {
  const customId = generator.valueToCode(block, "customId", Order.ATOMIC);
  const min = generator.valueToCode(block, "min", Order.ATOMIC);
  const max = generator.valueToCode(block, "max", Order.ATOMIC);
  const required = generator.valueToCode(block, "required", Order.ATOMIC);
  const options = generator.statementToCode(block, "options");

  const code = `new Discord.CheckboxGroupBuilder()
    .setCustomId(${customId || "''"})${optional("setMinValues", min)}${optional("setMaxValues", max)}${optional("setRequired", required)}
    .addOptions(${optionsArray(options)})`;
  return [code, Order.NEW];
};

Blockly.Blocks["modalc_checkbox"] = {
  init: function () {
    this.appendDummyInput().appendField("single checkbox");
    this.appendValueInput("customId")
      .setCheck("String")
      .appendField("custom ID:");
    this.appendValueInput("checked")
      .setCheck("Boolean")
      .appendField("checked by default?");
    this.setInputsInline(false);
    this.setOutput(true, "modalComponent");
    this.setColour(COLOUR);
    this.setTooltip(
      "A single yes/no checkbox. Single checkboxes can never be required - use the 'checkboxes' block if you need that.",
    );
  },
};

javascriptGenerator.forBlock["modalc_checkbox"] = function (block, generator) {
  const customId = generator.valueToCode(block, "customId", Order.ATOMIC);
  const checked = generator.valueToCode(block, "checked", Order.ATOMIC);

  const code = `new Discord.CheckboxBuilder()
    .setCustomId(${customId || "''"})${optional("setDefault", checked)}`;
  return [code, Order.NEW];
};

/* -------------------------------------------------------------------------- */
/*                                  Options                                   */
/* -------------------------------------------------------------------------- */

Blockly.Blocks["modalc_selectOption"] = {
  init: function () {
    this.appendDummyInput().appendField("add an option");
    this.appendValueInput("label").setCheck("String").appendField("label:");
    this.appendValueInput("description")
      .setCheck("String")
      .appendField("description:");
    this.appendValueInput("emoji").setCheck("String").appendField("emoji:");
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("value (not shown to user):");
    this.appendValueInput("default")
      .setCheck("Boolean")
      .appendField("selected by default?");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "modalSelectOptions");
    this.setNextStatement(true, "modalSelectOptions");
    this.setColour(COLOUR);
    this.setTooltip("One option the user can pick inside a select menu.");
  },
};

javascriptGenerator.forBlock["modalc_selectOption"] = function (
  block,
  generator,
) {
  const label = generator.valueToCode(block, "label", Order.ATOMIC);
  const description = generator.valueToCode(block, "description", Order.ATOMIC);
  const emoji = generator.valueToCode(block, "emoji", Order.ATOMIC);
  const value = generator.valueToCode(block, "value", Order.ATOMIC);
  const selected = generator.valueToCode(block, "default", Order.ATOMIC);

  return `{
    label: ${label || "''"},${notEmptyText(description) ? `\n    description: ${description},` : ""}
    ${isValidEmoji(emoji) ? `emoji: ${emoji},` : ""}
    value: ${value || "''"},
    default: ${selected || "false"}
  },\n`;
};

Blockly.Blocks["modalc_choiceOption"] = {
  init: function () {
    this.appendDummyInput().appendField("add an option");
    this.appendValueInput("label").setCheck("String").appendField("label:");
    this.appendValueInput("description")
      .setCheck("String")
      .appendField("description:");
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("value (not shown to user):");
    this.appendValueInput("default")
      .setCheck("Boolean")
      .appendField("selected by default?");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "modalChoiceOptions");
    this.setNextStatement(true, "modalChoiceOptions");
    this.setColour(COLOUR);
    this.setTooltip(
      "One option the user can pick inside a radio button or checkbox group.",
    );
  },
};

javascriptGenerator.forBlock["modalc_choiceOption"] = function (
  block,
  generator,
) {
  const label = generator.valueToCode(block, "label", Order.ATOMIC);
  const description = generator.valueToCode(block, "description", Order.ATOMIC);
  const value = generator.valueToCode(block, "value", Order.ATOMIC);
  const selected = generator.valueToCode(block, "default", Order.ATOMIC);

  return `{
    label: ${label || "''"},${notEmptyText(description) ? `\n    description: ${description},` : ""}
    value: ${value || "''"},
    default: ${selected || "false"}
  },\n`;
};

/* -------------------------------------------------------------------------- */
/*                        Reading submitted values                            */
/* -------------------------------------------------------------------------- */

const getters = [
  {
    type: "modalc_getStringSelectValues",
    text: "selected values of the select menu with custom ID:",
    output: "Array",
    code: (id) => `[...(interaction).fields.getStringSelectValues(${id})]`,
    tooltip:
      "Gets the list of values the user picked in a select menu. Returns an empty list if nothing was picked.",
  },
  {
    type: "modalc_getSelectedUsers",
    text: "selected users of the user menu with custom ID:",
    output: "Array",
    code: (id) =>
      `[...((interaction).fields.getSelectedUsers(${id})?.values() ?? [])]`,
    tooltip: "Gets the list of users the user picked in a user select menu.",
  },
  {
    type: "modalc_getSelectedMembers",
    text: "selected members of the user menu with custom ID:",
    output: "Array",
    code: (id) =>
      `[...((interaction).fields.getSelectedMembers(${id})?.values() ?? [])]`,
    tooltip:
      "Gets the list of server members the user picked in a user select menu.",
  },
  {
    type: "modalc_getSelectedRoles",
    text: "selected roles of the role menu with custom ID:",
    output: "Array",
    code: (id) =>
      `[...((interaction).fields.getSelectedRoles(${id})?.values() ?? [])]`,
    tooltip: "Gets the list of roles the user picked in a role select menu.",
  },
  {
    type: "modalc_getSelectedChannels",
    text: "selected channels of the channel menu with custom ID:",
    output: "Array",
    code: (id) =>
      `[...((interaction).fields.getSelectedChannels(${id})?.values() ?? [])]`,
    tooltip:
      "Gets the list of channels the user picked in a channel select menu.",
  },
  {
    type: "modalc_getSelectedMentionables",
    text: "selected users and roles of the mentionable menu with custom ID:",
    output: "Array",
    code: (id) => `(() => {
  const _selected = (interaction).fields.getSelectedMentionables(${id});
  if (!_selected) return [];
  return [
    ...(_selected.users?.values() ?? []),
    ...(_selected.roles?.values() ?? [])
  ];
})()`,
    tooltip:
      "Gets everything the user picked in a mentionable select menu, as one list of users and roles.",
  },
  {
    type: "modalc_getUploadedFileUrls",
    text: "links of the files uploaded to the file upload with custom ID:",
    output: "Array",
    code: (id) =>
      `[...((interaction).fields.getUploadedFiles(${id})?.values() ?? [])].map(f => f.url)`,
    tooltip:
      "Gets the download links of the files the user uploaded. Discord does not send the file itself, only a link to it.",
  },
  {
    type: "modalc_getRadioGroup",
    text: "selected value of the radio buttons with custom ID:",
    output: "String",
    code: (id) => `((interaction).fields.getRadioGroup(${id}) ?? '')`,
    tooltip: "Gets the value of the radio button the user picked.",
  },
  {
    type: "modalc_getCheckboxGroup",
    text: "checked values of the checkboxes with custom ID:",
    output: "Array",
    code: (id) => `[...(interaction).fields.getCheckboxGroup(${id})]`,
    tooltip: "Gets the list of values the user checked.",
  },
  {
    type: "modalc_getCheckbox",
    text: "is the checkbox with custom ID checked:",
    output: "Boolean",
    code: (id) => `(interaction).fields.getCheckbox(${id})`,
    tooltip: "Checks whether the user ticked a single checkbox.",
  },
];

getters.forEach(({ type, text, output, code, tooltip }) => {
  Blockly.Blocks[type] = {
    init: function () {
      this.appendValueInput("customId").setCheck("String").appendField(text);
      this.appendDummyInput().appendField("from the modal");
      this.setInputsInline(true);
      this.setOutput(true, output);
      this.setColour(COLOUR);
      this.setTooltip(tooltip);
    },
  };

  javascriptGenerator.forBlock[type] = function (block, generator) {
    const customId = generator.valueToCode(block, "customId", Order.ATOMIC);
    return [code(customId || "''"), Order.ATOMIC];
  };
});

/* -------------------------------------------------------------------------- */
/*                               Restrictions                                 */
/* -------------------------------------------------------------------------- */

const customIdRestrictions = [
  {
    type: "notEmpty",
    blockTypes: ["customId"],
    message: "You must specify a custom ID",
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
    message:
      "The custom ID only have lowercase letters, numbers, hyphens, and/or underscores",
  },
];

createRestrictions(
  [
    "modalc_textInput",
    "modalc_stringSelect",
    "modalc_userSelect",
    "modalc_roleSelect",
    "modalc_mentionableSelect",
    "modalc_channelSelect",
    "modalc_fileUpload",
    "modalc_radioGroup",
    "modalc_checkboxGroup",
    "modalc_checkbox",
  ],
  [
    ...customIdRestrictions,
    {
      type: "surroundParent",
      blockTypes: ["modalc_label"],
      message:
        'This block must be plugged into an "add component with label" block',
    },
  ],
);

createRestrictions(
  ["modalc_label"],
  [
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
);

createRestrictions(
  ["modalc_textDisplay"],
  [
    {
      type: "notEmpty",
      blockTypes: ["content"],
      message: "You must specify the text to show",
    },
    {
      type: "hasParent",
      blockTypes: ["modal_create"],
      message: 'This block must be inside a "create modal with title" block',
    },
  ],
);

createRestrictions(
  ["modalc_stringSelect"],
  [
    {
      type: "notEmpty",
      blockTypes: ["options"],
      message: "You must add options that the user can pick",
    },
  ],
);

createRestrictions(
  ["modalc_radioGroup", "modalc_checkboxGroup"],
  [
    {
      type: "notEmpty",
      blockTypes: ["options"],
      message: "You must add options that the user can pick",
    },
  ],
);

createRestrictions(
  ["modalc_selectOption"],
  [
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
    {
      type: "notEmpty",
      blockTypes: ["value"],
      message: "You must specify a value",
    },
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
);

createRestrictions(
  ["modalc_choiceOption"],
  [
    {
      type: "notEmpty",
      blockTypes: ["label"],
      message: "You must specify a label to show to the user",
    },
    {
      type: "notEmpty",
      blockTypes: ["value"],
      message: "You must specify a value",
    },
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
);

createRestrictions(
  getters.map((g) => g.type),
  [
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
);
