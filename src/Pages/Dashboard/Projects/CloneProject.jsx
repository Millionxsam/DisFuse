import { useEffect, useState } from "react";
import LoadingAnim from "../../../components/LoadingAnim";
import axios from "axios";
import { apiUrl, discordUrl } from "../../../config/config";
import Swal from "sweetalert2";
import modalThemeColor from "../../../functions/modalThemeColor";
import { userCache } from "../../../cache.ts";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import showLimitReached from "../../../functions/limitReached.js";
import usePlanLimits, { hasRoom } from "../../../functions/usePlanLimits.js";
import { PlanLimitReached } from "../../../components/premium/PlanUsage.jsx";
import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";
import {
  BotCard,
  ConnectBot,
  DescriptionCard,
  PermissionsCard,
  Steps,
  SubmitButton,
  VisibilityCard,
} from "./projectForm.jsx";

export default function CloneProject() {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
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

  const limits = usePlanLimits();

  const pageHead = (
    <div className="df-page-head">
      <h1>
        <i className="fa-solid fa-clone"></i> Clone "{project.name}"
      </h1>
      <div className="df-toolbar">
        <div className="df-btn-group">
          <DocsLink page={DOCS.creatingAProject} label="How this works" />
        </div>
      </div>
    </div>
  );

  /* A clone is a new project of your own, so it needs room like any other. */
  if (limits.loading || !hasRoom(limits.data, "projects"))
    return (
      <div className="df-page np-page">
        <Helmet>
          <title>Clone Project | DisFuse</title>
        </Helmet>
        {pageHead}
        {limits.loading ? (
          <LoadingAnim />
        ) : (
          <PlanLimitReached resource="projects" data={limits.data} />
        )}
      </div>
    );

  return (
    <div className="df-page np-page">
      <Helmet>
        <title>Clone Project | DisFuse</title>
      </Helmet>
      {pageHead}

      <Steps
        labels={["Connect your bot", "Set up the copy"]}
        current={bot ? 1 : 0}
      />

      {!bot ? (
        <ConnectBot
          token={token}
          setToken={setToken}
          loading={loading}
          onSubmit={findBot}
        />
      ) : (
        <div className="np-setup">
          <BotCard bot={bot}>
            <button
              type="button"
              className="np-btn np-btn--ghost"
              onClick={() => {
                setBot(null);
                setToken("");
              }}
            >
              <i className="fa-solid fa-arrow-left noRotate"></i>
              Use a different bot
            </button>
          </BotCard>

          <div className="np-form">
            <DescriptionCard value={description} onChange={setDescription} />
            <VisibilityCard
              editor={project.type}
              project={projectVisibility}
              setProject={setProjectVisibility}
              bot={botVisibility}
              setBot={setBotVisibility}
            />
            <PermissionsCard value={permissions} onChange={setPermissions} />

            <SubmitButton
              busy={creating}
              busyLabel="Creating"
              icon="fa-solid fa-clone"
              onClick={createProject}
            >
              Create Copy
            </SubmitButton>
          </div>
        </div>
      )}
    </div>
  );

  function createProject() {
    setCreating(true);
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
        setCreating(false);
        if (
          showLimitReached(err, modalThemeColor(userCache.user), {
            title: "Project limit reached",
          })
        )
          return;

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
