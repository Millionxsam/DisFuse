#!/usr/bin/env node
/* =====================================================================
   Block editor runtime check
   ---------------------------------------------------------------------
   Run:  node scripts/check-blocks-runtime.mjs [--json <out.json>] [--compare <before.json>] [--type <blockType>] [--verbose]

   Every toolbox block is put somewhere it can run (inside the event or
   block its restrictions ask for, else "when the bot logs in"), turned
   into a whole bot the way the block editor exports one, and run in the
   sandbox from lib/sandbox.mjs. A bot that doesn't parse, or that looks
   up a name that doesn't exist, is a bug in the block's code.

   --json writes the results; --compare lists what changed against an
   earlier run (only new problems fail the check).
   ===================================================================== */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadBlocks } from "./lib/blocks-node.mjs";
import { makeWorld, run } from "./lib/sandbox.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (p) => pathToFileURL(path.join(root, "src", p)).href;
process.removeAllListeners("warning");

const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const verbose = args.includes("--verbose");
const onlyType = arg("--type");

const { Blockly, javascriptGenerator } = await loadBlocks();
const { restrictions } = await import(src("blocks/lib/restrictions.js"));
const { utilFunctions } = await import(src("blocks/lib/generatorUtils.js"));
const { dashboardHelpers } = await import(src("blocks/lib/dashboardHelpers.js"));
const { timeOfDayHelpers } = await import(src("blocks/lib/timeOfDay.js"));
const { default: packageDependenciesFromBlocks } = await import(src("functions/packageDependenciesFromBlocks.js"));

const fixPackageName = (name = "") => {
  const valid = name.replace(/[-.@/]/g, "_");
  return /^\d/.test(valid) ? "_" + valid : valid;
};

/* Every toolbox entry, with its shadows. */
const entries = [];
const walk = (node) => {
  if (!node) return;
  if (Array.isArray(node)) return node.forEach(walk);
  if (node.kind === "category") return (node.contents ?? []).forEach(walk);
  if (node.kind === "block") entries.push(node);
};
const dir = path.join(root, "src/config/toolbox/categories");
for (const file of fs.readdirSync(dir).sort()) walk((await import(pathToFileURL(path.join(dir, file)).href)).default);

/** Where a block can go: the first block its restrictions ask to be inside. */
function homeOf(type) {
  for (const rule of restrictions[type] ?? [])
    if (["hasHat", "hasParent", "surroundParent"].includes(rule.type) && rule.blockTypes?.length) return { type: rule.blockTypes[0], hat: rule.type === "hasHat" };
  return null;
}

function statementInput(block) {
  return block.inputList.find((input) => input.type === Blockly.inputs.inputTypes.STATEMENT)?.name;
}

/** Puts `child` (block JSON) where it can run; returns the top block's JSON. */
function placed(child, ws, depth = 0) {
  const block = ws.newBlock(child.type);
  const isValue = Boolean(block.outputConnection);
  const isHat = !block.outputConnection && !block.previousConnection;
  block.dispose();
  if (isHat) return child;
  const statement = isValue ? { type: "variables_set", fields: { VAR: { id: "v1" } }, inputs: { VALUE: { block: child } } } : child;
  const home = depth < 3 ? homeOf(child.type) : null;
  if (home && Blockly.Blocks[home.type]) {
    const owner = ws.newBlock(home.type);
    const name = statementInput(owner);
    owner.dispose();
    if (name) return placed({ type: home.type, inputs: { [name]: { block: statement } } }, ws, depth + 1);
  }
  return { type: "main_ready", inputs: { event: { block: statement } } };
}

function botCode(ws) {
  javascriptGenerator.init(ws);
  const code = javascriptGenerator.workspaceToCode(ws);
  const blocks = ws.getAllBlocks(false);
  const imports = packageDependenciesFromBlocks(blocks)
    .map((value) => (value.code ? value.code : `const ${fixPackageName(value)} = require("${value}");`))
    .join("\n");
  return `const Discord = require("discord.js");
let client = new Discord.Client({ intents: Object.values(Discord.GatewayIntentBits) });
const databases = {};
${utilFunctions}
${dashboardHelpers}
${timeOfDayHelpers}
${imports}
${code}`;
}

const results = {};
/* A bot's callbacks can throw after run() has returned. */
let stray = [];
const strayError = (error) => {
  if (error?.name === "ReferenceError") stray.push(`reference: ${error.message}`);
};
process.on("uncaughtException", strayError);
process.on("unhandledRejection", strayError);
const ws = new Blockly.Workspace();
ws.createVariable("sample", "", "v1");
for (const [index, entry] of entries.entries()) {
  if (onlyType && entry.type !== onlyType) continue;
  if (!Blockly.Blocks[entry.type]) continue;
  const key = `${index}:${entry.type}`;
  let code;
  try {
    ws.clear();
    ws.createVariable("sample", "", "v1");
    const { kind, ...json } = entry;
    Blockly.serialization.blocks.append(placed(json, ws), ws);
    code = botCode(ws);
  } catch (error) {
    results[key] = [`generate: ${error.message.replace(/ \(id="[^"]*"\)/g, "").split("\n")[0]}`];
    continue;
  }
  const problems = [];
  try {
    new vm.Script(code.replace(/^\s*await /gm, ""), { filename: "bot.js" });
  } catch (error) {
    if (!/await is only valid/.test(error.message)) problems.push(`syntax: ${error.message}`);
  }
  if (!problems.length) {
    const world = makeWorld();
    stray = [];
    for (const error of await run(code, { process: world.anything() })) problems.push(`reference: ${error.message}`);
    problems.push(...stray);
  }
  results[key] = [...new Set(problems)];
  if (verbose && problems.length) console.log(`--- ${key}\n${problems.join("\n")}\n${code.split(timeOfDayHelpers).pop()}`);
}

const out = arg("--json");
if (out) fs.writeFileSync(out, JSON.stringify(results, null, 1));

/** Keys by block type and how many of that type came before, so new toolbox entries don't move the rest. */
const rekey = (map) => {
  const seen = {};
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => {
      const type = key.replace(/^\d+:/, "");
      seen[type] = (seen[type] ?? 0) + 1;
      return [`${type}#${seen[type]}`, value];
    }),
  );
};
const before = arg("--compare") ? rekey(JSON.parse(fs.readFileSync(arg("--compare"), "utf8"))) : null;
let failed = 0;
for (const [key, problems] of Object.entries(before ? rekey(results) : results)) {
  const old = before?.[key] ?? [];
  const added = problems.filter((p) => !old.includes(p));
  const fixed = old.filter((p) => !problems.includes(p));
  if (added.length) {
    failed++;
    console.log(`✘ ${key}\n    ${added.join("\n    ")}`);
  }
  if (before && fixed.length) console.log(`✔ fixed ${key}: ${fixed.join("; ")}`);
}
const total = Object.values(results).filter((p) => p.length).length;
console.log(`\n${Object.keys(results).length} toolbox blocks run; ${total} with problems; ${failed} ${before ? "new" : ""} failing.`);
process.exit(failed ? 1 : 0);
