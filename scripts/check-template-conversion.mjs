#!/usr/bin/env node
/* =====================================================================
   Templates and packs in either kind of project
   ---------------------------------------------------------------------
   Run:  node scripts/check-template-conversion.mjs [--verbose]

   Every template and Workshop pack works in every project, whichever
   editor made it. This checks the parts that make that true:

     1. DisFuse Builder → blocks (builder/convert/toBlocks.js): every step
        of the toolbox project (see ./lib/toolbox-project.mjs, converted
        to the builder first) becomes blocks that load in Blockly. Each
        is either real blocks that convert back to the same step, or a
        code block; the split is printed.
     2. A hand-written template with commands, subcommands, a right-click
        command, a button event, if/else, a loop and a variable comes out
        as real blocks, and the bot made from them parses.
     3. A flow with no blocks like it becomes code blocks that still
        declare the template's variables, and the bot parses.
     4. Packs: a block pack's blocks work as builder steps
        (catalog/blockPacks.js), a builder pack's items as blocks
        (Pages/Workspace/editor/builderPackBlocks.js), and a project
        using both goes blocks → builder → blocks still using the same
        packs, with both editors writing the same code for them.

   Run it after changing anything under `catalog/`, `convert/` or the
   pack files. Exit code 1 if anything failed.
   ===================================================================== */

import path from "node:path";
import { createRequire } from "node:module";
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

const verbose = process.argv.includes("--verbose");

const { Blockly, javascriptGenerator } = await loadBlocks();
const { Order } = createRequire(path.join(root, "package.json"))("blockly/javascript");
const { default: baseCatalog } = await import(src("builder/catalog/index.js"));
const { catalogWithPacks } = await import(src("builder/catalog/packs.js"));
const { convertBlockProject } = await import(src("builder/convert/fromBlocks.js"));
const { convertBuilderToBlocks } = await import(src("builder/convert/toBlocks.js"));
const { applyOp, emptyBuilder } = await import(src("builder/model/ops.js"));
const { generateBot } = await import(src("builder/codegen/generate.js"));
const { createBlockAdapter } = await import(src("Pages/Workspace/editor/blockAdapter.js"));
const { createBuilderPackBlocks } = await import(src("Pages/Workspace/editor/builderPackBlocks.js"));
const { default: registerCustomBlocks } = await import(src("blocks/lib/registerCustomBlocks.js"));
const { blockSource, markPackBlocks } = await import(src("functions/templateBlocks.js"));

const problems = [];
const problem = (where, message) => problems.push(`${where}: ${message}`);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const blocks = createBlockAdapter({ Blockly, javascriptGenerator, blockSource });

/** Loads converted blocks into Blockly and returns the code they write. */
function blockCode(data) {
  const workspace = new Blockly.Workspace();
  try {
    Blockly.serialization.workspaces.load(data, workspace);
    return javascriptGenerator.workspaceToCode(workspace);
  } finally {
    workspace.dispose();
  }
}

function parses(code) {
  try {
    new AsyncFunction(code);
    return null;
  } catch (error) {
    return error.message;
  }
}

/* ---------------------------------------------------------------------
   1. Every toolbox step, one at a time
   --------------------------------------------------------------------- */

{
  const { toolboxProject } = createToolboxProject({ Blockly, catalog: baseCatalog, root });
  const { builder } = convertBlockProject({ workspaces: await toolboxProject(), catalog: baseCatalog, blocks });
  let native = 0;
  const asCode = new Map();

  for (const event of builder.events)
    for (const action of event.actions) {
      const content = { commands: [], variables: builder.variables, events: [{ ...event, actions: [action] }] };
      try {
        const { data, report } = convertBuilderToBlocks({ content, catalog: baseCatalog, blocks });
        if (report.native.length) native += 1;
        else asCode.set(action.type, (asCode.get(action.type) ?? 0) + 1);
        blockCode(data);
      } catch (error) {
        problem(`toolbox step ${action.type}`, error.message.split("\n")[0]);
      }
    }

  const total = native + [...asCode.values()].reduce((a, b) => a + b, 0);
  console.log(`Toolbox steps as blocks: ${native}/${total} (the rest become code blocks)`);
  if (verbose) for (const [type, count] of asCode) console.log(`  code: ${type}${count > 1 ? ` ×${count}` : ""}`);
}

/* ---------------------------------------------------------------------
   2. A template that should be blocks all the way
   --------------------------------------------------------------------- */

