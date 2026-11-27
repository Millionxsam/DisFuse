import { useState } from "react";
import LoadingAnim from "../../../components/LoadingAnim";
import axios from "axios";
import { apiUrl, discordUrl } from "../../../config/config";
import Swal from "sweetalert2";
import modalThemeColor from "../../../functions/modalThemeColor";
import { userCache } from "../../../cache.ts";
import { Helmet } from "react-helmet-async";

import joinServer from "../../../functions/joinServer.js";
import showLimitReached from "../../../functions/limitReached.js";
import usePlanLimits, { hasRoom } from "../../../functions/usePlanLimits.js";
import { PlanLimitReached } from "../../../components/premium/PlanUsage.jsx";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";
import {
  BotCard,
  Card,
  ConnectBot,
  DescriptionCard,
  PermissionsCard,
  Steps,
  SubmitButton,
  VisibilityCard,
} from "./projectForm.jsx";

/* The two editors a project can be built with. The block editor is the
   original; DisFuse Builder builds bots from menus and forms instead. */
const EDITORS = [
  {
    value: "blocks",
    label: "Block Editor",
    icon: "fa-solid fa-puzzle-piece",
    tint: "#ffb648",
    description:
      "Build your bot by snapping blocks together, like a puzzle. Great if you like to see exactly how everything fits.",
  },
  {
    value: "builder",
    label: "DisFuse Builder",
    icon: "fa-solid fa-wand-magic-sparkles",
    tint: "#8b6cff",
    isNew: true,
    description:
      "Set up commands and events with simple menus and forms. No blocks and no code, just pick what your bot should do.",
  },
];

export default function NewProject() {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [token, setToken] = useState("");
  const [bot, setBot] = useState(null);

  const [description, setDescription] = useState("");
  const [projectVisibility, setProjectVisibility] = useState("public");
  const [botVisibility, setBotVisibility] = useState("public");
  const [permissions, setPermissions] = useState(0);
  /* Which editor the project is built with. Nothing is picked for the
     user: it can't be changed once the project exists. */
  const [editor, setEditor] = useState(null);
  const [editorMissing, setEditorMissing] = useState(false);

  const limits = usePlanLimits();

  const pageHead = (
    <div className="df-page-head">
      <h1>
        <i className="fa-solid fa-circle-plus"></i>
        New Project
      </h1>
      <div className="df-toolbar">
        <div className="df-btn-group">
          <DocsLink page={DOCS.creatingAProject} label="How this works" />
        </div>
      </div>
    </div>
  );

  /* No room for another project: say so before a bot token is asked for.
     The API refuses it either way. */
  if (limits.loading || !hasRoom(limits.data, "projects"))
    return (
      <div className="df-page np-page">
        <Helmet>
          <title>New Project | DisFuse</title>
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
        <title>New Project | DisFuse</title>
      </Helmet>
      {pageHead}

      <Steps
        labels={["Connect your bot", "Set up the project"]}
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
            <Card
              title="Editor"
              description="How do you want to build your bot?"
              className="np-editors"
              id="np-editors"
            >
              <div
                className="np-editors__grid"
                role="radiogroup"
                aria-label="Editor"
              >
                {EDITORS.map((option) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={editor === option.value}
                    key={option.value}
                    className={`np-editor ${editor === option.value ? "np-editor--active" : ""}`}
                    style={{ "--np-tint": option.tint }}
                    onClick={() => {
                      setEditor(option.value);
                      setEditorMissing(false);
                    }}
                  >
                    <span className="np-editor__top">
                      <span className="np-editor__art">
                        <i
                          className={`${option.icon} noRotate`}
                          aria-hidden
                        ></i>
                      </span>
                      {option.isNew && (
                        <span className="np-editor__new">New</span>
                      )}
                      <span className="np-editor__check" aria-hidden>
                        <i className="fa-solid fa-check noRotate"></i>
                      </span>
                    </span>
                    <b>{option.label}</b>
                    <span className="np-editor__text">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
              {editorMissing && (
                <p className="np-editors__error" role="alert">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  Pick an editor to create your project.
                </p>
              )}
              <p className="np-note">
                <i className="fa-solid fa-circle-info"></i>
                You can't switch editors after the project is made. You can
                still make a second project for the same bot with the other
                editor.
              </p>
            </Card>

            <DescriptionCard value={description} onChange={setDescription} />
            <VisibilityCard
              editor={editor}
              project={projectVisibility}
              setProject={setProjectVisibility}
              bot={botVisibility}
              setBot={setBotVisibility}
            />
            <PermissionsCard value={permissions} onChange={setPermissions} />

            <SubmitButton
              busy={creating}
              busyLabel="Creating"
              icon="fa-solid fa-plus"
              onClick={createProject}
            >
              Create Project
            </SubmitButton>
          </div>
        </div>
      )}
    </div>
  );

  function createProject() {
    if (!editor) {
      setEditorMissing(true);
      document
        .getElementById("np-editors")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setCreating(true);
    axios
      .post(
        apiUrl + `/projects`,
        {
          type: editor,
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
          err.response?.data?.error ===
          "You must be in the DisFuse server to create a project"
        )
          return joinServer(createProject);

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
