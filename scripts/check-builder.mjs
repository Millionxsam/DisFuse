#!/usr/bin/env node
/* =====================================================================
   DisFuse Builder catalog check
   ---------------------------------------------------------------------
   Run:  node scripts/check-builder.mjs              (everything)
         node scripts/check-builder.mjs --module channels
         node scripts/check-builder.mjs --coverage   (coverage table only)

   What it proves, for every event, action, value and component:

     1. the definition is well formed (define.js already throws on the
        worst mistakes; this catches the rest);
     2. its generated JavaScript parses, both with plain typed-in inputs
        and with values placed in every input that takes one;
     3. contexts it requires or provides exist;
     4. every block in the block editor's toolbox is made from an
        element (src/elements), or is a block-only one.

   It also generates a whole sample bot and runs it through Prettier, the
   same formatter the export uses.

   Exit code 1 if anything failed.
   ===================================================================== */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = (p) => pathToFileURL(path.join(root, "src", p)).href;

/* Node warns about package.json lacking "type": "module" for every file;
   it's noise here. */
process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (!String(w?.message).includes("MODULE_TYPELESS_PACKAGE_JSON") && w?.name !== "ExperimentalWarning")
    console.warn(w);
});

const args = process.argv.slice(2);
const onlyModule = args.includes("--module") ? args[args.indexOf("--module") + 1] : null;
const coverageOnly = args.includes("--coverage");
const verbose = args.includes("--verbose");

/* ---------------------------------------------------------------------
   Which toolbox sections each module is responsible for
   --------------------------------------------------------------------- */

export const SLICES = {
  bot_basics: ["Main", "Cooldowns", "Comments"],
  logic_loops: ["Logic", "Loops"],
  text_colours: ["Text", "Colour"],
  math_time: ["Math", "Time"],
  lists_objects_variables: ["Lists", "Objects"],
  code_files_music: ["JavaScript", "Files", "Music"],
  data_dashboard: ["Databases", "Dashboard"],
  events_servers_members: ["Events > Server Actions", "Events > Boosts", "Events > Member Actions"],
  events_messages_misc: [
    "Events > Message Actions",
    "Events > Voice Actions",
    "Events > Thread Actions",
    "Events > Emojis & Stickers",
    "Events > Custom",
  ],
  messages: ["Messages > Message", "Messages > Polls"],
  threads: ["Messages > Threads"],
  components: ["Components"],
  interactions: ["Interactions > Slash", "Interactions > Context Menus"],
  forms: ["Interactions > Modals"],
  servers_webhooks: ["Servers > Server", "Servers > Webhooks"],
  channels: ["Servers > Channels"],
  members: ["Servers > Members"],
  roles_emojis_stickers: ["Servers > Roles", "Servers > Emojis", "Servers > Stickers"],
  apps: [
    "Apps / Utils > Scratch",
    "Apps / Utils > Roblox",
    "Apps / Utils > Minecraft",
    "Apps / Utils > Captcha",
    "Apps / Utils > Fetch",
  ],
  github: ["Apps / Utils > GitHub"],
  canvas: ["Apps / Utils > Canvas"],
  ws_clients: ["Apps / Utils > WebSockets > Frontend (client)", "WebSockets > Frontend (client)"],
  ws_server_ws: ["Apps / Utils > WebSockets > Backend (server) > WebSocket (ws)", "WebSockets > Backend (server) > WebSocket (ws)"],
  ws_server_sio: ["Apps / Utils > WebSockets > Backend (server) > Socket.IO", "WebSockets > Backend (server) > Socket.IO"],
};

function sliceOf(toolboxPath) {
  for (const [module, prefixes] of Object.entries(SLICES))
    if (prefixes.some((prefix) => toolboxPath === prefix || toolboxPath.startsWith(prefix + " >")))
      return module;
  return null;
}

/* ---------------------------------------------------------------------
   The toolbox, read from its own config
   --------------------------------------------------------------------- */

async function toolboxBlocks() {
  const dir = path.join(root, "src/config/toolbox/categories");
  const blocks = new Map();

  const walk = (node, trail) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach((n) => walk(n, trail));
    if (node.kind === "category") {
      (node.contents ?? []).forEach((c) => walk(c, [...trail, node.name]));
      return;
    }
    if (node.kind === "block" && !blocks.has(node.type))
      blocks.set(node.type, trail.join(" > "));
  };

  for (const file of fs.readdirSync(dir).sort()) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    walk(mod.default, []);
  }

  /* The Variables category is built by Blockly at runtime, so its blocks
     never appear in the config. They are part of the job all the same. */
  for (const type of ["variables_get", "variables_set", "math_change"])
    if (!blocks.has(type)) blocks.set(type, "Lists");

  return blocks;
}

