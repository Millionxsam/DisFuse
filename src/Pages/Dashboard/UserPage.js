import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";
import { Helmet } from "react-helmet";
import Swal from "sweetalert2";

const { apiUrl, discordUrl } = require("../../config/config.json");

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
        const { data: users } = await axios.get(apiUrl + "/users");
        const user = users.find(
          (u) => u.username === username.replace("@", "")
        );
        setUser(user);

        const [projectsData, discordUser] = await Promise.all([
          axios.get(apiUrl + `/users/${user.id}/projects`, {
            headers: { Authorization: localStorage.getItem("disfuse-token") },
          }),
          axios.get(discordUrl + "/users/@me", {
            headers: { Authorization: localStorage.getItem("disfuse-token") },
          }),
        ]);

        const { data: localUserData } = await axios.get(
          apiUrl + "/users/" + discordUser.data.id,
          {
            headers: { Authorization: localStorage.getItem("disfuse-token") },
          }
        );

        setLocalUser(localUserData);
        setBlocked(localUserData.blocked.includes(user.id));
        setProjects(projectsData.data);
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
          }
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

  let description =
    "Check out this user's profile and projects on DisFuse, a platform to create Discord bots with block coding!";

  return (
    <>
      <Helmet>
        <meta name="description" content={description} />
        <title>{`${user.displayName} on DisFuse`}</title>

        <meta property="og:title" content={`${user.displayName} on DisFuse`} />
        <meta property="og:description" content={description} />
        <meta
          property="og:image"
          content={
            user.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"
          }
        />
        <meta property="og:type" content="profile" />
      </Helmet>

      <div className="user-profile-container">
        <div className="head">
          <div className="nametag">
            <img
              src={
                user.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"
              }
              alt=""
            />
            <div>
              <h1>{user.displayName || user.username}</h1>
              <p>@{user.username}</p>
            </div>
            {user.id !== localUser.id && (
              <button
                id={blocked ? "" : "rdbt"}
                onClick={() => toggleBlockUser(user)}
              >
                {blocked ? "Unblock User" : "Block User"}
                <i className="fa-solid fa-ban"></i>
              </button>
            )}
          </div>
          <div className="stats">
            <p>{projects.length || 0} Projects</p>
          </div>
        </div>
        <h1>Projects</h1>
        {isLoading ? <LoadingAnim /> : null}
        <div className="body">
          {projects.length > 0
            ? projects.map((project) => (
              <PubProject key={project.id} project={project} />
            ))
            : !isLoading
              ? "No public projects"
              : null}
        </div>
      </div>
    </>
  );
}
