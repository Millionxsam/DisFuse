import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as Blockly from "blockly";
import Swal from "sweetalert2";

import "@blockly/toolbox-search";
import "../../fields/fieldColourHsvSliders";

/* Every block a project can use, so a template can use them too. */
import "../../blocks/index.js";

import DocsLink from "../../components/DocsLink.jsx";
import LoadingAnim from "../../components/LoadingAnim";
import MessagePreview from "../../components/workspace/MessagePreview.jsx";
import ModalPreview from "../../components/workspace/ModalPreview.jsx";
import { closeMessagePreview } from "../../components/workspace/messagePreviewStore.js";
import { closeModalPreview } from "../../components/workspace/modalPreviewStore.js";
import {
  askForTemplateDetails,
  confirmDeleteTemplate,
  confirmUnpublishTemplate,
  escapeHtml,
} from "../../components/templates/templateDialogs.js";
import { errorMessage } from "../../api/client.js";
import {
  deleteTemplate,
  getTemplate,
  publishTemplate,
  saveTemplateDraft,
  saveTemplateDraftOnExit,
  unpublishTemplate,
  updateTemplate,
} from "../../api/templates.js";
import { userCache } from "../../cache.ts";
import getToolbox from "../../config/toolbox";
import modalThemeColor from "../../functions/modalThemeColor";
import {
  BLOCK_TOOL_MENU_IDS,
  registerBlockToolMenus,
} from "../../functions/registerContextMenus.js";
import {
  blockTypesIn,
  checkTemplateTypes,
  describeBlockedTypes,
  parseTemplateData,
  serializeTemplate,
} from "../../functions/templateBlocks.js";
import useBlocklyEditor from "../Workspace/useBlocklyEditor.js";
import {
  loadBlockPacks,
  registerBlockPacks,
} from "../Workspace/editor/customBlocks.js";
import { DOCS } from "../../config/docs.js";

/* =====================================================================
   The template builder
   ---------------------------------------------------------------------
   A workspace of its own, belonging to no project: everything on this
   canvas is the template. Same toolbox as a project, same plugins, same
   previews — minus BlockBuddy blocks and private Workshop packs, which
   nobody else could load.

   It saves a *draft* as you go, the way Block Workshop does, and nothing
   anybody else sees changes until you press Publish. Publishing again
   later only changes what people who import it from then on get: a
   project that already imported it has its own copy of the blocks.
   ===================================================================== */

/** Quiet time after the last change before the draft is saved. */
const DRAFT_SAVE_DELAY_MS = 1200;

/** Context menu items the project editor registers that mean nothing here. */
const PROJECT_ONLY_MENU_IDS = [
  "moveBlock",
  "mergeWorkspace",
  "toggleToolbox",
  "saveBlocksAsTemplate",
  "saveWorkspaceAsTemplate",
];

function toast(title, modalColors, icon = "success") {
  Swal.fire({
    toast: true,
    position: "top-right",
    timer: 4000,
    timerProgressBar: true,
    showConfirmButton: false,
    icon,
    title,
    ...modalColors,
  });
}

/**
 * Saving the draft.
 *
 * One save in flight at a time, the latest canvas always wins, and a
 * failed save stays pending so the next change — or leaving the page —
 * tries again. Leaving is covered twice: the tab being hidden saves at
 * once through the normal request, and closing the page sends whatever
 * is left with a `keepalive` fetch, which the browser lets finish.
 *
 * @param {string} templateId
 * @param {() => string|null} getData  the canvas as template data
 */
