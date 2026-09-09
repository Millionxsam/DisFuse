import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Helmet } from "react-helmet-async";

import LoadingAnim from "../../../components/LoadingAnim";
import WebsiteRenderer, {
  themeStyle,
} from "../../../components/websites/WebsiteRenderer";
import { DashboardContext } from "../../../components/websites/DashboardContext";
import { getElementDef } from "../../../config/websiteElements";
import { publishedWebsiteUrl, websitePublicPath } from "../../../config/config";
import {
  pageUsesDashboard,
  pageUsesScope,
} from "../../../functions/websiteTree";
import modalThemeColor from "../../../functions/modalThemeColor";
import { userCache } from "../../../cache.ts";

import EditorToolbar from "./editor/EditorToolbar";
import ElementsPanel from "./editor/ElementsPanel";
import Inspector from "./editor/Inspector";
import useWebsiteEditor from "./editor/useWebsiteEditor";

const viewportWidths = { desktop: "100%", tablet: "820px", mobile: "400px" };

/* Design-time stand-ins so channel/role pickers show something in the
   builder. The published website loads the visitor's real servers. */
const previewResources = {
  channels: [
    { id: "preview-1", name: "general" },
    { id: "preview-2", name: "mod-logs" },
    { id: "preview-3", name: "welcome" },
  ],
  roles: [
    { id: "preview-1", name: "Member" },
    { id: "preview-2", name: "Moderator" },
  ],
};

