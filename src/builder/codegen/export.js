import JSZip from "jszip";

import { DEFAULT_EXPORT_SETTINGS } from "../../config/exportSettings.js";
import getExportFiles from "../../config/getExportFiles.js";
import insightsCode from "../../functions/insightsCode.js";
import { format } from "../../functions/pretty.js";
import baseCatalog from "../catalog/index.js";
import { validateProject } from "../model/validate.js";
import { generateBot } from "./generate.js";

/* =====================================================================
   DisFuse Builder: exporting
   ---------------------------------------------------------------------
   The same ZIP the block editor exports (Pages/Workspace/editor/
   exportProject.js), with the same files:

     instructions.txt, package.json   from config/getExportFiles.js
     index.js                         the bot, from ./generate.js
     .env                             the bot token and project secrets

   The runtime (Node.js or Bun) and package manager come from the
   owner's Settings → Export, or the project's own export settings.
     <project name>.df                the builder data, as a backup

   Only how index.js is made differs. No dialogs here: the page shows
   its own (prepare, show the problems, then download).
   ===================================================================== */

/**
 * The bot's index.js, formatted, and what it needs.
 * @param {object} [catalog] the project's catalog (with its Workshop packs);
 *   the built-in one when left out
 */
export async function buildBotCode(project, builder, catalog = baseCatalog) {
  const { code, dependencies, issues } = generateBot({
    project,
    builder,
    catalog,
    insights: insightsCode(project),
  });
  return { code: await format(code), dependencies, issues };
}

/**
 * One line of the .env file. dotenv cuts an unquoted value at "#" and
 * trims its spaces, so a value with either (or with quotes or line
 * breaks) goes in quotes it doesn't contain. Single quotes and
 * backticks keep the value exactly as it is.
 */
export function envLine(name, value) {
  const text = String(value ?? "");
  if (/^[^\s#'"`\\]*$/.test(text)) return `${name}=${text}`;
  const quote = ["'", "`", '"'].find((mark) => !text.includes(mark)) ?? "'";
  return `${name}=${quote}${text}${quote}`;
}

/** Bun loads `.env` by itself, so its bots don't need dotenv. */
function codeForRuntime(code, { runtime } = DEFAULT_EXPORT_SETTINGS) {
  if (runtime !== "bun") return code;
  return code.replace(/^\s*require\(["']dotenv["']\)\.config\(\);?[ \t]*\n?/m, "");
}

/**
 * Everything an export needs, before anything is downloaded.
 * @param {object} [exportSettings] { runtime, packageManager }, see config/exportSettings.js
 * @returns {Promise<{ files: Array<{ name, content }>, problems: Array, zipName: string }>}
 */
export async function prepareExport(project, builder, catalog = baseCatalog, exportSettings = DEFAULT_EXPORT_SETTINGS) {
  const built = await buildBotCode(project, builder, catalog);
  const { dependencies, issues } = built;
  const code = codeForRuntime(built.code, exportSettings);

  const problems = [
    ...validateProject(builder, catalog).filter((p) => p.level !== "info"),
    ...issues.map((issue) => ({ level: "error", message: issue.message, where: issue.where })),
  ];

  /* A collaborator who may not see the token gets "[HIDDEN]" in its
     place; the .env then says where theirs goes instead. */
  const token = project?.botToken === "[HIDDEN]" ? "PASTE_THE_BOT_TOKEN_HERE" : project?.botToken || "invalid_token";

  const env = [
    `DISFUSE_SECURE_BOT_TOKEN=${token}`,
    ...(project?.secrets ?? []).map((secret) => envLine(secret.name, secret.value)),
  ].join("\n");

  const backup = {
    disfuseBuilder: 1,
    exported: new Date().toISOString(),
    project: { name: project?.name, id: project?._id },
    builder,
  };

  const files = [
    ...getExportFiles(dependencies, [], exportSettings),
    { name: "index.js", content: code },
    { name: ".env", content: env },
    { name: `${project?.name ?? "bot"}.df`, content: JSON.stringify(backup) },
  ];

  return { files, problems, exportSettings, zipName: `${project?.name ?? "bot"}.zip` };
}

/** Downloads only index.js, for updating a bot that's already set up. */
export function downloadIndexFile(prepared) {
  const file = prepared.files.find((f) => f.name === "index.js");
  saveBlob(new Blob([file?.content ?? ""], { type: "text/javascript" }), "index.js");
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Builds the ZIP and hands it to the browser. */
export async function downloadExport(prepared) {
  const zip = new JSZip();
  for (const file of prepared.files) zip.file(file.name, file.content);

  saveBlob(await zip.generateAsync({ type: "blob" }), prepared.zipName);
}
