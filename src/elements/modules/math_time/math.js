/* Builder catalog: the Math toolbox category.

   Most of these blocks are the block editor's built-in math blocks, so
   the code below follows the built-in JavaScript generators (and
   src/blocks/math.js for "to number"). The helper functions the
   built-in generators add to the bot (mathRandomInt, mathMean...) are
   emitted with `setup` under the same names. */

import { ANY, group, input } from "../../define.js";

const { value } = group({ colour: "#cfa23a" });

/* ---------------------------------------------------------------------
   Helper functions, as the built-in generators write them
   --------------------------------------------------------------------- */

const MATH_IS_PRIME = {
  key: "mathIsPrime",
  code: `function mathIsPrime(n) {
  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if (n == 2 || n == 3) {
    return true;
  }
  // False if n is NaN, negative, is 1, or not whole.
  // And false if n is divisible by 2 or 3.
  if (isNaN(n) || n <= 1 || n % 1 !== 0 || n % 2 === 0 || n % 3 === 0) {
    return false;
  }
  // Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for (var x = 6; x <= Math.sqrt(n) + 1; x += 6) {
    if (n % (x - 1) === 0 || n % (x + 1) === 0) {
      return false;
    }
  }
  return true;
}`,
};

const MATH_MEAN = {
  key: "mathMean",
  code: `function mathMean(myList) {
  return myList.reduce(function(x, y) {return x + y;}, 0) / myList.length;
}`,
};

const MATH_MEDIAN = {
  key: "mathMedian",
  code: `function mathMedian(myList) {
  var localList = myList.filter(function (x) {return typeof x === 'number';});
  if (!localList.length) return null;
  localList.sort(function(a, b) {return b - a;});
  if (localList.length % 2 === 0) {
    return (localList[localList.length / 2 - 1] + localList[localList.length / 2]) / 2;
  } else {
    return localList[(localList.length - 1) / 2];
  }
}`,
};

const MATH_MODES = {
  key: "mathModes",
  code: `function mathModes(values) {
  var modes = [];
  var counts = [];
  var maxCount = 0;
  for (var i = 0; i < values.length; i++) {
    var value = values[i];
    var found = false;
    var thisCount;
    for (var j = 0; j < counts.length; j++) {
      if (counts[j][0] === value) {
        thisCount = ++counts[j][1];
        found = true;
        break;
      }
    }
    if (!found) {
      counts.push([value, 1]);
      thisCount = 1;
    }
    maxCount = Math.max(thisCount, maxCount);
  }
  for (var j = 0; j < counts.length; j++) {
    if (counts[j][1] === maxCount) {
        modes.push(counts[j][0]);
    }
  }
  return modes;
}`,
};

const MATH_STANDARD_DEVIATION = {
  key: "mathStandardDeviation",
  code: `function mathStandardDeviation(numbers) {
  var n = numbers.length;
  if (!n) return null;
  var mean = numbers.reduce(function(x, y) {return x + y;}) / n;
  var variance = 0;
  for (var j = 0; j < n; j++) {
    variance += Math.pow(numbers[j] - mean, 2);
  }
  variance = variance / n;
  return Math.sqrt(variance);
}`,
};

const MATH_RANDOM_LIST = {
  key: "mathRandomList",
  code: `function mathRandomList(list) {
  var x = Math.floor(Math.random() * list.length);
  return list[x];
}`,
};

const MATH_RANDOM_INT = {
  key: "mathRandomInt",
  code: `function mathRandomInt(a, b) {
  if (a > b) {
    // Swap a and b to ensure a is smaller.
    var c = a;
    a = b;
    b = c;
  }
  return Math.floor(Math.random() * (b - a + 1) + a);
}`,
};

/* ---------------------------------------------------------------------
   Shared code
   --------------------------------------------------------------------- */

