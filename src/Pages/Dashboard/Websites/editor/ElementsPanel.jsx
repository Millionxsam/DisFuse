import { useState } from "react";
import Swal from "sweetalert2";

import {
  elementCategories,
  elementsInCategory,
  getElementDef,
} from "../../../../config/websiteElements";
import {
  flattenTree,
  pageUsesDashboard,
} from "../../../../functions/websiteTree";
import { publishedWebsiteUrl } from "../../../../config/config";
import modalThemeColor from "../../../../functions/modalThemeColor";

import DocsLink from "../../../../components/DocsLink.jsx";
import { DOCS } from "../../../../config/docs.js";

const modalColors = modalThemeColor(null, true);

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Left-hand panel: add elements, manage pages, browse the element tree. */
export default function ElementsPanel({ editor }) {
  const [tab, setTab] = useState("add");

  return (
    <div className="df-ws-panel-inner">
      <div className="df-ws-tabs">
        <button
          className={tab === "add" ? "active" : ""}
          onClick={() => setTab("add")}
        >
          <i className="fa-solid fa-plus"></i> Add
        </button>
        <button
          className={tab === "pages" ? "active" : ""}
          onClick={() => setTab("pages")}
        >
          <i className="fa-solid fa-file-lines"></i> Pages
        </button>
        <button
          className={tab === "layers" ? "active" : ""}
          onClick={() => setTab("layers")}
        >
          <i className="fa-solid fa-layer-group"></i> Layers
        </button>
      </div>

      <div className="df-ws-panel-scroll">
        {tab === "add" && <AddElements editor={editor} />}
        {tab === "pages" && <PagesList editor={editor} />}
        {tab === "layers" && <LayersTree editor={editor} />}
      </div>
    </div>
  );
}

/* ---- Add ------------------------------------------------------------- */

