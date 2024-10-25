import axios from "axios";
import * as Blockly from "blockly";

const { apiUrl } = require("../config/config.json");

export default async function autosave(workspace, projectId, currentWorkspace) {
  const autosaveIndicator = document.querySelector(
    ".workspace-navbar #autosave-indicator"
  );

  const data = JSON.stringify(Blockly.serialization.workspaces.save(workspace));

  const newProject = (
    await axios
      .patch(
        apiUrl +
        `/projects/${projectId}/workspaces/${currentWorkspace._id}/data`,
        {
          data,
        },
        {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        }
      )
      .catch((e) => {
        console.error(e);

        if (autosaveIndicator) {
          autosaveIndicator.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div>Error</div>`;
        }
      })
  ).data;

  if (autosaveIndicator) {
    autosaveIndicator.innerHTML = `<i class="fa-solid fa-cloud"></i><div>
    ${new Date().toLocaleTimeString([], {
      timeStyle: "short",
    })}</div>`;
  }

  return newProject;
}
