import { Link } from "react-router-dom";

import { publishedWebsiteUrl } from "../../../../config/config";

const viewports = [
  { id: "desktop", icon: "fa-solid fa-desktop", label: "Desktop" },
  { id: "tablet", icon: "fa-solid fa-tablet-screen-button", label: "Tablet" },
  { id: "mobile", icon: "fa-solid fa-mobile-screen", label: "Mobile" },
];

export default function EditorToolbar({
  editor,
  viewport,
  setViewport,
  previewing,
  setPreviewing,
  onToggleLeft,
  onToggleRight,
  onPublish,
}) {
  const { website, pages, activePageId, dirty, saving } = editor;

  return (
    <header className="df-ws-toolbar">
      <div className="group left">
        <Link to="/websites" className="df-ws-back" title="Back to websites">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>

        <button
          className="df-ws-panel-toggle"
          onClick={onToggleLeft}
          title="Elements"
        >
          <i className="fa-solid fa-plus"></i>
        </button>

        <input
          className="df-ws-name"
          value={website.name || ""}
          onChange={(e) => editor.updateMeta({ name: e.target.value })}
          aria-label="Website name"
        />
      </div>

      <div className="group center">
        <select
          className="df-ws-page-select"
          value={activePageId || ""}
          onChange={(e) => editor.setActivePageId(e.target.value)}
          aria-label="Page"
        >
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name}
            </option>
          ))}
        </select>

        <div className="df-ws-viewports">
          {viewports.map((option) => (
            <button
              key={option.id}
              title={option.label}
              className={viewport === option.id ? "active" : ""}
              onClick={() => setViewport(option.id)}
            >
              <i className={option.icon}></i>
            </button>
          ))}
        </div>

        <div className="df-ws-history">
          <button title="Undo" disabled={!editor.canUndo} onClick={editor.undo}>
            <i className="fa-solid fa-rotate-left"></i>
          </button>
          <button title="Redo" disabled={!editor.canRedo} onClick={editor.redo}>
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </div>

      <div className="group right">
        <button
          className={`df-ws-preview-btn${previewing ? " active" : ""}`}
          onClick={() => setPreviewing(!previewing)}
          title="Toggle a clean preview of the page"
        >
          <i
            className={`fa-solid ${previewing ? "fa-pen-ruler" : "fa-eye"}`}
          ></i>
          <span>{previewing ? "Edit" : "Preview"}</span>
        </button>

        <button onClick={() => editor.save()} disabled={saving || !dirty}>
          <i className="fa-solid fa-floppy-disk"></i>
          <span>{saving ? "Saving…" : dirty ? "Save" : "Saved"}</span>
        </button>

        {website.published ? (
          <a
            href={publishedWebsiteUrl(website)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="df-primary-btn">
              <i className="fa-solid fa-arrow-up-right-from-square noRotate"></i>
              <span>Visit</span>
            </button>
          </a>
        ) : (
          <button
            className="df-primary-btn"
            onClick={onPublish}
            disabled={saving}
          >
            <i className="fa-solid fa-rocket"></i>
            <span>Publish</span>
          </button>
        )}

        <button
          className="df-ws-panel-toggle"
          onClick={onToggleRight}
          title="Element settings"
        >
          <i className="fa-solid fa-sliders"></i>
        </button>
      </div>
    </header>
  );
}