/** The built-in generator for math_single, math_round and math_trig. */
function singleCode(operator, arg) {
  switch (operator) {
    case "NEG":
      /* --3 is not legal JavaScript. */
      return "-" + (arg[0] === "-" ? " " + arg : arg);
    case "ABS":
      return `Math.abs(${arg})`;
    case "ROOT":
      return `Math.sqrt(${arg})`;
    case "LN":
      return `Math.log(${arg})`;
    case "EXP":
      return `Math.exp(${arg})`;
    case "POW10":
      return `Math.pow(10,${arg})`;
    case "ROUND":
      return `Math.round(${arg})`;
    case "ROUNDUP":
      return `Math.ceil(${arg})`;
    case "ROUNDDOWN":
      return `Math.floor(${arg})`;
    case "SIN":
      return `Math.sin(${arg} / 180 * Math.PI)`;
    case "COS":
      return `Math.cos(${arg} / 180 * Math.PI)`;
    case "TAN":
      return `Math.tan(${arg} / 180 * Math.PI)`;
    case "LOG10":
      return `Math.log(${arg}) / Math.log(10)`;
    case "ASIN":
      return `Math.asin(${arg}) / Math.PI * 180`;
    case "ACOS":
      return `Math.acos(${arg}) / Math.PI * 180`;
    case "ATAN":
      return `Math.atan(${arg}) / Math.PI * 180`;
    default:
      throw new Error(`Unknown math operation "${operator}"`);
  }
}

/** A list slot's code, or an empty list when nothing is placed there. */
function listCode(ctx) {
  return ctx.isValue("LIST") ? ctx.input("LIST") : "[]";
}

/* ---------------------------------------------------------------------
   Numbers
   --------------------------------------------------------------------- */

const number = value({
  id: "math_number",
  label: "Number",
  description: "A number you type in.",
  category: "math",
  group: "Numbers",
  icon: "fa-solid fa-hashtag",
  keywords: ["number", "digit", "amount", "integer", "decimal"],
  block: { type: "math_number", builtin: true },
  output: "Number",
  inputs: [input.number("NUM", "Number", { default: 0, allowValues: false })],
  code: (ctx) => ctx.input("NUM"),
});

const toNumber = value({
  id: "math_to_number",
  label: "Value as a number",
  description: 'Turns a value, like the text "42", into a number you can do math with.',
  category: "math",
  group: "Numbers",
  icon: "fa-solid fa-arrow-right-arrow-left",
  keywords: ["to number", "convert", "parse", "text to number", "string to number"],
  block: { type: "math_toNumber", text: ["{from}", "to number"] },
  output: "Number",
  inputs: [input.slot("from", "Value", ANY)],
  code: (ctx) => `Number(${ctx.input("from")})`,
});

/* ---------------------------------------------------------------------
   Calculations
   --------------------------------------------------------------------- */

const ARITHMETIC_OPERATORS = {
  ADD: " + ",
  MINUS: " - ",
  MULTIPLY: " * ",
  DIVIDE: " / ",
};

const arithmetic = value({
  id: "math_arithmetic",
  label: "Calculate with two numbers",
  description:
    "Adds, subtracts, multiplies or divides two numbers, or raises one to the power of the other.",
  category: "math",
  group: "Calculations",
  icon: "fa-solid fa-calculator",
  keywords: [
    "add",
    "plus",
    "subtract",
    "minus",
    "multiply",
    "times",
    "divide",
    "power",
    "exponent",
    "sum",
    "arithmetic",
    "+",
    "-",
    "*",
    "/",
    "^",
  ],
  block: { type: "math_arithmetic", builtin: true },
  output: "Number",
  inputs: [
    input.number("A", "First number", { default: 1 }),
    input.dropdown("OP", "Operation", [
      ["+ (add)", "ADD"],
      ["- (subtract)", "MINUS"],
      ["× (multiply)", "MULTIPLY"],
      ["÷ (divide)", "DIVIDE"],
      ["^ (to the power of)", "POWER"],
    ]),
    input.number("B", "Second number", { default: 1 }),
  ],
  code: (ctx) => {
    const a = ctx.input("A");
    const b = ctx.input("B");
    const operator = ctx.raw("OP");
    if (operator === "POWER") return `Math.pow(${a}, ${b})`;
    return a + (ARITHMETIC_OPERATORS[operator] ?? " + ") + b;
  },
});

