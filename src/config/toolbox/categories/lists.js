import { block, shadow } from "../helpers.js";

/** Arrays. Blockly core, plus DisFuse's own sorting and filtering. */
export default {
  kind: "category",
  name: "Lists",
  categorystyle: "list_category",
  contents: [
    block("lists_create_with"),
    block("lists_repeat", {
      inputs: {
        NUM: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 5
            }
          })
        }
      }
    }),
    block("lists_length"),
    block("lists_isEmpty"),
    block("lists_indexOf", {
      inputs: {
        VALUE: {
          block: block("variables_get")
        }
      }
    }),
    block("lists_getIndex", {
      inputs: {
        VALUE: {
          block: block("variables_get")
        }
      }
    }),
    block("lists_setIndex", {
      inputs: {
        LIST: {
          block: block("variables_get")
        }
      }
    }),
    block("lists_getSublist", {
      inputs: {
        LIST: {
          block: block("variables_get")
        }
      }
    }),
    block("lists_split", {
      inputs: {
        DELIM: {
          shadow: shadow("text", {
            fields: {
              TEXT: ","
            }
          })
        }
      }
    }),
    block("lists_sort"),
    block("lists_reverse"),
    block("list_merge", {
      inputs: {
        list: {
          block: block("variables_get")
        }
      }
    }),
    block("list_filter", {
      inputs: {
        list: {
          block: block("variables_get")
        },
        method: {
          block: block("logic_compare", {
            inputs: {
              A: {
                block: block("list_filter_item")
              }
            }
          })
        }
      }
    }),
    block("list_find", {
      inputs: {
        list: {
          block: block("variables_get")
        },
        method: {
          block: block("logic_compare", {
            inputs: {
              A: {
                block: block("list_filter_item")
              }
            }
          })
        }
      }
    })
  ]
};
