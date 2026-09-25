import * as Blockly from "blockly";
import Swal from "sweetalert2";

import { errorMessage } from "../../../api/client.js";
import {
  getTemplate,
  installTemplatePacks,
  recordTemplateImport,
} from "../../../api/templates.js";
import { escapeHtml } from "../../../components/templates/templateDialogs.js";
import {
  blockTypesIn,
  importTemplateBlocks,
  parseTemplateData,
} from "../../../functions/templateBlocks.js";
import { loadBlockPacks } from "./customBlocks.js";

/* =====================================================================
   Importing a template into the open project
   ---------------------------------------------------------------------
   Utilities › Templates, a template's page ("Use in a project") and a
   link with `?template=` all end up here.

   An import is a copy. The blocks land in the project as ordinary blocks
   with nothing pointing back at the template, so whatever happens to the
   template afterwards — edited, unpublished, deleted — this project
   never notices.

   In order:
     1. read the template, and refuse early if it can't be imported;
     2. ask where the blocks should go, and say which Workshop packs it
        will add to the user's library, in the same question;
     3. install those packs and teach the editor their blocks;
     4. add the blocks — to this workspace, or to a new one;
     5. tell the API, so the import is counted.
   ===================================================================== */

function fail(title, text, modalColors) {
  return Swal.fire({ title, text, icon: "error", ...modalColors });
}

/** A tab name nobody is using yet: "Tickets", "Tickets (2)", … */
function unusedName(name, workspaces = []) {
  const taken = new Set(workspaces.map((ws) => ws.name));
  if (!taken.has(name)) return name;

  for (let n = 2; ; n++)
    if (!taken.has(`${name} (${n})`)) return `${name} (${n})`;
}

/**
 * @param {object} options
 * @param {string} options.templateId
 * @param {() => object} options.getWorkspace   the Blockly workspace
 * @param {object} options.project
 * @param {object} options.user
 * @param {boolean} options.canCreateWorkspaces only the owner can add tabs
 * @param {Array}  options.loadedPacks          packs the editor has registered
 * @param {(packs: Array) => void} options.onPacksLoaded
 *   registers newly installed packs and puts them in the toolbox
 * @param {(name: string) => Promise<void>} options.openNewWorkspace
 *   creates an empty workspace with this name and switches to it
 * @param {object} options.modalColors
 * @returns {Promise<boolean>} whether anything was imported
 */
