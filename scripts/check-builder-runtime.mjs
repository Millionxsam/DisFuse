#!/usr/bin/env node
/* =====================================================================
   DisFuse Builder runtime check
   ---------------------------------------------------------------------
   Run:  node scripts/check-builder-runtime.mjs [--module channels] [--verbose]

   check-builder.mjs proves generated code PARSES. This proves it RUNS
   without referring to things that don't exist where it runs, which is
   the mistake a parser can't see: a step that uses `message` when it
   can be added where there is no message, a branch value whose name
   doesn't match the variable the step declares, a helper that was never
   emitted.

   How: every event, action and value is generated into a small bot, and
   the bot is executed in a sandbox where discord.js, every npm package
   and every Discord object are "anything" objects: any property exists,
   anything can be called, awaited, iterated, compared. Event handlers
   are called the moment they're registered, callbacks passed to
   anything are called too, and every command function is run. Nothing
   touches the network.

   Against objects like that almost nothing can fail, EXCEPT looking up
   a name that isn't declared. So a ReferenceError means a real bug.
   Each action and value is run with only the variables its `requires`
   contexts provide.
   ===================================================================== */

import path from "node:path";
import { makeWorld, run } from "./lib/sandbox.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = (p) => pathToFileURL(path.join(root, "src", p)).href;

process.removeAllListeners("warning");

const args = process.argv.slice(2);
const onlyModule = args.includes("--module") ? args[args.indexOf("--module") + 1] : null;
const verbose = args.includes("--verbose");

/* ---------------------------------------------------------------------
   Sample data (the same shapes check-builder.mjs uses)
   --------------------------------------------------------------------- */

let n = 0;

function sampleInputs(defs, catalog, mode, ownerId) {
  const inputs = {};
  for (const def of defs ?? []) {
    if (def.kind === "group")
      inputs[def.key] = { literal: [{ id: `g${++n}`, inputs: sampleInputs(def.fields, catalog, mode, ownerId) }] };
    else if (def.kind === "message") {
      const roots = [...catalog.components.values()].filter((c) => c.family === "message" && c.placement.includes("root"));
      inputs[def.key] = { literal: { components: roots.map((c) => sampleComponent(c, catalog, mode)), files: [] } };
    } else if (def.kind === "modal") {
      const roots = [...catalog.components.values()].filter((c) => c.family === "modal" && c.placement.includes("modal"));
      inputs[def.key] = { literal: { inputs: { title: { literal: "T" }, customId: { literal: "f" } }, components: roots.map((c) => sampleComponent(c, catalog, mode)) } };
    } else if (def.kind === "variable") inputs[def.key] = { ref: { kind: "variable", id: "var_sample1" } };
    else if (mode === "values" && def.provides?.length && ownerId)
      inputs[def.key] = { ref: { kind: "input", source: ownerId, input: def.key, key: def.provides[0].key } };
    else if (mode === "values" && ["text", "number", "boolean", "colour", "slot"].includes(def.kind) && def.allowValues !== false)
      inputs[def.key] = { ref: { kind: "value", type: "__sample", inputs: {} } };
    else if (def.kind === "dropdown") inputs[def.key] = { literal: def.default ?? def.options?.[0]?.value };
    else if (def.kind === "boolean") inputs[def.key] = { literal: true };
    else if (def.kind === "text") inputs[def.key] = { literal: "text" };
    else if (def.kind === "number") inputs[def.key] = { literal: 2 };
  }
  return inputs;
}

function sampleComponent(def, catalog, mode, depth = 0) {
  const component = { id: `c${++n}`, type: def.id, inputs: sampleInputs(def.fields, catalog, mode) };
  if (def.children && depth < 2)
    component.children = [...catalog.components.values()]
      .filter((c) => c.family === def.family && c.placement.includes(def.children.accepts))
      .slice(0, 2)
      .map((c) => sampleComponent(c, catalog, mode, depth + 1));
  return component;
}

function sampleAction(def, catalog, mode) {
  const action = { id: `a${++n}x`, type: def.id, inputs: sampleInputs(def.inputs, catalog, mode, def.id), branches: {} };
  const uses = (branch) =>
    (branch.provides ?? []).map((value) => ({
      id: `u${++n}`,
      type: "__use",
      inputs: { v: { ref: { kind: "branch", action: action.id, branch: branch.key, key: value.key } } },
    }));
  for (const branch of def.branches ?? [])
    action.branches[branch.key] = branch.repeat
      ? [{ id: `r${++n}`, inputs: sampleInputs(branch.inputs, catalog, mode), actions: uses(branch) }]
      : uses(branch);
  return action;
}

/* ---------------------------------------------------------------------
   Main
   --------------------------------------------------------------------- */

