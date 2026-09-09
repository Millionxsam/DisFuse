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
        block("db_get", {
          inputs: {
            id: { shadow: shadow("text") }
          }
        }),
        block("db_has", {
          inputs: {
            id: { shadow: shadow("text") }
          }
        }),
        block("db_all"),
        label("Actions in the database ↓"),
        block("db_set", {
          inputs: {
            id: { shadow: shadow("text") },
            val: { shadow: shadow("text") }
          }
        }),
        block("db_del", {
          inputs: {
            id: { shadow: shadow("text") }
          }
        }),
        block("db_add", {
          inputs: {
            id: { shadow: shadow("text") },
            val: { shadow: shadow("math_number", { fields: { NUM: 1 } }) }
          }
        }),
        block("db_sub", {
          inputs: {
            id: { shadow: shadow("text") },
            val: { shadow: shadow("math_number", { fields: { NUM: 1 } }) }
          }
        }),
        block("db_push", {
          inputs: {
            id: { shadow: shadow("text") },
            val: { shadow: shadow("text") }
          }
        }),
        block("db_clear")
      ]
    }
  ]
};
