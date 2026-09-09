/* =====================================================================
   Websites API
   ---------------------------------------------------------------------
   Every network call the Websites feature makes. Uses the same
   Every call goes through the shared client in api/client.js, which
   attaches the Discord token and turns an expired one back into a sign-in
   that returns the user to this page.

   The API is the source of truth for website data — nothing here is
   cached to localStorage.

   Everything below is for the website OWNER building their site. The
   endpoints that published websites use for their visitors live in the
   DisFuse-Sites application, not here: this app builds websites, it
   doesn't render them.

   Routes:
     GET    /websites                       own websites
     GET    /websites/:id                   one website (owner)
     POST   /websites                       create
     PATCH  /websites/:id                   update
     DELETE /websites/:id                   delete
     GET    /websites/path-available        is a custom URL free?
     GET    /websites/permissions           Discord permissions to pick from
   ===================================================================== */

import api, { data as body } from "./client.js";

/* The DisFuse user building the website (same session as the rest of the app). */

export function getWebsites() {
  return api.get(`/websites`).then(body);
}

export function getWebsite(id) {
  return api.get(`/websites/${id}`).then(body);
}

/**
 * @param {{ botID: string, name: string, config: object, projectId?: string,
 *           published?: boolean, path?: string|null,
 *           dashboardAccess?: object }} website
 */
export function createWebsite(website) {
  return api.post(`/websites`, website).then(body);
}

export function updateWebsite(id, changes) {
  return api.patch(`/websites/${id}`, changes).then(body);
}

export function deleteWebsite(id) {
  return api.delete(`/websites/${id}`).then(body);
}

/**
 * Is a custom public URL available?
 *
 * The API decides — the same validation runs again when the path is
 * saved, so this only exists to answer the question while typing.
 *
 * @returns {Promise<{available: boolean, path: string|null,
 *                    url: string|null, error: string|null}>}
 */
export function checkWebsitePath(path, websiteId, { signal } = {}) {
  return api
    .get(`/websites/path-available`, {
      params: { path, websiteId },
      signal,
    })
    .then(body);
}

/** The Discord permissions a dashboard access requirement can ask for. */
export function getDashboardPermissions() {
  return api.get(`/websites/permissions`).then(body);
}
