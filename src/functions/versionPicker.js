import Swal from "sweetalert2";

import { getVersion } from "../api/versions";

/* =====================================================================
   "Which version, and how much of it?"
   ---------------------------------------------------------------------
   Both the File ▸ Download and the Export flows ask the same question of
   a Version Control project, so they ask it in the same place and get
   the answer in the same shape.

   Legacy projects never see this: they keep the two-option menu they
   have always had, and the answer is `{ versionId: null, scope }`.
   ===================================================================== */

/** Names go into a Swal `html` string, so they get escaped. */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Asks which version to take, and whether to take all of its workspaces
 * or one of them.
 *
 * @returns {Promise<{versionId: string, scope: string}|null>} scope is
 *   "project" for the whole version, or a workspace ID. Null if
 *   cancelled.
 */
export async function pickVersionAndScope({
  versions = [],
  activeVersionId,
  title,
  confirmButtonText,
  html = "",
  modalColors = {},
}) {
  const versionOptions = [...versions]
    .sort((a, b) => (b.number ?? 0) - (a.number ?? 0))
    .map((version) => {
      const active = String(version._id) === String(activeVersionId);

      return `<option value="${version._id}"${active ? " selected" : ""}>${escapeHtml(
        version.name,
      )}${active ? " (editing)" : ""}</option>`;
    })
    .join("");

  const scopeOptions = (versionId) => {
    const version = versions.find(
      (v) => String(v._id) === String(versionId),
    );

    return [
      `<option value="project">Whole version (all workspaces)</option>`,
      ...(version?.workspaces || []).map(
        (ws) =>
          `<option value="${ws._id}">Only "${escapeHtml(ws.name)}"</option>`,
      ),
    ].join("");
  };

  const result = await Swal.fire({
    title,
    icon: "question",
    confirmButtonText,
    showCancelButton: true,
    html: `
      <label class="df-version-dialog-label" for="df-pick-version">Version</label>
      <select id="df-pick-version" class="df-version-dialog-select">${versionOptions}</select>
      <label class="df-version-dialog-label" for="df-pick-scope">What to include</label>
      <select id="df-pick-scope" class="df-version-dialog-select">${scopeOptions(
        activeVersionId,
      )}</select>
      ${html ? `<p class="df-version-dialog-text">${html}</p>` : ""}
    `,
    didOpen: () => {
      /* The workspaces on offer belong to the chosen version, so the
         second menu follows the first. */
      document
        .querySelector("#df-pick-version")
        ?.addEventListener("change", (e) => {
          const scope = document.querySelector("#df-pick-scope");
          if (scope) scope.innerHTML = scopeOptions(e.target.value);
        });
    },
    preConfirm: () => ({
      versionId: document.querySelector("#df-pick-version")?.value,
      scope: document.querySelector("#df-pick-scope")?.value || "project",
    }),
    ...modalColors,
  });

  if (!result.isConfirmed) return null;
  return result.value;
}

/**
 * The workspaces a choice refers to.
 *
 * The version being edited is already in memory as `project.workspaces`
 * — that is what a Version Control project shows — so only the other
 * versions cost a request.
 */
export async function workspacesForChoice(
  projectId,
  { versionId, scope },
  { activeVersionId, projectWorkspaces = [] } = {},
) {
  const editingThis =
    !versionId || String(versionId) === String(activeVersionId);

  const workspaces = editingThis
    ? projectWorkspaces
    : (await getVersion(projectId, versionId))?.workspaces || [];

  if (scope === "project") return workspaces;

  return workspaces.filter((ws) => String(ws._id) === String(scope));
}
