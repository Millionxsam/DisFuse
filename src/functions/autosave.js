import axios from "axios";
import * as Blockly from "blockly";
import Swal from "sweetalert2";
import modalThemeColor from "./modalThemeColor";
import { userCache } from "../cache.ts";

const { apiUrl } = require("../config/config.json");

export default async function autosave(workspace, projectId, currentWorkspace) {
  console.log("Autosaving...");
  const autosaveIndicator = document.querySelector(
    ".workspace-navbar #autosave-indicator"
  );

  const data = JSON.stringify(Blockly.serialization.workspaces.save(workspace));

  const newProject = await axios
    .patch(
      apiUrl + `/projects/${projectId}/workspaces/${currentWorkspace._id}/data`,
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
      if (e.response.data.error === "This project has been suspended")
        return Swal.fire({
          title: "Project Suspended",
          icon: "error",
          html: `This project was detected to be violating our terms of service. Please join our Discord server if you think this is a mistake.
                      <br />
                      <br />
                      Reason: ${e.response.data.reason}
                      `,
          showConfirmButton: false,
          footer: `<a href="https://dsc.gg/disfuse" target="_blank" rel="noopener">Join our Discord</a>`,
          allowEscapeKey: false,
          allowOutsideClick: false,
          ...modalThemeColor(userCache.user),
        });

      if (autosaveIndicator) {
        autosaveIndicator.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div>Error</div>`;
      }
    });

  if (!newProject) return;

  if (autosaveIndicator) {
    autosaveIndicator.innerHTML = `<i class="fa-solid fa-cloud"></i><div>
    ${new Date().toLocaleTimeString([], {
      timeStyle: "short",
    })}</div>`;
  }

  console.log("Autosaved");
  return newProject.data;
}
