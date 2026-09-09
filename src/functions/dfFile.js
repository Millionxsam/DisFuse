import * as Blockly from "blockly";

/* =====================================================================
   .df save files
   ---------------------------------------------------------------------
   The file format is the same whichever system a project is on: a .df
   holds workspaces, not versions. Saving or exporting a Version Control
   project writes out the workspaces of the version that was chosen, so
   a file taken from Version 2 loads back exactly as Version 2 was.

   Whatever is on screen wins over what was saved: pass the live Blockly
   workspace and the ID of the tab it belongs to, and that tab is written
   from the editor rather than from the last autosave.
   ===================================================================== */

/**
 * A whole-project .df from a set of workspaces.
 *
 * @param {Array} workspaces        `{_id, name, data}`, saved form
 * @param {object} [live]
 * @param {object} [live.workspace] the injected Blockly workspace
 * @param {string} [live.workspaceId] which entry it is showing
 */
export function buildWorkspacesDf(workspaces = [], live = {}) {
  return {
    disfuseProject: true,
    version: 1,
    workspaces: (workspaces || []).map(ws => ({
      name: ws.name,
      data: workspaceData(ws, live),
    })),
  };
}

/** The whole project as it stands in the editor. */
export function buildProjectDf(project, workspace, currentWorkspaceId) {
  return buildWorkspacesDf(project.workspaces, {
    workspace,
    workspaceId: currentWorkspaceId,
  });
}

/**
 * The .df for one choice in the save/export dialogs: every workspace, or
 * one of them.
 *
 * A single workspace is written as a plain Blockly save — the same shape
 * the "current workspace only" option has always produced, and what the
 * loader treats as blocks rather than as a project.
 */
export function buildDf(workspaces = [], { scope = "project", ...live } = {}) {
  if (scope === "project") return buildWorkspacesDf(workspaces, live);

  const only = (workspaces || []).find(
    ws => String(ws._id) === String(scope),
  );

  return workspaceData(only || {}, live);
}

/** One workspace's blocks: from the editor if it is the one on screen. */
function workspaceData(ws, { workspace, workspaceId } = {}) {
  if (workspace && ws._id && String(ws._id) === String(workspaceId))
    return Blockly.serialization.workspaces.save(workspace);

  return parseDfWorkspaceData(ws.data);
}

export function isProjectDfFile(json) {
  return Boolean(json?.disfuseProject && Array.isArray(json.workspaces));
}

export function parseDfWorkspaceData(data) {
  if (typeof data !== "string") return data || {};
  try {
    return JSON.parse(data || "{}");
  } catch {
    return {};
  }
}
