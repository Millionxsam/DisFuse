import { useEffect, useState } from "react";

/* =====================================================================
   Which block a preview panel is showing
   ---------------------------------------------------------------------
   One block id, shared between the context menu that opens a preview
   and the panel that draws it. The same shape as the Version Control
   dialog's store, and for the same two reasons: the opener isn't a
   React component, and a module that exports both a component and plain
   functions can't be Fast Refreshed.

   Each kind of preview (message, modal) gets its own store from this
   factory, and each store only ever holds one block. The panels float
   over the canvas, and two of them would cover the blocks they are
   describing — so asking for a second preview replaces the first, and
   closing it leaves the canvas clear until the user asks again.
   ===================================================================== */

export default function createPreviewStore() {
  const listeners = new Set();

  let target = null;

  function publish() {
    for (const listener of listeners) listener(target);
  }

  /** @param {string} blockId the block being previewed */
  function open(blockId) {
    if (!blockId) return;

    target = blockId;
    publish();
  }

  function close() {
    if (target === null) return;

    target = null;
    publish();
  }

  function useTarget() {
    const [blockId, setBlockId] = useState(target);

    useEffect(() => {
      listeners.add(setBlockId);
      /* The target can have changed between this component rendering
         and the effect running — a context menu click does exactly
         that. */
      setBlockId(target);

      return () => {
        listeners.delete(setBlockId);
      };
    }, []);

    return blockId;
  }

  return { open, close, useTarget };
}
