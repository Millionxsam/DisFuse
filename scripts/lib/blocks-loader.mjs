/* =====================================================================
   Loading the block editor's block files in Node
   ---------------------------------------------------------------------
   The files under src/blocks are written for Vite: they import
   "blockly" as an ES module, leave off file extensions, and include a
   couple of TypeScript files. This loader hook (registered by
   ./blocks-node.mjs) makes plain Node accept them:

     - "blockly", "blockly/core" and "blockly/javascript" resolve to
       small ES module wrappers around Blockly's CommonJS build, so
       `import * as Blockly from "blockly"` sees the same Blockly the
       rest of the run uses;
     - relative imports without an extension find the .js / .ts file;
     - `import.meta.glob(...)` (Vite only) is dropped.
   ===================================================================== */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(root, "package.json"));

const SHIMS = { blockly: "blockly", "blockly/core": "blockly", "blockly/javascript": "blockly/javascript" };

function shimSource(specifier) {
  const target = SHIMS[specifier];
  const keys = Object.keys(require(target)).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k) && k !== "default");
  return `import { createRequire } from "node:module";
const require = createRequire(${JSON.stringify(path.join(root, "package.json"))});
const lib = require(${JSON.stringify(target)});
export default lib;
${keys.map((k) => `export const ${k} = lib.${k};`).join("\n")}`;
}

export async function resolve(specifier, context, next) {
  if (SHIMS[specifier]) return { url: `disfuse-shim:${specifier}`, shortCircuit: true };
  if (/\.(css|svg|png|json)\?raw$|\.(css|svg|png)$/.test(specifier))
    return { url: "data:text/javascript,export default {}", shortCircuit: true };
  if ((specifier.startsWith(".") || specifier.startsWith("/")) && context.parentURL?.startsWith("file:")) {
    const base = specifier.startsWith("/") && !fs.existsSync(specifier)
      ? path.join(root, specifier)
      : path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    for (const ext of ["", ".js", ".ts", ".jsx", "/index.js"]) {
      const candidate = base + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith("disfuse-shim:"))
    return { format: "module", source: shimSource(url.slice("disfuse-shim:".length)), shortCircuit: true };
  if (url.startsWith("file:") && url.startsWith(pathToFileURL(path.join(root, "src")).href)) {
    const file = fileURLToPath(url);
    if (file.endsWith(".ts")) return next(url, { ...context, format: "module-typescript" });
    if (file.endsWith(".js")) {
      const source = fs.readFileSync(file, "utf8").replace(/import\.meta\.glob\([\s\S]*?\);/g, "");
      return { format: "module", source, shortCircuit: true };
    }
  }
  return next(url, context);
}
