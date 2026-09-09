/* =====================================================================
   Insights API
   ---------------------------------------------------------------------
   Every network call the Insights feature makes. Same conventions as the
   Every call goes through the shared client in api/client.js, which
   attaches the Discord token and turns an expired one back into a sign-in
   that returns the user to this page.

   Nothing here is cached to localStorage — the API is the source of
   truth, and the numbers move.

   Everything below is for the bot's OWNER. The endpoint the generated
   bot code posts its events to authenticates with the bot's own Discord
   token and is never called from the browser.

   Routes:
     GET    /projects/insights                    bots you can analyse
     GET    /projects/:id/insights                the analytics
     GET    /projects/:id/insights/focus          one command/user/server
     GET    /projects/:id/insights/logs           raw events, paginated
     PATCH  /projects/:id/insights/settings       retention
     DELETE /projects/:id/insights/logs           erase history
   ===================================================================== */

import api, { data as body } from "./client.js";

/* Buckets and "busiest hour" are computed in the viewer's own timezone,
   which only the browser knows. */
function timezoneOffset() {
  return new Date().getTimezoneOffset();
}

/** Summaries for every bot the signed-in user owns. */
export function getInsightsProjects({ signal } = {}) {
  return api.get(`/projects/insights`, { signal }).then(body);
}

/**
 * The whole Insights page for one bot, for one time range.
 *
 * @param {string} projectId
 * @param {{range?: string, signal?: AbortSignal}} options
 */
export function getInsights(projectId, { range = "7d", signal } = {}) {
  return api
    .get(`/projects/${projectId}/insights`, {
      params: { range, tzOffset: timezoneOffset() },
      signal,
    })
    .then(body);
}

/**
 * Everything about one command, user or server.
 *
 * @param {string} projectId
 * @param {{dimension: "command"|"user"|"server", value: string,
 *          range?: string, signal?: AbortSignal}} options
 */
export function getInsightsFocus(
  projectId,
  { dimension, value, range = "7d", signal } = {},
) {
  return api
    .get(`/projects/${projectId}/insights/focus`, {
      params: { dimension, value, range, tzOffset: timezoneOffset() },
      signal,
    })
    .then(body);
}

/**
 * One page of raw events, newest first.
 *
 * The API caps `limit`, so the browser can never ask for the whole
 * history by accident.
 */
export function getInsightLogs(
  projectId,
  {
    page = 1,
    limit = 50,
    range = "all",
    type,
    search,
    guildId,
    userId,
    command,
    signal,
  } = {},
) {
  return api
    .get(`/projects/${projectId}/insights/logs`, {
      params: {
        page,
        limit,
        range,
        ...(type ? { type } : {}),
        ...(search ? { search } : {}),
        ...(guildId ? { guildId } : {}),
        ...(userId ? { userId } : {}),
        ...(command ? { command } : {}),
      },
      signal,
    })
    .then(body);
}

/** Changes how long logs are kept. The API deletes anything older. */
export function updateInsightSettings(projectId, { retentionDays }) {
  return api
    .patch(`/projects/${projectId}/insights/settings`, { retentionDays })
    .then(body);
}

/** Deletes every stored event for this bot. */
export function clearInsightLogs(projectId) {
  return api.delete(`/projects/${projectId}/insights/logs`).then(body);
}
