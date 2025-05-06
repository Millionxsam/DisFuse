import * as Blockly from "blockly";

export default async function autosave(
  workspace,
  projectId,
  currentWorkspace,
  socket,
  event
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
          if (response.error) return reject(new Error(response.error));

          document.querySelector(
            ".workspace-navbar #autosave-indicator"
          ).innerHTML = `<i class="fa-solid fa-cloud"></i><div>
              ${new Date().toLocaleTimeString([], { timeStyle: "short" })}
            </div>`;

          console.log("Autosaved");
          resolve(response);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}
