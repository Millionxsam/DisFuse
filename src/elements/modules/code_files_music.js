/* =====================================================================
   Builder catalog: code, files and music
   ---------------------------------------------------------------------
   Running your own JavaScript, catching errors, the console, files on
   the computer the bot runs on, and finding song lyrics.
   ===================================================================== */

import { ALLOWED_MENTIONS } from "../../blocks/lib/generatorUtils.js";
import { ANY, group, input } from "../define.js";

const { action, value, block } = group({ colour: "#c93a5e" });

/* fs and path come with Node, so they never go in package.json. */
const FS = [
  { package: "fs", builtin: true },
  { package: "path", builtin: true },
];

const events = [];

const actions = [
  action({
    id: "file_read",
    label: "Read a file",
    description: "Reads a text file on the computer the bot runs on.",
    category: "files",
    group: "Files",
    icon: "fa-solid fa-file-lines",
    keywords: ["read file", "open file", "load", "fs"],
    block: {
      type: "fs_readFile",
      text: ["read file from path: {path}", "then: {then}"],
      colour: "#eb8334",
      tooltip: "Reads content from a file.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["path"], message: "You must specify a valid path" },
      ],
    },
    inputs: [input.text("path", "File path", { default: "", placeholder: "data/notes.txt" })],
    branches: [
      {
        key: "then",
        label: "After it's read",
        provides: [
          {
            key: "data",
            label: "What's in the file",
            type: "String",
            code: "readData",
            block: {
              type: "fs_readFile_data",
              text: "contents of the file read",
              colour: "#eb8334",
              tooltip: "The content read from the file.",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["fs_readFile"],
                  message: 'This block must be inside a "Read file from path" block',
                },
              ],
            },
          },
        ],
      },
    ],
    dependencies: FS,
    code: (ctx) =>
      `{\nconst readData = await fs.promises.readFile(${ctx.input("path")}, "utf8");\n${ctx.branch("then")}}\n`,
  }),
  action({
    id: "file_each",
    label: "Repeat with each file in a folder",
    description: "Runs the steps inside once for every file in a folder.",
    category: "files",
    group: "Files",
    icon: "fa-solid fa-folder-open",
    keywords: ["for each file", "folder", "directory", "list files", "readdir"],
    block: {
      type: "fs_readdir",
      text: ["for each file at path: {path}", "{doo}"],
      colour: "#eb8334",
      tooltip: "Do something for each file in a directory.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["path"], message: "You must specify a valid path" },
      ],
    },
    inputs: [input.text("path", "Folder path", { default: "", placeholder: "data/notes.txt" })],
    branches: [
      {
        key: "doo",
        label: "Do",
        inline: true,
        provides: [
          {
            key: "name",
            label: "File name",
            type: "String",
            code: "file@@",
            block: {
              type: "fs_readdir_name",
              text: "current file name in the loop",
              colour: "#eb8334",
              tooltip: "The name of the current file in the loop.",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["fs_readdir"],
                  message: 'This block must be inside a "For each file at path" block',
                },
              ],
            },
          },
          {
            key: "path",
            label: "File path",
            type: "String",
            code: "filePath@@",
            block: {
              type: "fs_readdir_path",
              text: "current file path in the loop",
              colour: "#eb8334",
              tooltip: "The path of the current file in the loop.",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["fs_readdir"],
                  message: 'This block must be inside a "For each file at path" block',
                },
              ],
            },
          },
        ],
        contexts: ["loop"],
      },
    ],
    dependencies: FS,
    code: (ctx) => {
      const folder = ctx.local("folder");
      return `{\nconst ${folder} = ${ctx.input("path")};\nfor (const ${ctx.local("file")} of await fs.promises.readdir(${folder})) {\nconst ${ctx.local("filePath")} = path.join(${folder}, ${ctx.local("file")});\n${ctx.branch("doo")}}\n}\n`;
    },
  }),
  action({
    id: "file_write",
    label: "Save a file",
    description:
      "Saves text to a file on the computer the bot runs on. If the file is already there, it's replaced.",
    category: "files",
    group: "Files",
    icon: "fa-solid fa-floppy-disk",
    keywords: ["write file", "save", "create file", "overwrite", "fs"],
    block: {
      type: "fs_writeFile",
      text: ["create/overwrite file at path: {path}", "with data: {data}", "then: {then}"],
      colour: "#eb8334",
      tooltip: "Overwrites the data of a file. If the file doesn't exist, it creates one.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["path"], message: "You must specify a valid path" },
        { type: "notEmpty", blockTypes: ["data"], message: "You must specify the data to write" },
      ],
    },
    inputs: [
      input.text("path", "File path", { default: "", placeholder: "data/notes.txt" }),
      input.text("data", "Text to save", { default: "", multiline: true }),
    ],
    branches: [{ key: "then", label: "After it's saved", optional: true }],
    dependencies: FS,
    code: (ctx) =>
      `await fs.promises.writeFile(${ctx.input("path")}, ${ctx.input("data")});\n${ctx.hasBranch("then") ? ctx.branch("then") : ""}`,
  }),
  action({
    id: "file_delete",
    label: "Delete a file",
    description: "Deletes a file on the computer the bot runs on.",
    category: "files",
    group: "Files",
    icon: "fa-solid fa-file-circle-xmark",
    keywords: ["delete file", "remove file", "unlink"],
    block: {
      type: "fs_deleteFile",
      text: "delete file from path: {path}",
      colour: "#eb8334",
      tooltip: "Deletes a file from a path.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["path"], message: "You must specify a valid path" },
      ],
    },
    inputs: [input.text("path", "File path", { default: "", placeholder: "data/notes.txt" })],
    dependencies: FS,
    code: (ctx) => `await fs.promises.unlink(${ctx.input("path")});\n`,
  }),
  action({
    id: "file_rename",
    label: "Rename or move a file",
    description: "Gives a file a new name, or moves it to another folder.",
    category: "files",
    group: "Files",
    icon: "fa-solid fa-file-pen",
    keywords: ["rename file", "move file"],
    block: {
      type: "fs_renameFile",
      text: ["rename file from path: {path}", "new path: {newpath}"],
      colour: "#eb8334",
      tooltip: "Renames a file from a path.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["path"], message: "You must specify a valid path" },
        {
          type: "notEmpty",
          blockTypes: ["newpath"],
          message: "You must specify the new path for the file",
        },
      ],
    },
    inputs: [
      input.text("path", "File path now", { default: "", placeholder: "data/notes.txt" }),
      input.text("newpath", "New file path", { default: "", placeholder: "data/notes.txt" }),
    ],
    dependencies: FS,
    code: (ctx) => `await fs.promises.rename(${ctx.input("path")}, ${ctx.input("newpath")});\n`,
  }),
  action({
    id: "code_run",
    label: "Run JavaScript",
    description:
      "Runs JavaScript you write yourself. For things the builder doesn't have a step for.",
    category: "code",
    group: "Your own code",
    icon: "fa-solid fa-code",
    keywords: ["javascript", "js", "code", "raw", "custom code", "eval"],
    block: [
      {
        type: "javascript_raw",
        text: "raw code: {CODE}",
        parts: { CODE: { value: "console.log('hi');" } },
        tooltip: "Inserts raw javascript code.",
      },
      {
        type: "javascript_raw_float",
        text: "raw code: {CODE}",
        parts: { CODE: { value: "console.log('hi');" } },
        tooltip: "Inserts raw javascript code.",
        previous: false,
        next: false,
      },
    ],
    inputs: [input.code("CODE", "Code", { default: 'console.log("hi");' })],
    code: (ctx) => `${ctx.raw("CODE") ?? ""}\n`,
  }),
  action({
    id: "wait",
    label: "Wait before the next step",
    description: "Pauses for a while before the next step.",
    category: "time",
    group: "Waiting",
    icon: "fa-solid fa-hourglass-half",
    keywords: ["wait", "delay", "sleep", "pause", "timeout"],
    block: {
      type: "javascript_wait",
      text: "wait (in milliseconds): {number}",
      parts: { unit: { part: "fixed", value: "1" } },
      tooltip: "Waits for an specific amount of time before continuing the code.",
    },
    inputs: [
      input.number("number", "For", { default: 1, min: 0 }),
      input.dropdown(
        "unit",
        "Unit",
        [
          ["Seconds", "1000"],
          ["Milliseconds", "1"],
          ["Minutes", "60000"],
        ],
        { default: "1000" },
      ),
    ],
    sentence: "Wait {number}",
    code: (ctx) => {
      const unit = { 1: 1, 1000: 1000, 60000: 60000 }[ctx.raw("unit")] ?? 1000;
      return unit === 1
        ? `await wait(${ctx.input("number")});\n`
        : `await wait(${ctx.input("number")} * ${unit});\n`;
    },
  }),
  action({
    id: "console_log",
    label: "Write to the console",
    description:
      "Shows something in the bot's console, where logs go. Handy for checking what a value is.",
    category: "code",
    group: "Console",
    icon: "fa-solid fa-terminal",
    keywords: ["console", "log", "print", "debug"],
    block: {
      type: "javascript_consolelog",
      text: "console log: {log}",
      tooltip: "Logs something to the console.",
    },
    inputs: [input.slot("log", "What to show", ANY)],
    code: (ctx) => `console.log(${ctx.input("log")});\n`,
  }),
  action({
    id: "console_warn",
    label: "Write a warning to the console",
    description: "Shows a warning in the bot's console.",
    category: "code",
    group: "Console",
    icon: "fa-solid fa-triangle-exclamation",
    keywords: ["console", "warn", "warning"],
    block: {
      type: "javascript_consolewarn",
      text: "console warn: {log}",
      tooltip: "Logs a warn to the console.",
    },
    inputs: [input.slot("log", "What to show", ANY)],
    code: (ctx) => `console.warn(${ctx.input("log")});\n`,
  }),
  action({
    id: "console_error",
    label: "Write an error to the console",
    description: "Shows an error in the bot's console.",
    category: "code",
    group: "Console",
    icon: "fa-solid fa-circle-exclamation",
    keywords: ["console", "error"],
    block: {
      type: "javascript_consoleerror",
      text: "console error: {log}",
      tooltip: "Logs an error to the console.",
    },
    inputs: [input.slot("log", "What to show", ANY)],
    code: (ctx) => `console.error(${ctx.input("log")});\n`,
  }),
  action({
    id: "console_clear",
    label: "Clear the console",
    description: "Clears everything shown in the bot's console.",
    category: "code",
    group: "Console",
    icon: "fa-solid fa-broom",
    keywords: ["console", "clear", "cls"],
    block: {
      type: "javascript_consoleclear",
      text: "clear console",
      tooltip: "Clears the terminal console.",
    },
    code: () => "console.clear();\n",
  }),
  action({
    id: "try_catch",
    label: "Try steps and catch errors",
    description:
      "Runs the steps in Try. If one of them fails, the bot runs the steps in If it fails instead of stopping.",
    category: "logic",
    group: "Errors",
    icon: "fa-solid fa-shield-heart",
    keywords: ["try", "catch", "error", "fail", "finally", "handle error"],
    block: [
      {
        type: "javascript_trycatch",
        text: ["try to run code", "{code}", "if error", "{error}"],
        parts: { code: { check: "default" }, error: { check: "default" } },
        inline: false,
      },
      {
        type: "javascript_trycatchfinally",
        text: ["try to run code", "{code}", "if error", "{error}", "then finally", "{finally}"],
        parts: {
          code: { check: "default" },
          error: { check: "default" },
          finally: { check: "default" },
        },
        inline: false,
      },
    ],
    branches: [
      { key: "code", label: "Try", inline: true },
      {
        key: "error",
        label: "If it fails",
        inline: true,
        provides: [
          {
            key: "error",
            label: "The error",
            type: ["error", "String"],
            code: "error@@",
            block: { type: "javascript_trycatch_error", text: "error" },
          },
        ],
      },
      { key: "finally", label: "Afterwards, either way", optional: true, inline: true },
    ],
    code: (ctx) =>
      `try {\n${ctx.branch("code")}} catch (${ctx.local("error")}) {\n${ctx.branch("error")}}${ctx.hasBranch("finally") ? ` finally {\n${ctx.branch("finally")}}` : ""}\n`,
  }),
  action({
    id: "bot_stop",
    label: "Quit the bot's program right away",
    description:
      "Ends the bot's program at once, without logging out first. Most bots should use Shut down the bot instead.",
    category: "bot",
    group: "Advanced",
    icon: "fa-solid fa-power-off",
    keywords: ["exit", "quit", "shutdown", "stop bot", "process.exit"],
    block: {
      type: "javascript_exit",
      text: "forcequit with code: {code}",
      tooltip: "Forces the bot to quit instantly, possible data loss!",
      next: false,
    },
    inputs: [
      input.number("code", "Exit code", {
        default: 0,
        help: "0 means everything went fine. Anything else means something went wrong.",
        integer: true,
      }),
    ],
    terminal: true,
    code: (ctx) => `process.exit(${ctx.input("code")});\n`,
  }),
  action({
    id: "lyrics_find",
    label: "Find song lyrics",
    description: "Looks up the lyrics of a song by its artist and name.",
    category: "music",
    group: "Music",
    icon: "fa-solid fa-music",
    keywords: ["lyrics", "song", "music"],
    block: {
      type: "music_findLyrics",
      text: ["get lyrics", "by artist: {artist}", "song name: {song}", "then: {then}"],
      colour: "#379e37",
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["artist"], message: "You must specify an artist" },
        { type: "notEmpty", blockTypes: ["song"], message: "You must specify a song name" },
      ],
    },
    inputs: [
      input.text("artist", "Artist", { default: "" }),
      input.text("song", "Song name", { default: "" }),
    ],
    branches: [
      {
        key: "then",
        label: "After looking",
        provides: [
          {
            key: "lyrics",
            label: "Song lyrics",
            type: "String",
            code: '(lyrics || "No lyrics found.")',
            description: 'Says "No lyrics found." if the song couldn\'t be found.',
            block: {
              type: "music_findLyrics_lyrics",
              text: '{"song lyrics "}',
              colour: "#379e37",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["music_findLyrics"],
                  message: 'This block must be under a "Get lyrics" block',
                },
              ],
            },
          },
        ],
      },
    ],
    dependencies: ["lyrics-finder"],
    code: (ctx) =>
      `{\nconst lyrics = await lyrics_finder(${ctx.input("artist")}, ${ctx.input("song")});\n${ctx.branch("then")}}\n`,
  }),
];

