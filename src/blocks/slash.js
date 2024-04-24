import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";

const slashReceived = {
  type: "slash_received",
  message0: "When a slash command is received %1 %2",
  args0: [
    {
      type: "input_dummy",
    },
    {
      type: "input_statement",
      name: "event",
    },
  ],
  inputsInline: false,
  colour: "#00A859",
  tooltip: "",
  helpUrl: "",
};

const slashCreate = {
  type: "slash_create",
  message0:
    "Create a slash command %1 name: %2 description: %3 guild ID (leave empty for global commands): %4 NSFW: %5 required member permission(s): %6 options: %7",
  args0: [
    {
      type: "input_dummy",
    },
    {
      type: "input_value",
      name: "name",
      check: "String",
    },
    {
      type: "input_value",
      name: "dsc",
      check: "String",
    },
    {
      type: "input_value",
      name: "guild",
      check: "String",
    },
    {
      type: "input_value",
      name: "nsfw",
      check: "Boolean",
    },
    {
      type: "input_value",
      name: "defaultMemberPerms",
      check: "String",
    },
    {
      type: "input_statement",
      name: "options",
      check: "slash_option",
    },
  ],
  colour: 230,
  tooltip: "",
  helpUrl: "",
};

export const slashBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  slashReceived,
  slashCreate,
]);

javascriptGenerator.forBlock["slash_received"] = function (block, generator) {
  var code = generator.statementToCode(block, "event");

  var code = `client.on("interactionCreate", async (interaction) => {
        ${code}
    });`;
  return code;
};

javascriptGenerator.forBlock["slash_create"] = function (block, generator) {
  var name = generator.valueToCode(block, "name", Order.ATOMIC);
  var dsc = generator.valueToCode(block, "dsc", Order.ATOMIC);
  var guild = generator.valueToCode(block, "guild", Order.ATOMIC);
  var options = generator.statementToCode(block, "options");
  var nsfw = generator.valueToCode(block, "nsfw", Order.ATOMIC);
  var defaultmemberperms = generator.valueToCode(
    block,
    "defaultMemberPerms",
    Order.ATOMIC
  );

  var code;

  if (guild)
    code = `client.guilds.cache.get(${guild}).commands.create({
    name: ${name},
    description: ${dsc},
    nsfw: ${nsfw},
    defaultMemberPermissions: ${defaultmemberperms},
    options: [${options}]
  });`;
  else if (!guild)
    code = `client.application.commands.create({
    name: ${name},
    description: ${dsc},
    nsfw: ${nsfw},
    defaultMemberPermissions: ${defaultmemberperms},
    options: [${options}]
  });`;

  return code;
};
