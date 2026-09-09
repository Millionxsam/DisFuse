import { block, label, shadow } from "../helpers.js";

/** Starting the bot, and the top-level events everything else hangs from. */
export default {
  kind: "category",
  name: "Main",
  colour: "#FF6E33",
  contents: [
    label(
      'Looking for the "login with token" block? It\'s been moved to project settings'
    ),
    label("Get the value of a secret ↓"),
    block("main_env", {
      inputs: {
        value: {
          shadow: shadow("text", { fields: { TEXT: "Secret name" } })
        }
      }
    }),
    label("The bot itself, represented as a Discord user ↓"),
    block("main_bot"),
    label("Properties of the bot ↓"),
    block("main_ping"),
    block("main_numberof"),
    block("main_readyAt"),
    label("Events ↓"),
    block("main_ready"),
    label("Actions ↓"),
    block("main_presence", {
      inputs: {
        afk: {
          shadow: shadow("logic_boolean", {
            fields: {
              BOOL: "FALSE"
            }
          })
        },
        activity_name: {
          shadow: shadow("text", {
            fields: {
              TEXT: "Name of activity"
            }
          })
        }
      }
    }),
    block("main_destroy"),
    label("ONLY use the block below if you shutdown the bot first ↓"),
    block("main_botStart")
  ]
};
