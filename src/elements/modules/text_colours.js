/* =====================================================================
   Builder catalog: text and colors
   ---------------------------------------------------------------------
   Working with text (joining, cutting, searching, patterns) and colors.
   Most of these are Blockly's own blocks in the block editor; the code
   here matches what its JavaScript generator produces, with Blockly's
   one-based positions ("letter #1" is the first letter).
   ===================================================================== */

import { group, input } from "../define.js";

const { action, value, block } = group({ colour: "#ad794c" });

/* Helpers the generated bot gets once, when a value needs them. Blockly
   adds the same functions with provideFunction_. */
const TEXT_PART = {
  key: "disfuseTextPart",
  code: `function disfuseTextPart(text, where1, at1, where2, at2) {
  text = String(text ?? "");
  const start = where1 === "FROM_START" ? at1 - 1 : where1 === "FROM_END" ? text.length - at1 : 0;
  const end = where2 === "FROM_START" ? at2 : where2 === "FROM_END" ? text.length - at2 + 1 : text.length;
  return text.slice(Math.max(0, start), end);
}`,
};

const TITLE_CASE = {
  key: "disfuseTitleCase",
  code: `function disfuseTitleCase(text) {
  return String(text ?? "").replace(/\\S+/g, (word) => word[0].toUpperCase() + word.substring(1).toLowerCase());
}`,
};

const TEXT_COUNT = {
  key: "disfuseTextCount",
  code: `function disfuseTextCount(haystack, needle) {
  haystack = String(haystack ?? "");
  needle = String(needle ?? "");
  return needle.length === 0 ? haystack.length + 1 : haystack.split(needle).length - 1;
}`,
};

const COLOUR_RGB = {
  key: "disfuseColourRgb",
  code: `function disfuseColourRgb(r, g, b) {
  const hex = (n) => ("0" + (Math.round(Math.max(Math.min(Number(n), 100), 0) * 2.55) || 0).toString(16)).slice(-2);
  return "#" + hex(r) + hex(g) + hex(b);
}`,
};

const COLOUR_BLEND = {
  key: "disfuseColourBlend",
  code: `function disfuseColourBlend(c1, c2, ratio) {
  ratio = Math.max(Math.min(Number(ratio), 1), 0);
  const part = (c, i) => parseInt(String(c).substring(i, i + 2), 16) || 0;
  const mix = (i) => ("0" + (Math.round(part(c1, i) * (1 - ratio) + part(c2, i) * ratio) || 0).toString(16)).slice(-2);
  return "#" + mix(1) + mix(3) + mix(5);
}`,
};

const events = [];

const actions = [
  action({
    id: "text_add_to_variable",
    label: "Add text to the end of a variable",
    description: "Adds some text to the end of what a variable already holds.",
    category: "text",
    icon: "fa-solid fa-paragraph",
    keywords: ["append", "add", "concat", "variable"],
    block: { type: "text_append", builtin: true },
    inputs: [input.variable("VAR", "Variable"), input.text("TEXT", "Text to add", { default: "" })],
    code: (ctx) =>
      `${ctx.input("VAR")} = String(${ctx.input("VAR")} ?? "") + ${ctx.input("TEXT")};\n`,
  }),
];

