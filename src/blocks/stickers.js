import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";
import { createMutatorBlock } from "../functions/createMutator.ts";

Blockly.Blocks["sticker_getallinserver"] = {
  init: function () {
    this.appendDummyInput().appendField("For each sticker on the server:");
    this.appendValueInput("server").setCheck("server");
    this.appendStatementInput("code").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#7a9e37");
    this.setTooltip("Runs code for each sticker on a server.");
    this.setInputsInline(true);
  },
};

javascriptGenerator.forBlock["sticker_getallinserver"] = function (
  block,
  generator
) {
  var server = generator.valueToCode(block, "server", Order.ATOMIC);
  var statements_code = generator.statementToCode(block, "code");
  return `${server}.stickers.cache.forEach(async (ForEachStickerInServer) => {
  ${statements_code}});\n`;
};

Blockly.Blocks["sticker_getallinserver_value"] = {
  init: function () {
    this.appendDummyInput().appendField("current sticker in loop");
    this.setOutput("sticker");
    this.setColour("#7a9e37");
  },
};

javascriptGenerator.forBlock["sticker_getallinserver_value"] = function () {
  return ["sticker", Order.NONE];
};

Blockly.Blocks["sticker_getguild"] = {
  init: function () {
    this.appendValueInput("sticker")
      .setCheck("sticker")
      .appendField("server of sticker:");
    this.setOutput(true, "string");
    this.setColour("#7a9e37");
  },
};

javascriptGenerator.forBlock["sticker_getguild"] = function (block, generator) {
  var sticker = generator.valueToCode(block, "sticker", Order.ATOMIC);
  return [`${sticker}.guild`, Order.NONE];
};

Blockly.Blocks["sticker_getname"] = {
  init: function () {
    this.appendValueInput("sticker")
      .setCheck("sticker")
      .appendField("get name of sticker:");
    this.setOutput(true, "string");
    this.setColour("#7a9e37");
  },
};

javascriptGenerator.forBlock["sticker_getname"] = function (block, generator) {
  var sticker = generator.valueToCode(block, "sticker", Order.ATOMIC);
  return [`${sticker}.name`, Order.NONE];
};

Blockly.Blocks["sticker_geturl"] = {
  init: function () {
    this.appendValueInput("sticker")
      .setCheck("sticker")
      .appendField("get image URL of the sticker:");
    this.setOutput(true, "string");
    this.setColour("#7a9e37");
  },
};

javascriptGenerator.forBlock["sticker_geturl"] = function (block, generator) {
  var sticker = generator.valueToCode(block, "sticker", Order.ATOMIC);
  return [`${sticker}.url`, Order.NONE];
};

Blockly.Blocks["sticker_getwith"] = {
  init: function () {
    this.appendValueInput("equal")
      .setCheck("String")
      .appendField("get sticker with")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["id", "id"],
        ]),
        "with"
      )
      .appendField("equal to");
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("on the server");
    this.setOutput(true, "sticker");
    this.setColour("#7a9e37");
  },
};

javascriptGenerator.forBlock["sticker_getwith"] = function (block, generator) {
  var dropdown_with = block.getFieldValue("with");
  var value_equal = generator.valueToCode(block, "equal", Order.ATOMIC);
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  if (dropdown_with === "name") {
    return [
      `${value_server}.stickers.cache.find(sticker => sticker.name === ${value_equal})`,
      Order.FUNCTION_CALL,
    ];
  } else {
    return [
      `${value_server}.stickers.cache.get(${value_equal})`,
      Order.FUNCTION_CALL,
    ];
  }
};

Blockly.Blocks["sticker_getid"] = {
  init: function () {
    this.appendValueInput("sticker")
      .setCheck("sticker")
      .appendField("get ID of the sticker:");
    this.setOutput(true, "string");
    this.setColour("#7a9e37");
  },
};

javascriptGenerator.forBlock["sticker_getid"] = function (block, generator) {
  var sticker = generator.valueToCode(block, "sticker", Order.ATOMIC);
  return [`${sticker}.id`, Order.NONE];
};

Blockly.Blocks["sticker_created"] = {
  init: function () {
    this.appendValueInput("sticker")
      .setCheck("sticker")
      .appendField("creation")
      .appendField(
        new Blockly.FieldDropdown([
          ["date", "createdAt"],
          ["timestamp", "createdTimestamp"],
        ]),
        "type"
      )
      .appendField("of sticker:");
    this.setOutput(true, "String");
    this.setColour("#7a9e37");
  },
};

