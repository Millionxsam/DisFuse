import { useState } from 'react';
import Switch from '../../../components/Switch';
import { useEffect } from 'react';
import axios from 'axios';
import LoadingAnim from '../../../components/LoadingAnim';

let { discordUrl, apiUrl } = require('../../../config/config.json');

export default function WorkspaceSettings() {
  const token = localStorage.getItem('disfuse-token');
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(discordUrl + '/users/@me', {
        headers: {
          Authorization: token,
        },
      })
      .then(({ data }) => {
        axios
          .get(apiUrl + `/users/${data.id}`, {
            headers: { Authorization: token },
          })
          .then(({ data: user }) => {
            setUser(user);
            setLoading(false);
          });
      });
  }, [token]);

  function updateSetting(setting, value) {
    if (typeof setting === 'object')
      user.settings.workspace[setting[0]][setting[1]] = value;
    else user.settings.workspace[setting] = value;

    axios.put(apiUrl + `/users/${user.id}/settings`, user.settings, {
      headers: { Authorization: token },
    });
  }

  function toggleDisableState(settings) {
    settings.forEach((setting) => {
      document.querySelector('#workspace-' + setting).disabled =
        !document.querySelector('#workspace-' + setting).disabled;
    });
  }

  if (loading) return <LoadingAnim />;

  return (
    <>
      <div className="settings">
        <h1>Workspace</h1>
        <p>
          Customize your workspace to be exactly how you want it while making
          your bot
        </p>
        <div className="option">
          <label htmlFor="workspace-theme">Workspace theme:</label>
          <select
            defaultValue={user.settings?.workspace.theme}
            onChange={(e) => updateSetting('theme', e.currentTarget.value)}
            id="workspace-theme"
          >
            <option value="DFTheme">Dark (default)</option>
            <option value="DarkerTheme">Darker</option>
            <option value="LightTheme">Light</option>
            <option value="BlueBlackTheme">Blue & Black</option>
            <option value="CandyTheme">Candy</option>
          </select>
        </div>
        <div className="option">
          <label htmlFor="workspace-renderer">Workspace renderer:</label>
          <select
            defaultValue={user.settings?.workspace.renderer ?? 'zelos'}
            onChange={(e) => updateSetting('renderer', e.currentTarget.value)}
            id="workspace-renderer"
          >
            <option value="zelos">Zelos (default)</option>
            <option value="geras">Geras (Blockly default)</option>
            <option value="thrasos">Thrasos</option>
          </select>
        </div>
        <div className="option">
          <p>Workspace sounds:</p>
          <Switch
            defaultChecked={user.settings?.workspace.sounds ?? true}
            onChange={(e) => updateSetting('sounds', e.currentTarget.checked)}
            id={'workspace-sounds'}
          />
        </div>
        <div className="option">
          <p>Show grid:</p>
          <Switch
            defaultChecked={user.settings?.workspace.grid.enabled ?? true}
            onChange={(e) => {
              updateSetting(['grid', 'enabled'], e.currentTarget.checked);
              toggleDisableState(['gridSnap', 'gridSpacing']);
            }}
            id="workspace-showGrid"
          />
        </div>
        <div className="option">
          <p>Snap to grid:</p>
          <Switch
            defaultChecked={user.settings?.workspace.grid.snap ?? false}
            onChange={(e) =>
              updateSetting(['grid', 'snap'], e.currentTarget.checked)
            }
            id="workspace-gridSnap"
            disabled={!user.settings.workspace.grid.enabled}
          />
        </div>
        <div className="option">
          <label htmlFor="workspace-gridSpacing">Grid spacing:</label>
          <input
            type="number"
            defaultValue={user.settings?.workspace.grid.spacing ?? 35}
            onChange={(e) =>
              updateSetting(['grid', 'spacing'], e.currentTarget.value)
            }
            placeholder="Default: 35"
            id="workspace-gridSpacing"
            disabled={!user.settings.workspace.grid.enabled}
          />
        </div>
        <div className="option">
          <p>Icons on toolbar:</p>
          <Switch
            defaultChecked={user.settings?.workspace.toolboxBtIcons ?? true}
            onChange={(e) => {
              updateSetting('toolboxBtIcons', e.currentTarget.checked);
            }}
            id="workspace-toolboxBtIcons"
          />
        </div>
      </div>
    </>
  );
}