export default async function importTemplate({
  templateId,
  getWorkspace,
  project,
  user,
  canCreateWorkspaces,
  loadedPacks,
  onPacksLoaded,
  openNewWorkspace,
  modalColors,
}) {
  /* ---- 1. The template ---------------------------------------------- */
  let template;

  try {
    template = await getTemplate(templateId);
  } catch (error) {
    await fail(
      "Couldn't open that template",
      error?.response?.status === 404
        ? "It may have been unpublished or deleted."
        : errorMessage(error, "Please try again."),
      modalColors,
    );
    return false;
  }

  if (!template.canImport) {
    await fail(
      "This template can't be imported",
      template.published ? "It's private." : "It hasn't been published yet.",
      modalColors,
    );
    return false;
  }

  const state = parseTemplateData(template.data);

  if (!state) {
    await fail(
      "This template is empty",
      "There are no blocks in it to import.",
      modalColors,
    );
    return false;
  }

  const unavailable = (template.packs ?? []).filter((pack) => !pack.available);

  if (unavailable.length) {
    await fail(
      "This template can't be imported",
      `It needs blocks from ${
        unavailable[0].name
          ? `the "${unavailable[0].name}" Workshop pack`
          : "a Workshop pack"
      }, which is no longer available.`,
      modalColors,
    );
    return false;
  }

  const installed = new Set((user.installedBlockPacks ?? []).map(String));
  const newPacks = (template.packs ?? []).filter(
    (pack) => !installed.has(String(pack._id)),
  );

  /* ---- 2. Where to, and what else comes with it --------------------- */
  const packNote = newPacks.length
    ? `<p class="df-template-import-note"><i class="fa-solid fa-cubes-stacked"></i> It uses blocks from ${
        newPacks.length === 1 ? "a Workshop pack" : "Workshop packs"
      } you haven't installed — ${newPacks
        .map((pack) => `<b>${escapeHtml(pack.name)}</b>`)
        .join(", ")}. Importing adds ${
        newPacks.length === 1 ? "it" : "them"
      } to your library.</p>`
    : "";

  const choice = await Swal.fire({
    title: `Import “${escapeHtml(template.name)}”`,
    html: `<p>${template.blockCount} block${
      template.blockCount === 1 ? "" : "s"
    }${
      template.owner?.username
        ? ` by <b>${escapeHtml(template.owner.username)}</b>`
        : ""
    }. They're copied into this project — later changes to the template won't affect it.</p>${packNote}`,
    icon: "question",
    showCancelButton: true,
    showDenyButton: canCreateWorkspaces,
    confirmButtonText: "Add to this workspace",
    denyButtonText: "Add as a new workspace",

    footer: canCreateWorkspaces
      ? undefined
      : "Only the project's owner can add workspaces, so it will go in this one.",
    ...modalColors,
    /* Two equally good answers. Every deny button in the app is red, which
       would make the second one look like the dangerous choice. */
    customClass: {
      ...(modalColors.customClass ?? {}),
      denyButton: "df-swal-neutral",
    },
  });

  if (choice.isDismissed) return false;

  const intoNewWorkspace = choice.isDenied;

  /* ---- 3. Workshop packs -------------------------------------------- */
  try {
    if (newPacks.length) {
      const result = await installTemplatePacks(template._id);
      user.installedBlockPacks = [
        ...new Set([...(user.installedBlockPacks ?? []), ...result.installed]),
      ];
    }

    /* Anything the template uses that this editor hasn't loaded — the
       packs just installed, and any installed in another tab since this
       one opened. */
    const loadedIds = new Set(loadedPacks.map((pack) => String(pack._id)));
    const toLoad = (template.packs ?? [])
      .map((pack) => String(pack._id))
      .filter((id) => !loadedIds.has(id));

    if (toLoad.length)
      onPacksLoaded(await loadBlockPacks({ installedBlockPacks: toLoad }));
  } catch (error) {
    await fail(
      "Couldn't install the packs this template needs",
      errorMessage(error, "Please try again."),
      modalColors,
    );
    return false;
  }

  const unknown = [...blockTypesIn(state.blocks.blocks)].filter(
    (type) => !Blockly.Blocks[type],
  );

  if (unknown.length) {
    await fail(
      "Some of these blocks aren't available",
      `This template uses blocks this editor can't load: ${unknown.join(", ")}.`,
      modalColors,
    );
    return false;
  }

  /* ---- 4. The blocks ------------------------------------------------ */
  try {
    if (intoNewWorkspace)
      await openNewWorkspace(unusedName(template.name, project.workspaces));

    importTemplateBlocks(getWorkspace(), template.data);
  } catch (error) {
    console.error("Template import failed:", error);

    await fail(
      "Couldn't import that template",
      errorMessage(error, "Please reload the page and try again."),
      modalColors,
    );
    return false;
  }

  /* ---- 5. Counted --------------------------------------------------- */
  recordTemplateImport(template._id).catch((error) =>
    console.warn("Couldn't count that import:", error),
  );

  Swal.fire({
    toast: true,
    position: "top-right",
    timer: 5000,
    timerProgressBar: true,
    showConfirmButton: false,
    icon: "success",
    /* SweetAlert renders a title as HTML, and this one is user text. */
    title: `Imported “${escapeHtml(template.name)}”`,
    text: intoNewWorkspace
      ? "It's in a workspace of its own."
      : "Press Ctrl+Z to take it back out.",
    ...modalColors,
  });

  return true;
}