javascriptGenerator.forBlock["sticker_created"] = function (block, generator) {
  var sticker = generator.valueToCode(block, "sticker", Order.ATOMIC);
  var type = block.getFieldValue("type");
  return [`${sticker}.${type}`, Order.NONE];
};

createMutatorBlock({
  id: "sticker_create",
  optionsBlockId: "sticker_create_options",
  colour: "#7a9e37",
  inputs: [
    {
      type: "dummy",
      label: "Create a sticker",
    },
    {
      type: "value",
      label: "server:",
      name: "server",
      check: "server",
    },
    {
      type: "value",
      label: "name:",
      name: "name",
      check: "String",
    },
    {
      type: "value",
      label: "file URL:",
      name: "file",
      check: "String",
    },
  ],
  mutatorFields: [
    {
      name: "description",
      inputLabel: "description:",
      inputType: "value",
      label: "include description",
      default: false,
      valueCheck: "String",
    },
    {
      name: "tags",
      inputLabel: "tags:",
      inputType: "value",
      label: "include tags",
      default: false,
      valueCheck: "String",
    },
  ],
  nextStatement: "default",
  previousStatement: "default",
});

javascriptGenerator.forBlock["sticker_create"] = function (block, generator) {
  var name = generator.valueToCode(block, "name", Order.ATOMIC) || "";
  var file = generator.valueToCode(block, "file", Order.ATOMIC) || "";
  var tags = generator.valueToCode(block, "tags", Order.ATOMIC);
  var description = generator.valueToCode(block, "description", Order.ATOMIC);
  var server = generator.valueToCode(block, "server", Order.ATOMIC);

  const options = [`name: ${name}`, `file: ${file}`];
  if (description) options.push(`description: ${description}`);
  if (tags) options.push(`tags: ${tags}`);

  return `${server}.stickers.create({
  ${options.join(",\n  ")}
});\n`;
};

Blockly.Blocks["sticker_delete"] = {
  init: function () {
    this.appendValueInput("sticker")
      .setCheck("sticker")
      .appendField("Delete sticker:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#7a9e37");
    this.setTooltip("Deletes a sticker.");
  },
};

javascriptGenerator.forBlock["sticker_delete"] = function (block, generator) {
  var sticker = generator.valueToCode(block, "sticker", Order.ATOMIC);
  return `${sticker}.delete();\n`;
};

Blockly.Blocks["sticker_setname"] = {
  init: function () {
    this.appendValueInput("sticker")
      .setCheck("sticker")
      .appendField("Rename the sticker:");
    this.appendValueInput("name").setCheck("String").appendField("to:");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#7a9e37");
    this.setTooltip("Renames a sticker.");
  },
};

javascriptGenerator.forBlock["sticker_setname"] = function (block, generator) {
  var sticker = generator.valueToCode(block, "sticker", Order.ATOMIC);
  var name = generator.valueToCode(block, "name", Order.ATOMIC);
  return `${sticker}.edit({ name: ${name} });\n`;
};

createRestrictions(
  [
    "sticker_getid",
    "sticker_geturl",
    "sticker_getname",
    "sticker_created",
    "sticker_delete",
    "sticker_setname",
  ],
  [
    {
      type: "notEmpty",
      blockTypes: ["sticker"],
      message: "You must specify the sticker",
    },
  ]
);

createRestrictions(
  ["sticker_getwith"],
  [
    {
      type: "notEmpty",
      blockTypes: ["equal"],
      message: "You must specify the name/id",
    },
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify the server to get the sticker from",
    },
  ]
);

createRestrictions(
  ["sticker_getallinserver_value"],
  [
    {
      type: "hasParent",
      blockTypes: ["sticker_getallinserver"],
      message: 'This block must be in a "for each sticker in the server" block',
    },
  ]
);

createRestrictions(
  ["sticker_getallinserver"],
  [
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify the server to iterate stickers from.",
    },
  ]
);

createRestrictions(
  ["sticker_create"],
  [
    {
      type: "notEmpty",
      blockTypes: ["file"],
      message: "You must specify the file URL for the sticker",
    },
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify the server to create the sticker in",
    },
    {
      type: "validator",
      blockTypes: ["name"],
      check: (val) => 0 < val.length && val.length <= 30,
      message: "Name must be between 1 and 30 characters",
    },
  ]
);
