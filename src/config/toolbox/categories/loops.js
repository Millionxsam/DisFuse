import { block, shadow } from "../helpers.js";

/** Repetition, and the blocks that break out of it. Blockly core. */
export default {
  kind: "category",
  name: "Loops",
  categorystyle: "loop_category",
  contents: [
    block("controls_repeat_ext", {
      inputs: {
        TIMES: shadow("math_number", {
          fields: {
            NUM: 10
          }
        })
      }
    }),
    block("controls_whileUntil"),
    block("controls_for", {
      inputs: {
        FROM: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 1
            }
          })
        },
        TO: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 10
            }
          })
        },
        BY: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 1
            }
          })
        }
      }
    }),
    block("controls_forEach"),
    block("controls_flow_statements")
  ]
};
