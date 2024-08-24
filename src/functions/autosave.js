import axios from "axios";
import * as Blockly from "blockly";

const { apiUrl } = require("../config/config.json");

export default function autosave(workspace, projectId, e) {
  let ignoredEvents = [
    Blockly.Events.VIEWPORT_CHANGE,
    Blockly.Events.SELECTED,
    Blockly.Events.CLICK,
    Blockly.Events.TOOLBOX_ITEM_SELECT,
  ];
  if (ignoredEvents.includes(e.type)) return;

  const autosaveIndicator = document.querySelector(
    ".workspace-navbar #autosave-indicator"
  );

  axios
    .patch(
      apiUrl + `/projects/${projectId}/data`,
      {
        data: JSON.stringify(Blockly.serialization.workspaces.save(workspace)),
      },
      {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      }
    )
    .then(() => {
      if (autosaveIndicator) {
        autosaveIndicator.innerHTML = `<i class="fa-solid fa-cloud"></i><div>
            Autosaved at ${new Date().toLocaleTimeString([], {
              timeStyle: "short",
            })}
            </div>`;
      }
    })
    .catch((e) => {
      console.error(e);
      if (autosaveIndicator) {
        autosaveIndicator.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div>Error while saving</div>`;
      }
    });
}
