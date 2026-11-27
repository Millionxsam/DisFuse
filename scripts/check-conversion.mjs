#!/usr/bin/env node
/* =====================================================================
   Block editor → DisFuse Builder conversion check
   ---------------------------------------------------------------------
   Run:  node scripts/check-conversion.mjs [--verbose] [--type <blockType>]

   Converts a sample block editor project made of every block in the
   toolbox (each placed where it would really be used: event values
   inside their event, everything else inside "when the bot logs in"),
   plus a few hand-written projects for the parts that work differently
   (commands, buttons, functions, old messages). Then it checks that:

     1. the conversion doesn't throw;
     2. the result imports into an empty builder with the same
        `importTemplate` operation the API runs, so it would save;
     3. the bot generated from it parses, and the generator didn't meet
        anything it doesn't know;
     4. the hand-written projects come out the way they should.

   It prints which blocks have nothing like them in the builder, and
   which steps lost something on the way, for a person to look over.

   Exit code 1 if anything failed.
   ===================================================================== */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadBlocks } from "./lib/blocks-node.mjs";
import { createToolboxProject } from "./lib/toolbox-project.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = (p) => pathToFileURL(path.join(root, "src", p)).href;

process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (!String(w?.message).includes("MODULE_TYPELESS_PACKAGE_JSON") && w?.name !== "ExperimentalWarning") console.warn(w);
});

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const onlyType = args.includes("--type") ? args[args.indexOf("--type") + 1] : null;

const { Blockly, javascriptGenerator } = await loadBlocks();
const { default: catalog } = await import(src("builder/catalog/index.js"));
const { convertBlockProject } = await import(src("builder/convert/fromBlocks.js"));
const { createBlockAdapter } = await import(src("Pages/Workspace/editor/blockAdapter.js"));
const { applyOp, emptyBuilder, OpError } = await import(src("builder/model/ops.js"));
const { generateBot } = await import(src("builder/codegen/generate.js"));

const PACK_TYPES = new Set(["test_pack_block", "test_pack_value"]);
Blockly.Blocks.test_pack_block = {
  init() {
    this.appendStatementInput("DO");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  },
};
Blockly.Blocks.test_pack_value = {
  init() {
    this.setOutput(true);
  },
};

const blocks = createBlockAdapter({
  Blockly,
  javascriptGenerator,
  blockSource: (type) => ({ kind: PACK_TYPES.has(type) ? "pack" : Blockly.Blocks[type] ? "builtin" : "missing" }),
});

const problems = [];
const problem = (where, message) => problems.push(`${where}: ${message}`);

/* ---------------------------------------------------------------------
   Running a conversion and checking what comes out
   --------------------------------------------------------------------- */

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function convertAndCheck(name, workspaces, { allowIssues = /./ } = {}) {
  let result;
  const trace = [];
  try {
    result = convertBlockProject({ workspaces, catalog, blocks, trace });
  } catch (error) {
    problem(name, `conversion threw: ${error.stack}`);
    return null;
  }

  try {
    applyOp(emptyBuilder(), "importTemplate", { content: result.builder });
  } catch (error) {
    problem(name, `the API would refuse it: ${error instanceof OpError ? error.message : error.stack}`);
  }

  const { code, issues } = generateBot({ project: { _id: "p", name }, builder: result.builder, catalog });
  try {
    new AsyncFunction(code);
  } catch (error) {
    problem(name, `the generated bot doesn't parse: ${error.message}`);
    if (verbose) fs.writeFileSync(path.join(root, "node_modules/.cache/conversion-broken.js"), code);
  }
  for (const issue of issues)
    if (!allowIssues.test(issue.message) || /Unknown|deleted|different event|only available/.test(issue.message))
      problem(name, `generator: ${issue.where}: ${issue.message}`);

  return { ...result, code, trace };
}

const { toolboxProject, chain, withIds, shapeOfSafe, byBlock, typesOf } = createToolboxProject({ Blockly, catalog, root });

/* ---------------------------------------------------------------------
   Hand-written projects
   --------------------------------------------------------------------- */

