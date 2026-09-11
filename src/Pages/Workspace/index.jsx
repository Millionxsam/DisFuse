import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";

import "@blockly/toolbox-search";
import "../../fields/fieldColourHsvSliders";

import CodeView from "../../components/CodeView";
import LoadingAnim from "../../components/LoadingAnim";
import WorkspaceBar from "../../components/WorkspaceBar";
import WorkspaceTabs from "../../components/WorkspaceTabs";
import SecretsModal from "../../components/workspace/SecretsModal.jsx";
import InviteModal from "../../components/workspace/InviteModal.jsx";
import MessagePreview from "../../components/workspace/MessagePreview.jsx";
import { closeMessagePreview } from "../../components/workspace/messagePreviewStore.js";
import VersionControl from "../../components/VersionControl.jsx";

import api, { data, errorMessage } from "../../api/client.js";
import { userCache } from "../../cache.ts";
import getToolbox from "../../config/toolbox";
import joinServer from "../../functions/joinServer.js";
import modalThemeColor from "../../functions/modalThemeColor";
import registerContextMenus from "../../functions/registerContextMenus";
import { updateCode } from "../../functions/updateCode";
import {
  createVersionWorkspace,
  recallActiveVersion,
} from "../../api/versions.js";

import useAutosave from "./useAutosave.js";
import useBlocklyEditor from "./useBlocklyEditor.js";
import useProjectSession from "./useProjectSession.js";
import useVersionControl from "./useVersionControl.js";
import createPresenceLabels from "./editor/presenceLabels.js";
import exportProject from "./editor/exportProject.js";
import {
  loadBlockPacks,
  loadProjectCustomBlocks,
  registerBlockPacks,
  registerProjectCustomBlocks,
} from "./editor/customBlocks.js";
import checkProject, { warnAboutBotToken } from "./editor/projectGuards.js";
import {
  askForFirstWorkspaceName,
  askToMigrateToSubWorkspaces,
  showComponentsV2Onboarding,
  showWelcome,
} from "./editor/onboarding.js";

/* Every block definition and generator DisFuse ships. A side-effect
   import: each module registers itself with Blockly when it loads. */
import "../../blocks/index.js";

import { DOCS, docsUrl } from "../../config/docs.js";

/* Blockly warns about this on every generated block when a generator
   runs outside a full code pass, which is most of what the editor does. */
const originalWarn = console.warn;
console.warn = function (...args) {
  if (
    typeof args[0] === "string" &&
    args[0].includes("CodeGenerator init was not called before blockToCode")
  )
    return;

  originalWarn(...args);
};

const RESERVED_WORDS =
  "getCollection,getFromCollection,forEachCollection,Discord,moment,gamecord,discord_gamecord,easyjsondatabase,Database,client,databases,disfuseCooldowns,wait,process,emoji,channel,channels,member,members,user,users,guild,guilds,server,servers,modalSubmitInteraction,ForEachemojiInServer,interaction,int,scratchUserProfileInformation,errorButWithLengthyName,error,PollCreator,leavingMember,AddMember,AddServer,messageDeleted,messageReaction,messageSent,role,roles,createdThread,boostedMember,unboostedMember,boostedGuild,oldBoostLevel,newBoostLevel,lyrics,lyricsFinder,filePath,fs,readData,err,files,filterItem,localVar,newWebhook,captcha,Captcha,permsChannel,variable,list,disfuse,canvas,ctx,config,dotenv,lyrics_finder,@ddededodediamante/captcha-generator,axios,_napi_rs_canvas,response,_ddededodediamante_captcha_generator";

/* =====================================================================
   The workspace page
   ---------------------------------------------------------------------
   Composes the editor out of four hooks — the socket session, the
   Blockly workspace, autosave and Version Control — and owns the things
   that are genuinely page-level: which sub-workspace is open, the
   modals, the toolbar, and the handful of conditions that mean this
   project cannot be edited at all.

   This file used to be 1,942 lines, effectively all of it inside one
   `useEffect` with an eight-deep callback chain. The behaviour is the
   same; what changed is that each part of it can now be read on its own.
   ===================================================================== */

