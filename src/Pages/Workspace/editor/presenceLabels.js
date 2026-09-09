/* =====================================================================
   "Someone else is editing this block"
   ---------------------------------------------------------------------
   A floating label above whichever block each collaborator has selected.

   The labels are positioned in viewport coordinates against
   `document.body`, so they have to be redrawn whenever the workspace
   moves. That is the whole reason this is wired to a Blockly change
   listener — and the reason the old version was so fragile: it ran on
   every event, read `.avatar` off a user it hadn't checked existed, and
   called `getBoundingClientRect()` on an element that may have just been
   deleted. Either throw happened *inside* a change listener, which took
   the rest of the editor down with it.

   Nothing here throws. A label whose block or user has gone is simply
   not drawn.
   ===================================================================== */

export default function createPresenceLabels(workspace) {
  /** @type {Map<string, string>} user id → the block they're on */
  const selections = new Map();
  /** @type {Map<string, HTMLElement>} user id → its label element */
  const elements = new Map();

  let users = [];
  let frame = null;

  function removeLabel(userId) {
    elements.get(userId)?.remove();
    elements.delete(userId);
  }

  function labelFor(userId) {
    let element = elements.get(userId);
    if (element) return element;

    element = document.createElement("div");
    element.className = "userLabel";
    document.body.appendChild(element);
    elements.set(userId, element);

    return element;
  }

  function draw() {
    frame = null;

    for (const [userId, blockId] of selections) {
      const block = workspace.getBlockById?.(blockId);
      const node = block && document.querySelector(`g[data-id="${block.id}"]`);

      if (!node) {
        removeLabel(userId);
        continue;
      }

      const user = users.find((u) => u.id === userId);

      /* A collaborator who left is no longer in `users`. Their label
         goes with them rather than throwing on `undefined.avatar`. */
      if (!user) {
        removeLabel(userId);
        continue;
      }

      const rect = node.getBoundingClientRect();
      const element = labelFor(userId);

      element.innerHTML = "";

      if (user.avatar) {
        const avatar = document.createElement("img");
        avatar.src = user.avatar;
        avatar.alt = "";
        element.appendChild(avatar);
      }

      element.appendChild(
        document.createTextNode(
          ` ${user.displayName ?? user.username ?? "someone"} is editing`,
        ),
      );

      element.style.top = `${Math.round(rect.top) - 40}px`;
      element.style.left = `${Math.round(rect.left)}px`;
    }
  }

  /* Coalesced to one redraw per frame. Panning fires a change event per
     pointer move, and each of those used to rebuild every label
     synchronously. */
  function schedule() {
    if (frame !== null) return;
    frame = requestAnimationFrame(draw);
  }

  return {
    /** The change listener to register on the workspace. */
    onWorkspaceChange: schedule,

    /** Records where a collaborator is now. */
    select(userId, blockId) {
      if (!userId) return;

      selections.set(userId, blockId);
      schedule();
    },

    /** Forgets a collaborator who left, and removes their label. */
    forget(userId) {
      selections.delete(userId);
      removeLabel(userId);
    },

    /** The collaborators currently in the project, for names and avatars. */
    setUsers(next) {
      users = next ?? [];
      schedule();
    },

    /** Removes every label. Called when the editor is torn down. */
    dispose() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;

      for (const userId of [...elements.keys()]) removeLabel(userId);
      selections.clear();
    },
  };
}
