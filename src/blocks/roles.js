import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["roles_foreach"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("For each role on the server:");
    this.appendStatementInput("code").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#B76489");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["roles_foreachMember"] = {
  init: function () {
    this.appendValueInput("role")
      .setCheck("role")
      .appendField("For each member with the role:");
    this.appendStatementInput("code").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#B76489");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["roles_currentLoopMember"] = {
  init: function () {
    this.appendDummyInput().appendField("current member in loop");
    this.setColour("#B76489");
    this.setOutput("member");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["roles_currentLoopMember"] = function () {
  var code = `member`;
  return [code, Order.NONE];
};

javascriptGenerator.forBlock["roles_foreachMember"] = function (
  block,
  generator
) {
  var role = generator.valueToCode(block, "role", Order.ATOMIC);
  var codeVal = generator.statementToCode(block, "code");

  var code = `${role}.members.cache.forEach(member => {
    ${codeVal}
  });`;
  return code;
};

javascriptGenerator.forBlock["roles_foreach"] = function (block, generator) {
  var server = generator.valueToCode(block, "server", Order.ATOMIC);
  var codeVal = generator.statementToCode(block, "code");

  var code = `${server}.roles.cache.forEach(role => {
    ${codeVal}
  });`;
  return code;
};

Blockly.Blocks["roles_foreach_role"] = {
  init: function () {
    this.appendDummyInput().appendField("current role in loop");
    this.setOutput("role");
    this.setColour("#B76489");
    this.setTooltip("The current role on the server of the loop.");
  },
};

javascriptGenerator.forBlock["roles_foreach_role"] = () => ["role", Order.NONE];

Blockly.Blocks["roles_highest"] = {
  init: function () {
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("role with highest position on the server:");
    this.setOutput("role");
    this.setColour("#B76489");
    this.setTooltip("The role with the highest position on the server.");
  },
};

javascriptGenerator.forBlock["roles_highest"] = function (block, generator) {
  var server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${server}.roles.highest`;
  return [code, Order.NONE];
};

Blockly.Blocks["roles_name"] = {
  init: function () {
    this.appendValueInput("role").setCheck("role").appendField("name of role:");
    this.setColour("#B76489");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setOutput(true, "String");
  },
};

javascriptGenerator.forBlock["roles_name"] = function (block, generator) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var code = `${val_role}.name`;
  return [code, Order.NONE];
};

Blockly.Blocks["roles_position"] = {
  init: function () {
    this.appendValueInput("role")
      .setCheck("role")
      .appendField("position of role:");
    this.setColour("#B76489");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setOutput(true, "Number");
  },
};

javascriptGenerator.forBlock["roles_position"] = function (block, generator) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var code = `${val_role}.position`;
  return [code, Order.NONE];
};

Blockly.Blocks["roles_hexColor"] = {
  init: function () {
    this.appendValueInput("role")
      .setCheck("role")
      .appendField("hex color of role:");
    this.setColour("#B76489");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setOutput(true, "String");
  },
};

javascriptGenerator.forBlock["roles_hexColor"] = function (block, generator) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var code = `${val_role}.hexColor`;
  return [code, Order.NONE];
};

Blockly.Blocks["roles_id"] = {
  init: function () {
    this.appendValueInput("role").setCheck("role").appendField("ID of role:");
    this.setColour("#B76489");
    this.setOutput(true, "String");
  },
};

javascriptGenerator.forBlock["roles_id"] = function (block, generator) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var code = `${val_role}.id`;
  return [code, Order.NONE];
};

Blockly.Blocks["roles_createdAt"] = {
  init: function () {
    this.appendValueInput("role")
      .setCheck("role")
      .appendField("creation date of role:");
    this.setColour("#B76489");
    this.setTooltip("");
    this.setHelpUrl("");
    this.setOutput(true, "date");
  },
};

javascriptGenerator.forBlock["roles_createdAt"] = function (block, generator) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var code = `${val_role}.createdAt`;
  return [code, Order.NONE];
};

Blockly.Blocks["roles_create"] = {
  init: function () {
    this.appendValueInput("name")
      .setCheck("String")
      .appendField("Create new role named:");
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("in server:");
    this.appendValueInput("color").setCheck("Colour").appendField("color:");
    this.appendValueInput("position")
      .setCheck("Number")
      .appendField("position:");
    this.appendValueInput("mentionable")
      .setCheck("Boolean")
      .appendField("can be mentioned?");
    this.appendValueInput("permissions")
      .setCheck(["Array", "permission"])
      .appendField("permissions:");
    this.setColour("#B76489");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["roles_create"] = function (block, generator) {
  var val_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var val_server = generator.valueToCode(block, "server", Order.ATOMIC);
  var val_color = generator.valueToCode(block, "color", Order.ATOMIC);
  var val_position = generator.valueToCode(block, "position", Order.ATOMIC);
  var val_mentionable = generator.valueToCode(
    block,
    "mentionable",
    Order.ATOMIC
  );
  var val_permissions = generator.valueToCode(
    block,
    "permissions",
    Order.ATOMIC
  );
  var code = `${val_server}.roles.create({
  name: ${val_name},
  color: ${val_color || "Default"},
  position: ${val_position || 1},
  mentionable: ${val_mentionable || false}${val_permissions ? `,\npermissions: ${val_permissions}` : ""
    }
});\n`;

  return code;
};

Blockly.Blocks["roles_getone"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("String")
      .appendField("get the role with the")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["id", "id"],
        ]),
        "type"
      )
      .appendField("equal to");
    this.appendValueInput("server")
      .setCheck("server")
      .appendField("on the server");
    this.setOutput(true, "role");
    this.setColour("#B76489");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["roles_getone"] = function (block, generator) {
  var dropdown_type = block.getFieldValue("type");
  var value_value = generator.valueToCode(block, "value", Order.ATOMIC);
  var value_server = generator.valueToCode(block, "server", Order.ATOMIC);

  var code = `${value_server}.roles.cache${dropdown_type === "id"
      ? `.get(${value_value})`
      : `.find(r => r.name == ${value_value})`
    }`;
  return [code, Order.NONE];
};

Blockly.Blocks["roles_delete"] = {
  init: function () {
    this.appendValueInput("role")
      .setCheck("role")
      .appendField("Delete the role:");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    this.setColour("#B76489");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["roles_delete"] = function (block, generator) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var val_reason = generator.valueToCode(block, "reason", Order.ATOMIC);
  var code = `${val_role}.delete(${val_reason});\n`;
  return code;
};

Blockly.Blocks["roles_rename"] = {
  init: function () {
    this.appendValueInput("role").setCheck("role").appendField("Rename role:");
    this.appendValueInput("name").setCheck("String").appendField("new name:");
    this.setColour("#B76489");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["roles_rename"] = function (block, generator) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var val_name = generator.valueToCode(block, "name", Order.ATOMIC);
  var code = `${val_role}.setName(${val_name});\n`;
  return code;
};

Blockly.Blocks["roles_addToMember"] = {
  init: function () {
    this.appendValueInput("role")
      .setCheck(["role", "Array"])
      .appendField("Add role:");
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("to member:");
    this.setColour("#B76489");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["roles_addToMember"] = function (
  block,
  generator
) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var val_member = generator.valueToCode(block, "member", Order.ATOMIC);
  var code = `${val_member}.roles.add(${val_role});\n`;
  return code;
};

Blockly.Blocks["roles_removeFromMember"] = {
  init: function () {
    this.appendValueInput("role")
      .setCheck(["role", "Array"])
      .appendField("Remove role:");
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("from member:");
    this.setColour("#B76489");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["roles_removeFromMember"] = function (
  block,
  generator
) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var val_member = generator.valueToCode(block, "member", Order.ATOMIC);
  var code = `${val_member}.roles.remove(${val_role});\n`;
  return code;
};

Blockly.Blocks["roles_setPermissions"] = {
  init: function () {
    this.appendValueInput("permissions")
      .setCheck(["permission", "Array"])
      .appendField("Set permissions:");
    this.appendValueInput("role").setCheck("role").appendField("to role:");
    this.setColour("#B76489");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["roles_setPermissions"] = function (
  block,
  generator
) {
  var val_role = generator.valueToCode(block, "role", Order.ATOMIC);
  var val_permissions = generator.valueToCode(
    block,
    "permissions",
    Order.ATOMIC
  );
  var code = `${val_role}.setPermissions(${val_permissions});\n`;
  return code;
};

Blockly.Blocks["roles_hasRole"] = {
  init: function () {
    this.appendValueInput("member")
      .setCheck("member")
      .appendField("does member");
    this.appendValueInput("role").setCheck("role").appendField("have the role");
    this.appendDummyInput().appendField("?");
    this.setOutput(true, "Boolean");
    this.setColour("#B76489");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["roles_hasRole"] = function (block, generator) {
  var member = generator.valueToCode(block, "member", Order.ATOMIC);
  var role = generator.valueToCode(block, "role", Order.ATOMIC);

  var code = `${member}._roles.includes(${role}.id)`;
  return [code, Order.NONE];
};

Blockly.Blocks["roles_hasPermission"] = {
  init: function () {
    this.appendValueInput("role").setCheck("role").appendField("does role");
    this.appendValueInput("permission")
      .setCheck("permission")
      .appendField("have the");
    this.appendDummyInput().appendField("?");
    this.setOutput(true, "Boolean");
    this.setColour("#B76489");
  },
};

javascriptGenerator.forBlock["roles_hasPermission"] = function (
  block,
  generator
) {
  var role = generator.valueToCode(block, "role", Order.ATOMIC);
  var permission = generator.valueToCode(block, "permission", Order.ATOMIC);

  var code = `${role}.permissions.has(${permission})`;
  return [code, Order.NONE];
};

createRestrictions(
  ["roles_currentLoopMember"],
  [
    {
      type: "hasParent",
      blockTypes: ["roles_foreachMember"],
      message:
        'This block must be under the "For each member with the role" block',
    },
  ]
);

createRestrictions(
  ["roles_foreachMember"],
  [
    {
      type: "notEmpty",
      blockTypes: ["role"],
      message: "You must specify the role to iterate members from.",
    },
  ]
);

createRestrictions(
  ["roles_foreach_role"],
  [
    {
      type: "hasParent",
      blockTypes: ["roles_foreach"],
      message:
        'This block must be under the "For each role on the server" block',
    },
  ]
);

createRestrictions(
  ["roles_foreach"],
  [
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify the server to iterate roles from.",
    },
  ]
);

createRestrictions(
  ["roles_create"],
  [
    {
      type: "notEmpty",
      blockTypes: ["server"],
      message: "You must specify the server to create the role in.",
    },
    {
      type: "notEmpty",
      blockTypes: ["name"],
      message: "You must specify the name of the role.",
    },
  ]
);

createRestrictions(
  ["roles_delete"],
  [
    {
      type: "notEmpty",
      blockTypes: ["role"],
      message: "You must specify the role to delete.",
    },
  ]
);

createRestrictions(
  ["roles_rename"],
  [
    {
      type: "notEmpty",
      blockTypes: ["role"],
      message: "You must specify the role to rename.",
    },
    {
      type: "notEmpty",
      blockTypes: ["name"],
      message: "You must specify the new name for the role.",
    },
  ]
);

createRestrictions(
  ["roles_addToMember", "roles_removeFromMember"],
  [
    {
      type: "notEmpty",
      blockTypes: ["role"],
      message: "You must specify the role.",
    },
    {
      type: "notEmpty",
      blockTypes: ["member"],
      message: "You must specify the member.",
    },
  ]
);

createRestrictions(
  ["roles_setPermissions"],
  [
    {
      type: "notEmpty",
      blockTypes: ["permissions"],
      message: "You must specify the permissions.",
    },
    {
      type: "notEmpty",
      blockTypes: ["role"],
      message: "You must specify the role to set the permissions to.",
    },
  ]
);

createRestrictions(
  ["roles_hasPermission"],
  [
    {
      type: "notEmpty",
      blockTypes: ["role"],
      message: "You must specify the role to check the permissions from.",
    },
    {
      type: "notEmpty",
      blockTypes: ["permission"],
      message: "You must specify the permission to check.",
    },
  ]
);