function AddElements({ editor }) {
  const selectedDef = editor.selectedNode
    ? getElementDef(editor.selectedNode.type)
    : null;

  const destination = !editor.selectedNode
    ? "the end of the page"
    : selectedDef?.container
      ? `inside the selected ${selectedDef.label.toLowerCase()}`
      : `after the selected ${selectedDef?.label.toLowerCase()}`;

  return (
    <>
      <p className="df-ws-note">
        <i className="fa-solid fa-location-dot"></i> New elements are added{" "}
        {destination}.
      </p>

      {/* The palette is the natural place to ask what an element does. */}
      <p className="df-ws-note">
        <i className="fa-solid fa-circle-question"></i> Not sure what to pick?{" "}
        <DocsLink
          page={`${DOCS.websites}#elements`}
          variant="inline"
          label="Read about the elements"
        />
      </p>

      {elementCategories.map((category) => (
        <section className="df-ws-section" key={category.id}>
          <h4>
            <i className={category.icon}></i> {category.label}
          </h4>
          {category.dashboard && (
            <p className="df-ws-note dashboard">
              Optional. Visitors log in with Discord to use these. Controls set
              to <strong>the selected server</strong> also ask them to pick one;
              controls set to <strong>the visitor themselves</strong> never do.{" "}
              <DocsLink
                page={`${DOCS.websites}#dashboards`}
                variant="inline"
                label="How dashboards work"
              />
            </p>
          )}

          <div className="df-ws-palette">
            {elementsInCategory(category.id).map((element) => (
              <button
                type="button"
                key={element.type}
                title={element.hint}
                onClick={() => editor.addElement(element.type)}
              >
                <i className={element.icon}></i>
                <span>{element.label}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/* ---- Pages ----------------------------------------------------------- */

function PagesList({ editor }) {
  const { pages, activePageId } = editor;

  async function addPage() {
    const { value: name } = await Swal.fire({
      title: "New page",
      input: "text",
      inputPlaceholder: "Commands",
      confirmButtonText: "Create page",
      showCancelButton: true,
      inputValidator: (value) => (value?.trim() ? false : "Enter a page name"),
      ...modalColors,
    });

    if (!name) return;
    editor.addPage(name.trim(), slugify(name));
  }

  function removePage(page) {
    if (pages.length <= 1) return;

    Swal.fire({
      title: "Delete page",
      text: `Delete "${page.name}" and everything on it?`,
      icon: "warning",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonColor: "red",
      confirmButtonText: "Delete",
      ...modalColors,
    }).then((result) => {
      if (result.isConfirmed) editor.deletePage(page.id);
    });
  }

  return (
    <>
      <p className="df-ws-note">
        The first page is the home page. Other pages live at
        <code>
          {" "}
          {publishedWebsiteUrl(editor.website).replace(/^https?:\/\//, "")}
          /&lt;path&gt;
        </code>
        .
      </p>

      <div className="df-ws-pages">
        {pages.map((page, index) => {
          const active = page.id === activePageId;

          return (
            <div
              className={`df-ws-page${active ? " active" : ""}`}
              key={page.id}
            >
              <button
                type="button"
                className="df-ws-page-open"
                onClick={() => editor.setActivePageId(page.id)}
              >
                <i
                  className={`fa-solid ${
                    index === 0
                      ? "fa-house"
                      : pageUsesDashboard(page)
                        ? "fa-lock"
                        : "fa-file-lines"
                  }`}
                ></i>
                <span>
                  <strong>{page.name}</strong>
                  <small>/{page.path}</small>
                </span>
              </button>

              <div className="df-ws-page-actions">
                <button
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => editor.movePage(page.id, -1)}
                >
                  <i className="fa-solid fa-chevron-up"></i>
                </button>
                <button
                  title="Move down"
                  disabled={index === pages.length - 1}
                  onClick={() => editor.movePage(page.id, 1)}
                >
                  <i className="fa-solid fa-chevron-down"></i>
                </button>
                <button
                  title="Delete page"
                  className="danger"
                  disabled={pages.length <= 1}
                  onClick={() => removePage(page)}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>

              {active && (
                <div className="df-ws-page-edit">
                  <label>
                    <span>Name</span>
                    <input
                      type="text"
                      value={page.name}
                      onChange={(e) =>
                        editor.updatePage(
                          page.id,
                          { name: e.target.value },
                          `page:${page.id}:name`,
                        )
                      }
                    />
                  </label>
                  <label>
                    <span>Path</span>
                    <input
                      type="text"
                      className="df-ws-mono"
                      placeholder={index === 0 ? "(home)" : "commands"}
                      value={page.path}
                      onChange={(e) =>
                        editor.updatePage(
                          page.id,
                          { path: slugify(e.target.value) },
                          `page:${page.id}:path`,
                        )
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="df-ws-add-item" onClick={addPage}>
        <i className="fa-solid fa-plus"></i> Add page
      </button>
    </>
  );
}

/* ---- Layers ---------------------------------------------------------- */

function LayersTree({ editor }) {
  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const rows = flattenTree(editor.activePage?.elements || []);

  function positionFor(event, node) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = (event.clientY - rect.top) / rect.height;
    const container = getElementDef(node.type)?.container;

    if (container) {
      if (offset < 0.28) return "before";
      if (offset > 0.72) return "after";
      return "inside";
    }

    return offset < 0.5 ? "before" : "after";
  }

  function drop() {
    if (dragId && dropTarget) {
      editor.moveElement(dragId, dropTarget.id, dropTarget.position);
    }

    setDragId(null);
    setDropTarget(null);
  }

  if (!rows.length)
    return (
      <div className="df-ws-hint">
        <i className="fa-solid fa-layer-group"></i>
        <p>This page is empty. Add an element from the Add tab.</p>
      </div>
    );

  return (
    <div className="df-ws-layers" onDragEnd={() => setDropTarget(null)}>
      {rows.map(({ node, depth }) => {
        const def = getElementDef(node.type);
        const isDropTarget = dropTarget?.id === node.id;

        return (
          <div
            key={node.id}
            className={[
              "df-ws-layer",
              editor.selectedId === node.id ? "selected" : "",
              isDropTarget ? `drop-${dropTarget.position}` : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ paddingLeft: `${0.5 + depth * 0.85}rem` }}
            draggable
            onDragStart={() => setDragId(node.id)}
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragId || dragId === node.id) return;
              setDropTarget({ id: node.id, position: positionFor(e, node) });
            }}
            onDragLeave={() =>
              setDropTarget((t) => (t?.id === node.id ? null : t))
            }
            onDrop={(e) => {
              e.preventDefault();
              drop();
            }}
            onClick={() => editor.setSelectedId(node.id)}
            onMouseEnter={() => editor.setHoveredId(node.id)}
            onMouseLeave={() => editor.setHoveredId(null)}
          >
            <i className={def?.icon || "fa-solid fa-cube"}></i>
            <span>{layerName(node, def)}</span>

            <div className="df-ws-layer-actions">
              <button
                title="Move up"
                onClick={(e) => {
                  e.stopPropagation();
                  editor.shiftElement(node.id, -1);
                }}
              >
                <i className="fa-solid fa-chevron-up"></i>
              </button>
              <button
                title="Move down"
                onClick={(e) => {
                  e.stopPropagation();
                  editor.shiftElement(node.id, 1);
                }}
              >
                <i className="fa-solid fa-chevron-down"></i>
              </button>
              <button
                title="Duplicate"
                onClick={(e) => {
                  e.stopPropagation();
                  editor.duplicateElement(node.id);
                }}
              >
                <i className="fa-solid fa-clone"></i>
              </button>
              <button
                title="Delete"
                className="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  editor.deleteElement(node.id);
                }}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function layerName(node, def) {
  const label =
    node.props?.text ||
    node.props?.label ||
    node.props?.brand ||
    node.props?.settingKey ||
    "";

  if (!label) return def?.label || node.type;

  const trimmed = String(label).slice(0, 26);
  return `${def?.label || node.type}: ${trimmed}${label.length > 26 ? "…" : ""}`;
}
