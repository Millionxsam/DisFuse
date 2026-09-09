import * as Blockly from "blockly";
import JSZip from "jszip";
import Swal from "sweetalert2";

import getExportFiles from "../../../config/getExportFiles";
import { buildDf, buildProjectDf } from "../../../functions/dfFile";
import { format } from "../../../functions/pretty.js";
import {
  buildWorkspaceFromData,
  generateWorkspaceCode,
  getWholeProjectWorkspace,
  updateCode,
} from "../../../functions/updateCode";
import {
  pickVersionAndScope,
  workspacesForChoice,
} from "../../../functions/versionPicker.js";
import { refreshProjectWorkspaces } from "../../../functions/projectData";

/* =====================================================================
   Export
   ---------------------------------------------------------------------
   A ZIP of the bot's code, plus the `.df` of the blocks it was built
   from, plus a `.env` holding the bot token and the project's secrets.

   On a Version Control project the dialog asks which version to export
   as well as whether to export all of its workspaces or just one, and
   everything below reads from that version — not from whatever happens
   to be on screen.
   ===================================================================== */

const HELP_TEXT =
  'After exporting, make sure to extract the ZIP file and read instructions.txt if you don\'t know what to do next.\nJoin our <a style="color: blue" rel="noopener" target="_blank" href="https://discord.gg/Xwx4zkQcmJ">Discord server</a> for help';

function titleCase(text) {
  return text.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase(),
  );
}

/** Asks what to export. Resolves to null if the dialog is dismissed. */
async function askWhatToExport({
  activeVersion,
  versions,
  currentWorkspaceId,
  modalColors,
}) {
  if (!activeVersion) {
    const result = await Swal.fire({
      title: "Export Project",
      icon: "info",
      confirmButtonText: "Download ZIP",
      input: "select",
      inputOptions: {
        project: "Export whole project",
        workspace: "Export current workspace",
      },
      showCancelButton: false,
      html: HELP_TEXT,
      ...modalColors,
    });

    if (!result.isConfirmed) return null;

    return {
      versionId: null,
      scope:
        result.value === "project" ? "project" : String(currentWorkspaceId),
    };
  }

  return pickVersionAndScope({
    versions,
    activeVersionId: activeVersion._id,
    title: "Export Project",
    confirmButtonText: "Download ZIP",
    html: HELP_TEXT,
    modalColors,
  });
}

/**
 * The blocks, the code and the `.df` for whatever was chosen.
 *
 * The version being edited is read from the editor, so an export always
 * includes what is on screen right now. Every other version is read from
 * what was saved.
 */
async function resolveExport({
  choice,
  workspace,
  project,
  projectId,
  activeVersion,
  currentWorkspaceId,
}) {
  const { versionId, scope } = choice;

  const editingThis =
    !activeVersion || String(versionId) === String(activeVersion._id);

  if (editingThis && String(scope) === String(currentWorkspaceId))
    return {
      exportingWs: workspace,
      df: Blockly.serialization.workspaces.save(workspace),
      code: await generateWorkspaceCode(project, workspace),
      temporary: false,
    };

  /* Everything below reads workspaces other than the one on screen, and
     the project this page was opened with holds their blocks as they
     were back then. Refetched so exporting the whole project really
     exports the whole project. The workspace that's open keeps its
     unsaved blocks — those come from Blockly, not from here. Another
     version is read from the API anyway, so it costs nothing there. */
  const latest = editingThis
    ? await refreshProjectWorkspaces(project, projectId)
    : project;

  if (editingThis && scope === "project") {
    const exportingWs = getWholeProjectWorkspace(
      latest,
      workspace,
      currentWorkspaceId,
    );

    return {
      exportingWs,
      df: buildProjectDf(latest, workspace, currentWorkspaceId),
      code: await generateWorkspaceCode(latest, exportingWs),
      temporary: true,
    };
  }

  /* Anything else — another version, or another workspace of this one —
     comes from what was saved. */
  const chosen = await workspacesForChoice(
    projectId,
    { versionId, scope },
    {
      activeVersionId: activeVersion?._id,
      projectWorkspaces: latest.workspaces,
    },
  );

  const exportingWs = buildWorkspaceFromData(chosen);

  return {
    exportingWs,
    df: buildDf(chosen, { scope }),
    code: await generateWorkspaceCode(project, exportingWs),
    temporary: true,
  };
}

/** Warns about blocks carrying errors. Resolves false if the user backs out. */
async function confirmDespiteErrors(exportingWs, modalColors) {
  const warnings = exportingWs
    .getAllBlocks(false)
    .filter((block) => block.data?.length)
    .map((block) => ({ id: block.id, messages: block.data }));

  if (!warnings.length) return true;

  const { isConfirmed } = await Swal.fire({
    title: "Errors",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Download Anyway",
    confirmButtonColor: "#e40000",
    html: `
      <p>You have the following errors in your code:</p>
      ${warnings
        .map(
          (warning) => `
          <p class="exportError">
            <span>${titleCase(
              exportingWs.getBlockById(warning.id).type.replaceAll("_", " "),
            )}</span>
            ${warning.messages.map((message) => `<span>${message}</span>`).join("")}
          </p>`,
        )
        .join("")}
    `,
    ...modalColors,
    customClass: { container: "dark", htmlContainer: "exportErrors" },
  });

  return isConfirmed;
}

/** Hands the finished ZIP to the browser. */
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

/**
 * Runs the whole export, start to finish.
 *
 * @returns {Promise<boolean>} whether a file was produced
 */
export default async function exportProject({
  workspace,
  project,
  projectId,
  activeVersion,
  versions,
  currentWorkspaceId,
  blockPacks = [],
  modalColors,
}) {
  await updateCode(workspace, project, currentWorkspaceId);

  const choice = await askWhatToExport({
    activeVersion,
    versions,
    currentWorkspaceId,
    modalColors,
  });

  if (!choice) return false;

  let exported;

  try {
    exported = await resolveExport({
      choice,
      workspace,
      project,
      projectId,
      activeVersion,
      currentWorkspaceId,
    });
  } catch (error) {
    console.error(error);

    await Swal.fire({
      ...modalColors,
      title: "Couldn't export that",
      icon: "error",
      text:
        error.response?.data?.error ||
        "We couldn't read the version you picked. Please reload the page and try again.",
    });

    return false;
  }

  const { exportingWs, df, code, temporary } = exported;

  try {
    if (!(await confirmDespiteErrors(exportingWs, modalColors))) return false;

    const zip = new JSZip();

    const env = [
      `DISFUSE_SECURE_BOT_TOKEN=${project?.botToken || "invalid_token"}`,
      ...(project.secrets ?? []).map((secret) => `${secret.name}=${secret.value}`),
    ].join("\n");

    const dependencies = blockPacks.flatMap((pack) => pack.dependencies || []);

    for (const file of getExportFiles(
      dependencies,
      exportingWs.getAllBlocks(false),
    ))
      zip.file(file.name, file.content);

    zip.file("index.js", await format(code));
    zip.file(".env", env);
    zip.file(`${project.name}.df`, JSON.stringify(df));

    download(
      await zip.generateAsync({ type: "blob" }),
      `${project.name}.zip`,
    );

    Swal.fire({
      toast: true,
      position: "top-right",
      timer: 5000,
      timerProgressBar: true,
      icon: "success",
      title: "Successfully exported",
      showConfirmButton: false,
      ...modalColors,
    });

    return true;
  } finally {
    /* The throwaway workspaces an export builds hold on to an injected
       Blockly instance until they are disposed of. */
    if (temporary) exportingWs.dispose();
  }
}
