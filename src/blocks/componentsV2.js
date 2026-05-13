import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";
import { createMutatorBlock } from "../functions/createMutator";

Blockly.Blocks["cv2_textDisplay"] = {
  init: function () {
    this.appendValueInput("content")
      .setCheck("String")
      .appendField("Text display:");
    this.setPreviousStatement(true, ["rootComponents", "containerComponents"]);
    this.setNextStatement(true, ["rootComponents", "containerComponents"]);
    this.setColour("#26A4AF");
    this.setTooltip(
      "Displays markdown text inside a Components V2 message. Supports full Discord markdown.",
    );
  },
};

javascriptGenerator.forBlock["cv2_textDisplay"] = function (block, generator) {
  const content = generator.valueToCode(block, "content", Order.ATOMIC) || "''";
  return `new Discord.TextDisplayBuilder().setContent(${content}),\n`;
};

Blockly.Blocks["cv2_separator"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Separator with")
      .appendField(
        new Blockly.FieldDropdown([
          ["small spacing", "Small"],
          ["large spacing", "Large"],
        ]),
        "spacing",
      );
    this.appendDummyInput()
      .appendField("show line?")
      .appendField(new Blockly.FieldCheckbox("TRUE"), "divider");
    this.setPreviousStatement(true, "rootComponents");
    this.setNextStatement(true, "rootComponents");
    this.setColour("#26A4AF");
    this.setInputsInline(false);
    this.setTooltip(
      "Adds a visual space (and optional horizontal line) between components.",
    );
  },
};

javascriptGenerator.forBlock["cv2_separator"] = function (block) {
  const spacing = block.getFieldValue("spacing");
  const divider = block.getFieldValue("divider") === "TRUE";
  return `new Discord.SeparatorBuilder().setDivider(${divider}).setSpacing(Discord.SeparatorSpacingSize.${spacing}),\n`;
};

Blockly.Blocks["cv2_section_thumbnail"] = {
  init: function () {
    this.appendDummyInput().appendField("Section with thumbnail");
    this.appendValueInput("text").setCheck("String").appendField("text:");
    this.appendValueInput("thumbnailUrl")
      .setCheck("String")
      .appendField("thumbnail URL:");
    this.appendValueInput("thumbnailAlt")
      .setCheck("String")
      .appendField("alt text:");
    this.setPreviousStatement(true, ["rootComponents", "containerComponents"]);
    this.setNextStatement(true, ["rootComponents", "containerComponents"]);
    this.setColour("#26A4AF");
    this.setTooltip(
      "A section with 1-3 lines of text and a thumbnail image on the right.",
    );
  },
};

javascriptGenerator.forBlock["cv2_section_thumbnail"] = function (
  block,
  generator,
) {
  const text = generator.valueToCode(block, "text", Order.ATOMIC) || "''";
  const thumbnailUrl =
    generator.valueToCode(block, "thumbnailUrl", Order.ATOMIC) || "''";
  const alt =
    generator.valueToCode(block, "thumbnailAlt", Order.ATOMIC) || "''";
  return `new Discord.SectionBuilder()
  .addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(${text}))
  .setThumbnailAccessory(new Discord.ThumbnailBuilder().setURL(${thumbnailUrl}).setDescription(${alt})),\n`;
};

Blockly.Blocks["cv2_section_button"] = {
  init: function () {
    this.appendDummyInput().appendField("section with button");
    this.appendValueInput("text").setCheck("String").appendField("text:");
    this.appendValueInput("buttonLabel")
      .setCheck("String")
      .appendField("button label:");
    this.appendValueInput("buttonEmoji")
      .setCheck("String")
      .appendField("button emoji:");
    this.appendValueInput("buttonId")
      .setCheck("String")
      .appendField("button custom ID:");
    this.appendDummyInput()
      .appendField("button style:")
      .appendField(
        new Blockly.FieldDropdown([
          ["Blurple", "Primary"],
          ["Gray", "Secondary"],
          ["Green", "Success"],
          ["Red", "Danger"],
          ["Link", "Link"],
        ]),
        "style",
      );
    this.appendValueInput("url")
      .setCheck("String")
      .appendField("button URL (only for link style):");
    this.setPreviousStatement(true, ["rootComponents", "containerComponents"]);
    this.setNextStatement(true, ["rootComponents", "containerComponents"]);
    this.setColour("#26A4AF");
    this.setInputsInline(false);
    this.setTooltip(
      "A section with text and a button as the accessory on the right.",
    );
  },
};

