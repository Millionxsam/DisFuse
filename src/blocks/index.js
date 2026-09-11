/* =====================================================================
   Registering every DisFuse block
   ---------------------------------------------------------------------
   Each file under `blocks/` registers itself with Blockly when it loads:
   it assigns to `Blockly.Blocks[type]` and to
   `javascriptGenerator.forBlock[type]`, and declares its restrictions.
   None of them export anything the app calls — loading them *is* the
   registration.

   That is why this is a glob rather than a list of imports. The
   alternative is a barrel with two hundred lines that has to be edited
   every time a block file is added, and which silently breaks a whole
   category the first time somebody forgets.

   The important part is that this module exists at all. The glob used to
   sit inline in the workspace page, which meant every *other* place that
   injects Blockly — the project preview, the block-pack preview, the
   read-only project view — rendered a toolbox full of block types that
   had never been defined. Those pages import this instead.

   `eager: true` because a block definition has to exist before a saved
   workspace referencing it is loaded; there is no point at which it
   would be safe to still be fetching them.
   ===================================================================== */

import setHelpUrls from "./lib/setHelpUrls.js";

import.meta.glob(["./**/*.js", "!./index.js", "!./deprecated/index.js"], {
  eager: true,
});

/* Every block now registered gets a Help item pointing at its page on
   the docs site. It runs here, after the glob, because it walks the
   registry rather than being something each definition opts into — see
   lib/setHelpUrls.js. */
setHelpUrls();

/**
 * Block types that still load but are no longer in the toolbox.
 *
 * Existing projects keep working — a saved workspace referencing one of
 * these deserialises and generates code exactly as it always did — but
 * nobody can drag a new one out. They live in `blocks/deprecated/`.
 *
 * Kept as a list so the deprecation backlog can be *seen*: it used to be
 * spread across a file called `deprecated.js`, a file whose header
 * declared the whole thing dead, two files whose toolbox categories were
 * commented out, and a handful of definitions orphaned inside live
 * files, with no way to enumerate them.
 */
export { DEPRECATED_TYPES } from "./deprecated/index.js";