export default function WebsiteEditor() {
  const { websiteId } = useParams();
  const editor = useWebsiteEditor(websiteId);

  const [viewport, setViewport] = useState("desktop");
  const [previewing, setPreviewing] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState({ guild: {}, user: {} });

  const {
    website,
    activePage,
    dirty,
    save,
    undo,
    redo,
    selectedId,
    deleteElement,
  } = editor;

  /* Warn before losing unsaved changes. */
  useEffect(() => {
    if (!dirty) return;

    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /* Keyboard shortcuts — ignored while typing in a field. */
  useEffect(() => {
    const handler = (event) => {
      const target = event.target;
      const typing =
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        return save();
      }

      if (typing) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        return event.shiftKey ? redo() : undo();
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        deleteElement(selectedId);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save, undo, redo, selectedId, deleteElement]);

  const publish = useCallback(async () => {
    const result = await Swal.fire({
      title: "Publish website",
      html: `Your website will be live at <br /><code>${publishedWebsiteUrl(
        website,
      )}</code>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Publish",
      ...modalThemeColor(userCache.user),
    });

    if (!result.isConfirmed) return;

    editor.updateMeta({ published: true });
    const saved = await save({ published: true });

    if (saved) {
      Swal.fire({
        toast: true,
        position: "top-right",
        icon: "success",
        title: "Website published",
        showConfirmButton: false,
        timer: 3000,
        ...modalThemeColor(userCache.user),
      });
    }
  }, [editor, save, website]);

  /* Dashboard preview: lets dashboard controls render (and, in preview
     mode, respond) inside the builder without touching website.data.
     Both scopes are present so server- and user-scoped controls both
     behave the way they will once published. */
  const dashboardPreview = useMemo(
    () => ({
      guild: { id: "preview", name: "Your server", icon: null },
      values: previewValues,
      setValue: (scope, key, value) =>
        setPreviewValues((current) => ({
          ...current,
          [scope]: { ...current[scope], [key]: value },
        })),
      save: () =>
        Swal.fire({
          icon: "info",
          title: "Preview only",
          text: "Settings are saved by visitors on the published website.",
          ...modalThemeColor(userCache.user),
        }),
      saving: false,
      dirty: true,
      resources: previewResources,
      switchGuild: () => {},
      readOnly: false,
    }),
    [previewValues],
  );

  if (editor.loading)
    return (
      <div className="load-container">
        <Helmet>
          <title>Website Editor | DisFuse</title>
        </Helmet>
        <LoadingAnim />
      </div>
    );

  if (editor.error || !website)
    return (
      <div className="df-page">
        <Helmet>
          <title>Website Editor | DisFuse</title>
        </Helmet>
        <div className="df-empty">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <h3>Website not found</h3>
          <p>This website doesn't exist, or you don't have access to it.</p>
          <Link to="/websites">
            <button className="df-primary-btn">Back to Websites</button>
          </Link>
        </div>
      </div>
    );

  const selectedDef = editor.selectedNode
    ? getElementDef(editor.selectedNode.type)
    : null;

  return (
    /* The website's theme variables are set here as well as on .ws-root so
       the inspector's colour swatches can render the live theme colours. */
    <div
      className={`df-ws-editor${previewing ? " previewing" : ""}`}
      style={themeStyle(website.config?.theme)}
    >
      <Helmet>
        <title>{`${website.name || "Website Editor"} | DisFuse`}</title>
      </Helmet>
      <EditorToolbar
        editor={editor}
        viewport={viewport}
        setViewport={setViewport}
        previewing={previewing}
        setPreviewing={setPreviewing}
        onToggleLeft={() => setLeftOpen((v) => !v)}
        onToggleRight={() => setRightOpen((v) => !v)}
        onPublish={publish}
      />

      <div className="df-ws-editor-body">
        <aside className={`df-ws-panel left${leftOpen ? " open" : ""}`}>
          <ElementsPanel editor={editor} />
        </aside>

        <main
          className="df-ws-canvas"
          onClick={() => editor.setSelectedId(null)}
          onMouseLeave={() => editor.setHoveredId(null)}
        >
          {pageUsesDashboard(activePage) && (
            <div className="df-ws-canvas-note">
              <i className="fa-solid fa-lock"></i>
              {pageUsesScope(activePage, "guild")
                ? pageUsesScope(activePage, "user")
                  ? "This page mixes per-server and per-user settings. Visitors log in with Discord, and the per-server controls wait for them to pick a server."
                  : "This page has per-server settings. Visitors log in with Discord and pick a server before seeing it."
                : "This page has per-user settings. Visitors only log in with Discord, and no server is involved."}
            </div>
          )}

          <div
            className={`df-ws-canvas-frame ${viewport}`}
            style={{ width: viewportWidths[viewport] }}
            onClick={(e) => e.stopPropagation()}
          >
            <DashboardContext.Provider value={dashboardPreview}>
              <WebsiteRenderer
                website={website}
                page={activePage}
                basePath={`/${websitePublicPath(website)}`}
                editing={!previewing}
                selectedId={editor.selectedId}
                hoveredId={editor.hoveredId}
                onSelect={editor.setSelectedId}
                onHover={editor.setHoveredId}
                openLinksInNewTab
                /* Internal links switch the page being edited rather than
                   navigating away from the builder. */
                onNavigate={(path, href) => {
                  if (href?.startsWith("page:"))
                    editor.setActivePageId(href.slice(5));
                }}
              />
            </DashboardContext.Provider>
          </div>
        </main>

        <aside className={`df-ws-panel right${rightOpen ? " open" : ""}`}>
          <Inspector editor={editor} />
        </aside>
      </div>

      {!previewing && editor.selectedNode && (
        <div className="df-ws-floating-actions">
          <span>
            <i className={selectedDef?.icon}></i> {selectedDef?.label}
          </span>
          <button title="Select parent" onClick={editor.selectParent}>
            <i className="fa-solid fa-turn-up"></i>
          </button>
          <button
            title="Move up"
            onClick={() => editor.shiftElement(editor.selectedId, -1)}
          >
            <i className="fa-solid fa-chevron-up"></i>
          </button>
          <button
            title="Move down"
            onClick={() => editor.shiftElement(editor.selectedId, 1)}
          >
            <i className="fa-solid fa-chevron-down"></i>
          </button>
          <button
            title="Duplicate"
            onClick={() => editor.duplicateElement(editor.selectedId)}
          >
            <i className="fa-solid fa-clone"></i>
          </button>
          <button
            title="Delete"
            className="danger"
            onClick={() => editor.deleteElement(editor.selectedId)}
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      )}
    </div>
  );
}
