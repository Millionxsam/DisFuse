import { block, label } from "../helpers.js";

/** Raw JavaScript escape hatches, for what blocks can't express. */
export default {
  kind: "category",
  name: "JavaScript",
  colour: "#c93a5e",
  contents: [
    label("Get the type of a value ↓"),
    block("javascript_typeof"),
    label("Run raw javascript ↓"),
    block("javascript_raw"),
    block("javascript_raw_float"),
    block("javascript_raw_value"),
    label("Wait before running code ↓"),
    block("javascript_wait"),
    label("Log to the console ↓"),
    block("javascript_consolelog"),
    block("javascript_consolewarn"),
    block("javascript_consoleerror"),
    block("javascript_consoleclear"),
    label("Encode/decode strings ↓"),
    block("string_binary"),
    label("Ask for user input ↓"),
    block("javascript_consoleinput"),
    label("Try catch ↓"),
    block("javascript_trycatch"),
    block("javascript_trycatchfinally"),
    block("javascript_trycatch_error"),
    label("Program control ↓"),
    block("javascript_exit")
  ]
};
