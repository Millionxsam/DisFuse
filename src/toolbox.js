export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Logic",
      categorystyle: "logic_category",
      contents: [
        {
          kind: "block",
          type: "controls_if",
        },
        {
          kind: "block",
          type: "logic_compare",
        },
        {
          kind: "block",
          type: "logic_operation",
        },
        {
          kind: "block",
          type: "logic_negate",
        },
        {
          kind: "block",
          type: "logic_boolean",
        },
        {
          kind: "block",
          type: "logic_null",
        },
        {
          kind: "block",
          type: "logic_ternary",
        },
      ],
    },
    {
      kind: "category",
      name: "Loops",
      categorystyle: "loop_category",
      contents: [
        {
          kind: "block",
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
          kind: "block",
          type: "controls_whileUntil",
        },
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
        {
          kind: "block",
          type: "controls_forEach",
        },
        {
          kind: "block",
          type: "controls_flow_statements",
        },
      ],
    },
    {
      kind: "category",
      name: "Math",
      categorystyle: "math_category",
      contents: [
        {
          kind: "block",
          type: "math_number",
          fields: {
            NUM: 123,
          },
        },
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
        {
          kind: "block",
          type: "math_constant",
        },
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
        {
          kind: "block",
          type: "math_random_float",
        },
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
      name: "Text",
      categorystyle: "text_category",
      contents: [
        {
          kind: "block",
          type: "text",
        },
        {
          kind: "block",
          type: "text_multiline",
        },
        {
          kind: "block",
          type: "text_join",
        },
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
      ],
    },
    {
      kind: "category",
      name: "Lists",
      categorystyle: "list_category",
      contents: [
        {
          kind: "block",
          type: "lists_create_with",
        },
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
        {
          kind: "block",
          type: "lists_length",
        },
        {
          kind: "block",
          type: "lists_isEmpty",
        },
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
        {
          kind: "block",
          type: "lists_sort",
        },
        {
          kind: "block",
          type: "lists_reverse",
        },
      ],
    },
    {
      kind: "category",
      name: "Color",
      categorystyle: "colour_category",
      contents: [
        {
          kind: "block",
          type: "colour_picker",
        },
        {
          kind: "block",
          type: "colour_random",
        },
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
    {
      kind: "sep",
    },
    {
      kind: "category",
      name: "Variables",
      categorystyle: "variable_category",
      custom: "VARIABLE",
    },
    {
      kind: "category",
      name: "Functions",
      categorystyle: "procedure_category",
      custom: "PROCEDURE",
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
          kind: "block",
          type: "main_token",
        },
        {
          kind: "label",
          text: "The user of the bot ↓",
        },
        {
          kind: "block",
          type: "main_bot",
        },
        {
          kind: "label",
          text: "Events ↓",
        },
        {
          kind: "block",
          type: "main_ready",
        },
        {
          kind: "label",
          text: "Actions ↓",
        },
        {
          kind: "block",
          type: "main_presence",
        },
        {
          kind: "label",
          text: "Advanced ↓",
        },
        {
          kind: "block",
          type: "main_env",
        },
      ],
    },
    {
      kind: "category",
      name: "Messages",
      colour: "#336EFF",
      contents: [
        {
          kind: "label",
          text: "Events ↓",
        },
        {
          kind: "block",
          type: "msg_received",
        },
        {
          kind: "label",
          text: "Actions ↓",
        },
        {
          kind: "block",
          type: "msg_reply",
        },
        {
          kind: "label",
          text: "Information about the message ↓",
        },
        {
          kind: "block",
          type: "msg_content",
        },
        {
          kind: "block",
          type: "msg_member",
        },
        {
          kind: "block",
          type: "msg_user",
        },
        {
          kind: "block",
          type: "msg_channel",
        },
        {
          kind: "block",
          type: "msg_server",
        },
      ],
    },
    {
      kind: "category",
      name: "Slash",
      colour: "#00A859",
      contents: [
        {
          kind: "label",
          text: "Create a slash command first ↓",
        },
        {
          kind: "block",
          type: "slash_create",
          inputs: {
            nsfw: {
              shadow: {
                type: "logic_boolean",
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
          kind: "block",
          type: "slash_addoption",
        },
        {
          kind: "block",
          type: "slash_addchoice",
        },
        {
          kind: "block",
          type: "slash_addsubcommand",
        },
        {
          kind: "block",
          type: "slash_addsubcommandgroup",
        },
        {
          kind: "label",
          text: "Events ↓",
        },
        {
          kind: "block",
          type: "slash_received",
        },
        {
          kind: "label",
          text: "Information about the command ran ↓",
        },
        {
          kind: "block",
          type: "slash_name",
        },
        {
          kind: "block",
          type: "slash_member",
        },
        {
          kind: "block",
          type: "slash_user",
        },
        {
          kind: "block",
          type: "slash_channel",
        },
        {
          kind: "block",
          type: "slash_server",
        },
      ],
    },
    {
      kind: "sep",
    },
    {
      kind: "category",
      name: "Servers",
      colour: "A33DAC",
      contents: [
        {
          kind: "label",
          text: "Get a server ↓",
        },
        {
          kind: "block",
          type: "server_getone",
        },
        {
          kind: "label",
          text: "Get all servers ↓",
        },
        {
          kind: "block",
          type: "server_getall",
        },
        {
          kind: "block",
          type: "server_guild",
        },
        {
          kind: "label",
          text: "Information about a server ↓",
        },
        {
          kind: "block",
          type: "server_name",
        },
        {
          kind: "block",
          type: "server_membercount",
        },
        {
          kind: "block",
          type: "server_id",
        },
        {
          kind: "block",
          type: "server_banner",
        },
        {
          kind: "block",
          type: "server_icon",
        },
        {
          kind: "block",
          type: "server_ownerid",
        },
        {
          kind: "block",
          type: "server_dsc",
        },
        {
          kind: "block",
          type: "server_afkchannel",
        },
        {
          kind: "block",
          type: "server_creationdate",
        },
        {
          kind: "block",
          type: "server_vanityurl",
        },
        {
          kind: "block",
          type: "server_systemchannel",
        },
        {
          kind: "block",
          type: "server_ruleschannel",
        },
        {
          kind: "block",
          type: "server_verified",
        },
      ],
    },
  ],
};
