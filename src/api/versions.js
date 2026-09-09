/* =====================================================================
   Version Control API
   ---------------------------------------------------------------------
   A version is a snapshot of a whole project — every sub-workspace it
   had when the version was saved. Projects that have never used Version
   Control keep using `project.workspaces` and never touch any of this.

   Every call goes through the shared client in api/client.js, which
   attaches the Discord token and turns an expired one back into a sign-in
   that returns the user to this page.

   Listing versions deliberately does NOT return their blocks — the panel
   and the export dialog only need names, dates and workspace names, and
   a project's whole history is far too much to ship to open one version
   of it. `getVersion` is the only call that carries block data.

   Routes:
     GET    /projects/:id/versions                    every version
     GET    /projects/:id/versions/:versionId         one, with blocks
     POST   /projects/:id/versions                    create   (Premium)
     PATCH  /projects/:id/versions/:versionId         rename   (Premium)
     DELETE /projects/:id/versions/:versionId         delete
     …/versions/:versionId/workspaces…                the tabs inside one
   ===================================================================== */

import api, { data as body } from "./client.js";

function versionsUrl(projectId) {
  return `/projects/${projectId}/versions`;
}

/**
 * Every version of a project, plus what this user is allowed to do with
 * them: `{ versioned, versions, canManage, canEdit, premium, maxVersions }`.
 *
 * `versioned` is false for a project still on the old system.
 */
export function getVersions(projectId, { signal } = {}) {
  return api.get(versionsUrl(projectId), { signal }).then(body);
}

/** One version in full, including every workspace's blocks. */
export function getVersion(projectId, versionId, { signal } = {}) {
  return api
    .get(`${versionsUrl(projectId)}/${versionId}`, {
      signal,
    })
    .then(body);
}

/**
 * Creates a version.
 *
 * @param {string} projectId
 * @param {{name?: string, source?: string}} options
 *   `source` is the ID of the version to copy, "current" for the
 *   project's existing workspaces (only when creating the first one) or
 *   "blank" for an empty version.
 */
export function createVersion(projectId, { name, source = "current" } = {}) {
  return api.post(versionsUrl(projectId), { name, source }).then(body);
}

/** Renames a version. Its number and identity stay exactly as they were. */
export function renameVersion(projectId, versionId, name) {
  return api
    .patch(`${versionsUrl(projectId)}/${versionId}`, { name })
    .then(body);
}

/**
 * Deletes a version.
 *
 * The response's `reverted` is true when that was the last one: the
 * project has gone back to the old system with no workspaces, and the
 * editor needs to reload rather than look for another version.
 */
export function deleteVersion(projectId, versionId) {
  return api.delete(`${versionsUrl(projectId)}/${versionId}`).then(body);
}

/* ---- The workspaces inside one version --------------------------------
   The same operations the tab bar has always had, aimed at a version. */

export function createVersionWorkspace(projectId, versionId, { name, data }) {
  return api
    .post(`${versionsUrl(projectId)}/${versionId}/workspaces`, { name, data })
    .then(body);
}

export function renameVersionWorkspace(
  projectId,
  versionId,
  workspaceId,
  name,
) {
  return api
    .patch(
      `${versionsUrl(projectId)}/${versionId}/workspaces/${workspaceId}/name`,
      { name },
    )
    .then(body);
}

export function saveVersionWorkspaceData(
  projectId,
  versionId,
  workspaceId,
  data,
) {
  return api
    .patch(
      `${versionsUrl(projectId)}/${versionId}/workspaces/${workspaceId}/data`,
      { data },
    )
    .then(body);
}

export function deleteVersionWorkspace(projectId, versionId, workspaceId) {
  return api
    .delete(`${versionsUrl(projectId)}/${versionId}/workspaces/${workspaceId}`)
    .then(body);
}

/* ---- Which version am I editing? --------------------------------------
   The active version is a frontend idea only — nothing about it is
   stored on the project, because two people can edit two different
   versions of the same project at the same time.

   It lives in the page URL so a link opens the version it was shared on,
   and is mirrored to localStorage so closing and reopening a project
   puts you back where you were rather than on the newest version. */

function activeVersionKey(projectId) {
  return `disfuse-active-version-${projectId}`;
}

export function rememberActiveVersion(projectId, versionId) {
  try {
    if (versionId) localStorage.setItem(activeVersionKey(projectId), versionId);
    else localStorage.removeItem(activeVersionKey(projectId));
  } catch {
    /* Private browsing, quota — not worth breaking the editor over. */
  }
}

export function recallActiveVersion(projectId) {
  try {
    return localStorage.getItem(activeVersionKey(projectId));
  } catch {
    return null;
  }
}

/** The newest version — what a project opens on when nothing says otherwise. */
export function latestVersion(versions) {
  if (!versions?.length) return null;

  return versions.reduce((latest, version) =>
    (version.number ?? 0) > (latest.number ?? 0) ? version : latest,
  );
}

/**
 * Picks the version to open: the one asked for if it still exists, the
 * one this browser was last on, and the newest otherwise.
 */
export function resolveActiveVersion(versions, ...preferred) {
  if (!versions?.length) return null;

  for (const wanted of preferred) {
    if (!wanted) continue;

    const match = versions.find(
      (version) => String(version._id) === String(wanted),
    );

    if (match) return match;
  }

  return latestVersion(versions);
}
