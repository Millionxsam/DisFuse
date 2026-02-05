const DEFAULT_SHADOWS = {
  Number: { type: "math_number", fields: { NUM: 0 } },
  String: { type: "text", fields: { TEXT: "" } },
  Boolean: { type: "logic_boolean" },
};

function block(type, properties = {}) {
  return Object.assign(
    {},
    {
      kind: "block",
      type,
    },
    properties
  );
}

function shadow(type, properties = {}) {
  if (DEFAULT_SHADOWS[type]) {
    return Object.assign({}, DEFAULT_SHADOWS[type], properties);
  } else {
    return Object.assign({}, { kind: "shadow", type }, properties);
  }
}

function sep(gap) {
  return {
    kind: "sep",
    gap,
  };
}

function label(text) {
  return {
    kind: "label",
    text,
  };
}

export default function getToolbox(blockPacks = [], user) {
  return {
    kind: "categoryToolbox",
    contents: [
      {
        kind: "search",
        name: "Search",
      },
      sep(),
      {
        kind: "category",
        name: "Logic",
        categorystyle: "logic_category",
        contents: [
          block("controls_if"),
          block("logic_compare"),
          block("logic_equalsExactly"),
          block("logic_operation"),
          block("logic_negate"),
          block("logic_boolean"),
          block("logic_null"),
          block("logic_ternary"),
          block("logic_nullishOperator"),
          label("--------------------------------"),
          block("logic_switch"),
          block("logic_case"),
          block("logic_default"),
          label("--------------------------------"),
        ],
      },
      {
        kind: "category",
        name: "Loops",
        categorystyle: "loop_category",
        contents: [
          block("controls_repeat_ext", {
            inputs: {
              TIMES: shadow("math_number", {
                fields: {
                  NUM: 10,
                },
              }),
            },
          }),
          block("controls_whileUntil"),
          {
            kind: "block",
            type: "controls_for",
            inputs: {
              FROM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
              TO: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 10,
                  },
                },
              },
              BY: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
          block("controls_forEach"),
          block("controls_flow_statements"),
        ],
      },
      {
        kind: "category",
        name: "Text",
        colour: "#59c059",
        contents: [
          block("text"),
          block("text_multiline"),
          block("text_join"),
          block("text_newline"),
          {
            kind: "block",
            type: "text_append",
            inputs: {
              TEXT: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_length",
            inputs: {
              VALUE: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "abc",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_isEmpty",
            inputs: {
              VALUE: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_startOrEndWith",
            inputs: {
              text: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "abc",
                  },
                },
              },
              text2: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_indexOf",
            inputs: {
              VALUE: {
                block: {
                  type: "variables_get",
                },
              },
              FIND: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "abc",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_charAt",
            inputs: {
              VALUE: {
                block: {
                  type: "variables_get",
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_getSubstring",
            inputs: {
              STRING: {
                block: {
                  type: "variables_get",
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_changeCase",
            inputs: {
              TEXT: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "abc",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_trim",
            inputs: {
              TEXT: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "abc",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_count",
            inputs: {
              SUB: {
                shadow: {
                  type: "text",
                },
              },
              TEXT: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_repeat",
            inputs: {
              text: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "abc",
                  },
                },
              },
              times: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 3,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_replace",
            inputs: {
              FROM: {
                shadow: {
                  type: "text",
                },
              },
              TO: {
                shadow: {
                  type: "text",
                },
              },
              TEXT: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_reverse",
            inputs: {
              TEXT: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_contains",
            inputs: {
              text: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "abc",
                  },
                },
              },
              query: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "def",
                  },
                },
              },
            },
          },
          label("Advanced | RegExp Blocks ↓"),
          block("text_regexp"),
          block("text_regexp_test"),
          block("text_regexp_match"),
          block("text_regexp_exec"),
          block("text_regexp_replace"),
        ],
      },
      {
        kind: "category",
        name: "Math",
        colour: "#cfa23a",
        contents: [
          {
            kind: "block",
            type: "math_number",
            fields: {
              NUM: 123,
            },
          },
          block("math_toNumber"),
          {
            kind: "block",
            type: "math_arithmetic",
            inputs: {
              A: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
              B: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_single",
            inputs: {
              NUM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 9,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_trig",
            inputs: {
              NUM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 45,
                  },
                },
              },
            },
          },
          block("math_constant"),
          {
            kind: "block",
            type: "math_number_property",
            inputs: {
              NUMBER_TO_CHECK: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 0,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_round",
            fields: {
              OP: "ROUND",
            },
            inputs: {
              NUM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 3.1,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_on_list",
            fields: {
              OP: "SUM",
            },
          },
          {
            kind: "block",
            type: "math_modulo",
            inputs: {
              DIVIDEND: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 64,
                  },
                },
              },
              DIVISOR: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 10,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_constrain",
            inputs: {
              VALUE: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 50,
                  },
                },
              },
              LOW: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
              HIGH: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 100,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_random_int",
            inputs: {
              FROM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
              TO: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 100,
                  },
                },
              },
            },
          },
          block("math_random_float"),
          {
            kind: "block",
            type: "math_atan2",
            inputs: {
              X: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
              Y: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
        ],
      },
      {
        kind: "category",
        name: "Lists",
        categorystyle: "list_category",
        contents: [
          block("lists_create_with"),
          {
            kind: "block",
            type: "lists_repeat",
            inputs: {
              NUM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 5,
                  },
                },
              },
            },
          },
          block("lists_length"),
          block("lists_isEmpty"),
          {
            kind: "block",
            type: "lists_indexOf",
            inputs: {
              VALUE: {
                block: {
                  type: "variables_get",
                },
              },
            },
          },
          {
            kind: "block",
            type: "lists_getIndex",
            inputs: {
              VALUE: {
                block: {
                  type: "variables_get",
                },
              },
            },
          },
          {
            kind: "block",
            type: "lists_setIndex",
            inputs: {
              LIST: {
                block: {
                  type: "variables_get",
                },
              },
            },
          },
          {
            kind: "block",
            type: "lists_getSublist",
            inputs: {
              LIST: {
                block: {
                  type: "variables_get",
                },
              },
            },
          },
          {
            kind: "block",
            type: "lists_split",
            inputs: {
              DELIM: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: ",",
                  },
                },
              },
            },
          },
          block("lists_sort"),
          block("lists_reverse"),
          {
            kind: "block",
            type: "list_merge",
            inputs: {
              list: {
                block: {
                  type: "variables_get",
                },
              },
            },
          },
          {
            kind: "block",
            type: "list_filter",
            inputs: {
              list: {
                block: {
                  type: "variables_get",
                },
              },
              method: {
                block: {
                  type: "logic_compare",
                  inputs: {
                    A: {
                      block: {
                        type: "list_filter_item",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "list_find",
            inputs: {
              list: {
                block: {
                  type: "variables_get",
                },
              },
              method: {
                block: {
                  type: "logic_compare",
                  inputs: {
                    A: {
                      block: {
                        type: "list_filter_item",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      {
        kind: "category",
        name: "Objects",
        colour: "#BA59CE",
        contents: [
          label("Objects are like lists, but each item has a value"),
          label("Create an object ↓"),
          block("object_new"),
          block("object_addkey"),
          label("Object actions ↓"),
          {
            kind: "block",
            type: "object_setkey",
            inputs: {
              key: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "object_deletekey",
            inputs: {
              key: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "",
                  },
                },
              },
            },
          },
          block("object_stringify"),
          {
            kind: "block",
            type: "object_parse",
            inputs: {
              string: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "",
                  },
                },
              },
            },
          },
          label("Information about object ↓"),
          {
            kind: "block",
            type: "object_getkey",
            inputs: {
              key: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "object_has",
            inputs: {
              string: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "",
                  },
                },
              },
            },
          },
          block("object_length"),
          block("object_keys"),
          block("object_values"),
        ],
      },
      {
        kind: "category",
        name: "Time",
        colour: "#db4b9c",
        contents: [
          label("Get a date ↓"),
          block("time_date_now"),
          block("time_date"),
          block("time_createdate"),
          label("Timestamp creation ↓"),
          block("time_timestampFromDate"),
          label("Convertion / Operations ↓"),
          {
            kind: "block",
            type: "time_convert",
            inputs: {
              NUMBER: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 10,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "time_operation",
            inputs: {
              NUMBER: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 10,
                  },
                },
              },
            },
          },
          block("time_between"),
          label("String convertion ↓"),
          {
            kind: "block",
            type: "time_stringToMS",
            inputs: {
              TIME: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "10m",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "time_msToString",
            inputs: {
              TIME: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1000,
                  },
                },
              },
              LONG: {
                shadow: {
                  type: "logic_boolean",
                  fields: {
                    BOOL: "FALSE",
                  },
                },
              },
            },
          },
        ],
      },
      {
        kind: "category",
        name: "Colour",
        colour: "#ad794c",
        contents: [
          block("colour_picker"),
          block("colour_convert"),
          block("colour_hex"),
          block("colour_random"),
          {
            kind: "block",
            type: "colour_rgb",
            inputs: {
              RED: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 100,
                  },
                },
              },
              GREEN: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 50,
                  },
                },
              },
              BLUE: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 0,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "colour_blend",
            inputs: {
              COLOUR1: {
                shadow: {
                  type: "colour_picker",
                  fields: {
                    COLOUR: "#ff0000",
                  },
                },
              },
              COLOUR2: {
                shadow: {
                  type: "colour_picker",
                  fields: {
                    COLOUR: "#3333ff",
                  },
                },
              },
              RATIO: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 0.5,
                  },
                },
              },
            },
          },
        ],
      },
      sep(),
      {
        kind: "category",
        name: "Variables",
        categorystyle: "variable_category",
        custom: "VARIABLE",
      },
      // {
      //   kind: "category",
      //   name: "Data",
      //   categorystyle: "variable_category",
      //   contents: [
      //     {
      //       kind: "category",
      //       name: "Variables",
      //       categorystyle: "variable_category",
      //       custom: "VARIABLE",
      //     },
      //     {
      //       kind: "category",
      //       name: "Local Variables",
      //       colour: "#d98e2b",
      //       contents: [
      //         {
      //           kind: "label",
      //           text: "Local variables are like normal variables",
      //         },
      //         {
      //           kind: "label",
      //           text: "Except you can only use them on the same block/event they were defined on",
      //         },
      //         {
      //           kind: "block",
      //           type: "localVars_set",
      //         },
      //         {
      //           kind: "block",
      //           type: "localVars_change",
      //           inputs: {
      //             value: {
      //               shadow: {
      //                 type: "math_number",
      //                 fields: {
      //                   NUM: 1,
      //                 },
      //               },
      //             },
      //           },
      //         },
      //         {
      //           kind: "block",
      //           type: "localVars_get",
      //         },
      //       ],
      //     },
      //   ],
      // },
      {
        kind: "category",
        name: "Functions",
        categorystyle: "procedure_category",
        custom: "PROCEDURE",
      },
      {
        kind: "category",
        name: "JavaScript",
        colour: "#c93a5e",
        contents: [
          label("Get the type of a value ↓"),
          block("javascript_typeof"),
          label("Run raw javascript ↓"),
          block("javascript_raw"),
          block("javascript_raw_float"),
          block("javascript_raw_value"),
          label("Wait before running code ↓"),
          block("javascript_wait"),
          label("Log to the console ↓"),
          block("javascript_consolelog"),
          block("javascript_consolewarn"),
          block("javascript_consoleerror"),
          block("javascript_consoleclear"),
          label("Ask for user input ↓"),
          block("javascript_consoleinput"),
          label("Try catch ↓"),
          block("javascript_trycatch"),
          block("javascript_trycatchfinally"),
          block("javascript_trycatch_error"),
          label("Program control ↓"),
          block("javascript_exit"),
        ],
      },
      sep(),
      {
        kind: "category",
        name: "Main",
        colour: "#FF6E33",
        contents: [
          label("Required ↓"),
          {
            kind: "block",
            type: "main_token",
            inputs: {
              token: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "Your bot token",
                  },
                },
              },
            },
          },
          label("Get the value of a secret ↓"),
          {
            kind: "block",
            type: "main_env",
            inputs: {
              value: {
                shadow: { type: "text", fields: { TEXT: "Secret name" } },
              },
            },
          },
          label("The bot itself, represented as a Discord user ↓"),
          block("main_bot"),
          label("Properties of the bot ↓"),
          block("main_ping"),
          block("main_numberof"),
          block("main_readyAt"),
          label("Events ↓"),
          block("main_ready"),
          label("Actions ↓"),
          {
            kind: "block",
            type: "main_presence",
            inputs: {
              afk: {
                shadow: {
                  type: "logic_boolean",
                  fields: {
                    BOOL: "FALSE",
                  },
                },
              },
              activity_name: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "Name of activity",
                  },
                },
              },
            },
          },
          block("main_destroy"),
          label("ONLY use the block below if you shutdown the bot first ↓"),
          block("main_botStart"),
        ],
      },
      {
        kind: "category",
        name: "Embeds",
        colour: "00A58E",
        contents: [
          label("Create the embed first ↓"),
          block("embed_create"),
          {
            kind: "label",
            text: "Put all of these blocks INSIDE of the 'create embed' block above ↓",
          },
          {
            kind: "block",
            type: "embed_settitle",
            inputs: {
              value: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "embed_setdsc",
            inputs: {
              value: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "embed_setcolor",
            inputs: {
              value: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "embed_seturl",
            inputs: {
              value: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "embed_setauthor",
            inputs: {
              name: {
                shadow: {
                  type: "text",
                },
              },
              icon: {
                shadow: {
                  type: "text",
                },
              },
              url: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "embed_setfooter",
            inputs: {
              text: {
                shadow: {
                  type: "text",
                },
              },
              icon: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "embed_setimage",
            inputs: {
              value: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "embed_setthumb",
            inputs: {
              value: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "embed_addfield",
            inputs: {
              name: {
                shadow: {
                  type: "text",
                },
              },
              val: {
                shadow: {
                  type: "text",
                },
              },
              inline: {
                shadow: {
                  type: "logic_boolean",
                  fields: {
                    BOOL: "FALSE",
                  },
                },
              },
            },
          },
          block("embed_settimestamp"),
        ],
      },
      {
        kind: "category",
        name: "Messages",
        colour: "#336EFF",
        contents: [
          {
            kind: "category",
            name: "Message",
            colour: "#336EFF",
            contents: [
              label("Get a message ↓"),
              {
                kind: "block",
                type: "msg_getone",
                inputs: {
                  id: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              label("Events ↓"),
              block("msg_received"),
              block("msg_msg"),
              label("Information about a message ↓"),
              {
                kind: "block",
                type: "message_property",
                inputs: {
                  message: {
                    shadow: {
                      type: "msg_msg",
                    },
                  },
                },
              },
              label("Actions ↓"),
              {
                kind: "block",
                type: "msg_reply_mutator",
                inputs: {
                  content: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("misc_addrow"),
              {
                kind: "block",
                type: "misc_addFile",
                inputs: {
                  path: { shadow: shadow("text") },
                },
              },
              block("misc_messageSent"),
              {
                kind: "block",
                type: "msg_deleteOther",
                inputs: {
                  message: {
                    shadow: {
                      type: "msg_msg",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "msg_edit_mutator",
                inputs: {
                  message: {
                    shadow: {
                      type: "misc_messageSent",
                    },
                  },
                  content: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "msg_react",
                inputs: {
                  message: {
                    shadow: {
                      type: "msg_msg",
                    },
                  },
                  reaction: {
                    shadow: {
                      type: "text",
                      fields: {
                        TEXT: "😋",
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            kind: "category",
            name: "Threads",
            colour: "#5b67a5",
            contents: [
              label("Get a thread ↓"),
              {
                kind: "block",
                type: "threads_getone",
                inputs: {
                  value: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("threads_msgHasThread"),
              block("threads_msgThread"),
              label("Create a thread ↓"),
              {
                kind: "block",
                type: "threads_msgCreateThread",
                inputs: {
                  message: {
                    shadow: {
                      type: "msg_msg",
                    },
                  },
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                  slowmode: {
                    shadow: {
                      type: "math_number",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "threads_channelCreateThread",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                  slowmode: {
                    shadow: {
                      type: "math_number",
                    },
                  },
                },
              },
              block("threads_createdThread"),
              label("Information about a thread ↓"),
              block("threads_name"),
              block("threads_createdAt"),
              block("threads_lastMessage"),
              block("threads_author"),
              block("threads_authorMember"),
              block("threads_id"),
              block("threads_memberCount"),
              block("threads_parentChannel"),
              label("Thread actions ↓"),
              {
                kind: "block",
                type: "threads_setName",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "threads_setArchived",
                inputs: {
                  archived: {
                    shadow: {
                      type: "logic_boolean",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "threads_setLocked",
                inputs: {
                  locked: {
                    shadow: {
                      type: "logic_boolean",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "threads_setSlowmode",
                inputs: {
                  slowmode: {
                    shadow: {
                      type: "math_number",
                    },
                  },
                },
              },
              block("threads_pin"),
              block("threads_unpin"),
              block("threads_join"),
              block("threads_leave"),
              block("threads_addUser"),
              block("threads_removeUser"),
            ],
          },
          {
            kind: "category",
            name: "Polls",
            colour: "#656b75",
            contents: [
              label("Create a poll ↓"),
              {
                kind: "block",
                type: "poll_create",
                inputs: {
                  QUESTION: {
                    shadow: {
                      type: "text",
                    },
                  },
                  DURATION: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 2,
                      },
                    },
                  },
                  MULTISELECT: {
                    shadow: {
                      type: "logic_boolean",
                      fields: {
                        BOOL: "FALSE",
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "poll_choice",
                inputs: {
                  TEXT: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("poll_sendchannel"),
              label("Events ↓"),
              block("poll_whenvoteadded"),
              block("poll_whenvoteaddedvotetext"),
              block("poll_whenvoteaddedvoteemoji"),
              block("poll_whenvoteaddedvoteuser"),
            ],
          },
        ],
      },
      {
        kind: "category",
        name: "Servers",
        colour: "#8734BE",
        contents: [
          {
            kind: "category",
            name: "Server",
            colour: "#A33DAC",
            contents: [
              label("Get a server ↓"),
              block("server_getone"),
              label("Get all servers ↓"),
              block("server_getall"),
              block("server_guild"),
              label("Information about a server ↓"),
              block("server_name"),
              block("server_membercount"),
              block("server_id"),
              block("server_banner"),
              block("server_icon"),
              block("server_ownerid"),
              block("server_dsc"),
              block("server_afkchannel"),
              block("server_creationdate"),
              block("server_vanityurl"),
              block("server_systemchannel"),
              block("server_ruleschannel"),
              block("server_verified"),
              label("Actions on a server ↓"),
              block("server_disableinvites"),
              block("server_leave"),
            ],
          },
          {
            kind: "category",
            name: "Channels",
            colour: "#AD509B",
            contents: [
              label("Get a channel ↓"),
              {
                kind: "block",
                type: "channel_getone",
                inputs: {
                  value: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              label("Get all channels ↓"),
              block("channel_foreach"),
              block("channel_channel"),
              label("Create a channel ↓"),
              {
                kind: "block",
                type: "channel_create",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("channel_createdChannel"),
              label("Information about a channel ↓"),
              block("channel_getslowmode"),
              block("channel_getnsfw"),
              block("channel_getParent"),
              block("channel_gettopic"),
              block("channel_gettype"),
              block("channel_deletable"),
              block("channel_manageable"),
              block("channel_name"),
              block("channel_id"),
              block("channel_url"),
              block("channel_created"),
              label("Channel actions ↓"),
              label("------------------------------------"),
              {
                kind: "block",
                type: "channel_send_mutator",
                inputs: {
                  content: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("misc_addrow"),
              {
                kind: "block",
                type: "misc_addFile",
                inputs: {
                  path: { shadow: shadow("text") },
                },
              },
              block("misc_messageSent"),
              label("------------------------------------"),
              {
                kind: "block",
                type: "channel_setParent",
                inputs: {
                  syncPerms: {
                    shadow: {
                      type: "logic_boolean",
                    },
                  },
                },
              },
              block("channel_syncPerms"),
              {
                kind: "block",
                type: "channel_setPosition",
                inputs: {
                  position: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 1,
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "channel_setnsfw",
                inputs: {
                  set: {
                    shadow: {
                      type: "logic_boolean",
                    },
                  },
                },
              },
              label("----------------------------------------------------"),
              {
                kind: "block",
                type: "channel_set_permission",
                inputs: {
                  permission: {
                    shadow: {
                      type: "misc_permissionChannel",
                    },
                  },
                  role: {
                    shadow: {
                      type: "misc_everyone",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "channel_setslowmode",
                inputs: {
                  time: {
                    shadow: {
                      type: "math_number",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "channel_settopic",
                inputs: {
                  topic: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "channel_starttyping",
                inputs: {
                  wait: {
                    shadow: {
                      type: "math_number",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "channel_bulkdelete",
                inputs: {
                  amount: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 10,
                      },
                    },
                  },
                },
              },
              block("channel_setautoarchive"),
              {
                kind: "block",
                type: "channel_clone",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("channel_createdChannel"),
              block("channel_del"),
              block("channel_setname"),
              label("----------------------------------------------------"),
              label("Get the latest messages of a channel ↓"),
              {
                kind: "block",
                type: "channel_fetchLastMessages",
                inputs: {
                  amount: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 5,
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "channel_fetchedLastMessages",
                inputs: {
                  number: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 1,
                      },
                    },
                  },
                },
              },
              label("----------------------------------------------------"),
            ],
          },
          {
            kind: "category",
            name: "Roles",
            colour: "#B76489",
            contents: [
              label("Get a role ↓"),
              {
                kind: "block",
                type: "roles_getone",
                inputs: {
                  value: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              label("Loop through each role in a server ↓"),
              block("roles_foreach"),
              block("roles_foreach_role"),

              label("Loop through each member who has a certain role ↓"),
              block("roles_foreachMember"),
              block("roles_currentLoopMember"),
              label("Get the highest role in a server ↓"),
              block("roles_highest"),
              label("Create a role in a server ↓"),
              {
                kind: "block",
                type: "roles_create",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                  color: {
                    shadow: {
                      type: "colour_picker",
                    },
                  },
                  position: {
                    shadow: {
                      type: "math_number",
                    },
                  },
                  mentionable: {
                    shadow: {
                      type: "logic_boolean",
                    },
                  },
                },
              },
              block("misc_permission"),
              label("Check whether a certain member has a role ↓"),
              block("roles_hasRole"),
              label("Information about a role ↓"),
              block("roles_name"),
              block("roles_id"),
              block("roles_position"),
              block("roles_hexColor"),
              block("roles_createdAt"),
              {
                kind: "block",
                type: "roles_hasPermission",
                inputs: {
                  permission: {
                    shadow: {
                      type: "misc_permission",
                    },
                  },
                },
              },
              label("Role actions ↓"),
              block("roles_delete"),
              {
                kind: "block",
                type: "roles_rename",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("roles_addToMember"),
              block("roles_removeFromMember"),
              block("roles_setPermissions"),
            ],
          },
          {
            kind: "category",
            name: "Members",
            colour: "#3c9e56",
            contents: [
              label("Member = one member of a server"),
              label("User = the total Discord user"),
              label("Some blocks only accept users"),
              label("Other blocks only accept members"),
              label("Some blocks can accept either one"),
              {
                kind: "label",
                text: "(It won't let you drag in the wrong one)",
              },
              label(
                "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -"
              ),
              label("Get a member or user ↓"),
              {
                kind: "block",
                type: "member_getone",
                inputs: {
                  value: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "member_getuser",
                inputs: {
                  value: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              label("Do something for every member in a server ↓"),
              block("member_foreach"),
              block("member_member"),
              label("Information about members/users ↓"),
              block("member_status"),
              block("member_userFlags"),
              block("member_bannable"),
              block("member_kickable"),
              block("member_timedout"),
              {
                kind: "block",
                type: "member_hasPermission",
                inputs: {
                  permission: {
                    shadow: {
                      type: "misc_permission",
                    },
                  },
                },
              },
              block("member_color"),
              block("member_id"),
              block("member_joined"),
              block("member_nickname"),
              block("member_username"),
              block("member_avatarURL"),
              block("member_bannerURL"),
              block("member_bot"),
              block("member_system"),
              block("member_accent"),
              block("member_created"),
              block("member_user"),
              label("Actions on users/members ↓"),
              block("member_ban"),
              {
                kind: "block",
                type: "member_timeout",
                inputs: {
                  seconds: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 60,
                      },
                    },
                  },
                },
              },
              block("member_kick"),
              {
                kind: "block",
                type: "member_dm",
                inputs: {
                  content: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "member_dm_rows",
                inputs: {
                  content: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "member_setnick",
                inputs: {
                  nickname: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("member_removetimeout"),
            ],
          },
          {
            kind: "Category",
            name: "Invites",
            colour: "#CA8A67",
            contents: [
              label("Create/delete invites ↓"),
              block("invite_create"),
              block("invite_delete"),
              label("Get an invite ↓"),
              block("invite_get"),
              label("Information about an invite ↓"),
              block("invite_url"),
              block("invite_channel"),
              block("invite_author"),
              label("Loops ↓"),
              block("invite_foreach"),
              block("invite_channel_foreach"),
              block("invite_foreach_var"),
              label("Events ↓"),
              block("invite_invitecreated"),
              block("invite_invitedeleted"),
              block("invite_event_var"),
            ],
          },
          {
            kind: "category",
            name: "Webhooks",
            colour: "#4f85db",
            contents: [
              label("Get a webhook ↓"),
              {
                kind: "block",
                type: "webhooks_fetch",
                inputs: {
                  id: {
                    shadow: {
                      type: "text",
                    },
                  },
                  token: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              label("Create a webhook ↓"),
              {
                kind: "block",
                type: "webhooks_create",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("webhooks_createdWebhook"),
              label("Get token of a webhook ↓"),
              label("WARNING: This should be kept private!"),
              {
                kind: "block",
                type: "webhooks_token",
                inputs: {
                  webhook: {
                    shadow: {
                      type: "webhooks_createdWebhook",
                    },
                  },
                },
              },
              label("Actions ↓"),
              {
                kind: "block",
                type: "webhooks_send",
                inputs: {
                  webhook: {
                    shadow: {
                      type: "webhooks_createdWebhook",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "webhooks_delete",
                inputs: {
                  webhook: {
                    shadow: {
                      type: "webhooks_createdWebhook",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "webhooks_edit",
                inputs: {
                  webhook: {
                    shadow: {
                      type: "webhooks_createdWebhook",
                    },
                  },
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              label("Information about a webhook ↓"),
              block("webhooks_name"),
              block("webhooks_id"),
              block("webhooks_owner"),
              block("webhooks_createdAt"),
            ],
          },
          {
            kind: "category",
            name: "Emojis",
            colour: "#DEB144",
            contents: [
              label("Get an emoji ↓"),
              {
                kind: "block",
                type: "emoji_getemojiwith",
                inputs: {
                  equal: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              label("Get all emojis ↓"),
              block("emoji_getallinserver"),
              block("emoji_getallinserver_value"),
              label("Information about an emoji ↓"),
              block("emoji_getname"),
              block("emoji_getguild"),
              block("emoji_getid"),
              block("emoji_getimageurl"),
              block("emoji_isanimated"),
              block("emoji_created"),
              block("emoji_author"),
              label("Emoji actions ↓"),
              {
                kind: "block",
                type: "emoji_create",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                  url: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("emoji_delete"),
              {
                kind: "block",
                type: "emoji_setname",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
            ],
          },
          {
            kind: "category",
            name: "Stickers",
            colour: "#7a9e37",
            contents: [
              label("Get a sticker ↓"),
              {
                kind: "block",
                type: "sticker_getwith",
                inputs: {
                  equal: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              label("Get all stickers ↓"),
              block("sticker_getallinserver"),
              block("sticker_getallinserver_value"),
              label("Information about a sticker ↓"),
              block("sticker_getname"),
              block("sticker_getguild"),
              block("sticker_getid"),
              block("sticker_geturl"),
              block("sticker_created"),
              label("Sticker actions ↓"),
              {
                kind: "block",
                type: "sticker_create",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                  file: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("sticker_delete"),
              {
                kind: "block",
                type: "sticker_setname",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      {
        kind: "category",
        name: "Interactions",
        colour: "#334DBF",
        contents: [
          {
            kind: "category",
            name: "Slash",
            colour: "#3366CC",
            contents: [
              label("Setup slash commands ↓"),
              block("misc_createcontainer_global"),
              label("Add a slash command ↓"),
              {
                kind: "block",
                type: "slash_create_mutator",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                  dsc: {
                    shadow: {
                      type: "text",
                    },
                  },
                },
              },
              block("misc_permission"),
              {
                kind: "block",
                type: "slash_addoption",
                inputs: {
                  name: { shadow: shadow("text") },
                  dsc: { shadow: shadow("text") },
                  required: { shadow: shadow("logic_boolean") },
                },
              },
              {
                kind: "block",
                type: "slash_addchoice",
                inputs: {
                  name: { shadow: shadow("text") },
                  value: { shadow: shadow("text") },
                },
              },
              label("Subcommands (advanced) ↓"),
              {
                kind: "block",
                type: "slash_addsubcommand",
                inputs: {
                  name: { shadow: shadow("text") },
                  dsc: { shadow: shadow("text") },
                },
              },
              {
                kind: "block",
                type: "slash_addsubcommandgroup",
                inputs: {
                  name: { shadow: shadow("text") },
                  dsc: { shadow: shadow("text") },
                },
              },
              label("Events ↓"),
              block("slash_received"),
              label("Actions ↓"),
              {
                kind: "block",
                type: "misc_int_reply_mutator",
                inputs: {
                  content: { shadow: shadow("text") },
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              {
                kind: "label",
                text: "Use 'defer reply' to show 'bot is thinking...' message",
              },
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              {
                kind: "block",
                type: "misc_int_deferReply",
                inputs: {
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              block("misc_addrow"),
              {
                kind: "block",
                type: "misc_addFile",
                inputs: {
                  path: { shadow: shadow("text") },
                },
              },
              {
                kind: "block",
                type: "misc_int_edit_mutator",
                inputs: {
                  content: { shadow: shadow("text") },
                },
              },
              label("Information about the command ran ↓"),
              block("slash_getoption"),
              block("slash_name"),
              block("misc_int_member"),
              block("misc_int_user"),
              block("misc_int_channel"),
              block("misc_int_server"),
            ],
          },
          {
            kind: "category",
            name: "Buttons",
            colour: "#2677AF",
            contents: [
              label("Put this inside a block to send a row ↓"),
              block("misc_addrow"),
              {
                kind: "block",
                type: "buttons_add",
                inputs: {
                  label: { shadow: shadow("text") },
                  emoji: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  url: { shadow: shadow("text") },
                  disabled: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              label("Button events ↓"),
              block("buttons_event"),
              label("Info about the clicked button ↓"),
              block("buttons_message"),
              block("buttons_id"),
              block("misc_int_member"),
              block("misc_int_user"),
              block("misc_int_channel"),
              block("misc_int_server"),
              label("Button actions ↓"),
              {
                kind: "block",
                type: "misc_int_reply_mutator",
                inputs: {
                  content: { shadow: shadow("text") },
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              block("misc_addrow"),
              {
                kind: "block",
                type: "misc_addFile",
                inputs: {
                  path: { shadow: shadow("text") },
                },
              },
              {
                kind: "label",
                text: "Use 'defer reply' to show 'bot is thinking...' message",
              },
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              {
                kind: "block",
                type: "misc_int_deferReply",
                inputs: {
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "misc_int_edit_mutator",
                inputs: {
                  content: { shadow: shadow("text") },
                },
              },
              block("buttons_del"),
            ],
          },
          {
            kind: "category",
            name: "Modals",
            colour: "1A8793",
            contents: [
              label(
                "Keep in mind that you can only show modals in slash commands!"
              ),
              label("Show a modal to the user ↓"),
              block("modal_show"),
              label("Create a modal (put this in the block above) ↓"),
              {
                kind: "block",
                type: "modal_create",
                inputs: {
                  title: { shadow: shadow("text") },
                  customId: { shadow: shadow("text") },
                },
              },
              {
                kind: "label",
                text: "Put text input(s) inside the 'create modal' block ↓",
              },
              {
                kind: "block",
                type: "modal_add_text_input",
                inputs: {
                  label: { shadow: shadow("text") },
                  customId: { shadow: shadow("text") },
                  required: { shadow: shadow("logic_boolean") },
                },
              },
              {
                kind: "block",
                type: "modal_add_text_input_advanced",
                inputs: {
                  label: { shadow: shadow("text") },
                  customId: { shadow: shadow("text") },
                  required: { shadow: shadow("logic_boolean") },
                  placeholder: { shadow: shadow("text") },
                  max: {
                    shadow: { type: "math_number", fields: { NUM: 100 } },
                  },
                  min: { shadow: { type: "math_number", fields: { NUM: 10 } } },
                },
              },
              label("Events ↓"),
              block("modal_handle_interaction"),
              label("Information about the submitted modal ↓"),
              {
                kind: "block",
                type: "modal_get_input_value",
                inputs: {
                  customId: { shadow: shadow("text") },
                },
              },
              block("modal_get_author"),
              block("modal_get_customId"),
              label("Reply to the modal after submitted ↓"),
              {
                kind: "block",
                type: "misc_int_reply_mutator",
                inputs: {
                  content: { shadow: shadow("text") },
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              {
                kind: "label",
                text: "Use 'defer reply' to show 'bot is thinking...' message",
              },
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              {
                kind: "block",
                type: "misc_int_deferReply",
                inputs: {
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "misc_int_edit_mutator",
                inputs: {
                  content: { shadow: shadow("text") },
                },
              },
            ],
          },
          {
            kind: "category",
            name: "Select Menus",
            colour: "#26A483",
            contents: [
              label("Put this inside a block to send a row ↓"),
              block("misc_addrow"),
              label("Create a menu with TEXT options ↓"),
              {
                kind: "block",
                type: "menus_add",
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "menus_addoption",
                inputs: {
                  label: { shadow: shadow("text") },
                  dsc: { shadow: shadow("text") },
                  emoji: { shadow: shadow("text") },
                  value: { shadow: shadow("text") },
                  default: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              label(
                "Create a menu with CHANNEL options (auto-adds all channels in the server) ↓"
              ),
              {
                kind: "block",
                type: "menus_addChannelMenu",
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                  channelTypes: {
                    block: {
                      type: "lists_create_with",
                      inputs: {
                        ADD0: {
                          block: {
                            type: "misc_channelType",
                          },
                        },
                        ADD1: {
                          block: {
                            type: "misc_channelType",
                          },
                        },
                        ADD2: {
                          block: {
                            type: "misc_channelType",
                          },
                        },
                      },
                    },
                  },
                  defaultChannels: {
                    block: {
                      type: "lists_create_with",
                      inputs: {
                        ADD0: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of channel to select by default",
                            },
                          },
                        },
                        ADD1: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of channel to select by default",
                            },
                          },
                        },
                        ADD2: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of channel to select by default",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              block("misc_channelType"),
              label(
                "Create a menu with ROLE options (auto-adds all roles in the server) ↓"
              ),
              {
                kind: "block",
                type: "menus_addRoleMenu",
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                  defaultRoles: {
                    block: {
                      type: "lists_create_with",
                      inputs: {
                        ADD0: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of role to select by default",
                            },
                          },
                        },
                        ADD1: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of role to select by default",
                            },
                          },
                        },
                        ADD2: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of role to select by default",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              label(
                "Create a menu with USER options (auto-adds all users in the server) ↓"
              ),
              {
                kind: "block",
                type: "menus_addUserMenu",
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                  defaultUsers: {
                    block: {
                      type: "lists_create_with",
                      inputs: {
                        ADD0: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of user to select by default",
                            },
                          },
                        },
                        ADD1: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of user to select by default",
                            },
                          },
                        },
                        ADD2: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of user to select by default",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              label(
                "Create a menu with USER AND ROLE options (auto-adds all users and roles in the server) ↓"
              ),
              {
                kind: "block",
                type: "menus_addMentionableMenu",
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                  defaultVals: {
                    block: {
                      type: "lists_create_with",
                      inputs: {
                        ADD0: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of role/user to select by default",
                            },
                          },
                        },
                        ADD1: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of role/user to select by default",
                            },
                          },
                        },
                        ADD2: {
                          block: {
                            type: "text",
                            fields: {
                              TEXT: "ID of role/user to select by default",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              label("Menu events ↓"),
              block("menus_event"),
              label("Info about the clicked menu ↓"),
              block("menus_id"),
              block("menus_value"),
              block("misc_int_member"),
              block("misc_int_user"),
              block("misc_int_channel"),
              block("misc_int_server"),
              label("Menu actions ↓"),
              {
                kind: "label",
                text: "Use 'defer reply' to show 'bot is thinking...' message",
              },
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              {
                kind: "block",
                type: "misc_int_deferReply",
                inputs: {
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "misc_int_reply_mutator",
                inputs: {
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                  content: { shadow: shadow("text") },
                },
              },
              {
                kind: "block",
                type: "misc_int_edit_mutator",
                inputs: {
                  content: { shadow: shadow("text") },
                },
              },
              {
                kind: "block",
                type: "menus_update",
                inputs: {
                  content: { shadow: shadow("text") },
                },
              },
              block("menus_del"),
            ],
          },
          {
            kind: "category",
            name: "Context Menus",
            colour: "#00A859",
            contents: [
              label("Setup context menus ↓"),
              block("misc_createcontainer_global"),
              label("Add a context menu ↓"),
              {
                kind: "block",
                type: "contextMenu_create",
                inputs: {
                  name: {
                    shadow: {
                      type: "text",
                    },
                  },
                  dms: {
                    shadow: {
                      type: "logic_boolean",
                    },
                  },
                },
              },
              label("Events ↓"),
              block("contextMenu_received"),
              label("Actions ↓"),
              {
                kind: "block",
                type: "misc_int_reply_mutator",
                inputs: {
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                  content: { shadow: shadow("text") },
                },
              },
              {
                kind: "label",
                text: "Use 'defer reply' to show 'bot is thinking...' message",
              },
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              {
                kind: "block",
                type: "misc_int_deferReply",
                inputs: {
                  ephemeral: {
                    shadow: {
                      type: "logic_boolean",
                      fields: { BOOL: "FALSE" },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "misc_int_edit_mutator",
                inputs: {
                  content: { shadow: shadow("text") },
                },
              },
              label("Information about the context menu clicked ↓"),
              block("contextMenu_name"),
              block("contextMenu_userMenu"),
              block("contextMenu_messageMenu"),
              block("misc_int_member"),
              block("misc_int_user"),
              block("misc_int_channel"),
              block("misc_int_server"),
              label("Only if the menu is an user menu ↓"),
              block("contextMenu_targetUser"),
              label("Only if the menu is a message menu ↓"),
              block("contextMenu_targetMessage"),
            ],
          },
        ],
      },
      {
        kind: "category",
        name: "Events",
        colour: "FF4F4F",
        contents: [
          {
            kind: "category",
            name: "Server Actions",
            colour: "FF4F4F",
            contents: [
              block("events_guild_memberAdd"),
              block("events_guild_memberAdd_member"),
              block("events_guild_memberAdd_server"),
              label("------------------------------------------------"),
              block("events_remove_guildmemberremove"),
              block("events_remove_guildmemberremove_member"),
              block("events_remove_guildmemberremove_server"),
              label("------------------------------------------------"),
              block("events_guild_created"),
              block("events_guild_created_guild"),
              block("events_guild_deleted"),
              block("events_guild_deleted_guild"),
            ],
          },
          {
            kind: "category",
            name: "Message Actions",
            colour: "FF4F4F",
            contents: [
              block("events_message_deleted"),
              block("events_message_deleted_message"),
              label("------------------------------------------------"),
              block("events_message_ReactionAdd"),
              block("events_message_ReactionAdd_user"),
              block("events_message_ReactionAdd_msg"),
              block("events_message_ReactionAdd_emoji"),
              block("events_message_ReactionAdd_count"),
              label("------------------------------------------------"),
              block("events_message_edited"),
              block("events_message_edited_message"),
              block("events_message_edited_oldContent"),
              block("events_message_edited_newContent"),
              label("------------------------------------------------"),
              block("events_message_pinned"),
              block("events_message_pinned_message"),
            ],
          },
          {
            kind: "category",
            name: "Member Actions",
            colour: "FF4F4F",
            contents: [
              block("events_members_addRole"),
              block("events_members_addRole_member"),
              block("events_members_addRole_role"),
              label("------------------------------------------------"),
              block("events_members_removeRole"),
              block("events_members_removeRole_member"),
              block("events_members_removeRole_role"),
              label("------------------------------------------------"),
              block("events_members_nickname"),
              block("events_members_nickname_member"),
              block("events_members_nickname_oldNickname"),
              block("events_members_nickname_newNickname"),
            ],
          },
          {
            kind: "category",
            name: "Custom",
            colour: "#999999",
            contents: [
              label("Use custom discord.js v14 events ↓"),
              block("events_custom"),
              block("events_customParameter"),
            ],
          },
        ],
      },
      sep(),
      {
        kind: "category",
        name: "Databases",
        colour: "C66953",
        contents: [
          {
            kind: "category",
            name: "Simple",
            colour: "C66953",
            contents: [
              label("Create a database first ↓"),
              block("db_create"),
              label("Get information from the database ↓"),
              {
                kind: "block",
                type: "db_get",
                inputs: {
                  id: { shadow: shadow("text") },
                },
              },
              {
                kind: "block",
                type: "db_has",
                inputs: {
                  id: { shadow: shadow("text") },
                },
              },
              block("db_all"),
              label("Actions in the database ↓"),
              {
                kind: "block",
                type: "db_set",
                inputs: {
                  id: { shadow: shadow("text") },
                  val: { shadow: shadow("text") },
                },
              },
              {
                kind: "block",
                type: "db_del",
                inputs: {
                  id: { shadow: shadow("text") },
                },
              },
              {
                kind: "block",
                type: "db_add",
                inputs: {
                  id: { shadow: shadow("text") },
                  val: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                },
              },
              {
                kind: "block",
                type: "db_sub",
                inputs: {
                  id: { shadow: shadow("text") },
                  val: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                },
              },
              {
                kind: "block",
                type: "db_push",
                inputs: {
                  id: { shadow: shadow("text") },
                  val: { shadow: shadow("text") },
                },
              },
              block("db_clear"),
            ],
          },
        ],
      },
      {
        kind: "category",
        name: "Apps / Utils",
        colour: "#0fbd8c",
        contents: [
          {
            kind: "category",
            name: "Scratch",
            colour: "#e6a53e",
            contents: [
              {
                kind: "block",
                type: "scratch_getprofile",
                inputs: {
                  username: { shadow: shadow("text") },
                },
              },
              block("scratch_getprofileinfo"),
              {
                kind: "block",
                type: "scratch_getmessages",
                inputs: {
                  username: { shadow: shadow("text") },
                },
              },
            ],
          },
          {
            kind: "category",
            name: "Captcha",
            colour: "#0fbd8c",
            contents: [
              label("Create a captcha first ↓"),
              block("captcha_create_mutator"),
              block("captcha_value"),
              label("Send captcha image ↓"),
              {
                kind: "block",
                type: "channel_send_mutator",
                extraState:
                  '<mutation xmlns="http://www.w3.org/1999/xhtml" embeds="false" rows="false" files="true" then="false"></mutation>',
                inputs: {
                  content: {
                    shadow: {
                      type: "text",
                    },
                  },
                  files: {
                    block: {
                      type: "captcha_addFile",
                    },
                  },
                },
              },
            ],
          },
          {
            kind: "category",
            name: "Fetch",
            colour: "#0fbd8c",
            contents: [
              label("Send a request to a url ↓"),
              {
                kind: "block",
                type: "fetch_send",
                inputs: {
                  url: { shadow: shadow("text") },
                },
              },
              label("----------------------------------------------"),
              label("Advanced request ↓"),
              {
                kind: "block",
                type: "fetch_sendAdvanced",
                inputs: {
                  url: { shadow: shadow("text") },
                  config: {
                    block: {
                      type: "fetch_configSection",
                      inputs: {
                        key: {
                          shadow: {
                            type: "text",
                            fields: {
                              TEXT: "data",
                            },
                          },
                        },
                        value: {
                          block: {
                            type: "object_new",
                            inputs: {
                              keys: {
                                block: {
                                  type: "object_addkey",
                                  inputs: {
                                    value: {
                                      shadow: {
                                        type: "text",
                                        fields: {
                                          TEXT: "value",
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "fetch_configSection",
                inputs: {
                  key: { shadow: shadow("text") },
                  value: { shadow: shadow("text") },
                },
              },
              label("----------------------------------------------"),
              label("Information about the response ↓"),
              block("fetch_responseData"),
              block("fetch_responseStatus"),
              block("fetch_responseHeaders"),
              label(
                "Get a key from the response data (from the objects category) ↓"
              ),
              {
                kind: "block",
                type: "object_getkey",
                inputs: {
                  key: {
                    shadow: {
                      type: "text",
                      fields: {
                        TEXT: "",
                      },
                    },
                  },
                  object: {
                    shadow: {
                      type: "fetch_responseData",
                    },
                  },
                },
              },
            ],
          },
          {
            kind: "category",
            name: "Canvas",
            colour: "#4C9F70",
            contents: [
              label("Create a Canvas ↓"),
              {
                kind: "block",
                type: "canvas_createCanvas",
                inputs: {
                  WIDTH: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 512,
                      },
                    },
                  },
                  HEIGHT: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 512,
                      },
                    },
                  },
                },
              },
              label("Export the Canvas ↓"),
              {
                kind: "block",
                type: "channel_send_mutator",
                extraState:
                  '<mutation xmlns="http://www.w3.org/1999/xhtml" embeds="false" rows="false" files="true" then="false"></mutation>',
                inputs: {
                  content: {
                    shadow: {
                      type: "text",
                    },
                  },
                  files: {
                    block: {
                      type: "canvas_addFile",
                    },
                  },
                },
              },
              block("canvas_asData"),
              label("Properties ↓"),
              block("canvas_width"),
              block("canvas_height"),
              label("Actions ↓"),
              {
                kind: "block",
                type: "canvas_setFillColor",
                inputs: {
                  COLOR: {
                    shadow: {
                      type: "colour_picker",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_setStrokeColor",
                inputs: {
                  COLOR: {
                    shadow: {
                      type: "colour_picker",
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_setLineWidth",
                inputs: {
                  WIDTH: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 5,
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_setFont",
                inputs: {
                  FONT: {
                    shadow: {
                      type: "text",
                      fields: {
                        TEXT: "20px Arial",
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_fillText",
                inputs: {
                  TEXT: {
                    shadow: {
                      type: "text",
                      fields: {
                        TEXT: "Hello!",
                      },
                    },
                  },
                  X: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 10,
                      },
                    },
                  },
                  Y: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 50,
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_strokeText",
                inputs: {
                  TEXT: {
                    shadow: {
                      type: "text",
                      fields: {
                        TEXT: "Outlined!",
                      },
                    },
                  },
                  X: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 10,
                      },
                    },
                  },
                  Y: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 90,
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_drawRectangle",
                inputs: {
                  X: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                  Y: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                  W: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 512,
                      },
                    },
                  },
                  H: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 512,
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_drawCircle",
                inputs: {
                  X: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                  Y: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                  R: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 256,
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_drawLine",
                inputs: {
                  X1: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                  Y1: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                  X2: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 512,
                      },
                    },
                  },
                  Y2: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 512,
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_drawImage",
                inputs: {
                  SRC: {
                    shadow: {
                      type: "text",
                      fields: {
                        TEXT: "https://www.disfuse.xyz/media/disfuse.png",
                      },
                    },
                  },
                  X: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                  Y: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                  W: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 128,
                      },
                    },
                  },
                  H: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 128,
                      },
                    },
                  },
                },
              },
              block("canvas_clearCanvas"),
              label("Transforms ↓"),
              block("canvas_save"),
              block("canvas_restore"),
              {
                kind: "block",
                type: "canvas_translate",
                inputs: {
                  DX: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                  DY: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0,
                      },
                    },
                  },
                },
              },
              {
                kind: "block",
                type: "canvas_rotate",
                inputs: {
                  ANGLE: {
                    shadow: {
                      type: "math_number",
                      fields: {
                        NUM: 0.5,
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      sep(),
      {
        kind: "category",
        name: "Comments",
        colour: "#476586",
        contents: [
          label("These blocks will also be visible on your code!"),
          block("comment_multiline"),
          block("comment_statement"),
          block("comment_float"),
          {
            kind: "block",
            type: "comment_value",
            inputs: {
              VALUE: {
                block: {
                  type: "text",
                  fields: {
                    TEXT: "value",
                  },
                },
              },
            },
          },
          block("comment_stackImage"),
        ],
      },
      {
        kind: "category",
        name: "Music",
        colour: "#379e37",
        contents: [
          label("Get lyrics ↓"),
          block("music_findLyrics", {
            inputs: {
              artist: { shadow: shadow("text") },
              song: { shadow: shadow("text") },
            },
          }),
          block("music_findLyrics_lyrics"),
        ],
      },
      {
        kind: "category",
        name: "Files",
        colour: "#eb8334",
        contents: [
          label("Files will be created AFTER the bot is run"),
          label("Read data from files ↓"),
          {
            kind: "block",
            type: "fs_readFile",
            inputs: {
              path: { shadow: shadow("text") },
            },
          },
          block("fs_readFile_data"),
          {
            kind: "block",
            type: "fs_readdir",
            inputs: {
              path: { shadow: shadow("text") },
            },
          },
          block("fs_readdir_name"),
          block("fs_readdir_path"),
          label("Write a file ↓"),
          {
            kind: "block",
            type: "fs_writeFile",
            inputs: {
              path: { shadow: shadow("text") },
              data: { shadow: shadow("text") },
            },
          },
          label("File actions ↓"),
          {
            kind: "block",
            type: "fs_deleteFile",
            inputs: {
              path: { shadow: shadow("text") },
            },
          },
          {
            kind: "block",
            type: "fs_renameFile",
            inputs: {
              path: { shadow: shadow("text") },
              newpath: { shadow: shadow("text") },
            },
          },
          {
            kind: "block",
            type: "channel_send_mutator",
            extraState:
              '<mutation embeds="false" rows="false" files="true" then="false"></mutation>',
            inputs: {
              content: {
                shadow: {
                  type: "text",
                },
              },
              files: {
                block: {
                  type: "misc_addFile",
                  inputs: {
                    path: {
                      shadow: {
                        type: "text",
                        fields: { TEXT: "./file.txt" },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      sep(),
      {
        kind: "category",
        name: "Workshop",
        colour: "#014f98",
        contents: [
          label(`You have ${blockPacks.length} installed block pack${blockPacks.length === 0
            ? "s. Go to the workshop page to discover and install new block packs."
            : blockPacks.length === 1
              ? ":"
              : "s:"
            }`,
          ),
          ...blockPacks.map((pack) =>
            label(
              `- ${pack.name} v${pack.versions[pack.versions.length - 1]?.version || "0.0.0"}`
            )
          ),
          ...blockPacks.map((pack) => ({
            kind: "category",
            name: pack.name,
            colour: pack.color || "#014f98",
            contents: pack.versions[pack.versions.length - 1]?.blocks?.length
              ? pack.versions[pack.versions.length - 1]?.blocks?.map(
                (block) => block(block.name)
              )
              : [],
          })),
        ],
      },
      {
        kind: "category",
        name: "BlockBuddy",
        colour: "#014f98",
        contents: [
          label("Click BlockBuddy > Create to make new custom blocks"),
          ...(user?.customBlocks || []).map((block) =>
            block(block.definition.type)
          ),
        ],
      },
      ...(window.location.hostname === "localhost"
        ? [
          sep(),
          {
            kind: "category",
            name: "Testing",
            colour: "#014f98",
            contents: [block("my_custom_block")],
          },
        ]
        : []),
      /*{
      kind: 'category',
      name: 'Games',
      colour: '#4fb88a',
      contents: [
        block("game_2048"),
        block("game_connect4"),
        block("game_fasttype"),
        block("game_findemoji"),
        block("game_flood"),
        block("game_hangman"),
        block("game_matchpairs"),
        block("game_minesweeper"),
        block("game_rps"),
        block("game_slots"),
        block("game_snake"),
        block("game_tictactoe"),
        block("game_wordle"),
        block("game_trivia"),
      ],
    },*/
    ],
  };
}
