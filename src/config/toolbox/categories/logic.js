import { block, label } from "../helpers.js";

/** Conditionals, comparisons and booleans. Blockly's own core blocks. */
export default {
  kind: "category",
  name: "Logic",
  categorystyle: "logic_category",
  contents: [
    block("controls_if"),
    block("logic_compare"),
    block("logic_equalsExactly"),
    block("logic_operation"),
    block("logic_negate"),
    block("logic_boolean"),
    block("logic_null"),
    block("logic_ternary"),
    block("logic_nullishOperator"),
    label("--------------------------------"),
    block("logic_switch"),
    block("logic_case"),
    block("logic_default"),
    label("--------------------------------")
  ]
};
