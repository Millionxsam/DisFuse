import { useEffect, useRef, useState } from "react";

import LoadingAnim from "../LoadingAnim";
import TemplateCard from "./TemplateCard.jsx";
import { errorMessage } from "../../api/client.js";
import { listTemplates } from "../../api/templates.js";

/* =====================================================================
   The template gallery
   ---------------------------------------------------------------------
   One gallery, shown in two places: the Templates page on the dashboard
   and Utilities › Templates in the editor. The only difference between
   them is what a card's second button does — "Use" on the dashboard
   picks a project, "Import" in the editor adds the blocks right there —
   so both are the caller's business and everything else lives here.

   Searching, sorting and paging all happen on the server. The Explore
   page downloads every project and sorts in the browser; a gallery that
   anyone can add to is exactly the list that can't be treated that way.
   ===================================================================== */

export const TABS = [
  { id: "all", label: "Browse", icon: "fa-solid fa-earth-americas" },
  { id: "official", label: "Official", icon: "fa-solid fa-circle-check" },
  { id: "mine", label: "Mine", icon: "fa-solid fa-user" },
  { id: "liked", label: "Liked", icon: "fa-solid fa-heart" },
];

const SORTS = [
  { id: "popular", label: "Most liked" },
  { id: "imports", label: "Most used" },
  { id: "newest", label: "Newest" },
  { id: "updated", label: "Recently updated", mineOnly: true },
];

const defaultSort = (filter) => (filter === "mine" ? "updated" : "popular");

/** Wait this long after the last keystroke before searching. */
const SEARCH_DELAY_MS = 300;

function EmptyState({ filter, query, onCreate }) {
  if (query)
    return (
      <div className="df-empty">
        <i className="fa-solid fa-magnifying-glass" />
        <h3>No templates match “{query}”</h3>
        <p>Try another word, or look under a different tab.</p>
      </div>
    );

  const copy = {
    all: {
      icon: "fa-solid fa-shapes",
      title: "No templates yet",
      body: "Templates are sets of blocks that people share so anyone can reuse them. Be the first to share one.",
    },
    official: {
      icon: "fa-solid fa-circle-check",
      title: "No official templates yet",
      body: "Templates made by the DisFuse team will show up here.",
    },
    mine: {
      icon: "fa-solid fa-pen-ruler",
      title: "You haven't made any templates",
      body: "Build a set of blocks once, then add it to any of your projects or share it with everyone.",
    },
    liked: {
      icon: "fa-regular fa-heart",
      title: "Nothing liked yet",
      body: "Tap the heart on any template to save it here.",
    },
  }[filter];

  return (
    <div className="df-empty">
      <i className={copy.icon} />
      <h3>{copy.title}</h3>
      <p>{copy.body}</p>
      {onCreate && (filter === "all" || filter === "mine") ? (
        <button className="df-primary-btn" onClick={onCreate}>
          <i className="fa-solid fa-plus" /> Create a template
        </button>
      ) : null}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.viewer
 * @param {(template: object) => void} props.onOpen
 * @param {(template: object) => void} [props.onUse]
 * @param {string} [props.useLabel]
 * @param {string} [props.useIcon]
 * @param {(template: object) => void} [props.onEdit]
 * @param {() => void} [props.onCreate]
 * @param {string} [props.initialFilter]
 * @param {(filter: string) => void} [props.onFilterChange]
 * @param {number} [props.reloadKey]  change it to fetch again
 * @param {"page"|"editor"} [props.context]
 */
export default function TemplateGallery({
  viewer,
  onOpen,
  onUse,
  useLabel,
  useIcon,
  onEdit,
  onCreate,
  initialFilter = "all",
  onFilterChange,
  reloadKey = 0,
  context = "page",
}) {
  const [filter, setFilter] = useState(
    TABS.some((tab) => tab.id === initialFilter) ? initialFilter : "all",
  );
  const [sort, setSort] = useState(() => defaultSort(initialFilter));
  const [typed, setTyped] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);

  const top = useRef(null);

  /* Debounced search. A new search, like a new tab or order, starts
     again from page one — set together, so it is one request. */
  const searched = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = typed.trim();
      if (next === searched.current) return;

      searched.current = next;
      setQuery(next);
      setPage(1);
    }, SEARCH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [typed]);

  useEffect(() => {
    const controller = new AbortController();

    setStatus("loading");
    setError(null);

    listTemplates(
      { filter, sort, q: query, page, limit: context === "editor" ? 12 : 24 },
      { signal: controller.signal },
    )
      .then((next) => {
        setResult(next);
        setStatus("ready");
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(failure, "Couldn't load templates"));
        setStatus("error");
      });

    return () => controller.abort();
  }, [context, filter, sort, query, page, reloadKey, retry]);

  function chooseFilter(next) {
    if (next === filter) return;

    setFilter(next);
    setPage(1);
    /* Your own templates open most recently updated first, and that
       order only exists for them; any other choice carries across. */
    setSort((current) =>
      next === "mine"
        ? "updated"
        : current === "updated"
          ? defaultSort(next)
          : current,
    );
    onFilterChange?.(next);
  }

  function chooseSort(next) {
    setSort(next);
    setPage(1);
  }

  function goToPage(next) {
    setPage(next);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const templates = result?.templates ?? [];
  const pages = result?.pages ?? 1;

  return (
    <div className={`df-template-gallery ${context}`} ref={top}>
      <div className="df-template-toolbar">
        <div className="df-template-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              className={filter === tab.id ? "active" : ""}
              onClick={() => chooseFilter(tab.id)}
            >
              <i className={tab.icon} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="df-template-controls">
          <input
            type="search"
            className="search"
            placeholder="Search templates"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            aria-label="Search templates"
          />

          <select
            value={sort}
            onChange={(event) => chooseSort(event.target.value)}
            aria-label="Sort templates"
          >
            {SORTS.filter(
              (option) => !option.mineOnly || filter === "mine",
            ).map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          {onCreate ? (
            <button className="df-primary-btn" onClick={onCreate}>
              <i className="fa-solid fa-plus" /> Create
            </button>
          ) : null}
        </div>
      </div>

      {status === "loading" && !result ? (
        <LoadingAnim />
      ) : status === "error" ? (
        <div className="df-empty">
          <i className="fa-solid fa-triangle-exclamation" />
          <h3>{error}</h3>
          <button onClick={() => setRetry((count) => count + 1)}>
            <i className="fa-solid fa-rotate-right" /> Try again
          </button>
        </div>
      ) : templates.length === 0 ? (
        <EmptyState filter={filter} query={query} onCreate={onCreate} />
      ) : (
        <div
          className={`df-grid df-template-grid${
            status === "loading" ? " refreshing" : ""
          }`}
        >
          {templates.map((template) => (
            <TemplateCard
              key={template._id}
              template={template}
              viewer={viewer}
              onOpen={onOpen}
              onUse={onUse}
              useLabel={useLabel}
              useIcon={useIcon}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}

      {status !== "error" && pages > 1 ? (
        <div className="df-pagination">
          <button
            onClick={() => goToPage(Math.max(page - 1, 1))}
            disabled={page === 1}
          >
            <i className="fa-solid fa-chevron-left" /> Previous
          </button>
          <span className="page-indicator">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => goToPage(Math.min(page + 1, pages))}
            disabled={page === pages}
          >
            Next <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
