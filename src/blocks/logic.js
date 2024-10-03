import * as Blockly from "blockly";
import javascript, { Order } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks["logic_switch"] = {
  init: function () {
    this.appendValueInput("switch").appendField("Check");
    this.appendStatementInput("cases").setCheck("case");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("4192E9");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["logic_case"] = {
  init: function () {
    this.appendValueInput("case").appendField("If it =");
    this.appendStatementInput("code").appendField("then");
    this.setPreviousStatement(true, "case");
    this.setNextStatement(true, "case");
    this.setColour("4192E9");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["logic_default"] = {
  init: function () {
    this.appendDummyInput().appendField("If none of the above");
    this.appendStatementInput("code").appendField("then");
    this.setPreviousStatement(true, "case");
    this.setNextStatement(true, "case");
    this.setColour("4192E9");
    this.setHelpUrl("");
  },
};

javascript.javascriptGenerator.forBlock["logic_switch"] = function (
  block,
  generator
) {
  var switchValue = generator.valueToCode(block, "switch", Order.ATOMIC);
  var statement = generator.statementToCode(block, "cases");

  var code = `switch(${switchValue || "false"}) {
        ${statement}
    }`;
  return code;
};

javascript.javascriptGenerator.forBlock["logic_case"] = function (
  block,
  generator
) {
  var caseValue = generator.valueToCode(block, "case", Order.ATOMIC);
  var statement = generator.statementToCode(block, "code");

  var code = `case ${caseValue || null}:
    ${statement}
    break;
    `;
  return code;
};

javascript.javascriptGenerator.forBlock["logic_default"] = function (
  block,
  generator
) {
  var statement = generator.statementToCode(block, "code");

  var code = `default:
    ${statement}
    break;
    `;
  return code;
};

createRestrictions(
  ["logic_case", "logic_default"],
  [
    {
      type: "surroundParent",
      blockTypes: ["logic_switch"],
      message: "This block must be under a 'check' block",
    },
  ]
);
