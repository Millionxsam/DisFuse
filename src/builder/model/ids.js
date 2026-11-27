/* =====================================================================
   DisFuse Builder: ids
   ---------------------------------------------------------------------
   Every command, option, event, step, section and variable gets its id
   in the browser, before it's saved, so the page can show and refer to
   it straight away. The API only checks the format (ops.js).
   ===================================================================== */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 12 random letters and digits. */
export function newId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}