/* ---------------------------------------------------------------------
   Sample instances
   --------------------------------------------------------------------- */

const SAMPLE_TEXT = "Hello \"there\" `x` ${y}";
const SAMPLE_VARIABLES = new Map([["var_sample1", "sampleVariable"]]);

function sampleLiteral(inputDef) {
  switch (inputDef.kind) {
    case "text":
      return SAMPLE_TEXT;
    case "number":
      return 3;
    case "boolean":
      return true;
    case "dropdown":
      return inputDef.default ?? inputDef.options?.[0]?.value;
    case "multi":
      return inputDef.options?.slice(0, 2).map((o) => o.value) ?? [];
    case "colour":
      return "#ff0000";
    case "code":
      return inputDef.default || "console.log(1);";
    default:
      return undefined;
  }
}

let sampleCounter = 0;

function sampleRef(accepts) {
  const type = (accepts ?? []).find((t) => t !== null) ?? "any";
  return { kind: "value", type: "__sample", inputs: { t: { literal: String(type) } } };
}

function sampleInputs(inputDefs, catalog, mode, variantIndex = 0, ownerId = null) {
  const inputs = {};
  for (const def of inputDefs ?? []) {
    if (def.kind === "group") {
      inputs[def.key] = {
        literal: [0, 1].map((i) => ({
          id: `g${++sampleCounter}`,
          inputs: sampleInputs(def.fields, catalog, mode, i),
        })),
      };
    } else if (def.kind === "message") {
      inputs[def.key] = { literal: sampleMessage(catalog, mode) };
    } else if (def.kind === "modal") {
      inputs[def.key] = { literal: sampleModal(catalog, mode) };
    } else if (def.kind === "variable") {
      inputs[def.key] = { ref: { kind: "variable", id: "var_sample1" } };
    } else if (mode === "values" && def.provides?.length && ownerId) {
      /* Use the value the input itself provides, the way a user would. */
      inputs[def.key] = { ref: { kind: "input", source: ownerId, input: def.key, key: def.provides[0].key } };
    } else if (mode === "values" && ["text", "number", "boolean", "colour", "slot"].includes(def.kind) && def.allowValues !== false) {
      /* A number placed in a text input exercises the String() conversion. */
      inputs[def.key] = {
        ref: def.kind === "text" && variantIndex % 2 === 0 ? sampleRef(["Number"]) : sampleRef(def.accepts),
      };
    } else if (mode === "empty") {
      /* leave it out: the default is used */
    } else {
      const literal = sampleLiteral(def);
      if (literal !== undefined) inputs[def.key] = { literal };
    }
  }
  return inputs;
}

function sampleComponent(def, catalog, mode, depth = 0) {
  const component = {
    id: `c${++sampleCounter}`,
    type: def.id,
    inputs: sampleInputs(def.fields, catalog, mode),
  };
  if (def.children && depth < 2) {
    const accepted = [...catalog.components.values()].filter(
      (c) => c.family === def.family && c.placement.includes(def.children.accepts),
    );
    component.children = accepted.slice(0, 3).map((child) => sampleComponent(child, catalog, mode, depth + 1));
  }
  return component;
}

function sampleMessage(catalog, mode) {
  const roots = [...catalog.components.values()].filter(
    (c) => c.family === "message" && c.placement.includes("root"),
  );
  return {
    components: roots.map((def) => sampleComponent(def, catalog, mode)),
    files: [{ id: "f1", inputs: { source: { literal: "https://example.com/a.png" }, name: { literal: "a.png" } } }],
  };
}

function sampleModal(catalog, mode) {
  const roots = [...catalog.components.values()].filter(
    (c) => c.family === "modal" && c.placement.includes("modal"),
  );
  return {
    inputs: { title: { literal: "Form" }, customId: { literal: "form" } },
    components: roots.map((def) => sampleComponent(def, catalog, mode)),
  };
}

