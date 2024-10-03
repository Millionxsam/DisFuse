import axios from 'axios';
import * as Blockly from 'blockly';

const { apiUrl } = require('../config/config.json');

export default function autosave(workspace, projectId, e) {
  let ignoredEvents = [
    Blockly.Events.VIEWPORT_CHANGE,
    Blockly.Events.SELECTED,
    Blockly.Events.CLICK,
    Blockly.Events.TOOLBOX_ITEM_SELECT,
  ];
  if (ignoredEvents.includes(e.type)) return;

  const autosaveIndicator = document.querySelector(
    '.workspace-navbar #autosave-indicator'
  );

  var data = JSON.stringify(Blockly.serialization.workspaces.save(workspace));
  data = data.replace(
    /[A-Za-z0-9_\-]{24}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27}/g,
    '[TOKEN]'
  );

  axios
    .patch(
      apiUrl + `/projects/${projectId}/data`,
      {
        data: data,
      },
      {
        headers: {
          Authorization: localStorage.getItem('disfuse-token'),
        },
      }
    )
    .then(() => {
      if (autosaveIndicator) {
        autosaveIndicator.innerHTML = `<i class="fa-solid fa-cloud"></i><div>
            Autosaved at ${new Date().toLocaleTimeString([], {
              timeStyle: 'short',
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
