import { useCallback, useMemo, useRef, useState } from "react";

import api, { data } from "../../api/client.js";
import { userCache } from "../../cache.ts";
import baseCatalog from "../catalog/index.js";
import { catalogWithPacks, packIdsUsed, packIsUsable } from "../catalog/packs.js";

/* =====================================================================
   DisFuse Builder: the Workshop packs a project can use
   ---------------------------------------------------------------------
   An open project (or template) gets the built-in catalog plus:

     - every builder pack the person has installed, and
     - every pack the project already uses, installed or not, so a step
       from someone else's library (a collaborator's, or a template's)
       still shows and still makes code.

   Both kinds of pack: a block pack's blocks become steps here too (see
   catalog/blockPacks.js). A pack with nothing published is skipped, and
   so is one that's private or deleted now; steps from it show as
   unknown, the way a missing pack's blocks do in the block editor.
   ===================================================================== */

/** The ids of the packs in this person's library, as fresh as we can get them. */
async function installedPackIds() {
  const cached = userCache.user;
  if (!cached?.id) return [];
  try {
    const user = await api.get(`/users/${cached.id}`).then(data);
    return user?.installedBlockPacks ?? [];
  } catch {
    return cached.installedBlockPacks ?? [];
  }
}

async function fetchPacks(ids) {
  const results = await Promise.allSettled(ids.map((id) => api.get(`/workshop/${id}`).then(data)));
  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((pack) => packIsUsable(pack));
}

/**
 * The project's catalog, and a way to make sure the packs a builder uses
 * are in it.
 *
 *   const { catalog, loadInstalled, ensureUsed } = useProjectCatalog();
 *   await Promise.all([loadInstalled(), ensureUsed(builder)]);
 */
export function useProjectCatalog() {
  const [packs, setPacks] = useState([]);
  /* Asked for already (or asking now), so nothing is fetched twice. */
  const requested = useRef(new Set());

  const ensure = useCallback(async (ids) => {
    const missing = [...new Set(ids)].filter((id) => !requested.current.has(id));
    if (!missing.length) return;
    missing.forEach((id) => requested.current.add(id));
    const loaded = await fetchPacks(missing);
    if (loaded.length) setPacks((current) => [...current, ...loaded.filter((pack) => !current.some((p) => p._id === pack._id))]);
  }, []);

  const loadInstalled = useCallback(async () => ensure(await installedPackIds()), [ensure]);
  const ensureUsed = useCallback((builder) => ensure(packIdsUsed(builder)), [ensure]);

  const catalog = useMemo(() => catalogWithPacks(baseCatalog, packs), [packs]);

  return { catalog, packs, loadInstalled, ensureUsed };
}
