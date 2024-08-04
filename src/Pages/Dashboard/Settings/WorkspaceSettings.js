import Switch from "../../../components/Switch";

export default function WorkspaceSettings() {
  // const token = localStorage.getItem("disfuse-token");
  // const [user, setUser] = useState({});

  // useEffect(() => {
  //   axios
  //     .get(discordUrl + "/users/@me", {
  //       headers: {
  //         Authorization: token,
  //       },
  //     })
  //     .then(({ data }) => {
  //       setUser(data);
  //     });
  // }, [token]);

  function changeTheme() {
    const newTheme = document.querySelector("#workspace-theme").value;
    localStorage.setItem("workspaceTheme", newTheme);
  }

  function changeRenderer() {
    const newRenderer = document.querySelector("#workspace-renderer").value;
    localStorage.setItem("blocklyRenderer", newRenderer);
  }

  function changeSounds() {
    const enabled = document.querySelector("#workspace-sounds").checked;
    localStorage.setItem("workspaceSounds", enabled);
  }

  function changeGridSnap() {
    const enabled = document.querySelector("#workspace-gridSnap").checked;
    localStorage.setItem("workspace-gridSnap", enabled);
  }

  function changeGridSpacing() {
    const spacing = document.querySelector("#workspace-gridSpacing").value;
    localStorage.setItem("workspace-gridSpacing", spacing);
  }

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
            defaultValue={localStorage.getItem("workspaceTheme") || "DFTheme"}
            onChange={changeTheme}
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
            defaultValue={localStorage.getItem("blocklyRenderer") || "zelos"}
            onChange={changeRenderer}
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
            defaultChecked={
              localStorage.getItem("workspaceSounds") === null
                ? true
                : localStorage.getItem("workspaceSounds") === "true"
            }
            id={"workspace-sounds"}
            onChange={changeSounds}
          />
        </div>
        <div className="option">
          <p>Snap to grid:</p>
          <Switch
            defaultChecked={
              localStorage.getItem("workspace-gridSnap") === null
                ? false
                : localStorage.getItem("workspace-gridSnap") === "true"
            }
            id="workspace-gridSnap"
            onChange={changeGridSnap}
          />
        </div>
        <div className="option">
          <label htmlFor="workspace-gridSpacing">Grid spacing:</label>
          <input
            type="number"
            defaultValue={localStorage.getItem("workspace-gridSpacing") || "35"}
            placeholder="Default: 35"
            onChange={changeGridSpacing}
            id="workspace-gridSpacing"
          />
        </div>
      </div>
    </>
  );
}
