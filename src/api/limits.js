/* =====================================================================
   Plan limits API
   ---------------------------------------------------------------------
   Every feature is free; the plan decides how much an account can keep.
   This reads the signed-in user's limits and how much of them is used,
   for the "3 of 5 projects" lines on the dashboard.

   Route:
     GET /users/:id/limits  → { premium, limits, free, premiumLimits,
                                usage: { projects, websites } }

   The API enforces the limits itself whatever this says, so a stale or
   failed read only ever affects what a page shows.
   ===================================================================== */

import api, { data as body } from "./client.js";
import { userCache } from "../cache.ts";

export function getPlanLimits(userId = userCache.user?.id) {
  return api.get(`/users/${userId}/limits`).then(body);
}