const option = (id, type, name, extra = {}) => ({
  id, type, name, description: name, required: false, choices: [], channelTypes: [], minValue: null, maxValue: null,
  minLength: null, maxLength: null, autocomplete: false, suggestions: [], nameLocalizations: {}, descriptionLocalizations: {}, ...extra,
});
const command = (id, name, extra = {}) => ({
  id, kind: "slash", name, description: name, nsfw: false, defaultMemberPermissions: [], contexts: ["Guild", "BotDM"],
  integrationTypes: ["GuildInstall"], nameLocalizations: {}, descriptionLocalizations: {}, options: [], actions: [], ...extra,
});
const log = (id, ref) => ({ id, type: "console_log", inputs: { log: { ref } }, branches: {} });

const fullTemplate = {
  variables: [{ id: "varcoins0001", name: "coins" }],
  commands: [
    command("cmdping00001", "ping", {
      actions: [
        {
          id: "actreply0001",
          type: "interaction_reply",
          inputs: {
            content: {
              literal: {
                components: [
                  { id: "cmptext00001", type: "msg_text", inputs: { content: { literal: "Pong!" } } },
                  { id: "cmprow000001", type: "msg_row", inputs: {}, children: [{ id: "cmpbtn000001", type: "msg_button", inputs: { label: { literal: "Again" }, id: { literal: "again" } } }] },
                ],
                files: [],
              },
            },
            ephemeral: { literal: true },
          },
          branches: {},
        },
      ],
    }),
    command("cmdmod000001", "mod", {
      defaultMemberPermissions: ["KickMembers"],
      options: [
        { ...option("subkick00001", 1, "kick"), options: [option("optuser00001", 6, "user", { required: true })], actions: [log("actlog000001", { kind: "option", id: "optuser00001" })] },
        {
          ...option("grpcfg000001", 2, "config"),
          options: [
            {
              ...option("subshow00001", 1, "show"),
              options: [option("optlvl000001", 4, "level", { choices: [{ id: "chone0000001", name: "One", value: 1 }] })],
              actions: [log("actlog000002", { kind: "option", id: "optlvl000001" })],
            },
          ],
        },
      ],
    }),
    { ...command("cmdmenu00001", "Wave"), kind: "user", actions: [log("actlog000003", { kind: "value", type: "interaction_user" })] },
  ],
  events: [
    {
      id: "evtbtn000001", type: "button_clicked", label: "Again button", enabled: true,
      settings: { filterId: { literal: "again" }, filterMode: { literal: "equals" } },
      actions: [log("actlog000004", { kind: "event", key: "id" })],
    },
    {
      id: "evtmsg000001", type: "message_sent", label: "", enabled: true, settings: { ignoreBots: { literal: true } },
      actions: [
        {
          id: "actif0000001", type: "logic_if", inputs: { condition: { ref: { kind: "value", type: "logic_compare", inputs: {} } } },
          branches: {
            then: [{ id: "actset000001", type: "variable_set", inputs: { VAR: { ref: { kind: "variable", id: "varcoins0001" } }, VALUE: { ref: { kind: "event", key: "content" } } }, branches: {} }],
            elseif: [{ id: "itemelif0001", inputs: {}, actions: [] }],
            else: [log("actlog000005", { kind: "variable", id: "varcoins0001" })],
          },
        },
        {
          id: "acteach00001", type: "loop_each",
          inputs: { LIST: { ref: { kind: "value", type: "list_create", inputs: { items: { literal: [{ id: "it0000000001", inputs: { item: { literal: "a" } } }] } } } } },
          branches: { DO: [log("actlog000006", { kind: "branch", action: "acteach00001", branch: "DO", key: "item" })] },
        },
      ],
    },
  ],
};

{
  applyOp(emptyBuilder(), "importTemplate", { content: fullTemplate });
  const { data, report } = convertBuilderToBlocks({ content: fullTemplate, catalog: baseCatalog, blocks });
  if (report.code.length) problem("template", `became code blocks: ${report.code.join(", ")}`);
  if (report.native.length !== 6) problem("template", `expected 6 flows as blocks, got ${report.native.join(", ")}`);
  const code = blockCode(data);
  const error = parses(code);
  if (error) problem("template", `the bot doesn't parse: ${error}`);
  for (const wanted of ["commandName) == 'ping'", "getSubcommand()) == 'kick'", "getSubcommandGroup()) == 'config'", "customId) == 'again'", "value: (1)"])
    if (!code.replace(/[()]/g, "").includes(wanted.replace(/[()]/g, ""))) problem("template", `the bot is missing ${wanted}`);
  if (verbose) console.log(code);
}

/* ---------------------------------------------------------------------
   3. Steps with no blocks like them become code
   --------------------------------------------------------------------- */

