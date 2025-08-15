import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";

Blockly.Blocks["main_blockcreator"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("New block named:")
      .appendField(new Blockly.FieldTextInput("block_name"), "NAME");
    this.appendStatementInput("INPUTS")
      .setCheck("Input")
      .appendField("With inputs:");
    this.appendDummyInput()
      .appendField("Set inputs:")
      .appendField(
        new Blockly.FieldDropdown([
          ["automatic", "null"],
          ["inline", "true"],
          ["external", "false"],
        ]),
        "INLINE"
      );
    this.appendDummyInput()
      .appendField("Set type to:")
      .appendField(
        new Blockly.FieldDropdown([
          ["no connections", "none"],
          ["↤ output", "output"],
          ["↕ stack", "stack"],
          ["↧ hat block", "hat"],
          ["↥ end block", "end"],
        ]),
        "TYPE"
      );
    this.appendValueInput("OUTPUT")
      .setCheck(["OutputType", "Array"])
      .appendField("Set output type to:")
      .setVisible(false);
    this.appendValueInput("PREVIOUSSTATEMENT")
      .setCheck(["OutputType", "Array"])
      .appendField("Set previous statement to:")
      .setVisible(false);
    this.appendValueInput("NEXTSTATEMENT")
      .setCheck(["OutputType", "Array"])
      .appendField("Set next statement to:")
      .setVisible(false);
    this.appendDummyInput()
      .appendField("Set description to:")
      .appendField(new Blockly.FieldTextInput("description"), "DESCRIPTION");
    this.appendDummyInput()
      .appendField("Set help url to:")
      .appendField(new Blockly.FieldTextInput("url"), "HELPURL");
    this.appendValueInput("COLOR")
      .setCheck("Color")
      .appendField("Set color to:");
    this.appendValueInput("OUTPUTCODE")
      .setCheck("String")
      .appendField("Set output code to:");
    this.setInputsInline(false);
    this.setColour("#00a5ce");
    this.onchange = function () {
      var type = this.getFieldValue("TYPE");
      var fieldType = this.getInput("OUTPUT");
      var fieldPrevious = this.getInput("PREVIOUSSTATEMENT");
      var fieldNext = this.getInput("NEXTSTATEMENT");

      if (type === "output") {
        fieldType.setVisible(true);
        fieldPrevious.setVisible(false);
        fieldNext.setVisible(false);
      } else if (type === "stack") {
        fieldType.setVisible(false);
        fieldPrevious.setVisible(true);
        fieldNext.setVisible(true);
      } else if (type === "hat") {
        fieldType.setVisible(false);
        fieldPrevious.setVisible(false);
        fieldNext.setVisible(true);
      } else if (type === "end") {
        fieldType.setVisible(false);
        fieldPrevious.setVisible(true);
        fieldNext.setVisible(false);
      } else {
        fieldType.setVisible(false);
        fieldPrevious.setVisible(false);
        fieldNext.setVisible(false);
      }

      this.render();
    };
  },
};

javascriptGenerator.forBlock["main_blockcreator"] = function (
  block,
  generator
) {
  var name = block.getFieldValue("NAME") || "block_id_here";
  name = name.replace(/[^A-Za-z0-9_.-]/g, "_");

  var inputs = generator.statementToCode(block, "INPUTS");
  var inline = block.getFieldValue("INLINE");
  var type = block.getFieldValue("TYPE");
  var previousStatement = generator.valueToCode(
    block,
    "PREVIOUSSTATEMENT",
    Order.ATOMIC
  );
  var nextStatement = generator.valueToCode(
    block,
    "NEXTSTATEMENT",
    Order.ATOMIC
  );
  var description = block.getFieldValue("DESCRIPTION");
  var helpurl = block.getFieldValue("HELPURL");
  var color = generator.valueToCode(block, "COLOR", Order.ATOMIC) || null;
  var output = generator.valueToCode(block, "OUTPUT", Order.ATOMIC) || null;

  return `{
        "name": "${name}",
        "outputCode": ${JSON.stringify(
          generator.valueToCode(block, "OUTPUTCODE", Order.ATOMIC) || "null"
        )},
        "inlineInputs": ${inline},
        "type": "${type}",
        "output": ${!output || output === "null" ? "null" : `"${output}"`},
        "previousStatement": ${
          !previousStatement || previousStatement === "null"
            ? "null"
            : `"${previousStatement}"`
        },
        "nextStatement": ${
          !nextStatement || nextStatement === "null"
            ? "null"
            : `"${nextStatement}"`
        },
        "inputs": [${(inputs || "")
          .split("")
          .reverse()
          .join("")
          .replace(",", "")
          .split("")
          .reverse()
          .join("")}],
        "color": "${color}",
        "description": "${description}",
        "helpUrl": "${helpurl}"
    }`;
};
