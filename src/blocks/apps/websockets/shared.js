import * as Blockly from "blockly";
import { Order } from "blockly/javascript";

/* =====================================================================
   Shared by the four WebSocket block files
   ---------------------------------------------------------------------
   Every connection and server is known by a name ("main" unless the user
   changes it), so a block anywhere in the project can reach it — a
   Discord slash command can broadcast to a server started in "when the
   bot starts", for instance. The name is a plain text field rather than
   an input because it is an identifier, not data.
   ===================================================================== */

export const colours = {
  wsClient: "#4C6EF5",
  wsServer: "#3B5BDB",
  sioClient: "#AE3EC9",
  sioServer: "#862E9C",
};

/** The editable "main" name field. */
export function nameField(value = "main") {
  return new Blockly.FieldTextInput(value);
}

/** The name field's value as a JS string literal. */
export function nameOf(block, field = "NAME") {
  return JSON.stringify(block.getFieldValue(field) || "main");
}

/** A value input's code, or `fallback` when nothing is plugged in. */
export function valueOr(generator, block, input, fallback = '""') {
  return generator.valueToCode(block, input, Order.NONE) || fallback;
}

/** The close codes a WebSocket is allowed to send: 1000 and 3000–4999. */
export const closeCodeTooltip =
  "Close code 1000 means a normal close. Custom codes must be between 3000 and 4999.";