{
  const content = {
    variables: [{ id: "varscore0001", name: "my score" }],
    commands: [
      command("cmddaily0001", "daily", {
        options: [option("optamt000001", 4, "amount", { required: true })],
        actions: [
          {
            id: "actcd0000001", type: "cooldown_run", inputs: { duration: { literal: 5 } },
            branches: { code: [{ id: "actset000001", type: "variable_set", inputs: { VAR: { ref: { kind: "variable", id: "varscore0001" } }, VALUE: { ref: { kind: "option", id: "optamt000001" } } }, branches: {} }] },
          },
        ],
      }),
    ],
    events: [],
  };
  const { data, report } = convertBuilderToBlocks({ content, catalog: baseCatalog, blocks });
  if (report.code.join() !== "/daily") problem("code blocks", `expected /daily as code, got ${JSON.stringify(report)}`);
  const code = blockCode(data);
  const error = parses(code);
  if (error) problem("code blocks", `the bot doesn't parse: ${error}`);
  if (!/var [^;]*my_score/.test(code)) problem("code blocks", "the variable isn't declared");
  if (!code.includes('interaction.options.getInteger("amount")')) problem("code blocks", "the option isn't read");
}

/* ---------------------------------------------------------------------
   4. Packs, both kinds, both ways
   --------------------------------------------------------------------- */