export default function Workspace() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const user = userCache.user;
  const [modalColors] = useState(() => modalThemeColor(user, false));

  /** "loading" → "preparing" → "editing", or "blocked" when it can't open. */
  const [phase, setPhase] = useState("loading");
  const [toolbox, setToolbox] = useState(null);
  const [blockPacks, setBlockPacks] = useState([]);
  const [secretsOpen, setSecretsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  /* What the toolbar shows. These used to be written into the DOM with
     `innerHTML` from two other files. */
  const [blockCount, setBlockCount] = useState(0);
  const [saveState, setSaveState] = useState("idle");
  const [savedAt, setSavedAt] = useState(null);

  /** The sub-workspace (tab) on screen. */
  const currentWorkspace = useRef({});
  /** Set once, so a re-render can't restart the whole setup. */
  const prepared = useRef(false);
  const presence = useRef(null);
  const toolboxVisible = useRef(true);
  /* The version being edited. A ref, and shared between the page,
     autosave and the Version Control panel, because autosave reads it at
     the moment of sending — a stale closure here would write one
     version's blocks into another. */
  const activeVersion = useRef(null);

  /* ---- The connection --------------------------------------------- */

  const session = useProjectSession(projectId, {
    onServerError: ({ error, fatal }) => {
      if (error === "You must be in the DisFuse server to use this feature")
        return joinServer(() => window.location.reload());

      if (fatal) console.error("Editor socket refused:", error);
    },
    onUserLeave: (leaving) => presence.current?.forget(leaving.id),
  });

  const project = session.project;
  const isOwner = project?.owner?.id === user?.id;

  /* ---- Saving ------------------------------------------------------ */

  /* Collaborating means every change has to reach the other side
     promptly, so the user's "changes until save" preference only applies
     when nobody else is in the project.

     `activeUsers` includes you, which is why this compares against 1
     rather than 0 — the old code checked `> 0` and so was always in
     collaborative mode, making the setting dead. */
  const collaborating = session.activeUsers.length > 1;
  const changesUntilSave = collaborating
    ? 1
    : Math.max(1, user?.settings?.optimization?.changesUntilSave ?? 3);

  const autosave = useAutosave({
    socket: session.socket,
    projectId,
    workspaceRef: currentWorkspace,
    versionRef: activeVersion,
    changesUntilSave,
    onSaving: () => setSaveState("saving"),
    onSaved: (saved) => {
      setSaveState("saved");
      setSavedAt(new Date().toLocaleTimeString([], { timeStyle: "short" }));

      if (!saved) return;

      session.setProject((current) => ({
        ...current,
        workspaces: saved.workspaces ?? current.workspaces,
        lastEdited: saved.lastEdited ?? current.lastEdited,
      }));

      if (activeVersion.current && saved.workspaces)
        activeVersion.current = {
          ...activeVersion.current,
          workspaces: saved.workspaces,
          updated: new Date().toISOString(),
        };
    },
    onError: (error) => {
      console.error("Autosave error:", error);
      setSaveState("error");

      if (error?.serverError === "This project is suspended")
        return Swal.fire({
          ...modalColors,
          title: "Project Suspended",
          icon: "error",
          html: `This project was detected to break our terms of service and has automatically been suspended for the reason:<br /><br />${
            error.reason ?? "None"
          }`,
          footer:
            '<a rel="noopener" target="_blank" href="https://discord.gg/Xwx4zkQcmJ">Join our Discord for support</a>',
          showConfirmButton: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        });

      /* A save that arrived before the socket had rejoined is not worth
         a modal — the session hook rejoins by itself and the next change
         saves normally. This is the case that used to produce a
         "Project does not exist" alert on a perfectly good project. */
      if (error?.rejoin || error?.timedOut) return;

      Swal.fire({
        ...modalColors,
        title: "Autosave Error",
        icon: "error",
        text: error?.message || String(error),
        showConfirmButton: true,
        confirmButtonText: "Reload",
      }).then((result) => {
        if (result.isConfirmed) window.location.reload();
      });
    },
  });

  /* ---- The editor -------------------------------------------------- */

  const editor = useBlocklyEditor({
    enabled: Boolean(toolbox),
    toolbox,
    settings: user?.settings?.workspace,
    optimization: user?.settings?.optimization,
    onProjectChange: (event) => autosave.noteChange(event),
    onSelect: (blockId) => session.announceSelection(blockId),
    onAnyChange: () => presence.current?.onWorkspaceChange(),
    onHousekeeping: (workspace) =>
      setBlockCount(workspace.getAllBlocks(false).length),
  });

  /* ---- Opening a sub-workspace -------------------------------------- */

  const reloadContextMenus = useCallback(() => {
    /* `unregister` throws for an ID that was never registered, and the
       first call always is the first — nothing registers these menus
       before this runs. Unguarded, that throw escaped a render and took
       the whole editor down to a blank page. */
    for (const id of [
      "previewMessage",
      "copyCode",
      "moveBlock",
      "mergeWorkspace",
      "toggleToolbox",
    ])
      if (Blockly.ContextMenuRegistry.registry.getItem(id))
        Blockly.ContextMenuRegistry.registry.unregister(id);

    registerContextMenus(
      session.project,
      currentWorkspace.current,
      activeVersion.current?._id,
    );

    /* Registered here rather than in registerContextMenus so the menu
       item and the toolbar button share one idea of whether the toolbox
       is showing. */
    Blockly.ContextMenuRegistry.registry.register({
      displayText: "Toggle Toolbox",
      scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
      preconditionFn: () => "enabled",
      id: "toggleToolbox",
      callback: (scope) => toggleToolbox(scope.workspace),
    });
  }, [session.project]);

  const toggleToolbox = useCallback((workspace) => {
    toolboxVisible.current = !toolboxVisible.current;
    workspace.getToolbox()?.setVisible(toolboxVisible.current);
    workspace.resize();
  }, []);

  /**
   * Opens a sub-workspace and makes it the one autosave writes to.
   *
   * `keepCurrent` is for the case where the tab list changed underneath
   * us but the open tab is still there — renaming a workspace shouldn't
   * reload its blocks.
   */
  const openWorkspace = useCallback(
    async (workspaces, { keepCurrent = false, index = null } = {}) => {
      const list = workspaces ?? session.project?.workspaces ?? [];

      if (!list.length) {
        /* Nothing to open: a brand new project, or a version created
           empty. The load path knows how to ask for a first workspace. */
        window.location.reload();
        return;
      }

      const target =
        index !== null
          ? list[index]
          : (list.find(
              (ws) => String(ws._id) === String(currentWorkspace.current?._id),
            ) ?? list[0]);

      if (!target) return;

      const staying =
        keepCurrent &&
        String(target._id) === String(currentWorkspace.current?._id);

      currentWorkspace.current = target;

      setSearchParams(
        (params) => {
          params.set("id", String(target._id));
          return params;
        },
        { replace: true },
      );

      reloadContextMenus();

      if (!staying) {
        /* Block ids are per-workspace, so a preview left open would be
           pointing at a block that is no longer on the canvas. */
        closeMessagePreview();
        editor.loadBlocks(target.data);
      }
    },
    [editor, reloadContextMenus, session.project, setSearchParams],
  );

  /** Switching tab, from the tab bar. */
  const loadTab = useCallback(
    async (index) => {
      await autosave.flush();

      if (activeVersion.current) {
        await openWorkspace(session.project?.workspaces, { index });
        return;
      }

      /* On the old system the tab bar can have changed the workspaces on
         the server (adding or renaming one), so read them back. */
      try {
        const fresh = await api.get(`/projects/${projectId}`).then(data);

        session.setProject((current) => ({
          ...current,
          workspaces: fresh.workspaces,
        }));

        await openWorkspace(fresh.workspaces, { index });
      } catch (error) {
        console.error(error);

        Swal.fire({
          ...modalColors,
          title: "Couldn't switch workspace",
          icon: "error",
          text: errorMessage(error, "Please reload the page and try again."),
        });
      }
    },
    [autosave, modalColors, openWorkspace, projectId, session],
  );

  /* ---- Version Control ---------------------------------------------- */

  const versions = useVersionControl({
    projectId,
    activeVersion,
    flushAutosave: autosave.flush,
    openWorkspace,
    setProject: session.setProject,
    setSearchParams,
    modalColors,
  });

  /* ---- Opening the project ------------------------------------------- */

  useEffect(() => {
    if (session.status !== "ready" || prepared.current) return;
    if (!project || !user) return;

    prepared.current = true;

    let cancelled = false;

    async function prepare() {
      /* ---- Reasons this project can't be edited ------------------- */
      const blocked = await checkProject({
        project,
        user,
        isOwner,
        modalColors,
      });

      if (blocked) {
        setPhase("blocked");

        if (blocked.to === "/projects" && !blocked.replace)
          window.location.replace("/projects");
        else navigate(blocked.to, { replace: true });

        return;
      }

      /* Not a blocking condition — the editor opens either way — so this
         runs without being awaited. */
      warnAboutBotToken({ project, isOwner, modalColors }).then((redirect) => {
        if (redirect && !cancelled) navigate(redirect.to, { replace: true });
      });

      setPhase("preparing");

      /* ---- Blocks that aren't ours -------------------------------- */
      const [packs, custom] = await Promise.all([
        loadBlockPacks(user),
        loadProjectCustomBlocks(project),
      ]);

      if (cancelled) return;

      registerBlockPacks(packs);
      registerProjectCustomBlocks(custom);
      setBlockPacks(packs);

      javascriptGenerator.addReservedWords(RESERVED_WORDS);

      /* ---- Which save system, and which version ------------------- */
      let active = null;

      try {
        active = await versions.initialise(project, {
          requestedVersionId: searchParams.get("v"),
          remembered: recallActiveVersion(projectId),
          canManage: isOwner,
        });
      } catch (error) {
        console.error(error);
        setPhase("blocked");

        await Swal.fire({
          ...modalColors,
          title: "Couldn't open this version",
          text: "We couldn't load this project's version data. Please reload the page and try again.",
          icon: "error",
          confirmButtonText: "Reload",
          allowEscapeKey: false,
          allowOutsideClick: false,
        });

        window.location.reload();
        return;
      }

      if (cancelled) return;

      const workspaces = active ? active.workspaces || [] : project.workspaces;

      /* ---- Projects with no sub-workspaces yet -------------------- */
      if (project.data?.length && !workspaces?.length && !active) {
        const name = await askToMigrateToSubWorkspaces(modalColors);
        if (!name) return;

        await api.post(`/projects/${projectId}/workspaces`, {
          name,
          data: project.data,
        });

        window.location.reload();
        return;
      }

      if (!workspaces?.length) {
        const name = await askForFirstWorkspaceName(active?.name, modalColors);
        if (!name) return;

        if (active)
          await createVersionWorkspace(projectId, active._id, { name });
        else await api.post(`/projects/${projectId}/workspaces`, { name });

        window.location.reload();
        return;
      }

      /* ---- Which tab is open -------------------------------------- */
      const requested = searchParams.get("id");
      currentWorkspace.current =
        workspaces.find((ws) => String(ws._id) === requested) ?? workspaces[0];

      if (String(currentWorkspace.current._id) !== requested)
        setSearchParams(
          (params) => {
            params.set("id", String(currentWorkspace.current._id));
            return params;
          },
          { replace: true },
        );

      setToolbox(getToolbox(packs, user));
      setPhase("editing");
    }

    prepare().catch((error) => {
      console.error(error);
      setPhase("blocked");

      Swal.fire({
        ...modalColors,
        title: "Project Error",
        text: errorMessage(
          error,
          "There was an error while loading this project!",
        ),
        icon: "error",
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, project, user]);

  /* ---- Once Blockly exists ------------------------------------------- */

  useEffect(() => {
    if (!editor.ready || phase !== "editing") return undefined;

    const workspace = editor.workspaceRef.current;

    autosave.attach(workspace);

    presence.current = createPresenceLabels(workspace);
    presence.current.setUsers(session.activeUsers);

    editor.loadBlocks(currentWorkspace.current?.data);

    /* The bot token used to be a block. It now lives in project settings,
       and any left over in an old project would generate a second login. */
    for (const block of workspace.getAllBlocks(false))
      if (block.type === "main_token") block.dispose(false, false);

    reloadContextMenus();

    updateCode(workspace, session.project, currentWorkspace.current._id).catch(
      (error) => console.error("Could not generate code:", error),
    );

    showComponentsV2Onboarding(modalColors).then(() =>
      showWelcome(modalColors),
    );

    return () => {
      presence.current?.dispose();
      presence.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.ready, phase]);

  /* Collaborator names and avatars for the labels. */
  useEffect(() => {
    presence.current?.setUsers(session.activeUsers);
  }, [session.activeUsers]);

  /* ---- Replaying other people's changes ------------------------------ */

  useEffect(() => {
    const socket = session.socket;
    if (!socket) return undefined;

    function onRemoteUpdate({ workspaceId, event, versionId }) {
      /* Somebody else's change only belongs on this screen if they are
         editing the same workspace of the same version. Replaying a
         change made in another version would quietly mix two snapshots
         together — which is the one thing versions exist to prevent. */
      if (String(versionId ?? "") !== String(activeVersion.current?._id ?? ""))
        return;

      if (String(currentWorkspace.current._id) !== String(workspaceId)) return;

      editor.applyRemoteEvent(event);
    }

    function onRemoteSelect({ user: who, blockId }) {
      presence.current?.select(who.id, blockId);
    }

    socket.on("projectUpdate", onRemoteUpdate);
    socket.on("blockSelect", onRemoteSelect);

    return () => {
      socket.off("projectUpdate", onRemoteUpdate);
      socket.off("blockSelect", onRemoteSelect);
    };
  }, [editor, session.socket]);

  /* ---- Failing to open ------------------------------------------------ */

  useEffect(() => {
    if (session.status !== "error" || !session.error) return;

    const error = session.error;

    if (error === "You have already joined this project")
      return void Swal.fire({
        ...modalColors,
        title: "Already in Project",
        icon: "info",
        text: "You're already part of this project from another tab or device.",
        confirmButtonText: "OK",
      }).then(() => window.location.replace("/projects"));

    /* Every other join failure used to fall through with no `return`, so
       the page carried on with an error object where the project should
       be, threw on `project.owner.id`, and left the user on a loading
       spinner with no explanation at all. */
    setPhase("blocked");

    Swal.fire({
      ...modalColors,
      title:
        error === "Project does not exist"
          ? "Project Not Found"
          : "Can't open this project",
      icon: "error",
      text:
        error === "Project does not exist"
          ? "This project no longer exists. It may have been deleted."
          : error,
      confirmButtonText: "Back to Projects",
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then(() => window.location.replace("/projects"));
  }, [modalColors, session.error, session.status]);

  /* ---- Toolbar -------------------------------------------------------- */

  const handleExport = useCallback(
    () =>
      exportProject({
        workspace: editor.workspaceRef.current,
        project: session.project,
        projectId,
        activeVersion: activeVersion.current,
        versions: versions.versionsRef.current,
        currentWorkspaceId: currentWorkspace.current._id,
        blockPacks,
        modalColors,
      }),
    [blockPacks, editor, modalColors, projectId, session.project, versions],
  );

  const handleShowCode = useCallback(async () => {
    await updateCode(
      editor.workspaceRef.current,
      session.project,
      currentWorkspace.current._id,
    );

    const view = document.querySelector(".code-view");
    if (view) view.style.display = "flex";
  }, [editor, session.project]);

  const handleLoadTemplate = useCallback(async () => {
    const result = await Swal.fire({
      title: "Load Template",
      html:
        "Which template would you like to load?<br /><br />" +
        `<a style="color: #ffb648" rel="noopener noreferrer" target="_blank" ` +
        `href="${docsUrl(DOCS.templates)}">What each template contains →</a>`,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Load",
      input: "select",
      inputOptions: {
        slashCommand: "Slash Commands",
        pingCommand: "Ping Command",
        economyCommand: "Economy Commands",
        ticketCommands: "Ticket Commands",
        contextMenu: "Context Menu",
      },
      ...modalColors,
    });

    if (!result.isConfirmed) return;

    const workspace = editor.workspaceRef.current;

    /* `import()` returns a promise. This used to read `.blocks` straight
       off it, so the Templates button threw every time it was used. */
    const template = await import(`../../templates/${result.value}.js`);
    const state = structuredClone(
      template.default ?? template.blocks ?? template,
    );

    const existing =
      Blockly.serialization.workspaces.save(workspace)?.blocks?.blocks ?? [];

    state.blocks = state.blocks ?? { blocks: [] };
    state.blocks.blocks = [...(state.blocks.blocks ?? []), ...existing];

    Blockly.serialization.workspaces.load(state, workspace);
  }, [editor, modalColors]);

  /* ---- Render ---------------------------------------------------------- */

  const loading = phase === "loading" || phase === "preparing" || !editor.ready;

  return (
    <>
      <Helmet>
        <title>{`${project?.name || "Workspace"} | DisFuse`}</title>
      </Helmet>

      <WorkspaceBar
        project={project ?? {}}
        workspace={editor.workspaceRef.current}
        activeUsers={session.activeUsers}
        currentWorkspace={currentWorkspace.current}
        versions={versions.versions}
        activeVersion={versions.versions.find(
          (version) => String(version._id) === String(versions.activeVersionId),
        )}
        blockCount={blockCount}
        saveState={saveState}
        savedAt={savedAt}
        canManage={isOwner}
        reconnecting={session.status === "reconnecting"}
        onOpenSecrets={() => setSecretsOpen(true)}
        onOpenInvite={() => setInviteOpen(true)}
        onToggleToolbox={() => toggleToolbox(editor.workspaceRef.current)}
        onShowCode={handleShowCode}
        onExport={handleExport}
        onLoadTemplate={handleLoadTemplate}
      />

      <CodeView />

      <MessagePreview
        workspaceRef={editor.workspaceRef}
        project={project ?? {}}
      />

      <SecretsModal
        open={secretsOpen}
        project={project ?? {}}
        canManage={isOwner}
        modalColors={modalColors}
        onClose={() => setSecretsOpen(false)}
        onSave={(updated) =>
          session.setProject((current) => ({
            ...current,
            secrets: updated.secrets,
          }))
        }
      />

      <InviteModal
        open={inviteOpen}
        project={project ?? {}}
        modalColors={modalColors}
        onClose={() => setInviteOpen(false)}
        onSave={(updated) =>
          session.setProject((current) => ({
            ...current,
            collaborators: updated.collaborators,
          }))
        }
      />

      <VersionControl
        versions={versions.versions}
        activeVersionId={versions.activeVersionId}
        canManage={versions.state.canManage}
        premium={versions.state.premium}
        maxVersions={versions.state.maxVersions}
        busy={versions.busy}
        modalColors={modalColors}
        onSwitch={versions.actions.switchTo}
        onCreate={versions.actions.create}
        onRename={versions.actions.rename}
        onDelete={versions.actions.remove}
      />

      <div className="load-container">{loading ? <LoadingAnim /> : ""}</div>

      {/* Where code generation and export build throwaway workspaces. */}
      <div className="invisibleWs" />

      <div className="workspace-container">
        <div className="right">
          <WorkspaceTabs
            currentTab={currentWorkspace.current}
            onClick={loadTab}
            project={project ?? {}}
            setProject={session.setProject}
            workspace={editor.workspaceRef.current}
            modalColors={modalColors}
            editable={isOwner}
            activeVersionId={versions.activeVersionId}
            onVersionUpdate={versions.actions.applyVersionResult}
            onWorkspaceRemoved={(removedId, updated) => {
              /* Only reopen when the tab that went was the one on screen;
                 deleting a different tab shouldn't move the user. */
              if (String(removedId) !== String(currentWorkspace.current?._id))
                return;

              openWorkspace(updated.workspaces);
            }}
          />
          <div id="workspace" />
        </div>
      </div>
    </>
  );
}
