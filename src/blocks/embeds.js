import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["embed_create"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Create an embed with name:")
      .appendField(
        new Blockly.FieldTextInput("name", (val) => {
          if (/^(?![_$a-zA-Z])|[^_$a-zA-Z0-9]/.test(val)) return null;
          else return val;
        }),
        'name'
      );
    this.appendStatementInput("config")
      .setCheck("embedBlockCreatorBlock")
      .appendField("then");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["embed_settitle"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("Set embed title to:");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createRestrictions(
  ["embed_settitle"],
  [
    {
      type: "validator",
      blockTypes: ["value"],
      check: (val) => val.length <= 256,
      message: "Title cannot be greater than 256 characters",
    },
  ]
);

Blockly.Blocks["embed_setdsc"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("Set embed description to:");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createRestrictions(
  ["embed_setdsc"],
  [
    {
      type: "validator",
      blockTypes: ["value"],
      check: (val) => val.length <= 4096,
      message: "Description cannot be greater than 4096 characters",
    },
  ]
);

Blockly.Blocks["embed_setcolor"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck(["Colour", "String"])
      .appendField("Set embed color to:");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createRestrictions(
  ["embed_setcolor"],
  [
    {
      type: "validator",
      blockTypes: ["value"],
      check: (val) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val) || String(val).toLowerCase() === "Random",
      message: 'Color must be a valid hex color, or "Random"',
    },
  ]
);

Blockly.Blocks["embed_seturl"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("Set embed title URL to:");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createRestrictions(
  ["embed_seturl"],
  [
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
  ]
);

Blockly.Blocks["embed_setauthor"] = {
  init: function () {
    this.appendValueInput("name")
      .setCheck("String")
      .appendField("Set embed author name to:");
    this.appendValueInput("icon").setCheck("String").appendField("Icon URL:");
    this.appendValueInput("url").setCheck("String").appendField("Click URL:");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createRestrictions(
  ["embed_setauthor"],
  [
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
  ]
);

Blockly.Blocks["embed_setfooter"] = {
  init: function () {
    this.appendValueInput("text")
      .setCheck("String")
      .appendField("Set embed footer to:");
    this.appendValueInput("icon").setCheck("String").appendField("icon URL:");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createRestrictions(
  ["embed_setfooter"],
  [
    {
      type: "validator",
      blockTypes: ["text"],
      check: (val) => val.length <= 2048,
      message: "Footer cannot be greater than 2048 characters",
    },
  ]
);

Blockly.Blocks["embed_setimage"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("Set embed image URL to:");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createRestrictions(
  ["embed_setimage"],
  [
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
  ]
);

Blockly.Blocks["embed_setthumb"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("Set embed thumbnail URL to:");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createRestrictions(
  ["embed_setthumb"],
  [
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
  ]
);

Blockly.Blocks["embed_addfield"] = {
  init: function () {
    this.appendDummyInput().appendField("Add embed field");
    this.appendValueInput("name").setCheck("String").appendField("field name:");
    this.appendValueInput("val").setCheck("String").appendField("field value:");
    this.appendValueInput("inline").setCheck("Boolean").appendField("inline:");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

createRestrictions(
  ["embed_addfield"],
  [
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
  ]
);

Blockly.Blocks["embed_settimestamp"] = {
  init: function () {
    this.appendDummyInput().appendField("Add timestamp");
    this.setPreviousStatement(true, "embedBlockCreatorBlock");
    this.setNextStatement(true, "embedBlockCreatorBlock");
    this.setColour("00A58E");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["embed_settimestamp"] = function (
  block,
  generator
) {
  var code = `.setTimestamp()`;
  return code;
};

javascriptGenerator.forBlock["embed_addfield"] = function (block, generator) {
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_val = generator.valueToCode(block, "val", Order.ATOMIC);
  var value_inline = generator.valueToCode(block, "inline", Order.ATOMIC);

  var code = `.addFields({ name: ${value_name}, value: ${value_val}, inline: ${value_inline} })`;
  return code;
};

javascriptGenerator.forBlock["embed_setthumb"] = function (block, generator) {
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `.setThumbnail(${value_value})`;
  return code;
};

javascriptGenerator.forBlock["embed_setimage"] = function (block, generator) {
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `.setImage(${value_value})`;
  return code;
};

javascriptGenerator.forBlock["embed_setfooter"] = function (block, generator) {
  var value_text = generator.valueToCode(block, "text", Order.ATOMIC);
  var value_icon = generator.valueToCode(block, "icon", Order.ATOMIC);

  var code = `.setFooter({ text: ${value_text}, iconURL: ${value_icon} })`;
  return code;
};

javascriptGenerator.forBlock["embed_setauthor"] = function (block, generator) {
  var value_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var value_icon = generator.valueToCode(block, "icon", Order.ATOMIC);
  var value_url = generator.valueToCode(block, "url", Order.ATOMIC);

  var code = `.setAuthor({ name: ${value_name}, ${value_icon ? `\niconURL: ${value_icon},` : ''} ${value_url ? `\nurl: ${value_url},` : ''} })`;
  return code;
};

javascriptGenerator.forBlock["embed_seturl"] = function (block, generator) {
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `.setURL(${value_value})`;
  return code;
};

javascriptGenerator.forBlock["embed_setcolor"] = function (block, generator) {
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `.setColor(${value_value})`;
  return code;
};

javascriptGenerator.forBlock["embed_setdsc"] = function (block, generator) {
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `.setDescription(${value_value})`;
  return code;
};

javascriptGenerator.forBlock["embed_settitle"] = function (block, generator) {
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);

  var code = `.setTitle(${value_value})`;
  return code;
};

javascriptGenerator.forBlock["embed_create"] = function (block, generator) {
  var value_name = block.getFieldValue("name");
  var statements_config = generator.statementToCode(block, "config");

  var code = `let ${value_name} = new Discord.EmbedBuilder()${statements_config};\n`;
  return code;
};

createRestrictions(
  [
    "embed_settitle",
    "embed_setdsc",
    "embed_setcolor",
    "embed_seturl",
    "embed_setauthor",
    "embed_setfooter",
    "embed_setimage",
    "embed_setthumb",
    "embed_addfield",
    "embed_settimestamp",
  ],
  [
    {
      type: "surroundParent",
      blockTypes: ["embed_create"],
      message: "This block must be under a 'create embed' block",
    },
  ]
);
