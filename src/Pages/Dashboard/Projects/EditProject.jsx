import { useEffect, useState } from "react";
import LoadingAnim from "../../../components/LoadingAnim";
import axios from "axios";
import { apiUrl, discordUrl } from "../../../config/config";
import Swal from "sweetalert2";
import modalThemeColor from "../../../functions/modalThemeColor";
import { userCache } from "../../../cache.ts";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";
import {
  BotCard,
  Card,
  DescriptionCard,
  PermissionsCard,
  SubmitButton,
  TokenHelp,
  TokenInput,
  VisibilityCard,
} from "./projectForm.jsx";
import {
  PACKAGE_MANAGERS,
  RUNTIMES,
  userExportSettings,
} from "../../../config/exportSettings.js";

export default function EditProject() {
  const [project, setProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [token, setToken] = useState("");
  const [description, setDescription] = useState("");
  const [projectVisibility, setProjectVisibility] = useState();
  const [botVisibility, setBotVisibility] = useState();
  const [permissions, setPermissions] = useState(0);
  /* "" means "use my default from Settings → Export". */
  const [runtime, setRuntime] = useState("");
  const [packageManager, setPackageManager] = useState("");

  const [botFailed, setBotFailed] = useState(false);

  const { projectId } = useParams();

  /* A DisFuse Builder collaborator can open this page too, and change
     just the settings the owner gave them permission for. The API
     checks each field again. */
  const me = userCache.user?.id;
  const isOwner = !project.owner || project.owner.id === me;
  const granted = project.collaboratorPermissions?.[me] ?? [];
  const may = (permission) => isOwner || granted.includes(permission);
  /* What a collaborator who may not see the token gets instead of it. */
  const tokenHidden = project.botToken === "[HIDDEN]";

  useEffect(() => {
    setDescription(project.description);
    setToken(project.botToken === "[HIDDEN]" ? "" : project.botToken);
    setProjectVisibility(project.private ? "private" : "public");
    setBotVisibility(project.botPrivate ? "private" : "public");
    setPermissions(project.permissions || 0);
    setRuntime(project.exportSettings?.runtime || "");
    setPackageManager(project.exportSettings?.packageManager || "");
  }, [project]);

  useEffect(() => {
    axios
      .get(apiUrl + `/projects/${projectId}`, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(async ({ data: project }) => {
        setProject(project);

        /* Nothing to check from here; the API keeps the real one. */
        if (project.botToken === "[HIDDEN]") {
          setBotFailed(false);
          return setLoading(false);
        }

        if (!project.botToken?.length) {
          setBotFailed(true);
          return setLoading(false);
        }

        axios
          .get(discordUrl + "/users/@me", {
            headers: { Authorization: "Bot " + project.botToken },
          })
          .then(() => {
            setBotFailed(false);
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
            setBotFailed(true);
          });
      })
      .catch(() => {
        window.location = "/projects";
      });
  }, [projectId]);

  return (
    <div className="df-page np-page">
      <Helmet>
        <title>Edit Project | DisFuse</title>
      </Helmet>
      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-pen-to-square"></i> Edit Project
        </h1>
        <div className="df-toolbar">
          <div className="df-btn-group">
            <DocsLink page={DOCS.projectSettings} />
          </div>
        </div>
      </div>

      {!project?._id ? (
        <LoadingAnim />
      ) : (
        <div className="np-setup">
          {loading ? (
            <aside className="np-bot np-bot--loading">
              <LoadingAnim onlySpinner />
            </aside>
          ) : botFailed ? (
            <aside className="np-bot np-bot--warn" role="alert">
              <span className="np-bot__warn-icon">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </span>
              <div className="np-bot__name">
                <b>
                  {project.botToken?.length
                    ? "Invalid bot token"
                    : "Project setup incomplete"}
                </b>
                <span>
                  {project.botToken?.length
                    ? "Your bot token may have been reset. Paste a new one under Bot token for your bot to run properly."
                    : "To use your project, add your bot token under Bot token."}
                </span>
              </div>
            </aside>
          ) : (
            <BotCard bot={project.bot || {}}>
              <p className="np-bot__hint">Changed your bot's name or avatar?</p>
              <button
                type="button"
                className="np-btn np-btn--ghost"
                onClick={saveProject}
              >
                <i className="fa-solid fa-rotate noRotate"></i>
                Sync with Discord
              </button>
            </BotCard>
          )}

          <div className="np-form">
            {!isOwner && (
              <div className="df-editor-note">
                <i className="fa-solid fa-user-group"></i>
                <div>
                  <strong>You're a collaborator on this project.</strong> You
                  can only change the settings its owner gave you permission
                  for. The rest are grayed out.
                </div>
              </div>
            )}

            <div className="df-editor-note">
              <i
                className={`fa-solid ${
                  project.type === "builder"
                    ? "fa-wand-magic-sparkles"
                    : "fa-puzzle-piece"
                }`}
              ></i>
              <div>
                <strong>
                  This project uses{" "}
                  {project.type === "builder"
                    ? "DisFuse Builder"
                    : "the Block Editor"}
                  .
                </strong>{" "}
                A project's editor can't be changed. To try the other one, make
                a new project for the same bot.
              </div>
              {project.type === "builder" && (
                <Link
                  className="df-editor-note-link"
                  to={`/@${project.owner?.username}/${project._id}/workspace`}
                >
                  <i className="fa-solid fa-arrow-left"></i> Back to the
                  dashboard
                </Link>
              )}
            </div>

            <DescriptionCard
              value={description}
              onChange={setDescription}
              disabled={!may("settings.description")}
            />

            <Card
              title="Bot token"
              docs={{
                page: `${DOCS.projectSettings}#bot-token`,
                label: "Where to find your bot token",
              }}
              description="The token DisFuse runs your bot with. Paste a new one here if you reset it in Discord."
            >
              <TokenInput
                value={token || ""}
                onChange={setToken}
                disabled={!may("token.change")}
                placeholder={
                  tokenHidden
                    ? may("token.change")
                      ? "Hidden. Paste a new token to replace it"
                      : "Hidden"
                    : "Paste your bot token"
                }
              />
              <TokenHelp />
            </Card>

            <VisibilityCard
              editor={project.type}
              project={projectVisibility}
              setProject={setProjectVisibility}
              bot={botVisibility}
              setBot={setBotVisibility}
              projectDisabled={!may("settings.visibility")}
              botDisabled={!may("settings.botVisibility")}
            />

            <PermissionsCard
              value={permissions}
              onChange={setPermissions}
              disabled={!may("settings.invitePermissions")}
            />

            {/* Only the owner picks what the bot is exported to run with. */}
            {isOwner && (
              <Card
                title="Export"
                docs={{
                  page: `${DOCS.projectSettings}#export`,
                  label: "About export settings",
                }}
                description={
                  <>
                    What this bot is set up to run with when you export it. By
                    default it uses your choice in{" "}
                    <Link to="/settings/export">Settings → Export</Link>.
                  </>
                }
              >
                <div className="np-fields">
                  <label className="np-field">
                    <span>Runtime</span>
                    <select
                      className="np-input"
                      value={runtime}
                      onChange={(e) => setRuntime(e.target.value)}
                    >
                      <option value="">
                        My default (
                        {
                          RUNTIMES[userExportSettings(userCache.user).runtime]
                            .label
                        }
                        )
                      </option>
                      {Object.entries(RUNTIMES).map(([value, { label }]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="np-field">
                    <span>Package manager</span>
                    <select
                      className="np-input"
                      value={packageManager}
                      onChange={(e) => setPackageManager(e.target.value)}
                    >
                      <option value="">
                        My default (
                        {
                          PACKAGE_MANAGERS[
                            userExportSettings(userCache.user).packageManager
                          ].label
                        }
                        )
                      </option>
                      {Object.entries(PACKAGE_MANAGERS).map(
                        ([value, { label }]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>
              </Card>
            )}

            <SubmitButton
              busy={saving}
              busyLabel="Saving"
              icon="fa-solid fa-floppy-disk"
              onClick={saveProject}
            >
              Save Changes
            </SubmitButton>
          </div>
        </div>
      )}
    </div>
  );

  function saveProject() {
    setLoading(true);
    setSaving(true);

    /* A collaborator sends only what they may change, so a field they
       can't touch is never sent back as a "change". */
    const changes = isOwner
      ? {
          description,
          private: projectVisibility === "private",
          botPrivate: botVisibility === "private",
          botToken: token,
          permissions,
          exportSettings: {
            runtime: runtime || null,
            packageManager: packageManager || null,
          },
        }
      : {
          ...(may("settings.description") ? { description } : {}),
          ...(may("settings.visibility")
            ? { private: projectVisibility === "private" }
            : {}),
          ...(may("settings.botVisibility")
            ? { botPrivate: botVisibility === "private" }
            : {}),
          ...(may("settings.invitePermissions") ? { permissions } : {}),
          ...(may("token.change") && token ? { botToken: token } : {}),
        };

    /* Nothing to check in the browser when the token stays hidden. */
    const checkToken =
      tokenHidden && !token
        ? Promise.resolve()
        : axios.get(discordUrl + "/users/@me", {
            headers: { Authorization: "Bot " + token },
          });

    checkToken
      .then(() => {
        setLoading(false);

        axios
          .patch(apiUrl + `/projects/${projectId}`, changes, {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          })
          .then(({ data }) => {
            setProject(data);
            setSaving(false);

            Swal.fire({
              toast: true,
              title: "Project Edited",
              icon: "success",
              position: "top-right",
              showConfirmButton: false,
              timer: 3000,
              ...modalThemeColor(userCache.user),
            });

            if (data.botToken === "[HIDDEN]") {
              setBotFailed(false);
              return setLoading(false);
            }

            if (!data.botToken?.length) {
              setBotFailed(true);
              return setLoading(false);
            }

            axios
              .get(discordUrl + "/users/@me", {
                headers: { Authorization: "Bot " + data.botToken },
              })
              .then(() => {
                setBotFailed(false);
                setLoading(false);
              })
              .catch(() => {
                setLoading(false);
                setBotFailed(true);
              });
          })
          .catch((err) => {
            console.error(err);
            setSaving(false);
            Swal.fire({
              icon: "error",
              title: "Error Editing Project",
              text:
                err.response?.data?.error ||
                "An error occurred while editing the project. Please try again.",
              ...modalThemeColor(userCache.user),
            });
          });
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Invalid Token Provided",
          text: "Please check your token and try again.",
          ...modalThemeColor(userCache.user),
        });
        setLoading(false);
        setSaving(false);
      });
  }
}
