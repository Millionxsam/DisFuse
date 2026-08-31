import axios from "axios";

import { apiUrl } from "../config/config";

/**
 * Some API responses only contain part of the project. The autosave
 * acknowledgement, for example, leaves out every workspace's `data` (and the
 * bot token) to keep the payload small. Replacing the project we already have
 * with one of those responses loses the blocks of every other workspace, which
 * makes features that need the whole project - like exporting it - only see the
 * workspace that is currently open.
 *
 * This merges an update into the project we already have, keeping whatever the
 * update left out.
 *
 * @param {object} project The project as we currently know it
 * @param {object} update The (possibly partial) project returned by the API
 * @param {{ workspaceId?: string, data?: string }} saved The workspace data
 * that was just saved, so the local copy stays up to date as well
 */
export function mergeProjectUpdate(project, update, saved = {}) {
  if (!update) return project;

  const previousWorkspaces = project?.workspaces || [];

  const merged = { ...project, ...update };

  merged.workspaces = (update.workspaces || previousWorkspaces).map((ws) => {
    const previous = previousWorkspaces.find((p) => p._id === ws._id);

    return {
      ...previous,
      ...ws,
      data:
        saved.data !== undefined && ws._id === saved.workspaceId
          ? saved.data
          : (ws.data ?? previous?.data),
    };
  });

  return merged;
}

/**
 * Fetches the project again so every workspace has its latest saved blocks,
 * including workspaces that were created or edited elsewhere. Only the
 * workspaces are taken from the response, because this route hides fields like
 * the bot token from collaborators. Falls back to the project we already have
 * if the request fails.
 */
export async function refreshProjectWorkspaces(project, projectId) {
  try {
    const { data: latest } = await axios.get(
      apiUrl + `/projects/${projectId}`,
      {
        headers: { Authorization: localStorage.getItem("disfuse-token") },
      },
    );

    if (!Array.isArray(latest?.workspaces)) return project;

    return mergeProjectUpdate(project, { workspaces: latest.workspaces });
  } catch (error) {
    console.error("Couldn't refresh the project's workspaces:", error);

    return project;
  }
}
