import { useCallback, useEffect, useRef } from "react";
import * as Blockly from "blockly";

/* =====================================================================
   Autosave
   ---------------------------------------------------------------------
   Saving the open workspace over the socket, reliably.

   The old version was a promise chain with three ways to wedge itself
   permanently and silently:

     - one branch of the acknowledgement handler returned without
       resolving or rejecting, so the promise never settled. Because
       saves were chained (`queue = queue.then(...)`), *every* later save
       queued behind a promise that would never settle. Saving stopped,
       with no error and no indication;
     - the success path wrote to a DOM element without checking it was
       there. A throw inside a socket acknowledgement is outside the
       `try` around `emit`, so it wedged the queue the same way;
     - there was no timeout. A dropped acknowledgement — which is what a
       reconnect looks like — wedged it again.

   So: every path settles, there is a timeout on every save, and the
   queue cannot be poisoned by one failure. On top of that a save now
   also happens on a timer and when the page is being closed, rather than
   only every N changes — the last one or two edits before someone shut
   the tab were previously never sent at all.
   ===================================================================== */

/** How long to wait for the server to acknowledge a save. */
const ACK_TIMEOUT_MS = 20_000;
/** Quiet time after the last change before saving anyway. */
const IDLE_SAVE_MS = 2500;

/** Blockly events that don't change the project and must not trigger a save. */
const IGNORED_EVENTS = new Set([
  Blockly.Events.VIEWPORT_CHANGE,
  Blockly.Events.SELECTED,
  Blockly.Events.CLICK,
  Blockly.Events.TOOLBOX_ITEM_SELECT,
  Blockly.Events.TRASHCAN_OPEN,
  Blockly.Events.FINISHED_LOADING,
  Blockly.Events.BLOCK_DRAG,
  Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE,
  Blockly.Events.UI,
  "backpack_change",
]);

/** True for a Blockly event that means the project changed. */
export function isSavableEvent(event) {
  return !IGNORED_EVENTS.has(event?.type);
}

/**
 * Sends one save and waits for the server's answer.
 *
 * Rejects on refusal and on silence. Never leaves the caller waiting.
 */
function emitSave(socket, payload) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;

      reject(
        Object.assign(new Error("The server didn't respond to that save."), {
          timedOut: true,
        }),
      );
    }, ACK_TIMEOUT_MS);

    function finish(fn, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    }

    try {
      socket.emit("projectUpdate", payload, (response) => {
        if (!response)
          return finish(reject, new Error("The server sent an empty reply."));

        if (response.error)
          return finish(
            reject,
            Object.assign(new Error(response.error), {
              /* Carried through so the editor can tell "rejoin and retry"
                 apart from "this project is gone". */
              rejoin: Boolean(response.rejoin),
              reason: response.reason,
              serverError: response.error,
            }),
          );

        finish(resolve, response);
      });
    } catch (error) {
      finish(reject, error);
    }
  });
}

/**
 * @param {object}   options
 * @param {object}   options.socket        the editor socket
 * @param {string}   options.projectId
 * @param {object}   options.workspaceRef  ref to the open sub-workspace
 * @param {object}   options.versionRef    ref to the active version, or null
 * @param {number}   options.changesUntilSave
 * @param {() => void}              options.onSaving
 * @param {(saved: object) => void} options.onSaved
 * @param {(error: Error) => void}  options.onError
 */