javascriptGenerator.forBlock["cv2_section_button"] = function (
  block,
  generator,
) {
  const text = generator.valueToCode(block, "text", Order.ATOMIC) || "''";
  const url = generator.valueToCode(block, "url", Order.ATOMIC) || "''";
  const label =
    generator.valueToCode(block, "buttonLabel", Order.ATOMIC) || "''";
  const customId =
    generator.valueToCode(block, "buttonId", Order.ATOMIC) || "''";
  const style = block.getFieldValue("style");
  return `new Discord.SectionBuilder()
  .addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(${text}))
  .setButtonAccessory(
    new Discord.ButtonBuilder()
      .setLabel(${label})
      .setStyle(Discord.ButtonStyle.${style})
      ${style === "Link" ? `.setURL(${url})` : `.setCustomId(${customId})`}
  ),\n`;
};

Blockly.Blocks["cv2_mediaGallery"] = {
  init: function () {
    this.appendDummyInput().appendField("Media gallery");
    this.appendStatementInput("items")
      .setCheck("cv2galleryitem")
      .appendField("images:");
    this.setPreviousStatement(true, ["rootComponents", "containerComponents"]);
    this.setNextStatement(true, ["rootComponents", "containerComponents"]);
    this.setColour("#26A4AF");
    this.setTooltip(
      "Displays a grid of up to 10 images or videos (URLs). Put 'gallery image' blocks inside.",
    );
  },
};

javascriptGenerator.forBlock["cv2_mediaGallery"] = function (block, generator) {
  const items = generator.statementToCode(block, "items");
  return `new Discord.MediaGalleryBuilder().addItems(${items || ""}),\n`;
};

Blockly.Blocks["cv2_mediaGalleryItem"] = {
  init: function () {
    this.appendValueInput("url")
      .setCheck("String")
      .appendField("Image with URL:");
    this.appendValueInput("alt").setCheck("String").appendField("description:");
    this.appendDummyInput()
      .appendField("spoiler?")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "spoiler");
    this.setPreviousStatement(true, "cv2galleryitem");
    this.setNextStatement(true, "cv2galleryitem");
    this.setColour("#26A4AF");
    this.setTooltip("A single image item inside a media gallery.");
    this.setInputsInline(false);
  },
};

javascriptGenerator.forBlock["cv2_mediaGalleryItem"] = function (
  block,
  generator,
) {
  const url = generator.valueToCode(block, "url", Order.ATOMIC) || "''";
  const alt = generator.valueToCode(block, "alt", Order.ATOMIC) || "''";
  const spoiler = block.getFieldValue("spoiler") === "TRUE";
  return `new Discord.MediaGalleryItemBuilder().setURL(${url}).setDescription(${alt}).setSpoiler(${spoiler}),\n`;
};

Blockly.Blocks["cv2_container"] = {
  init: function () {
    this.appendDummyInput().appendField("Container");
    this.appendValueInput("color")
      .setCheck(["Colour", "String"])
      .appendField("accent color (optional):");
    this.appendStatementInput("components")
      .setCheck("containerComponents")
      .appendField("components:");
    this.setPreviousStatement(true, ["rootComponents"]);
    this.setNextStatement(true, ["rootComponents"]);
    this.setColour("#26A4AF");
    this.setTooltip(
      "Groups components in a visually distinct rounded box with an optional colored stripe on the left.",
    );
  },
};

javascriptGenerator.forBlock["cv2_container"] = function (block, generator) {
  const color = generator.valueToCode(block, "color", Order.ATOMIC);
  const components = generator.statementToCode(block, "components");

  const innerItems = components
    ? components
        .trim()
        .split(/,\n/)
        .filter(Boolean)
        .map((s) => s.trim().replace(/,$/, ""))
        .join(",\n    ")
    : "";

  let code = `new Discord.ContainerBuilder()`;
  if (color && color !== "''" && color !== '""') {
    code += `\n  .setAccentColor(parseInt(${color}.replace('#',''), 16))`;
  }
  const inner = components
    ? `[\n    ${components
        .split(",\n")
        .filter(Boolean)
        .map((s) => s.trim().replace(/,$/, ""))
        .join(",\n    ")}\n  ]`
    : "[]";

  return `(() => {
  const _container = new Discord.ContainerBuilder();
  ${
    color && color !== "''" && color !== '""'
      ? `_container.setAccentColor(parseInt((${color}).replace('#',''), 16));`
      : ""
  }
  const _items = ${inner};
  _items.forEach(comp => {
    if (comp instanceof Discord.TextDisplayBuilder) _container.addTextDisplayComponents(comp);
    else if (comp instanceof Discord.SeparatorBuilder) _container.addSeparatorComponents(comp);
    else if (comp instanceof Discord.SectionBuilder) _container.addSectionComponents(comp);
    else if (comp instanceof Discord.MediaGalleryBuilder) _container.addMediaGalleryComponents(comp);
    else if (comp instanceof Discord.ActionRowBuilder) _container.addActionRowComponents(comp);
    else if (comp instanceof Discord.FileBuilder) _container.addFileComponents(comp);
  });
  return _container;
})(),\n`;
};

