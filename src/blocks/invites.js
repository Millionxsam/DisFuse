import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["invite_create"] = {
  init: function () {
    this.appendValueInput("channel")
      .appendField("create invite for channel:")
      .setCheck("channel");
    this.appendValueInput("uses")
      .appendField("amount of uses:")
      .setCheck("Number");
    this.setOutput(true, "invite");
    this.setColour("#CA8A67");
    this.setTooltip("Creates an invite URL for a channel.");
  },
};

javascriptGenerator.forBlock["invite_create"] = function (block, generator) {
  var channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var uses = generator.valueToCode(block, "uses", Order.ATOMIC);

  const code = `await ${channel}.createInvite({ maxAge: 0, maxUses: ${
    uses || "null"
  }, unique: true })`;
  return [code, Order.AWAIT];
};

Blockly.Blocks["invite_createGuild"] = {
  init: function () {
    this.appendValueInput("guild")
      .appendField("create invite for server:")
      .setCheck("server");
    this.appendValueInput("uses")
      .appendField("amount of uses:")
      .setCheck("Number");
    this.setWarningText(
      'This block is broken, use "create invite for channel" instead',
    );
    this.setOutput(true, "invite");
    this.setColour("#CA8A67");
    this.setTooltip("Creates an invite URL for a server.");
  },
};

javascriptGenerator.forBlock["invite_createGuild"] = function (
  block,
  generator,
) {
  var guild = generator.valueToCode(block, "guild", Order.ATOMIC);
  var uses = generator.valueToCode(block, "uses", Order.ATOMIC);

  const code = `await ${guild}.invites.create({ maxAge: 0, maxUses: ${
    uses || "null"
  }, unique: true })`;
  return [code, Order.AWAIT];
};

Blockly.Blocks["invite_get"] = {
  init: function () {
    this.appendValueInput("invite")
      .appendField("get invite with URL:")
      .setCheck("String");
    this.setOutput(true, "invite");
    this.setColour("#CA8A67");
    this.setTooltip("Gets an invite from an URL.");
  },
};

javascriptGenerator.forBlock["invite_get"] = function (block, generator) {
  var invite = generator.valueToCode(block, "invite", Order.ATOMIC);

  const code = `await client.fetchInvite(${invite})`;
  return [code, Order.AWAIT];
};

Blockly.Blocks["invite_delete"] = {
  init: function () {
    this.appendValueInput("invite")
      .appendField("Delete invite:")
      .setCheck("invite");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#CA8A67");
    this.setTooltip("Deletes an invite.");
  },
};

javascriptGenerator.forBlock["invite_delete"] = function (block, generator) {
  var invite = generator.valueToCode(block, "invite", Order.ATOMIC);

  return `await ${invite}.delete();\n`;
};

Blockly.Blocks["invite_url"] = {
  init: function () {
    this.appendValueInput("invite")
      .appendField("get url of invite:")
      .setCheck("invite");
    this.setOutput(true, "String");
    this.setColour("#CA8A67");
    this.setTooltip("Gets the URL of an invite.");
  },
};

javascriptGenerator.forBlock["invite_url"] = function (block, generator) {
  var invite = generator.valueToCode(block, "invite", Order.ATOMIC);

  const code = `${invite}.url`;
  return [code, Order.ATOMIC];
};

Blockly.Blocks["invite_channel"] = {
  init: function () {
    this.appendValueInput("invite")
      .appendField("get channel of invite:")
      .setCheck("invite");
    this.setOutput(true, "channel");
    this.setColour("#CA8A67");
    this.setTooltip("Gets the channel of an invite.");
  },
};

javascriptGenerator.forBlock["invite_channel"] = function (block, generator) {
  var invite = generator.valueToCode(block, "invite", Order.ATOMIC);

  const code = `${invite}.channel`;
  return [code, Order.ATOMIC];
};

Blockly.Blocks["invite_uses"] = {
  init: function () {
    this.appendValueInput("invite")
      .appendField("number of uses of invite:")
      .setCheck("invite");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour("#CA8A67");
    this.setTooltip("The number of times an invite has been used.");
  },
};

javascriptGenerator.forBlock["invite_uses"] = function (block, generator) {
  var invite = generator.valueToCode(block, "invite", Order.ATOMIC);
  const code = `${invite}.uses`;
  return [code, Order.ATOMIC];
};