const values = [
  value({
    id: "colour_value",
    label: "Color",
    description: "A color you pick.",
    category: "colours",
    icon: "fa-solid fa-palette",
    keywords: ["colour", "color", "hex"],
    block: { type: "colour_picker", builtin: true },
    output: "Colour",
    inputs: [input.colour("COLOUR", "Color", { default: "#5865F2", allowValues: false })],
    code: (ctx) => ctx.input("COLOUR"),
  }),
  value({
    id: "colour_from_value",
    label: "Value as a color",
    description: "Treats a value (like a color code in text) as a color.",
    category: "colours",
    icon: "fa-solid fa-droplet",
    keywords: ["colour", "convert", "hex"],
    block: {
      type: "colour_convert",
      text: ["{value}", "to color"],
      parts: { value: { check: null } },
    },
    output: "Colour",
    inputs: [
      input.text("value", "Color code", { default: "", accepts: [null], placeholder: "#ff0000" }),
    ],
    code: (ctx) => ctx.input("value"),
  }),
  value({
    id: "colour_random",
    label: "Random color",
    description: "A different random color each time.",
    category: "colours",
    icon: "fa-solid fa-shuffle",
    keywords: ["colour", "random"],
    block: { type: "colour_random", builtin: true },
    output: "Colour",
    code: () => '"#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0")',
  }),
  value({
    id: "colour_rgb",
    label: "Color from red, green and blue",
    description: "Mixes a color from amounts of red, green and blue, each from 0 to 100.",
    category: "colours",
    icon: "fa-solid fa-sliders",
    keywords: ["rgb", "colour", "red", "green", "blue"],
    block: { type: "colour_rgb", builtin: true },
    output: "Colour",
    inputs: [
      input.number("RED", "Red (0 to 100)", { default: 100, min: 0, max: 100 }),
      input.number("GREEN", "Green (0 to 100)", { default: 50, min: 0, max: 100 }),
      input.number("BLUE", "Blue (0 to 100)", { default: 0, min: 0, max: 100 }),
    ],
    setup: [COLOUR_RGB],
    code: (ctx) =>
      `disfuseColourRgb(${ctx.input("RED")}, ${ctx.input("GREEN")}, ${ctx.input("BLUE")})`,
  }),
  value({
    id: "colour_blend",
    label: "Mix two colors",
    description:
      "Blends two colors together. A mix of 0 gives the first color and 1 gives the second.",
    category: "colours",
    icon: "fa-solid fa-circle-half-stroke",
    keywords: ["blend", "mix", "colour"],
    block: { type: "colour_blend", builtin: true },
    output: "Colour",
    inputs: [
      input.colour("COLOUR1", "First color", { default: "#ff0000" }),
      input.colour("COLOUR2", "Second color", { default: "#3333ff" }),
      input.number("RATIO", "Mix (0 to 1)", { default: 0.5, min: 0, max: 1, step: 0.1 }),
    ],
    setup: [COLOUR_BLEND],
    code: (ctx) =>
      `disfuseColourBlend(${ctx.input("COLOUR1")}, ${ctx.input("COLOUR2")}, ${ctx.input("RATIO")})`,
  }),
  value({
    id: "text_value",
    label: "Text",
    description: "Some text you type in. Handy where a step takes any kind of value.",
    category: "text",
    icon: "fa-solid fa-font",
    keywords: ["string", "words", "quote"],
    block: [
      { type: "text", builtin: true },
      { type: "text_multiline", builtin: true },
    ],
    output: "String",
    inputs: [input.text("TEXT", "Text", { default: "", allowValues: false, multiline: true })],
    code: (ctx) => ctx.input("TEXT"),
  }),
  value({
    id: "text_join",
    label: "Join text",
    description: "Puts several pieces of text (or values) together into one.",
    category: "text",
    icon: "fa-solid fa-link",
    keywords: ["join", "combine", "concat", "create text with", "add"],
    block: { type: "text_join", builtin: true },
    output: "String",
    inputs: [
      input.group("parts", "Pieces", [input.text("part", "Text", { default: "" })], {
        itemLabel: "Piece",
      }),
    ],
    code: (ctx) => {
      const parts = ctx.group("parts").map((item) => item.input("part"));
      return parts.length ? `[${parts.join(", ")}].join("")` : '""';
    },
  }),
  value({
    id: "text_new_line",
    label: "New line",
    description: "A line break, to start a new line in a message.",
    category: "text",
    icon: "fa-solid fa-turn-down",
    keywords: ["newline", "line break", "enter", "\\n"],
    block: { type: "text_newline", text: "new line", colour: null, style: "text_blocks" },
    output: "String",
    code: () => '"\\n"',
  }),
  value({
    id: "text_length",
    label: "Length of text",
    description: "How many characters are in some text, or how many items are in a list.",
    category: "text",
    icon: "fa-solid fa-ruler-horizontal",
    keywords: ["length", "count", "size", "characters"],
    block: { type: "text_length", builtin: true },
    output: "Number",
    inputs: [input.text("VALUE", "Text or list", { default: "", accepts: ["String", "Array"] })],
    code: (ctx) => `${ctx.input("VALUE")}.length`,
  }),
  value({
    id: "text_is_empty",
    label: "Text is empty?",
    description: "True if some text has no characters, or a list has no items.",
    category: "text",
    icon: "fa-regular fa-square",
    keywords: ["empty", "blank", "nothing"],
    block: { type: "text_isEmpty", builtin: true },
    output: "Boolean",
    inputs: [input.text("VALUE", "Text or list", { default: "", accepts: ["String", "Array"] })],
    code: (ctx) => `!${ctx.input("VALUE")}.length`,
  }),
  value({
    id: "text_starts_ends_with",
    label: "Text starts or ends with?",
    description: "True if some text starts (or ends) with other text.",
    category: "text",
    icon: "fa-solid fa-arrows-left-right-to-line",
    keywords: ["starts with", "ends with", "prefix", "suffix"],
    block: {
      type: "text_startOrEndWith",
      text: ["does {text}", "{name} with {text2}"],
      parts: {
        name: {
          options: [
            ["start", "starts"],
            ["end", "ends"],
          ],
        },
      },
      colour: null,
      style: "text_blocks",
      inline: true,
    },
    output: "Boolean",
    inputs: [
      input.text("text", "Text", { default: "" }),
      input.dropdown(
        "name",
        "Check if it",
        [
          ["starts with", "starts"],
          ["ends with", "ends"],
        ],
        { default: "starts" },
      ),
      input.text("text2", "This text", { default: "" }),
    ],
    code: (ctx) => `${ctx.input("text")}.${ctx.raw("name")}With(${ctx.input("text2")})`,
  }),
  value({
    id: "text_position_of",
    label: "Position of text inside text",
    description:
      "Where some text first (or last) appears in other text, counting from 1. Gives 0 if it's not there.",
    category: "text",
    icon: "fa-solid fa-magnifying-glass-location",
    keywords: ["index of", "find", "search", "position"],
    block: { type: "text_indexOf", builtin: true },
    output: "Number",
    inputs: [
      input.text("VALUE", "In this text", { default: "" }),
      input.dropdown(
        "END",
        "Find the",
        [
          ["first time", "FIRST"],
          ["last time", "LAST"],
        ],
        { default: "FIRST" },
      ),
      input.text("FIND", "This text appears", { default: "" }),
    ],
    code: (ctx) =>
      `(${ctx.input("VALUE")}.${ctx.raw("END") === "LAST" ? "lastIndexOf" : "indexOf"}(${ctx.input("FIND")}) + 1)`,
  }),
  value({
    id: "text_letter_at",
    label: "Letter from text",
    description: "One letter from some text: at a position, the first, the last or a random one.",
    category: "text",
    icon: "fa-solid fa-a",
    keywords: ["char at", "letter", "character"],
    block: { type: "text_charAt", builtin: true },
    output: "String",
    inputs: [
      input.text("VALUE", "Text", { default: "" }),
      input.dropdown(
        "WHERE",
        "Which letter",
        [
          ["Letter number", "FROM_START"],
          ["Letter number, from the end", "FROM_END"],
          ["First letter", "FIRST"],
          ["Last letter", "LAST"],
          ["Random letter", "RANDOM"],
        ],
        { default: "FROM_START" },
      ),
      input.number("AT", "Number", {
        default: 1,
        showIf: { WHERE: ["FROM_START", "FROM_END"] },
        min: 1,
      }),
    ],
    code: (ctx) => {
      const text = ctx.input("VALUE");
      switch (ctx.raw("WHERE")) {
        case "FIRST":
          return `${text}.charAt(0)`;
        case "LAST":
          return `${text}.slice(-1)`;
        case "FROM_END":
          return `${text}.slice(-(${ctx.input("AT")})).charAt(0)`;
        case "RANDOM":
          return `((t) => t.charAt(Math.floor(Math.random() * t.length)))(String(${text}))`;
        default:
          return `${text}.charAt(${ctx.input("AT")} - 1)`;
      }
    },
  }),
  value({
    id: "text_part",
    label: "Part of text",
    description: "The part of some text between two letter positions.",
    category: "text",
    icon: "fa-solid fa-scissors",
    keywords: ["substring", "slice", "cut", "part"],
    block: { type: "text_getSubstring", builtin: true },
    output: "String",
    inputs: [
      input.text("STRING", "Text", { default: "" }),
      input.dropdown(
        "WHERE1",
        "From",
        [
          ["Letter number", "FROM_START"],
          ["Letter number, from the end", "FROM_END"],
          ["The first letter", "FIRST"],
        ],
        { default: "FROM_START" },
      ),
      input.number("AT1", "Start at letter", {
        default: 1,
        showIf: { WHERE1: ["FROM_START", "FROM_END"] },
        min: 1,
      }),
      input.dropdown(
        "WHERE2",
        "To",
        [
          ["Letter number", "FROM_START"],
          ["Letter number, from the end", "FROM_END"],
          ["The last letter", "LAST"],
        ],
        { default: "FROM_START" },
      ),
      input.number("AT2", "End at letter", {
        default: 3,
        showIf: { WHERE2: ["FROM_START", "FROM_END"] },
        min: 1,
      }),
    ],
    setup: [TEXT_PART],
    code: (ctx) =>
      `disfuseTextPart(${ctx.input("STRING")}, ${ctx.input("WHERE1")}, ${ctx.input("AT1")}, ${ctx.input("WHERE2")}, ${ctx.input("AT2")})`,
  }),
  value({
    id: "text_change_case",
    label: "Change text capitalization",
    description: "Makes text all capitals, all lowercase, or Capitalizes Each Word.",
    category: "text",
    icon: "fa-solid fa-text-height",
    keywords: ["uppercase", "lowercase", "title case", "capital", "case"],
    block: { type: "text_changeCase", builtin: true },
    output: "String",
    inputs: [
      input.dropdown(
        "CASE",
        "Change to",
        [
          ["UPPERCASE", "UPPERCASE"],
          ["lowercase", "LOWERCASE"],
          ["Title Case", "TITLECASE"],
        ],
        { default: "UPPERCASE" },
      ),
      input.text("TEXT", "Text", { default: "" }),
    ],
    setup: [TITLE_CASE],
    code: (ctx) => {
      const text = ctx.input("TEXT");
      if (ctx.raw("CASE") === "LOWERCASE") return `${text}.toLowerCase()`;
      if (ctx.raw("CASE") === "TITLECASE") return `disfuseTitleCase(${text})`;
      return `${text}.toUpperCase()`;
    },
  }),
  value({
    id: "text_trim",
    label: "Trim spaces from text",
    description: "Removes spaces from the start and/or end of some text.",
    category: "text",
    icon: "fa-solid fa-text-slash",
    keywords: ["trim", "spaces", "whitespace", "strip"],
    block: { type: "text_trim", builtin: true },
    output: "String",
    inputs: [
      input.dropdown(
        "MODE",
        "Remove spaces from",
        [
          ["Both ends", "BOTH"],
          ["The start", "LEFT"],
          ["The end", "RIGHT"],
        ],
        { default: "BOTH" },
      ),
      input.text("TEXT", "Text", { default: "" }),
    ],
    code: (ctx) =>
      `${ctx.input("TEXT")}.${{ LEFT: "trimStart", RIGHT: "trimEnd" }[ctx.raw("MODE")] ?? "trim"}()`,
  }),
  value({
    id: "text_count",
    label: "Times text appears in text",
    description: "How many times some text appears in other text.",
    category: "text",
    icon: "fa-solid fa-calculator",
    keywords: ["count", "occurrences", "how many times"],
    block: { type: "text_count", builtin: true },
    output: "Number",
    inputs: [
      input.text("SUB", "Count this", { default: "" }),
      input.text("TEXT", "In this text", { default: "" }),
    ],
    setup: [TEXT_COUNT],
    code: (ctx) => `disfuseTextCount(${ctx.input("TEXT")}, ${ctx.input("SUB")})`,
  }),
  value({
    id: "text_repeat",
    label: "Repeat text",
    description: "Some text repeated a number of times, one after another.",
    category: "text",
    icon: "fa-solid fa-clone",
    keywords: ["repeat", "duplicate", "times"],
    block: {
      type: "text_repeat",
      text: ["repeat {text}", "{times}", "times"],
      colour: null,
      style: "text_blocks",
    },
    output: "String",
    inputs: [
      input.text("text", "Text", { default: "abc" }),
      input.number("times", "Times", { default: 3, min: 0 }),
    ],
    code: (ctx) => `String(${ctx.input("text")}).repeat(${ctx.input("times")})`,
  }),
  value({
    id: "text_replace",
    label: "Replace text",
    description: "Swaps every copy of some text for other text.",
    category: "text",
    icon: "fa-solid fa-right-left",
    keywords: ["replace", "swap", "change", "substitute"],
    block: { type: "text_replace", builtin: true },
    output: "String",
    inputs: [
      input.text("TEXT", "In this text", { default: "" }),
      input.text("FROM", "Replace", { default: "" }),
      input.text("TO", "With", { default: "" }),
    ],
    code: (ctx) =>
      `String(${ctx.input("TEXT")}).split(${ctx.input("FROM")}).join(${ctx.input("TO")})`,
  }),
  value({
    id: "text_reverse",
    label: "Reverse text",
    description: "Some text written backwards.",
    category: "text",
    icon: "fa-solid fa-arrow-rotate-left",
    keywords: ["reverse", "backwards", "flip"],
    block: { type: "text_reverse", builtin: true },
    output: "String",
    inputs: [input.text("TEXT", "Text", { default: "" })],
    code: (ctx) => `[...String(${ctx.input("TEXT")})].reverse().join("")`,
  }),
  value({
    id: "text_contains",
    label: "Text contains?",
    description: "True if some text has other text anywhere in it.",
    category: "text",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["includes", "contains", "has", "search"],
    block: {
      type: "text_contains",
      text: ["text {text}", "contains {query}"],
      colour: null,
      style: "text_blocks",
      inline: true,
    },
    output: "Boolean",
    inputs: [
      input.text("text", "Text", { default: "" }),
      input.text("query", "Contains", { default: "" }),
    ],
    code: (ctx) => `${ctx.input("text")}.includes(${ctx.input("query")})`,
  }),
  value({
    id: "text_pattern",
    label: "Text pattern",
    description: "A search pattern (a regular expression) for matching text in advanced ways.",
    category: "text",
    group: "Patterns",
    icon: "fa-solid fa-asterisk",
    keywords: ["regex", "regexp", "regular expression", "pattern"],
    block: {
      type: "text_regexp",
      text: "regexp / {regexp} /",
      parts: {
        regexp: {
          part: "text",
          value: "regexp",
          validator: (value) => {
            try {
              new RegExp(value);
              return value;
            } catch {
              return null;
            }
          },
        },
      },
      colour: null,
      style: "regexp_blocks",
    },
    output: "regexp",
    inputs: [
      input.text("regexp", "Pattern", { default: "", allowValues: false, placeholder: "[0-9]+" }),
    ],
    code: (ctx) => `new RegExp(${ctx.input("regexp")})`,
  }),
  value({
    id: "text_pattern_test",
    label: "Text matches a pattern?",
    description: "True if some text matches a pattern.",
    category: "text",
    group: "Patterns",
    icon: "fa-solid fa-check-double",
    keywords: ["regex", "test", "match"],
    block: {
      type: "text_regexp_test",
      text: ["test regexp {regexp}", "on {string}"],
      colour: null,
      style: "regexp_blocks",
      inline: true,
    },
    output: "Boolean",
    inputs: [
      input.slot("regexp", "Pattern", "regexp"),
      input.text("string", "Text", { default: "" }),
    ],
    code: (ctx) => `${ctx.input("regexp")}.test(${ctx.input("string")})`,
  }),
  value({
    id: "text_pattern_matches",
    label: "All pattern matches in text",
    description: "A list of the parts of some text that match a pattern.",
    category: "text",
    group: "Patterns",
    icon: "fa-solid fa-list",
    keywords: ["regex", "match", "find all"],
    block: {
      type: "text_regexp_match",
      text: ["match regexp {regexp}", "on {string}"],
      colour: null,
      style: "regexp_blocks",
      inline: true,
    },
    output: "Array",
    inputs: [
      input.slot("regexp", "Pattern", "regexp"),
      input.text("string", "Text", { default: "" }),
    ],
    code: (ctx) => `${ctx.input("string")}.match(${ctx.input("regexp")})`,
  }),
  value({
    id: "text_pattern_first",
    label: "First pattern match in text",
    description:
      "The first match of a pattern in some text, with its groups, or nothing if there's no match.",
    category: "text",
    group: "Patterns",
    icon: "fa-solid fa-crosshairs",
    keywords: ["regex", "exec", "groups"],
    block: {
      type: "text_regexp_exec",
      text: ["exec regexp {regexp}", "on {string}"],
      colour: null,
      style: "regexp_blocks",
      inline: true,
    },
    output: "Array",
    inputs: [
      input.slot("regexp", "Pattern", "regexp"),
      input.text("string", "Text", { default: "" }),
    ],
    code: (ctx) => `${ctx.input("regexp")}.exec(${ctx.input("string")})`,
  }),
  value({
    id: "text_pattern_replace",
    label: "Replace a pattern in text",
    description: "Replaces the parts of some text that match a pattern.",
    category: "text",
    group: "Patterns",
    icon: "fa-solid fa-right-left",
    keywords: ["regex", "replace"],
    block: {
      type: "text_regexp_replace",
      text: ["replace regexp {regexp}", "on {string}", "with {replace}"],
      colour: null,
      style: "regexp_blocks",
      inline: true,
    },
    output: "String",
    inputs: [
      input.slot("regexp", "Pattern", "regexp"),
      input.text("string", "In this text", { default: "" }),
      input.text("replace", "Replace with", { default: "" }),
    ],
    code: (ctx) =>
      `${ctx.input("string")}.replace(${ctx.input("regexp")}, ${ctx.input("replace")})`,
  }),
];

const components = [];

const blocks = [
  block({
    type: "text_regexp_search",
    text: ["search regexp {regexp}", "on {string}"],
    parts: {
      regexp: { part: "value", check: "regexp" },
      string: { part: "value", check: "String" },
    },
    colour: null,
    style: "regexp_blocks",
    output: "Number",
    code: (ctx) => {
      const { Order } = ctx;
      var regexp = ctx.code("regexp");
      var string = ctx.code("string");

      var code = `${string}.search(${regexp})`;

      return [code, Order.FUNCTION_CALL];
    },
  }),
];

export default {
  events,
  actions,
  values,
  components,
  contexts: [],

  blocks,
};