const values = [
  value({
    id: "code_type_of",
    label: "Kind of value",
    description:
      'What kind of value something is: "string" for text, "number", "boolean", "object" and so on.',
    category: "code",
    group: "Your own code",
    icon: "fa-solid fa-shapes",
    keywords: ["typeof", "type", "kind"],
    block: {
      type: "javascript_typeof",
      text: "type of {value}",
      tooltip: "Detects the type (string, number, object, etc.) that a value is",
    },
    output: "String",
    inputs: [input.slot("value", "Value", ANY)],
    code: (ctx) => `typeof (${ctx.input("value")})`,
  }),
  value({
    id: "code_value",
    label: "JavaScript value",
    description: "The result of a bit of JavaScript you write, like 1 + 1.",
    category: "code",
    group: "Your own code",
    icon: "fa-solid fa-code",
    keywords: ["javascript", "js", "expression", "raw"],
    block: {
      type: "javascript_raw_value",
      text: "raw code: {CODE}",
      parts: { CODE: { part: "text", value: "(1 + 1)" } },
      tooltip: "Inserts raw javascript code.",
    },
    output: ANY,
    inputs: [input.code("CODE", "Code", { default: "1 + 1" })],
    code: (ctx) => `(${String(ctx.raw("CODE") ?? "").trim() || "undefined"})`,
  }),
  value({
    id: "text_binary",
    label: "Text to binary, or back",
    description:
      "Turns text into 1s and 0s (like 01101000 01101001), or turns them back into text.",
    category: "text",
    group: "Changing text",
    icon: "fa-solid fa-barcode",
    keywords: ["binary", "encode", "decode", "bits"],
    block: {
      type: "string_binary",
      text: "{MODE} {TEXT}",
      parts: {
        MODE: {
          options: [
            ["convert string → binary", "ENCODE"],
            ["convert binary → string", "DECODE"],
          ],
        },
      },
      tooltip: "Convert text to binary or binary back to text",
      helpUrl: "",
    },
    output: "String",
    inputs: [
      input.dropdown(
        "MODE",
        "Turn",
        [
          ["Text into binary", "ENCODE"],
          ["Binary into text", "DECODE"],
        ],
        { default: "ENCODE" },
      ),
      input.text("TEXT", "Text", { default: "" }),
    ],
    code: (ctx) =>
      ctx.raw("MODE") === "DECODE"
        ? `new TextDecoder().decode(new Uint8Array(String(${ctx.input("TEXT")}).trim().split(/\\s+/).filter(Boolean).map((bits) => parseInt(bits, 2))))`
        : `[...new TextEncoder().encode(${ctx.input("TEXT")})].map((byte) => byte.toString(2).padStart(8, "0")).join(" ")`,
  }),
  value({
    id: "console_ask",
    label: "Answer typed in the console",
    description:
      "Asks a question in the bot's console and waits for someone at the computer to type an answer.",
    category: "code",
    group: "Console",
    icon: "fa-solid fa-keyboard",
    keywords: ["input", "prompt", "readline", "ask"],
    block: {
      type: "javascript_consoleinput",
      text: ["ask for input", "prompt message: {prompt}"],
      parts: { prompt: { check: null } },
      tooltip: "Asks the user for input and returns it as text.",
    },
    output: "String",
    inputs: [input.text("prompt", "Question", { default: "Enter input:" })],
    code: (ctx) => `(await new Promise((resolve) => {
  const readline = require("readline").createInterface({ input: process.stdin, output: process.stdout });
  readline.question(${ctx.input("prompt")}, (answer) => {
    readline.close();
    resolve(answer);
  });
}))`,
  }),
];

