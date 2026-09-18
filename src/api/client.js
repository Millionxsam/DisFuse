import axios from "axios";

import { apiUrl } from "../config/config.js";
import { redirectToLogin } from "../functions/authRedirect.js";

/* =====================================================================
   The DisFuse API client
   ---------------------------------------------------------------------
   One axios instance for every call to our own API, so three things
   happen in one place instead of at a hundred call sites:

     - the Discord token goes on the request. It used to be written out
       by hand — `localStorage.getItem("disfuse-token")` appeared over a
       hundred times — and was simply forgotten in a couple of places;
     - an expired token sends the user back to Discord *and brings them
       back to the page they were on*, rather than failing silently at
       whichever call noticed first;
     - a failure has one shape, so error handling can stop guessing.

   Only our own API goes through this. Calls to Discord's API use plain
   axios, because attaching a DisFuse header to a Discord request is how
   tokens end up somewhere they shouldn't.
   ===================================================================== */

export const TOKEN_KEY = "disfuse-token";
export const TOKEN_EXPIRY_KEY = "disfuse-token-exp";

/** The stored Discord token, or null. */
export function authToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Has the stored token passed the expiry Discord gave us? */
export function tokenExpired() {
  const expires = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY), 10);
  return !Number.isFinite(expires) || Date.now() > expires;
}

/** Forgets the session. Used when the API tells us the token is no good. */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * A stable id for this browser tab.
 *
 * Lives in sessionStorage, so it survives a refresh and is unique per
 * tab — which is exactly the distinction the editor's duplicate-session
 * check needs. Refreshing a project should not look like opening it
 * twice; opening a second tab should.
 */
export function tabSessionId() {
  const KEY = "disfuse-tab-id";

  let id = sessionStorage.getItem(KEY);

  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }

  return id;
}

/* =====================================================================
   Retrying a connection that never happened
   ---------------------------------------------------------------------
   A request that comes back with no response at all never reached the
   API: the TLS handshake failed, the socket was dropped, the network
   blinked. Chromium browsers make this far more common than it sounds —
   our origin advertises HTTP/3 (`alt-svc: h3=":443"`), and when QUIC is
   blocked or mangled on the way out (a VPN, a corporate proxy, Opera's
   built-in VPN) the browser fails the request outright with
   ERR_SSL_PROTOCOL_ERROR, then falls back to TCP on the next attempt.

   Without a retry, one such blink is the whole session: <Auth> has
   nothing to render but "We couldn't sign you in", and a reload runs
   straight back into the cached alternative service.

   Only failures with no response are retried — a 4xx or 5xx is an answer
   and belongs to the caller. And only requests that are safe to send
   twice: GET/HEAD/OPTIONS always, anything else solely when it asks
   with `retry: true`, because "no response" cannot tell a request the
   server never saw from one whose answer was lost on the way back.
   ===================================================================== */

const RETRY_DELAYS_MS = [400, 1200];
const SAFE_METHODS = ["get", "head", "options"];

function retryable(error) {
  if (error.response || axios.isCancel(error)) return false;
  /* A caller that gave up (unmounted component, replaced request) is not
     a failure to paper over. */
  if (error.config?.signal?.aborted) return false;

  const method = (error.config?.method || "get").toLowerCase();
  return error.config?.retry === true || SAFE_METHODS.includes(method);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const api = axios.create({ baseURL: apiUrl });

api.interceptors.request.use((config) => {
  const token = authToken();
  if (token) config.headers.Authorization = token;

  return config;
});

/* One redirect, however many requests fail at once. */
let reauthenticating = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    /* 401 means Discord no longer accepts the token — it expired, or was
       revoked. Anything else is a real failure the caller should handle;
       a 403 in particular is "you may not do that", not "sign in again".

       A cancelled request has no response at all and must not be
       mistaken for either. */
    if (status === 401 && !reauthenticating && !axios.isCancel(error)) {
      reauthenticating = true;
      clearToken();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

/* Separate from the 401 handler above, and disjoint from it: a request
   that never reached the API has no status for that one to react to. */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!retryable(error)) return Promise.reject(error);

    const config = error.config;
    const attempt = config.retryCount ?? 0;

    if (attempt >= RETRY_DELAYS_MS.length) return Promise.reject(error);

    config.retryCount = attempt + 1;
    /* A little jitter, so a page that fired six requests at once doesn't
       fire all six again on the same millisecond. */
    await wait(RETRY_DELAYS_MS[attempt] + Math.random() * 200);

    return api(config);
  },
);

export default api;

/* ---- Shapes callers actually want -------------------------------------- */

/** The body of a successful response. */
export function data(response) {
  return response.data;
}

/**
 * The message to show a user for a failed request.
 *
 * The API answers `{ error }` for everything it refuses on purpose, so
 * this prefers that over axios's own wording ("Request failed with
 * status code 403"), which is not for reading.
 */
export function errorMessage(error, fallback = "Something went wrong") {
  if (axios.isCancel(error)) return null;

  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}
