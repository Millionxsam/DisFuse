import * as Blockly from "blockly";

/* =====================================================================
   Project workspace state, without the backpack
   ---------------------------------------------------------------------
   The backpack plugin registers a global Blockly serializer, so every
   `workspaces.save` carries the saver's backpack and every
   `workspaces.load` clears the backpack and replaces it with whatever
   backpack the state holds. The backpack is per-user and lives in
   localStorage; it has no business in a project, and loading a tab
   that a collaborator saved used to hand you their backpack — which
   the editor then persisted over your own.

   Projects saved before this still have a `backpack` key in their
   data, so it is stripped on the way in as well as on the way out.
   ===================================================================== */

/** A workspace state with the backpack taken out. */
export function withoutBackpack(state) {
  if (!state || typeof state !== "object") return state;

  const { backpack: _backpack, ...rest } = state;
  return rest;
}

/** `workspaces.save`, minus the backpack. */
export function saveWorkspaceState(workspace) {
  return withoutBackpack(Blockly.serialization.workspaces.save(workspace));
}

/**
 * `workspaces.load` that leaves the user's backpack as it was.
 *
 * Deleting the key isn't enough: `load` runs every serializer's `clear`
 * whether or not the state has its key, and the backpack's empties it.
 * So the current contents are put back into the state and reloaded.
 */
export function loadWorkspaceState(state, workspace) {
  const clean = withoutBackpack(state) || {};
  const backpack = workspace.getComponentManager?.().getComponent("backpack");

  if (backpack)
    clean.backpack = backpack.getContents().map((item) => JSON.parse(item));

  Blockly.serialization.workspaces.load(clean, workspace);
}
