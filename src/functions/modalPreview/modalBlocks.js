/* =====================================================================
   The blocks that show a modal
   ---------------------------------------------------------------------
   A modal reaches the screen through two blocks: "create modal" builds
   it, and "show modal" hands it to Discord. They are usually plugged
   straight into each other, but "create modal" is an ordinary value
   block, so it can just as well be stored in a variable and shown
   further down — and a preview has to cope with both.

   The preview is opened on whichever of the two the user right-clicked
   (or anything inside them). When both are known the show block is the
   one that is kept, because it is the one that says *when* the modal
   appears; the create block is found from it each time the preview
   redraws, so re-plugging a different modal into it just works.
   ===================================================================== */

export const SHOW_BLOCK = "modal_show";
export const CREATE_BLOCK = "modal_create";

/** The events a modal can be opened from, as the preview describes them. */
export const MODAL_EVENTS = {
  slash_received: "Opens when someone uses a slash command.",
  contextMenu_received: "Opens when someone uses a context menu command.",
  buttons_event: "Opens when someone clicks a button.",
  menus_event: "Opens when someone picks from a select menu.",
  modal_handle_interaction: null,
};

/**
 * Blocks that answer the interaction. Discord only accepts a modal as
 * the *first* response, so one of these above "show modal" in the same
 * stack means the modal will never appear.
 */
export const RESPONSE_BLOCKS = new Set([
  "misc_int_deferReply",
  "cv2_replyInteraction",
  "cv2_editReplyInteraction",
  "menus_reply",
  "captcha_replyInteraction",
  // Retired blocks that can still be sitting in an older project.
  "slash_reply",
  "slash_reply_rows",
  "slash_editreply",
  "misc_int_reply",
  "misc_int_reply_rows",
  "misc_int_edit",
]);

export function isModalBlock(block) {
  return block?.type === SHOW_BLOCK || block?.type === CREATE_BLOCK;
}

/**
 * The show or create block that `block` is part of, or null.
 *
 * Walks outwards the same way `findSendBlock` does, so right-clicking a
 * text input three levels deep inside a modal previews that modal. A
 * create block that turns out to be plugged into a show block gives way
 * to the show block.
 */
export function findModalBlock(block) {
  let current = block;
  let create = null;
  let hops = 0;

  while (current && hops < 30) {
    if (current.type === SHOW_BLOCK) return current;
    if (current.type === CREATE_BLOCK && !create) create = current;

    current = current.getSurroundParent();
    hops += 1;
  }

  return create;
}

function usable(block) {
  return Boolean(block) && block.isEnabled() && !block.isInsertionMarker();
}

/**
 * The "create modal" block a show block will display.
 *
 * @returns {{create: object|null, variable: string|null,
 *            ambiguous: boolean}}
 */
export function resolveCreateBlock(show) {
  const plugged = show.getInputTargetBlock("modal");

  if (!plugged) return { create: null, variable: null, ambiguous: false };
  if (plugged.type === CREATE_BLOCK)
    return { create: plugged, variable: null, ambiguous: false };

  if (plugged.type !== "variables_get")
    return { create: null, variable: null, ambiguous: false };

  /* "show modal: [my modal]". Find where that variable was given a
     modal. The assignment in the same event as the show block is the
     one that runs first, so it wins; otherwise any assignment in this
     workspace will do, and the panel says it had to guess. */
  const variableId = plugged.getFieldValue("VAR");
  const variable = plugged.getField("VAR")?.getText() || "variable";

  const assignments = show.workspace
    .getBlocksByType("variables_set", false)
    .filter(
      (set) =>
        usable(set) &&
        set.getFieldValue("VAR") === variableId &&
        set.getInputTargetBlock("VALUE")?.type === CREATE_BLOCK,
    );

  if (!assignments.length) return { create: null, variable, ambiguous: false };

  const root = show.getRootBlock();
  const local = assignments.filter((set) => set.getRootBlock() === root);
  const pool = local.length ? local : assignments;

  return {
    create: pool[0].getInputTargetBlock("VALUE"),
    variable,
    ambiguous: pool.length > 1,
  };
}

/** The event block a show block sits under, if it is under one at all. */
export function findEvent(show) {
  const root = show.getRootBlock();
  return root && root.type in MODAL_EVENTS ? root : null;
}

/**
 * Whether the interaction has already been answered by the time this
 * show block runs. Only the blocks straight above it in the same stack
 * are checked: one tucked inside an `if` might not run, and a warning
 * that is sometimes wrong gets ignored.
 */
export function respondedBefore(show) {
  let current = show;
  let above = show.getPreviousBlock();

  /* `getPreviousBlock` also steps out of a statement input onto the
     block that owns it; that block's *next* isn't `current`, which is
     how the top of the stack is recognised. */
  while (above && above.getNextBlock() === current) {
    if (usable(above) && RESPONSE_BLOCKS.has(above.type)) return above;

    current = above;
    above = above.getPreviousBlock();
  }

  return null;
}
