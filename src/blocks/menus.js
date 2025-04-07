import * as Blockly from "blockly";
import javascript, { Order } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["menus_add"] = {
  init: function () {
    this.appendDummyInput().appendField("Add a menu");
    this.appendValueInput("placeholder")
      .setCheck("String")
      .appendField("placeholder:");
    this.appendValueInput("id").setCheck("String").appendField("ID:");
    this.appendValueInput("disabled")
      .setCheck("Boolean")
      .appendField("disabled?");
    this.appendStatementInput("options")
      .setCheck("default")
      .appendField("options:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("This represents the whole menu");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["menus_addChannelMenu"] = {
  init: function () {
    this.appendDummyInput().appendField("Add a channel menu");
    this.appendValueInput("placeholder")
      .setCheck("String")
      .appendField("placeholder:");
    this.appendValueInput("id").setCheck("String").appendField("ID:");
    this.appendValueInput("disabled")
      .setCheck("Boolean")
      .appendField("disabled?");
    this.appendValueInput("channelTypes")
      .setCheck("Array")
      .appendField("accepted channel types:");
    this.appendValueInput("defaultChannels")
      .setCheck("Array")
      .appendField("default selected channel IDs:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("This represents the whole menu");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["menus_addChannelMenu"] = function (
  block,
  generator
) {
  var value_placeholder = generator.valueToCode(
    block,
    "placeholder",
    javascript.Order.ATOMIC
  );
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_disabled = generator.valueToCode(
    block,
    "disabled",
    javascript.Order.ATOMIC
  );
  var acceptedChannels = generator.valueToCode(
    block,
    "channelTypes",
    Order.ATOMIC
  );
  var defaultChannels = generator.valueToCode(
    block,
    "defaultChannels",
    Order.ATOMIC
  );

  return `new Discord.ChannelSelectMenuBuilder()
  .setPlaceholder(${value_placeholder || "''"})
  .setCustomId(${value_id || "''"})
  .setDisabled(${value_disabled || "false"})
  .setDefaultChannels(${defaultChannels || "[]"})
  .setChannelTypes(${acceptedChannels || "[]"}),\n`;
};

Blockly.Blocks["menus_addRoleMenu"] = {
  init: function () {
    this.appendDummyInput().appendField("Add a role menu");
    this.appendValueInput("placeholder")
      .setCheck("String")
      .appendField("placeholder:");
    this.appendValueInput("id").setCheck("String").appendField("ID:");
    this.appendValueInput("disabled")
      .setCheck("Boolean")
      .appendField("disabled?");
    this.appendValueInput("defaultRoles")
      .setCheck("Array")
      .appendField("default selected role IDs:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("This represents the whole menu");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["menus_addRoleMenu"] = function (
  block,
  generator
) {
  var value_placeholder = generator.valueToCode(
    block,
    "placeholder",
    javascript.Order.ATOMIC
  );
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_disabled = generator.valueToCode(
    block,
    "disabled",
    javascript.Order.ATOMIC
  );
  var defaultChannels = generator.valueToCode(
    block,
    "defaultRoles",
    Order.ATOMIC
  );

  return `new Discord.RoleSelectMenuBuilder()
  .setPlaceholder(${value_placeholder || "''"})
  .setCustomId(${value_id || "''"})
  .setDisabled(${value_disabled || "false"})
  .setDefaultRoles(${defaultChannels || "[]"}),\n`;
};

Blockly.Blocks["menus_addMentionableMenu"] = {
  init: function () {
    this.appendDummyInput().appendField("Add a mentionable menu");
    this.appendValueInput("placeholder")
      .setCheck("String")
      .appendField("placeholder:");
    this.appendValueInput("id").setCheck("String").appendField("ID:");
    this.appendValueInput("disabled")
      .setCheck("Boolean")
      .appendField("disabled?");
    this.appendValueInput("defaultVals")
      .setCheck("Array")
      .appendField("default selected value IDs:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("This represents the whole menu");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["menus_addMentionableMenu"] = function (
  block,
  generator
) {
  var value_placeholder = generator.valueToCode(
    block,
    "placeholder",
    javascript.Order.ATOMIC
  );
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_disabled = generator.valueToCode(
    block,
    "disabled",
    javascript.Order.ATOMIC
  );
  var defaultVals = generator.valueToCode(block, "defaultVals", Order.ATOMIC);

  return `new Discord.MentionableSelectMenuBuilder()
  .setPlaceholder(${value_placeholder || "''"})
  .setCustomId(${value_id || "''"})
  .setDisabled(${value_disabled || "false"})
  .setDefaultValues(${defaultVals || "[]"}),\n`;
};

Blockly.Blocks["menus_addUserMenu"] = {
  init: function () {
    this.appendDummyInput().appendField("Add a user menu");
    this.appendValueInput("placeholder")
      .setCheck("String")
      .appendField("placeholder:");
    this.appendValueInput("id").setCheck("String").appendField("ID:");
    this.appendValueInput("disabled")
      .setCheck("Boolean")
      .appendField("disabled?");
    this.appendValueInput("defaultUsers")
      .setCheck("Array")
      .appendField("default selected user IDs:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("This represents the whole menu");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["menus_addUserMenu"] = function (
  block,
  generator
) {
  var value_placeholder = generator.valueToCode(
    block,
    "placeholder",
    javascript.Order.ATOMIC
  );
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_disabled = generator.valueToCode(
    block,
    "disabled",
    javascript.Order.ATOMIC
  );
  var defaultUsers = generator.valueToCode(block, "defaultUsers", Order.ATOMIC);

  return `new Discord.UserSelectMenuBuilder()
  .setPlaceholder(${value_placeholder || "''"})
  .setCustomId(${value_id || "''"})
  .setDisabled(${value_disabled || "false"})
  .setDefaultUsers(${defaultUsers || "[]"}),\n`;
};

Blockly.Blocks["menus_addoption"] = {
  init: function () {
    this.appendDummyInput().appendField("Add an option");
    this.appendValueInput("label").setCheck("String").appendField("label:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendValueInput("emoji").setCheck("String").appendField("emoji:");
    this.appendValueInput("default")
      .setCheck("Boolean")
      .appendField("selected by default?");
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("value (not shown to user):");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("This represents one clickable option inside the menu");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["menus_event"] = {
  init: function () {
    this.appendDummyInput().appendField("When a menu is clicked");
    this.appendStatementInput("event").setCheck("default");
    this.setInputsInline(false);
    this.setColour("#26A483");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["menus_id"] = {
  init: function () {
    this.appendDummyInput().appendField("ID of the clicked menu");
    this.setColour("#26A483");
    this.setOutput(true, "String");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["menus_value"] = {
  init: function () {
    this.appendDummyInput().appendField("the value of the selected option");
    this.setColour("#26A483");
    this.setOutput(true, "String");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["menus_member"] = {
  init: function () {
    this.appendDummyInput().appendField("member who clicked the menu");
    this.setColour("#26A483");
    this.setOutput(true, "member");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["menus_user"] = {
  init: function () {
    this.appendDummyInput().appendField("user who clicked the menu");
    this.setColour("#26A483");
    this.setOutput(true, "user");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["menus_channel"] = {
  init: function () {
    this.appendDummyInput().appendField("channel of the menu");
    this.setColour("#26A483");
    this.setOutput(true, "channel");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["menus_server"] = {
  init: function () {
    this.appendDummyInput().appendField("server of the menu");
    this.setColour("#26A483");
    this.setOutput(true, "server");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["menus_reply"] = {
  init: function () {
    this.appendDummyInput().appendField("Reply to the click");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds").setCheck("String").appendField("embed(s):");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setInputsInline(false);
  },
};

Blockly.Blocks["menus_edit"] = {
  init: function () {
    this.appendDummyInput().appendField("Edit the reply");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds").setCheck("String").appendField("embed(s):");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setInputsInline(false);
  },
};

Blockly.Blocks["menus_update"] = {
  init: function () {
    this.appendDummyInput().appendField("Update the original message");
    this.appendValueInput("content").setCheck("String").appendField("content:");
    this.appendValueInput("embeds").setCheck("String").appendField("embed(s):");
    this.appendStatementInput("rows").setCheck("rows").appendField("rows:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setInputsInline(false);
  },
};

Blockly.Blocks["menus_del"] = {
  init: function () {
    this.appendDummyInput().appendField("Delete the reply by the bot");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("26A483");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setInputsInline(false);
  },
};

javascript.javascriptGenerator.forBlock["menus_del"] = function (
  block,
  generator
) {
  var code = `interaction.deleteReply();`;
  return code;
};

javascript.javascriptGenerator.forBlock["menus_edit"] = function (
  block,
  generator
) {
  var content = generator.valueToCode(
    block,
    "content",
    javascript.Order.ATOMIC
  );
  var embeds = generator.valueToCode(block, "embeds", javascript.Order.ATOMIC);

  var code = `interaction.editReply({
  content: ${content || "''"},
  embeds: [${embeds.replaceAll("'", "")}]
});`;
  return code;
};

javascript.javascriptGenerator.forBlock["menus_update"] = function (
  block,
  generator
) {
  var content = generator.valueToCode(
    block,
    "content",
    javascript.Order.ATOMIC
  );
  var embeds = generator.valueToCode(block, "embeds", javascript.Order.ATOMIC);
  var rows = generator.statementToCode(block, "rows");

  var code = `interaction.update({
  content: ${content || "''"},
  embeds: [${embeds.replaceAll("'", "")}],
  components: [
  ${rows}]
});`;
  return code;
};

javascript.javascriptGenerator.forBlock["menus_reply"] = function (
  block,
  generator
) {
  var content = generator.valueToCode(
    block,
    "content",
    javascript.Order.ATOMIC
  );
  var embeds = generator.valueToCode(block, "embeds", javascript.Order.ATOMIC);

  var code = `interaction.reply({
  content: ${content || "''"},
  embeds: [${embeds.replaceAll("'", "")}]
});`;
  return code;
};

javascript.javascriptGenerator.forBlock["menus_server"] = function (
  block,
  generator
) {
  var code = `interaction.guild`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["menus_channel"] = function (
  block,
  generator
) {
  var code = `interaction.channel`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["menus_user"] = function (
  block,
  generator
) {
  var code = `interaction.member.user`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["menus_member"] = function (
  block,
  generator
) {
  var code = `interaction.member`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["menus_id"] = function (
  block,
  generator
) {
  var code = `interaction.customId`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["menus_value"] = function (
  block,
  generator
) {
  var code = `interaction.values[0]`;
  return [code, javascript.Order.NONE];
};

javascript.javascriptGenerator.forBlock["menus_event"] = function (
  block,
  generator
) {
  var code_statement = generator.statementToCode(block, "event");

  var code = `client.on("interactionCreate", async (interaction) => {
  if(!interaction.isStringSelectMenu()) return;
  ${code_statement}});\n`;
  return code;
};

javascript.javascriptGenerator.forBlock["menus_add"] = function (
  block,
  generator
) {
  var value_placeholder = generator.valueToCode(
    block,
    "placeholder",
    javascript.Order.ATOMIC
  );
  var value_id = generator.valueToCode(block, "id", javascript.Order.ATOMIC);
  var value_disabled = generator.valueToCode(
    block,
    "disabled",
    javascript.Order.ATOMIC
  );
  var statements_options = generator.statementToCode(block, "options");

  return `new Discord.StringSelectMenuBuilder()
  .setPlaceholder(${value_placeholder || "''"})
  .setCustomId(${value_id || "''"})
  .setDisabled(${value_disabled || "false"})
  .addOptions([\n${statements_options}]),\n`;
};

javascript.javascriptGenerator.forBlock["menus_addoption"] = function (
  block,
  generator
) {
  var label = generator.valueToCode(block, "label", javascript.Order.ATOMIC);
  var dsc = generator.valueToCode(block, "dsc", javascript.Order.ATOMIC);
  var emoji = generator.valueToCode(block, "emoji", javascript.Order.ATOMIC);
  var selected = generator.valueToCode(
    block,
    "default",
    javascript.Order.ATOMIC
  );
  var value = generator.valueToCode(block, "value", javascript.Order.ATOMIC);

  var code = `{
    label: ${label || "''"},
    description: ${dsc || "''"},
    emoji: ${emoji || "''"},
    default: ${selected || "false"},
    value: ${value || "''"}
  },\n`;
  return code;
};

createRestrictions(
  [
    "menus_id",
    "menus_value",
    "menus_member",
    "menus_user",
    "menus_channel",
    "menus_server",
    "menus_del",
  ],
  [
    {
      type: "hasHat",
      blockTypes: ["menus_event"],
      message: 'This block must be in a "When a menu is clicked" event',
    },
  ]
);

createRestrictions(
  ["menus_reply", "menus_edit", "menus_update"],
  [
    {
      type: "hasHat",
      blockTypes: ["menus_event"],
      message: 'This block must be in a "When a menu is clicked" event',
    },
    {
      type: "notEmpty",
      blockTypes: ["content", "embeds"],
      message: "You must specify the content and/or embed(s)",
    },
  ]
);

createRestrictions(
  ["menus_add"],
  [
    {
      type: "surroundParent",
      blockTypes: ["misc_addrow"],
      message: 'This block must be under an "add row" block',
    },
    {
      type: "notEmpty",
      blockTypes: ["options"],
      message: "You must add options that the user can click",
    },
    {
      type: "notEmpty",
      blockTypes: ["id"],
      message: "You must specify an ID for the menu",
    },
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
      message:
        "The ID only have lowercase letters, numbers, hyphens, and/or underscores",
    },
  ]
);

createRestrictions(
  ["menus_addoption"],
  [
    {
      type: "surroundParent",
      blockTypes: ["menus_add"],
      message: 'This block must be under a "add menu" block',
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
  ]
);
