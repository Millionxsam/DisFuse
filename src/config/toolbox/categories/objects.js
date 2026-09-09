import { block, label, shadow } from "../helpers.js";

/** Key/value objects, for the shapes Discord's API works in. */
export default {
  kind: "category",
  name: "Objects",
  colour: "#BA59CE",
  contents: [
    label("Objects are like lists, but each item has a value"),
    label("Create an object ↓"),
    block("object_new"),
    block("object_addkey"),
    label("Object actions ↓"),
    block("object_setkey", {
      inputs: {
        key: {
          shadow: shadow("text", {
            fields: {
              TEXT: ""
            }
          })
        }
      }
    }),
    block("object_deletekey", {
      inputs: {
        key: {
          shadow: shadow("text", {
            fields: {
              TEXT: ""
            }
          })
        }
      }
    }),
    block("object_stringify"),
    block("object_parse", {
      inputs: {
        string: {
          shadow: shadow("text", {
            fields: {
              TEXT: ""
            }
          })
        }
      }
    }),
    label("Information about object ↓"),
    block("object_getkey", {
      inputs: {
        key: {
          shadow: shadow("text", {
            fields: {
              TEXT: ""
            }
          })
        }
      }
    }),
    block("object_has", {
      inputs: {
        string: {
          shadow: shadow("text", {
            fields: {
              TEXT: ""
            }
          })
        }
      }
    }),
    block("object_length"),
    block("object_keys"),
    block("object_values")
  ]
};