Blockly.Blocks["invite_temporary"] = {
  init: function () {
    this.appendValueInput("invite").appendField("invite:").setCheck("invite");
    this.appendDummyInput().appendField("is temporary?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#CA8A67");
    this.setTooltip("Checks if an invite is temporary.");
  },
};

javascriptGenerator.forBlock["invite_temporary"] = function (block, generator) {
  var invite = generator.valueToCode(block, "invite", Order.ATOMIC);
  const code = `${invite}.temporary`;
  return [code, Order.ATOMIC];
};

Blockly.Blocks["invite_expiration"] = {
  init: function () {
    this.appendDummyInput().appendField("get expiration");
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["date", "expiresAt"],
        ["timestamp", "expiresTimestamp"],
      ]),
      "typeOfExpiration",
    );
    this.appendValueInput("invite")
      .appendField("of invite:")
      .setCheck("invite");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#CA8A67");
    this.setTooltip("Gets the date/time an invite expires at.");
  },
};

javascriptGenerator.forBlock["invite_expiration"] = function (
  block,
  generator,
) {
  var invite = generator.valueToCode(block, "invite", Order.ATOMIC);
  var createdOrCreatedTimestamp = block.getFieldValue("typeOfExpiration");

  const code = `${invite}.${createdOrCreatedTimestamp}`;
  return [code, Order.ATOMIC];
};

Blockly.Blocks["invite_created"] = {
  init: function () {
    this.appendDummyInput().appendField("get created");
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["date", "createdAt"],
        ["timestamp", "createdTimestamp"],
      ]),
      "typeOfCreated",
    );
    this.appendValueInput("invite")
      .appendField("of invite:")
      .setCheck("invite");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setColour("#CA8A67");
    this.setTooltip("Gets the date/time an invite was created.");
  },
};

javascriptGenerator.forBlock["invite_created"] = function (block, generator) {
  var invite = generator.valueToCode(block, "invite", Order.ATOMIC);
  var createdOrCreatedTimestamp = block.getFieldValue("typeOfCreated");

  const code = `${invite}.${createdOrCreatedTimestamp}`;
  return [code, Order.ATOMIC];
};

Blockly.Blocks["invite_author"] = {
  init: function () {
    this.appendValueInput("invite")
      .appendField("get author of invite:")
      .setCheck("invite");
    this.setOutput(true, "user");
    this.setColour("#CA8A67");
    this.setTooltip("Gets the user that created the invite.");
  },
};

javascriptGenerator.forBlock["invite_author"] = function (block, generator) {
  var invite = generator.valueToCode(block, "invite", Order.ATOMIC);

  const code = `${invite}.inviter`;
  return [code, Order.ATOMIC];
};

Blockly.Blocks["invite_invitecreated"] = {
  init: function () {
    this.appendDummyInput().appendField("When an invite is created");
    this.appendStatementInput("code").setCheck("default");
    this.setInputsInline(false);
    this.setColour("#CA8A67");
    this.setTooltip("Runs the code inside when an invite is created.");
  },
};

javascriptGenerator.forBlock["invite_invitecreated"] = function (
  block,
  generator,
) {
  var statements_code = generator.statementToCode(block, "code");

  var code = `client.on("inviteCreate", async (inviteEventCreateOrDelete) => {
    ${statements_code}
});\n`;
  return code;
};

Blockly.Blocks["invite_invitedeleted"] = {
  init: function () {
    this.appendDummyInput().appendField("When an invite is deleted");
    this.appendStatementInput("code").setCheck("default");
    this.setInputsInline(false);
    this.setColour("#CA8A67");
    this.setTooltip("Runs the code inside when an invite is deleted.");
  },
};

javascriptGenerator.forBlock["invite_invitedeleted"] = function (
  block,
  generator,
) {
  var statements_code = generator.statementToCode(block, "code");

  var code = `client.on("inviteDelete", async (inviteEventCreateOrDelete) => {
    ${statements_code}
});\n`;
  return code;
};

Blockly.Blocks["invite_event_var"] = {
  init: function () {
    this.appendDummyInput().appendField("the invite created/deleted");
    this.setInputsInline(false);
    this.setColour("#CA8A67");
    this.setOutput(true, "invite");
  },
};

