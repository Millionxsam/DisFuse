import axios from "axios";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import LoadingAnim from "../../../components/LoadingAnim";

import { discordUrl, apiUrl } from "../../../config/config.js";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";

export default function NotificationSettings() {
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
            setUser(user);
            setLoading(false);
          });
      });
  }, [token]);

  function updateSetting(setting, value) {
    user.settings.notifications[setting] = value;

    axios.put(apiUrl + `/users/${user.id}/settings`, user.settings, {
      headers: { Authorization: token },
    });
  }

  if (loading) return <LoadingAnim />;

  return (
    <div className="settings">
      <Helmet>
        <title>Notification Settings | DisFuse</title>
      </Helmet>
      <h1>Notifications</h1>
      <p>
        Enable or disable certain notifications and decide how you want to be
        notified.{" "}
        <DocsLink
          page={`${DOCS.settings}#notifications`}
          variant="inline"
          label="How notifications work"
        />
      </p>

      <div className="option">
        <label htmlFor="commentsOnProjects">
          Someone comments on your project:
        </label>

        <select
          defaultValue={user.settings.notifications.commentsOnProjects ?? "2"}
          onChange={(e) =>
            updateSetting("commentsOnProjects", e.currentTarget.value)
          }
          id="commentsOnProjects"
        >
          <option value="0">Off</option>
          <option value="1">Inbox only</option>
          <option value="2">Inbox & Discord DM</option>
        </select>
      </div>
      <div className="option">
        <label htmlFor="repliesOnComments">
          Someone replies to your comment:
        </label>

        <select
          defaultValue={user.settings.notifications.repliesOnComments ?? "2"}
          onChange={(e) =>
            updateSetting("repliesOnComments", e.currentTarget.value)
          }
          id="repliesOnComments"
        >
          <option value="0">Off</option>
          <option value="1">Inbox only</option>
          <option value="2">Inbox & Discord DM</option>
        </select>
      </div>
      <div className="option">
        <label htmlFor="likesOnProjects">Someone likes your project:</label>

        <select
          defaultValue={user.settings.notifications.likesOnProjects ?? "1"}
          onChange={(e) =>
            updateSetting("likesOnProjects", e.currentTarget.value)
          }
          id="likesOnProjects"
        >
          <option value="0">Off</option>
          <option value="1">Inbox only</option>
          <option value="2">Inbox & Discord DM</option>
        </select>
      </div>
      <div className="option">
        <label htmlFor="clonesOnProjects">Someone clones your project:</label>

        <select
          defaultValue={user.settings.notifications.clonesOnProjects ?? "1"}
          onChange={(e) =>
            updateSetting("clonesOnProjects", e.currentTarget.value)
          }
          id="clonesOnProjects"
        >
          <option value="0">Off</option>
          <option value="1">Inbox only</option>
          <option value="2">Inbox & Discord DM</option>
        </select>
      </div>
    </div>
  );
}
