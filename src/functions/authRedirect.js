import { authUrl } from "../config/config.js";

/* =====================================================================
   Coming back to where you were
   ---------------------------------------------------------------------
   DisFuse signs in with Discord's implicit grant, and Discord will only
   redirect to a URI registered on the application — a single one, in our
   case `https://disfuse.xyz/projects`. So somebody who opens a link to a
   project while signed out used to be sent to Discord, sent back to
   `/projects`, and left to find the project again themselves.

   The destination is therefore carried through the round trip by us
   rather than by Discord:

     1. before leaving, the intended path is written to sessionStorage
        under a random key, and that key is sent as the OAuth `state`;
     2. Discord returns `state` in the fragment beside the token;
     3. on the way back, the key is looked up, used once, and deleted.

   `state` is a lookup key, never the destination itself. A URL arriving
   from outside is not a URL we will navigate to — the only thing an
   attacker can put in `state` is a key that isn't in this browser's
   sessionStorage, and the answer to that is `/projects`.

   sessionStorage rather than localStorage on purpose: it is per-tab and
   dies with the tab, so a redirect started in one tab cannot redirect
   another.
   ===================================================================== */

const KEY_PREFIX = "disfuse-return-to:";
/** Long enough to sign in, short enough that a forgotten tab won't act on it. */
const TTL_MS = 10 * 60 * 1000;

/** Where an unrecognised or missing destination sends you. */
export const DEFAULT_DESTINATION = "/projects";

/**
 * Is this a path within DisFuse that we're willing to navigate to?
 *
 * Deliberately strict, and deliberately not a URL parser: the only thing
 * accepted is a root-relative path. That rules out
 *
 *   https://evil.example   — a scheme
 *   //evil.example         — protocol-relative, which browsers treat as
 *                            an absolute URL to another host
 *   /\evil.example         — the same trick with a backslash, which some
 *                            browsers normalise into `//`
 *   javascript:…           — a scheme again
 *
 * and leaves query strings and fragments intact, because losing the `?v=`
 * on a version link would defeat the point of this.
 */
export function isSafeDestination(destination) {
  if (typeof destination !== "string" || !destination.length) return false;
  if (destination.length > 2048) return false;

  if (!destination.startsWith("/")) return false;
  if (destination.startsWith("//") || destination.startsWith("/\\"))
    return false;

  /* Control characters can be used to smuggle a line break past a check
     further down the line, and have no business in a path. */
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(destination)) return false;

  return true;
}

/** The current location, as a path this module would accept back. */
export function currentDestination() {
  const { pathname, search, hash } = window.location;

  /* The hash is where Discord puts the token, so a destination captured
     mid-redirect would carry someone's access token into sessionStorage
     — and from there back into a URL. */
  const safeHash = hash.includes("access_token=") ? "" : hash;

  return `${pathname}${search}${safeHash}`;
}

function purgeExpired() {
  const now = Date.now();

  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (!key?.startsWith(KEY_PREFIX)) continue;

    try {
      const { expires } = JSON.parse(sessionStorage.getItem(key));
      if (!expires || now > expires) sessionStorage.removeItem(key);
    } catch {
      sessionStorage.removeItem(key);
    }
  }
}

/**
 * Sends the browser to Discord, remembering where it came from.
 *
 * @param {string} [destination] defaults to wherever the user is now
 */
export function redirectToLogin(destination = currentDestination()) {
  purgeExpired();

  let state = "";

  if (isSafeDestination(destination) && destination !== DEFAULT_DESTINATION) {
    state = crypto.randomUUID();

    try {
      sessionStorage.setItem(
        KEY_PREFIX + state,
        JSON.stringify({ destination, expires: Date.now() + TTL_MS }),
      );
    } catch {
      /* Private browsing, or a full quota. Signing in still works; the
         user simply lands on the project list. */
      state = "";
    }
  }

  window.location.assign(
    state ? `${authUrl}&state=${encodeURIComponent(state)}` : authUrl,
  );
}

/**
 * Where this sign-in was meant to end up, if anywhere.
 *
 * Consumes the stored entry, so a `state` cannot be replayed.
 *
 * @param {string|null} state the `state` Discord handed back
 * @returns {string|null} a safe path, or null to stay where you are
 */
export function consumeReturnDestination(state) {
  if (!state) return null;

  const key = KEY_PREFIX + state;
  const stored = sessionStorage.getItem(key);

  sessionStorage.removeItem(key);

  if (!stored) return null;

  try {
    const { destination, expires } = JSON.parse(stored);

    if (!expires || Date.now() > expires) return null;
    /* Checked again on the way out as well as on the way in: the store
       is only as trustworthy as everything else with access to it. */
    if (!isSafeDestination(destination)) return null;

    return destination;
  } catch {
    return null;
  }
}
