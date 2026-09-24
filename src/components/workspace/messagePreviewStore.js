import createPreviewStore from "./createPreviewStore";

/* Which message is being previewed. See `createPreviewStore` for why
   this is a store rather than React state, and why there is only ever
   one. */

const store = createPreviewStore();

/** @param {string} blockId the block that sends the message */
export const openMessagePreview = store.open;

export const closeMessagePreview = store.close;

export const useMessagePreviewTarget = store.useTarget;
