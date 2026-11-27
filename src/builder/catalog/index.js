/* =====================================================================
   DisFuse Builder: the catalog
   ---------------------------------------------------------------------
   Every event, action, value and message/form component the builder
   offers. They're defined with their blocks in src/elements (see
   src/elements/define.js); this keeps the builder's side of each.

     events, actions, values, components   Map<id, definition>
     contexts                              what commands and events make available
     moduleOf                              id → the module that defines it
   ===================================================================== */

import { CATEGORIES, CATEGORY_BY_ID } from "./categories.js";
import { CONTEXTS } from "./contexts.js";
import { MODULES } from "../../elements/index.js";

export { MODULES };

function build() {
  const events = new Map();
  const actions = new Map();
  const values = new Map();
  const components = new Map();
  const contexts = { ...CONTEXTS };
  const duplicates = [];
  const moduleOf = new Map();

  const add = (map, entry, moduleName) => {
    if (entry.builder === false) return;
    if (map.has(entry.id)) duplicates.push(`${entry.id} (${moduleOf.get(entry.id)} and ${moduleName})`);
    map.set(entry.id, entry);
    moduleOf.set(entry.id, moduleName);
  };

  for (const [moduleName, mod] of Object.entries(MODULES)) {
    for (const entry of mod.events ?? []) add(events, entry, moduleName);
    for (const entry of mod.actions ?? []) add(actions, entry, moduleName);
    for (const entry of mod.values ?? []) add(values, entry, moduleName);
    for (const entry of mod.components ?? []) add(components, entry, moduleName);
    for (const context of mod.contexts ?? []) contexts[context.key] = context;
  }

  return {
    events,
    actions,
    values,
    components,
    contexts,
    duplicates,
    moduleOf,
    categories: CATEGORIES,
    categoryById: CATEGORY_BY_ID,
  };
}

/** The whole catalog, built once. */
const catalog = build();

export default catalog;

/** Message builder pieces only. */
export function messageComponents() {
  return [...catalog.components.values()].filter((c) => c.family === "message");
}

/** Form builder pieces only. */
export function modalComponents() {
  return [...catalog.components.values()].filter((c) => c.family === "modal");
}