javascriptGenerator.forBlock["invite_event_var"] = function (block, generator) {
  var code = `inviteEventCreateOrDelete`;
  return [code, Order.NONE];
};

Blockly.Blocks["invite_foreach"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("For each invite on server:");
    this.appendStatementInput("code").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#CA8A67");
  },
};

javascriptGenerator.forBlock["invite_foreach"] = function (block, generator) {
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);
  var codeVal = generator.statementToCode(block, "code");

  var code = `${value_server}.invites.cache.forEach(async (inviteForEachInLoop) => {
    ${codeVal}
});\n`;
  return code;
};

Blockly.Blocks["invite_foreach_var"] = {
  init: function () {
    this.appendDummyInput().appendField("current invite on the loop");
    this.setOutput(true, "invite");
    this.setColour("#CA8A67");
  },
};

javascriptGenerator.forBlock["invite_foreach_var"] = function (
  block,
  generator,
) {
  var code = `inviteForEachInLoop`;
  return [code, Order.NONE];
};

Blockly.Blocks["invite_channel_foreach"] = {
  init: function () {
    this.appendValueInput("channel")
      .setCheck("channel")
      .appendField("For each invite on channel:");
    this.appendStatementInput("code").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#CA8A67");
  },
};
javascriptGenerator.forBlock["invite_channel_foreach"] = function (
  block,
  generator,
) {
  var value_channel = generator.valueToCode(block, "channel", Order.ATOMIC);
  var codeVal = generator.statementToCode(block, "code");

  var code = `${value_channel}.fetchInvites(true).then(async (allTheInvites) => {
    allTheInvites.forEach(async (inviteForEachInLoop) => {
    ${codeVal}
    }
});\n`;

  return code;
};

createRestrictions(
  ["invite_create"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel to create the invite for.",
    },
    {
      type: "notEmpty",
      blockTypes: ["uses"],
      message: "You must specify the amount of uses for the invite.",
    },
  ],
);

createRestrictions(
  ["invite_get"],
  [
    {
      type: "validator",
      blockTypes: ["invite"],
      check: (val) => {
        if (val === "") return true;
        try {
          new URL(val);
          return true;
        } catch (_) {
          return false;
        }
      },
      message: "You must include a valid URL",
    },
  ],
);

createRestrictions(
  ["invite_delete"],
  [
    {
      type: "notEmpty",
      blockTypes: ["invite"],
      message: "You must specify the invite to delete.",
    },
  ],
);

createRestrictions(
  ["invite_url"],
  [
    {
      type: "notEmpty",
      blockTypes: ["invite"],
      message: "You must specify the invite to get the URL from.",
    },
  ],
);

createRestrictions(
  ["invite_channel"],
  [
    {
      type: "notEmpty",
      blockTypes: ["invite"],
      message: "You must specify the invite to get the channel from.",
    },
  ],
);

createRestrictions(
  ["invite_author"],
  [
    {
      type: "notEmpty",
      blockTypes: ["invite"],
      message: "You must specify the invite to get the author from.",
    },
  ],
);

createRestrictions(
  ["invite_invitecreated"],
  [
    {
      type: "notEmpty",
      blockTypes: ["code"],
      message: "You must specify the code to run when an invite is created.",
    },
  ],
);

createRestrictions(
  ["invite_invitedeleted"],
  [
    {
      type: "notEmpty",
      blockTypes: ["code"],
      message: "You must specify the code to run when an invite is deleted.",
    },
  ],
);

createRestrictions(
  ["invite_foreach"],
  [
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify the server to iterate invites from.",
    },
  ],
);

createRestrictions(
  ["invite_channel_foreach"],
  [
    {
      type: "notEmpty",
      blockTypes: ["channel"],
      message: "You must specify the channel to iterate invites from.",
    },
  ],
);

createRestrictions(
  ["invite_foreach_var"],
  [
    {
      type: "hasParent",
      blockTypes: ["invite_channel_foreach", "invite_foreach"],
      message:
        'This block must be under a "for each invite on server/channel" block',
    },
  ],
);

createRestrictions(
  ["invite_event_var"],
  [
    {
      type: "hasParent",
      blockTypes: ["invite_invitedeleted", "invite_invitecreated"],
      message:
        'This block must be under a "when an invite is created/deleted" block',
    },
  ],
);
