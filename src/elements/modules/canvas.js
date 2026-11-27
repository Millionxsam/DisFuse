/* =====================================================================
   Builder catalog: canvas (drawing pictures)
   ---------------------------------------------------------------------
   Drawing pictures: shapes, text and other pictures on a blank
   canvas, which can then be sent in a message as a file. Drawing steps
   only work inside a "Make a picture to draw on" step.
   ===================================================================== */

import { group, input } from "../define.js";

const { action, block } = group({ colour: "#4C9F70" });

const events = [];

const actions = [
  action({
    id: "canvas_draw",
    label: "Make a picture to draw on",
    description:
      "Starts a blank picture. Add drawing steps inside, then send the picture in a message as a file.",
    category: "canvas",
    group: "Picture",
    icon: "fa-solid fa-palette",
    keywords: ["canvas", "image", "draw", "picture", "generate image", "welcome card"],
    block: {
      type: "canvas_createCanvas",
      text: ["create new canvas", "width: {WIDTH}", "height: {HEIGHT}", "then {DO}"],
      tooltip:
        "Creates a new canvas with the specified width and height, then runs the given code.",
      previous: null,
      next: null,
    },
    inputs: [
      input.number("WIDTH", "Width", { default: 500, min: 1, max: 4096, integer: true }),
      input.number("HEIGHT", "Height", { default: 500, min: 1, max: 4096, integer: true }),
    ],
    branches: [
      {
        key: "DO",
        label: "Drawing steps",
        inline: true,
        provides: [
          {
            key: "picture",
            label: "The picture",
            type: "buffer",
            code: 'canvas.toBuffer("image/png")',
            description: "Add it to a message as a file. Use it after your drawing steps.",
            block: {
              type: "canvas_asData",
              text: "get canvas as data",
              output: ["String", "buffer"],
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["canvas_createCanvas"],
                  message: 'This block must be inside a "create new canvas" block.',
                },
              ],
            },
          },
          {
            key: "width",
            label: "Picture width",
            type: "Number",
            code: "canvas.width",
            block: {
              type: "canvas_width",
              text: "canvas width",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["canvas_createCanvas"],
                  message: 'This block must be inside a "create new canvas" block.',
                },
              ],
            },
          },
          {
            key: "height",
            label: "Picture height",
            type: "Number",
            code: "canvas.height",
            block: {
              type: "canvas_height",
              text: "canvas height",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["canvas_createCanvas"],
                  message: 'This block must be inside a "create new canvas" block.',
                },
              ],
            },
          },
        ],
        contexts: ["canvas"],
      },
    ],
    dependencies: ["@napi-rs/canvas"],
    code: (ctx) =>
      `{\nconst canvas = _napi_rs_canvas.createCanvas(${ctx.input("WIDTH")}, ${ctx.input("HEIGHT")});\nconst ctx = canvas.getContext("2d");\n${ctx.branch("DO")}}\n`,
  }),
  action({
    id: "canvas_fill_color",
    label: "Set the fill color for drawing",
    description: "The color filled shapes and text use from here on.",
    category: "canvas",
    group: "Colors and lines",
    icon: "fa-solid fa-fill-drip",
    keywords: ["fill", "color", "colour"],
    block: {
      type: "canvas_setFillColor",
      text: "set fill color to {COLOR}",
      tooltip: "Sets the fill color for the canvas.",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [input.colour("COLOR", "Color", { default: "#5865f2" })],
    code: (ctx) => `canvas.getContext("2d").fillStyle = ${ctx.input("COLOR")};\n`,
  }),
  action({
    id: "canvas_line_color",
    label: "Set the line color for drawing",
    description: "The color lines and outlines use from here on.",
    category: "canvas",
    group: "Colors and lines",
    icon: "fa-solid fa-pen",
    keywords: ["stroke", "outline", "line color"],
    block: {
      type: "canvas_setStrokeColor",
      text: "set stroke color to {COLOR}",
      tooltip: "Sets the stroke color for the canvas.",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [input.colour("COLOR", "Color", { default: "#ffffff" })],
    code: (ctx) => `canvas.getContext("2d").strokeStyle = ${ctx.input("COLOR")};\n`,
  }),
  action({
    id: "canvas_line_width",
    label: "Set the line thickness for drawing",
    description: "How thick lines and outlines are from here on, in pixels.",
    category: "canvas",
    group: "Colors and lines",
    icon: "fa-solid fa-grip-lines",
    keywords: ["line width", "thickness", "stroke width"],
    block: {
      type: "canvas_setLineWidth",
      text: "set line width to {WIDTH}",
      tooltip: "Sets the width of the stroke.",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [input.number("WIDTH", "Thickness", { default: 2, min: 0 })],
    code: (ctx) => `canvas.getContext("2d").lineWidth = ${ctx.input("WIDTH")};\n`,
  }),
  action({
    id: "canvas_font",
    label: "Set the font for text on the picture",
    description: "The font text uses from here on.",
    category: "canvas",
    group: "Text",
    icon: "fa-solid fa-font",
    keywords: ["font", "text size", "typeface"],
    block: {
      type: "canvas_setFont",
      text: "set font to {FONT}",
      tooltip: "Sets font for text.",
      code: (ctx) => `canvas.getContext("2d").font = ${ctx.input("FONT")};\n`,
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [
      input.number("size", "Size", { default: 30, min: 1 }),
      input.text("FONT", "Font", {
        default: "sans-serif",
        help: "Fonts on the computer the bot runs on, like sans-serif, serif or monospace.",
      }),
      input.boolean("bold", "Bold", { default: false, allowValues: false }),
    ],
    code: (ctx) =>
      `canvas.getContext("2d").font = ${ctx.raw("bold") === true ? '"bold " + ' : ""}${ctx.input("size")} + "px " + ${ctx.input("FONT")};\n`,
  }),
  action({
    id: "canvas_text",
    label: "Write text on the picture",
    description:
      "Writes text on the picture. X and Y are where the text starts, from the top left corner.",
    category: "canvas",
    group: "Text",
    icon: "fa-solid fa-i-cursor",
    keywords: ["text", "write", "fill text", "caption"],
    block: [
      {
        type: "canvas_fillText",
        text: ["fill text {TEXT}", "at X: {X}", "y: {Y}"],
        inline: true,
        tooltip: "Draws filled text.",
        previous: null,
        next: null,
        restrictions: [
          {
            type: "hasParent",
            blockTypes: ["canvas_createCanvas"],
            message: 'This block must be inside a "create new canvas" block.',
          },
        ],
      },
      {
        type: "canvas_strokeText",
        text: ["stroke text {TEXT}", "at X: {X}", "y: {Y}"],
        parts: { style: { part: "fixed", value: "stroke" } },
        inline: true,
        tooltip: "Draws stroked text.",
        previous: null,
        next: null,
        restrictions: [
          {
            type: "hasParent",
            blockTypes: ["canvas_createCanvas"],
            message: 'This block must be inside a "create new canvas" block.',
          },
        ],
      },
    ],
    requires: ["canvas"],
    inputs: [
      input.text("TEXT", "Text", { default: "Hello!" }),
      input.number("X", "X", { default: 20 }),
      input.number("Y", "Y", { default: 50 }),
      input.dropdown(
        "style",
        "Style",
        [
          ["Filled", "fill"],
          ["Outline", "stroke"],
        ],
        { default: "fill" },
      ),
    ],
    code: (ctx) =>
      `canvas.getContext("2d").${ctx.raw("style") === "stroke" ? "stroke" : "fill"}Text(${ctx.input("TEXT")}, ${ctx.input("X")}, ${ctx.input("Y")});\n`,
  }),
  action({
    id: "canvas_rectangle",
    label: "Draw a rectangle on the picture",
    description: "Draws a rectangle. X and Y are its top left corner.",
    category: "canvas",
    group: "Shapes",
    icon: "fa-regular fa-square",
    keywords: ["rectangle", "square", "box", "background"],
    block: {
      type: "canvas_drawRectangle",
      text: ["rectangle at X: {X}", "y: {Y}", "width: {W}", "height: {H}"],
      inline: true,
      tooltip: "Draws a filled rectangle.",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [
      input.number("X", "X", { default: 0 }),
      input.number("Y", "Y", { default: 0 }),
      input.number("W", "Width", { default: 100, min: 0 }),
      input.number("H", "Height", { default: 100, min: 0 }),
      input.dropdown(
        "style",
        "Style",
        [
          ["Filled", "fill"],
          ["Outline", "stroke"],
        ],
        { default: "fill" },
      ),
    ],
    code: (ctx) =>
      `canvas.getContext("2d").${ctx.raw("style") === "stroke" ? "stroke" : "fill"}Rect(${ctx.input("X")}, ${ctx.input("Y")}, ${ctx.input("W")}, ${ctx.input("H")});\n`,
  }),
  action({
    id: "canvas_circle",
    label: "Draw a circle on the picture",
    description: "Draws a circle. X and Y are its middle.",
    category: "canvas",
    group: "Shapes",
    icon: "fa-regular fa-circle",
    keywords: ["circle", "round", "dot"],
    block: {
      type: "canvas_drawCircle",
      text: ["circle at X: {X}", "y: {Y}", "radius: {R}"],
      inline: true,
      tooltip: "Draws a filled circle.",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [
      input.number("X", "X", { default: 100 }),
      input.number("Y", "Y", { default: 100 }),
      input.number("R", "Radius", { default: 50, min: 0 }),
      input.dropdown(
        "style",
        "Style",
        [
          ["Filled", "fill"],
          ["Outline", "stroke"],
        ],
        { default: "fill" },
      ),
    ],
    code: (ctx) =>
      `{\nconst pen = canvas.getContext("2d");\npen.beginPath();\npen.arc(${ctx.input("X")}, ${ctx.input("Y")}, ${ctx.input("R")}, 0, Math.PI * 2);\npen.${ctx.raw("style") === "stroke" ? "stroke" : "fill"}();\n}\n`,
  }),
  action({
    id: "canvas_line",
    label: "Draw a line on the picture",
    description: "Draws a straight line from one point to another.",
    category: "canvas",
    group: "Shapes",
    icon: "fa-solid fa-slash",
    keywords: ["line", "stroke"],
    block: {
      type: "canvas_drawLine",
      text: ["line from X: {X1}", "y: {Y1}", "to X: {X2}", "y: {Y2}"],
      inline: true,
      tooltip: "Draws a line.",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [
      input.number("X1", "From X", { default: 0 }),
      input.number("Y1", "From Y", { default: 0 }),
      input.number("X2", "To X", { default: 100 }),
      input.number("Y2", "To Y", { default: 100 }),
    ],
    code: (ctx) =>
      `{\nconst pen = canvas.getContext("2d");\npen.beginPath();\npen.moveTo(${ctx.input("X1")}, ${ctx.input("Y1")});\npen.lineTo(${ctx.input("X2")}, ${ctx.input("Y2")});\npen.stroke();\n}\n`,
  }),
  action({
    id: "canvas_image",
    label: "Draw an image onto the picture",
    description:
      "Draws a picture from a link (like someone's avatar) onto this one. Leave the size empty to keep its own size.",
    category: "canvas",
    group: "Drawing",
    icon: "fa-solid fa-image",
    keywords: ["image", "picture", "avatar", "paste"],
    block: {
      type: "canvas_drawImage",
      text: ["draw image from URL {SRC}", "at X: {X}", "y: {Y}", "width: {W}", "height: {H}"],
      inline: false,
      tooltip: "Loads and draws an image from a URL.",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [
      input.text("SRC", "Picture link", {
        default: "",
        accepts: ["String", "buffer"],
        placeholder: "https://...",
      }),
      input.number("X", "X", { default: 0 }),
      input.number("Y", "Y", { default: 0 }),
      input.number("W", "Width", { default: 0, optional: true, min: 0 }),
      input.number("H", "Height", { default: 0, optional: true, min: 0 }),
    ],
    dependencies: ["@napi-rs/canvas"],
    code: (ctx) => {
      const size = ctx.has("W") && ctx.has("H") ? `, ${ctx.input("W")}, ${ctx.input("H")}` : "";
      return `canvas.getContext("2d").drawImage(await _napi_rs_canvas.loadImage(${ctx.input("SRC")}), ${ctx.input("X")}, ${ctx.input("Y")}${size});\n`;
    },
  }),
  action({
    id: "canvas_clear",
    label: "Clear the picture",
    description: "Wipes everything drawn so far.",
    category: "canvas",
    group: "Picture",
    icon: "fa-solid fa-eraser",
    keywords: ["clear", "erase", "wipe"],
    block: {
      type: "canvas_clearCanvas",
      text: "clear canvas",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    code: (ctx) => `canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);\n`,
  }),
  action({
    id: "canvas_save",
    label: "Remember the drawing settings",
    description: "Remembers the colors, font, position and turn, so you can go back to them later.",
    category: "canvas",
    group: "Moving",
    icon: "fa-solid fa-bookmark",
    keywords: ["save", "state"],
    block: {
      type: "canvas_save",
      text: "save canvas state",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    code: (ctx) => `canvas.getContext("2d").save();\n`,
  }),
  action({
    id: "canvas_restore",
    label: "Go back to the remembered drawing settings",
    description: "Goes back to the colors, font, position and turn from the last Remember step.",
    category: "canvas",
    group: "Moving",
    icon: "fa-solid fa-rotate-left",
    keywords: ["restore", "state"],
    block: {
      type: "canvas_restore",
      text: "restore canvas state",
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    code: (ctx) => `canvas.getContext("2d").restore();\n`,
  }),
  action({
    id: "canvas_move",
    label: "Move where drawing starts on the picture",
    description: "Moves the starting point (0, 0) for everything drawn after this.",
    category: "canvas",
    group: "Moving",
    icon: "fa-solid fa-arrows-up-down-left-right",
    keywords: ["translate", "move", "offset"],
    block: {
      type: "canvas_translate",
      text: ["translate X by {DX}", "y by {DY}"],
      inline: true,
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [
      input.number("DX", "Right by", { default: 0 }),
      input.number("DY", "Down by", { default: 0 }),
    ],
    code: (ctx) => `canvas.getContext("2d").translate(${ctx.input("DX")}, ${ctx.input("DY")});\n`,
  }),
  action({
    id: "canvas_turn",
    label: "Turn the drawing on the picture",
    description: "Turns everything drawn after this around the starting point.",
    category: "canvas",
    group: "Moving",
    icon: "fa-solid fa-rotate",
    keywords: ["rotate", "turn", "angle"],
    block: {
      type: "canvas_rotate",
      text: "rotate by (rad) {ANGLE}",
      parts: { ANGLE: { scale: 180 / Math.PI } },
      previous: null,
      next: null,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["canvas_createCanvas"],
          message: 'This block must be inside a "create new canvas" block.',
        },
      ],
    },
    requires: ["canvas"],
    inputs: [input.number("ANGLE", "Degrees", { default: 0 })],
    code: (ctx) => `canvas.getContext("2d").rotate((${ctx.input("ANGLE")} * Math.PI) / 180);\n`,
  }),
];

const values = [];

const components = [];

const blocks = [
  block({
    type: "canvas_addFile",
    text: "add canvas as file",
    previous: "files",
    next: "files",
    restrictions: [
      {
        type: "hasParent",
        blockTypes: ["canvas_createCanvas"],
        message: 'This block must be inside a "create new canvas" block.',
      },
    ],
    code: (ctx) => {
      return `new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: "canvas.png" }),\n`;
    },
  }),
];

export default {
  events,
  actions,
  values,
  components,
  contexts: [
    {
      key: "canvas",
      label: "a Draw a picture step",
      description: 'Only works inside a "Make a picture to draw on" step.',
      variable: "canvas",
    },
  ],

  blocks,
};
