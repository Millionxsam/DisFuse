import axios from "axios";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import LoadingAnim from "../../../components/LoadingAnim";

import { discordUrl, apiUrl } from "../../../config/config.js";
import {
  PACKAGE_MANAGERS,
  RUNTIMES,
  userExportSettings,
} from "../../../config/exportSettings.js";
import { userCache } from "../../../cache.ts";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";

export default function ExportSettings() {
  const token = localStorage.getItem("disfuse-token");
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
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
            user.settings.export = userExportSettings(user);
            setUser(user);
            setLoading(false);
          });
      });
  }, [token]);

  function updateSetting(setting, value) {
    user.settings.export[setting] = value;

    /* The editor reads the cached user, so an export made later in this
       visit uses the new choice without a reload. */
    if (userCache.user?.settings)
      userCache.user.settings.export = { ...user.settings.export };

    axios.put(apiUrl + `/users/${user.id}/settings`, user.settings, {
      headers: { Authorization: token },
    });
  }

  if (loading) return <LoadingAnim />;

  return (
    <div className="settings">
      <Helmet>
        <title>Export Settings | DisFuse</title>
      </Helmet>
      <h1>Export</h1>
      <p>
        Choose what your exported bots are set up to run with. Each project
        uses these unless you change them in its project settings.{" "}
        <DocsLink
          page={`${DOCS.settings}#export`}
          variant="inline"
          label="What each setting does"
        />
      </p>

      <div className="option">
        <label htmlFor="export-runtime">Runtime:</label>
        <select
          defaultValue={user.settings.export.runtime}
          onChange={(e) => updateSetting("runtime", e.currentTarget.value)}
          id="export-runtime"
        >
          {Object.entries(RUNTIMES).map(([value, { label }]) => (
            <option value={value} key={value}>
              {label}
              {value === "node" ? " (default)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="option">
        <label htmlFor="export-packageManager">Package manager:</label>
        <select
          defaultValue={user.settings.export.packageManager}
          onChange={(e) =>
            updateSetting("packageManager", e.currentTarget.value)
          }
          id="export-packageManager"
        >
          {Object.entries(PACKAGE_MANAGERS).map(([value, { label }]) => (
            <option value={value} key={value}>
              {label}
              {value === "npm" ? " (default)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