const components = [];

const blocks = [
  block({
    type: "fs_sendFile",
    pings: true,
    text: [
      "send file from path: {path}",
      "to channel: {channel}",
      "with content: {content}",
      "embed name(s): {embeds}",
      "rows: {rows}",
    ],
    parts: {
      path: { part: "value", check: "String" },
      channel: { part: "value", check: "channel" },
      content: { part: "value", check: "String" },
      embeds: { part: "value", check: "String" },
      rows: { part: "statement", check: "rows" },
    },
    colour: "#eb8334",
    tooltip: "Sends a file to a specific channel.",
    previous: "default",
    next: "default",
    restrictions: [
      { type: "notEmpty", blockTypes: ["path"], message: "You must specify a valid path" },
      {
        type: "notEmpty",
        blockTypes: ["channel"],
        message: "You must specify the channel to send the file in",
      },
    ],
    code: (ctx) => {
      var path = ctx.code("path");
      var channel = ctx.code("channel");
      var content = ctx.code("content");
      var embeds = ctx.code("embeds");
      var rows = ctx.branch("rows");

      var code = `await ${channel}.send({
      ${ctx.allowedMentions()},
      files: [new Discord.AttachmentBuilder(${path})],
      content: ${content || "''"},
      embeds: [${embeds.replaceAll("'", "") || ""}],
      components: [
      ${rows}]
    });\n`;

      return code;
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
