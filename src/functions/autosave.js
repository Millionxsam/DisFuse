import * as Blockly from "blockly";
import modalThemeColor from "./modalThemeColor";
import { userCache } from "../cache.ts";
import Swal from "sweetalert2";

export default async function autosave(
  workspace,
  projectId,
  currentWorkspace,
  socket,
  event,
  autosaveLabel
) {
  console.log("Autosaving...");

  const data = JSON.stringify(Blockly.serialization.workspaces.save(workspace));

  return new Promise((resolve, reject) => {
    try {
      socket.emit(
        "projectUpdate",
        {
          projectId,
          data,
          event,
          workspaceId: currentWorkspace._id,
        },
        (response) => {
          if (response.error === "This project is suspended")
            return Swal.fire({
              ...modalThemeColor(userCache.user),
              title: "Project Suspended",
              icon: "error",
              html: `This project was detected to break our terms of service and has automatically been suspended for the reason:
              <br />
              <br />
              ${response.reason}`,
              footer:
                '<a rel="noopener" target="_blank" href="https://dsc.gg/disfuse">Join our Discord for support</a>',
              showConfirmButton: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
            });
          else if (response.error) return reject(new Error(response.error));

          if (autosaveLabel) {
            const autosaveIndicator = document.querySelector(
              ".workspace-navbar #autosave-indicator"
            );

            autosaveIndicator.style.display = "flex";
            autosaveIndicator.innerHTML = `<i class="fa-solid fa-cloud"></i><div>
              ${new Date().toLocaleTimeString([], { timeStyle: "short" })}
            </div>`;
          }

          console.log("Autosaved");
          resolve(response);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}
