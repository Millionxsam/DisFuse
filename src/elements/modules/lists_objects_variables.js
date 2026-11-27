/* =====================================================================
   Builder catalog: lists, objects and variables
   ---------------------------------------------------------------------
   Lists, objects (named values grouped together) and variables. The
   list blocks are Blockly's own in the block editor; positions here are
   one-based like Blockly's ("item #1" is the first item).

   Variables themselves are values: they're picked in the value picker,
   so "get variable" needs no entry of its own.
   ===================================================================== */

import { ANY, group, input } from "../define.js";

const { action, value, block } = group({ colour: "#BA59CE" });

/* An item of a list by position, for "Item from a list" and friends. */
function listPosition(ctx, list) {
  const at = ctx.input("AT");
  switch (ctx.raw("WHERE")) {
    case "FIRST":
      return { get: `${list}[0]`, take: `${list}.shift()` };
    case "LAST":
      return { get: `${list}.slice(-1)[0]`, take: `${list}.pop()` };
    case "FROM_END":
      return { get: `${list}.slice(-(${at}))[0]`, take: `${list}.splice(-(${at}), 1)[0]` };
    case "RANDOM":
      return {
        get: `((l) => l[Math.floor(Math.random() * l.length)])(${list})`,
        take: `((l) => l.splice(Math.floor(Math.random() * l.length), 1)[0])(${list})`,
      };
    default:
      return { get: `${list}[${at} - 1]`, take: `${list}.splice(${at} - 1, 1)[0]` };
  }
}

const LIST_PART = {
  key: "disfuseListPart",
  code: `function disfuseListPart(list, where1, at1, where2, at2) {
  list = [...(list ?? [])];
  const start = where1 === "FROM_START" ? at1 - 1 : where1 === "FROM_END" ? list.length - at1 : 0;
  const end = where2 === "FROM_START" ? at2 : where2 === "FROM_END" ? list.length - at2 + 1 : list.length;
  return list.slice(Math.max(0, start), end);
}`,
};

const events = [];

