/* =====================================================================
   The block editor's blocks, loaded in Node
   ---------------------------------------------------------------------
   `await loadBlocks()` registers every DisFuse block with a headless
   Blockly (with a jsdom document, which a few blocks need) and returns
   { Blockly, javascriptGenerator }. See ./blocks-loader.mjs for how the
   files are made to load outside Vite.
   ===================================================================== */

import path from "node:path";
import { createRequire, register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(root, "package.json"));

register("./blocks-loader.mjs", import.meta.url);

export async function loadBlocks() {
  /* jsdom comes with Blockly, so it's found from there. */
  const fromBlockly = createRequire(require.resolve("blockly"));
  const { JSDOM } = fromBlockly("jsdom");
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  globalThis.document ??= dom.window.document;
  globalThis.window ??= dom.window;
  globalThis.XMLSerializer ??= dom.window.XMLSerializer;
  globalThis.DOMParser ??= dom.window.DOMParser;
  globalThis.Element ??= dom.window.Element;
  globalThis.Node ??= dom.window.Node;

  const Blockly = require("blockly");
  const { javascriptGenerator } = require("blockly/javascript");

  await import(pathToFileURL(path.join(root, "src/blocks/index.js")).href);

  return { Blockly, javascriptGenerator };
}
