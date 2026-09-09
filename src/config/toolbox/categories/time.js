import { block, label, shadow } from "../helpers.js";

/** Timestamps, delays, and Discord's relative-time formatting. */
export default {
  kind: "category",
  name: "Time",
  colour: "#db4b9c",
  contents: [
    label("Get a date ↓"),
    block("time_date_now"),
    block("time_date"),
    block("time_createdate"),
    label("Timestamp creation ↓"),
    block("time_timestampFromDate", {
      inputs: {
        DATE: shadow("time_date")
      }
    }),
    label("Convertion / Operations ↓"),
    block("time_convert", {
      inputs: {
        NUMBER: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 10
            }
          })
        }
      }
    }),
    block("time_operation", {
      inputs: {
        NUMBER: shadow("math_number"),
        DATE: shadow("time_date")
      }
    }),
    block("time_between"),
    label("String convertion ↓"),
    block("time_stringToMS", {
      inputs: {
        TIME: {
          shadow: shadow("text", {
            fields: {
              TEXT: "10m"
            }
          })
        }
      }
    }),
    block("time_msToString", {
      inputs: {
        TIME: {
          shadow: shadow("math_number", {
            fields: {
              NUM: 1000
            }
          })
        },
        LONG: {
          shadow: shadow("logic_boolean", {
            fields: {
              BOOL: "FALSE"
            }
          })
        }
      }
    })
  ]
};
