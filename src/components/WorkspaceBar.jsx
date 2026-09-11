import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as Blockly from "blockly";
import Swal from "sweetalert2";

import UserTag from "./UserTag";
import { userCache } from "../cache.ts";
import modalThemeColor from "../functions/modalThemeColor.js";
import {
  buildDf,
  isProjectDfFile,
  parseDfWorkspaceData,
} from "../functions/dfFile";
import { refreshProjectWorkspaces } from "../functions/projectData";
import {
  pickVersionAndScope,
  workspacesForChoice,
} from "../functions/versionPicker";
import {
  createVersionWorkspace,
  saveVersionWorkspaceData,
} from "../api/versions";
import { openVersionControl } from "./VersionControl";

import { DOCS, docsUrl } from "../config/docs.js";

/* =====================================================================
   What the Help menu offers
   ---------------------------------------------------------------------
   Four groups, in the order somebody works: what the editor is, then the
   block reference — one entry per category of blocks, matching the
   categories down the left of the screen — then the project-wide tools,
   and finally the pages that answer "it is not working".

   Every docs page a person can need while building is reachable from
   here, so being stuck in the editor never means going hunting for the
   docs site.
   ===================================================================== */
const HELP_LINKS = [
  { page: DOCS.theEditor, label: "The editor", icon: "fa-desktop" },
  { page: DOCS.codingYourBot, label: "Coding your bot", icon: "fa-code" },
  { page: DOCS.usingBlocks, label: "Using blocks", icon: "fa-cubes" },
  { page: DOCS.workspaces, label: "Workspaces", icon: "fa-folder-tree" },
  { separator: "blocks" },
  { page: DOCS.componentBlocks, label: "Components", icon: "fa-layer-group" },
  { page: DOCS.messageBlocks, label: "Messages", icon: "fa-comment-dots" },
  { page: DOCS.serverBlocks, label: "Servers", icon: "fa-server" },
  { page: DOCS.eventBlocks, label: "Events", icon: "fa-bolt" },
  {
    page: DOCS.interactions,
    label: "Commands & interactions",
    icon: "fa-terminal",
  },
  { page: DOCS.appBlocks, label: "Apps & utilities", icon: "fa-puzzle-piece" },
  {
    page: DOCS.blockPacks,
    label: "Custom blocks & BlockBuddy",
    icon: "fa-shapes",
  },
  { separator: "tools" },
  {
    page: DOCS.componentsV2,
    label: "Building a message",
    icon: "fa-wand-magic-sparkles",
  },
  { page: DOCS.templates, label: "Templates", icon: "fa-clone" },
  { page: DOCS.secrets, label: "Secrets", icon: "fa-key" },
  {
    page: DOCS.versionControl,
    label: "Version control",
    icon: "fa-code-branch",
  },
  { page: DOCS.collaboration, label: "Collaboration", icon: "fa-user-group" },
  { separator: "stuck" },
  {
    page: DOCS.runningYourBot,
    label: "Exporting & hosting",
    icon: "fa-rocket",
  },
  { page: DOCS.bestPractices, label: "Best practices", icon: "fa-lightbulb" },
  { page: DOCS.troubleshooting, label: "Troubleshooting", icon: "fa-bug" },
  { page: DOCS.intro, label: "All documentation", icon: "fa-book" },
];

/* =====================================================================
   The workspace toolbar
   ---------------------------------------------------------------------
   The bar across the top of the editor: the project's name, the File and
   Utilities menus, who else is here, the two live indicators, and the
   project-wide actions.

   Everything it does is now a prop. It used to render bare buttons with
   no handlers — `button.invite`, `button.export`, `#showCode`,
   `#templates`, `#toggleToolbox` — and the editor reached across the
   tree with `document.querySelector(...).addEventListener(...)` to make
   them work. The same went for the two indicators, whose contents were
   written by `innerHTML` from two other files, and for the project name,
   which was assigned into an empty `<p>` and blanked again by any
   re-render.

   About six hundred lines of commented-out BlockBuddy and
   block-metadata code were removed with it.
   ===================================================================== */

