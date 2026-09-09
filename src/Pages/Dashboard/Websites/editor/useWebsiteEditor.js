import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import { getWebsite, updateWebsite } from "../../../../api/websites";
import { getElementDef } from "../../../../config/websiteElements";
import modalThemeColor from "../../../../functions/modalThemeColor";
import { userCache } from "../../../../cache.ts";
import {
  createElementNode,
  createPage,
  duplicateNode,
  findNode,
  findParent,
  insertNode,
  moveNode,
  removeNode,
  shiftNode,
  updateNode,
} from "../../../../functions/websiteTree";

const HISTORY_LIMIT = 50;
const COALESCE_MS = 700;

/**
 * Owns everything the website builder edits: the loaded website, the
 * undo/redo history and every operation on the page tree.
 *
 * State lives entirely in the editor — the API is only touched on load and
 * on save — so the builder stays responsive and behaves identically once
 * the real backend exists.
 */
export default function useWebsiteEditor(websiteId) {
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activePageId, setActivePageId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Mirrors `website` so callbacks never close over a stale copy. */
  const websiteRef = useRef(null);
  const history = useRef({ past: [], future: [] });
  const lastEdit = useRef({ tag: null, at: 0 });
  const [historyVersion, setHistoryVersion] = useState(0);

  const apply = useCallback((next) => {
    websiteRef.current = next;
    setWebsite(next);
  }, []);

  /* ---- Load ---------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    getWebsite(websiteId)
      .then((data) => {
        if (cancelled) return;

        websiteRef.current = data;
        setWebsite(data);
        setActivePageId(data?.config?.pages?.[0]?.id ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error(err);
        setError(err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [websiteId]);

  const pages = website?.config?.pages || [];
  const activePage =
    pages.find((page) => page.id === activePageId) || pages[0] || null;
  const activeId = activePage?.id ?? null;
  const selectedNode = activePage
    ? findNode(activePage.elements, selectedId)
    : null;

  /* ---- Config mutation + history ------------------------------------- */

  /**
   * `tag` coalesces rapid edits to the same field (typing in a text box)
   * into a single undo step instead of one per keystroke.
   */
  const commit = useCallback(
    (mutate, tag) => {
      const current = websiteRef.current;
      if (!current) return;

      const nextConfig = mutate(current.config);
      if (!nextConfig || nextConfig === current.config) return;

      const now = Date.now();
      const coalesce =
        tag &&
        tag === lastEdit.current.tag &&
        now - lastEdit.current.at < COALESCE_MS;

      if (!coalesce) {
        history.current.past.push(current.config);
        if (history.current.past.length > HISTORY_LIMIT)
          history.current.past.shift();
        history.current.future = [];
      }

      lastEdit.current = { tag: tag || null, at: now };

      apply({ ...current, config: nextConfig });
      setDirty(true);
      setHistoryVersion((v) => v + 1);
    },
    [apply],
  );

  const commitPages = useCallback(
    (mutatePages, tag) =>
      commit(
        (config) => ({ ...config, pages: mutatePages(config.pages || []) }),
        tag,
      ),
    [commit],
  );

  /** Replaces the elements of the page currently being edited. */
  const commitElements = useCallback(
    (mutateElements, tag) =>
      commitPages(
        (list) =>
          list.map((page) =>
            page.id === activeId
              ? { ...page, elements: mutateElements(page.elements || []) }
              : page,
          ),
        tag,
      ),
    [commitPages, activeId],
  );

  const undo = useCallback(() => {
    const current = websiteRef.current;
    const previous = history.current.past.pop();
    if (!current || previous === undefined) return;

    history.current.future.unshift(current.config);
    lastEdit.current = { tag: null, at: 0 };
    apply({ ...current, config: previous });
    setDirty(true);
    setHistoryVersion((v) => v + 1);
  }, [apply]);

  const redo = useCallback(() => {
    const current = websiteRef.current;
    const next = history.current.future.shift();
    if (!current || next === undefined) return;

    history.current.past.push(current.config);
    lastEdit.current = { tag: null, at: 0 };
    apply({ ...current, config: next });
    setDirty(true);
    setHistoryVersion((v) => v + 1);
  }, [apply]);

  /* ---- Elements ------------------------------------------------------ */

  /** Adds a new element inside the selected container, or next to it. */
  const addElement = useCallback(
    (type) => {
      const node = createElementNode(type);

      commitElements((elements) => {
        if (!selectedId) return [...elements, node];

        const selected = findNode(elements, selectedId);
        if (!selected) return [...elements, node];

        return getElementDef(selected.type)?.container
          ? insertNode(elements, selectedId, node, "inside")
          : insertNode(elements, selectedId, node, "after");
      });

      setSelectedId(node.id);
      return node;
    },
    [commitElements, selectedId],
  );

  const updateElement = useCallback(
    (id, changes, tag) =>
      commitElements(
        (elements) =>
          updateNode(elements, id, (node) => ({
            ...node,
            props: changes.props
              ? { ...node.props, ...changes.props }
              : node.props,
            style: changes.style
              ? { ...node.style, ...changes.style }
              : node.style,
          })),
        tag,
      ),
    [commitElements],
  );

  /** Empty style values are removed so the element can inherit again. */
  const setElementStyle = useCallback(
    (id, key, value, tag) =>
      commitElements(
        (elements) =>
          updateNode(elements, id, (node) => {
            const style = { ...node.style };

            if (value === "" || value === undefined) delete style[key];
            else style[key] = value;

            return { ...node, style };
          }),
        tag,
      ),
    [commitElements],
  );

  const deleteElement = useCallback(
    (id) => {
      commitElements((elements) => removeNode(elements, id));
      setSelectedId((current) => (current === id ? null : current));
    },
    [commitElements],
  );

  const duplicateElement = useCallback(
    (id) => commitElements((elements) => duplicateNode(elements, id)),
    [commitElements],
  );

  const moveElement = useCallback(
    (id, targetId, position) =>
      commitElements((elements) => moveNode(elements, id, targetId, position)),
    [commitElements],
  );

  const shiftElement = useCallback(
    (id, direction) =>
      commitElements((elements) => shiftNode(elements, id, direction)),
    [commitElements],
  );

  const selectParent = useCallback(() => {
    if (!activePage || !selectedId) return;

    setSelectedId(findParent(activePage.elements, selectedId)?.id ?? null);
  }, [activePage, selectedId]);

  /* ---- Pages --------------------------------------------------------- */

  const addPage = useCallback(
    (name, path) => {
      const page = createPage(name, path);

      commitPages((list) => [...list, page]);
      setActivePageId(page.id);
      setSelectedId(null);

      return page;
    },
    [commitPages],
  );

  const updatePage = useCallback(
    (id, changes, tag) =>
      commitPages(
        (list) =>
          list.map((page) => (page.id === id ? { ...page, ...changes } : page)),
        tag,
      ),
    [commitPages],
  );

  const deletePage = useCallback(
    (id) => {
      commitPages((list) =>
        list.length > 1 ? list.filter((p) => p.id !== id) : list,
      );

      setActivePageId((current) =>
        current === id ? (pages.find((p) => p.id !== id)?.id ?? null) : current,
      );
      setSelectedId(null);
    },
    [commitPages, pages],
  );

  const movePage = useCallback(
    (id, direction) =>
      commitPages((list) => {
        const index = list.findIndex((p) => p.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= list.length) return list;

        const next = [...list];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      }),
    [commitPages],
  );

  /* ---- Site-wide settings -------------------------------------------- */

  const updateTheme = useCallback(
    (changes, tag) =>
      commit(
        (config) => ({
          ...config,
          theme: {
            ...config.theme,
            ...changes,
            colors: { ...config.theme?.colors, ...(changes.colors || {}) },
            fonts: { ...config.theme?.fonts, ...(changes.fonts || {}) },
          },
        }),
        tag,
      ),
    [commit],
  );

  const updateSeo = useCallback(
    (changes, tag) =>
      commit(
        (config) => ({ ...config, seo: { ...config.seo, ...changes } }),
        tag,
      ),
    [commit],
  );

  /** Name and published state live on the website document, not in `config`. */
  const updateMeta = useCallback(
    (changes) => {
      const current = websiteRef.current;
      if (!current) return;

      apply({ ...current, ...changes });
      setDirty(true);
    },
    [apply],
  );

  /* ---- Persistence --------------------------------------------------- */

  const save = useCallback(
    async (extra = {}) => {
      const current = websiteRef.current;
      if (!current) return null;

      setSaving(true);

      try {
        const saved = await updateWebsite(current._id, {
          name: current.name,
          published: current.published,
          config: current.config,
          /* Both live on the website document rather than in `config`,
             and both are re-validated and enforced by the API. */
          path: current.path ?? null,
          dashboardAccess: current.dashboardAccess ?? {
            type: "owner",
            permission: null,
          },
          ...extra,
        });

        apply({ ...current, ...saved, ...extra });
        setDirty(false);
        userCache.websites = null;

        /* Project cards and project pages link to this website, and both
           read a cached listing. Publishing (or renaming, or changing the
           address) is exactly what those links show. */
        userCache.projects = null;
        userCache.explore = null;

        return saved;
      } catch (err) {
        console.error(err);

        Swal.fire({
          icon: "error",
          title: "Couldn't save",
          text:
            err.response?.data?.error ||
            "An error occurred while saving this website. Please try again.",
          ...modalThemeColor(userCache.user),
        });

        return null;
      } finally {
        setSaving(false);
      }
    },
    [apply],
  );

  return {
    website,
    loading,
    error,
    pages,
    activePage,
    activePageId: activeId,
    setActivePageId: useCallback((id) => {
      setActivePageId(id);
      setSelectedId(null);
    }, []),
    selectedId,
    selectedNode,
    setSelectedId,
    hoveredId,
    setHoveredId,
    dirty,
    saving,
    save,
    addElement,
    updateElement,
    setElementStyle,
    deleteElement,
    duplicateElement,
    moveElement,
    shiftElement,
    selectParent,
    addPage,
    updatePage,
    deletePage,
    movePage,
    updateTheme,
    updateSeo,
    updateMeta,
    undo,
    redo,
    canUndo: history.current.past.length > 0,
    canRedo: history.current.future.length > 0,
    historyVersion,
  };
}
