import api, { authToken, data } from "../../../api/client.js";

/* =====================================================================
   The Workshop routes the pack editor uses
   ---------------------------------------------------------------------
     GET   /workshop/:id          the pack
     PATCH /workshop/:id          name, description, color, dependencies, private
     PATCH /workshop/:id/data     the draft (unpublished work), autosaved
     PATCH /workshop/:id/items    publish { items, version, changelog }
   ===================================================================== */

export const getPack = (packId) => api.get(`/workshop/${packId}`).then(data);

export const savePackDetails = (packId, fields) => api.patch(`/workshop/${packId}`, fields).then(data);

export const savePackDraft = (packId, draft) => api.patch(`/workshop/${packId}/data`, { data: draft }).then(data);

export const publishPack = (packId, { items, version, changelog }) =>
  api.patch(`/workshop/${packId}/items`, { items, version, changelog }).then(data);

/**
 * Saves the draft while the page closes. `keepalive` requests are
 * limited to 64 KB, so a bigger draft returns false and the page asks
 * the browser to warn instead.
 */
export function savePackDraftOnExit(packId, draft) {
  const body = JSON.stringify({ data: draft });
  if (body.length > 60_000) return false;
  try {
    fetch(`${api.defaults.baseURL}/workshop/${packId}/data`, {
      method: "PATCH",
      keepalive: true,
      headers: { "Content-Type": "application/json", Authorization: authToken() ?? "" },
      body,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}