function useDraftAutosave(templateId, getData, { onSaving, onSaved, onError }) {
  const timer = useRef(null);
  const dirty = useRef(false);
  const inFlight = useRef(null);
  const lastSaved = useRef(null);

  const callbacks = useRef({});
  callbacks.current = { onSaving, onSaved, onError };

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    timer.current = null;

    /* Let the save already on its way land first; this one carries
       whatever changed since. */
    if (inFlight.current) await inFlight.current.catch(() => {});
    if (!dirty.current) return;

    const data = getData();
    if (data === null) return;

    dirty.current = false;
    if (data === lastSaved.current) return;

    callbacks.current.onSaving?.();

    inFlight.current = saveTemplateDraft(templateId, data)
      .then(() => {
        lastSaved.current = data;
        callbacks.current.onSaved?.();
      })
      .catch((error) => {
        dirty.current = true;
        callbacks.current.onError?.(error);
      })
      .finally(() => {
        inFlight.current = null;
      });

    await inFlight.current;
  }, [getData, templateId]);

  const noteChange = useCallback(() => {
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(save, DRAFT_SAVE_DELAY_MS);
  }, [save]);

  /** What is on the canvas was just loaded or published: nothing to save. */
  const markSaved = useCallback((data) => {
    clearTimeout(timer.current);
    timer.current = null;
    dirty.current = false;
    lastSaved.current = data;
  }, []);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") save();
    }

    function onBeforeUnload(event) {
      if (!dirty.current && !inFlight.current) return;

      const data = getData();
      if (data !== null && data !== lastSaved.current)
        if (saveTemplateDraftOnExit(templateId, data)) {
          dirty.current = false;
          return;
        }

      /* Too big to send on the way out: ask the browser to warn. */
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);

      /* Leaving for another page of the app. */
      if (dirty.current) save();
      clearTimeout(timer.current);
    };
  }, [getData, save, templateId]);

  return { noteChange, flush: save, markSaved };
}

async function showBuilderWelcome(modalColors) {
  const KEY = "templateBuilderOnboarded";

  try {
    if (localStorage.getItem(KEY)) return;
  } catch {
    return;
  }

  await Swal.fire({
    icon: "info",
    title: "Welcome to the template builder",
    html: `Everything you put in this workspace becomes your template. Your work saves automatically, but nobody else can see it until you press <b>Publish</b>. After that, people only get your new changes when you publish again.<br /><br />You can use the same blocks as in a project, except BlockBuddy blocks and private Workshop packs, because other people can't use those.`,
    confirmButtonText: "Start building",
    ...modalColors,
  });

  try {
    localStorage.setItem(KEY, "true");
  } catch {
    /* Private browsing: they'll see it again, which is harmless. */
  }
}

