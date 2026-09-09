import { useCallback, useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import { Backpack } from "@blockly/workspace-backpack";
import { WorkspaceSearch } from "@blockly/plugin-workspace-search";
import { ZoomToFitControl } from "@blockly/zoom-to-fit";

import addTooltips from "../../blocks/lib/addTooltips";
import { executeRestrictions } from "../../blocks/lib/restrictions";
import { applyOptionalStyles, buildBlocklyOptions } from "./editor/blocklyOptions.js";
import { isSavableEvent } from "./useAutosave.js";

/* =====================================================================
   The Blockly workspace itself
   ---------------------------------------------------------------------
   Injection, plugins, listeners and — the part that did not exist
   before — teardown.

   **Why the listeners are split.** Blockly fires a change event for
   everything, including `VIEWPORT_CHANGE`, which happens on every frame
   of a scroll or a pan. The old editor ran all of this on every one of
   those events:

     - unregistering and re-registering four context menus;
     - `JSON.stringify` of the backpack into localStorage — a synchronous
       write to disk, per frame;
     - `addTooltips`, which walks every block and calls `setTooltip`
       three times on each;
     - `executeRestrictions`, which walks every block again and runs
       tree searches, including code generation, on some of them.

   On a large project that is what made panning feel broken. None of it
   is needed while the canvas is merely moving, so it now runs only for
   events that actually changed the project, and only once the user
   pauses.
   ===================================================================== */

/** Quiet time before the expensive per-change work runs. */
const HOUSEKEEPING_DELAY_MS = 200;

/**
 * @param {object} options
 * @param {boolean} options.enabled       inject once the project is known
 * @param {object}  options.toolbox
 * @param {object}  options.settings      `user.settings.workspace`
 * @param {object}  options.optimization  `user.settings.optimization`
 * @param {(event: object) => void} options.onProjectChange  a real edit
 * @param {(blockId: string) => void} options.onSelect
 * @param {(event: object) => void} options.onAnyChange      every event
 * @param {(workspace: object) => void} options.onHousekeeping  debounced,
 *   after a real edit — where the block count and warnings are refreshed
 */
export default function useBlocklyEditor({
  enabled,
  toolbox,
  settings,
  optimization,
  onProjectChange,
  onSelect,
  onAnyChange,
  onHousekeeping,
}) {
  const workspaceRef = useRef(null);
  const backpackRef = useRef(null);
  const [ready, setReady] = useState(false);

  /* Callbacks change every render; the listeners must not. */
  const callbacks = useRef({});
  callbacks.current = { onProjectChange, onSelect, onAnyChange, onHousekeeping };

  useEffect(() => {
    if (!enabled || !toolbox) return undefined;

    const container = document.getElementById("workspace");
    if (!container) return undefined;

    const removeStyles = applyOptionalStyles(settings, optimization);

    const workspace = Blockly.inject(
      container,
      buildBlocklyOptions({ toolbox, settings }),
    );

    workspaceRef.current = workspace;
    Blockly.svgResize(workspace);

    /* ---- Plugins -------------------------------------------------- */
    const backpack = new Backpack(workspace, {
      allowEmptyBackpackOpen: false,
      contextMenu: { copyAllToBackpack: true, pasteAllToBackpack: true },
    });
    const search = new WorkspaceSearch(workspace);
    const zoomToFit = new ZoomToFitControl(workspace);

    backpack.init();
    search.init();
    zoomToFit.init();

    backpackRef.current = backpack;

    function persistBackpack() {
      try {
        localStorage.setItem(
          "dfWorkspaceBackpack",
          JSON.stringify(backpack.getContents() || []),
        );
      } catch {
        /* Quota, or private browsing. The backpack still works for this
           session; it just won't be remembered. */
      }
    }

    backpack.onDragEnter = persistBackpack;
    backpack.onDragExit = persistBackpack;
    backpack.onDrop = persistBackpack;

    try {
      const stored = localStorage.getItem("dfWorkspaceBackpack");
      if (stored) backpack.setContents(JSON.parse(stored));
    } catch {
      /* A backpack that won't parse is not worth failing to open a
         project over. */
    }

    /* ---- Listeners ------------------------------------------------ */
    workspace.addChangeListener(Blockly.Events.disableOrphans);

    let housekeepingTimer = null;

    function runHousekeeping() {
      housekeepingTimer = null;
      if (!workspaceRef.current) return;

      addTooltips(workspace);
      executeRestrictions(workspace);
      persistBackpack();
      callbacks.current.onHousekeeping?.(workspace);
    }

    function scheduleHousekeeping() {
      if (housekeepingTimer) clearTimeout(housekeepingTimer);
      housekeepingTimer = setTimeout(runHousekeeping, HOUSEKEEPING_DELAY_MS);
    }

    function onChange(event) {
      /* Cheap, and wanted for every event — this is what redraws the
         collaborator labels while the canvas moves. */
      callbacks.current.onAnyChange?.(event);

      if (event.type === Blockly.Events.SELECTED) {
        callbacks.current.onSelect?.(event.newElementId);
        return;
      }

      if (!isSavableEvent(event)) return;

      callbacks.current.onProjectChange?.(event);
      scheduleHousekeeping();
    }

    workspace.addChangeListener(onChange);

    /* The block count and the restriction warnings should be right
       before the user has touched anything. */
    scheduleHousekeeping();

    setReady(true);

    return () => {
      setReady(false);

      if (housekeepingTimer) clearTimeout(housekeepingTimer);

      workspace.removeChangeListener(onChange);
      workspace.removeChangeListener(Blockly.Events.disableOrphans);

      /* None of this happened before: leaving the editor left an
         injected Blockly instance, three plugins, two stylesheets and
         every listener behind, and going back in created another set. */
      backpack.dispose?.();
      search.dispose?.();
      zoomToFit.dispose?.();

      workspace.dispose();

      workspaceRef.current = null;
      backpackRef.current = null;

      removeStyles();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, toolbox]);

  /**
   * Puts one sub-workspace's blocks on screen.
   *
   * Events are suppressed around the load so it doesn't register as a
   * hundred edits and trigger an immediate save of what was just read.
   */
  const loadBlocks = useCallback((data) => {
    const workspace = workspaceRef.current;
    if (!workspace) return false;

    Blockly.Events.disable();

    try {
      /* An empty workspace is a valid project state, and its saved form
         is the string "{}". Both that and a never-saved empty string end
         up here as "clear the canvas". */
      const parsed = data?.length ? JSON.parse(data) : null;

      if (parsed) Blockly.serialization.workspaces.load(parsed, workspace);
      else workspace.clear();

      return true;
    } catch (error) {
      console.error("Could not load workspace blocks:", error);
      workspace.clear();
      return false;
    } finally {
      /* In a `finally` so a throw can never leave Blockly with events
         permanently disabled — which makes the whole editor inert. */
      Blockly.Events.enable();
    }
  }, []);

  /** Replays a change another editor made, without echoing it back. */
  const applyRemoteEvent = useCallback((serialised) => {
    const workspace = workspaceRef.current;
    if (!workspace || !serialised) return;

    Blockly.Events.disable();

    try {
      Blockly.Events.fromJson(serialised, workspace).run(true);
    } catch (error) {
      /* Was a bare `catch {}`. A replay can legitimately fail — a block
         type the other side has and this one doesn't — and silently
         leaving the two editors diverged is worse than saying so. */
      console.warn("Could not replay a collaborator's change:", error);
    } finally {
      Blockly.Events.enable();
    }
  }, []);

  return { workspaceRef, backpackRef, ready, loadBlocks, applyRemoteEvent };
}
