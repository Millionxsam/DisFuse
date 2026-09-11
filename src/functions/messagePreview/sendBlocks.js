/* =====================================================================
   The blocks that send a message
   ---------------------------------------------------------------------
   Every way a DisFuse bot puts a message on screen goes through one of
   these six blocks, and all six build the body the same way: a stack of
   Components V2 blocks in a `components` input, optionally with files
   alongside. What differs is only *where* the message ends up, which is
   what the descriptor below records — the preview says so in its header
   because "reply to the interaction" and "send in #general" look
   different on Discord even when the body is identical.

   Legacy `content`/`embeds` blocks are deliberately absent. They are no
   longer in the toolbox, and a message built from them is not a
   Components V2 message at all.
   ===================================================================== */

export const SEND_BLOCKS = {
  cv2_sendMessage: {
    title: "Send message in channel",
    icon: "fa-paper-plane",
    target: { input: "channel", preposition: "in", fallback: "a channel" },
  },
  cv2_sendDm: {
    title: "Send a DM",
    icon: "fa-envelope",
    target: { input: "member", preposition: "to", fallback: "a user" },
    note: "Direct messages have no server, so server emoji and mentions won't resolve for the reader.",
  },
  cv2_replyMsg: {
    title: "Reply to the message",
    icon: "fa-reply",
    context: "Shown as a reply under the message your bot is answering.",
  },
  cv2_editMsg: {
    title: "Edit a message",
    icon: "fa-pen-to-square",
    target: { input: "message", preposition: "—", fallback: "a message" },
    context:
      "Replaces the whole message. Anything not in these blocks is removed.",
  },
  cv2_replyInteraction: {
    title: "Reply to the interaction",
    icon: "fa-bolt",
    ephemeralInput: "ephemeral",
    context: "The bot's answer to a slash command, button or menu click.",
  },
  cv2_editReplyInteraction: {
    title: "Edit the bot's reply",
    icon: "fa-bolt",
    context: "Replaces a deferred or already-sent interaction reply.",
  },
};

export function isSendBlock(block) {
  return Boolean(block && SEND_BLOCKS[block.type]);
}

/**
 * The message a block belongs to.
 *
 * Right-clicking the text display in the middle of a long message is a
 * perfectly reasonable way to ask "what does this look like?", so the
 * search walks outwards until it finds the block that actually sends
 * something. `getSurroundParent` steps over next-connected siblings, so
 * this climbs out of a stack of components rather than along it.
 */
export function findSendBlock(block) {
  let current = block;
  let hops = 0;

  while (current && hops < 25) {
    if (isSendBlock(current)) return current;
    current = current.getSurroundParent();
    hops += 1;
  }

  return null;
}
