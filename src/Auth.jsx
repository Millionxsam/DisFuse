import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import LoadingAnim from "./components/LoadingAnim";
import { userCache } from "./cache.ts";
import api, {
  TOKEN_EXPIRY_KEY,
  TOKEN_KEY,
  authToken,
  data,
  tokenExpired,
} from "./api/client.js";
import {
  consumeReturnDestination,
  redirectToLogin,
} from "./functions/authRedirect.js";

/* =====================================================================
   Signing in
   ---------------------------------------------------------------------
   Wraps every page that needs a signed-in user. It does three things, in
   this order:

     1. picks the token out of the URL fragment, where Discord's implicit
        grant leaves it after a redirect;
     2. sends the user to Discord if there is no usable token;
     3. loads the user into `userCache` before rendering its children.

   Step 1 is also where a redirect finishes: `state` comes back in the
   same fragment, and functions/authRedirect.js turns it back into the
   page the user was trying to open.

   Nothing below renders its children until the user is loaded, so
   everything downstream can rely on `userCache.user` being there —
   which the previous version could not promise.
   ===================================================================== */

/* One shared load, however many places mount <Auth>.

   Moving from the dashboard into the editor unmounts one <Auth> and
   mounts another, and without this that would be a second round trip for
   an answer we already have. The previous version guarded this with a
   twenty-second timestamp, which had the opposite failure: a mount
   inside the window skipped the fetch *and* rendered with `userCache.user`
   still null. Sharing the promise gets the saving without the hole. */
const FRESH_FOR_MS = 20_000;
let inflight = null;
let loadedAt = 0;

function loadUser() {
  if (inflight && userCache.user && Date.now() - loadedAt < FRESH_FOR_MS)
    return inflight;

  loadedAt = Date.now();

  inflight = Promise.all([
    api.post("/users").then(data),
    api.get("/users/staff").then(data),
  ])
    .then(([user, staff]) => {
      userCache.user = user;
      userCache.isStaff = (staff.users ?? []).some((s) => s.id === user.id);
      return user;
    })
    .catch((error) => {
      /* A failed load must not be remembered as a good one. */
      inflight = null;
      loadedAt = 0;
      throw error;
    });

  return inflight;
}

/** Reads the OAuth response Discord left in the URL fragment. */
function readFragment() {
  const params = new URLSearchParams(window.location.hash.slice(1));

  return {
    tokenType: params.get("token_type"),
    accessToken: params.get("access_token"),
    expiresIn: params.get("expires_in"),
    state: params.get("state"),
  };
}

export default function Auth({ children }) {
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();
  /* StrictMode mounts effects twice in development; signing in twice
     would consume the `state` on the first pass and lose the
     destination on the second. */
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    const fragment = readFragment();

    if (fragment.tokenType && fragment.accessToken && fragment.expiresIn) {
      localStorage.setItem(
        TOKEN_KEY,
        `${fragment.tokenType} ${fragment.accessToken}`,
      );
      localStorage.setItem(
        TOKEN_EXPIRY_KEY,
        String(Date.now() + Number(fragment.expiresIn) * 1000),
      );

      /* The token is in the address bar until this runs. Clear it before
         anything else can read it, log it, or put it in a Referer. */
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search,
      );
    }

    if (!authToken() || tokenExpired()) {
      redirectToLogin();
      return;
    }

    async function load() {
      try {
        await loadUser();

        if (cancelled) return;

        /* Only now, with a real user in hand, is it worth moving the
           browser to where they were trying to go. */
        const destination = consumeReturnDestination(fragment.state);
        if (destination) navigate(destination, { replace: true });

        setStatus("ready");
      } catch (error) {
        if (cancelled) return;

        /* A 401 is already handled by the client's interceptor, which
           sends the user back to Discord. Anything else is ours to
           report — the previous version left `loading` set forever and
           the whole app sat on a spinner. */
        console.error("Auth fetch error:", error);
        if (error?.response?.status !== 401) setStatus("error");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (status === "error")
    return (
      <div className="df-auth-error">
        <i className="fa-solid fa-triangle-exclamation" />
        <h1>We couldn't sign you in</h1>
        <p>
          DisFuse couldn't reach its servers. Check your connection and try
          again.
        </p>
        <button
          type="button"
          className="df-primary-btn"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );

  if (status === "loading")
    return (
      <div className="load-container">
        <LoadingAnim />
      </div>
    );

  return children;
}