async function main() {
  const { default: realCatalog, MODULES } = await import(src("builder/catalog/index.js"));
  const { generateBot } = await import(src("builder/codegen/generate.js"));
  const { defineAction, defineEvent, defineValue, ANY } = await import(src("builder/catalog/define.js"));

  const catalog = {
    ...realCatalog,
    events: new Map(realCatalog.events),
    actions: new Map(realCatalog.actions),
    values: new Map(realCatalog.values),
  };

  catalog.values.set("__sample", { ...defineValue({ id: "sample_value", label: "s", category: "custom", output: ANY, code: () => "__sample" }), id: "__sample" });
  catalog.actions.set("__use", { ...defineAction({ id: "use_value", label: "u", category: "custom", inputs: [{ kind: "slot", key: "v", label: "v", accepts: [null] }], code: (ctx) => `__use(${ctx.input("v")});` }), id: "__use" });

  const probeFor = (requires) => {
    const vars = [...new Set(requires.map((key) => realCatalog.contexts[key]?.variable).filter(Boolean))];
    return { ...defineEvent({ id: "probe_event", label: "p", category: "custom", listen: '"probe"', params: vars, provides: requires }), id: "__probe" };
  };

  const globals = (anything) => ({ __sample: anything(), __use: () => {} });

  const problems = [];
  let ran = 0;

  const check = async (moduleName, id, builder, probe) => {
    if (probe) catalog.events.set("__probe", probe);
    const { code } = generateBot({ project: { _id: "p", name: "t" }, builder, catalog });
    const world = makeWorld();
    const errors = await run(code, globals(world.anything));
    ran += 1;
    for (const error of errors) {
      const message = error.message;
      if (!problems.some((p) => p.id === id && p.message === message))
        problems.push({ module: moduleName, id, message });
    }
    if (verbose && errors.length) console.log(`--- ${id}\n${code.slice(-1500)}`);
  };

  const variables = [{ id: "var_sample1", name: "sample variable" }];
  const names = onlyModule ? [onlyModule] : Object.keys(MODULES);

  for (const moduleName of names) {
    const mod = MODULES[moduleName];
    if (!mod) {
      console.error(`No module "${moduleName}"`);
      process.exit(1);
    }

    for (const def of mod.actions ?? [])
      for (const mode of ["literals", "values"]) {
        const probe = probeFor(def.requires.filter((key) => key !== "loop"));
        let action = sampleAction(def, catalog, mode);
        /* Steps that need a loop are run inside one. */
        if (def.requires.includes("loop"))
          action = { id: `loop${++n}`, type: "loop_repeat", inputs: { TIMES: { literal: 1 } }, branches: { DO: [action] } };
        await check(moduleName, def.id, {
          variables,
          commands: [],
          events: [{ id: "e1", type: "__probe", label: "", settings: {}, actions: [action] }],
        }, probe);
      }

    for (const def of mod.values ?? [])
      for (const mode of ["literals", "values"]) {
        const probe = probeFor(def.requires);
        await check(moduleName, def.id, {
          variables,
          commands: [],
          events: [{
            id: "e1", type: "__probe", label: "", settings: {},
            actions: [{ id: "u1", type: "__use", inputs: { v: { ref: { kind: "value", type: def.id, inputs: sampleInputs(def.inputs, catalog, mode, def.id) } } } }],
          }],
        }, probe);
      }

    for (const def of mod.events ?? []) {
      const uses = def.values.map((value, i) => ({ id: `u${i}`, type: "__use", inputs: { v: { ref: { kind: "event", key: value.key } } } }));
      /* Every action that fits this event, too: catches events that
         claim a context without declaring the variable behind it. */
      const fitting = [...realCatalog.actions.values()]
        .filter((a) => a.requires.length && a.requires.every((key) => def.provides.includes(key)))
        .slice(0, 40)
        .map((a) => sampleAction(a, catalog, "literals"));
      await check(moduleName, def.id, {
        variables,
        commands: [],
        events: [{ id: "e1", type: def.id, label: "", settings: sampleInputs(def.settings, catalog, "literals"), actions: [...uses, ...fitting] }],
      });
    }
  }

  /* Commands: every action that needs a command context, run in a command. */
  if (!onlyModule) {
    const commandActions = [...realCatalog.actions.values()]
      .filter((a) => a.requires.every((key) => ["interaction", "repliable", "showModal", "chatInput"].includes(key)))
      .map((a) => sampleAction(a, catalog, "literals"));
    await check("commands", "slash command flow", {
      variables,
      events: [],
      commands: [{ id: "c1", kind: "slash", name: "t", description: "t", options: [{ id: "o1", type: 3, name: "x", description: "x" }], actions: [
        ...commandActions,
        { id: "uo", type: "__use", inputs: { v: { ref: { kind: "option", id: "o1" } } } },
      ] }],
    });
  }

  console.log(`\nRan ${ran} generated bots.`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s): names used where they don't exist`);
    for (const p of problems) console.log(`  ✘ [${p.module}] ${p.id}: ${p.message}`);
    process.exit(1);
  }
  console.log("No undefined names. All good.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