Blockly.Blocks["cv2_file"] = {
  init: function () {
    this.appendValueInput("file")
      .setCheck("String")
      .appendField("Show file with name:");
    this.appendDummyInput()
      .appendField("spoiler?")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "spoiler");
    this.setPreviousStatement(true, ["rootComponents", "containerComponents"]);
    this.setNextStatement(true, ["rootComponents", "containerComponents"]);
    this.setInputsInline(false);
    this.setColour("#26A4AF");
    this.setTooltip(
      "Displays an uploaded file inside a Components V2 message. Use an 'add file' block as the input.",
    );
  },
};

javascriptGenerator.forBlock["cv2_file"] = function (block, generator) {
  const file = generator.valueToCode(block, "file", Order.ATOMIC) || "";
  const spoiler = block.getFieldValue("spoiler") === "TRUE";
  return `new Discord.FileBuilder().setURL("attachment://" + ${file.trim().replace(/,$/, "")}).setSpoiler(${spoiler}),\n`;
};

createRestrictions(
  ["cv2_file"],
  [
    {
      type: "notEmpty",
      blockTypes: ["file"],
      message: "You must attach a file to the file component",
    },
  ],
);

Blockly.Blocks["cv2_addFile"] = {
  init: function () {
    this.appendValueInput("path")
      .setCheck("String")
      .appendField("Add file from URL/path:");
    this.appendValueInput("name").setCheck("String").appendField("with name:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "files");
    this.setNextStatement(true, "files");
    this.setColour("#26A4AF");
  },
};

javascriptGenerator.forBlock["cv2_addFile"] = function (block, generator) {
  var path = generator.valueToCode(block, "path", Order.ATOMIC);
  var name = generator.valueToCode(block, "name", Order.ATOMIC);
  return `new Discord.AttachmentBuilder(${path}, { name: ${name} }),\n`;
};

createMutatorBlock({
  id: "cv2_sendMessage",
  optionsBlockId: "cv2_sendMessage_mutator",
  colour: "#AD509B",
  inputs: [
    { type: "value", name: "channel", check: "channel", label: "Send message in channel:" },
    { type: "statement", name: "components", check: "rootComponents", label: "components:" },
  ],
  mutatorFields: [
    { name: "files", label: "include files", inputType: "statement", inputLabel: "files:", valueCheck: "files" },
    { name: "then", label: "include 'then'", inputType: "statement", inputLabel: "then:", valueCheck: "default" },
  ],
  previousStatement: "default",
  nextStatement: "default",
  tooltip: "Sends a message using Discord's Components V2 system. Cannot use content or embeds — use Text Display blocks instead.",
});

javascriptGenerator.forBlock["cv2_sendMessage"] = function (block, generator) {
  const channel =
    generator.valueToCode(block, "channel", Order.ATOMIC) || "null";
  const components = generator.statementToCode(block, "components");
  const then = block.getInput("then") ? generator.statementToCode(block, "then") : "";
  const files = block.getInput("files") ? generator.statementToCode(block, "files") : "";

  const componentArray = components
    ? `[\n    ${components
        .trim()
        .split(",\n")
        .filter(Boolean)
        .map((s) => s.trim().replace(/,$/, ""))
        .join(",\n    ")}\n  ]`
    : "[]";

  const thenStr = then ? `.then(async (messageSent) => {\n${then}})` : "";
  const filesStr = files ? `files: [${files}],\n  ` : "";

  return `await ${channel}.send({
  components: ${componentArray},
  ${filesStr}
  flags: Discord.MessageFlags.IsComponentsV2,
})${thenStr};\n`;
};

createMutatorBlock({
  id: "cv2_sendDm",
  optionsBlockId: "cv2_sendDm_mutator",
  colour: "#3c9e56",
  inputs: [
    { type: "value", name: "member", check: ["member", "user"], label: "Send a DM to user/member:" },
    { type: "statement", name: "components", check: "rootComponents", label: "components:" },
  ],
  mutatorFields: [
    { name: "files", label: "include files", inputType: "statement", inputLabel: "files:", valueCheck: "files" },
    { name: "then", label: "include then", inputType: "statement", inputLabel: "then:", valueCheck: "default" },
  ],
  previousStatement: "default",
  nextStatement: "default",
  tooltip: "Sends a DM using Discord's Components V2 system. Cannot use content or embeds — use Text Display blocks instead.",
});

javascriptGenerator.forBlock["cv2_sendDm"] = function (block, generator) {
  const member = generator.valueToCode(block, "member", Order.ATOMIC) || "null";
  const components = generator.statementToCode(block, "components");
  const then = block.getInput("then") ? generator.statementToCode(block, "then") : "";
  const files = block.getInput("files") ? generator.statementToCode(block, "files") : "";

  const componentArray = components
    ? `[\n    ${components
        .trim()
        .split(",\n")
        .filter(Boolean)
        .map((s) => s.trim().replace(/,$/, ""))
        .join(",\n    ")}\n  ]`
    : "[]";

  const thenStr = then ? `.then(async (messageSent) => {\n${then}})` : "";
  const filesStr = files ? `files: [${files}],\n  ` : "";

  return `await ${member}.send({
  components: ${componentArray},
  ${filesStr}
  flags: Discord.MessageFlags.IsComponentsV2,
})${thenStr};\n`;
};

createMutatorBlock({
  id: "cv2_replyInteraction",
  optionsBlockId: "cv2_replyInteraction_mutator",
  colour: "#4192E9",
  inputs: [
    { type: "dummy", label: "Reply to the interaction" },
    { type: "value", name: "ephemeral", check: "Boolean", label: "visible only to the user?" },
    { type: "statement", name: "components", check: "rootComponents", label: "components:" },
  ],
  mutatorFields: [
    { name: "files", label: "include files", inputType: "statement", inputLabel: "files:", valueCheck: "files" },
  ],
  previousStatement: "default",
  nextStatement: "default",
  tooltip: "Replies to a slash command / button / menu interaction using Components V2. Cannot use content or embeds.",
});

javascriptGenerator.forBlock["cv2_replyInteraction"] = function (
  block,
  generator,
) {
  const ephemeral =
    generator.valueToCode(block, "ephemeral", Order.ATOMIC) || "false";
  const components = generator.statementToCode(block, "components");
  const files = block.getInput("files") ? generator.statementToCode(block, "files") : "";

  const componentArray = components
    ? `[\n    ${components
        .trim()
        .split(",\n")
        .filter(Boolean)
        .map((s) => s.trim().replace(/,$/, ""))
        .join(",\n    ")}\n  ]`
    : "[]";

  const filesStr = files ? `files: [${files}],\n  ` : "";

  return `await interaction.reply({
  components: ${componentArray},
  ephemeral: ${ephemeral},
  ${filesStr}
  flags: Discord.MessageFlags.IsComponentsV2,
});\n`;
};

createMutatorBlock({
  id: "cv2_replyMsg",
  optionsBlockId: "cv2_replyMsg_mutator",
  colour: "#336EFF",
  inputs: [
    { type: "dummy", label: "Reply to the message" },
    { type: "statement", name: "components", check: "rootComponents", label: "components:" },
  ],
  mutatorFields: [
    { name: "files", label: "include files", inputType: "statement", inputLabel: "files:", valueCheck: "files" },
    { name: "then", label: "include 'then'", inputType: "statement", inputLabel: "then:", valueCheck: "default" },
  ],
  previousStatement: "default",
  nextStatement: "default",
  tooltip: "Replies to a message using Components V2. Cannot use content or embeds.",
});

javascriptGenerator.forBlock["cv2_replyMsg"] = function (block, generator) {
  const then = block.getInput("then") ? generator.statementToCode(block, "then") : "";
  const components = generator.statementToCode(block, "components");
  const files = block.getInput("files") ? generator.statementToCode(block, "files") : "";

  const componentArray = components
    ? `[\n    ${components
        .trim()
        .split(",\n")
        .filter(Boolean)
        .map((s) => s.trim().replace(/,$/, ""))
        .join(",\n    ")}\n  ]`
    : "[]";

  const thenStr = then ? `.then(async (messageSent) => {\n${then}})` : "";
  const filesStr = files ? `files: [${files}],\n  ` : "";

  return `await message.reply({
  components: ${componentArray},
  ${filesStr}
  flags: Discord.MessageFlags.IsComponentsV2,
})${thenStr};\n`;
};

createMutatorBlock({
  id: "cv2_editReplyInteraction",
  optionsBlockId: "cv2_editReplyInteraction_mutator",
  colour: "#3366CC",
  inputs: [
    { type: "dummy", label: "Edit the bot's reply" },
    { type: "statement", name: "components", check: "rootComponents", label: "components:" },
  ],
  mutatorFields: [
    { name: "files", label: "include files", inputType: "statement", inputLabel: "files:", valueCheck: "files" },
  ],
  previousStatement: "default",
  nextStatement: "default",
  tooltip: "Edits a deferred or previously sent interaction reply using Components V2.",
});

javascriptGenerator.forBlock["cv2_editReplyInteraction"] = function (
  block,
  generator,
) {
  const components = generator.statementToCode(block, "components");
  const files = block.getInput("files") ? generator.statementToCode(block, "files") : "";

  const componentArray = components
    ? `[\n    ${components
        .trim()
        .split(",\n")
        .filter(Boolean)
        .map((s) => s.trim().replace(/,$/, ""))
        .join(",\n    ")}\n  ]`
    : "[]";

  const filesStr = files ? `files: [${files}],\n  ` : "";

  return `await interaction.editReply({
  components: ${componentArray},
  ${filesStr}
  flags: Discord.MessageFlags.IsComponentsV2,
});\n`;
};

createMutatorBlock({
  id: "cv2_editMsg",
  optionsBlockId: "cv2_editMsg_mutator",
  colour: "#336EFF",
  inputs: [
    { type: "value", name: "message", check: "message", label: "Edit message:" },
    { type: "statement", name: "components", check: "rootComponents", label: "components:" },
  ],
  mutatorFields: [
    { name: "files", label: "include files", inputType: "statement", inputLabel: "files:", valueCheck: "files" },
  ],
  previousStatement: "default",
  nextStatement: "default",
  tooltip: "Edits a deferred or previously sent interaction reply using Components V2.",
});

javascriptGenerator.forBlock["cv2_editMsg"] = function (block, generator) {
  const message =
    generator.valueToCode(block, "message", Order.ATOMIC) || "null";
  const components = generator.statementToCode(block, "components");
  const files = block.getInput("files") ? generator.statementToCode(block, "files") : "";

  const componentArray = components
    ? `[\n    ${components
        .trim()
        .split(",\n")
        .filter(Boolean)
        .map((s) => s.trim().replace(/,$/, ""))
        .join(",\n    ")}\n  ]`
    : "[]";

  const filesStr = files ? `files: [${files}],\n  ` : "";

  return `await ${message}.edit({
  components: ${componentArray},
  ${filesStr}
  flags: Discord.MessageFlags.IsComponentsV2,
});\n`;
};

createRestrictions(
  ["cv2_mediaGalleryItem"],
  [
    {
      type: "surroundParent",
      blockTypes: ["cv2_mediaGallery"],
      message: "Gallery image blocks must be inside a 'media gallery' block",
    },
  ],
);

createRestrictions(
  ["cv2_sendMessage"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel to send the message in",
    },
    {
      type: "notEmpty",
      blockTypes: ["components"],
      message: "You must add at least one component to the message",
    },
  ],
);

createRestrictions(
  ["cv2_replyInteraction", "cv2_editReplyInteraction"],
  [
    {
      type: "hasHat",
      blockTypes: [
        "slash_received",
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
);

createRestrictions(
  ["cv2_section_thumbnail", "cv2_section_button"],
  [
    {
      type: "notEmpty",
      blockTypes: ["text"],
      message: "You must specify the section text",
    },
  ],
);

createRestrictions(
  ["cv2_section_button"],
  [
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
  ],
);

createRestrictions(
  ["cv2_section_thumbnail"],
  [
    {
      type: "notEmpty",
      blockTypes: ["thumbnailUrl"],
      message: "You must specify the thumbnail URL",
    },
  ],
);
