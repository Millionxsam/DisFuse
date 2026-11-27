/* =====================================================================
   Builder catalog: logic and loops
   ---------------------------------------------------------------------
   Decisions (if, switch, comparisons) and loops. In the block editor
   these are mostly Blockly's own blocks, so the code here is written
   to match what its JavaScript generator produces.

   Loops add the "loop" context, which "Stop repeating" and "Skip to the
   next repeat" need. Only branches marked `inline` pass it on, because
   `break` and `continue` can't reach out of a callback.
   ===================================================================== */

import { ANY, group, input } from "../define.js";

const { action, value, block } = group({ colour: "4192E9" });

const events = [];

const actions = [
  action({
    id: "logic_if",
    label: "If",
    description: "Runs some steps only when something is true, and others when it isn't.",
    category: "logic",
    icon: "fa-solid fa-code-branch",
    keywords: ["if", "else", "otherwise", "condition", "check"],
    block: { type: "controls_if", builtin: true },
    inputs: [input.boolean("condition", "If this is true")],
    branches: [
      { key: "then", label: "Then", inline: true },
      {
        key: "elseif",
        label: "Otherwise, if",
        inline: true,
        repeat: true,
        itemLabel: "Otherwise, if",
        inputs: [input.boolean("condition", "This is true")],
      },
      { key: "else", label: "Otherwise", optional: true, inline: true },
    ],
    sentence: "If {condition}",
    code: (ctx) =>
      `if (${ctx.input("condition")}) {\n${ctx.branch("then")}}` +
      ctx
        .items("elseif")
        .map((item) => ` else if (${item.input("condition")}) {\n${item.code}}`)
        .join("") +
      (ctx.hasBranch("else") ? ` else {\n${ctx.branch("else")}}` : "") +
      "\n",
  }),
  action({
    id: "logic_switch",
    label: "Check a value against cases",
    description:
      "Compares one value against a list of cases and runs the steps of the one that matches.",
    category: "logic",
    icon: "fa-solid fa-list-check",
    keywords: ["switch", "case", "match", "which"],
    block: {
      type: "logic_switch",
      text: ["check if {switch}", "{cases}"],
      parts: { cases: { check: "case" }, default: { part: "item", input: "cases" } },
    },
    inputs: [input.slot("switch", "Value to check", ANY)],
    branches: [
      {
        key: "cases",
        label: "Case",
        inline: true,
        repeat: true,
        itemLabel: "When it equals",
        block: {
          type: "logic_case",
          text: ["equals to {case}", "then {code}"],
          parts: { case: { check: null }, code: { part: "statement", check: null } },
          body: "code",
          previous: "case",
          next: "case",
          restrictions: [
            {
              type: "surroundParent",
              blockTypes: ["logic_switch"],
              message: "This block must be under a 'check if' block",
            },
          ],
        },
        inputs: [
          input.text("case", "Equals", {
            default: "",
            accepts: [null],
            placeholder: "Type a value",
          }),
        ],
      },
      {
        key: "default",
        label: "If nothing matches",
        optional: true,
        inline: true,
        block: {
          type: "logic_default",
          text: ["if none of the above", "then {code}"],
          parts: { code: { part: "statement", check: null } },
          body: "code",
          previous: "case",
          next: "case",
          restrictions: [
            {
              type: "surroundParent",
              blockTypes: ["logic_switch"],
              message: "This block must be under a 'check if' block",
            },
          ],
        },
      },
    ],
    code: (ctx) => `switch (${ctx.input("switch")}) {
${ctx
  .items("cases")
  .map((item) => `case ${item.input("case")}: {\n${item.code}break;\n}\n`)
  .join(
    "",
  )}${ctx.hasBranch("default") ? `default: {\n${ctx.branch("default")}break;\n}\n` : ""}}\n`,
  }),
  action({
    id: "loop_repeat",
    label: "Repeat a number of times",
    description: "Runs the steps inside a set number of times.",
    category: "loops",
    icon: "fa-solid fa-repeat",
    keywords: ["repeat", "loop", "times"],
    block: { type: "controls_repeat_ext", builtin: true },
    inputs: [input.number("TIMES", "Times", { default: 10, min: 0 })],
    branches: [
      {
        key: "DO",
        label: "Do",
        inline: true,
        provides: [
          {
            key: "index",
            label: "Repeat number",
            type: "Number",
            code: "repeatIndex@@",
            description: "Counts up from 1 each time the steps run.",
          },
        ],
        contexts: ["loop"],
      },
    ],
    sentence: "Repeat {TIMES} times",
    code: (ctx) => {
      const i = ctx.local("repeatIndex");
      return `for (let ${i} = 1; ${i} <= ${ctx.input("TIMES")}; ${i}++) {\n${ctx.branch("DO")}}\n`;
    },
  }),
  action({
    id: "loop_while",
    label: "Repeat while or until something is true",
    description:
      "Keeps running the steps inside while something is true, or until it becomes true.",
    category: "loops",
    icon: "fa-solid fa-rotate",
    keywords: ["while", "until", "loop"],
    block: { type: "controls_whileUntil", builtin: true },
    inputs: [
      input.dropdown(
        "MODE",
        "Keep going",
        [
          ["While this is true", "WHILE"],
          ["Until this is true", "UNTIL"],
        ],
        { default: "WHILE" },
      ),
      input.boolean("BOOL", "Condition"),
    ],
    branches: [{ key: "DO", label: "Do", inline: true, contexts: ["loop"] }],
    code: (ctx) => {
      const condition = ctx.input("BOOL");
      const test = ctx.raw("MODE") === "UNTIL" ? `!${condition}` : condition;
      return `while (${test}) {\n${ctx.branch("DO")}}\n`;
    },
  }),
  action({
    id: "loop_count",
    label: "Repeat counting from one number to another",
    description: "Runs the steps inside once for each number between two numbers.",
    category: "loops",
    icon: "fa-solid fa-arrow-up-1-9",
    keywords: ["count", "for", "loop", "range"],
    block: { type: "controls_for", builtin: true },
    inputs: [
      input.number("FROM", "From", { default: 1 }),
      input.number("TO", "To", { default: 10 }),
      input.number("BY", "Count by", { default: 1, help: "How much to add each time." }),
    ],
    branches: [
      {
        key: "DO",
        label: "Do",
        inline: true,
        provides: [{ key: "number", label: "Current number", type: "Number", code: "count@@" }],
        contexts: ["loop"],
      },
    ],
    sentence: "Count from {FROM} to {TO}",
    code: (ctx) => {
      const n = ctx.local("count");
      const from = `_from${ctx.uid}`;
      const to = `_to${ctx.uid}`;
      const step = `_step${ctx.uid}`;
      return `const ${from} = ${ctx.input("FROM")}, ${to} = ${ctx.input("TO")}, ${step} = Math.abs(${ctx.input("BY")}) || 1;
for (let ${n} = ${from}; ${from} <= ${to} ? ${n} <= ${to} : ${n} >= ${to}; ${n} += ${from} <= ${to} ? ${step} : -${step}) {
${ctx.branch("DO")}}\n`;
    },
  }),
  action({
    id: "loop_each",
    label: "Repeat with each item in a list",
    description: "Runs the steps inside once for every item in a list.",
    category: "loops",
    icon: "fa-solid fa-list-ol",
    keywords: ["for each", "loop", "list", "every"],
    block: { type: "controls_forEach", builtin: true },
    inputs: [input.slot("LIST", "List", "Array")],
    branches: [
      {
        key: "DO",
        label: "Do",
        inline: true,
        provides: [{ key: "item", label: "Current item", type: ANY, code: "item@@" }],
        contexts: ["loop"],
      },
    ],
    code: (ctx) =>
      `for (const ${ctx.local("item")} of ${ctx.input("LIST")} ?? []) {\n${ctx.branch("DO")}}\n`,
  }),
  action({
    id: "flow_stop",
    label: "Stop running the steps",
    description:
      "Stops here, so none of the steps after this one run. Handy after telling someone they can't use a command.",
    category: "logic",
    icon: "fa-solid fa-hand",
    keywords: ["stop", "return", "end", "exit", "cancel", "quit"],
    block: {
      type: "flow_stop",
      text: "stop running the blocks",
      colour: null,
      style: "logic_blocks",
      tooltip: "Stops here, so none of the blocks after this one run.",
      next: false,
    },

    requires: ["stoppable"],
    terminal: true,
    code: () => "return;\n",
  }),
  action({
    id: "loop_stop",
    label: "Stop repeating",
    description: "Stops the loop it's in right away and carries on after it.",
    category: "loops",
    icon: "fa-solid fa-circle-stop",
    keywords: ["break", "exit loop", "stop"],
    block: { type: "controls_flow_statements", builtin: true, fields: { FLOW: "BREAK" } },
    requires: ["loop"],
    terminal: true,
    code: () => "break;\n",
  }),
  action({
    id: "loop_skip",
    label: "Skip to the next repeat",
    description: "Skips the rest of the steps in this round of the loop and starts the next one.",
    category: "loops",
    icon: "fa-solid fa-forward",
    keywords: ["continue", "next", "skip"],
    block: { type: "controls_flow_statements", builtin: true, fields: { FLOW: "CONTINUE" } },
    requires: ["loop"],
    terminal: true,
    code: () => "continue;\n",
  }),
];

