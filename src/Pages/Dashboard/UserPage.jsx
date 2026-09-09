import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";
import Swal from "sweetalert2";

import api, { authToken, data } from "../../api/client.js";
import { apiUrl, discordUrl } from "../../config/config.js";

export default function UserPage() {
  const { username } = useParams();
  const [user, setUser] = useState({});
  const [localUser, setLocalUser] = useState({});
  const [projects, setProjects] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const name = username.replace("@", "");

        /* `GET /users` is authenticated, redacted and bounded — it can no
           longer be downloaded whole and searched here, so ask it for the
           one name this page is about. */
        const matches = await api
          .get("/users", { params: { search: name } })
          .then(data);

        const user = matches.find(
          (u) => u.username?.toLowerCase() === name.toLowerCase(),
        );

        if (!user) return;

        setUser(user);

        const [userProjects, discordUser] = await Promise.all([
          api.get(`/users/${user.id}/projects`).then(data),
          axios.get(discordUrl + "/users/@me", {
            headers: { Authorization: authToken() },
          }),
        ]);

        const localUserData = await api
          .get("/users/" + discordUser.data.id)
          .then(data);

        setLocalUser(localUserData);
        setBlocked(localUserData.blocked?.includes(user.id) ?? false);
        setProjects(userProjects);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [username]);

  function toggleBlockUser(user) {
    function sendPatch() {
      axios
        .patch(
          apiUrl + `/users/${user.id}/block`,
          {},
          {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          },
        )
        .then(({ data }) => {
          setLocalUser(data);

          let blocking = data.blocked.includes(user.id);
          setBlocked(blocking);
          if (!blocking) window.location.reload();
          else setProjects([]);
        })
        .catch((error) => {
          console.error("Error blocking user:", error);
        });
    }

    if (blocked) return sendPatch();

    Swal.fire({
      title: "Block User",
      text: `Are you sure you want to block @${user.username}?`,
      footer:
        "When you block a user, all of your projects will be hidden from them, their projects will be hidden from you, and neither of you will receive notifications from each other.",
      icon: "warning",
      confirmButtonColor: "red",
      confirmButtonText: "Block user",
      showCancelButton: true,
      focusCancel: true,
    }).then((result) => {
      if (!result.isConfirmed) return;

      sendPatch();
    });
  }

  return (
    <div className="df-user-page">
      <Helmet>
        <title>{`${user.username ? `@${user.username}` : "Profile"} | DisFuse`}</title>
      </Helmet>
      <div className="df-user-head">
        <div className="df-user-identity">
          <img
            src={
              user?.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"
            }
            alt=""
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://cdn.discordapp.com/embed/avatars/0.png";
            }}
          />
          <div>
            <h1>{user.displayName || user.username}</h1>
            <p>@{user.username}</p>
          </div>
        </div>

        <div className="df-user-meta">
          <span className="stat-chip">
            <i className="fa-solid fa-cubes"></i> {projects.length || 0}{" "}
            Projects
          </span>
          {user.id !== localUser.id && user.id && (
            <button
              id={blocked ? "" : "rdbt"}
              onClick={() => toggleBlockUser(user)}
            >
              <i className="fa-solid fa-ban"></i>{" "}
              {blocked ? "Unblock User" : "Block User"}
            </button>
          )}
        </div>
      </div>

      <h2>Projects</h2>
      {isLoading ? <LoadingAnim /> : null}
      {!isLoading &&
        (projects.length > 0 ? (
          <div className="df-grid">
            {projects.map((project) => (
              <PubProject key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="df-empty">
            <i className="fa-solid fa-cubes"></i>
            <h3>No public projects</h3>
            <p>This user hasn't shared any public projects yet.</p>
          </div>
        ))}
    </div>
  );
}