export default function useAutosave({
  socket,
  projectId,
  workspaceRef,
  versionRef,
  changesUntilSave = 1,
  onSaving,
  onSaved,
  onError,
}) {
  const blocklyRef = useRef(null);
  const pending = useRef(null);
  const changes = useRef(0);
  const queue = useRef(Promise.resolve());
  const idleTimer = useRef(null);
  const status = useRef("idle");

  /* Read through refs so the change listener never closes over a stale
     callback — this is the same reason the version is a ref. */
  const onSavedRef = useRef(onSaved);
  const onErrorRef = useRef(onError);
  const onSavingRef = useRef(onSaving);
  onSavedRef.current = onSaved;
  onErrorRef.current = onError;
  onSavingRef.current = onSaving;

  /** The Blockly workspace to serialise. Set once it has been injected. */
  const attach = useCallback((workspace) => {
    blocklyRef.current = workspace;
  }, []);

  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = null;
  }, []);

  const save = useCallback(
    (event) => {
      const workspace = blocklyRef.current;
      const target = workspaceRef.current;

      if (!workspace || !socket || !target?._id) return Promise.resolve(null);

      changes.current = 0;
      pending.current = null;
      clearIdleTimer();

      /* Serialised here, at the moment of sending, and addressed to the
         version that is open *now* — never to whichever one a closure
         happened to capture. An empty workspace serialises to `{}`,
         which is a perfectly valid project state and is saved as one. */
      const payload = {
        projectId,
        data: JSON.stringify(Blockly.serialization.workspaces.save(workspace)),
        event,
        workspaceId: target._id,
        ...(versionRef.current?._id
          ? { versionId: String(versionRef.current._id) }
          : {}),
      };

      status.current = "saving";
      onSavingRef.current?.();

      /* One save at a time and in order: two overlapping saves of the
         same workspace can finish out of order and leave the older
         blocks on the server.

         The chain is rebuilt from a *settled* promise every time, so one
         failure can never poison the ones behind it. */
      queue.current = queue.current
        .catch(() => {})
        .then(() => emitSave(socket, payload))
        .then((saved) => {
          status.current = "saved";
          onSavedRef.current?.(saved);
          return saved;
        })
        .catch((error) => {
          status.current = "error";
          onErrorRef.current?.(error);
          /* Swallowed deliberately: the rejection has been reported, and
             letting it escape here would make the next `.then` in the
             chain skip its save. */
          return null;
        });

      return queue.current;
    },
    [clearIdleTimer, projectId, socket, versionRef, workspaceRef],
  );

  /**
   * Records a change, and saves once enough have built up — or once the
   * user stops for a moment.
   */
  const noteChange = useCallback(
    (event) => {
      pending.current = event?.toJson ? event.toJson() : event;
      changes.current += 1;

      if (changes.current >= changesUntilSave) {
        save(pending.current);
        return;
      }

      /* The change-count threshold on its own means the last few edits
         before a pause are never sent. This is what actually makes
         autosave reliable. */
      clearIdleTimer();
      idleTimer.current = setTimeout(() => {
        if (pending.current) save(pending.current);
      }, IDLE_SAVE_MS);
    },
    [changesUntilSave, clearIdleTimer, save],
  );

  /**
   * Saves anything outstanding and waits for every save in flight.
   *
   * Called before the editor is pointed at a different version or tab,
   * so changes can never be written into the version they weren't made
   * in.
   */
  const flush = useCallback(async () => {
    if (pending.current) await save(pending.current);
    await queue.current;
  }, [save]);

  /** Whether there are edits the server hasn't been told about. */
  const hasUnsaved = useCallback(
    () => Boolean(pending.current) || status.current === "saving",
    [],
  );

  /* ---- Leaving the page --------------------------------------------
     There was no unload handling at all, so closing a tab mid-edit
     dropped whatever hadn't reached the threshold.

     `visibilitychange` rather than `beforeunload` for the save itself:
     it is the one browsers actually guarantee on mobile and on tab
     discard. `beforeunload` is kept only to warn, because a socket
     emit during unload is not reliably delivered. */
  useEffect(() => {
    function onHidden() {
      if (document.visibilityState === "hidden" && pending.current)
        save(pending.current);
    }

    function onBeforeUnload(event) {
      if (!pending.current) return;

      save(pending.current);
      event.preventDefault();
      /* Older browsers need a return value to show the prompt. */
      event.returnValue = "";
    }

    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [save]);

  useEffect(() => clearIdleTimer, [clearIdleTimer]);

  return { attach, noteChange, save, flush, hasUnsaved };
}
