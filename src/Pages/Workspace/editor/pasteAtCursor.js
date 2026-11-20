import * as Blockly from "blockly";

/* =====================================================================
   Paste where the cursor is
   ---------------------------------------------------------------------
   The cross-tab copy/paste plugin stores the copied block with the
   coordinates it was copied from, and pastes it back there — usually
   somewhere off screen. This swaps the plugin's "Paste" menu item and
   Ctrl/Cmd+V shortcut for ones that drop the block at the pointer:

     - from the right-click menu, where the menu was opened;
     - from the keyboard, where the mouse currently is over the canvas.

   When the pointer isn't over the canvas (it left, or never arrived),
   the plugin's original behaviour is kept and the block goes back to
   where it was copied from.
   ===================================================================== */

const STASH_KEY = "blocklyStash";
const MENU_ITEM_ID = "blockPasteFromStorage";
const SHORTCUT_NAME = "paste";

/** workspace -> { cursor, menu } in client (screen) coordinates. */
const pointers = new WeakMap();

function readStash() {
  try {
    return JSON.parse(localStorage.getItem(STASH_KEY));
  } catch {
    return null;
  }
}

function toWorkspaceCoordinate(workspace, point) {
  if (!point) return null;
  return Blockly.utils.svgMath.screenToWsCoordinates(
    workspace,
    new Blockly.utils.Coordinate(point.x, point.y),
  );
}

function pasteStash(workspace, point, typeErrorCallback) {
  const stash = readStash();
  if (!stash?.saveInfo) return;

  const coordinate = toWorkspaceCoordinate(workspace, point);

  try {
    if (coordinate) {
      Blockly.clipboard.paste(
        {
          paster: Blockly.clipboard.BlockPaster.TYPE,
          blockState: stash.saveInfo,
          typeCounts: stash.typeCounts,
        },
        workspace,
        coordinate,
      );
    } else {
      workspace.paste(stash.saveInfo);
    }
  } catch (error) {
    if (error instanceof TypeError && typeErrorCallback) typeErrorCallback();
    else throw error;
  }
}

/**
 * Replaces the paste callbacks the plugin registered. Call after
 * `CrossTabCopyPaste.init`.
 */
function overridePasteCallbacks(typeErrorCallback) {
  const menuItem = Blockly.ContextMenuRegistry.registry.getItem(MENU_ITEM_ID);
  if (menuItem)
    menuItem.callback = (scope) =>
      pasteStash(
        scope.workspace,
        pointers.get(scope.workspace)?.menu,
        typeErrorCallback,
      );

  /* `getRegistry` hands back copies, so the shortcut is re-registered
     over itself. Its key mappings are stored separately and stay. */
  const shortcut =
    Blockly.ShortcutRegistry.registry.getRegistry()[SHORTCUT_NAME];
  if (shortcut)
    Blockly.ShortcutRegistry.registry.register(
      {
        ...shortcut,
        callback: (workspace, e) => {
          e.preventDefault();
          pasteStash(
            workspace,
            pointers.get(workspace)?.cursor,
            typeErrorCallback,
          );
          return true;
        },
      },
      true,
    );
}

/**
 * Starts following the pointer over `workspace` and makes pasting use
 * it. Returns a function that stops following it.
 */
export default function enablePasteAtCursor(workspace, typeErrorCallback) {
  overridePasteCallbacks(typeErrorCallback);

  const target = workspace.getParentSvg();
  const state = { cursor: null, menu: null };
  pointers.set(workspace, state);

  const onMove = (e) => {
    state.cursor = { x: e.clientX, y: e.clientY };
  };
  const onDown = (e) => {
    state.cursor = { x: e.clientX, y: e.clientY };
    state.menu = state.cursor;
  };
  const onLeave = () => {
    state.cursor = null;
  };

  target.addEventListener("pointermove", onMove);
  target.addEventListener("pointerdown", onDown, true);
  target.addEventListener("contextmenu", onDown, true);
  target.addEventListener("pointerleave", onLeave);

  return () => {
    target.removeEventListener("pointermove", onMove);
    target.removeEventListener("pointerdown", onDown, true);
    target.removeEventListener("contextmenu", onDown, true);
    target.removeEventListener("pointerleave", onLeave);
    pointers.delete(workspace);
  };
}