const text = (t) => ({ type: "text", fields: { TEXT: t } });
const reply = (t) => ({
  type: "cv2_replyInteraction",
  inputs: { components: { block: { type: "cv2_textDisplay", inputs: { content: { block: text(t) } } } } },
});
const nameIs = (reader, value) => ({
  type: "logic_compare",
  fields: { OP: "EQ" },
  inputs: { A: { block: { type: reader } }, B: { block: text(value) } },
});
const ws = (name, tops, variables = []) => ({ name, data: JSON.stringify({ blocks: { blocks: tops.map(withIds) }, variables }) });

function expect(name, condition, message) {
  if (!condition) problem(name, message);
}

function scenarios() {
  /* Commands: declared in one workspace, handled in another. */
  {
    const name = "commands";
    const declare = {
      type: "misc_createcontainer_global",
      inputs: {
        code: {
          block: chain([
            {
              type: "slash_create_mutator",
              inputs: {
                name: { block: text("ping") },
                dsc: { block: text("Pong!") },
                options: {
                  block: {
                    type: "slash_addoption",
                    fields: { type: "3" },
                    inputs: { name: { block: text("text") }, dsc: { block: text("Say something") }, required: { block: { type: "logic_boolean", fields: { BOOL: "TRUE" } } } },
                  },
                },
              },
            },
            {
              type: "slash_create_mutator",
              inputs: {
                name: { block: text("admin") },
                dsc: { block: text("Admin tools") },
                options: {
                  block: chain([
                    { type: "slash_addsubcommand", inputs: { name: { block: text("ban") }, dsc: { block: text("Ban someone") } } },
                    { type: "slash_addsubcommand", inputs: { name: { block: text("kick") }, dsc: { block: text("Kick someone") } } },
                  ]),
                },
              },
            },
            { type: "contextMenu_create", fields: { type: "Discord.ApplicationCommandType.User" }, inputs: { name: { block: text("Say hi") } } },
          ]),
        },
      },
    };
    const handler = {
      type: "slash_received",
      inputs: {
        event: {
          block: chain([
            { type: "javascript_consolelog", inputs: { log: { block: text("any command") } } },
            {
              type: "controls_if",
              extraState: { elseIfCount: 1, hasElse: true },
              inputs: {
                IF0: { block: nameIs("slash_name", "ping") },
                DO0: {
                  block: {
                    type: "cv2_replyInteraction",
                    inputs: {
                      components: {
                        block: {
                          type: "cv2_textDisplay",
                          inputs: { content: { block: { type: "slash_getoption", fields: { type: "String" }, inputs: { name: { block: text("text") } } } } },
                        },
                      },
                    },
                  },
                },
                IF1: { block: nameIs("slash_name", "admin") },
                DO1: {
                  block: {
                    type: "controls_if",
                    inputs: {
                      IF0: {
                        block: {
                          type: "logic_compare",
                          fields: { OP: "EQ" },
                          inputs: { A: { block: { type: "slash_getoption", fields: { type: "Subcommand" }, inputs: { name: { block: text("") } } } }, B: { block: text("ban") } },
                        },
                      },
                      DO0: { block: reply("banned") },
                    },
                  },
                },
                ELSE: { block: reply("unknown command") },
              },
            },
          ]),
        },
      },
    };
    const menu = {
      type: "contextMenu_received",
      inputs: { event: { block: { type: "controls_if", inputs: { IF0: { block: nameIs("contextMenu_name", "Say hi") }, DO0: { block: reply("hi") } } } } },
    };
    const result = convertAndCheck(name, [ws("setup", [{ type: "main_ready", inputs: { event: { block: declare } } }]), ws("handlers", [handler, menu])]);
    if (result) {
      const { commands, events } = result.builder;
      const ping = commands.find((c) => c.name === "ping");
      const admin = commands.find((c) => c.name === "admin");
      const hi = commands.find((c) => c.name === "Say hi");
      expect(name, ping && admin && hi, `expected ping, admin and "Say hi", got ${commands.map((c) => c.name).join(", ")}`);
      expect(name, ping?.options?.[0]?.name === "text" && ping.options[0].required === true, "ping should have a required text option");
      expect(name, ping?.actions?.map((a) => a.type).join() === "code_console_log,interaction_reply" || ping?.actions?.length === 2, `ping steps: ${ping?.actions?.map((a) => a.type)}`);
      const pingReply = ping?.actions?.find((a) => a.type === "interaction_reply");
      const content = pingReply?.inputs?.content?.literal?.components?.[0]?.inputs?.content;
      expect(name, content?.ref?.kind === "option" && content.ref.id === ping?.options?.[0]?.id, `ping's reply should read the text option, got ${JSON.stringify(content)}`);
      const ban = admin?.options?.find((o) => o.name === "ban");
      const kick = admin?.options?.find((o) => o.name === "kick");
      expect(name, ban?.actions?.some((a) => a.type === "interaction_reply"), "admin ban should reply");
      expect(name, kick && !kick.actions.some((a) => a.type === "interaction_reply"), "admin kick shouldn't reply");
      expect(name, hi?.actions?.length === 1, `"Say hi" should have its reply, got ${hi?.actions?.length}`);
      const rest = events.filter((e) => e.type === "slash_command_used");
      expect(name, rest.length === 1, `expected one leftover slash command event, got ${rest.length}`);
      expect(name, events.filter((e) => e.type === "context_menu_used").length === 0, "nothing should be left of the right-click handler");
      if (verbose) console.log(JSON.stringify(result.builder, null, 1).slice(0, 6000));
    }
  }

  /* Buttons: one event per ID, plus what runs for every other button. */
  {
    const name = "buttons";
    const hat = {
      type: "buttons_event",
      inputs: {
        event: {
          block: {
            type: "controls_if",
            extraState: { elseIfCount: 1 },
            inputs: {
              IF0: { block: nameIs("buttons_id", "yes") },
              DO0: { block: reply("yes!") },
              IF1: { block: nameIs("buttons_id", "no") },
              DO1: { block: reply("no!") },
            },
          },
        },
      },
    };
    const result = convertAndCheck(name, [ws("main", [hat])]);
    if (result) {
      const ids = result.builder.events.map((e) => e.settings?.filterId?.literal).sort();
      expect(name, JSON.stringify(ids) === '["no","yes"]', `expected events for "no" and "yes", got ${JSON.stringify(ids)}`);
    }
  }

  /* Functions, pack blocks, loops, variables and an old reply with an embed. */
  {
    const name = "misc";
    const def = {
      type: "procedures_defnoreturn",
      fields: { NAME: "greet" },
      extraState: { params: [{ name: "who", id: "var_who" }] },
      inputs: { STACK: { block: { type: "javascript_consolelog", inputs: { log: { block: { type: "variables_get", fields: { VAR: { id: "var_who" } } } } } } } },
    };
    const body = chain([
      { type: "procedures_callnoreturn", extraState: { name: "greet", params: ["who"] }, inputs: { ARG0: { block: text("world") } } },
      { type: "test_pack_block", inputs: { DO: { block: { type: "javascript_consolelog", inputs: { log: { block: text("inside pack") } } } } } },
      { type: "javascript_consolelog", inputs: { log: { block: { type: "test_pack_value" } } } },
      {
        type: "controls_forEach",
        fields: { VAR: { id: "var_item" } },
        inputs: {
          LIST: { block: { type: "lists_create_with", extraState: { itemCount: 2 }, inputs: { ADD0: { block: text("a") }, ADD1: { block: text("b") } } } },
          DO: { block: { type: "javascript_consolelog", inputs: { log: { block: { type: "variables_get", fields: { VAR: { id: "var_item" } } } } } } },
        },
      },
      { type: "embed_create", fields: { name: "info" }, inputs: { config: { block: chain([{ type: "embed_settitle", inputs: { value: { block: text("Title") } } }, { type: "embed_setdsc", inputs: { value: { block: { type: "msg_content" } } } }]) } } },
      { type: "msg_reply", inputs: { content: { block: text("hello") }, embeds: { block: text("info") } } },
      {
        type: "variables_set",
        fields: { VAR: { id: "var_item" } },
        inputs: {
          VALUE: {
            block: {
              type: "list_filter",
              inputs: {
                list: { block: { type: "variables_get", fields: { VAR: { id: "var_item" } } } },
                method: { block: { type: "logic_compare", fields: { OP: "EQ" }, inputs: { A: { block: { type: "list_filter_item" } }, B: { block: text("a") } } } },
              },
            },
          },
        },
      },
    ]);
    const result = convertAndCheck(name, [
      ws("main", [def, { type: "msg_received", inputs: { event: { block: body } } }], [
        { id: "var_who", name: "who" },
        { id: "var_item", name: "item" },
      ]),
    ]);
    if (result) {
      const event = result.builder.events[0];
      const types = event?.actions?.map((a) => a.type) ?? [];
      expect(name, event?.type === "message_sent" && event.settings?.ignoreBots?.literal === false, "msg_received should become message_sent that doesn't ignore bots");
      expect(name, JSON.stringify(types) === JSON.stringify(["variable_set", "console_log", "console_log", "loop_each", "message_reply", "variable_set"]), `steps: ${types}`);
      const loop = event?.actions?.find((a) => a.type === "loop_each");
      const read = loop?.branches?.DO?.[0]?.inputs?.log?.ref;
      expect(name, read?.kind === "branch" && read.action === loop.id && read.key === "item", `the loop should read its own item, got ${JSON.stringify(read)}`);
      const message = event?.actions?.find((a) => a.type === "message_reply")?.inputs?.content?.literal;
      expect(name, message?.components?.length === 2 && message.components[1].type === "msg_container", `the reply should have its text and the embed as a container, got ${JSON.stringify(message?.components?.map((c) => c.type))}`);
      const description = message?.components?.[1]?.children?.[1]?.inputs?.content?.ref;
      expect(name, description?.kind === "event" && description.key === "content", `the embed's description should read the message text, got ${JSON.stringify(description)}`);
      const filter = event?.actions?.at(-1)?.inputs?.VALUE?.ref;
      const current = filter?.inputs?.method?.ref?.inputs?.A?.ref;
      expect(name, filter?.type === "list_filter" && current?.kind === "input" && current.key === "item", `the filter should read its current item, got ${JSON.stringify(current)}`);
      expect(name, result.report.packBlocks === 4, `expected 4 pack blocks left out, got ${result.report.packBlocks}`);
    }
  }
}

