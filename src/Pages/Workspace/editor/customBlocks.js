import * as Blockly from "blockly";
import javascript from "blockly/javascript";

import api, { data } from "../../../api/client.js";
import registerCustomBlocks from "../../../blocks/lib/registerCustomBlocks";

/* =====================================================================
   Blocks that aren't ours
   ---------------------------------------------------------------------
   Two sources of user-defined blocks have to be registered before the
   workspace is injected, or a project using them won't load:

     - installed Workshop block packs, which belong to the signed-in user;
     - custom blocks made with BlockBuddy, which belong to the project's
       owner and to each of its collaborators — because a collaborator
       has to be able to open blocks the owner invented, and the other
       way round.

   Both were fetched inline in the page component, and the collaborators
   were fetched one at a time in an `await` loop — so a project with six
   collaborators waited on six round trips before Blockly was injected.
   ===================================================================== */

/** The Workshop packs a user has installed. */
export async function loadBlockPacks(user, { signal } = {}) {
  const ids = user?.installedBlockPacks ?? [];
  if (!ids.length) return [];

  const results = await Promise.allSettled(
    ids.map((packId) => api.get(`/workshop/${packId}`, { signal }).then(data)),
  );

  /* A pack that has been deleted, or made private since it was
     installed, must not stop the project opening. */
  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}

/** Registers the blocks inside each installed pack. */
export function registerBlockPacks(packs = []) {
  for (const pack of packs) {
    const latest = pack.versions?.[pack.versions.length - 1];
    registerCustomBlocks(latest?.blocks || []);
  }
}

/**
 * Every BlockBuddy block this project might contain: the owner's, plus
 * each collaborator's.
 */
export async function loadProjectCustomBlocks(project, { signal } = {}) {
  const blocks = [...(project?.owner?.customBlocks || [])];
  const collaborators = project?.collaborators ?? [];

  if (collaborators.length) {
    const results = await Promise.allSettled(
      collaborators.map((id) =>
        api.get(`/users/${id}`, { signal }).then(data),
      ),
    );

    for (const result of results)
      if (result.status === "fulfilled")
        blocks.push(...(result.value.customBlocks || []));
  }

  return blocks;
}

/**
 * Defines custom blocks and their generators.
 *
 * The generator arrives as source code and is compiled here, which is
 * the same trust model the Workshop has always had: a block pack you
 * install, or a collaborator you invited, can run code in your editor.
 * A broken generator is skipped rather than allowed to stop the project
 * from opening.
 */
export function registerProjectCustomBlocks(customBlocks = []) {
  if (!customBlocks.length) return;

  const definitions = customBlocks
    .map((block) => block?.definition)
    .filter(Boolean);

  if (definitions.length) {
    try {
      Blockly.defineBlocksWithJsonArray(definitions);
    } catch (error) {
      console.error("Could not define custom blocks:", error);
    }
  }

  for (const customBlock of customBlocks) {
    if (!customBlock?.javascriptGenerator) continue;

    try {
      // eslint-disable-next-line no-new-func
      const define = new Function("javascript", customBlock.javascriptGenerator);
      define(javascript);
    } catch (error) {
      console.error(
        `Could not register the generator for a custom block:`,
        error,
      );
    }
  }
}
