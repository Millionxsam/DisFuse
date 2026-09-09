import { block, label, shadow } from "../helpers.js";

/** Rate-limiting commands per user, per server or globally. */
export default {
  kind: "category",
  name: "Cooldowns",
  colour: "#FF6E33",
  contents: [
    label("Run a command on cooldown ↓"),
    block("cooldown_check", {
      inputs: {
        duration: { shadow: shadow("math_number", { fields: { NUM: 5000 } }) }
      }
    }),
    label("Check if on cooldown ↓"),
    block("cooldown_has", {
      inputs: {
        command: { shadow: shadow("text") }
      }
    }),
    block("cooldown_get", {
      inputs: {
        command: { shadow: shadow("text") }
      }
    }),
    label("Cooldown actions ↓"),
    block("cooldown_set", {
      inputs: {
        command: { shadow: shadow("text") }
      }
    }),
    block("cooldown_clear", {
      inputs: {
        command: { shadow: shadow("text") }
      }
    }),
    block("cooldown_clearAll")
  ]
};
