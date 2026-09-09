import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { apiUrl } from "../../config/config.js";
import { authToken, tabSessionId } from "../../api/client.js";

/* =====================================================================
   The editor's connection to the project
   ---------------------------------------------------------------------
   Owns the socket: joining, rejoining, presence, and relaying the events
   the editor cares about.

   The single most important thing here is the rejoin.

   socket.io reconnects on its own after any network blip, but the
   reconnected socket is a *new* connection to the server — new id, in no
   room, with none of the per-connection state the API keeps. The old
   editor never re-emitted `projectJoin`, so from the first blip onwards
   every autosave came back "Project does not exist" and the user was
   shown an error about a project that was fine. Only a reload fixed it.

   `socket.on("connect", join)` is the fix, and it is why the API's
   `projectJoin` is safe to call more than once on the same socket.
   ===================================================================== */

/**
 * @param {string} projectId
 * @param {object} handlers
 * @param {(payload: object) => void} handlers.onRemoteUpdate  someone else saved
 * @param {(payload: object) => void} handlers.onRemoteSelect   someone else selected a block
 * @param {(payload: object) => void} handlers.onServerError    a socket-level error
 */
export default function useProjectSession(projectId, handlers = {}) {
  const [state, setState] = useState({
    status: "connecting",
    project: null,
    activeUsers: [],
    error: null,
  });

  const socketRef = useRef(null);
  /* Handlers change on every render of the page; a ref keeps the socket
     listeners stable so they are registered exactly once. */
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  /* The join is retried on every `connect`. This distinguishes the first
     one — which drives the loading screen — from later ones, which must
     not throw the user back to a spinner mid-edit. */
  const joinedOnce = useRef(false);

  useEffect(() => {
    if (!projectId) return undefined;

    const socket = io(apiUrl, {
      auth: {
        token: authToken(),
        /* Identifies the tab, not the connection. The API uses it to
           tell a refresh (same tab, take over the old socket) from a
           genuine second session (different tab, refuse). */
        sessionId: tabSessionId(),
      },
      reconnectionDelay: 500,
      reconnectionDelayMax: 8000,
    });

    socketRef.current = socket;

    let disposed = false;

    function join() {
      socket.emit("projectJoin", { projectId }, (project, activeUsers) => {
        if (disposed) return;

        const error = project?.error || activeUsers?.error;

        if (error) {
          setState({
            status: "error",
            project: null,
            activeUsers: [],
            error,
          });
          return;
        }

        joinedOnce.current = true;

        setState({
          status: "ready",
          project,
          activeUsers: Array.isArray(activeUsers) ? activeUsers : [],
          error: null,
        });
      });
    }

    /* Fires on the first connection and on every reconnection.

       Safe to emit this immediately: the API authenticates in Socket.IO
       middleware, so its `projectJoin` listener is registered before the
       connection is handed to us. It was not always — see the note in
       the API's functions/registerWebSocket.js. */
    socket.on("connect", join);

    /* A refusal from the server's auth middleware arrives here rather
       than as an `error` event, and socket.io stops reconnecting after
       it. Without this the page had nothing to show for a rejected
       login but a spinner. */
    socket.on("connect_error", (error) => {
      if (disposed) return;

      /* Still `active` means socket.io is going to retry — a transport
         failure rather than a refusal, so it isn't news yet. */
      if (socket.active) {
        if (joinedOnce.current)
          setState((current) => ({ ...current, status: "reconnecting" }));
        return;
      }

      setState({
        status: "error",
        project: null,
        activeUsers: [],
        error: error?.message || "Could not connect to the editor",
      });
    });

    socket.on("disconnect", (reason) => {
      if (disposed) return;

      console.log("Editor socket disconnected:", reason);

      /* "io server disconnect" means the server hung up deliberately and
         will not reconnect us — a duplicate session, or a ban. Anything
         else is transient and socket.io is already retrying. */
      if (reason === "io server disconnect") return;

      if (joinedOnce.current)
        setState((current) => ({ ...current, status: "reconnecting" }));
    });

    socket.on("error", (payload) => {
      handlersRef.current.onServerError?.(payload);
    });

    socket.on("projectClosed", ({ reason }) => {
      if (disposed) return;

      setState({
        status: "error",
        project: null,
        activeUsers: [],
        error: reason || "This project is no longer available",
      });
    });

    socket.on("projectJoin", ({ user }) => {
      setState((current) =>
        current.activeUsers.some((u) => u.id === user.id)
          ? current
          : { ...current, activeUsers: [...current.activeUsers, user] },
      );
    });

    socket.on("projectLeave", ({ user }) => {
      setState((current) => ({
        ...current,
        activeUsers: current.activeUsers.filter((u) => u.id !== user.id),
      }));

      handlersRef.current.onUserLeave?.(user);
    });

    socket.on("projectUpdate", (payload) => {
      handlersRef.current.onRemoteUpdate?.(payload);
    });

    socket.on("blockSelect", (payload) => {
      handlersRef.current.onRemoteSelect?.(payload);
    });

    return () => {
      disposed = true;
      /* Every listener, not just the ones named above — otherwise a
         remount stacks a second set on a socket that outlives it. */
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId]);

  /** Tells collaborators which block this user is on. */
  const announceSelection = useCallback((blockId) => {
    socketRef.current?.emit("blockSelect", { blockId });
  }, []);

  /** Replaces the project the page is working with, after a save or a switch. */
  const setProject = useCallback((update) => {
    setState((current) => ({
      ...current,
      project:
        typeof update === "function" ? update(current.project) : update,
    }));
  }, []);

  return {
    ...state,
    socket: socketRef.current,
    announceSelection,
    setProject,
  };
}
