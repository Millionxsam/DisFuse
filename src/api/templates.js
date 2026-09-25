/* =====================================================================
   Templates API
   ---------------------------------------------------------------------
   Templates are blocks people build in the template builder for others
   to import. Each has a draft (what the builder autosaves, only ever
   sent to its owner) and a published version (what everyone else sees
   and imports), and nothing changes for importers until the owner
   presses Publish.

   Importing is done by the editor — the blocks are copied into the
   project like any others — so nothing here writes to a project. The
   API is told about an import afterwards, only so it can be counted.

   Routes:
     GET    /templates                     the gallery
     POST   /templates                     create
     GET    /templates/:id                 one, with its published blocks
     PATCH  /templates/:id                 name, description, visibility
     PUT    /templates/:id/draft           the builder's autosave
     POST   /templates/:id/publish         publish the builder's blocks
     DELETE /templates/:id/publish         unpublish
     DELETE /templates/:id                 delete
     PATCH  /templates/:id/likes           like / unlike
     POST   /templates/:id/imports         count an import
     POST   /templates/:id/packs/install   install the Workshop packs it uses
            /templates/:id/comments/…      the same shape as project comments
   ===================================================================== */

import api, { authToken, data as body } from "./client.js";

/**
 * A page of the gallery: `{ templates, total, page, pages, filter, sort }`.
 *
 * @param {object} query
 * @param {"all"|"official"|"mine"|"liked"} [query.filter]
 * @param {"popular"|"imports"|"newest"|"updated"} [query.sort]
 * @param {string} [query.q]      search names and descriptions
 * @param {number} [query.page]
 * @param {number} [query.limit]
 */
export function listTemplates(query = {}, { signal } = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== "" && value != null),
  );

  return api.get("/templates", { params, signal }).then(body);
}

/** One template, with `data` (its published blocks) and, for its owner, `draft`. */
export function getTemplate(templateId, { signal } = {}) {
  return api.get(`/templates/${templateId}`, { signal }).then(body);
}

/**
 * Creates a template. It starts unpublished whatever its visibility.
 *
 * @param {{name: string, description?: string, private?: boolean, draft?: string}} template
 */
export function createTemplate(template) {
  return api.post("/templates", template).then(body);
}

/** Name, description and visibility. */
export function updateTemplate(templateId, changes) {
  return api.patch(`/templates/${templateId}`, changes).then(body);
}

/** The builder's autosave. Never changes what importers get. */
export function saveTemplateDraft(templateId, data, { signal } = {}) {
  return api
    .put(`/templates/${templateId}/draft`, { data }, { signal })
    .then(body);
}

/**
 * The same save, for a page that is closing.
 *
 * A normal request is cancelled when the page unloads; a `keepalive`
 * fetch is allowed to finish. Browsers cap a keepalive body at 64 KB, so
 * a bigger draft can only be saved by the ordinary path before this
 * point — which the builder does whenever the tab is hidden.
 *
 * @returns {boolean} whether the save could be sent this way
 */
export function saveTemplateDraftOnExit(templateId, data) {
  const payload = JSON.stringify({ data });
  if (payload.length > 60 * 1024) return false;

  try {
    fetch(`${api.defaults.baseURL}/templates/${templateId}/draft`, {
      method: "PUT",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken() ?? "",
      },
      body: payload,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Makes these blocks what importers get.
 *
 * @param {string}   data   the builder's workspace, serialised
 * @param {string[]} packs  ids of the Workshop packs whose blocks it uses
 */
export function publishTemplate(templateId, { data, packs = [] }) {
  return api
    .post(`/templates/${templateId}/publish`, { data, packs })
    .then(body);
}

export function unpublishTemplate(templateId) {
  return api.delete(`/templates/${templateId}/publish`).then(body);
}

export function deleteTemplate(templateId) {
  return api.delete(`/templates/${templateId}`).then(body);
}

/** `{ likes, liked }` after the toggle. */
export function toggleTemplateLike(templateId) {
  return api.patch(`/templates/${templateId}/likes`).then(body);
}

/** `{ imports }`. Each person counts once, and the owner never does. */
export function recordTemplateImport(templateId) {
  return api.post(`/templates/${templateId}/imports`).then(body);
}

/**
 * Adds the Workshop packs a template uses to the caller's library.
 * `{ packs, installed }`: every pack it uses, and which were new.
 */
export function installTemplatePacks(templateId) {
  return api.post(`/templates/${templateId}/packs/install`).then(body);
}

/** Where a template's comment thread lives — Comment.jsx's `basePath`. */
export function templateCommentsPath(templateId) {
  return `/templates/${templateId}/comments`;
}
