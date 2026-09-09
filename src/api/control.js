/* =====================================================================
   Control API
   ---------------------------------------------------------------------
   Control is a Socket.IO feature — see functions/useControlSession.js —
   so this file only covers the part that happens before a session does:
   picking which of your bots to control.

   Every call goes through the shared client in api/client.js, which
   attaches the Discord token and turns an expired one back into a sign-in
   that returns the user to this page.

   Routes:
     GET /control/bots         bots you own and may control
     GET /control/unsupported  what a Discord bot genuinely cannot do
   ===================================================================== */

import api, { data as body } from "./client.js";

/**
 * The bots the signed-in user may control.
 *
 * Only bots they OWN come back — a project they were invited to as a
 * collaborator is not theirs to control, and the API refuses it at the
 * socket as well, so this list is convenience rather than security.
 */
export function getControlBots({ signal } = {}) {
  return api.get(`/control/bots`, { signal }).then(body);
}

/** `{ actionType: "why a bot can't do this" }`, shown verbatim in the UI. */
export function getUnsupportedActions({ signal } = {}) {
  return api.get(`/control/unsupported`, { signal }).then(body);
}
