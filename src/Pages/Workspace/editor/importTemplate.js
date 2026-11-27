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
import { secretNamesIn } from "../../../builder/model/templates.js";
import { COMMAND_CONTAINERS } from "../../../builder/convert/commands.js";
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

   A template made with DisFuse Builder works here too. Its commands and
   events are turned into blocks first (builder/convert/toBlocks.js, via
   ./templateConversion.js); anything with no block that does exactly the
   same becomes a code block, and the dialog says which. Its commands go
   into the project's "create slash commands" block if this workspace
   has one, because two of them would replace each other's commands.

   In order:
     1. read the template (converting it if it was made with DisFuse
        Builder), and refuse early if it can't be imported;
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
 * @param {string} [options.currentWorkspaceId] the workspace on screen
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
  currentWorkspaceId,
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
      "You can't add this template",
      template.published ? "It's private." : "It hasn't been published yet.",
      modalColors,
    );
    return false;
  }

  const unavailable = (template.packs ?? []).filter((pack) => !pack.available);

  if (unavailable.length) {
    await fail(
      "You can't add this template",
      `It needs blocks from ${
        unavailable[0].name
          ? `the "${unavailable[0].name}" Workshop pack`
          : "a Workshop pack"
      }, which is no longer available.`,
      modalColors,
    );
    return false;
  }

  /* A DisFuse Builder template, as blocks. Its packs have to be known to
     Blockly first, so they're fetched now (and only installed below, once
     the person says yes). */
  const fromBuilder = template.type === "builder";
  let converted = null;
  let fetchedPacks = [];

  if (fromBuilder) {
    try {
      const { builderTemplateToBlocks, loadTemplatePacks, templatePackIds } =
        await import("./templateConversion.js");
      const ids = templatePackIds(template, template.data);
      fetchedPacks = await loadTemplatePacks(ids, loadedPacks);
      converted = builderTemplateToBlocks(template, [
        ...loadedPacks,
        ...fetchedPacks,
      ]);
    } catch (error) {
      console.error("Couldn't turn that template into blocks:", error);
      await fail(
        "Couldn't open that template",
        errorMessage(error, "Please try again."),
        modalColors,
      );
      return false;
    }
  }

  const data = converted ? converted.data : template.data;
  const state = parseTemplateData(data);

  if (!state) {
    await fail(
      "This template is empty",
      fromBuilder
        ? "There are no commands or events in it to add."
        : "There are no blocks in it to add.",
      modalColors,
    );
    return false;
  }

  const installed = new Set((user.installedBlockPacks ?? []).map(String));
  const neededPacks = fromBuilder
    ? [
        ...(template.packs ?? []),
        ...fetchedPacks
          .filter(
            (pack) =>
              !(template.packs ?? []).some(
                (listed) => String(listed._id) === String(pack._id),
              ),
          )
          .map((pack) => ({ _id: pack._id, name: pack.name, available: true })),
      ]
    : (template.packs ?? []);
  const newPacks = neededPacks.filter(
    (pack) => !installed.has(String(pack._id)),
  );

  /* ---- 2. Where to, and what else comes with it --------------------- */
  const conversionNote = converted ? conversionHtml(converted, project) : "";

  const packNote = newPacks.length
    ? `<p class="df-template-import-note"><i class="fa-solid fa-cubes-stacked"></i> It uses ${
        newPacks.length === 1
          ? "a Workshop pack you haven't installed"
          : "Workshop packs you haven't installed"
      }: ${newPacks
        .map((pack) => `<b>${escapeHtml(pack.name)}</b>`)
        .join(", ")}. Adding the template will install ${
        newPacks.length === 1 ? "it" : "them"
      } for you.</p>`
    : "";

  const choice = await Swal.fire({
    title: `Add “${escapeHtml(template.name)}”`,
    html: `<p>${
      fromBuilder
        ? describeBuilderTemplate(template)
        : `${template.blockCount} block${template.blockCount === 1 ? "" : "s"}`
    }${
      template.owner?.username
        ? ` by <b>${escapeHtml(template.owner.username)}</b>`
        : ""
    }. A copy of the blocks goes into this project, so later changes to the template won't affect it.</p>${conversionNote}${packNote}`,
    icon: "question",
    showCancelButton: true,
    showDenyButton: canCreateWorkspaces,
    confirmButtonText: "Add to this workspace",
    denyButtonText: "Add as a new workspace",

    footer: canCreateWorkspaces
      ? undefined
      : "Only the project's owner can add new workspaces, so the blocks will go in this one.",
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
       one opened. A builder template's were fetched above already. */
    const loadedIds = new Set(loadedPacks.map((pack) => String(pack._id)));
    const fetchedIds = new Set(fetchedPacks.map((pack) => String(pack._id)));
    const toLoad = neededPacks
      .map((pack) => String(pack._id))
      .filter((id) => !loadedIds.has(id) && !fetchedIds.has(id));

    const added = [
      ...fetchedPacks,
      ...(toLoad.length
        ? await loadBlockPacks({ installedBlockPacks: toLoad })
        : []),
    ];
    if (added.length) onPacksLoaded(added);
  } catch (error) {
    await fail(
      "Couldn't install the Workshop packs this template needs",
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
      `This template uses blocks that couldn't be loaded: ${unknown.join(", ")}.`,
      modalColors,
    );
    return false;
  }

  /* ---- 4. The blocks ------------------------------------------------ */
  let commandsMerged = null;

  try {
    if (intoNewWorkspace)
      await openNewWorkspace(unusedName(template.name, project.workspaces));

    const created = importTemplateBlocks(getWorkspace(), data);
    if (fromBuilder)
      commandsMerged = mergeCommandContainers(getWorkspace(), created, {
        project,
        currentWorkspaceId: intoNewWorkspace ? null : currentWorkspaceId,
      });
  } catch (error) {
    console.error("Template import failed:", error);

    await fail(
      "Couldn't add that template",
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
    title: `Added “${escapeHtml(template.name)}”`,
    text: [
      intoNewWorkspace ? "It's in a new workspace." : "Press Ctrl+Z to undo.",
      commandsMerged === "elsewhere"
        ? 'Your project has another "create slash commands" block. Move the new commands into it, or the two will replace each other\'s commands.'
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    ...(commandsMerged === "elsewhere" ? { timer: 12000 } : {}),
    ...modalColors,
  });

  return true;
}

/* ---- DisFuse Builder templates -------------------------------------- */

function describeBuilderTemplate(template) {
  const parts = [];
  const commands = template.commandCount ?? 0;
  const events = template.eventCount ?? 0;
  if (commands) parts.push(`${commands} command${commands === 1 ? "" : "s"}`);
  if (events) parts.push(`${events} event${events === 1 ? "" : "s"}`);
  return `Made with DisFuse Builder${parts.length ? `: ${parts.join(" and ")}` : ""}`;
}

/** What the person should know about a DisFuse Builder template turned into blocks. */
function conversionHtml({ report, content }, project) {
  const notes = [];
  const list = (items) => items.map((item) => `<b>${escapeHtml(item)}</b>`).join(", ");

  if (report.code.length)
    notes.push(
      report.code.length === 1
        ? `${list(report.code)} has no blocks that do exactly the same, so it's added as a code block. It works the same way.`
        : `${list(report.code)} have no blocks that do exactly the same, so they're added as code blocks. They work the same way.`,
    );
  if (report.lost.length)
    notes.push(
      `Some command settings have no blocks in the Block Editor, so they're left out: ${report.lost.map(escapeHtml).join("; ")}.`,
    );

  const saved = new Set((project?.secrets ?? []).map((secret) => secret.name));
  const missing = secretNamesIn(content).filter((name) => !saved.has(name));
  if (missing.length)
    notes.push(
      `It reads ${missing.length === 1 ? "a secret" : "secrets"} you haven't saved: ${list(missing)}. Add ${missing.length === 1 ? "it" : "them"} under Secrets on your bot's dashboard.`,
    );

  return `<p class="df-template-import-note"><i class="fa-solid fa-wand-magic-sparkles"></i> It was made with DisFuse Builder, so its commands and events have been turned into blocks.${
    notes.length ? ` ${notes.join(" ")}` : ""
  }</p>`;
}

/**
 * A project needs one "create slash commands" block: each one replaces
 * every command the bot has. When the workspace already had one, the
 * template's commands move into it and the template's own is removed.
 *
 * @returns {"merged"|"elsewhere"|null}  "elsewhere" when the project has
 *   one in a workspace that isn't open, which the person has to move
 *   the commands into themselves
 */
function mergeCommandContainers(workspace, created, { project, currentWorkspaceId }) {
  const imported = created.find((block) => COMMAND_CONTAINERS.has(block.type));
  if (!imported) return null;

  const existing = workspace
    .getTopBlocks(false)
    .find((block) => COMMAND_CONTAINERS.has(block.type) && block !== imported);

  if (!existing)
    return otherWorkspaceHasCommands(project, currentWorkspaceId) ? "elsewhere" : null;

  const from = imported.getInput("code")?.connection;
  const to = existing.getInput(existing.type === "slash_createcontainer" ? "commands" : "code")?.connection;
  const first = from?.targetBlock();
  if (!from || !to || !first) return null;

  Blockly.Events.setGroup(true);
  try {
    from.disconnect();
    let last = to.targetBlock();
    while (last?.getNextBlock()) last = last.getNextBlock();
    if (last) last.nextConnection.connect(first.previousConnection);
    else to.connect(first.previousConnection);
    imported.dispose(false);
  } finally {
    Blockly.Events.setGroup(false);
  }
  return "merged";
}

/** Whether a "create slash commands" block sits in one of the project's other workspaces. */
function otherWorkspaceHasCommands(project, currentWorkspaceId) {
  const pattern = new RegExp(`"type":"(${[...COMMAND_CONTAINERS].join("|")})"`);
  return (project?.workspaces ?? []).some(
    (ws) =>
      String(ws._id) !== String(currentWorkspaceId) &&
      pattern.test(typeof ws.data === "string" ? ws.data : JSON.stringify(ws.data ?? "")),
  );
}
