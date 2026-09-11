import * as Blockly from "blockly";

import { blockDocsUrl } from "../../config/blockDocs.js";

/* =====================================================================
   The "Help" item on a block's right-click menu
   ---------------------------------------------------------------------
   Blockly already has the feature: a block with a `helpUrl` gets a Help
   item in its context menu, and choosing it opens that address in a new
   tab. A block without one gets no Help item at all — which, until this
   file existed, was every block in DisFuse.

   None of the five hundred block definitions say where they are
   documented, and none of them should have to: the docs are organised by
   toolbox category, so "which page documents this block?" is answered by
   the block's type rather than by anything at its definition site.
   config/blockDocs.js answers it, and this walks the registry applying
   the answer.

   It wraps `init` rather than assigning `helpUrl` onto the definition
   object, because Blockly copies the definition onto the block and then
   calls `init`, so anything assigned to the definition is overwritten by
   whatever `init` does.

   The wrapper runs after the block's own `init` and wins. That is
   deliberate for two kinds of block: Blockly's built-ins, which ship
   pointing at the Blockly wiki and Wikipedia — no use to somebody
   building a Discord bot — and a handful of DisFuse blocks carrying a
   help URL of the literal string `"url"`, left over from a block
   template.

   Blocks that genuinely own their help URL — the ones built in the
   Workshop and with BlockBuddy — are registered later than this runs, so
   they are never wrapped. That is the reason this is called once, at
   registration, rather than whenever a workspace is injected.
   ===================================================================== */

/** So that a re-registered block is not wrapped twice. */
const wrapped = new WeakSet();

/**
 * Points every registered block at its page on docs.disfuse.xyz.
 *
 * Call it once, when the blocks are registered — not later, when a
 * user's own blocks are in the registry too.
 */
export default function setHelpUrls() {
  for (const [type, definition] of Object.entries(Blockly.Blocks)) {
    if (!definition || wrapped.has(definition)) continue;

    const url = blockDocsUrl(type);
    if (!url) continue;

    wrapped.add(definition);

    const init = definition.init;

    definition.init = function (...args) {
      init?.apply(this, args);
      this.setHelpUrl(url);
    };
  }
}
