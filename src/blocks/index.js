/* =====================================================================
   Registering every DisFuse block
   ---------------------------------------------------------------------
   Every block is made from its element in src/elements: the same
   definition the DisFuse Builder reads, so a block and its builder
   element never drift apart. Importing this module registers them all
   with Blockly (see lib/registerElements.js).

   Every page that injects Blockly (the workspace, the project preview,
   the block-pack preview, the read-only project view) imports this, so
   none of them render a toolbox of blocks that were never defined.
   ===================================================================== */

import * as Blockly from "blockly";
import setHelpUrls from "./lib/setHelpUrls.js";
import { enableComponentLoops } from "./lib/componentLoops.js";
import { enableMiscConnections } from "./lib/miscConnections.js";
import { registerElements } from "./lib/registerElements.js";
/* The database dropdown field the database blocks use. */
import "./lib/databaseNames.js";
import { ELEMENTS } from "../elements/index.js";

registerElements(ELEMENTS);

/* Blockly's English messages spell "colour" the British way. DisFuse is
   written in American English, so its own color blocks say "color".
   Importing "blockly" above loads those messages first; these replace
   them before any block is made. */
Object.assign(Blockly.Msg, {
  COLOUR_BLEND_COLOUR1: "color 1",
  COLOUR_BLEND_COLOUR2: "color 2",
  COLOUR_BLEND_TOOLTIP: "Blends two colors together with a given ratio (0.0 - 1.0).",
  COLOUR_PICKER_TOOLTIP: "Choose a color from the palette.",
  COLOUR_RANDOM_TITLE: "random color",
  COLOUR_RANDOM_TOOLTIP: "Choose a color at random.",
  COLOUR_RGB_TITLE: "color with",
  COLOUR_RGB_TOOLTIP:
    "Create a color with the specified amount of red, green, and blue. All values must be between 0 and 100.",
  NEW_COLOUR_VARIABLE: "Create color variable...",
});

/* The "asynchronous" option on Blockly's own function blocks. It wraps
   their definitions, so it runs after they exist. */
import "./functions.js";

/* Every block now registered gets a Help item pointing at its page on
   the docs site. It runs here, after the glob, because it walks the
   registry rather than being something each definition opts into — see
   lib/setHelpUrls.js. */
setHelpUrls();

/* Loops can go inside a message's components to repeat them. That means
   reaching into loop and component blocks from several files, so it too
   waits until every one of them is registered — see lib/componentLoops.js. */
enableComponentLoops();

/* Raw code and comment blocks skip connection type checks, so they fit
   into any input of any block — see lib/miscConnections.js. */
enableMiscConnections();

/**
 * Block types that still load but are retired from the regular toolbox.
 *
 * Existing projects keep working — a saved workspace referencing one of
 * these deserialises and generates code exactly as it always did — and
 * they are still offered in the toolbox's Legacy category. They live in
 * `blocks/deprecated/`.
 *
 * Kept as a list so the deprecation backlog can be *seen*: it used to be
 * spread across a file called `deprecated.js`, a file whose header
 * declared the whole thing dead, two files whose toolbox categories were
 * commented out, and a handful of definitions orphaned inside live
 * files, with no way to enumerate them.
 */
export { DEPRECATED_TYPES } from "./deprecated/index.js";
