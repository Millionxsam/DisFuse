import * as Blockly from "blockly/core";

/* =====================================================================
   Misc blocks fit everywhere
   ---------------------------------------------------------------------
   Raw code and comment blocks don't belong to any one kind of input:
   raw code is whatever the user writes, and a comment is just a note.
   So they skip connection type checks entirely — they can go into any
   input of any block (e.g. a container's components), and whatever is
   connected to *them* is accepted too, so a component can still sit
   under a raw code block inside that container.

   Only the type check is skipped. Shape still matters: a statement
   block can't plug into a value input and vice versa.
   ===================================================================== */

export const MISC_BLOCK_TYPES = new Set([
  "javascript_raw",
  "javascript_raw_value",
  "javascript_raw_float",
  "comment_stack",
  "comment_multiline",
  "comment_float",
  "comment_statement",
  "comment_stackImage",
  "comment_value",
]);

function isMisc(connection) {
  return MISC_BLOCK_TYPES.has(connection?.getSourceBlock?.()?.type);
}

class MiscConnectionChecker extends Blockly.ConnectionChecker {
  doTypeChecks(a, b) {
    if (isMisc(a) || isMisc(b)) return true;
    return super.doTypeChecks(a, b);
  }
}

/** Makes every workspace injected after this use the checker above. */
export function enableMiscConnections() {
  Blockly.registry.register(
    Blockly.registry.Type.CONNECTION_CHECKER,
    Blockly.registry.DEFAULT,
    MiscConnectionChecker,
    true,
  );
}