const modulo = value({
  id: "math_modulo",
  label: "Remainder of a division",
  description:
    "What is left over after dividing one number by another. The remainder of 64 ÷ 10 is 4.",
  category: "math",
  group: "Calculations",
  icon: "fa-solid fa-percent",
  keywords: ["remainder", "modulo", "mod", "%", "divide", "left over"],
  block: { type: "math_modulo", builtin: true },
  output: "Number",
  inputs: [
    input.number("DIVIDEND", "Number", { default: 64 }),
    input.number("DIVISOR", "Divided by", { default: 10 }),
  ],
  code: (ctx) => `${ctx.input("DIVIDEND")} % ${ctx.input("DIVISOR")}`,
});

const round = value({
  id: "math_round",
  label: "Rounded number",
  description: "Rounds a number to the nearest whole number, or always up, or always down.",
  category: "math",
  group: "Calculations",
  icon: "fa-solid fa-arrows-up-down",
  keywords: ["round", "round up", "round down", "ceil", "ceiling", "floor", "whole number"],
  block: { type: "math_round", builtin: true },
  output: "Number",
  inputs: [
    input.dropdown("OP", "Round", [
      ["To the nearest", "ROUND"],
      ["Up", "ROUNDUP"],
      ["Down", "ROUNDDOWN"],
    ]),
    input.number("NUM", "Number", { default: 3.1 }),
  ],
  code: (ctx) => singleCode(ctx.raw("OP"), ctx.input("NUM")),
});

const single = value({
  id: "math_single",
  label: "Square root and more",
  description: "The square root, absolute value, negative, logarithm or a power of a number.",
  category: "math",
  group: "Calculations",
  icon: "fa-solid fa-square-root-variable",
  keywords: [
    "square root",
    "sqrt",
    "absolute",
    "abs",
    "negative",
    "negate",
    "ln",
    "log",
    "logarithm",
    "log10",
    "exp",
    "e^",
    "10^",
    "power",
  ],
  block: { type: "math_single", builtin: true },
  output: "Number",
  inputs: [
    input.dropdown("OP", "Operation", [
      ["Square root", "ROOT"],
      ["Absolute value", "ABS"],
      ["Negative (-)", "NEG"],
      ["Natural log (ln)", "LN"],
      ["Log base 10", "LOG10"],
      ["e to the power of", "EXP"],
      ["10 to the power of", "POW10"],
    ]),
    input.number("NUM", "Number", { default: 9 }),
  ],
  code: (ctx) => singleCode(ctx.raw("OP"), ctx.input("NUM")),
});

const constrain = value({
  id: "math_constrain",
  label: "Number kept within a range",
  description:
    "The number, raised to the lowest value if it's below it, or lowered to the highest value if it's above it.",
  category: "math",
  group: "Calculations",
  icon: "fa-solid fa-arrows-left-right-to-line",
  keywords: ["constrain", "clamp", "limit", "between", "range", "min", "max"],
  block: { type: "math_constrain", builtin: true },
  output: "Number",
  inputs: [
    input.number("VALUE", "Number", { default: 50 }),
    input.number("LOW", "Lowest", { default: 1 }),
    input.number("HIGH", "Highest", { default: 100 }),
  ],
  code: (ctx) =>
    `Math.min(Math.max(${ctx.input("VALUE")}, ${ctx.input("LOW")}), ${ctx.input("HIGH")})`,
});

/* ---------------------------------------------------------------------
   Checks
   --------------------------------------------------------------------- */

const PROPERTY_SUFFIXES = {
  EVEN: " % 2 === 0",
  ODD: " % 2 === 1",
  WHOLE: " % 1 === 0",
  POSITIVE: " > 0",
  NEGATIVE: " < 0",
};

