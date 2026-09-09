import { block, shadow } from "../helpers.js";

/** Colour pickers and conversions, for embeds and roles. */
export default {
  kind: "category",
  name: "Colour",
  colour: "#ad794c",
  contents: [
    block("colour_picker"),
    block("colour_convert"),
    block("colour_random"),
    block("colour_rgb", {
      inputs: {
        RED: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 100
            }
          })
        },
        GREEN: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 50
            }
          })
        },
        BLUE: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 0
            }
          })
        }
      }
    }),
    block("colour_blend", {
      inputs: {
        COLOUR1: {
          shadow: shadow("colour_picker", {
            fields: {
              COLOUR: "#ff0000"
            }
          })
        },
        COLOUR2: {
          shadow: shadow("colour_picker", {
            fields: {
              COLOUR: "#3333ff"
            }
          })
        },
        RATIO: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 0.5
            }
          })
        }
      }
    })
  ]
};
