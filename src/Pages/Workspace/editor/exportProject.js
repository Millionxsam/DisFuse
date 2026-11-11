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
import { saveWorkspaceState } from "../../../functions/workspaceState.js";
import { executeRestrictions } from "../../../blocks/lib/restrictions";

import { DOCS, docsUrl } from "../../../config/docs.js";

/* =====================================================================
   Export
   ---------------------------------------------------------------------
   A ZIP of the bot's code, plus the `.df` of the blocks it was built
   from, plus a `.env` holding the bot token and the project's secrets.
   Or, with "Download file", just the bot's `index.js` on its own.

   On a Version Control project the dialog asks which version to export
   as well as whether to export all of its workspaces or just one, and
   everything below reads from that version — not from whatever happens
   to be on screen.
   ===================================================================== */

/** Dialogs are SweetAlert HTML, so a docs link here is a plain anchor. */
const docsAnchor = (page, text) =>
  `<a style="color: #ffb648" rel="noopener noreferrer" target="_blank" href="${docsUrl(
    page,
  )}">${text}</a>`;

const HELP_TEXT = `After exporting, extract the ZIP and read instructions.txt if you don't know what to do next. "Download file" downloads only index.js, for updating a bot you already set up.<br /><br />
${docsAnchor(
  DOCS.runningYourBot,
  "Read how to run your bot",
)} — hosting, tokens and what to do with the ZIP — or join our <a style="color: #ffb648" rel="noopener" target="_blank" href="https://discord.gg/Xwx4zkQcmJ">Discord server</a> for help.`;

function titleCase(text) {
  return text.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase(),
  );
}

/**
 * Asks what to export. Resolves to null if the dialog is dismissed.
 * `onlyIndex` is set when "Download file" was picked over "Download ZIP".
 */
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
      showDenyButton: true,
      denyButtonText: "Download file",
      returnInputValueOnDeny: true,
      input: "select",
      inputOptions: {
        project: "Export whole project",
        workspace: "Export current workspace",
      },
      showCancelButton: false,
      html: HELP_TEXT,
      ...modalColors,
      customClass: {
        ...(modalColors?.customClass ?? {}),
        denyButton: "df-swal-neutral",
      },
    });

    if (!result.isConfirmed && !result.isDenied) return null;

    return {
      onlyIndex: result.isDenied,
      versionId: null,
      scope:
        result.value === "project" ? "project" : String(currentWorkspaceId),
    };
  }

  const picked = await pickVersionAndScope({
    versions,
    activeVersionId: activeVersion._id,
    title: "Export Project",
    confirmButtonText: "Download ZIP",
    denyButtonText: "Download file",
    html: HELP_TEXT,
    modalColors,
  });

  if (!picked) return null;

  const { denied, ...choice } = picked;
  return { ...choice, onlyIndex: Boolean(denied) };
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
      df: saveWorkspaceState(workspace),
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

    const code = await generateWorkspaceCode(latest, exportingWs);

    /* The warnings saved with each tab were worked out from that tab
       alone. With every tab together, a block another tab provides (a
       "create database", say) is no longer missing. */
    executeRestrictions(exportingWs);

    return {
      exportingWs,
      df: buildProjectDf(latest, workspace, currentWorkspaceId),
      code,
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

const IGNORED_ERRORS_KEY = "disfuse-ignored-export-errors";

/** Export errors the user chose not to be warned about again. */
function getIgnoredErrors() {
  try {
    const parsed = JSON.parse(localStorage.getItem(IGNORED_ERRORS_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIgnoredErrors(keys) {
  try {
    localStorage.setItem(IGNORED_ERRORS_KEY, JSON.stringify(keys));
  } catch {
    /* Storage is unavailable; the errors just show again next time. */
  }
}

const escapeAttr = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Warns about blocks carrying errors. Resolves false if the user backs out. */
async function confirmDespiteErrors(exportingWs, modalColors) {
  const ignored = new Set(getIgnoredErrors());
  const errorKey = (type, message) => `${type}::${message}`;

  const warnings = exportingWs
    .getAllBlocks(false)
    .filter((block) => block.data?.length)
    .map((block) => ({
      id: block.id,
      type: block.type,
      messages: block.data.filter(
        (message) => !ignored.has(errorKey(block.type, message)),
      ),
    }))
    .filter((warning) => warning.messages.length);

  if (!warnings.length) return true;

  const { isConfirmed, value } = await Swal.fire({
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
            <span>${titleCase(warning.type.replaceAll("_", " "))}</span>
            ${warning.messages
              .map(
                (message) => `
              <span class="exportErrorMessage">
                <span>${message}</span>
                <label class="exportErrorIgnore">
                  <input type="checkbox" data-error-key="${escapeAttr(
                    errorKey(warning.type, message),
                  )}" />
                  Don't show this again
                </label>
              </span>`,
              )
              .join("")}
          </p>`,
        )
        .join("")}
    `,
    ...modalColors,
    preConfirm: () =>
      [
        ...Swal.getHtmlContainer().querySelectorAll(
          "input[data-error-key]:checked",
        ),
      ].map((input) => input.dataset.errorKey),
    customClass: { container: "dark", htmlContainer: "exportErrors" },
  });

  if (isConfirmed && value?.length)
    saveIgnoredErrors([...new Set([...ignored, ...value])]);

  return isConfirmed;
}

/** Hands the finished file to the browser. */
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

/** The full export: code, `.df`, `.env` and the files to run it. */
async function downloadZip({ project, exportingWs, df, code, blockPacks }) {
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

    if (choice.onlyIndex) {
      download(
        new Blob([await format(code)], { type: "text/javascript" }),
        "index.js",
      );
    } else {
      await downloadZip({ project, exportingWs, df, code, blockPacks });
    }

    Swal.fire({
      toast: true,
      position: "top-right",
      timer: 5000,
      timerProgressBar: true,
      icon: "success",
      title: "Successfully exported",
      html: docsAnchor(DOCS.hosting, "Where to host it →"),
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
