import { block, label, shadow } from "../helpers.js";

/** Persistent storage for bots that need to remember things. */
export default {
  kind: "category",
  name: "Databases",
  colour: "C66953",
  contents: [
    {
      kind: "category",
      name: "Simple",
      colour: "C66953",
      contents: [
        label("Create a database first ↓"),
        block("db_create"),
        label("Get information from the database ↓"),
        block("db_get_v2", {
          inputs: {
            id: { shadow: shadow("text") }
          }
        }),
        block("db_has_v2", {
          inputs: {
            id: { shadow: shadow("text") }
          }
        }),
        block("db_all_v2"),
        label("Actions in the database ↓"),
        block("db_set_v2", {
          inputs: {
            id: { shadow: shadow("text") },
            val: { shadow: shadow("text") }
          }
        }),
        block("db_del_v2", {
          inputs: {
            id: { shadow: shadow("text") }
          }
        }),
        block("db_add_v2", {
          inputs: {
            id: { shadow: shadow("text") },
            val: { shadow: shadow("math_number", { fields: { NUM: 1 } }) }
          }
        }),
        block("db_sub_v2", {
          inputs: {
            id: { shadow: shadow("text") },
            val: { shadow: shadow("math_number", { fields: { NUM: 1 } }) }
          }
        }),
        block("db_push_v2", {
          inputs: {
            id: { shadow: shadow("text") },
            val: { shadow: shadow("text") }
          }
        }),
        block("db_clear_v2")
      ]
    }
  ]
};
