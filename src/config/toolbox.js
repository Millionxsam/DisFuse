let block = "block";
let category = "category";
let sep = "sep";
let label = "label";

export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "search",
      name: "Search",
    },
    {
      kind: sep,
    },
    {
      kind: category,
      name: "Logic",
      categorystyle: "logic_category",
      contents: [
        {
          kind: block,
          type: "controls_if",
        },
        {
          kind: block,
          type: "logic_compare",
        },
        {
          kind: block,
          type: "logic_operation",
        },
        {
          kind: block,
          type: "logic_negate",
        },
        {
          kind: block,
          type: "logic_boolean",
        },
        {
          kind: block,
          type: "logic_null",
        },
        {
          kind: block,
          type: "logic_ternary",
        },
        {
          kind: block,
          type: "logic_nullishOperator",
        },
        {
          kind: label,
          text: "--------------------------------",
        },
        {
          kind: block,
          type: "logic_switch",
        },
        {
          kind: block,
          type: "logic_case",
        },
        {
          kind: block,
          type: "logic_default",
        },
        {
          kind: label,
          text: "--------------------------------",
        },
      ],
    },
    {
      kind: "category",
      name: "Loops",
      categorystyle: "loop_category",
      contents: [
        {
          kind: block,
          type: "controls_repeat_ext",
          inputs: {
            TIMES: {
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
          kind: block,
          type: "controls_whileUntil",
        },
        {
          kind: block,
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
        {
          kind: block,
          type: "controls_forEach",
        },
        {
          kind: block,
          type: "controls_flow_statements",
        },
      ],
    },
    {
      kind: "category",
      name: "Text",
      colour: "#59c059",
      contents: [
        {
          kind: block,
          type: "text",
        },
        {
          kind: block,
          type: "text_multiline",
        },
        {
          kind: block,
          type: "text_join",
        },
        {
          kind: block,
          type: "text_newline",
        },
        {
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          }
        },
        {
          kind: "label",
          text: "Advanced | RegExp Blocks ↓",
        },
        {
          kind: block,
          type: "text_regexp",
        },
        {
          kind: block,
          type: "text_regexp_test",
        },
        {
          kind: block,
          type: "text_regexp_match",
        },
        {
          kind: block,
          type: "text_regexp_exec",
        },
        {
          kind: block,
          type: "text_regexp_replace",
        },
      ],
    },
    {
      kind: "category",
      name: "Math",
      colour: "#cfa23a",
      contents: [
        {
          kind: block,
          type: "math_number",
          fields: {
            NUM: 123,
          },
        },
        {
          kind: block,
          type: "math_toNumber",
        },
        {
          kind: block,
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
          kind: block,
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
          kind: block,
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
        {
          kind: block,
          type: "math_constant",
        },
        {
          kind: block,
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
          kind: block,
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
          kind: block,
          type: "math_on_list",
          fields: {
            OP: "SUM",
          },
        },
        {
          kind: block,
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
          kind: block,
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
          kind: block,
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
        {
          kind: block,
          type: "math_random_float",
        },
        {
          kind: block,
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
        {
          kind: block,
          type: "lists_create_with",
        },
        {
          kind: block,
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
        {
          kind: block,
          type: "lists_length",
        },
        {
          kind: block,
          type: "lists_isEmpty",
        },
        {
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
          kind: block,
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
        {
          kind: block,
          type: "lists_sort",
        },
        {
          kind: block,
          type: "lists_reverse",
        },
        {
          kind: block,
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
          kind: block,
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
      ],
    },
    {
      kind: category,
      name: "Objects",
      colour: "#BA59CE",
      contents: [
        {
          kind: "label",
          text: "Objects are like lists, but each item has a value",
        },
        {
          kind: "label",
          text: "Create an object ↓",
        },
        {
          kind: block,
          type: "object_new",
        },
        {
          kind: block,
          type: "object_addkey",
        },
        {
          kind: "label",
          text: "Object actions ↓",
        },
        {
          kind: block,
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
          kind: block,
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
        {
          kind: block,
          type: "object_stringify",
        },
        {
          kind: block,
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
        {
          kind: label,
          text: "Information about object ↓",
        },
        {
          kind: block,
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
          kind: block,
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
        {
          kind: block,
          type: "object_length",
        },
        {
          kind: block,
          type: "object_keys",
        },
        {
          kind: block,
          type: "object_values",
        },
      ],
    },
    {
      kind: "category",
      name: "Time",
      colour: "#db4b9c",
      contents: [
        {
          kind: "label",
          text: "Get a date ↓",
        },
        {
          kind: block,
          type: "time_date_now",
        },
        {
          kind: block,
          type: "time_date",
        },
        {
          kind: block,
          type: "time_createdate",
        },
        {
          kind: "label",
          text: "Timestamp creation ↓",
        },
        {
          kind: block,
          type: "time_timestampFromDate",
        },
        {
          kind: "label",
          text: "Convertion / Operations ↓",
        },
        {
          kind: block,
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
          kind: block,
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
        {
          kind: block,
          type: "time_between",
        },
        {
          kind: "label",
          text: "String convertion ↓",
        },
        {
          kind: block,
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
          }
        },
        {
          kind: block,
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
          }
        }
      ],
    },
    {
      kind: "category",
      name: "Color",
      colour: "#ad794c",
      contents: [
        {
          kind: block,
          type: "colour_picker",
        },
        {
          kind: block,
          type: "colour_random",
        },
        {
          kind: block,
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
          kind: block,
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
    {
      kind: "sep",
    },
    {
      kind: category,
      name: "Data",
      categorystyle: "variable_category",
      contents: [
        {
          kind: "category",
          name: "Variables",
          categorystyle: "variable_category",
          custom: "VARIABLE",
        },
        {
          kind: "category",
          name: "Local Variables",
          colour: "#d98e2b",
          contents: [
            {
              kind: "label",
              text: "Local variables are like normal variables",
            },
            {
              kind: "label",
              text: "Except you can only use them on the same block/event they were defined on",
            },
            {
              kind: block,
              type: "localVars_set",
            },
            {
              kind: block,
              type: "localVars_change",
              inputs: {
                value: {
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
              kind: block,
              type: "localVars_get",
            },
          ],
        },
      ],
    },
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
        {
          kind: "label",
          text: "Run raw javascript ↓",
        },
        {
          kind: block,
          type: "javascript_raw",
        },
        {
          kind: block,
          type: "javascript_raw_float",
        },
        {
          kind: block,
          type: "javascript_raw_value",
        },
        {
          kind: "label",
          text: "Wait before running code ↓",
        },
        {
          kind: block,
          type: "javascript_wait",
        },
        {
          kind: "label",
          text: "Log to the console ↓",
        },
        {
          kind: block,
          type: "javascript_consolelog",
        },
        {
          kind: block,
          type: "javascript_consolewarn",
        },
        {
          kind: block,
          type: "javascript_consoleerror",
        },
        {
          kind: "label",
          text: "Try catch ↓",
        },
        {
          kind: block,
          type: "javascript_trycatch",
        },
        {
          kind: block,
          type: "javascript_trycatchfinally",
        },
        {
          kind: block,
          type: "javascript_trycatch_error",
        },
      ],
    },
    {
      kind: "sep",
    },
    {
      kind: "category",
      name: "Main",
      colour: "#FF6E33",
      contents: [
        {
          kind: "label",
          text: "Required ↓",
        },
        {
          kind: block,
          type: "main_token",
        },
        {
          kind: "label",
          text: "Get the value of a secret ↓",
        },
        {
          kind: block,
          type: "main_env",
        },
        {
          kind: "label",
          text: "The bot itself, represented as a Discord user ↓",
        },
        {
          kind: block,
          type: "main_bot",
        },
        {
          kind: "label",
          text: "Properties of the bot ↓",
        },
        {
          kind: block,
          type: "main_ping",
        },
        {
          kind: block,
          type: "main_numberof",
        },
        {
          kind: block,
          type: "main_readyAt",
        },
        {
          kind: "label",
          text: "Events ↓",
        },
        {
          kind: block,
          type: "main_ready",
        },
        {
          kind: "label",
          text: "Actions ↓",
        },
        {
          kind: block,
          type: "main_presence",
        },
        {
          kind: block,
          type: "main_destroy",
        },
      ],
    },
    {
      kind: "category",
      name: "Embeds",
      colour: "00A58E",
      contents: [
        {
          kind: "label",
          text: "Create the embed first ↓",
        },
        {
          kind: block,
          type: "embed_create",
        },
        {
          kind: "label",
          text: "Put all of these blocks INSIDE of the 'create embed' block above ↓",
        },
        {
          kind: block,
          type: "embed_settitle",
        },
        {
          kind: block,
          type: "embed_setdsc",
        },
        {
          kind: block,
          type: "embed_setcolor",
        },
        {
          kind: block,
          type: "embed_seturl",
        },
        {
          kind: block,
          type: "embed_setauthor",
        },
        {
          kind: block,
          type: "embed_setfooter",
        },
        {
          kind: block,
          type: "embed_setimage",
        },
        {
          kind: block,
          type: "embed_setthumb",
        },
        {
          kind: block,
          type: "embed_addfield",
        },
        {
          kind: block,
          type: "embed_settimestamp",
        },
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
            {
              kind: "label",
              text: "Get a message ↓",
            },
            {
              kind: block,
              type: "msg_getone",
            },
            {
              kind: "label",
              text: "Events ↓",
            },
            {
              kind: block,
              type: "msg_received",
            },
            {
              kind: "label",
              text: "Actions ↓",
            },
            {
              kind: block,
              type: "msg_reply",
            },
            {
              kind: block,
              type: "msg_reply_rows",
            },
            {
              kind: block,
              type: "misc_messageSent",
            },
            //{
            //  kind: block,
            //  type: 'msg_delete',
            //},
            {
              kind: block,
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
              kind: block,
              type: "msg_edit",
              inputs: {
                message: {
                  shadow: {
                    type: "misc_messageSent",
                  },
                },
              },
            },
            {
              kind: block,
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
            {
              kind: "label",
              text: "Information about the message ↓",
            },
            {
              kind: block,
              type: "msg_msg",
            },
            {
              kind: block,
              type: "msg_content",
            },
            {
              kind: block,
              type: "msg_member",
            },
            {
              kind: block,
              type: "msg_user",
            },
            {
              kind: block,
              type: "msg_channel",
            },
            {
              kind: block,
              type: "msg_server",
            },
            {
              kind: label,
              text: "Information about a message ↓",
            },
            {
              kind: block,
              type: "message_property",
            },
          ],
        },
        {
          kind: category,
          name: "Threads",
          colour: "#5b67a5",
          contents: [
            {
              kind: label,
              text: "Get a thread ↓",
            },
            {
              kind: block,
              type: "threads_getone",
            },
            {
              kind: block,
              type: "threads_msgHasThread",
            },
            {
              kind: block,
              type: "threads_msgThread",
            },
            {
              kind: label,
              text: "Create a thread ↓",
            },
            {
              kind: block,
              type: "threads_msgCreateThread",
            },
            {
              kind: block,
              type: "threads_channelCreateThread",
            },
            {
              kind: block,
              type: "threads_createdThread",
            },
            {
              kind: label,
              text: "Information about a thread ↓",
            },
            {
              kind: block,
              type: "threads_name",
            },
            {
              kind: block,
              type: "threads_createdAt",
            },
            {
              kind: block,
              type: "threads_lastMessage",
            },
            {
              kind: block,
              type: "threads_author",
            },
            {
              kind: block,
              type: "threads_authorMember",
            },
            {
              kind: block,
              type: "threads_id",
            },
            {
              kind: block,
              type: "threads_memberCount",
            },
            {
              kind: block,
              type: "threads_parentChannel",
            },
            {
              kind: label,
              text: "Thread actions ↓",
            },
            {
              kind: block,
              type: "threads_setName",
            },
            {
              kind: block,
              type: "threads_setArchived",
            },
            {
              kind: block,
              type: "threads_setLocked",
            },
            {
              kind: block,
              type: "threads_setSlowmode",
            },
            {
              kind: block,
              type: "threads_pin",
            },
            {
              kind: block,
              type: "threads_unpin",
            },
            {
              kind: block,
              type: "threads_join",
            },
            {
              kind: block,
              type: "threads_leave",
            },
            {
              kind: block,
              type: "threads_addUser",
            },
            {
              kind: block,
              type: "threads_removeUser",
            },
          ],
        },
        {
          kind: category,
          name: "Polls",
          colour: "#656b75",
          contents: [
            {
              kind: "label",
              text: "Create a poll ↓",
            },
            {
              kind: block,
              type: "poll_create",
            },
            {
              kind: block,
              type: "poll_choice",
            },
            {
              kind: block,
              type: "poll_sendchannel",
            },
            {
              kind: "label",
              text: "Events ↓",
            },
            {
              kind: block,
              type: "poll_whenvoteadded",
            },
            {
              kind: block,
              type: "poll_whenvoteaddedvotetext",
            },
            {
              kind: block,
              type: "poll_whenvoteaddedvoteemoji",
            },
            {
              kind: block,
              type: "poll_whenvoteaddedvoteuser",
            },
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
            {
              kind: "label",
              text: "Get a server ↓",
            },
            {
              kind: block,
              type: "server_getone",
            },
            {
              kind: "label",
              text: "Get all servers ↓",
            },
            {
              kind: block,
              type: "server_getall",
            },
            {
              kind: block,
              type: "server_guild",
            },
            {
              kind: "label",
              text: "Information about a server ↓",
            },
            {
              kind: block,
              type: "server_name",
            },
            {
              kind: block,
              type: "server_membercount",
            },
            {
              kind: block,
              type: "server_id",
            },
            {
              kind: block,
              type: "server_banner",
            },
            {
              kind: block,
              type: "server_icon",
            },
            {
              kind: block,
              type: "server_ownerid",
            },
            {
              kind: block,
              type: "server_dsc",
            },
            {
              kind: block,
              type: "server_afkchannel",
            },
            {
              kind: block,
              type: "server_creationdate",
            },
            {
              kind: block,
              type: "server_vanityurl",
            },
            {
              kind: block,
              type: "server_systemchannel",
            },
            {
              kind: block,
              type: "server_ruleschannel",
            },
            {
              kind: block,
              type: "server_verified",
            },
            {
              kind: "label",
              text: "Actions on a server ↓",
            },
            {
              kind: block,
              type: "server_disableinvites",
            },
            {
              kind: block,
              type: "server_leave",
            },
          ],
        },
        {
          kind: "category",
          name: "Channels",
          colour: "#AD509B",
          contents: [
            {
              kind: "label",
              text: "Get a channel ↓",
            },
            {
              kind: block,
              type: "channel_getone",
            },
            {
              kind: "label",
              text: "Get all channels ↓",
            },
            {
              kind: block,
              type: "channel_foreach",
            },
            {
              kind: block,
              type: "channel_channel",
            },
            {
              kind: "label",
              text: "Create a channel ↓",
            },
            {
              kind: block,
              type: "channel_create",
            },
            {
              kind: block,
              type: "channel_createdChannel",
            },
            {
              kind: "label",
              text: "Information about a channel ↓",
            },
            {
              kind: block,
              type: "channel_getslowmode",
            },
            {
              kind: block,
              type: "channel_getnsfw",
            },
            {
              kind: block,
              type: "channel_getParent",
            },
            {
              kind: block,
              type: "channel_gettopic",
            },
            {
              kind: block,
              type: "channel_gettype",
            },
            {
              kind: block,
              type: "channel_deletable",
            },
            {
              kind: block,
              type: "channel_manageable",
            },
            {
              kind: block,
              type: "channel_name",
            },
            {
              kind: block,
              type: "channel_id",
            },
            {
              kind: block,
              type: "channel_url",
            },
            {
              kind: block,
              type: "channel_created",
            },
            {
              kind: "label",
              text: "Channel actions ↓",
            },
            {
              kind: "label",
              text: "------------------------------------",
            },
            {
              kind: block,
              type: "channel_send",
            },
            {
              kind: block,
              type: "channel_send_rows",
            },
            {
              kind: block,
              type: "misc_messageSent",
            },
            {
              kind: "label",
              text: "------------------------------------",
            },
            {
              kind: block,
              type: "channel_setParent",
            },
            {
              kind: block,
              type: "channel_syncPerms",
            },
            {
              kind: block,
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
              kind: block,
              type: "channel_setnsfw",
            },
            {
              kind: "label",
              text: "----------------------------------------------------",
            },
            {
              kind: "label",
              text: "Set a permission on a certain channel ↓",
            },
            {
              kind: block,
              type: "channel_set_permission",
              inputs: {
                permission: {
                  shadow: {
                    type: "misc_permissionChannel",
                  },
                },
              },
            },
            {
              kind: block,
              type: "channel_setslowmode",
            },
            {
              kind: block,
              type: "channel_settopic",
            },
            {
              kind: block,
              type: "channel_starttyping",
            },
            {
              kind: block,
              type: "channel_bulkdelete",
            },
            {
              kind: block,
              type: "channel_setautoarchive",
            },
            {
              kind: block,
              type: "channel_clone",
            },
            {
              kind: block,
              type: "channel_createdChannel",
            },
            {
              kind: block,
              type: "channel_del",
            },
            {
              kind: block,
              type: "channel_setname",
            },
            {
              kind: block,
              type: "channel_set_permission",
            },
            {
              kind: block,
              type: "misc_permissionChannel",
            },
            {
              kind: block,
              type: "misc_everyone",
            },
            {
              kind: "label",
              text: "----------------------------------------------------",
            },
            {
              kind: "label",
              text: "Get the latest messages of a channel ↓",
            },
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
            {
              kind: "label",
              text: "----------------------------------------------------",
            },
          ],
        },
        {
          kind: category,
          name: "Roles",
          colour: "#B76489",
          contents: [
            {
              kind: "label",
              text: "Get a role ↓",
            },
            {
              kind: block,
              type: "roles_getone",
            },
            {
              kind: "label",
              text: "Loop through each role in a server ↓",
            },
            {
              kind: block,
              type: "roles_foreach",
            },
            {
              kind: block,
              type: "roles_foreach_role",
            },

            {
              kind: label,
              text: "Loop through each member who has a certain role ↓",
            },
            {
              kind: block,
              type: "roles_foreachMember",
            },
            {
              kind: block,
              type: "roles_currentLoopMember",
            },
            {
              kind: label,
              text: "Get the highest role in a server ↓",
            },
            {
              kind: block,
              type: "roles_highest",
            },
            {
              kind: "label",
              text: "Create a role in a server ↓",
            },
            {
              kind: block,
              type: "roles_create",
            },
            {
              kind: block,
              type: "misc_permission",
            },
            {
              kind: "label",
              text: "Check whether a certain member has a role ↓",
            },
            {
              kind: block,
              type: "roles_hasRole",
            },
            {
              kind: "label",
              text: "Information about a role ↓",
            },
            {
              kind: block,
              type: "roles_name",
            },
            {
              kind: block,
              type: "roles_id",
            },
            {
              kind: block,
              type: "roles_position",
            },
            {
              kind: block,
              type: "roles_hexColor",
            },
            {
              kind: block,
              type: "roles_createdAt",
            },
            {
              kind: block,
              type: "roles_hasPermission",
              inputs: {
                permission: {
                  shadow: {
                    type: "misc_permission",
                  },
                },
              },
            },
            {
              kind: "label",
              text: "Role actions ↓",
            },
            {
              kind: block,
              type: "roles_delete",
            },
            {
              kind: block,
              type: "roles_rename",
            },
            {
              kind: block,
              type: "roles_addToMember",
            },
            {
              kind: block,
              type: "roles_removeFromMember",
            },
            {
              kind: block,
              type: "roles_setPermissions",
            },
          ],
        },
        {
          kind: "category",
          name: "Members",
          colour: "#C17778",
          contents: [
            {
              kind: "label",
              text: "Member = one member of a server",
            },
            {
              kind: "label",
              text: "User = the total Discord user",
            },
            {
              kind: "label",
              text: "Some blocks only accept users",
            },
            {
              kind: "label",
              text: "Other blocks only accept members",
            },
            {
              kind: "label",
              text: "Some blocks can accept either one",
            },
            {
              kind: "label",
              text: "(It won't let you drag in the wrong one)",
            },
            {
              kind: "label",
              text: "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -",
            },
            {
              kind: "label",
              text: "Get a member or user ↓",
            },
            {
              kind: block,
              type: "member_getone",
            },
            {
              kind: block,
              type: "member_getuser",
            },
            {
              kind: "label",
              text: "Do something for every member in a server ↓",
            },
            {
              kind: block,
              type: "member_foreach",
            },
            {
              kind: block,
              type: "member_member",
            },
            {
              kind: "label",
              text: "Information about members/users ↓",
            },
            {
              kind: block,
              type: "member_status",
            },
            {
              kind: block,
              type: "member_userFlags",
            },
            {
              kind: block,
              type: "member_bannable",
            },
            {
              kind: block,
              type: "member_kickable",
            },
            {
              kind: block,
              type: "member_timedout",
            },
            {
              kind: block,
              type: "member_hasPermission",
              inputs: {
                permission: {
                  shadow: {
                    type: "misc_permission",
                  },
                },
              },
            },
            {
              kind: block,
              type: "member_color",
            },
            {
              kind: block,
              type: "member_id",
            },
            {
              kind: block,
              type: "member_joined",
            },
            {
              kind: block,
              type: "member_nickname",
            },
            {
              kind: block,
              type: "member_username",
            },
            {
              kind: block,
              type: "member_avatarURL",
            },
            {
              kind: block,
              type: "member_bannerURL",
            },
            {
              kind: block,
              type: "member_bot",
            },
            {
              kind: block,
              type: "member_system",
            },
            {
              kind: block,
              type: "member_accent",
            },
            {
              kind: block,
              type: "member_created",
            },
            {
              kind: block,
              type: "member_user",
            },
            {
              kind: "label",
              text: "Actions on users/members ↓",
            },
            {
              kind: block,
              type: "member_ban",
            },
            {
              kind: block,
              type: "member_timeout",
            },
            {
              kind: block,
              type: "member_kick",
            },
            {
              kind: block,
              type: "member_dm",
            },
            {
              kind: block,
              type: "member_dm_rows",
            },
            {
              kind: block,
              type: "member_setnick",
            },
            {
              kind: block,
              type: "member_removetimeout",
            },
          ],
        },
        {
          kind: "Category",
          name: "Invites",
          colour: "#CA8A67",
          contents: [
            {
              kind: "label",
              text: "Create/delete invites ↓",
            },
            {
              kind: block,
              type: "invite_create",
            },
            {
              kind: block,
              type: "invite_delete",
            },
            {
              kind: "label",
              text: "Get an invite ↓",
            },
            {
              kind: block,
              type: "invite_get",
            },
            {
              kind: "label",
              text: "Information about an invite ↓",
            },
            {
              kind: block,
              type: "invite_url",
            },
            {
              kind: block,
              type: "invite_channel",
            },
            {
              kind: block,
              type: "invite_author",
            },
            {
              kind: "label",
              text: "Loops ↓",
            },
            {
              kind: block,
              type: "invite_foreach",
            },
            {
              kind: block,
              type: "invite_channel_foreach",
            },
            {
              kind: block,
              type: "invite_foreach_var",
            },
            {
              kind: "label",
              text: "Events ↓",
            },
            {
              kind: block,
              type: "invite_invitecreated",
            },
            {
              kind: block,
              type: "invite_invitedeleted",
            },
            {
              kind: block,
              type: "invite_event_var",
            },
          ],
        },
        {
          kind: "category",
          name: "Webhooks",
          colour: "#D49E55",
          contents: [
            {
              kind: "label",
              text: "Get a webhook ↓",
            },
            {
              kind: block,
              type: "webhooks_fetch",
            },
            {
              kind: "label",
              text: "Create a webhook ↓",
            },
            {
              kind: block,
              type: "webhooks_create",
            },
            {
              kind: block,
              type: "webhooks_createdWebhook",
            },
            {
              kind: "label",
              text: "Get token of a webhook ↓",
            },
            {
              kind: "label",
              text: "WARNING: This should be kept private!",
            },
            {
              kind: block,
              type: "webhooks_token",
            },
            {
              kind: "label",
              text: "Actions ↓",
            },
            {
              kind: block,
              type: "webhooks_send",
            },
            {
              kind: block,
              type: "webhooks_delete",
            },
            {
              kind: block,
              type: "webhooks_edit",
            },
            {
              kind: "label",
              text: "Information about a webhook ↓",
            },
            {
              kind: block,
              type: "webhooks_name",
            },
            {
              kind: block,
              type: "webhooks_id",
            },
            {
              kind: block,
              type: "webhooks_owner",
            },
            {
              kind: block,
              type: "webhooks_createdAt",
            },
          ],
        },
        {
          kind: "category",
          name: "Emojis",
          colour: "#DEB144",
          contents: [
            {
              kind: "label",
              text: "Get an emoji ↓",
            },
            {
              kind: block,
              type: "emoji_getemojiwith",
            },
            {
              kind: "label",
              text: "Get all emojis ↓",
            },
            {
              kind: block,
              type: "emoji_getallinserver",
            },
            {
              kind: block,
              type: "emoji_getallinserver_value",
            },
            {
              kind: "label",
              text: "Information about an emoji ↓",
            },
            {
              kind: block,
              type: "emoji_getname",
            },
            {
              kind: block,
              type: "emoji_getid",
            },
            {
              kind: block,
              type: "emoji_getimageurl",
            },
            {
              kind: block,
              type: "emoji_isanimated",
            },
            {
              kind: block,
              type: "emoji_created",
            },
            {
              kind: block,
              type: "emoji_author",
            },
            {
              kind: "label",
              text: "Emoji actions ↓",
            },
            {
              kind: block,
              type: "emoji_create",
            },
            {
              kind: block,
              type: "emoji_delete",
            },
            {
              kind: block,
              type: "emoji_setname",
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
            {
              kind: "label",
              text: "Create a slash command first ↓",
            },
            {
              kind: "label",
              text: "It is recommended that you put the block below inside the 'when the bot is logged in' event ↓",
            },
            {
              kind: block,
              type: "misc_createcontainer",
            },
            {
              kind: block,
              type: "slash_create",
              inputs: {
                nsfw: {
                  shadow: {
                    type: "logic_boolean",
                    fields: {
                      BOOL: "FALSE",
                    },
                  },
                },
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
                dm: {
                  shadow: {
                    type: "logic_boolean",
                  },
                },
              },
            },
            {
              kind: block,
              type: "misc_permission",
            },
            {
              kind: block,
              type: "slash_addoption",
            },
            {
              kind: block,
              type: "slash_addchoice",
            },
            {
              kind: "label",
              text: "Subcommands (advanced) ↓",
            },
            {
              kind: block,
              type: "slash_addsubcommand",
            },
            {
              kind: block,
              type: "slash_addsubcommandgroup",
            },
            {
              kind: "label",
              text: "Events ↓",
            },
            {
              kind: block,
              type: "slash_received",
            },
            {
              kind: "label",
              text: "Actions ↓",
            },
            {
              kind: block,
              type: "misc_int_reply",
            },
            {
              kind: label,
              text: "Use 'defer reply' to show 'bot is thinking...' message",
            },
            {
              kind: label,
              text: "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply",
            },
            {
              kind: block,
              type: "misc_int_deferReply",
            },
            {
              kind: block,
              type: "misc_int_reply_rows",
            },
            {
              kind: block,
              type: "misc_addrow",
            },
            {
              kind: block,
              type: "misc_int_edit",
            },
            {
              kind: "label",
              text: "Information about the command ran ↓",
            },
            {
              kind: block,
              type: "slash_getoption",
            },
            {
              kind: block,
              type: "slash_name",
            },
            {
              kind: block,
              type: "slash_member",
            },
            {
              kind: block,
              type: "slash_user",
            },
            {
              kind: block,
              type: "slash_channel",
            },
            {
              kind: block,
              type: "slash_server",
            },
          ],
        },
        {
          kind: "category",
          name: "Buttons",
          colour: "#2677AF",
          contents: [
            {
              kind: "label",
              text: "Put this inside a block to send a row ↓",
            },
            {
              kind: block,
              type: "misc_addrow",
            },
            {
              kind: block,
              type: "buttons_add",
            },
            {
              kind: "label",
              text: "Button events ↓",
            },
            {
              kind: block,
              type: "buttons_event",
            },
            {
              kind: "label",
              text: "Info about the clicked button ↓",
            },
            {
              kind: block,
              type: "buttons_message",
            },
            {
              kind: block,
              type: "buttons_id",
            },
            {
              kind: block,
              type: "buttons_member",
            },
            {
              kind: block,
              type: "buttons_user",
            },
            {
              kind: block,
              type: "buttons_channel",
            },
            {
              kind: block,
              type: "buttons_server",
            },
            {
              kind: "label",
              text: "Button actions ↓",
            },
            {
              kind: block,
              type: "misc_int_reply",
            },
            {
              kind: label,
              text: "Use 'defer reply' to show 'bot is thinking...' message",
            },
            {
              kind: label,
              text: "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply",
            },
            {
              kind: block,
              type: "misc_int_deferReply",
            },
            {
              kind: block,
              type: "misc_int_edit",
            },
            {
              kind: block,
              type: "buttons_del",
            },
          ],
        },
        {
          kind: "category",
          name: "Modals",
          colour: "1A8793",
          contents: [
            {
              kind: "label",
              text: "Keep in mind that you can only show modals in slash commands!",
            },
            {
              kind: "label",
              text: "Show a modal to the user ↓",
            },
            {
              kind: block,
              type: "modal_show",
            },
            {
              kind: "label",
              text: "Create a modal (put this in the block above) ↓",
            },
            {
              kind: block,
              type: "modal_create",
            },
            {
              kind: "label",
              text: "Put text input(s) inside the 'create modal' block ↓",
            },
            {
              kind: block,
              type: "modal_add_text_input",
            },
            {
              kind: block,
              type: "modal_add_text_input_advanced",
            },
            {
              kind: "label",
              text: "Events ↓",
            },
            {
              kind: block,
              type: "modal_handle_interaction",
            },
            {
              kind: "label",
              text: "Information about the submitted modal ↓",
            },
            {
              kind: block,
              type: "modal_get_input_value",
            },
            {
              kind: block,
              type: "modal_get_author",
            },
            {
              kind: block,
              type: "modal_get_customId",
            },
            {
              kind: "label",
              text: "Reply to the modal after submitted ↓",
            },
            {
              kind: block,
              type: "misc_int_reply",
            },
            {
              kind: label,
              text: "Use 'defer reply' to show 'bot is thinking...' message",
            },
            {
              kind: label,
              text: "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply",
            },
            {
              kind: block,
              type: "misc_int_deferReply",
            },
            {
              kind: block,
              type: "misc_int_reply_rows",
            },
            {
              kind: block,
              type: "misc_int_edit",
            },
          ],
        },
        {
          kind: "category",
          name: "Select Menus",
          colour: "#26A483",
          contents: [
            {
              kind: "label",
              text: "Put this inside a block to send a row ↓",
            },
            {
              kind: block,
              type: "misc_addrow",
            },
            {
              kind: block,
              type: "menus_add",
            },
            {
              kind: block,
              type: "menus_addoption",
            },
            {
              kind: "label",
              text: "Menu events ↓",
            },
            {
              kind: block,
              type: "menus_event",
            },
            {
              kind: "label",
              text: "Info about the clicked menu ↓",
            },
            {
              kind: block,
              type: "menus_id",
            },
            {
              kind: block,
              type: "menus_value",
            },
            {
              kind: block,
              type: "menus_member",
            },
            {
              kind: block,
              type: "menus_user",
            },
            {
              kind: block,
              type: "menus_channel",
            },
            {
              kind: block,
              type: "menus_server",
            },
            {
              kind: "label",
              text: "Menu actions ↓",
            },
            {
              kind: label,
              text: "Use 'defer reply' to show 'bot is thinking...' message",
            },
            {
              kind: label,
              text: "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply",
            },
            {
              kind: block,
              type: "misc_int_deferReply",
            },
            {
              kind: block,
              type: "misc_int_reply",
            },
            {
              kind: block,
              type: "misc_int_edit",
            },
            {
              kind: block,
              type: "menus_update",
            },
            {
              kind: block,
              type: "menus_del",
            },
          ],
        },
        {
          kind: category,
          name: "Context Menus",
          colour: "#00A859",
          contents: [
            {
              kind: "label",
              text: "Create a context menu first ↓",
            },
            {
              kind: "label",
              text: "It is recommended that you put the block below inside the 'when the bot is logged in' event ↓",
            },
            {
              kind: block,
              type: "misc_createcontainer",
            },
            {
              kind: block,
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
            {
              kind: "label",
              text: "Events ↓",
            },
            {
              kind: block,
              type: "contextMenu_received",
            },
            {
              kind: "label",
              text: "Actions ↓",
            },
            {
              kind: block,
              type: "misc_int_reply",
            },
            {
              kind: label,
              text: "Use 'defer reply' to show 'bot is thinking...' message",
            },
            {
              kind: label,
              text: "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply",
            },
            {
              kind: block,
              type: "misc_int_deferReply",
            },
            {
              kind: block,
              type: "misc_int_reply_rows",
            },
            {
              kind: block,
              type: "misc_int_edit",
            },
            {
              kind: "label",
              text: "Information about the context menu clicked ↓",
            },
            {
              kind: block,
              type: "contextMenu_name",
            },
            {
              kind: block,
              type: "contextMenu_userMenu",
            },
            {
              kind: block,
              type: "contextMenu_messageMenu",
            },
            {
              kind: block,
              type: "contextMenu_member",
            },
            {
              kind: block,
              type: "contextMenu_user",
            },
            {
              kind: block,
              type: "contextMenu_channel",
            },
            {
              kind: block,
              type: "contextMenu_server",
            },
            {
              kind: "label",
              text: "Only if the menu is an user menu ↓",
            },
            {
              kind: block,
              type: "contextMenu_targetUser",
            },
            {
              kind: "label",
              text: "Only if the menu is a message menu ↓",
            },
            {
              kind: block,
              type: "contextMenu_targetMessage",
            },
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
            {
              kind: block,
              type: "events_guild_memberAdd",
            },
            {
              kind: block,
              type: "events_guild_memberAdd_member",
            },
            {
              kind: block,
              type: "events_guild_memberAdd_server",
            },
            {
              kind: sep,
              gap: "50",
            },
            {
              kind: block,
              type: "events_remove_guildmemberremove",
            },
            {
              kind: block,
              type: "events_remove_guildmemberremove_member",
            },
            {
              kind: block,
              type: "events_remove_guildmemberremove_server",
            },
            {
              kind: sep,
              gap: "50",
            },
            {
              kind: block,
              type: "events_guild_created",
            },
            {
              kind: block,
              type: "events_guild_created_guild",
            },
            {
              kind: block,
              type: "events_guild_deleted",
            },
            {
              kind: block,
              type: "events_guild_deleted_guild",
            },
          ],
        },
        {
          kind: "category",
          name: "Message Actions",
          colour: "FF4F4F",
          contents: [
            {
              kind: block,
              type: "events_message_deleted",
            },
            {
              kind: block,
              type: "events_message_deleted_message",
            },
            {
              kind: sep,
              gap: "50",
            },
            {
              kind: block,
              type: "events_message_ReactionAdd",
            },
            {
              kind: block,
              type: "events_message_ReactionAdd_emoji",
            },
            {
              kind: block,
              type: "events_message_ReactionAdd_count",
            },
          ],
        },
        {
          kind: category,
          name: "Member Actions",
          colour: "FF4F4F",
          contents: [
            {
              kind: block,
              type: "events_members_addRole",
            },
            {
              kind: block,
              type: "events_members_addRole_member",
            },
            {
              kind: block,
              type: "events_members_addRole_role",
            },
            {
              kind: block,
              type: "events_members_removeRole",
            },
            {
              kind: block,
              type: "events_members_removeRole_member",
            },
            {
              kind: block,
              type: "events_members_removeRole_role",
            },
          ],
        },
        {
          kind: category,
          name: "Custom",
          colour: "#999999",
          contents: [
            {
              kind: block,
              type: "events_custom",
            },
            {
              kind: block,
              type: "events_customParameter",
            },
          ],
        },
      ],
    },
    {
      kind: "sep",
    },
    {
      kind: "category",
      name: "Database",
      colour: "C66953",
      contents: [
        {
          kind: "label",
          text: "Create a database first ↓",
        },
        {
          kind: block,
          type: "db_create",
        },
        {
          kind: "label",
          text: "Get information from the database ↓",
        },
        {
          kind: block,
          type: "db_get",
        },
        {
          kind: block,
          type: "db_has",
        },
        {
          kind: block,
          type: "db_all",
        },
        {
          kind: "label",
          text: "Actions in the database ↓",
        },
        {
          kind: block,
          type: "db_set",
        },
        {
          kind: block,
          type: "db_del",
        },
        {
          kind: block,
          type: "db_add",
        },
        {
          kind: block,
          type: "db_sub",
        },
        {
          kind: block,
          type: "db_push",
        },
        {
          kind: block,
          type: "db_clear",
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
          colour: "#0fbd8c",
          contents: [
            {
              kind: block,
              type: "scratch_getprofile",
            },
            {
              kind: block,
              type: "scratch_getprofileinfo",
            },
            {
              kind: block,
              type: "scratch_getmessages",
            },
          ],
        },
        {
          kind: category,
          name: "Captcha",
          colour: "#0fbd8c",
          contents: [
            {
              kind: "label",
              text: "Create a captcha first ↓",
            },
            {
              kind: block,
              type: "captcha_create",
            },
            {
              kind: block,
              type: "captcha_value",
            },
            {
              kind: "label",
              text: "Send captcha image ↓",
            },
            {
              kind: block,
              type: "captcha_send",
            },
            {
              kind: block,
              type: "captcha_reply",
            },
          ],
        },
        {
          kind: "category",
          name: "Fetch",
          colour: "#0fbd8c",
          contents: [
            {
              kind: "label",
              text: "Send a request to a url ↓",
            },
            {
              kind: block,
              type: "fetch_send",
            },
            {
              kind: "label",
              text: "----------------------------------------------",
            },
            {
              kind: "label",
              text: "Advanced request ↓",
            },
            {
              kind: block,
              type: "fetch_sendAdvanced",
              inputs: {
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
              kind: block,
              type: "fetch_configSection",
            },
            {
              kind: "label",
              text: "----------------------------------------------",
            },
            {
              kind: "label",
              text: "Information about the response ↓",
            },
            {
              kind: block,
              type: "fetch_responseData",
            },
            {
              kind: block,
              type: "fetch_responseStatus",
            },
            {
              kind: block,
              type: "fetch_responseHeaders",
            },
            {
              kind: "label",
              text: "Get a key from the response data (from the objects category) ↓",
            },
            {
              kind: block,
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
      ],
    },
    {
      kind: "sep",
    },
    {
      kind: "category",
      name: "Comments",
      colour: "#364759",
      contents: [
        {
          kind: "label",
          text: "These blocks will also be visible on your code!",
        },
        {
          kind: block,
          type: "comment_stack",
        },
        {
          kind: block,
          type: "comment_statement",
        },
        {
          kind: block,
          type: "comment_float",
        },
        {
          kind: block,
          type: "comment_stackImage",
        },
      ],
    },
    {
      kind: category,
      name: "Music",
      colour: "#379e37",
      contents: [
        {
          kind: "label",
          text: "Get lyrics ↓",
        },
        {
          kind: block,
          type: "music_findLyrics",
        },
        {
          kind: block,
          type: "music_findLyrics_lyrics",
        },
      ],
    },
    {
      kind: category,
      name: "Files",
      colour: "#eb8334",
      contents: [
        {
          kind: label,
          text: "Files will be created AFTER the bot is run",
        },
        {
          kind: "label",
          text: "Read data from files ↓",
        },
        {
          kind: block,
          type: "fs_readFile",
        },
        {
          kind: block,
          type: "fs_readFile_data",
        },
        {
          kind: block,
          type: "fs_readdir",
        },
        {
          kind: block,
          type: "fs_readdir_name",
        },
        {
          kind: block,
          type: "fs_readdir_path",
        },
        {
          kind: "label",
          text: "Write a file ↓",
        },
        {
          kind: block,
          type: "fs_writeFile",
        },
        {
          kind: "label",
          text: "File actions ↓",
        },
        {
          kind: block,
          type: "fs_deleteFile",
        },
        {
          kind: block,
          type: "fs_renameFile",
        },
        {
          kind: block,
          type: "fs_sendFile",
        },
      ],
    },
    /*{
      kind: 'category',
      name: 'Games',
      colour: '#4fb88a',
      contents: [
        {
          kind: block,
          type: 'game_2048',
        },
        {
          kind: block,
          type: 'game_connect4',
        },
        {
          kind: block,
          type: 'game_fasttype',
        },
        {
          kind: block,
          type: 'game_findemoji',
        },
        {
          kind: block,
          type: 'game_flood',
        },
        {
          kind: block,
          type: 'game_hangman',
        },
        {
          kind: block,
          type: 'game_matchpairs',
        },
        {
          kind: block,
          type: 'game_minesweeper',
        },
        {
          kind: block,
          type: 'game_rps',
        },
        {
          kind: block,
          type: 'game_slots',
        },
        {
          kind: block,
          type: 'game_snake',
        },
        {
          kind: block,
          type: 'game_tictactoe',
        },
        {
          kind: block,
          type: 'game_wordle',
        },
        {
          kind: block,
          type: 'game_trivia',
        },
      ],
    },*/
  ],
};
