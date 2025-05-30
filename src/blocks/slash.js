import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";
import { createMutatorBlock } from "../functions/createMutator.ts";

Blockly.Blocks["slash_received"] = {
  init: function () {
    this.appendDummyInput().appendField("When a slash command is received");
    this.appendStatementInput("event").setCheck("default");
    this.setInputsInline(false);
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createMutatorBlock({
  id: "slash_create_mutator",
  optionsBlockId: "slash_create_mutator_options",
  colour: "#3366CC",
  inputs: [
    { type: "dummy", label: "Add slash command" },
    { type: "value", name: "name", check: "String", label: "name:" },
    { type: "value", name: "dsc", check: "String", label: "description:" },
  ],
  mutatorFields: [
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
  previousStatement: ["slashCreate", "contextMenuCreate"],
  nextStatement: ["slashCreate", "contextMenuCreate"],
});

javascriptGenerator.forBlock["slash_create_mutator"] = function (
  block,
  generator
) {
  var name = generator.valueToCode(block, "name", Order.ATOMIC);
  var dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var options = generator.statementToCode(block, "options");
  var nsfw = generator.valueToCode(block, "nsfw", Order.ATOMIC);
  var perm = generator.valueToCode(block, "perms", Order.ATOMIC);
  var dm = generator.valueToCode(block, "dm", Order.ATOMIC);

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
};

Blockly.Blocks["slash_addoption"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Add")
      .appendField(
        new Blockly.FieldDropdown([
          ["text", "3"],
          ["attachment", "11"],
          ["true/false", "5"],
          ["channel", "7"],
          ["integer", "4"],
          ["mentionable", "9"],
          ["number", "10"],
          ["role", "8"],
          ["user", "6"],
        ]),
        "type"
      )
      .appendField("option");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendValueInput("required")
      .setCheck("Boolean")
      .appendField("required:");
    this.appendStatementInput("choices")
      .setCheck("default")
      .appendField("choices (only with text type & optional):");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_addchoice"] = {
  init: function () {
    this.appendDummyInput().appendField("Add choice");
    this.appendValueInput("name")
      .setCheck("String")
      .appendField("name (shown to user):");
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("value (returned in code):");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_addsubcommandgroup"] = {
  init: function () {
    this.appendDummyInput().appendField("Add subcommand group");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendStatementInput("subcommands")
      .setCheck("default")
      .appendField("subcommands:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_name"] = {
  init: function () {
    this.appendDummyInput().appendField("name of the command");
    this.setOutput(true, "String");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_addsubcommand"] = {
  init: function () {
    this.appendDummyInput().appendField("Add subcommand");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("dsc").setCheck("String").appendField("description:");
    this.appendStatementInput("options")
      .setCheck("default")
      .appendField("options:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_member"] = {
  init: function () {
    this.appendDummyInput().appendField("member who ran the command");
    this.setInputsInline(false);
    this.setOutput(true, "member");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_user"] = {
  init: function () {
    this.appendDummyInput().appendField("user who ran the command");
    this.setInputsInline(false);
    this.setOutput(true, "user");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_channel"] = {
  init: function () {
    this.appendDummyInput().appendField("channel the command was run in");
    this.setInputsInline(false);
    this.setOutput(true, "channel");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_server"] = {
  init: function () {
    this.appendDummyInput().appendField("server the command was run in");
    this.setInputsInline(false);
    this.setOutput(true, "server");
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["slash_getoption"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
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
        ]),
        "type"
      );
    this.appendValueInput("name")
      .setCheck("String")
      .appendField("option value with name:");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour("#3366CC");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["slash_getoption"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);

  var code = `interaction.options.get${dropdown_type}(${value_name})`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["slash_received"] = function (block, generator) {
  var code_statement = generator.statementToCode(block, "event");

  var code = `client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
${code_statement}});\n`;
  return code;
};

javascriptGenerator.forBlock["slash_addoption"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var value_required = generator.valueToCode(block, "required", Order.ATOMIC);
  var statements_choices = generator.statementToCode(block, "choices");

  var code = `{
    type: ${dropdown_type},
    name: ${value_name},
    description: ${value_dsc},
    required: ${value_required || "false"},
    choices: [${statements_choices}]
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_addchoice"] = function (block, generator) {
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `{
    name: ${value_name},
    value: ${value_value}
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_server"] = function (block, generator) {
  var code = "interaction.guild";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["slash_channel"] = function (block, generator) {
  var code = "interaction.channel";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["slash_member"] = function (block, generator) {
  var code = "interaction.member";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["slash_user"] = function (block, generator) {
  var code = "interaction.member.user";
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["slash_addsubcommand"] = function (
  block,
  generator
) {
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var statements_options = generator.statementToCode(block, "options");

  var code = `{
    type: 1,
    name: ${value_name},
    description: ${value_dsc},
    options: [${statements_options}]
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_addsubcommandgroup"] = function (
  block,
  generator
) {
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var statements_subcommands = generator.statementToCode(block, "subcommands");

  var code = `{
    type: 2,
    name: ${value_name},
    description: ${value_dsc},
    options: [${statements_subcommands}]
  },`;
  return code;
};

javascriptGenerator.forBlock["slash_name"] = function (block, generator) {
  var code = "interaction.commandName";
  return [code, Order.NONE];
};

createRestrictions(
  ["misc_createcontainer_global"],
  [
    {
      type: "blockAlreadyExists",
      blockTypes: ["misc_createcontainer_global"],
      message:
        'It is recommended you use this block only once',
    },
  ]
);

createRestrictions(
  ["slash_create"],
  [
    {
      type: "surroundParent",
      blockTypes: [
        "slash_createcontainer",
        "misc_createcontainer",
        "misc_createcontainer_global",
      ],
      message:
        'This block must be under a "Create slash commands / context menus" block',
    },
    {
      type: "validator",
      blockTypes: ["name"],
      check: (val) => /^[a-z0-9_-]+$/.test(val),
      message:
        "The name only have lowercase letters, numbers, hyphens, and/or underscores",
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
  ]
);

createRestrictions(
  ["slash_addoption"],
  [
    {
      type: "surroundParent",
      blockTypes: [
        "slash_create",
        "slash_addsubcommand",
        "slash_create_mutator",
      ],
      message:
        'This block must be under "add slash command" OR "add subcommand" block',
    },
    {
      type: "validator",
      blockTypes: ["name"],
      check: (val) => /^[a-z0-9_-]+$/.test(val),
      message:
        "The name only have lowercase letters, numbers, hyphens, and/or underscores",
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
  ]
);
createRestrictions(
  ["slash_addchoice"],
  [
    {
      type: "surroundParent",
      blockTypes: ["slash_addoption"],
      message: 'This block must be under "add option" block',
    },
    {
      type: "validator",
      blockTypes: ["name"],
      check: (val) => /^[a-z0-9_-]+$/.test(val),
      message:
        "The name only have lowercase letters, numbers, hyphens, and/or underscores",
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
  ]
);
createRestrictions(
  ["slash_addsubcommand"],
  [
    {
      type: "surroundParent",
      blockTypes: ["slash_create", "slash_addsubcommandgroup"],
      message:
        'This block must be under "add slash command" OR "add subcommand group" block',
    },
    {
      type: "validator",
      blockTypes: ["name"],
      check: (val) => /^[a-z0-9_-]+$/.test(val),
      message:
        "The name only have lowercase letters, numbers, hyphens, and/or underscores",
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
  ]
);
createRestrictions(
  ["slash_addsubcommandgroup"],
  [
    {
      type: "surroundParent",
      blockTypes: ["slash_create"],
      message: 'This block must be under "add slash command" block',
    },
  ]
);

createRestrictions(
  ["slash_editreply"],
  [
    {
      type: "hasHat",
      blockTypes: ["slash_received"],
      message: 'This block must be under "when slash command received" event',
    },
    {
      type: "hasBlockInParent",
      blockTypes: ["slash_reply"],
      message: 'This block must be used AFTER "reply to the command" block',
    },
  ]
);

createRestrictions(
  ["slash_name", "slash_member", "slash_user", "slash_channel", "slash_server"],
  [
    {
      type: "hasHat",
      blockTypes: ["slash_received"],
      message: 'This block must be under "when slash command received" event',
    },
  ]
);

createRestrictions(
  ["slash_editreply"],
  [
    {
      type: "hasHat",
      blockTypes: ["slash_received", "contextMenu_received"],
      message:
        'This block must be under "when slash command received" or "when context menu clicked" event',
    },
    {
      type: "hasBlockInParent",
      blockTypes: ["slash_reply"],
      message: 'This block must be used AFTER "reply to the command" block',
    },
  ]
);

createRestrictions(
  ["slash_reply"],
  [
    {
      type: "hasHat",
      blockTypes: [
        "slash_received",
        "modal_handle_interaction",
        "contextMenu_received",
      ],
      message: "This block must be under an interaction event",
    },
  ]
);

createRestrictions(
  ["slash_reply_rows"],
  [
    {
      type: "hasHat",
      blockTypes: [
        "slash_received",
        "modal_handle_interaction",
        "contextMenu_received",
      ],
      message: "This block must be under an interaction event",
    },
  ]
);