const actions = [
  action({
    id: "list_set_item",
    label: "Set or add an item in a list",
    description: "Replaces an item in a list, or adds a new one at a position.",
    category: "lists",
    icon: "fa-solid fa-pen-to-square",
    keywords: ["set item", "insert", "add to list", "push", "replace"],
    block: { type: "lists_setIndex", builtin: true },
    inputs: [
      input.slot("LIST", "List", "Array"),
      input.dropdown(
        "MODE",
        "What to do",
        [
          ["Replace the item", "SET"],
          ["Add a new item", "INSERT"],
        ],
        { default: "SET" },
      ),
      input.dropdown(
        "WHERE",
        "Where",
        [
          ["Item number", "FROM_START"],
          ["Item number, from the end", "FROM_END"],
          ["The first item", "FIRST"],
          ["The last item", "LAST"],
          ["A random item", "RANDOM"],
        ],
        { default: "FROM_START" },
      ),
      input.number("AT", "Number", {
        default: 1,
        showIf: { WHERE: ["FROM_START", "FROM_END"] },
        min: 1,
      }),
      input.text("TO", "Item", { default: "", accepts: [null] }),
    ],
    code: (ctx) => {
      const listCode = ctx.input("LIST");
      const l = `_list${ctx.uid}`;
      const at = ctx.input("AT");
      const value = ctx.input("TO");
      const insert = ctx.raw("MODE") === "INSERT";
      const index =
        {
          FIRST: "0",
          LAST: insert ? `${l}.length` : `${l}.length - 1`,
          FROM_END: insert ? `${l}.length - ${at} + 1` : `${l}.length - ${at}`,
          RANDOM: `Math.floor(Math.random() * ${l}.length)`,
        }[ctx.raw("WHERE")] ?? `${at} - 1`;
      return `{\nconst ${l} = ${listCode};\n${insert ? `${l}.splice(${index}, 0, ${value});` : `${l}[${index}] = ${value};`}\n}\n`;
    },
  }),
  action({
    id: "object_set_key",
    label: "Set a key in an object",
    description: "Adds a key to an object, or changes the value it already has.",
    category: "objects",
    icon: "fa-solid fa-pen",
    keywords: ["set key", "property", "assign"],
    block: {
      type: "object_setkey",
      text: ["set key: {key}", "to value: {value}", "in object: {object}"],
      parts: { value: { check: null } },
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["object"], message: "You must specify the object" },
        { type: "notEmpty", blockTypes: ["value"], message: "You must specify the value" },
      ],
    },
    inputs: [
      input.slot("object", "Object", "object"),
      input.text("key", "Key", { default: "" }),
      input.text("value", "Value", { default: "", accepts: [null] }),
    ],
    code: (ctx) => `${ctx.input("object")}[${ctx.input("key")}] = ${ctx.input("value")};\n`,
  }),
  action({
    id: "object_delete_key",
    label: "Remove a key from an object",
    description: "Deletes a key and its value from an object.",
    category: "objects",
    icon: "fa-solid fa-eraser",
    keywords: ["delete key", "remove property"],
    block: {
      type: "object_deletekey",
      text: ["delete key: {key}", "from object: {object}"],
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["object"], message: "You must specify the object" },
      ],
    },
    inputs: [input.slot("object", "Object", "object"), input.text("key", "Key", { default: "" })],
    code: (ctx) => `delete ${ctx.input("object")}[${ctx.input("key")}];\n`,
  }),
  action({
    id: "variable_set",
    label: "Set a variable",
    description: "Saves a value in a variable so you can use it later.",
    category: "variables",
    icon: "fa-solid fa-box",
    keywords: ["set", "save", "store", "variable", "assign"],
    block: { type: "variables_set", builtin: true },
    inputs: [
      input.variable("VAR", "Variable"),
      input.text("VALUE", "To", { default: "", accepts: [null] }),
    ],
    sentence: "Set {VAR} to {VALUE}",
    code: (ctx) => `${ctx.input("VAR")} = ${ctx.input("VALUE")};\n`,
  }),
  action({
    id: "variable_change",
    label: "Change a number variable by an amount",
    description: "Adds a number to a variable (use a negative number to take away).",
    category: "variables",
    icon: "fa-solid fa-plus-minus",
    keywords: ["increase", "decrease", "add", "increment", "counter"],
    block: { type: "math_change", builtin: true },
    inputs: [input.variable("VAR", "Variable"), input.number("DELTA", "By", { default: 1 })],
    sentence: "Change {VAR} by {DELTA}",
    code: (ctx) =>
      `${ctx.input("VAR")} = (typeof ${ctx.input("VAR")} === "number" ? ${ctx.input("VAR")} : 0) + ${ctx.input("DELTA")};\n`,
  }),
  action({
    id: "list_remove_item",
    label: "Remove an item from a list",
    description: "Takes an item out of a list: at a position, the first, the last or a random one.",
    category: "lists",
    icon: "fa-solid fa-trash-can",
    keywords: ["remove", "delete", "pop", "shift", "splice"],
    block: { type: "lists_getIndex", builtin: true, fields: { MODE: "REMOVE" } },
    inputs: [
      input.slot("VALUE", "List", "Array"),
      input.dropdown("WHERE", "Which item", [
        ["Item number", "FROM_START"],
        ["Item number, from the end", "FROM_END"],
        ["The first item", "FIRST"],
        ["The last item", "LAST"],
        ["A random item", "RANDOM"],
      ]),
      input.number("AT", "Number", {
        default: 1,
        min: 1,
        showIf: { WHERE: ["FROM_START", "FROM_END"] },
      }),
    ],
    code: (ctx) => listPosition(ctx, ctx.input("VALUE")).take + ";\n",
  }),
];

