import { block, label } from "../helpers.js";

/** Notes for the person reading the workspace. They generate nothing. */
export default {
  kind: "category",
  name: "Comments",
  colour: "#476586",
  contents: [
    label("These blocks will also be visible on your code!"),
    block("comment_multiline"),
    block("comment_statement"),
    block("comment_float"),
    block("comment_value", {
      inputs: {
        VALUE: {
          block: block("text", {
            fields: {
              TEXT: "value"
            }
          })
        }
      }
    })
  ]
};
