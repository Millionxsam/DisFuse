import createPreviewStore from "./createPreviewStore";

/* Which modal is being previewed. The twin of `messagePreviewStore`:
   the two panels open in the same spot, so the context menu closes one
   before opening the other. */

const store = createPreviewStore();

/** @param {string} blockId a "show modal" or "create modal" block */
export const openModalPreview = store.open;

export const closeModalPreview = store.close;

export const useModalPreviewTarget = store.useTarget;
