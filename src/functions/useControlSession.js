import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

import { apiUrl } from "../config/config";

/* =====================================================================
   The Control session
   ---------------------------------------------------------------------
   One hook for the whole real-time side of Control: it connects, keeps
   the connection alive across drops, and gives the page three things —
   the session snapshot, a subscription to Discord events, and `action()`
   for asking the bot to do something.

   It connects to the API's `/control` NAMESPACE, which is a different
   namespace from the one project autosave uses. Socket.IO shares a
   single underlying transport between namespaces on the same host, so
   this costs no extra connection, and nothing about autosave changes.

   Authorisation is entirely the backend's. This hook sends the DisFuse
   session token and a project ID; the API decides whether the caller
   owns that bot and has Premium, and it re-checks on a timer. Anything
   this hook believes about permissions is for greying out buttons.
   ===================================================================== */

/**
 * @param {string} projectId  which of the user's own bots to control
 * @param {{onEvent?: (event: {type: string, data: object}) => void}} handlers
 */
export default function useControlSession(projectId, { onEvent } = {}) {
  const [status, setStatus] = useState("connecting");
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  /** Set when the failure is one retrying can't fix (not premium, not owner). */
  const [fatal, setFatal] = useState(false);

  const socketRef = useRef(null);
  const handlerRef = useRef(onEvent);
  const [attempt, setAttempt] = useState(0);

  /* The page re-creates its event handler on most renders; keeping it in
     a ref means the socket is built once per bot instead of per render. */
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!projectId) return undefined;

    let cancelled = false;

    const socket = io(`${apiUrl}/control`, {
      auth: { token: localStorage.getItem("disfuse-token") },
      /* Control is interactive: a reconnect should feel instant, and
         then back off rather than hammering a server that's down. */
      reconnectionDelay: 500,
      reconnectionDelayMax: 8000,
      timeout: 20000,
    });

    socketRef.current = socket;

    /** Joining is done on every connect, not just the first. */
    const join = () => {
      setStatus((current) => (current === "ready" ? "ready" : "connecting"));

      socket.emit("control:join", { projectId }, (response) => {
        if (cancelled) return;

        if (!response?.ok) {
          setError(response?.error || "Couldn't open Control for this bot.");
          /* Ownership and premium failures are settled — retrying the
             socket forever would just spin. A Discord-side problem
             (bot offline, token rejected) is worth a retry button. */
          setFatal(Boolean(response?.premiumRequired) || !response?.reason);
          setStatus("error");
          return;
        }

        setSession(response.session);
        setError(null);
        setFatal(false);
        setStatus(response.session?.status === "ready" ? "ready" : "connecting");
      });
    };

    socket.on("connect", join);

    socket.on("disconnect", (reason) => {
      if (cancelled) return;

      /* An explicit server-side disconnect isn't coming back on its own. */
      if (reason === "io server disconnect") {
        setStatus("error");
        return;
      }

      setStatus("reconnecting");
    });

    socket.on("connect_error", (err) => {
      if (cancelled) return;

      setError(err?.message || "Couldn't connect to DisFuse.");
      /* `socket.active` is false when the server refused us outright —
         a middleware rejection, i.e. sign-in, ban or Premium. */
      setFatal(!socket.active);
      setStatus(socket.active ? "reconnecting" : "error");
    });

    /* Premium lapsed or the account was banned mid-session. */
    socket.on("control:revoked", (payload) => {
      if (cancelled) return;

      setError(payload?.error || "Your Control session ended.");
      setFatal(true);
      setStatus("error");
    });

    socket.on("control:status", (payload) => {
      if (cancelled) return;

      setSession((current) => ({ ...(current || {}), ...payload }));
      if (payload?.status === "ready") setStatus("ready");
      else if (payload?.status === "failed") {
        setError(payload.detail || "This bot couldn't connect to Discord.");
        setStatus("error");
      }
    });

    /* The bot re-identified with Discord: the backend threw its cache
       away and rebuilt it, and this carries the whole new picture. It
       replaces the session rather than merging into it, so the page sees
       a fresh `guilds` array and resets its own state from it. */
    socket.on("control:reset", (payload) => {
      if (cancelled) return;

      setSession(payload);
      setStatus("ready");
    });

    socket.on("control:resumed", (payload) => {
      if (cancelled) return;

      setSession((current) => ({ ...(current || {}), ...payload }));
      setStatus("ready");
    });

    socket.on("control:event", (event) => {
      if (cancelled) return;
      handlerRef.current?.(event);
    });

    return () => {
      cancelled = true;
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, attempt]);

  /**
   * Asks the bot to do something.
   *
   * Resolves with the action's data, and REJECTS with an Error carrying
   * the API's own message so callers can show it as-is — that message is
   * usually Discord's reason for refusing, translated.
   */
  const action = useCallback((type, params = {}) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;

      if (!socket?.connected) {
        reject(new Error("You're not connected to DisFuse right now."));
        return;
      }

      let settled = false;

      /* Socket.IO acknowledgements have no timeout of their own, and a
         dropped ack would leave a button spinning forever. Uploads get a
         longer one — 25 MB over a slow connection is not a stuck
         request. */
      const uploading = Array.isArray(params.files) && params.files.length > 0;

      const timer = setTimeout(
        () => {
          if (settled) return;
          settled = true;
          reject(new Error("That took too long. Please try again."));
        },
        uploading ? 180000 : 30000,
      );

      socket.emit("controlAction", { type, ...params }, (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (response?.ok) return resolve(response.data ?? {});

        const err = new Error(response?.error || "That action failed.");
        err.status = response?.status;
        err.code = response?.code;
        err.unsupported = Boolean(response?.unsupported);
        reject(err);
      });
    });
  }, []);

  /**
   * Tells the backend which server and channel are on screen.
   *
   * This is what scopes the event stream: without it a bot in a thousand
   * servers would push every message in every one of them at the browser.
   */
  const view = useCallback((scope) => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket?.connected) return resolve(null);

      socket.emit("control:view", scope, (response) =>
        resolve(response?.ok ? response : null),
      );
    });
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setFatal(false);
    setStatus("connecting");
    setAttempt((n) => n + 1);
  }, []);

  return useMemo(
    () => ({ status, session, error, fatal, action, view, retry }),
    [status, session, error, fatal, action, view, retry],
  );
}
