/* =====================================================================
   Loops inside a message's components
   ---------------------------------------------------------------------
   The block types that may sit in a "components" section (or inside a
   container, media gallery, interactive row or menu) to repeat whatever
   is put inside them. Kept free of imports so restrictions.js and the
   message preview can read it without pulling in the generators.

   `controls_if` isn't a loop, but it is just as see-through: a text
   display inside it is still a component of the message, it only might
   not be there. It comes for free from the same machinery.
   ===================================================================== */

/** Loop type → the statement input(s) that hold the repeated blocks. */
export const COMPONENT_LOOP_INPUTS = {
  // Blockly core
  controls_repeat_ext: ["DO"],
  controls_repeat: ["DO"],
  controls_whileUntil: ["DO"],
  controls_for: ["DO"],
  controls_forEach: ["DO"],
  controls_if: null, // DO0, DO1… and ELSE, depending on the mutation

  // DisFuse
  server_getall: ["code"],
  member_foreach: ["code"],
  roles_foreach: ["code"],
  roles_foreachMember: ["code"],
  channel_foreach: ["code"],
  emoji_getallinserver: ["code"],
  sticker_getallinserver: ["code"],
  invite_foreach: ["code"],
  invite_channel_foreach: ["code"],
  msg_get_reactions: ["code"],
  fs_readdir: ["doo"],
  ws_server_forEachClient: ["code"],
  ws_server_forEachInGroup: ["code"],
  sio_server_forEachClient: ["code"],
  sio_server_forEachInRoom: ["code"],
  github_forEachRepo: ["code"],
  github_searchRepos: ["code"],
  github_forEachIssue: ["code"],
  github_forEachPullRequest: ["code"],
  github_forEachCommit: ["code"],
  github_forEachRelease: ["code"],
};

export const COMPONENT_LOOP_TYPES = Object.keys(COMPONENT_LOOP_INPUTS);

export function isComponentLoop(block) {
  return Boolean(block && COMPONENT_LOOP_INPUTS[block.type] !== undefined);
}

/** Connection checks a loop takes on so component blocks can go in it. */
export const COMPONENT_CHECKS = [
  "rootComponents",
  "containerComponents",
  "cv2galleryitem",
];

/** The blocks that send a Components V2 message. */
export const CV2_SEND_TYPES = [
  "cv2_sendMessage",
  "cv2_sendDm",
  "cv2_replyInteraction",
  "cv2_replyMsg",
  "cv2_editReplyInteraction",
  "cv2_updateInteraction",
  "cv2_editMsg",
];

/**
 * Blocks that build a list out of the blocks stacked in one of their
 * statement inputs, and the input that is.
 */
export const COMPONENT_OWNER_INPUTS = {
  ...Object.fromEntries(CV2_SEND_TYPES.map((type) => [type, "components"])),
  cv2_container: "components",
  cv2_mediaGallery: "items",
  misc_addrow: "components",
  menus_add: "options",
};

/** Blocks that are one entry of an owner's list. */
export const COMPONENT_ITEM_TYPES = [
  "cv2_textDisplay",
  "cv2_separator",
  "cv2_section_thumbnail",
  "cv2_section_button",
  "cv2_mediaGallery",
  "cv2_container",
  "cv2_file",
  "cv2_mediaGalleryItem",
  "misc_addrow",
  "buttons_add",
  "menus_add",
  "menus_addChannelMenu",
  "menus_addRoleMenu",
  "menus_addMentionableMenu",
  "menus_addUserMenu",
  "menus_addoption",
];

/**
 * The block whose statement input holds `block`'s stack, and that input.
 * `getPreviousBlock` is either the sibling above or, at the top of a
 * stack, the block the stack hangs off — telling them apart is the
 * `getNextBlock` comparison.
 */
function stackHolder(block) {
  let first = block;
  let prev = first.getPreviousBlock();

  while (prev && prev.getNextBlock() === first) {
    first = prev;
    prev = first.getPreviousBlock();
  }

  if (!prev) return null;

  const input = prev.getInputWithBlock(first);
  return input ? { parent: prev, input } : null;
}

/**
 * The block whose list `block` ends up in, looking through any loops
 * between them — or null when it isn't in one (say, a text display in a
 * loop at the top of an event, or in a message's "then" section).
 */
export function findComponentOwner(block) {
  let current = block;

  for (let hops = 0; current && hops < 50; hops += 1) {
    const holder = stackHolder(current);
    if (!holder) return null;

    const { parent, input } = holder;
    const ownerInput = COMPONENT_OWNER_INPUTS[parent.type];

    if (ownerInput) return input.name === ownerInput ? parent : null;
    if (!isComponentLoop(parent)) return null;

    current = parent;
  }

  return null;
}