function sampleAction(def, catalog, mode) {
  const action = {
    id: `a${++sampleCounter}`,
    type: def.id,
    inputs: sampleInputs(def.inputs, catalog, mode, 0, def.id),
    branches: {},
  };
  const uses = (branch) =>
    (branch.provides ?? []).map((value) => ({
      id: `u${++sampleCounter}`,
      type: "__use",
      inputs: { v: { ref: { kind: "branch", action: action.id, branch: branch.key, key: value.key } } },
    }));
  for (const branch of def.branches ?? []) {
    if (branch.repeat)
      action.branches[branch.key] = [0, 1].map((i) => ({
        id: `r${++sampleCounter}`,
        inputs: sampleInputs(branch.inputs, catalog, mode, i),
        actions: uses(branch),
      }));
    else action.branches[branch.key] = uses(branch);
  }
  return action;
}

/* ---------------------------------------------------------------------
   Checks
   --------------------------------------------------------------------- */

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function parses(code) {
  try {
    // eslint-disable-next-line no-new
    new AsyncFunction(code);
    return null;
  } catch (error) {
    return error.message;
  }
}

async function main() {
  const { default: realCatalog, MODULES } = await import(src("builder/catalog/index.js"));
  const { Generator } = await import(src("builder/codegen/context.js"));
  const { generateBot } = await import(src("builder/codegen/generate.js"));
  const { defineValue, defineAction, ANY } = await import(src("builder/catalog/define.js"));

  /* Test-only entries: a value of any type, and a step that uses a value. */
  const sampleValue = defineValue({
    id: "__sample".replace(/^_+/, "sample_x"),
    label: "sample",
    category: "custom",
    output: ANY,
    inputs: [],
    code: () => "__sample",
  });
  const catalog = {
    ...realCatalog,
    values: new Map(realCatalog.values),
    actions: new Map(realCatalog.actions),
  };
  catalog.values.set("__sample", {
    ...sampleValue,
    id: "__sample",
    inputs: [{ kind: "text", key: "t", label: "t", accepts: ["String"], default: "" }],
    code: (ctx) => `__sample_${String(ctx.raw("t")).replace(/\W/g, "")}`,
  });
  catalog.actions.set(
    "__use",
    defineAction({
      id: "use_x",
      label: "use",
      category: "custom",
        inputs: [{ kind: "slot", key: "v", label: "v", accepts: [null] }],
      code: (ctx) => `__use(${ctx.input("v")});`,
    }),
  );

  const problems = [];
  const warnings = [];
  const problem = (module, id, message) => problems.push({ module, id, message });
  const warn = (module, id, message) => warnings.push({ module, id, message });

  const moduleNames = onlyModule ? [onlyModule] : Object.keys(MODULES);
  if (onlyModule && !MODULES[onlyModule]) {
    console.error(`No module called "${onlyModule}". Modules: ${Object.keys(MODULES).join(", ")}`);
    process.exit(1);
  }

  if (realCatalog.duplicates.length)
    for (const dup of realCatalog.duplicates) problem("catalog", dup, "duplicate id");

  /* ---- Coverage -------------------------------------------------- */

  const toolbox = await toolboxBlocks();
  const covered = new Map();
  for (const [moduleName, mod] of Object.entries(MODULES)) {
    for (const list of [mod.events, mod.actions, mod.values, mod.components, mod.blocks])
      for (const entry of list ?? [])
        for (const spec of [...(entry.blockly ?? []), ...(entry.builtins ?? [])])
          covered.set(spec.type, `${moduleName}:${entry.id ?? entry.block}`);
  }
  /* Variables are values in the builder (picked from the value picker), not an element. */
  covered.set("variables_get", "lists_objects_variables:(variables)");

  const coverage = {};
  for (const [type, toolboxPath] of toolbox) {
    const slice = sliceOf(toolboxPath) ?? "(no module)";
    coverage[slice] ??= { total: 0, done: 0, missing: [] };
    coverage[slice].total += 1;
    if (covered.has(type)) coverage[slice].done += 1;
    else coverage[slice].missing.push(`${type}  (${toolboxPath})`);
  }

  const { blockOf } = await import(src("elements/index.js"));
  for (const [type, where] of covered) {
    if (toolbox.has(type) || (blockOf(type) && !blockOf(type).spec.builtin)) continue;
    warn(where.split(":")[0], where.split(":")[1], `has a block "${type}" that isn't a known block type`);
  }

  /* ---- Wording --------------------------------------------------
     The user's rules for anything a person reads: never "Blockly", and
     no em dashes. Checked on every label, description, help line,
     placeholder, dropdown option and provided value. */

  const wordingProblems = (text) => {
    const found = [];
    if (/\u2014/.test(text)) found.push("an em dash (—)");
    if (/blockly/i.test(text)) found.push('the word "Blockly"');
    return found;
  };
  const userText = function* (def) {
    for (const key of ["label", "description", "sentence"]) if (def[key]) yield def[key];
    const inputs = [...(def.inputs ?? []), ...(def.settings ?? []), ...(def.fields ?? [])];
    for (const branch of def.branches ?? []) {
      yield branch.label;
      if (branch.description) yield branch.description;
      if (branch.itemLabel) yield branch.itemLabel;
      inputs.push(...(branch.inputs ?? []));
      for (const value of branch.provides ?? []) yield* [value.label, value.description].filter(Boolean);
    }
    for (const value of def.values ?? []) yield* [value.label, value.description].filter(Boolean);
    const walkInputs = function* (list) {
      for (const item of list) {
        yield* [item.label, item.help, item.placeholder].filter(Boolean);
        for (const option of item.options ?? []) yield option.label;
        for (const value of item.provides ?? []) yield* [value.label, value.description].filter(Boolean);
        if (item.fields) yield* walkInputs(item.fields);
      }
    };
    yield* walkInputs(inputs);
  };
  for (const moduleName of onlyModule ? [onlyModule] : Object.keys(MODULES)) {
    const mod = MODULES[moduleName];
    for (const def of [...(mod.events ?? []), ...(mod.actions ?? []), ...(mod.values ?? []), ...(mod.components ?? [])])
      for (const text of userText(def))
        for (const problemText of wordingProblems(String(text)))
          problem(moduleName, def.id, `user-facing text has ${problemText}: "${text}"`);
  }

  /* ---- Labels ---------------------------------------------------
     Two steps (or two values) with the same name can't be told apart
     in a picker or on a step card. */

  if (!onlyModule)
    for (const [what, list] of [
      ["step", realCatalog.actions],
      ["value", realCatalog.values],
      ["event", realCatalog.events],
    ]) {
      const byLabel = new Map();
      for (const def of list.values()) {
        const key = def.label.trim().toLowerCase();
        byLabel.set(key, [...(byLabel.get(key) ?? []), def.id]);
      }
      for (const ids of byLabel.values())
        if (ids.length > 1) problem("catalog", ids.join(", "), `these ${what}s share the label "${list.get(ids[0]).label}"`);
    }

  /* ---- Icons ----------------------------------------------------
     The site ships its own copy of Font Awesome, so a name from a newer
     version shows nothing at all. */

  const iconCss = fs.readFileSync(path.join(root, "src/components/fontawesome/css/all.css"), "utf8");
  const knownIcons = new Set([...iconCss.matchAll(/\.fa-([a-z0-9-]+)::?before/g)].map((m) => m[1]));
  const iconHelpers = /^(solid|regular|brands|fw|xs|sm|lg|xl|2xl|[1-9]x|spin|pulse|beat|fade|bounce|shake|flip|rotate-(90|180|270)|flip-(horizontal|vertical|both))$/;
  for (const moduleName of onlyModule ? [onlyModule] : Object.keys(MODULES)) {
    const mod = MODULES[moduleName];
    for (const def of [...(mod.events ?? []), ...(mod.actions ?? []), ...(mod.values ?? []), ...(mod.components ?? [])])
      for (const name of String(def.icon ?? "").match(/\bfa-[a-z0-9-]+/g) ?? [])
        if (!iconHelpers.test(name.slice(3)) && !knownIcons.has(name.slice(3))) problem(moduleName, def.id, `icon "${name}" isn't in the site's Font Awesome`);
  }

  if (!coverageOnly) {
    /* ---- Per entry ---------------------------------------------- */

    for (const moduleName of moduleNames) {
      const mod = MODULES[moduleName];
      const allContexts = realCatalog.contexts;

      for (const def of mod.actions ?? []) {
        for (const key of def.requires) if (!allContexts[key]) problem(moduleName, def.id, `requires unknown context "${key}"`);
        for (const branch of def.branches)
          for (const key of branch.contexts ?? []) if (!allContexts[key]) problem(moduleName, def.id, `branch provides unknown context "${key}"`);
        if (!def.description) warn(moduleName, def.id, "no description");

        for (const mode of ["literals", "values", "empty"]) {
          const gen = new Generator(catalog, { project: { _id: "p" }, variables: SAMPLE_VARIABLES });
          const action = sampleAction(def, catalog, mode);
          const scope = gen.scopeFor({ kind: "slash", actions: [action], contexts: ["interaction", "repliable", "showModal", "chatInput", ...def.requires] });
          const code = gen.actionCode(action, scope, def.id);
          /* "Stop repeating" and friends only compile inside a loop. */
          const wrapped = def.requires.includes("loop") ? `for (;;) {\n${code}}` : code;
          const body = `${wrapped}\n${def.setup.map((s) => s.code).join("\n")}`;
          const error = parses(body);
          if (error) problem(moduleName, def.id, `${mode}: generated code doesn't parse: ${error}\n----\n${code}\n----`);
          for (const issue of gen.issues)
            if (!/empty/.test(issue.message)) problem(moduleName, def.id, `${mode}: ${issue.message}`);
          if (verbose && mode === "values") console.log(`--- ${def.id}\n${code}`);
        }
      }

      for (const def of mod.values ?? []) {
        for (const key of def.requires) if (!allContexts[key]) problem(moduleName, def.id, `requires unknown context "${key}"`);
        if (!def.description) warn(moduleName, def.id, "no description");
        for (const mode of ["literals", "values", "empty"]) {
          const gen = new Generator(catalog, { project: { _id: "p" }, variables: SAMPLE_VARIABLES });
          const ref = { kind: "value", type: def.id, inputs: sampleInputs(def.inputs, catalog, mode, 0, def.id) };
          const scope = gen.scopeFor({ kind: "slash", actions: [], contexts: def.requires });
          const { code } = gen.valueCode(ref, scope, def.id);
          const error = parses(`const __x = ${code};\n${def.setup.map((s) => s.code).join("\n")}`);
          if (error) problem(moduleName, def.id, `${mode}: generated expression doesn't parse: ${error}\n----\n${code}\n----`);
          for (const issue of gen.issues) problem(moduleName, def.id, `${mode}: ${issue.message}`);
          if (verbose && mode === "values") console.log(`--- ${def.id}\n${code}`);
        }
      }

      for (const def of mod.components ?? []) {
        for (const mode of ["literals", "values"]) {
          const gen = new Generator(catalog, { project: { _id: "p" }, variables: SAMPLE_VARIABLES });
          const component = sampleComponent(def, catalog, mode);
          const scope = gen.scopeFor({ kind: "slash", actions: [] });
          const code = gen.componentCode(component, scope, def.id);
          const error = parses(`const __x = [${code}];`);
          if (error) problem(moduleName, def.id, `${mode}: generated component doesn't parse: ${error}\n----\n${code}\n----`);
          for (const issue of gen.issues) problem(moduleName, def.id, `${mode}: ${issue.message}`);
          if (def.preview) {
            try {
              /* The same helpers the message builder's preview gives. */
              const p = {
                text: (k) => SAMPLE_TEXT + k,
                display: (k) => SAMPLE_TEXT + k,
                url: () => "https://example.com/a.png",
                raw: (k) => component.inputs?.[k]?.literal,
                colour: () => 0x5865f2,
                emoji: () => ({ name: "👍" }),
                has: () => true,
                children: () => [],
              };
              const out = def.preview(p);
              if (!out || typeof out !== "object") problem(moduleName, def.id, "preview() must return an object");
            } catch (error) {
              problem(moduleName, def.id, `preview() threw: ${error.message}`);
            }
          } else if (def.family === "message") warn(moduleName, def.id, "no preview()");
        }
      }

      for (const def of mod.events ?? []) {
        for (const key of def.provides) if (!allContexts[key]) problem(moduleName, def.id, `provides unknown context "${key}"`);
        if (!def.description) warn(moduleName, def.id, "no description");
        for (const mode of ["literals", "values", "empty"]) {
          const uses = def.values.map((value) => ({
            id: `u${++sampleCounter}`,
            type: "__use",
            inputs: { v: { ref: { kind: "event", key: value.key } } },
          }));
          const builder = {
            commands: [],
            variables: [],
            events: [{ id: "e1", type: def.id, label: "Test", settings: sampleInputs(def.settings, catalog, mode), actions: uses }],
          };
          const { code, issues } = generateBot({ project: { _id: "p", name: "t" }, builder, catalog });
          const error = parses(code);
          if (error) problem(moduleName, def.id, `${mode}: event code doesn't parse: ${error}`);
          for (const issue of issues) problem(moduleName, def.id, `${mode}: ${issue.message}`);
        }
      }
    }

    /* ---- A whole bot, formatted -------------------------------- */

    if (!onlyModule) {
      /* Steps that need a loop ("Stop repeating") go inside one, as they
         would in a real project. */
      const actions = [...realCatalog.actions.values()].map((def) => {
        const action = sampleAction(def, catalog, "literals");
        return def.requires.includes("loop")
          ? { id: `loop_${action.id}`, type: "loop_repeat", inputs: { TIMES: { literal: 1 } }, branches: { DO: [action] } }
          : action;
      });
      const builder = {
        variables: [{ id: "var_sample1", name: "my score" }, { id: "v2", name: "client" }],
        commands: [
          { id: "c1", kind: "slash", name: "ping", description: "Pong", options: [{ id: "o1", type: 3, name: "text", description: "Some text", required: true }], actions },
          {
            id: "c2",
            kind: "slash",
            name: "admin",
            description: "Admin tools",
            defaultMemberPermissions: ["Administrator"],
            contexts: ["Guild"],
            options: [
              { id: "s1", type: 1, name: "info", description: "Info", options: [], actions: [] },
              { id: "g1", type: 2, name: "users", description: "Users", options: [
                { id: "s2", type: 1, name: "ban", description: "Ban", options: [{ id: "o2", type: 6, name: "who", description: "Who", required: true }, { id: "o3", type: 3, name: "reason", description: "Why", autocomplete: true, suggestions: [{ id: "x", name: "Spam", value: "spam" }] }], actions: [] },
              ] },
            ],
          },
          { id: "c3", kind: "user", name: "Say hi", actions: [] },
        ],
        events: [...realCatalog.events.values()].map((def, i) => ({ id: `e${i}`, type: def.id, label: def.label, settings: {}, actions: [] })),
      };
      const { code, dependencies, issues } = generateBot({ project: { _id: "p", name: "Test" }, builder, catalog });
      const error = parses(code);
      if (error) problem("bot", "whole bot", `doesn't parse: ${error}`);
      for (const issue of issues.filter((i) => !/empty/.test(i.message))) warn("bot", issue.where, issue.message);

      try {
        const prettier = (await import("prettier/standalone")).default;
        const babel = (await import("prettier/plugins/babel")).default;
        const estree = (await import("prettier/plugins/estree")).default;
        await prettier.format(code, { plugins: [babel, estree], parser: "babel" });
      } catch (error) {
        problem("bot", "whole bot", `Prettier couldn't format it: ${String(error.message).split("\n")[0]}`);
      }

      if (verbose) console.log(`Dependencies: ${dependencies.join(", ")}`);
      fs.mkdirSync(path.join(root, "node_modules/.cache"), { recursive: true });
      fs.writeFileSync(path.join(root, "node_modules/.cache/builder-sample-bot.js"), code);
    }
  }

  /* ---- Report ------------------------------------------------------ */

  const rows = Object.entries(coverage)
    .filter(([slice]) => !onlyModule || slice === onlyModule)
    .sort(([a], [b]) => a.localeCompare(b));

  console.log("\nCoverage of the block editor's toolbox");
  console.log("--------------------------------------");
  let total = 0;
  let done = 0;
  for (const [slice, row] of rows) {
    total += row.total;
    done += row.done;
    console.log(`${row.done === row.total ? "✔" : "✘"} ${slice.padEnd(26)} ${String(row.done).padStart(3)}/${row.total}`);
    if (row.missing.length && (onlyModule || verbose || rows.length === 1))
      for (const missing of row.missing) console.log(`      missing: ${missing}`);
  }
  console.log(`  ${"total".padEnd(26)} ${String(done).padStart(3)}/${total}`);

  const counts = { events: 0, actions: 0, values: 0, components: 0 };
  for (const name of moduleNames)
    for (const key of Object.keys(counts)) counts[key] += MODULES[name][key]?.length ?? 0;
  console.log(`\nEntries: ${counts.events} events, ${counts.actions} actions, ${counts.values} values, ${counts.components} components`);

  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s)`);
    for (const w of warnings.slice(0, verbose ? Infinity : 40)) console.log(`  ⚠ [${w.module}] ${w.id}: ${w.message}`);
  }

  if (problems.length) {
    console.log(`\n${problems.length} problem(s)`);
    for (const p of problems) console.log(`  ✘ [${p.module}] ${p.id}: ${p.message}`);
    process.exit(1);
  }

  const incomplete = rows.some(([, row]) => row.done < row.total);
  console.log(incomplete ? "\nNo errors, but coverage is incomplete." : "\nAll good.");
  process.exit(incomplete && !coverageOnly ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