export default function TemplateBuilder() {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const user = userCache.user;
  const [modalColors] = useState(() => modalThemeColor(user, false));

  const [template, setTemplate] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [toolbox, setToolbox] = useState(null);
  const [packs, setPacks] = useState([]);
  const [privatePacks, setPrivatePacks] = useState(() => new Set());
  const [blockCount, setBlockCount] = useState(0);
  const [saveState, setSaveState] = useState("idle");
  const [changedSincePublish, setChangedSincePublish] = useState(false);
  const [busy, setBusy] = useState(false);

  /* What importers get, in the form this canvas serialises to — what
     "unpublished changes" compares against. */
  const publishedData = useRef(null);
  /* The canvas as of the last change, for saving after the workspace
     has already been torn down (leaving the page within the app). */
  const latestData = useRef(null);

  /* ---- The canvas ---------------------------------------------------- */

  const autosaveRef = useRef(null);

  const editor = useBlocklyEditor({
    enabled: Boolean(toolbox),
    toolbox,
    settings: user?.settings?.workspace,
    optimization: user?.settings?.optimization,
    onProjectChange: () => autosaveRef.current?.noteChange(),
    onSelect: () => {},
    onAnyChange: () => {},
    onHousekeeping: (workspace) => {
      const data = serializeTemplate(workspace);
      latestData.current = data;

      setBlockCount(workspace.getAllBlocks(false).length);
      setChangedSincePublish(
        publishedData.current !== null && data !== publishedData.current,
      );
    },
  });

  const getData = useCallback(() => {
    const workspace = editor.workspaceRef.current;
    return workspace ? serializeTemplate(workspace) : latestData.current;
  }, [editor.workspaceRef]);

  const autosave = useDraftAutosave(templateId, getData, {
    onSaving: () => setSaveState("saving"),
    onSaved: () => setSaveState("saved"),
    onError: (error) => {
      console.error("Couldn't save the template draft:", error);
      setSaveState("error");
    },
  });
  autosaveRef.current = autosave;

  /* ---- Opening it ---------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function open() {
      let found;

      try {
        found = await getTemplate(templateId);
      } catch (error) {
        if (cancelled) return;
        setPhase("blocked");

        await Swal.fire({
          title: "Couldn't open this template",
          text:
            error?.response?.status === 404
              ? "It doesn't exist, or it belongs to someone else."
              : errorMessage(error, "Please try again."),
          icon: "error",
          ...modalColors,
        });

        navigate("/templates?tab=mine", { replace: true });
        return;
      }

      if (cancelled) return;

      if (found.owner?.id !== user?.id) {
        setPhase("blocked");
        toast("Only the template's owner can edit it", modalColors, "info");
        navigate(`/templates/${templateId}`, { replace: true });
        return;
      }

      /* Only public packs: a template anybody can import can't need a
         pack only its author can install. */
      const installed = await loadBlockPacks(user);
      const usable = installed.filter((pack) => !pack.private);

      if (cancelled) return;

      registerBlockPacks(usable);

      /* A draft whose blocks can't all be loaded here would be emptied by
         the first save. Stop instead, and say why. */
      const draft = parseTemplateData(found.draft);
      const missing = draft
        ? [...blockTypesIn(draft.blocks.blocks)].filter(
            (type) => !Blockly.Blocks[type],
          )
        : [];

      if (missing.length) {
        setPhase("blocked");

        await Swal.fire({
          title: "Some blocks can't be loaded",
          html: `This template uses blocks that aren't available: <b>${escapeHtml(
            missing.join(", "),
          )}</b>.<br /><br />This usually happens when you uninstall a Workshop pack, or when its creator makes it private. Install the pack again from the Workshop, then come back.`,
          icon: "warning",
          confirmButtonText: "Back to my templates",
          ...modalColors,
        });

        navigate("/templates?tab=mine", { replace: true });
        return;
      }

      setPacks(usable);
      setPrivatePacks(
        new Set(
          installed
            .filter((pack) => pack.private)
            .map((pack) => String(pack._id)),
        ),
      );
      setTemplate(found);
      setToolbox(getToolbox(usable, user, { blockBuddy: false }));
      setPhase("editing");
    }

    open().catch((error) => {
      console.error(error);
      if (!cancelled) setPhase("blocked");
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  /* Once Blockly exists: the draft, the menus, and a first-time hello. */
  useEffect(() => {
    if (!editor.ready || !template) return undefined;

    const workspace = editor.workspaceRef.current;

    editor.loadBlocks(template.draft);

    const loaded = serializeTemplate(workspace);
    latestData.current = loaded;
    autosave.markSaved(loaded);

    /* Loading blocks and saving them again isn't guaranteed to give back
       the stored text byte for byte. So when the API says the draft and
       the published version match, the canvas as loaded stands in for
       the published version — otherwise a template nobody touched could
       open saying it has unpublished changes. */
    publishedData.current = template.published
      ? template.unpublishedChanges
        ? template.data
        : loaded
      : null;

    setBlockCount(workspace.getAllBlocks(false).length);
    setChangedSincePublish(
      publishedData.current !== null && loaded !== publishedData.current,
    );

    /* The block tools the editor has too — and, defensively, none of the
       items that act on a project, which a project editor left open
       earlier in this page's life could have left registered. */
    for (const id of [...BLOCK_TOOL_MENU_IDS, ...PROJECT_ONLY_MENU_IDS])
      if (Blockly.ContextMenuRegistry.registry.getItem(id))
        Blockly.ContextMenuRegistry.registry.unregister(id);
    registerBlockToolMenus();

    showBuilderWelcome(modalColors);

    return () => {
      closeMessagePreview();
      closeModalPreview();

      for (const id of BLOCK_TOOL_MENU_IDS)
        if (Blockly.ContextMenuRegistry.registry.getItem(id))
          Blockly.ContextMenuRegistry.registry.unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.ready, template?._id]);

  /* ---- The toolbar's actions ----------------------------------------- */

  async function publish() {
    const workspace = editor.workspaceRef.current;
    if (!workspace || busy) return;

    const data = serializeTemplate(workspace);
    const topBlocks = JSON.parse(data).blocks.blocks;

    if (!topBlocks.length)
      return Swal.fire({
        title: "Nothing to publish yet",
        text: "Add some blocks to the workspace first.",
        icon: "info",
        ...modalColors,
      });

    const check = checkTemplateTypes(blockTypesIn(topBlocks), { privatePacks });
    const problem = describeBlockedTypes(check);

    if (problem)
      return Swal.fire({
        title: "Some blocks can't be published",
        text: problem,
        icon: "warning",
        ...modalColors,
      });

    const packNames = check.packs.map(
      (id) =>
        packs.find((pack) => String(pack._id) === id)?.name ??
        "a Workshop pack",
    );

    const firstTime = !template.published;

    const confirmed = await Swal.fire({
      title: firstTime ? "Publish this template?" : "Publish your changes?",
      html: `${
        firstTime
          ? template.private
            ? "It's private, so only you will be able to see it and add it to your projects."
            : "Anyone will be able to find it on the Templates page and add it to their projects."
          : "People who add it from now on will get these blocks. Projects that already added it keep the blocks they have."
      }${
        packNames.length
          ? `<br /><br />It uses blocks from ${
              packNames.length === 1
                ? "this Workshop pack"
                : "these Workshop packs"
            }: ${packNames
              .map((name) => `<b>${escapeHtml(name)}</b>`)
              .join(", ")}. Anyone who adds the template will get ${
              packNames.length === 1 ? "it" : "them"
            } too.`
          : ""
      }`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: firstTime ? "Publish" : "Publish changes",
      ...modalColors,
    });

    if (!confirmed.isConfirmed) return;

    setBusy(true);

    try {
      const updated = await publishTemplate(template._id, {
        data,
        packs: check.packs,
      });

      setTemplate(updated);
      publishedData.current = data;
      autosave.markSaved(data);
      setSaveState("saved");
      setChangedSincePublish(false);

      toast(firstTime ? "Published!" : "Changes published", modalColors);
    } catch (error) {
      Swal.fire({
        title: "Couldn't publish",
        text: errorMessage(error, "Please try again."),
        icon: "error",
        ...modalColors,
      });
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    if (busy || !(await confirmUnpublishTemplate(template, modalColors)))
      return;

    setBusy(true);

    try {
      setTemplate(await unpublishTemplate(template._id));
      publishedData.current = null;
      setChangedSincePublish(false);
      toast("Unpublished", modalColors);
    } catch (error) {
      toast(errorMessage(error, "Couldn't unpublish it"), modalColors, "error");
    } finally {
      setBusy(false);
    }
  }

  async function editDetails() {
    if (!template) return;

    const answer = await askForTemplateDetails({
      title: "Template details",
      confirmButtonText: "Save",
      initial: template,
      modalColors,
      showDelete: true,
    });

    if (!answer) return;

    if (answer.action === "delete") {
      if (!(await confirmDeleteTemplate(template, modalColors))) return;

      try {
        await deleteTemplate(template._id);
        autosave.markSaved(getData());
        toast("Template deleted", modalColors);
        navigate("/templates?tab=mine");
      } catch (error) {
        toast(errorMessage(error, "Couldn't delete it"), modalColors, "error");
      }
      return;
    }

    try {
      const updated = await updateTemplate(template._id, {
        name: answer.name,
        description: answer.description,
        private: answer.private,
      });

      /* Only the details: the canvas, and what it's compared against,
         stay exactly as they are. */
      setTemplate((current) => ({
        ...current,
        name: updated.name,
        description: updated.description,
        private: updated.private,
      }));

      toast("Details saved", modalColors);
    } catch (error) {
      toast(
        errorMessage(error, "Couldn't save those details"),
        modalColors,
        "error",
      );
    }
  }

  /* ---- Render -------------------------------------------------------- */

  const loading = phase !== "editing" || !editor.ready;
  const published = Boolean(template?.published);

  const status = !published
    ? {
        id: "draft",
        icon: "fa-solid fa-pen-ruler",
        label: "Draft (not published)",
      }
    : changedSincePublish
      ? {
          id: "changes",
          icon: "fa-solid fa-circle-half-stroke",
          label: "Changes not published",
        }
      : {
          id: "published",
          icon: "fa-solid fa-circle-check",
          label: "Published",
        };

  const saveLabel =
    saveState === "saving"
      ? { icon: "fa-solid fa-cloud-arrow-up", text: "Saving…" }
      : saveState === "error"
        ? { icon: "fa-solid fa-triangle-exclamation", text: "Not saved" }
        : saveState === "saved"
          ? { icon: "fa-solid fa-cloud", text: "Draft saved" }
          : null;

  return (
    <div className="df-template-builder">
      <Helmet>
        <title>{`${template?.name || "Template"} | Template Builder | DisFuse`}</title>
      </Helmet>

      <div className="workshopWorkspaceNavbar df-template-builder-bar">
        <div>
          <div className="logo">
            <Link to="/templates?tab=mine" title="Back to your templates">
              <img src="/media/disfuse-clear.png" alt="" />
              <span>Templates</span>
            </Link>
          </div>

          <button
            type="button"
            className="df-template-builder-name"
            onClick={editDetails}
            disabled={!template}
            title="Edit the name, description and who can see it"
          >
            <h1 className="packName">{template?.name ?? ""}</h1>
            <i className="fa-solid fa-pen" aria-hidden="true" />
          </button>

          {template ? (
            <>
              <span className={`df-template-builder-chip ${status.id}`}>
                <i className={status.icon} aria-hidden="true" /> {status.label}
              </span>
              <span
                className="df-template-builder-chip"
                title={
                  template.private
                    ? "Only you can see it and use it"
                    : "Anyone can find it once it's published"
                }
              >
                <i
                  className={`fa-solid ${template.private ? "fa-lock" : "fa-earth-americas"}`}
                  aria-hidden="true"
                />{" "}
                {template.private ? "Private" : "Public"}
              </span>
            </>
          ) : null}

          <i className="blockCount">
            <i className="fa-solid fa-cube" /> {blockCount} block
            {blockCount === 1 ? "" : "s"}
          </i>

          {saveLabel ? (
            <i
              className={`df-template-builder-save ${saveState}`}
              title={
                saveState === "error"
                  ? "Couldn't save your work. We'll try again the next time you make a change."
                  : "Your work saves automatically"
              }
            >
              <i className={saveLabel.icon} /> {saveLabel.text}
            </i>
          ) : null}
        </div>

        <div>
          <DocsLink page={DOCS.templates} label="Help" />

          {published ? (
            <a
              className="df-template-builder-link"
              href={`/templates/${templateId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" /> View page
            </a>
          ) : null}

          <button onClick={editDetails} disabled={!template || busy}>
            <i className="fa-solid fa-sliders" /> Details
          </button>

          {published ? (
            <button onClick={unpublish} disabled={busy}>
              <i className="fa-solid fa-eye-slash" /> Unpublish
            </button>
          ) : null}

          <button
            className="df-template-publish"
            onClick={publish}
            disabled={
              !template ||
              busy ||
              blockCount === 0 ||
              (published && !changedSincePublish)
            }
            title={
              blockCount === 0
                ? "Add some blocks first"
                : published && !changedSincePublish
                  ? "Nothing has changed since you last published"
                  : undefined
            }
          >
            <i className="fa-solid fa-upload" />{" "}
            {published ? "Publish changes" : "Publish"}
          </button>
        </div>
      </div>

      <div className="load-container">{loading ? <LoadingAnim /> : ""}</div>

      <div className="df-template-builder-canvas">
        <div id="workspace" />
      </div>

      <MessagePreview
        workspaceRef={editor.workspaceRef}
        project={{ name: template?.name }}
      />
      <ModalPreview
        workspaceRef={editor.workspaceRef}
        project={{ name: template?.name }}
      />
    </div>
  );
}
