import axios from "axios";
import * as Blockly from "blockly";

const { apiUrl } = require("../config/config.json");

export default async function autosave(workspace, projectId, currentWorkspace) {
  const autosaveIndicator = document.querySelector(
    ".workspace-navbar #autosave-indicator"
  );

  var data = JSON.stringify(Blockly.serialization.workspaces.save(workspace));
  data = data.replace(
    /[A-Za-z0-9_\-]{24}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27}/g,
    "[TOKEN]"
  );

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
