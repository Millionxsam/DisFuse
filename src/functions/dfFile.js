import * as Blockly from "blockly";

export function buildProjectDf(project, workspace, currentWorkspaceId) {
  return {
    disfuseProject: true,
    version: 1,
    workspaces: (project.workspaces || []).map(ws => {
      let data = {};

      if (ws._id === currentWorkspaceId) {
        data = Blockly.serialization.workspaces.save(workspace);
      } else if (ws.data?.length) {
        try {
          data = JSON.parse(ws.data);
        } catch {}
      }

      return { name: ws.name, data };
    })
  };
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