const values = [
  value({
    id: "logic_compare",
    label: "Compare two values",
    description: "True if the comparison is right, like one number being bigger than another.",
    category: "logic",
    icon: "fa-solid fa-equals",
    keywords: ["equals", "compare", "greater", "less", "bigger", "smaller", "=", ">", "<"],
    block: { type: "logic_compare", builtin: true },
    output: "Boolean",
    inputs: [
      input.text("A", "First value", { default: "", accepts: [null] }),
      input.dropdown(
        "OP",
        "Is",
        [
          ["equal to (=)", "=="],
          ["not equal to (≠)", "!="],
          ["less than (<)", "<"],
          ["less than or equal to (≤)", "<="],
          ["greater than (>)", ">"],
          ["greater than or equal to (≥)", ">="],
        ],
        { default: "==" },
      ),
      input.text("B", "Second value", { default: "", accepts: [null] }),
    ],
    sentence: "{A} {OP} {B}",
    code: (ctx) => `${ctx.input("A")} ${ctx.raw("OP")} ${ctx.input("B")}`,
  }),
  value({
    id: "logic_exactly_equal",
    label: "Exactly equal",
    description:
      'True if two values are the same and also the same kind (the number 5 isn\'t exactly equal to the text "5").',
    category: "logic",
    icon: "fa-solid fa-equals",
    keywords: ["===", "strict", "same"],
    block: {
      type: "logic_equalsExactly",
      text: ["{A}", "exactly equals {B}"],
      parts: { A: { check: null }, B: { check: null } },
      colour: "#4192E9",
      inline: true,
      tooltip: "tooltip",
      helpUrl: "url",
    },
    output: "Boolean",
    inputs: [
      input.text("A", "First value", { default: "", accepts: [null] }),
      input.text("B", "Second value", { default: "", accepts: [null] }),
    ],
    code: (ctx) => `${ctx.input("A")} === ${ctx.input("B")}`,
  }),
  value({
    id: "logic_and_or",
    label: "And / or",
    description: "Combines two true/false values: both must be true (and), or at least one (or).",
    category: "logic",
    icon: "fa-solid fa-circle-nodes",
    keywords: ["and", "or", "both", "either"],
    block: { type: "logic_operation", builtin: true },
    output: "Boolean",
    inputs: [
      input.boolean("A", "First"),
      input.dropdown(
        "OP",
        "Combine with",
        [
          ["and", "&&"],
          ["or", "||"],
        ],
        { default: "&&" },
      ),
      input.boolean("B", "Second"),
    ],
    sentence: "{A} {OP} {B}",
    code: (ctx) => `${ctx.input("A")} ${ctx.raw("OP")} ${ctx.input("B")}`,
  }),
  value({
    id: "logic_not",
    label: "Not (the opposite)",
    description: "Flips a true/false value: true becomes false and false becomes true.",
    category: "logic",
    icon: "fa-solid fa-exclamation",
    keywords: ["not", "opposite", "negate", "!"],
    block: { type: "logic_negate", builtin: true },
    output: "Boolean",
    inputs: [input.boolean("BOOL", "Value")],
    code: (ctx) => `!${ctx.input("BOOL")}`,
  }),
  value({
    id: "logic_true_false",
    label: "True or false",
    description: "A plain true or false.",
    category: "logic",
    icon: "fa-solid fa-toggle-on",
    keywords: ["true", "false", "yes", "no", "boolean"],
    block: { type: "logic_boolean", builtin: true },
    output: "Boolean",
    inputs: [input.boolean("BOOL", "Value", { default: true, allowValues: false })],
    code: (ctx) => ctx.input("BOOL"),
  }),
  value({
    id: "logic_nothing",
    label: "Nothing",
    description: "An empty value (null), for when something has no value.",
    category: "logic",
    icon: "fa-solid fa-ban",
    keywords: ["null", "empty", "none", "undefined"],
    block: { type: "logic_null", builtin: true },
    output: ANY,
    code: () => "null",
  }),
  value({
    id: "logic_choose",
    label: "Pick one of two values",
    description: "Gives the first value if something is true, and the second one if it isn't.",
    category: "logic",
    icon: "fa-solid fa-signs-post",
    keywords: ["ternary", "if", "choose", "either"],
    block: { type: "logic_ternary", builtin: true },
    output: ANY,
    inputs: [
      input.boolean("IF", "If this is true"),
      input.text("THEN", "Use", { default: "", accepts: [null] }),
      input.text("ELSE", "Otherwise use", { default: "", accepts: [null] }),
    ],
    code: (ctx) => `(${ctx.input("IF")} ? ${ctx.input("THEN")} : ${ctx.input("ELSE")})`,
  }),
  value({
    id: "logic_fallback",
    label: "Value or a backup",
    description: "Gives the value, or the backup if the value is empty.",
    category: "logic",
    icon: "fa-solid fa-life-ring",
    keywords: ["default", "fallback", "or", "??", "null"],
    block: {
      type: "logic_nullishOperator",
      text: ["use value: {value}", "if {type} use: {fallback}"],
      parts: {
        type: {
          options: [
            ["null", "??"],
            ["null or false", "||"],
          ],
        },
        fallback: { check: null },
      },
      colour: "#4c97ff",
      inline: false,
      tooltip:
        "Returns the second value if the first value is nullish; otherwise, it returns the first value.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["value"], message: "You must specify the value" },
        {
          type: "notEmpty",
          blockTypes: ["fallback"],
          message: "You must specify the fallback value",
        },
      ],
    },
    output: ANY,
    inputs: [
      input.slot("value", "Value", ANY),
      input.dropdown(
        "type",
        "Use the backup if the value is",
        [
          ["empty", "??"],
          ["empty, false or 0", "||"],
        ],
        { default: "??" },
      ),
      input.text("fallback", "Backup", { default: "", accepts: [null] }),
    ],
    code: (ctx) => `(${ctx.input("value")} ${ctx.raw("type")} ${ctx.input("fallback")})`,
  }),
];

const components = [];

const blocks = [];

export default {
  events,
  actions,
  values,
  components,
  contexts: [
    {
      key: "loop",
      label: "a loop",
      description: "Only works inside a Repeat step.",
    },
    {
      key: "stoppable",
      label: "the main steps",
      description:
        'Can\'t go inside a section that runs on its own, like "Repeat with each member in a server" or "Then" after sending a message. Put it in the main steps, or inside If, Repeat or Try.',
    },
  ],

  blocks,
};