/* ---------------------------------------------------------------------
   Values that belong to an event or a step, used inside it
   --------------------------------------------------------------------- */

/**
 * Every block the catalog says becomes a value of an event (or of a
 * step's section), placed inside that event or step the way a person
 * would, must come out as a reference to it.
 */
function providedValues() {
  const workspace = new Blockly.Workspace();
  let checked = 0;

  const make = (type) => {
    const block = workspace.newBlock(type);
    if (block.settings_ && block.update_) {
      for (const key of Object.keys(block.settings_)) block.settings_[key] = true;
      block.update_();
    }
    return block;
  };
  const use = (valueType) => {
    const set = workspace.newBlock("variables_set");
    const value = workspace.newBlock(valueType);
    set.getInput("VALUE").connection.connect(value.outputConnection);
    return set;
  };
  const refIn = (builder) => {
    const refs = [];
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== "object") return;
      if (node.type === "variable_set" && node.inputs?.VALUE?.ref) refs.push(node.inputs.VALUE.ref);
      Object.values(node).forEach(visit);
    };
    visit(builder.events);
    return refs;
  };
  const run = (name, top, expectKind) => {
    const data = JSON.stringify({ blocks: { blocks: [Blockly.serialization.blocks.save(top)] }, variables: workspace.getAllVariables().map((v) => ({ id: v.getId(), name: v.name })) });
    const result = convertAndCheck(name, [{ name, data }], { allowIssues: /./ });
    checked += 1;
    const refs = result ? refIn(result.builder) : [];
    if (!refs.length || refs.some((ref) => ref.kind !== expectKind)) problem(name, `expected a value of the ${expectKind === "event" ? "event" : "step"}, got ${JSON.stringify(refs)}`);
    top.dispose();
  };

  for (const def of catalog.events.values()) {
    const hatType = typesOf(def).find((t) => Blockly.Blocks[t] && !shapeOfSafe(t)?.output && !shapeOfSafe(t)?.previous);
    if (!hatType) continue;
    for (const type of typesOf(def)) {
      if (type === hatType || !Blockly.Blocks[type] || byBlock.values.has(type) || !shapeOfSafe(type)?.output) continue;
      const hat = make(hatType);
      const body = hat.inputList.find((i) => i.type === 3);
      body.connection.connect(use(type).previousConnection);
      run(`${def.id} ← ${type}`, hat, "event");
    }
  }

  for (const def of catalog.actions.values()) {
    if (!def.branches.some((b) => b.provides?.length) && !def.inputs.some((i) => i.provides?.length)) continue;
    const ownerType = typesOf(def).find((t) => Blockly.Blocks[t] && shapeOfSafe(t)?.previous);
    if (!ownerType) continue;
    const inputProvided = def.inputs.flatMap((i) => i.provides ?? []);
    for (const type of typesOf(def)) {
      if (type === ownerType || !Blockly.Blocks[type] || byBlock.values.has(type) || !shapeOfSafe(type)?.output) continue;
      /* Values an input provides are used inside that input; see the "misc" project. */
      const code = blocks.code({ type });
      if (inputProvided.some((p) => p.code === code)) continue;
      const owner = make(ownerType);
      const section = owner.inputList.find((i) => i.type === 3 && def.branches.some((b) => b.provides?.length && b.key.toLowerCase() === i.name.toLowerCase())) ?? owner.inputList.find((i) => i.type === 3);
      if (!section) continue;
      section.connection.connect(use(type).previousConnection);
      const hat = workspace.newBlock("main_ready");
      hat.getInput("event").connection.connect(owner.previousConnection);
      run(`${def.id} ← ${type}`, hat, "branch");
    }
  }
  workspace.dispose();
  return checked;
}