/**
 * @param {object} props
 * @param {Array}  props.versions        version summaries, empty on a
 *                                       project that has never used
 *                                       Version Control
 * @param {object} [props.activeVersion] the version being edited
 * @param {number} [props.blockCount]    blocks in the open workspace
 * @param {string} [props.savedAt]       when autosave last succeeded
 * @param {string} [props.saveState]     "saving" | "saved" | "error"
 */
export default function WorkspaceBar({
  project,
  workspace,
  currentWorkspace,
  activeUsers = [],
  versions = [],
  activeVersion = null,
  blockCount = null,
  savedAt = null,
  saveState = "idle",
  canManage = false,
  reconnecting = false,
  onOpenSecrets,
  onOpenInvite,
  onToggleToolbox,
  onShowCode,
  onExport,
  onLoadTemplate,
}) {
  const navigate = useNavigate();

  const [active, setActive] = useState(false);
  const [fileDropdownOpen, setFileDropdown] = useState(false);
  const [utilDropdownOpen, setUtilDropdown] = useState(false);
  const [helpDropdownOpen, setHelpDropdown] = useState(false);
  /* The menu stays mounted while hidden, so it would otherwise reopen at
     whatever scroll position it was left at. */
  const helpMenuRef = useRef(null);
  const [usersOpen, setUsersOpen] = useState(false);

  /* Clicking anywhere else closes whichever menu is open. Both used to
     stay open until their own button was pressed again. */
  useEffect(() => {
    if (
      !fileDropdownOpen &&
      !utilDropdownOpen &&
      !helpDropdownOpen &&
      !usersOpen
    )
      return undefined;

    function onDocumentClick(event) {
      if (event.target.closest(".dropdown, .activeUsers")) return;

      setFileDropdown(false);
      setUtilDropdown(false);
      setHelpDropdown(false);
      setUsersOpen(false);
    }

    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [fileDropdownOpen, helpDropdownOpen, usersOpen, utilDropdownOpen]);

  function closeMenus() {
    setFileDropdown(false);
    setUtilDropdown(false);
    setHelpDropdown(false);
  }

  /** Runs a menu action and closes the menu it came from. */
  function run(action) {
    return () => {
      closeMenus();
      action?.();
    };
  }

  function openMenu() {
    const container = document.querySelector(
      ".workspace-navbar .content-container",
    );

    if (!container) return;

    if (active) {
      container.style.height = "0";
      setActive(false);
      return;
    }

    container.style.height =
      document.body.clientWidth <= 396 ? "45%" : "30vh";
    setActive(true);
  }

  const ownerName = project?.owner?.username;

  return (
    <div className="workspace-navbar">
      <div className="logo">
        <Link to="/projects">
          <img src="/media/disfuse-clear.png" alt="DisFuse" />
        </Link>
      </div>

      <div
        className="projectName"
        onClick={() =>
          ownerName && navigate(`/@${ownerName}/${project._id}`)
        }
      >
        <p>{project?.name ?? ""}</p>
      </div>

      {canManage && (
        <i
          onClick={() => navigate(`/@${ownerName}/${project._id}/edit`)}
          className="fa-solid fa-pen-to-square"
          id="editProject-icon"
          title="Project settings"
        />
      )}

      <div
        onClick={() => openWorkspaceTabs(workspace)}
        id="workspace-tabs-open-container"
      >
        <i className="workspace-tabs-open fa-solid fa-chevron-down" />
      </div>

      <div className="content-container">
        <div className="left">
          <ul>
            <div className="dropdown" style={{ position: "relative" }}>
              <button
                className="dropdown-button"
                onClick={() => {
                  setFileDropdown(!fileDropdownOpen);
                  setUtilDropdown(false);
                  setHelpDropdown(false);
                }}
              >
                <i className="fa-solid fa-file" />
                <div>File</div>
                <i
                  className={`fa-solid fa-chevron-${
                    fileDropdownOpen ? "up" : "down"
                  } noRotate`}
                />
              </button>
              <div
                className="dropdown-content"
                style={{
                  position: "absolute",
                  top: "calc(100% + 5px)",
                  zIndex: 1000,
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  display: fileDropdownOpen ? "flex" : "none",
                }}
              >
                <button id="save" onClick={run(saveFile)}>
                  <i className="fa-solid fa-file-arrow-down" />
                  Download
                </button>
                <button id="load" onClick={run(loadFile)}>
                  <i className="fa-solid fa-upload" />
                  Load File
                </button>
                <button id="showCode" onClick={run(onShowCode)}>
                  <i className="fa-brands fa-square-js" />
                  <div>Show Code</div>
                </button>
              </div>
            </div>

            <div className="dropdown" style={{ position: "relative" }}>
              <button
                className="dropdown-button"
                onClick={() => {
                  setUtilDropdown(!utilDropdownOpen);
                  setFileDropdown(false);
                  setHelpDropdown(false);
                }}
              >
                <i className="fa-solid fa-wrench" />
                <div>Utilities</div>
                <i
                  className={`fa-solid fa-chevron-${
                    utilDropdownOpen ? "up" : "down"
                  } noRotate`}
                />
              </button>
              <div
                className="dropdown-content"
                style={{
                  position: "absolute",
                  top: "calc(100% + 5px)",
                  zIndex: 1000,
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  display: utilDropdownOpen ? "flex" : "none",
                }}
              >
                <button
                  className={`secrets${canManage ? "" : " disabled"}`}
                  onClick={run(canManage ? onOpenSecrets : undefined)}
                  disabled={!canManage}
                  title={
                    canManage ? "Secrets" : "Only the owner can manage secrets"
                  }
                >
                  <i className="fa-solid fa-key" />
                  <div>Secrets</div>
                </button>
                <button id="templates" onClick={run(onLoadTemplate)}>
                  <i className="fa-solid fa-shapes" />
                  <div>Templates</div>
                </button>
                <button id="toggleToolbox" onClick={run(onToggleToolbox)}>
                  <i className="fa-solid fa-screwdriver-wrench" />
                  <div>Toggle Toolbox</div>
                </button>
              </div>
            </div>

            {/* Help is a menu rather than a single link because the
                editor is where every part of the docs is reachable from:
                the person who is stuck is stuck *here*, and what they
                need is whichever page covers the thing in front of
                them. Every item opens in a new tab, so nothing is lost
                by looking something up mid-build. */}
            <div className="dropdown" style={{ position: "relative" }}>
              <button
                className="dropdown-button"
                onClick={() => {
                  if (!helpDropdownOpen && helpMenuRef.current)
                    helpMenuRef.current.scrollTop = 0;
                  setHelpDropdown(!helpDropdownOpen);
                  setFileDropdown(false);
                  setUtilDropdown(false);
                }}
              >
                <i className="fa-solid fa-circle-question" />
                <div>Help</div>
                <i
                  className={`fa-solid fa-chevron-${
                    helpDropdownOpen ? "up" : "down"
                  } noRotate`}
                />
              </button>
              <div
                ref={helpMenuRef}
                className="dropdown-content help-menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 5px)",
                  zIndex: 1000,
                  flexDirection: "column",
                  alignItems: "center",
                  /* `center` centres the list inside the scroll box, so a
                     menu taller than its max-height overflows equally off
                     both ends and opens scrolled to the middle. */
                  justifyContent: "flex-start",
                  gap: "5px",
                  display: helpDropdownOpen ? "flex" : "none",
                }}
              >
                {HELP_LINKS.map((link) =>
                  link.separator ? (
                    <hr key={link.separator} />
                  ) : (
                    <a
                      key={link.page}
                      href={docsUrl(link.page)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMenus}
                    >
                      <i className={`fa-solid ${link.icon}`} />
                      <div>{link.label}</div>
                    </a>
                  ),
                )}
              </div>
            </div>
          </ul>
        </div>

        <div className="right">
          <ul>
            {activeUsers.length >= 2 && (
              <div className="activeUsers">
                <div onClick={() => setUsersOpen(!usersOpen)}>
                  {activeUsers.map((user) => (
                    <img
                      key={user.id}
                      src={
                        user?.avatar ??
                        "https://cdn.discordapp.com/embed/avatars/0.png"
                      }
                      alt=""
                    />
                  ))}{" "}
                  {activeUsers.length} Active Users
                  <i className="fa-solid fa-chevron-down" />
                </div>
                <ul className={usersOpen ? "active" : ""}>
                  {activeUsers.map((user) => (
                    <li key={user.id}>
                      <UserTag user={user} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <i className="indicator" id="blocks-indicator">
              <i className="fa-solid fa-cube" />
              <div>{blockCount ?? "??"} blocks</div>
            </i>

            {/* Driven by props rather than by `innerHTML` from inside the
                autosave function, which is what used to write here. */}
            <i
              className="indicator"
              id="autosave-indicator"
              style={{
                display: saveState === "idle" && !savedAt ? "none" : "flex",
              }}
              title={
                saveState === "error"
                  ? "The last save failed"
                  : reconnecting
                    ? "Reconnecting…"
                    : "Last saved"
              }
            >
              {saveState === "error" ? (
                <>
                  <i className="fa-solid fa-triangle-exclamation" />
                  <div>Error</div>
                </>
              ) : reconnecting ? (
                <>
                  <i className="fa-solid fa-plug-circle-exclamation" />
                  <div>Reconnecting</div>
                </>
              ) : saveState === "saving" ? (
                <>
                  <i className="fa-solid fa-cloud-arrow-up" />
                  <div>Saving</div>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud" />
                  <div>{savedAt}</div>
                </>
              )}
            </i>

            {/* Version Control sits with the other project-wide tools
                rather than beside Export, because it acts on the whole
                project and not on the file being edited. The active
                version's name doubles as the label so it is always
                visible while working. */}
            <button
              id="versionControl"
              onClick={run(openVersionControl)}
              title={
                activeVersion
                  ? `Editing ${activeVersion.name}`
                  : "Save versions of this project"
              }
            >
              <i className="fa-solid fa-code-branch" />
              <div>{activeVersion ? activeVersion.name : "Versions"}</div>
            </button>

            <button
              className={`invite${canManage ? "" : " disabled"}`}
              onClick={canManage ? onOpenInvite : undefined}
              disabled={!canManage}
              title={
                canManage
                  ? "Invite collaborators"
                  : "Only the owner can invite collaborators"
              }
            >
              <div>Invite</div>
              <i className="fa-solid fa-share" />
            </button>

            <button className="export" onClick={onExport}>
              <div>Export</div>
              <i className="fa-solid fa-download" />
            </button>
          </ul>
        </div>
      </div>

      <i onClick={openMenu} className="fa-solid fa-bars menu" />
    </div>
  );

  function loadFile() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".df";

    fileInput.addEventListener("change", (e) => {
      let file = e.target.files[0];
      if (!file) return;

      let reader = new FileReader();

      reader.onload = async (event) => {
        let data = event.target.result;

        let json;
        try {
          json = JSON.parse(data);
        } catch (error) {
          return Swal.fire("Error", String(error), "error");
        }

        if (isProjectDfFile(json)) {
          return importProjectFile(json);
        }

        if (!json.blocks || !json.blocks.blocks) {
          return Swal.fire(
            "Error",
            "The selected file doesn't contain any blocks.",
            "error",
          );
        }

        loadWorkspaceData(
          json,
          "Do you want to replace the blocks in the current workspace?",
        );
      };

      reader.readAsText(file);
    });

    fileInput.click();
    fileInput.remove();
  }

  function loadWorkspaceData(wsData, text) {
    Swal.fire({
      title: "Load Blocks from File",
      text,
      showCancelButton: true,
      showDenyButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Combine with current workspace",
      denyButtonText: "Replace blocks",
      icon: "question",
      animation: true,
      ...modalThemeColor(userCache.user),
    }).then((result) => {
      if (result.isDismissed) return;

      if (result.isDenied) {
        Blockly.serialization.workspaces.load(wsData, workspace);
      } else {
        wsData.blocks = wsData.blocks || { blocks: [] };
        wsData.blocks.blocks = (wsData.blocks.blocks || []).concat(
          Blockly.serialization.workspaces.save(workspace)?.blocks?.blocks ||
            [],
        );

        Blockly.serialization.workspaces.load(wsData, workspace);
      }
    });
  }

  async function importProjectFile(json) {
    const fileWorkspaces = (json.workspaces || []).filter((ws) => ws?.name);

    const result = await Swal.fire({
      title: "Import Project File",
      text: `This file contains ${
        fileWorkspaces.length
      } workspace${fileWorkspaces.length === 1 ? "" : "s"}. How would you like to import it?`,
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Import whole project",
      denyButtonText: "Load into current workspace",
      ...modalThemeColor(userCache.user),
    });

    if (result.isDismissed) return;

    if (result.isDenied) {
      let target = fileWorkspaces[0];

      if (fileWorkspaces.length > 1) {
        const pick = await Swal.fire({
          title: "Select a workspace",
          input: "select",
          inputOptions: Object.fromEntries(
            fileWorkspaces.map((ws, i) => [i, ws.name]),
          ),
          showCancelButton: true,
          ...modalThemeColor(userCache.user),
        });

        if (!pick.isConfirmed) return;
        target = fileWorkspaces[Number(pick.value)];
      }

      return loadWorkspaceData(
        parseDfWorkspaceData(target.data),
        `Do you want to load "${target.name}" into the current workspace?`,
      );
    }

    /* The file's workspaces are written wherever this project saves:
       into the active version, or into the project itself. */
    const projectWorkspaces = project.workspaces || [];
    let created = 0;
    let updated = 0;

    try {
      for (const ws of fileWorkspaces) {
        const existing = projectWorkspaces.find((pw) => pw.name === ws.name);
        const data = JSON.stringify(parseDfWorkspaceData(ws.data));

        if (existing) {
          if (activeVersion)
            await saveVersionWorkspaceData(
              project._id,
              activeVersion._id,
              existing._id,
              data,
            );
          else
            await axios.patch(
              apiUrl +
                `/projects/${project._id}/workspaces/${existing._id}/data`,
              { name: ws.name, data },
              {
                headers: {
                  Authorization: localStorage.getItem("disfuse-token"),
                },
              },
            );

          updated++;
        } else {
          if (activeVersion)
            await createVersionWorkspace(project._id, activeVersion._id, {
              name: ws.name,
              data,
            });
          else
            await axios.post(
              apiUrl + `/projects/${project._id}/workspaces`,
              { name: ws.name, data },
              {
                headers: {
                  Authorization: localStorage.getItem("disfuse-token"),
                },
              },
            );

          created++;
        }
      }
    } catch (error) {
      console.error(error);

      return Swal.fire({
        title: "Couldn't import that file",
        text:
          error.response?.data?.error ||
          "Something went wrong importing this project file.",
        icon: "error",
        ...modalThemeColor(userCache.user),
      }).then(() => {
        if (created || updated) window.location.reload();
      });
    }

    Swal.fire({
      toast: true,
      position: "top-right",
      timer: 5000,
      timerProgressBar: true,
      icon: "success",
      title: `Imported ${fileWorkspaces.length} workspace${
        fileWorkspaces.length === 1 ? "" : "s"
      } (${created} created, ${updated} updated)`,
      showConfirmButton: false,
      ...modalThemeColor(userCache.user),
    }).then(() => window.location.reload());
  }

  /**
   * Downloads a .df of the project's blocks.
   *
   * Called "Download" rather than "Save" because nothing about it is
   * saving: the project is already saved continuously, and on a Version
   * Control project it is saved into a version. This writes a file.
   */
  async function saveFile() {
    const choice = activeVersion
      ? await pickVersionAndScope({
          versions,
          activeVersionId: activeVersion._id,
          title: "Download .df File",
          confirmButtonText: "Download",
          html: "A .df file holds blocks, so it saves the version you pick exactly as it is now.",
          modalColors: modalThemeColor(userCache.user),
        })
      : await legacyScopeChoice();

    if (!choice) return;

    const whole = choice.scope === "project";

    /* Whatever is on screen wins over the last autosave — but only for
       the version being edited. Versions share workspace IDs, so handing
       the live workspace to a download of a DIFFERENT version would
       write this version's blocks into that version's file. */
    const editingChosen =
      !activeVersion || String(choice.versionId) === String(activeVersion._id);

    /* The version being edited is the one already in `project.workspaces`,
       so it costs no request — but those are the blocks the page was opened
       with. Everything except the workspace that's open is refetched so a
       download really holds the latest blocks of every workspace. */
    const latestProject = editingChosen
      ? await refreshProjectWorkspaces(project, project._id)
      : project;

    const workspaces = await workspacesForChoice(project._id, choice, {
      activeVersionId: activeVersion?._id,
      projectWorkspaces: latestProject.workspaces || [],
    }).catch((error) => {
      console.error(error);
      return null;
    });

    if (!workspaces)
      return Swal.fire({
        title: "Couldn't read that version",
        text: "Please reload the page and try again.",
        icon: "error",
        ...modalThemeColor(userCache.user),
      });

    const data = buildDf(workspaces, {
      scope: choice.scope,
      ...(editingChosen
        ? { workspace, workspaceId: currentWorkspace?._id }
        : {}),
    });

    const blob = new Blob([JSON.stringify(data)], {
      type: "text/plain",
    });

    let url = window.URL.createObjectURL(blob);
    let anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name}.df`;

    anchor.click();

    window.URL.revokeObjectURL(url);

    Swal.fire({
      toast: true,
      position: "top-right",
      timer: 5000,
      timerProgressBar: true,
      icon: "success",
      title: activeVersion
        ? `Downloaded ${
            whole
              ? versionNameFor(choice.versionId)
              : `one workspace from ${versionNameFor(choice.versionId)}`
          }`
        : whole
          ? "Successfully downloaded whole project"
          : "Successfully downloaded current workspace",
      showConfirmButton: false,
      ...modalThemeColor(userCache.user),
    });
  }

  /** The menu a project that has never used Version Control gets. */
  async function legacyScopeChoice() {
    const response = await Swal.fire({
      title: "Download .df File",
      text: "What would you like to download?",
      icon: "question",
      input: "select",
      inputOptions: {
        project: "Whole project (all workspaces)",
        workspace: "Current workspace only",
      },
      inputValue: "project",
      confirmButtonText: "Download",
      showCancelButton: true,
      ...modalThemeColor(userCache.user),
    });

    if (!response.isConfirmed || !response.value) return null;

    return {
      versionId: null,
      scope:
        response.value === "project"
          ? "project"
          : String(currentWorkspace?._id),
    };
  }

  function versionNameFor(versionId) {
    return (
      versions.find((version) => String(version._id) === String(versionId))
        ?.name || "this version"
    );
  }
}

function openWorkspaceTabs(workspace) {
  document.querySelector(".workspace-tabs").style.height = "5vh";
  document.querySelector(
    ".workspace-navbar .workspace-tabs-open",
  ).style.opacity = "0";

  Blockly.svgResize(workspace);

  setTimeout(() => {
    document.getElementById("workspace-tabs-open-container").style.width = "0";
    document.querySelector("#workspace").style.height = "87.5vh";

    Blockly.svgResize(workspace);

    setTimeout(() => {
      Blockly.svgResize(workspace);
    }, 310);
  }, 310);
}