{
  const blockPack = {
    _id: "aaaaaaaaaaaaaaaaaaaaaaaa", name: "Hello Pack", color: "#ff0066", type: "blocks", dependencies: [],
    versions: [{ version: "1.0.0", blocks: [
      { name: "say_hello", type: "stack", color: "#ff0066", inlineInputs: null,
        inputs: [
          { type: "value", name: "TEXT", check: null, align: -1, fields: [{ type: "label", text: "say hello to" }] },
          { type: "dummy", align: -1, fields: [{ type: "label", text: "loud" }, { type: "checkbox", name: "LOUD", defaultValue: "FALSE" }] },
        ],
        outputCode: `"console.log(" + generator.valueToCode(block, "TEXT", Order.ATOMIC) + ", " + (block.getFieldValue("LOUD") === "TRUE") + ");\\n"` },
      { name: "double", type: "output", output: "Number", color: "#ff0066", inlineInputs: null,
        inputs: [{ type: "value", name: "NUM", check: "Number", align: -1, fields: [{ type: "label", text: "double" }] }],
        outputCode: `"(" + generator.valueToCode(block, "NUM", Order.ATOMIC) + " * 2)"` },
      { name: "repeat-twice", type: "stack", color: "#ff0066", inlineInputs: null,
        inputs: [{ type: "dummy", align: -1, fields: [{ type: "label", text: "repeat twice" }, { type: "dropdown", name: "MODE", choices: [["fast", "f"], ["slow", "s"]] }] },
                 { type: "statement", name: "DO", check: null, align: -1, fields: [] }],
        outputCode: `"for (let i = 0; i < 2; i++) { /*" + block.getFieldValue("MODE") + "*/\\n" + generator.statementToCode(block, "DO") + "}\\n"` },
      { name: "when_ready2", type: "hat", color: "#ff0066", inlineInputs: null,
        inputs: [{ type: "dummy", align: -1, fields: [{ type: "label", text: "when ready (pack)" }] }, { type: "statement", name: "BODY", check: null, align: -1, fields: [] }],
        outputCode: `"client.on(\\"ready\\", async () => {\\n" + generator.statementToCode(block, "BODY") + "});\\n"` },
    ] }],
  };
  const builderPack = {
    _id: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "Builder Pack", color: "#00aa55", type: "builder", dependencies: [],
    versions: [{ version: "1.0.0", items: {
      setup: "const packHelper = (x) => x;",
      events: [{ id: "evtone", label: "When pinged", mode: "client", listen: "pinged", params: ["who"], once: false, code: "", prelude: "if (!who) return;",
        settings: [{ key: "loud", kind: "boolean", label: "Loud", default: true }],
        values: [{ key: "who", label: "Who pinged", type: "user", code: "who" }], provides: [] }],
      actions: [{ id: "actone", label: "Fetch thing", requires: [],
        inputs: [{ key: "url", kind: "text", label: "URL", default: "https://x" }, { key: "mode", kind: "dropdown", label: "Mode", options: [{ label: "A", value: "a" }, { label: "B", value: "b" }], default: "a" }],
        branches: [{ key: "then", label: "Then", optional: false, provides: [{ key: "result", label: "Result", type: "String", code: "result{{id}}" }] }],
        code: "const result{{id}} = packHelper({{url}}); /* {{raw:mode}} */\n{{steps:then}}" }],
      values: [{ id: "valone", label: "Shout", output: "String", requires: [], inputs: [{ key: "text", kind: "text", label: "Text", default: "" }], code: "String({{text}}).toUpperCase()" }],
    } }],
  };

  registerCustomBlocks(blockPack.versions[0].blocks);
  markPackBlocks(blockPack._id, blockPack.versions[0].blocks);
  const types = createBuilderPackBlocks({ Blockly, javascriptGenerator, Order }).register(builderPack);
  markPackBlocks(builderPack._id, types.map((name) => ({ name })));
  const catalog = catalogWithPacks(baseCatalog, [blockPack, builderPack]);

  const B = `pk_${builderPack._id}`;
  const workspace = { blocks: { blocks: [
    { type: "msg_received", id: "h1", inputs: { event: { block: {
      type: "say_hello", id: "s1", fields: { LOUD: "TRUE" }, inputs: { TEXT: { block: { type: "double", id: "d1", inputs: { NUM: { block: { type: "math_number", id: "n1", fields: { NUM: 4 } } } } } } },
      next: { block: { type: "repeat-twice", id: "r1", fields: { MODE: "s" }, inputs: { DO: { block: {
        type: `${B}_actone`, id: "a1", fields: { mode: "b" }, inputs: { url: { block: { type: "text", id: "t1", fields: { TEXT: "https://y" } } }, then: { block: {
          type: "say_hello", id: "s2", inputs: { TEXT: { block: { type: `${B}_actone__result`, id: "v1" } } } } } } } } } } },
    } } } },
    { type: `${B}_evtone`, id: "e1", x: 0, y: 300, inputs: { loud: { block: { type: "logic_boolean", id: "lb", fields: { BOOL: "FALSE" } } }, steps: { block: {
      type: "say_hello", id: "s3", inputs: { TEXT: { block: { type: `${B}_valone`, id: "v2", inputs: { text: { block: { type: `${B}_evtone__who`, id: "v3" } } } } } } } } } },
    { type: "when_ready2", id: "w1", x: 0, y: 600, inputs: { BODY: { block: { type: "say_hello", id: "s4", inputs: { TEXT: { block: { type: "text", id: "t4", fields: { TEXT: "hi" } } } } } } } },
  ] } };

  const normal = (code) => code.replace(/result_[A-Za-z0-9]+/g, "result_X").replace(/\s+/g, "");
  const original = blockCode(workspace);

  /* Blocks → builder: every pack block is a step of its own pack. */
  const { builder, report } = convertBlockProject({ workspaces: [{ name: "packs", data: workspace }], catalog, blocks });
  if (report.packBlocks || report.unknownBlocks) problem("packs → builder", `pack blocks were left out: ${JSON.stringify(report)}`);
  const json = JSON.stringify(builder);
  for (const id of [blockPack._id, builderPack._id]) if (!json.includes(`pk_${id}_`)) problem("packs → builder", `nothing from pack ${id}`);
  try {
    applyOp(emptyBuilder(), "importTemplate", { content: builder });
  } catch (error) {
    problem("packs → builder", `the API would refuse it: ${error.message}`);
  }
  const { code: builderCode, issues } = generateBot({ project: { _id: "p", name: "packs" }, builder, catalog });
  if (parses(builderCode)) problem("packs → builder", "the bot doesn't parse");
  for (const issue of issues) problem("packs → builder", `generator: ${issue.where}: ${issue.message}`);
  for (const wanted of ["console.log(((4*2)),true);", 'packHelper("https://y");/*b*/', "client.on(\"pinged\",async(who)=>{if(!who)return;", 'client.on("ready",async()=>{'])
    if (!normal(builderCode).includes(wanted)) problem("packs → builder", `the bot is missing ${wanted}`);

  /* … and back to blocks, still the same packs, writing the same code. */
  const back = convertBuilderToBlocks({ content: builder, catalog, blocks });
  if (back.report.code.length) problem("builder → packs", `became code blocks: ${back.report.code.join(", ")}`);
  const again = blockCode(back.data);
  if (normal(again) !== normal(original)) {
    problem("builder → packs", "the blocks write different code than they started with");
    if (verbose) console.log(original, "\n----\n", again);
  }
}

/* ---------------------------------------------------------------------
   Result
   --------------------------------------------------------------------- */

if (problems.length) {
  console.log(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
  for (const line of problems) console.log(`  - ${line}`);
  process.exit(1);
}
console.log("All good.");