const values = [
  value({
    id: "list_create",
    label: "Create a list",
    description: "A list of items you add one by one.",
    category: "lists",
    icon: "fa-solid fa-list",
    keywords: ["list", "array", "create list with", "items"],
    block: { type: "lists_create_with", builtin: true },
    output: "Array",
    inputs: [
      input.group(
        "items",
        "Items",
        [input.text("item", "Item", { default: "", accepts: [null] })],
        { itemLabel: "Item" },
      ),
    ],
    code: (ctx) =>
      `[${ctx
        .group("items")
        .map((item) => item.input("item"))
        .join(", ")}]`,
  }),
  value({
    id: "list_repeat",
    label: "List of one item repeated",
    description: "A list made of the same item, a number of times.",
    category: "lists",
    icon: "fa-solid fa-clone",
    keywords: ["repeat", "fill", "array"],
    block: { type: "lists_repeat", builtin: true },
    output: "Array",
    inputs: [
      input.text("ITEM", "Item", { default: "", accepts: [null] }),
      input.number("NUM", "Times", { default: 5, min: 0 }),
    ],
    code: (ctx) => `Array(${ctx.input("NUM")}).fill(${ctx.input("ITEM")})`,
  }),
  value({
    id: "list_length",
    label: "Number of items in a list",
    description: "How many items a list has.",
    category: "lists",
    icon: "fa-solid fa-hashtag",
    keywords: ["length", "count", "size", "how many"],
    block: { type: "lists_length", builtin: true },
    output: "Number",
    inputs: [input.slot("VALUE", "List", "Array")],
    code: (ctx) => `${ctx.input("VALUE")}.length`,
  }),
  value({
    id: "list_is_empty",
    label: "List is empty?",
    description: "True if a list has no items.",
    category: "lists",
    icon: "fa-regular fa-square",
    keywords: ["empty", "no items"],
    block: { type: "lists_isEmpty", builtin: true },
    output: "Boolean",
    inputs: [input.slot("VALUE", "List", "Array")],
    code: (ctx) => `!${ctx.input("VALUE")}.length`,
  }),
  value({
    id: "list_position_of",
    label: "Position of an item in a list",
    description:
      "Where an item first (or last) appears in a list, counting from 1. Gives 0 if it's not there.",
    category: "lists",
    icon: "fa-solid fa-magnifying-glass-location",
    keywords: ["index of", "find", "position"],
    block: { type: "lists_indexOf", builtin: true },
    output: "Number",
    inputs: [
      input.slot("VALUE", "List", "Array"),
      input.dropdown(
        "END",
        "Find the",
        [
          ["First time", "FIRST"],
          ["Last time", "LAST"],
        ],
        { default: "FIRST" },
      ),
      input.text("FIND", "This item appears", { default: "", accepts: [null] }),
    ],
    code: (ctx) =>
      `(${ctx.input("VALUE")}.${ctx.raw("END") === "LAST" ? "lastIndexOf" : "indexOf"}(${ctx.input("FIND")}) + 1)`,
  }),
  value({
    id: "list_item",
    label: "Item from a list",
    description:
      "One item from a list: at a position, the first, the last or a random one. It can also take the item out of the list.",
    category: "lists",
    icon: "fa-solid fa-hand-pointer",
    keywords: ["get item", "index", "first", "last", "random", "pop", "shift"],
    block: { type: "lists_getIndex", builtin: true },
    output: ANY,
    inputs: [
      input.slot("VALUE", "List", "Array"),
      input.dropdown(
        "MODE",
        "Also",
        [
          ["Leave it in the list", "GET"],
          ["Take it out of the list", "GET_REMOVE"],
        ],
        { default: "GET" },
      ),
      input.dropdown(
        "WHERE",
        "Which item",
        [
          ["Item number", "FROM_START"],
          ["Item number, from the end", "FROM_END"],
          ["The first item", "FIRST"],
          ["The last item", "LAST"],
          ["A random item", "RANDOM"],
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
      const position = listPosition(ctx, ctx.input("VALUE"));
      return ctx.raw("MODE") === "GET_REMOVE" ? position.take : position.get;
    },
  }),
  value({
    id: "list_part",
    label: "Part of a list",
    description: "The items of a list between two positions.",
    category: "lists",
    icon: "fa-solid fa-scissors",
    keywords: ["sublist", "slice", "range"],
    block: { type: "lists_getSublist", builtin: true },
    output: "Array",
    inputs: [
      input.slot("LIST", "List", "Array"),
      input.dropdown(
        "WHERE1",
        "From",
        [
          ["Item number", "FROM_START"],
          ["Item number, from the end", "FROM_END"],
          ["The first item", "FIRST"],
        ],
        { default: "FROM_START" },
      ),
      input.number("AT1", "Start at item", {
        default: 1,
        showIf: { WHERE1: ["FROM_START", "FROM_END"] },
        min: 1,
      }),
      input.dropdown(
        "WHERE2",
        "To",
        [
          ["Item number", "FROM_START"],
          ["Item number, from the end", "FROM_END"],
          ["The last item", "LAST"],
        ],
        { default: "FROM_START" },
      ),
      input.number("AT2", "End at item", {
        default: 3,
        showIf: { WHERE2: ["FROM_START", "FROM_END"] },
        min: 1,
      }),
    ],
    setup: [LIST_PART],
    code: (ctx) =>
      `disfuseListPart(${ctx.input("LIST")}, ${ctx.input("WHERE1")}, ${ctx.input("AT1")}, ${ctx.input("WHERE2")}, ${ctx.input("AT2")})`,
  }),
  value({
    id: "list_split_join",
    label: "Split text or join a list",
    description:
      "Splits text into a list at a separator, or joins a list's items into text with a separator between them.",
    category: "lists",
    icon: "fa-solid fa-arrows-split-up-and-left",
    keywords: ["split", "join", "separator", "comma"],
    block: { type: "lists_split", builtin: true },
    output: ["Array", "String"],
    inputs: [
      input.dropdown(
        "MODE",
        "What to do",
        [
          ["Split text into a list", "SPLIT"],
          ["Join a list into text", "JOIN"],
        ],
        { default: "SPLIT" },
      ),
      input.text("INPUT", "Text or list", { default: "", accepts: ["String", "Array"] }),
      input.text("DELIM", "Separator", {
        default: ",",
        help: "The text between items, like a comma.",
      }),
    ],
    code: (ctx) =>
      `${ctx.input("INPUT")}.${ctx.raw("MODE") === "JOIN" ? "join" : "split"}(${ctx.input("DELIM")})`,
  }),
  value({
    id: "list_sort",
    label: "Sort a list",
    description: "A copy of a list in order: by number, or alphabetically.",
    category: "lists",
    icon: "fa-solid fa-arrow-down-a-z",
    keywords: ["sort", "order", "alphabetical", "ascending", "descending"],
    block: { type: "lists_sort", builtin: true },
    output: "Array",
    inputs: [
      input.slot("LIST", "List", "Array"),
      input.dropdown(
        "TYPE",
        "Sort",
        [
          ["By number", "NUMERIC"],
          ["Alphabetically", "TEXT"],
          ["Alphabetically, ignoring capitals", "IGNORE_CASE"],
        ],
        { default: "NUMERIC" },
      ),
      input.dropdown(
        "DIRECTION",
        "Order",
        [
          ["Smallest first (A to Z)", "1"],
          ["Largest first (Z to A)", "-1"],
        ],
        { default: "1" },
      ),
    ],
    code: (ctx) => {
      const dir = ctx.raw("DIRECTION") === "-1" ? -1 : 1;
      const compare = {
        NUMERIC: `(a, b) => (Number(a) - Number(b)) * ${dir}`,
        TEXT: `(a, b) => (String(a) > String(b) ? 1 : String(a) < String(b) ? -1 : 0) * ${dir}`,
        IGNORE_CASE: `(a, b) => (String(a).toLowerCase() > String(b).toLowerCase() ? 1 : String(a).toLowerCase() < String(b).toLowerCase() ? -1 : 0) * ${dir}`,
      }[ctx.raw("TYPE")];
      return `[...${ctx.input("LIST")}].sort(${compare})`;
    },
  }),
  value({
    id: "list_reverse",
    label: "Reverse a list",
    description: "A copy of a list with its items in the opposite order.",
    category: "lists",
    icon: "fa-solid fa-arrow-rotate-left",
    keywords: ["reverse", "backwards", "flip"],
    block: { type: "lists_reverse", builtin: true },
    output: "Array",
    inputs: [input.slot("LIST", "List", "Array")],
    code: (ctx) => `[...${ctx.input("LIST")}].reverse()`,
  }),
  value({
    id: "list_merge",
    label: "Join two lists",
    description: "One list with the items of both lists.",
    category: "lists",
    icon: "fa-solid fa-object-group",
    keywords: ["merge", "concat", "combine"],
    block: {
      type: "list_merge",
      text: ["merge list {list}", "with {list2}"],
      colour: "#9966ff",
      inline: true,
    },
    output: "Array",
    inputs: [
      input.slot("list", "First list", "Array"),
      input.slot("list2", "Second list", "Array"),
    ],
    code: (ctx) => `${ctx.input("list")}.concat(${ctx.input("list2")})`,
  }),
  value({
    id: "list_filter",
    label: "Filter a list",
    description: "The items of a list that pass a check. Use Current item in the check.",
    category: "lists",
    icon: "fa-solid fa-filter",
    keywords: ["filter", "where", "only", "keep"],
    block: {
      type: "list_filter",
      text: ["filter list {list}", "by {method}"],
      colour: "#9966ff",
      inline: true,
      tooltip: "Remove all items in a list which doesn't match the boolean",
    },
    output: "Array",
    inputs: [
      input.slot("list", "List", "Array"),
      input.boolean("method", "Keep items where", {
        provides: [
          {
            key: "item",
            label: "Current item",
            type: ANY,
            code: "filterItem",
            block: {
              type: "list_filter_item",
              text: "item in loop {name}",
              parts: { name: { part: "dummy" } },
              colour: "#9966ff",
              inline: true,
              also: ["list_find"],
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["list_filter", "list_find"],
                  message:
                    "This block must be inside a 'filter list' or 'find first in list' block",
                },
              ],
            },
          },
        ],
      }),
    ],
    code: (ctx) =>
      `await asyncFilter(${ctx.input("list")}, async (filterItem) => ${ctx.input("method")})`,
  }),
  value({
    id: "list_find",
    label: "First item in a list that matches",
    description: "The first item of a list that passes a check. Use Current item in the check.",
    category: "lists",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["find", "first", "search", "match"],
    block: {
      type: "list_find",
      text: ["find first in list {list}", "that matches {method}"],
      colour: "#9966ff",
      inline: true,
      tooltip: "Returns the first item in a list that matches the boolean",
    },
    output: ANY,
    inputs: [
      input.slot("list", "List", "Array"),
      input.boolean("method", "Find the first item where", {
        provides: [{ key: "item", label: "Current item", type: ANY, code: "filterItem" }],
      }),
    ],
    code: (ctx) =>
      `await asyncFind(${ctx.input("list")}, async (filterItem) => ${ctx.input("method")})`,
  }),
  value({
    id: "object_create",
    label: "Create an object",
    description: "Named values grouped together, like a name and a score.",
    category: "objects",
    icon: "fa-solid fa-cube",
    keywords: ["object", "json", "dictionary", "keys", "create new object"],
    block: {
      type: "object_new",
      text: ["create new object", "keys: {keys}"],
      parts: { keys: { check: "keyBlocks" } },
    },
    output: "object",
    inputs: [
      input.group(
        "keys",
        "Keys",
        [
          input.text("key", "Key", { default: "", allowValues: false, placeholder: "name" }),
          input.text("value", "Value", { default: "", accepts: [null] }),
        ],
        {
          itemLabel: "Key",
          block: {
            type: "object_addkey",
            text: "add key {key} with value {value}",
            parts: { key: { part: "text", value: "key" }, value: { check: null } },
            previous: "keyBlocks",
            next: "keyBlocks",
            restrictions: [
              {
                type: "surroundParent",
                blockTypes: ["object_new"],
                message: 'This block must be under "create new object" block',
              },
              { type: "notEmpty", blockTypes: ["value"], message: "You must specify the value" },
            ],
          },
        },
      ),
    ],
    code: (ctx) =>
      `{ ${ctx
        .group("keys")
        .map((item) => `${JSON.stringify(String(item.raw("key") ?? ""))}: ${item.input("value")}`)
        .join(", ")} }`,
  }),
  value({
    id: "object_to_json",
    label: "Object as JSON text",
    description: "Writes an object out as JSON text, for saving or sending it somewhere.",
    category: "objects",
    icon: "fa-solid fa-file-code",
    keywords: ["json", "stringify", "text"],
    block: {
      type: "object_stringify",
      text: ["convert object {object}", "to JSON string"],
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["object"], message: "You must specify the object" },
      ],
    },
    output: "String",
    inputs: [input.slot("object", "Object", "object")],
    code: (ctx) => `JSON.stringify(${ctx.input("object")})`,
  }),
  value({
    id: "object_from_json",
    label: "JSON text as an object",
    description: "Reads JSON text back into an object.",
    category: "objects",
    icon: "fa-solid fa-file-import",
    keywords: ["json", "parse"],
    block: {
      type: "object_parse",
      text: ["convert JSON string {string}", "to object"],
      inline: true,
    },
    output: "object",
    inputs: [input.text("string", "JSON text", { default: "{}" })],
    code: (ctx) => `JSON.parse(${ctx.input("string")})`,
  }),
  value({
    id: "object_has",
    label: "Object has a key or value?",
    description: "True if an object has a key with that name, or a value equal to it.",
    category: "objects",
    icon: "fa-solid fa-circle-question",
    keywords: ["has key", "contains", "includes", "hasOwnProperty"],
    block: {
      type: "object_has",
      text: ["is {item} {string}", "in object {object}", "?"],
      parts: {
        item: {
          options: [
            ["key", "key"],
            ["value", "value"],
          ],
        },
      },
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["object"], message: "You must specify the object" },
      ],
    },
    output: "Boolean",
    inputs: [
      input.slot("object", "Object", "object"),
      input.dropdown(
        "item",
        "Look for a",
        [
          ["Key", "key"],
          ["Value", "value"],
        ],
        { default: "key" },
      ),
      input.text("string", "Named / equal to", { default: "", accepts: [null] }),
    ],
    code: (ctx) =>
      ctx.raw("item") === "value"
        ? `Object.values(${ctx.input("object")}).includes(${ctx.input("string")})`
        : `Object.prototype.hasOwnProperty.call(${ctx.input("object")}, ${ctx.input("string")})`,
  }),
  value({
    id: "object_key_count",
    label: "Number of keys in an object",
    description: "How many keys an object has.",
    category: "objects",
    icon: "fa-solid fa-hashtag",
    keywords: ["length", "size", "count"],
    block: {
      type: "object_length",
      text: "length of object: {object}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["object"], message: "You must specify the object" },
      ],
    },
    output: "Number",
    inputs: [input.slot("object", "Object", "object")],
    code: (ctx) => `Object.keys(${ctx.input("object")}).length`,
  }),
  value({
    id: "object_keys",
    label: "Keys of an object",
    description: "A list of an object's key names.",
    category: "objects",
    icon: "fa-solid fa-key",
    keywords: ["keys", "names", "properties"],
    block: {
      type: "object_keys",
      text: "get keys list of object: {object}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["object"], message: "You must specify the object" },
      ],
    },
    output: "Array",
    inputs: [input.slot("object", "Object", "object")],
    code: (ctx) => `Object.keys(${ctx.input("object")})`,
  }),
  value({
    id: "object_values",
    label: "Values of an object",
    description: "A list of an object's values.",
    category: "objects",
    icon: "fa-solid fa-list-ul",
    keywords: ["values"],
    block: {
      type: "object_values",
      text: "get values list of object: {object}",
      inline: true,
      restrictions: [
        { type: "notEmpty", blockTypes: ["object"], message: "You must specify the object" },
      ],
    },
    output: "Array",
    inputs: [input.slot("object", "Object", "object")],
    code: (ctx) => `Object.values(${ctx.input("object")})`,
  }),
];

const components = [];

const blocks = [
  block({
    type: "object_merge",
    text: ["merge object {object1}", "with object {object2}"],
    parts: {
      object1: { part: "value", check: "object" },
      object2: { part: "value", check: "object" },
    },
    inline: true,
    output: "object",
    restrictions: [
      {
        type: "notEmpty",
        blockTypes: ["object1", "object2"],
        message: "You must specify the first and second object",
      },
    ],
    code: (ctx) => {
      const { Order } = ctx;
      var object1 = ctx.code("object1");
      var object2 = ctx.code("object2");

      return [`Object.assign({}, ${object1}, ${object2})`, Order.NONE];
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
