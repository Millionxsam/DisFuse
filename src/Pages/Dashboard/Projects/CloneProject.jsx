import { useEffect, useState } from "react";
import LoadingAnim from "../../../components/LoadingAnim";
import axios from "axios";
import { apiUrl, discordUrl } from "../../../config/config";
import Swal from "sweetalert2";
import modalThemeColor from "../../../functions/modalThemeColor";
import { userCache } from "../../../cache.ts";
import { Link, useParams } from "react-router-dom";

export default function CloneProject() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [bot, setBot] = useState(null);
  const [project, setProject] = useState({});

  const [description, setDescription] = useState("");
  const [projectVisibility, setProjectVisibility] = useState("public");
  const [botVisibility, setBotVisibility] = useState("public");
  const [permissions, setPermissions] = useState(0);

  const { projectId } = useParams();

  useEffect(() => {
    setDescription(project.description || "");
    setPermissions(project.permissions || 0);
  }, [project.description, project.permissions]);

  useEffect(() => {
    axios
      .get(apiUrl + `/projects/${projectId}`, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(async ({ data: project }) => {
        setProject(project);
      })
      .catch(() => {
        window.location = "/projects";
      });
  }, [projectId]);

  return (
    <div className="newProject-page-container">
      <div className="head">
        <i className="fa-solid fa-clone"></i> Clone "{project.name}"
      </div>
      <div className="body">
        {!bot ? (
          <>
            <img
              id="projectCreationGraphic"
              src="/media/projectCreationGraphic.png"
              alt="Project creation"
            />
            <div className="textAnim">
              <h2>Enter your bot token</h2>
              <input
                type="password"
                autoComplete="off"
                placeholder="Your bot token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <i>
                Not sure what this is? Visit{" "}
                <a
                  href="https://docs.disfuse.xyz/docs/Guide/creating-a-bot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  our docs page
                </a>
              </i>

              {loading ? (
                <LoadingAnim onlySpinner />
              ) : (
                <button onClick={findBot}>Continue</button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="botInfo">
              <img
                src={
                  "https://cdn.discordapp.com/avatars/" +
                  bot.id +
                  "/" +
                  bot.avatar +
                  ".png"
                }
                alt={bot.displayName}
              />
              <div>
                <h1>{bot.username}</h1>
                <p style={{ width: "fit-content" }}>ID: {bot.id}</p>
              </div>
            </div>
            <div className="projectInfo">
              <div style={{ gap: "2px" }}>
                <h2>Description</h2>
                <i style={{ opacity: ".5" }}>Optional</i>
              </div>
              <textarea
                placeholder="What does your bot do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div style={{ gap: "2px" }}>
                <h2>Project Visibility</h2>
                <p style={{ opacity: ".5" }}>
                  Public projects will show up in the explore page and anyone
                  can view their blocks; private projects are only visible to
                  you and the people you invite.
                </p>
              </div>
              <select
                value={projectVisibility}
                onChange={(e) => setProjectVisibility(e.target.value)}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>

              <div style={{ gap: "2px" }}>
                <h2>Bot Visibility</h2>
                <p style={{ opacity: ".5" }}>
                  Public bots will show up in the explore page and anyone can
                  add them to their servers
                </p>
              </div>
              <select
                value={botVisibility}
                onChange={(e) => setBotVisibility(e.target.value)}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>

              <p id="visibilityInfo" onClick={showVisibilityInfo}>
                <i className="fa-solid fa-circle-question"></i> Learn more about
                project and bot visibility
              </p>

              <div style={{ gap: "2px" }}>
                <h2>Permissions</h2>
                <p style={{ opacity: ".5" }}>
                  Go to{" "}
                  <Link
                    rel="noopener"
                    target="_blank"
                    to={"https://discordapi.com/permissions.html"}
                  >
                    this website
                  </Link>
                  , select required permissions for your bot, and paste the
                  resulting number here (shown at the top of the website). This
                  will be used for users to add your bot.
                </p>
              </div>
              <input
                type="number"
                min={0}
                value={permissions}
                onChange={(e) => setPermissions(parseInt(e.target.value))}
              />

              <button onClick={createProject}>Create Project</button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  function showVisibilityInfo() {
    const Queue = Swal.mixin({
      progressSteps: ["1", "2", "3", "4"],
      animation: false,
      showCancelButton: true,
      cancelButtonText: "Close",
      confirmButtonText: "Next >",

      ...modalThemeColor(userCache.user),
    });

    Queue.fire({
      animation: true,
      title: "Situation 1",
      html: `<strong>Project visibility is public, bot visibility is private</strong> <br /> <br /> This means your project will show up on the explore page. Anyone can search for and view your project, including the blocks. However, no one will be able to view your bot information or add your bot to servers.`,
      currentProgressStep: 0,
    }).then((r) => {
      if (!r.isConfirmed) return;

      Queue.fire({
        title: "Situation 2",
        html: `<strong>Project visibility is private, bot visibility is public</strong> <br /> <br /> Your project will not show up on the explore page, and only people you invite can view your project and its blocks. However, anyone can search for and view your bot's information (username, server count, etc.) and add your bot to their servers.`,
        currentProgressStep: 1,
      }).then((r) => {
        if (!r.isConfirmed) return;

        Queue.fire({
          title: "Situation 3",
          html: `<strong>Both project and bot visibility are public</strong> <br /> <br /> Your project and bot information will both show up together on the explore page, and anyone can search for and view your project and its blocks. Additionally, anyone can add your bot to their servers and view its information.`,
          currentProgressStep: 2,
        }).then((r) => {
          if (!r.isConfirmed) return;

          Queue.fire({
            title: "Situation 4",
            html: `<strong>Both project and bot visibility are private</strong> <br /> <br /> No one except you and the people you invite can view your project, its blocks, or your bot's information. Your project will not show up on the explore page, and only invited users can view your project and its blocks.`,
            currentProgressStep: 3,
            showConfirmButton: false,
          });
        });
      });
    });
  }

  function createProject() {
    axios
      .post(
        apiUrl + `/projects/${projectId}/clones`,
        {
          description,
          private: projectVisibility === "private",
          botPrivate: botVisibility === "private",
          botToken: token,
          permissions,
        },
        {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        },
      )
      .then(
        ({ data }) =>
          (window.location = `/@${userCache.user.username}/${data._id}/workspace`),
      )
      .catch((err) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error Creating Project",
          text:
            err.response?.data?.error ||
            "An error occurred while creating the project. Please try again.",
          ...modalThemeColor(userCache.user),
        });
      });
  }

  function findBot() {
    setLoading(true);

    axios
      .get(discordUrl + "/users/@me", {
        headers: { Authorization: "Bot " + token },
      })
      .then((response) => {
        setBot(response.data);
        setLoading(false);
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Invalid Token Provided",
          text: "Please check your token and try again.",
          ...modalThemeColor(userCache.user),
        });
        setLoading(false);
      });
  }
}