const numberProperty = value({
  id: "math_number_check",
  label: "Number is even, odd, whole...?",
  description:
    "True if a number is even, odd, prime, whole, positive, negative, or can be divided by another number.",
  category: "math",
  group: "Checks",
  icon: "fa-solid fa-check-double",
  keywords: [
    "is even",
    "is odd",
    "is prime",
    "is whole",
    "is positive",
    "is negative",
    "divisible by",
    "integer",
  ],
  block: { type: "math_number_property", builtin: true },
  output: "Boolean",
  inputs: [
    input.number("NUMBER_TO_CHECK", "Number", { default: 0 }),
    input.dropdown("PROPERTY", "Check that it", [
      ["Is even", "EVEN"],
      ["Is odd", "ODD"],
      ["Is prime", "PRIME"],
      ["Is whole", "WHOLE"],
      ["Is positive", "POSITIVE"],
      ["Is negative", "NEGATIVE"],
      ["Can be divided by", "DIVISIBLE_BY"],
    ]),
    input.number("DIVISOR", "Divided by", {
      default: 2,
      showIf: { PROPERTY: "DIVISIBLE_BY" },
    }),
  ],
  setup: [MATH_IS_PRIME],
  code: (ctx) => {
    const property = ctx.raw("PROPERTY");
    const value = ctx.input("NUMBER_TO_CHECK");
    if (property === "PRIME") return `mathIsPrime(${value})`;
    if (property === "DIVISIBLE_BY") return `${value} % ${ctx.input("DIVISOR")} === 0`;
    return value + (PROPERTY_SUFFIXES[property] ?? PROPERTY_SUFFIXES.EVEN);
  },
});

/* ---------------------------------------------------------------------
   Lists of numbers
   --------------------------------------------------------------------- */

const LIST_HELPERS = {
  AVERAGE: MATH_MEAN,
  MEDIAN: MATH_MEDIAN,
  STD_DEV: MATH_STANDARD_DEVIATION,
  RANDOM: MATH_RANDOM_LIST,
};

const onList = value({
  id: "math_list_summary",
  label: "Sum, average and more of a list",
  description:
    "Works out the sum, smallest, largest, average, median or standard deviation of a list of numbers, or picks a random item from it.",
  category: "math",
  group: "Lists of numbers",
  icon: "fa-solid fa-chart-simple",
  keywords: [
    "sum of list",
    "total",
    "min",
    "max",
    "smallest",
    "largest",
    "average",
    "mean",
    "median",
    "standard deviation",
    "random item",
  ],
  block: { type: "math_on_list", builtin: true },
  output: "Number",
  inputs: [
    input.dropdown("OP", "Work out the", [
      ["Sum", "SUM"],
      ["Smallest number", "MIN"],
      ["Largest number", "MAX"],
      ["Average", "AVERAGE"],
      ["Median", "MEDIAN"],
      ["Standard deviation", "STD_DEV"],
      ["Random item", "RANDOM"],
    ]),
    input.slot("LIST", "Of the list", "Array"),
  ],
  /* Only the helper the chosen operation calls is used, but the setup
     list is fixed per definition, so all four come along. They are small
     plain functions and change nothing else in the bot. */
  setup: Object.values(LIST_HELPERS),
  code: (ctx) => {
    const operator = ctx.raw("OP");
    const list = listCode(ctx);
    switch (operator) {
      case "SUM":
        return `${list}.reduce(function(x, y) {return x + y;}, 0)`;
      case "MIN":
        return `Math.min.apply(null, ${list})`;
      case "MAX":
        return `Math.max.apply(null, ${list})`;
      default: {
        const helper = LIST_HELPERS[operator];
        if (!helper) throw new Error(`Unknown list operation "${operator}"`);
        return `${helper.key}(${list})`;
      }
    }
  },
});

const listModes = value({
  id: "math_list_modes",
  label: "Most common items in a list",
  description: "A list of the item or items that appear the most times in a list.",
  category: "math",
  group: "Lists of numbers",
  icon: "fa-solid fa-ranking-star",
  keywords: ["modes of list", "mode", "most common", "most frequent", "popular"],
  block: { type: "math_on_list", builtin: true },
  output: "Array",
  inputs: [input.slot("LIST", "List", "Array")],
  setup: [MATH_MODES],
  code: (ctx) => `mathModes(${listCode(ctx)})`,
});

/* ---------------------------------------------------------------------
   Random
   --------------------------------------------------------------------- */

const randomInt = value({
  id: "math_random_int",
  label: "Random whole number",
  description: "A random whole number between two numbers, including both of them.",
  category: "math",
  group: "Random",
  icon: "fa-solid fa-dice",
  keywords: ["random integer", "random number", "dice", "roll", "chance", "pick"],
  block: { type: "math_random_int", builtin: true },
  output: "Number",
  inputs: [
    input.number("FROM", "From", { default: 1 }),
    input.number("TO", "To", { default: 100 }),
  ],
  setup: [MATH_RANDOM_INT],
  code: (ctx) => `mathRandomInt(${ctx.input("FROM")}, ${ctx.input("TO")})`,
});

