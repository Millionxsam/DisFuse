import Switch from "../../../components/Switch";

export default function WebsiteSettings() {
  function changeTheme() {
    const newTheme = document.querySelector("#website-theme").value;
    localStorage.setItem("websiteTheme", newTheme);

    window.location.reload();
  }

  return (
    <>
      <div className="settings">
        <h1>Appearance</h1>
        <p>
          Customize the DisFuse website to be exactly how you want it
        </p>
        <div className="option">
          <label htmlFor="website-theme">Website theme:</label>
          <select
            defaultValue={localStorage.getItem("websiteTheme") || "DFTheme"}
            onChange={changeTheme}
            id="website-theme"
          >
            <option value="DFTheme">Dark (default)</option>
            <option value="LightTheme">Light</option>
          </select>
        </div>
      </div>
    </>
  );
}
