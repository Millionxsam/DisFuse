/* =====================================================================
   Website element tree helpers
   ---------------------------------------------------------------------
   A website page is a tree of nodes:

     { id, type, props: {}, style: {}, children: [] }

   Every operation below is immutable — it returns a new tree — so the
   editor can keep an undo history by simply holding on to old trees.
   ===================================================================== */

import {
  elementScope,
  getElementDef,
  isDashboardElement,
} from "../config/websiteElements";

export function uid(prefix = "el") {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().split("-")[0]
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${random}`;
}

/** Builds a fresh node with the element type's baked-in defaults. */
export function createElementNode(type, overrides = {}) {
  const def = getElementDef(type);
  if (!def) throw new Error(`Unknown website element type: ${type}`);

  const props = structuredClone(def.defaults?.props ?? {});
  const style = structuredClone(def.defaults?.style ?? {});

  // Dashboard controls need a unique data key so two toggles on the same
  // page don't write to the same website.data field.
  if ("settingKey" in props && !props.settingKey) {
    props.settingKey = uid("setting");
  }

  return {
    id: uid(),
    type,
    props: { ...props, ...(overrides.props || {}) },
    style: { ...style, ...(overrides.style || {}) },
    children: def.container ? overrides.children || [] : [],
  };
}

export function createPage(name, path, elements = []) {
  return { id: uid("page"), name, path, elements };
}

/* ---- Reading --------------------------------------------------------- */

export function findNode(nodes, id) {
  for (const node of nodes || []) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

export function findParent(nodes, id, parent = null) {
  for (const node of nodes || []) {
    if (node.id === id) return parent;
    const found = findParent(node.children, id, node);
    if (found !== null) return found;
  }
  return null;
}

/** True when `ancestorId` is (or contains) `id` — used to block bad drops. */
export function containsNode(nodes, ancestorId, id) {
  const ancestor = findNode(nodes, ancestorId);
  if (!ancestor) return false;
  if (ancestorId === id) return true;
  return Boolean(findNode(ancestor.children, id));
}

export function flattenTree(nodes, depth = 0, out = []) {
  for (const node of nodes || []) {
    out.push({ node, depth });
    flattenTree(node.children, depth + 1, out);
  }
  return out;
}

/** Does this page contain any dashboard control? */
export function pageUsesDashboard(page) {
  return flattenTree(page?.elements || []).some(({ node }) =>
    isDashboardElement(node.type),
  );
}

/** Does the website use dashboard functionality anywhere? */
export function websiteUsesDashboard(website) {
  return (website?.config?.pages || []).some(pageUsesDashboard);
}

/** Every dashboard control that stores a value, in document order. */
export function collectDashboardSettings(page) {
  return flattenTree(page?.elements || [])
    .filter(
      ({ node }) => isDashboardElement(node.type) && node.props?.settingKey,
    )
    .map(({ node }) => node);
}

/**
 * Does this page contain controls for a given data scope?
 *
 * The published page uses this to decide what it actually has to ask the
 * visitor for — a page with only user-scoped controls never shows the
 * server picker.
 *
 * @param {"guild"|"user"} scope
 */
export function pageUsesScope(page, scope) {
  return collectDashboardSettings(page).some(
    (node) => elementScope(node) === scope,
  );
}

/**
 * Does the website use a data scope anywhere?
 *
 * The builder uses this to decide which site-wide settings are worth
 * showing — the "who can configure a server" rule is meaningless on a
 * website that only stores per-user settings.
 *
 * @param {"guild"|"user"} scope
 */
export function websiteUsesScope(website, scope) {
  return (website?.config?.pages || []).some((page) =>
    pageUsesScope(page, scope),
  );
}

/* ---- Writing --------------------------------------------------------- */

export function updateNode(nodes, id, updater) {
  return (nodes || []).map((node) => {
    if (node.id === id) return updater(node);
    if (node.children?.length) {
      return { ...node, children: updateNode(node.children, id, updater) };
    }
    return node;
  });
}

export function removeNode(nodes, id) {
  return (nodes || [])
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children?.length
        ? { ...node, children: removeNode(node.children, id) }
        : node,
    );
}

/**
 * Inserts `newNode` relative to `targetId`.
 *   position "inside" → appended to the target's children
 *   position "before" / "after" → sibling of the target
 * A null targetId appends to the root of the page.
 */
export function insertNode(nodes, targetId, newNode, position = "inside") {
  if (!targetId) return [...(nodes || []), newNode];

  if (position === "inside") {
    return updateNode(nodes, targetId, (node) => ({
      ...node,
      children: [...(node.children || []), newNode],
    }));
  }

  const insertInto = (list) => {
    const index = list.findIndex((n) => n.id === targetId);

    if (index !== -1) {
      const next = [...list];
      next.splice(position === "before" ? index : index + 1, 0, newNode);
      return next;
    }

    return list.map((node) =>
      node.children?.length
        ? { ...node, children: insertInto(node.children) }
        : node,
    );
  };

  return insertInto(nodes || []);
}

/** Removes a node then re-inserts it somewhere else. */
export function moveNode(nodes, id, targetId, position = "inside") {
  if (id === targetId) return nodes;
  if (containsNode(nodes, id, targetId)) return nodes; // can't drop into itself

  const node = findNode(nodes, id);
  if (!node) return nodes;

  return insertNode(removeNode(nodes, id), targetId, node, position);
}

/** Moves a node one slot up or down among its siblings. */
export function shiftNode(nodes, id, direction) {
  const shift = (list) => {
    const index = list.findIndex((n) => n.id === id);

    if (index !== -1) {
      const target = index + direction;
      if (target < 0 || target >= list.length) return list;

      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    }

    return list.map((node) =>
      node.children?.length
        ? { ...node, children: shift(node.children) }
        : node,
    );
  };

  return shift(nodes || []);
}

/** Deep copy with fresh ids (and fresh setting keys for dashboard nodes). */
export function cloneNode(node) {
  const copy = structuredClone(node);

  const reid = (n) => {
    n.id = uid();
    if (isDashboardElement(n.type) && n.props?.settingKey) {
      n.props.settingKey = uid("setting");
    }
    (n.children || []).forEach(reid);
  };

  reid(copy);
  return copy;
}

export function duplicateNode(nodes, id) {
  const node = findNode(nodes, id);
  if (!node) return nodes;

  return insertNode(nodes, id, cloneNode(node), "after");
}