const randomFloat = value({
  id: "math_random_float",
  label: "Random decimal between 0 and 1",
  description: "A random number from 0 up to (but not including) 1, like 0.4271.",
  category: "math",
  group: "Random",
  icon: "fa-solid fa-dice-d6",
  keywords: ["random fraction", "random decimal", "random", "chance", "percent"],
  block: { type: "math_random_float", builtin: true },
  output: "Number",
  code: () => "Math.random()",
});

/* ---------------------------------------------------------------------
   Advanced
   --------------------------------------------------------------------- */

const trig = value({
  id: "math_trig",
  label: "Sine, cosine or tangent",
  description:
    "The sine, cosine or tangent of an angle, or the angle for one of them. Angles are in degrees.",
  category: "math",
  group: "Advanced",
  icon: "fa-solid fa-wave-square",
  keywords: ["sin", "cos", "tan", "asin", "acos", "atan", "trigonometry", "angle", "degrees"],
  block: { type: "math_trig", builtin: true },
  output: "Number",
  inputs: [
    input.dropdown("OP", "Function", [
      ["Sine (sin)", "SIN"],
      ["Cosine (cos)", "COS"],
      ["Tangent (tan)", "TAN"],
      ["Arcsine (asin)", "ASIN"],
      ["Arccosine (acos)", "ACOS"],
      ["Arctangent (atan)", "ATAN"],
    ]),
    input.number("NUM", "Of", {
      default: 45,
      help: "Sine, cosine and tangent take an angle in degrees. The others give one.",
    }),
  ],
  code: (ctx) => singleCode(ctx.raw("OP"), ctx.input("NUM")),
});

const CONSTANTS = {
  PI: "Math.PI",
  E: "Math.E",
  GOLDEN_RATIO: "(1 + Math.sqrt(5)) / 2",
  SQRT2: "Math.SQRT2",
  SQRT1_2: "Math.SQRT1_2",
  INFINITY: "Infinity",
};

const constant = value({
  id: "math_constant",
  label: "Math constant",
  description: "A well-known number like pi (3.141…), e (2.718…) or infinity.",
  category: "math",
  group: "Advanced",
  icon: "fa-solid fa-infinity",
  keywords: ["pi", "π", "e", "golden ratio", "phi", "square root of 2", "infinity", "∞"],
  block: { type: "math_constant", builtin: true },
  output: "Number",
  inputs: [
    input.dropdown("CONSTANT", "Constant", [
      ["π (pi, 3.141…)", "PI"],
      ["e (2.718…)", "E"],
      ["φ (golden ratio, 1.618…)", "GOLDEN_RATIO"],
      ["√2 (1.414…)", "SQRT2"],
      ["√½ (0.707…)", "SQRT1_2"],
      ["∞ (infinity)", "INFINITY"],
    ]),
  ],
  code: (ctx) => CONSTANTS[ctx.raw("CONSTANT")] ?? CONSTANTS.PI,
});

const atan2 = value({
  id: "math_atan2",
  label: "Angle of a point",
  description: "The angle from the center to the point (X, Y), in degrees from -180 to 180.",
  category: "math",
  group: "Advanced",
  icon: "fa-solid fa-compass-drafting",
  keywords: ["atan2", "arctangent", "angle", "point", "degrees", "direction"],
  block: { type: "math_atan2", builtin: true },
  output: "Number",
  inputs: [input.number("X", "X", { default: 1 }), input.number("Y", "Y", { default: 1 })],
  code: (ctx) => `Math.atan2(${ctx.input("Y")}, ${ctx.input("X")}) / Math.PI * 180`,
});

export const mathValues = [
  number,
  toNumber,
  arithmetic,
  modulo,
  round,
  single,
  constrain,
  numberProperty,
  onList,
  listModes,
  randomInt,
  randomFloat,
  trig,
  constant,
  atan2,
];