/* ---------------------------------------------------------------------
   Report
   --------------------------------------------------------------------- */

const result = convertAndCheck("toolbox", await toolboxProject(onlyType), { allowIssues: /empty|Pick a variable/ });
if (!onlyType) {
  scenarios();
  console.log(`Checked ${providedValues()} event and step values used where they belong.`);
}

if (result) {
  const { report, builder } = result;
  const steps = builder.events.reduce((n, e) => n + JSON.stringify(e.actions).split('"type"').length - 1, 0);
  console.log(`\nToolbox project: ${report.blocks} blocks → ${builder.events.length} events, ${builder.commands.length} commands, ~${steps} steps and values`);
  const list = (title, map) => {
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return;
    console.log(`\n${title} (${entries.length})`);
    for (const [label, count] of entries) console.log(`  ${count > 1 ? `${count}× ` : ""}${label}`);
  };
  list("Nothing like these in the builder", report.unsupported);
  list("Converted, but something was lost", report.partial);
  if (verbose || onlyType) {
    const byType = {};
    for (const entry of result.trace) (byType[`${entry.type}: ${entry.what}`] ??= 0), (byType[`${entry.type}: ${entry.what}`] += 1);
    list("Trace", byType);
  }
  if (report.notes.length) {
    console.log(`\nNotes (${report.notes.length})`);
    for (const note of report.notes.slice(0, verbose ? Infinity : 30)) console.log(`  - ${note}`);
  }
  if (onlyType || verbose) console.log(JSON.stringify(builder.events, null, 1).slice(0, verbose ? 200000 : 8000));
}

blocks.dispose();

if (problems.length) {
  console.log(`\n${problems.length} problem(s)`);
  for (const p of problems) console.log(`  ✘ ${p}`);
  process.exit(1);
}
console.log("\nAll good.");
