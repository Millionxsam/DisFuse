const DEFAULT_SHADOWS = {
  Number: { type: "math_number", fields: { NUM: 5 } },
  String: { type: "text", fields: { TEXT: "" } },
  Boolean: { type: "logic_boolean" }
};

function block(type, properties = {}) {
  return Object.assign(
    {},
    {
      kind: "block",
      type
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
    gap
  };
}

function label(text) {
  return {
    kind: "label",
    text
  };
}

export default function getToolbox(blockPacks = [], user) {
  return {
    kind: "categoryToolbox",
    contents: [
      {
        kind: "search",
        name: "Search"
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
          label("--------------------------------")
        ]
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
                  NUM: 10
                }
              })
            }
          }),
          block("controls_whileUntil"),
          block("controls_for", {
            inputs: {
              FROM: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 1
                  }
                })
              },
              TO: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 10
                  }
                })
              },
              BY: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 1
                  }
                })
              }
            }
          }),
          block("controls_forEach"),
          block("controls_flow_statements")
        ]
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
          block("text_append", {
            inputs: {
              TEXT: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: ""
                  }
                })
              }
            }
          }),
          block("text_length", {
            inputs: {
              VALUE: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "abc"
                  }
                })
              }
            }
          }),
          block("text_isEmpty", {
            inputs: {
              VALUE: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: ""
                  }
                })
              }
            }
          }),
          block("text_startOrEndWith", {
            inputs: {
              text: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "abc"
                  }
                })
              },
              text2: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: ""
                  }
                })
              }
            }
          }),
          block("text_indexOf", {
            inputs: {
              VALUE: {
                block: block("variables_get")
              },
              FIND: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "abc"
                  }
                })
              }
            }
          }),
          block("text_charAt", {
            inputs: {
              VALUE: {
                block: block("variables_get")
              }
            }
          }),
          block("text_getSubstring", {
            inputs: {
              STRING: {
                block: block("variables_get")
              }
            }
          }),
          block("text_changeCase", {
            inputs: {
              TEXT: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "abc"
                  }
                })
              }
            }
          }),
          block("text_trim", {
            inputs: {
              TEXT: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "abc"
                  }
                })
              }
            }
          }),
          block("text_count", {
            inputs: {
              SUB: {
                shadow: shadow("text")
              },
              TEXT: {
                shadow: shadow("text")
              }
            }
          }),
          block("text_repeat", {
            inputs: {
              text: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "abc"
                  }
                })
              },
              times: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 3
                  }
                })
              }
            }
          }),
          block("text_replace", {
            inputs: {
              FROM: {
                shadow: shadow("text")
              },
              TO: {
                shadow: shadow("text")
              },
              TEXT: {
                shadow: shadow("text")
              }
            }
          }),
          block("text_reverse", {
            inputs: {
              TEXT: {
                shadow: shadow("text")
              }
            }
          }),
          block("text_contains", {
            inputs: {
              text: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "abc"
                  }
                })
              },
              query: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "def"
                  }
                })
              }
            }
          }),
          label("Advanced | RegExp Blocks ↓"),
          block("text_regexp"),
          block("text_regexp_test", {
            inputs: {
              string: { shadow: shadow("text") }
            }
          }),
          block("text_regexp_match", {
            inputs: {
              string: { shadow: shadow("text") }
            }
          }),
          block("text_regexp_exec", {
            inputs: {
              string: { shadow: shadow("text") }
            }
          }),
          block("text_regexp_replace", {
            inputs: {
              string: { shadow: shadow("text") },
              replace: { shadow: shadow("text") }
            }
          })
        ]
      },
      {
        kind: "category",
        name: "Math",
        colour: "#cfa23a",
        contents: [
          block("math_number", {
            fields: {
              NUM: 123
            }
          }),
          block("math_toNumber"),
          block("math_arithmetic", {
            inputs: {
              A: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 1
                  }
                })
              },
              B: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 1
                  }
                })
              }
            }
          }),
          block("math_single", {
            inputs: {
              NUM: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 9
                  }
                })
              }
            }
          }),
          block("math_trig", {
            inputs: {
              NUM: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 45
                  }
                })
              }
            }
          }),
          block("math_constant"),
          block("math_number_property", {
            inputs: {
              NUMBER_TO_CHECK: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 0
                  }
                })
              }
            }
          }),
          block("math_round", {
            fields: {
              OP: "ROUND"
            },
            inputs: {
              NUM: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 3.1
                  }
                })
              }
            }
          }),
          block("math_on_list", {
            fields: {
              OP: "SUM"
            }
          }),
          block("math_modulo", {
            inputs: {
              DIVIDEND: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 64
                  }
                })
              },
              DIVISOR: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 10
                  }
                })
              }
            }
          }),
          block("math_constrain", {
            inputs: {
              VALUE: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 50
                  }
                })
              },
              LOW: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 1
                  }
                })
              },
              HIGH: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 100
                  }
                })
              }
            }
          }),
          block("math_random_int", {
            inputs: {
              FROM: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 1
                  }
                })
              },
              TO: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 100
                  }
                })
              }
            }
          }),
          block("math_random_float"),
          block("math_atan2", {
            inputs: {
              X: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 1
                  }
                })
              },
              Y: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 1
                  }
                })
              }
            }
          })
        ]
      },
      {
        kind: "category",
        name: "Lists",
        categorystyle: "list_category",
        contents: [
          block("lists_create_with"),
          block("lists_repeat", {
            inputs: {
              NUM: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 5
                  }
                })
              }
            }
          }),
          block("lists_length"),
          block("lists_isEmpty"),
          block("lists_indexOf", {
            inputs: {
              VALUE: {
                block: block("variables_get")
              }
            }
          }),
          block("lists_getIndex", {
            inputs: {
              VALUE: {
                block: block("variables_get")
              }
            }
          }),
          block("lists_setIndex", {
            inputs: {
              LIST: {
                block: block("variables_get")
              }
            }
          }),
          block("lists_getSublist", {
            inputs: {
              LIST: {
                block: block("variables_get")
              }
            }
          }),
          block("lists_split", {
            inputs: {
              DELIM: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: ","
                  }
                })
              }
            }
          }),
          block("lists_sort"),
          block("lists_reverse"),
          block("list_merge", {
            inputs: {
              list: {
                block: block("variables_get")
              }
            }
          }),
          block("list_filter", {
            inputs: {
              list: {
                block: block("variables_get")
              },
              method: {
                block: block("logic_compare", {
                  inputs: {
                    A: {
                      block: block("list_filter_item")
                    }
                  }
                })
              }
            }
          }),
          block("list_find", {
            inputs: {
              list: {
                block: block("variables_get")
              },
              method: {
                block: block("logic_compare", {
                  inputs: {
                    A: {
                      block: block("list_filter_item")
                    }
                  }
                })
              }
            }
          })
        ]
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
          block("object_setkey", {
            inputs: {
              key: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: ""
                  }
                })
              }
            }
          }),
          block("object_deletekey", {
            inputs: {
              key: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: ""
                  }
                })
              }
            }
          }),
          block("object_stringify"),
          block("object_parse", {
            inputs: {
              string: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: ""
                  }
                })
              }
            }
          }),
          label("Information about object ↓"),
          block("object_getkey", {
            inputs: {
              key: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: ""
                  }
                })
              }
            }
          }),
          block("object_has", {
            inputs: {
              string: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: ""
                  }
                })
              }
            }
          }),
          block("object_length"),
          block("object_keys"),
          block("object_values")
        ]
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
          block("time_timestampFromDate", {
            inputs: {
              DATE: shadow("time_date")
            }
          }),
          label("Convertion / Operations ↓"),
          block("time_convert", {
            inputs: {
              NUMBER: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 10
                  }
                })
              }
            }
          }),
          block("time_operation", {
            inputs: {
              NUMBER: shadow("math_number"),
              DATE: shadow("time_date")
            }
          }),
          block("time_between"),
          label("String convertion ↓"),
          block("time_stringToMS", {
            inputs: {
              TIME: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "10m"
                  }
                })
              }
            }
          }),
          block("time_msToString", {
            inputs: {
              TIME: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 1000
                  }
                })
              },
              LONG: {
                shadow: shadow("logic_boolean", {
                  fields: {
                    BOOL: "FALSE"
                  }
                })
              }
            }
          })
        ]
      },
      {
        kind: "category",
        name: "Colour",
        colour: "#ad794c",
        contents: [
          block("colour_picker"),
          block("colour_convert"),
          block("colour_random"),
          block("colour_rgb", {
            inputs: {
              RED: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 100
                  }
                })
              },
              GREEN: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 50
                  }
                })
              },
              BLUE: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 0
                  }
                })
              }
            }
          }),
          block("colour_blend", {
            inputs: {
              COLOUR1: {
                shadow: shadow("colour_picker", {
                  fields: {
                    COLOUR: "#ff0000"
                  }
                })
              },
              COLOUR2: {
                shadow: shadow("colour_picker", {
                  fields: {
                    COLOUR: "#3333ff"
                  }
                })
              },
              RATIO: {
                shadow: shadow("math_number", {
                  fields: {
                    NUM: 0.5
                  }
                })
              }
            }
          })
        ]
      },
      sep(),
      {
        kind: "category",
        name: "Variables",
        categorystyle: "variable_category",
        custom: "VARIABLE"
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
        custom: "PROCEDURE"
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
          label("Encode/decode strings ↓"),
          block("string_binary"),
          label("Ask for user input ↓"),
          block("javascript_consoleinput"),
          label("Try catch ↓"),
          block("javascript_trycatch"),
          block("javascript_trycatchfinally"),
          block("javascript_trycatch_error"),
          label("Program control ↓"),
          block("javascript_exit")
        ]
      },
      sep(),
      {
        kind: "category",
        name: "Main",
        colour: "#FF6E33",
        contents: [
          label(
            'Looking for the "login with token" block? It\'s been moved to project settings'
          ),
          label("Get the value of a secret ↓"),
          block("main_env", {
            inputs: {
              value: {
                shadow: shadow("text", { fields: { TEXT: "Secret name" } })
              }
            }
          }),
          label("The bot itself, represented as a Discord user ↓"),
          block("main_bot"),
          label("Properties of the bot ↓"),
          block("main_ping"),
          block("main_numberof"),
          block("main_readyAt"),
          label("Events ↓"),
          block("main_ready"),
          label("Actions ↓"),
          block("main_presence", {
            inputs: {
              afk: {
                shadow: shadow("logic_boolean", {
                  fields: {
                    BOOL: "FALSE"
                  }
                })
              },
              activity_name: {
                shadow: shadow("text", {
                  fields: {
                    TEXT: "Name of activity"
                  }
                })
              }
            }
          }),
          block("main_destroy"),
          label("ONLY use the block below if you shutdown the bot first ↓"),
          block("main_botStart")
        ]
      },
      {
        kind: "category",
        name: "Components",
        colour: "#26A4AF",
        contents: [
          {
            kind: "category",
            name: "Layout",
            colour: "#26A4AF",
            contents: [
              label("Interactive row (buttons / menus) ↓"),
              block("misc_addrow"),
              label("Layout & Content ↓"),
              block("cv2_textDisplay", {
                inputs: {
                  content: {
                    shadow: shadow("text", {
                      fields: { TEXT: "This is regular text" }
                    })
                  }
                }
              }),
              block("cv2_separator"),
              block("cv2_container", {
                inputs: {
                  color: {
                    shadow: shadow("colour_picker", {
                      fields: { colour: "#00A58E" }
                    })
                  }
                }
              })
            ]
          },
          {
            kind: "category",
            colour: "#26A4AF",
            name: "Sections",
            contents: [
              label("Sections can have an image or button right next to the text"),
              block("cv2_section_thumbnail", {
                inputs: {
                  text: {
                    shadow: shadow("text", {
                      fields: { TEXT: "Text goes here, with image next to it" }
                    })
                  },
                  thumbnailUrl: {
                    shadow: shadow("text", {
                      fields: { TEXT: "https://example.com/image.png" }
                    })
                  },
                  thumbnailAlt: {
                    shadow: shadow("text", { fields: { TEXT: "image description" } })
                  }
                }
              }),
              block("cv2_section_button", {
                inputs: {
                  text: {
                    shadow: shadow("text", {
                      fields: { TEXT: "Text goes here, with button next to it" }
                    })
                  },
                  buttonLabel: {
                    shadow: shadow("text", { fields: { TEXT: "Click me" } })
                  },
                  buttonId: {
                    shadow: shadow("text", { fields: { TEXT: "my-button" } })
                  }
                }
              })
            ]
          },
          {
            kind: "category",
            colour: "#26A4AF",
            name: "Media",
            contents: [
              label("Media galleries can contain one or more images"),
              block("cv2_mediaGallery"),
              block("cv2_mediaGalleryItem", {
                inputs: {
                  url: {
                    shadow: shadow("text", {
                      fields: { TEXT: "https://example.com/image.png" }
                    })
                  },
                  alt: {
                    shadow: shadow("text", { fields: { TEXT: "image description" } })
                  }
                }
              })
            ]
          },
          {
            kind: "category",
            colour: "#26A4AF",
            name: "File display",
            contents: [
              label(
                'Put this block in the "files" of your message to make it available to use in the components ↓'
              ),
              block("cv2_addFile", {
                inputs: {
                  path: {
                    shadow: shadow("text", {
                      fields: { TEXT: "https://example.com/file.txt" }
                    })
                  },
                  name: {
                    shadow: shadow("text", { fields: { TEXT: "file.txt" } })
                  }
                }
              }),
              label(
                'Put this block in the "components" of your message to show the file ↓'
              ),
              block("cv2_file", {
                inputs: {
                  file: {
                    shadow: shadow("text", {
                      fields: { TEXT: "file.txt" }
                    })
                  }
                }
              })
            ]
          },
          {
            kind: "category",
            name: "Buttons",
            colour: "#2677AF",
            contents: [
              label("Add a button inside of an interactive row ↓"),
              block("buttons_add", {
                inputs: {
                  label: { shadow: shadow("text") },
                  emoji: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  url: { shadow: shadow("text") },
                  disabled: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  }
                }
              }),
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
              block("cv2_replyInteraction"),
              label("Use 'defer reply' to show 'bot is thinking...' message"),
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              block("misc_int_deferReply", {
                inputs: {
                  ephemeral: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  }
                }
              }),
              block("cv2_editReplyInteraction"),
              block("buttons_del")
            ]
          },
          {
            kind: "category",
            name: "Select Menus",
            colour: "#26A483",
            contents: [
              label("Add menus inside of an interactive row"),
              label("Create a menu with TEXT options ↓"),
              block("menus_add", {
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  }
                }
              }),
              block("menus_addoption", {
                inputs: {
                  label: { shadow: shadow("text") },
                  dsc: { shadow: shadow("text") },
                  emoji: { shadow: shadow("text") },
                  value: { shadow: shadow("text") },
                  default: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  }
                }
              }),
              label(
                "Create a menu with CHANNEL options (auto-adds all channels in the server) ↓"
              ),
              block("menus_addChannelMenu", {
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  },
                  channelTypes: {
                    block: block("lists_create_with", {
                      inputs: {
                        ADD0: {
                          block: block("misc_channelType")
                        },
                        ADD1: {
                          block: block("misc_channelType")
                        },
                        ADD2: {
                          block: block("misc_channelType")
                        }
                      }
                    })
                  },
                  defaultChannels: {
                    block: block("lists_create_with", {
                      inputs: {
                        ADD0: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of channel to select by default"
                            }
                          })
                        },
                        ADD1: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of channel to select by default"
                            }
                          })
                        },
                        ADD2: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of channel to select by default"
                            }
                          })
                        }
                      }
                    })
                  }
                }
              }),
              block("misc_channelType"),
              label(
                "Create a menu with ROLE options (auto-adds all roles in the server) ↓"
              ),
              block("menus_addRoleMenu", {
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  },
                  defaultRoles: {
                    block: block("lists_create_with", {
                      inputs: {
                        ADD0: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of role to select by default"
                            }
                          })
                        },
                        ADD1: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of role to select by default"
                            }
                          })
                        },
                        ADD2: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of role to select by default"
                            }
                          })
                        }
                      }
                    })
                  }
                }
              }),
              label(
                "Create a menu with USER options (auto-adds all users in the server) ↓"
              ),
              block("menus_addUserMenu", {
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  },
                  defaultUsers: {
                    block: block("lists_create_with", {
                      inputs: {
                        ADD0: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of user to select by default"
                            }
                          })
                        },
                        ADD1: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of user to select by default"
                            }
                          })
                        },
                        ADD2: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of user to select by default"
                            }
                          })
                        }
                      }
                    })
                  }
                }
              }),
              label(
                "Create a menu with USER AND ROLE options (auto-adds all users and roles in the server) ↓"
              ),
              block("menus_addMentionableMenu", {
                inputs: {
                  placeholder: { shadow: shadow("text") },
                  id: { shadow: shadow("text") },
                  disabled: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  },
                  defaultVals: {
                    block: block("lists_create_with", {
                      inputs: {
                        ADD0: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of role/user to select by default"
                            }
                          })
                        },
                        ADD1: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of role/user to select by default"
                            }
                          })
                        },
                        ADD2: {
                          block: block("text", {
                            fields: {
                              TEXT: "ID of role/user to select by default"
                            }
                          })
                        }
                      }
                    })
                  }
                }
              }),
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
              label("Use 'defer reply' to show 'bot is thinking...' message"),
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              block("misc_int_deferReply", {
                inputs: {
                  ephemeral: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  }
                }
              }),
              block("cv2_replyInteraction"),
              block("cv2_editReplyInteraction"),
              block("menus_update", {
                inputs: {
                  content: { shadow: shadow("text") }
                }
              }),
              block("menus_del")
            ]
          }
        ]
      },
      // {
      //   kind: "category",
      //   name: "Embeds",
      //   colour: "00A58E",
      //   contents: [
      //     label("Create the embed first ↓"),
      //     block("embed_create"),
      //     {
      //       kind: "label",
      //       text: "Put all of these blocks INSIDE of the 'create embed' block above ↓",
      //     },
      //     {
      //       kind: "block",
      //       type: "embed_settitle",
      //       inputs: {
      //         value: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //       },
      //     },
      //     {
      //       kind: "block",
      //       type: "embed_setdsc",
      //       inputs: {
      //         value: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //       },
      //     },
      //     {
      //       kind: "block",
      //       type: "embed_setcolor",
      //       inputs: {
      //         value: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //       },
      //     },
      //     {
      //       kind: "block",
      //       type: "embed_seturl",
      //       inputs: {
      //         value: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //       },
      //     },
      //     {
      //       kind: "block",
      //       type: "embed_setauthor",
      //       inputs: {
      //         name: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //         icon: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //         url: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //       },
      //     },
      //     {
      //       kind: "block",
      //       type: "embed_setfooter",
      //       inputs: {
      //         text: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //         icon: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //       },
      //     },
      //     {
      //       kind: "block",
      //       type: "embed_setimage",
      //       inputs: {
      //         value: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //       },
      //     },
      //     {
      //       kind: "block",
      //       type: "embed_setthumb",
      //       inputs: {
      //         value: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //       },
      //     },
      //     {
      //       kind: "block",
      //       type: "embed_addfield",
      //       inputs: {
      //         name: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //         val: {
      //           shadow: {
      //             type: "text",
      //           },
      //         },
      //         inline: {
      //           shadow: {
      //             type: "logic_boolean",
      //             fields: {
      //               BOOL: "FALSE",
      //             },
      //           },
      //         },
      //       },
      //     },
      //     block("embed_settimestamp"),
      //   ],
      // },
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
              block("msg_getone", {
                inputs: {
                  id: {
                    shadow: shadow("text")
                  }
                }
              }),
              label("Events ↓"),
              block("msg_received"),
              block("message_author_not_bot"),
              block("msg_msg"),
              label("Information about a message ↓"),
              block("message_property", {
                inputs: {
                  message: {
                    shadow: shadow("msg_msg")
                  }
                }
              }),
              block("message_property", {
                inputs: {
                  message: {
                    shadow: shadow("msg_msg")
                  }
                },
                fields: {
                  property: "author"
                }
              }),
              block("message_property", {
                inputs: {
                  message: {
                    shadow: shadow("msg_msg")
                  }
                },
                fields: {
                  property: "channel"
                }
              }),
              label("Actions ↓"),
              block("cv2_replyMsg"),
              block("misc_messageSent"),
              block("msg_deleteOther", {
                inputs: {
                  message: {
                    shadow: shadow("msg_msg")
                  }
                }
              }),
              block("cv2_editMsg"),
              block("msg_react", {
                inputs: {
                  message: {
                    shadow: shadow("msg_msg")
                  },
                  reaction: {
                    shadow: shadow("text", {
                      fields: {
                        TEXT: "😋"
                      }
                    })
                  }
                }
              }),
              block("msg_pin"),
              block("msg_unpin"),
              label("View reactions ↓"),
              block("msg_reaction_property", {
                inputs: {
                  message: {
                    shadow: shadow("msg_msg")
                  },
                  reaction: {
                    shadow: shadow("text", {
                      fields: {
                        TEXT: "😋"
                      }
                    })
                  }
                },
                fields: {
                  property: "users"
                }
              }),
              sep(40),
              block("msg_get_reactions", {
                inputs: {
                  message: {
                    shadow: shadow("msg_msg")
                  }
                }
              }),
              block("msg_reaction_emoji"),
              block("msg_reaction_count"),
              block("msg_reaction_users")
            ]
          },
          {
            kind: "category",
            name: "Threads",
            colour: "#5b67a5",
            contents: [
              label("Get a thread ↓"),
              block("threads_getone", {
                inputs: {
                  value: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("threads_msgHasThread"),
              block("threads_msgThread"),
              label("Create a thread ↓"),
              block("threads_msgCreateThread", {
                inputs: {
                  message: {
                    shadow: shadow("msg_msg")
                  },
                  name: {
                    shadow: shadow("text")
                  },
                  slowmode: {
                    shadow: shadow("math_number")
                  }
                }
              }),
              block("threads_channelCreateThread", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  },
                  slowmode: {
                    shadow: shadow("math_number")
                  }
                }
              }),
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
              block("threads_setName", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("threads_setArchived", {
                inputs: {
                  archived: {
                    shadow: shadow("logic_boolean")
                  }
                }
              }),
              block("threads_setLocked", {
                inputs: {
                  locked: {
                    shadow: shadow("logic_boolean")
                  }
                }
              }),
              block("threads_setSlowmode", {
                inputs: {
                  slowmode: {
                    shadow: shadow("math_number")
                  }
                }
              }),
              block("threads_pin"),
              block("threads_unpin"),
              block("threads_join"),
              block("threads_leave"),
              block("threads_addUser"),
              block("threads_removeUser")
            ]
          },
          {
            kind: "category",
            name: "Polls",
            colour: "#656b75",
            contents: [
              label("Create a poll ↓"),
              block("poll_create", {
                inputs: {
                  QUESTION: {
                    shadow: shadow("text")
                  },
                  DURATION: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 2
                      }
                    })
                  },
                  MULTISELECT: {
                    shadow: shadow("logic_boolean", {
                      fields: {
                        BOOL: "FALSE"
                      }
                    })
                  }
                }
              }),
              block("poll_choice", {
                inputs: {
                  TEXT: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("poll_sendchannel"),
              label("Events ↓"),
              block("poll_whenvoteadded"),
              block("poll_whenvoteaddedvotetext"),
              block("poll_whenvoteaddedvoteemoji"),
              block("poll_whenvoteaddedvoteuser")
            ]
          }
        ]
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
              block("boost_count"),
              block("boost_level"),
              block("boost_progressBar"),
              label("Actions on a server ↓"),
              block("server_disableinvites"),
              block("server_leave"),
              block("boost_setProgressBar", {
                inputs: {
                  enabled: {
                    shadow: shadow("logic_boolean")
                  }
                }
              })
            ]
          },
          {
            kind: "category",
            name: "Channels",
            colour: "#AD509B",
            contents: [
              label("Get a channel ↓"),
              block("channel_getone", {
                inputs: {
                  value: {
                    shadow: shadow("text")
                  }
                }
              }),
              label("Get all channels ↓"),
              block("channel_foreach"),
              block("channel_channel"),
              label("Create a channel ↓"),
              block("channel_create", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  }
                }
              }),
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
              block("cv2_sendMessage"),
              block("misc_messageSent"),
              label("------------------------------------"),
              block("channel_waitForResponse", {
                inputs: {
                  time: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 60
                      }
                    })
                  },
                  max: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 1
                      }
                    })
                  }
                }
              }),
              label("Use this block to check if a message should be accepted ↓"),
              block("channel_awaitResponses_filterMsg"),
              label("Get the responses after collecting has finished ↓"),
              block("channel_responses"),
              block("lists_getIndex", {
                inputs: {
                  VALUE: {
                    shadow: shadow("channel_responses")
                  }
                }
              }),
              block("lists_length", {
                inputs: {
                  VALUE: {
                    shadow: shadow("channel_responses")
                  }
                }
              }),
              block("channel_setParent", {
                inputs: {
                  syncPerms: {
                    shadow: shadow("logic_boolean")
                  }
                }
              }),
              block("channel_syncPerms"),
              block("channel_setPosition", {
                inputs: {
                  position: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 1
                      }
                    })
                  }
                }
              }),
              block("channel_setnsfw", {
                inputs: {
                  set: {
                    shadow: shadow("logic_boolean")
                  }
                }
              }),
              label("----------------------------------------------------"),
              block("channel_set_permission_v2", {
                inputs: {
                  permission: {
                    shadow: shadow("misc_permissionChannel")
                  },
                  role: {
                    shadow: shadow("misc_everyone")
                  }
                }
              }),
              block("channel_delete_permission", {
                inputs: {
                  role: {
                    shadow: shadow("misc_everyone")
                  }
                }
              }),
              block("channel_setslowmode", {
                inputs: {
                  time: {
                    shadow: shadow("math_number")
                  }
                }
              }),
              block("channel_settopic", {
                inputs: {
                  topic: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("channel_starttyping", {
                inputs: {
                  wait: {
                    shadow: shadow("math_number")
                  }
                }
              }),
              block("channel_bulkdelete", {
                inputs: {
                  amount: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 10
                      }
                    })
                  }
                }
              }),
              block("channel_setautoarchive"),
              block("channel_clone", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("channel_createdChannel"),
              block("channel_del"),
              block("channel_setname"),
              label("----------------------------------------------------"),
              label("Get the latest messages of a channel ↓"),
              block("channel_fetchLastMessages", {
                inputs: {
                  amount: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 5
                      }
                    })
                  }
                }
              }),
              block("channel_fetchedLastMessages", {
                inputs: {
                  number: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 1
                      }
                    })
                  }
                }
              }),
              label("----------------------------------------------------")
            ]
          },
          {
            kind: "category",
            name: "Roles",
            colour: "#B76489",
            contents: [
              label("Get a role ↓"),
              block("roles_getone", {
                inputs: {
                  value: {
                    shadow: shadow("text")
                  }
                }
              }),
              label("Loop through each role in a server ↓"),
              block("roles_foreach"),
              block("roles_foreach_role"),

              label("Loop through each member who has a certain role ↓"),
              block("roles_foreachMember"),
              block("roles_currentLoopMember"),
              label("Get the highest role in a server ↓"),
              block("roles_highest"),
              label("Create a role in a server ↓"),
              block("roles_create", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  },
                  color: {
                    shadow: shadow("colour_picker")
                  },
                  position: {
                    shadow: shadow("math_number")
                  },
                  mentionable: {
                    shadow: shadow("logic_boolean")
                  }
                }
              }),
              block("misc_permission"),
              label("Check whether a certain member has a role ↓"),
              block("roles_hasRole"),
              label("Information about a role ↓"),
              block("roles_name"),
              block("roles_id"),
              block("roles_position"),
              block("roles_hexColor"),
              block("roles_createdAt"),
              block("roles_hasPermission", {
                inputs: {
                  permission: {
                    shadow: shadow("misc_permission")
                  }
                }
              }),
              label("Role actions ↓"),
              block("roles_delete"),
              block("roles_rename", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("roles_addToMember"),
              block("roles_removeFromMember"),
              block("roles_setPermissions")
            ]
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
              block("invite_created"),
              block("invite_expiration"),
              block("invite_temporary"),
              block("invite_uses"),
              label("Loops ↓"),
              block("invite_foreach"),
              block("invite_channel_foreach"),
              block("invite_foreach_var"),
              label("Events ↓"),
              block("invite_invitecreated"),
              block("invite_invitedeleted"),
              block("invite_event_var")
            ]
          },
          {
            kind: "category",
            name: "Members",
            colour: "#3c9e56",
            contents: [
              label("Member = info of one member in a server"),
              label("User = all info of the whole Discord user"),
              label("Some blocks only accept users"),
              label("Other blocks only accept members"),
              label("Some blocks can accept either one"),
              label("(It won't let you drag in the wrong one)"),
              label("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -"),
              label("Get a member or user ↓"),
              block("member_getone", {
                inputs: {
                  value: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("member_getuser", {
                inputs: {
                  value: {
                    shadow: shadow("text")
                  }
                }
              }),
              label("Do something for every member in a server ↓"),
              block("member_foreach"),
              block("member_member"),
              label("Information about members/users ↓"),
              block("member_status"),
              block("member_userFlags"),
              block("member_dmChannel"),
              block("member_bannable"),
              block("member_kickable"),
              block("member_timedout"),
              block("member_hasPermission", {
                inputs: {
                  permission: {
                    shadow: shadow("misc_permission")
                  }
                }
              }),
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
              block("member_timeout", {
                inputs: {
                  seconds: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 60
                      }
                    })
                  }
                }
              }),
              block("member_kick"),
              block("cv2_sendDm"),
              block("member_setnick", {
                inputs: {
                  nickname: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("member_removetimeout")
            ]
          },
          {
            kind: "category",
            name: "Webhooks",
            colour: "#4f85db",
            contents: [
              label("Get a webhook ↓"),
              block("webhooks_fetch", {
                inputs: {
                  id: {
                    shadow: shadow("text")
                  },
                  token: {
                    shadow: shadow("text")
                  }
                }
              }),
              label("Create a webhook ↓"),
              block("webhooks_create", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("webhooks_createdWebhook"),
              label("Get token of a webhook ↓"),
              label("WARNING: This should be kept private!"),
              block("webhooks_token", {
                inputs: {
                  webhook: {
                    shadow: shadow("webhooks_createdWebhook")
                  }
                }
              }),
              label("Actions ↓"),
              block("webhooks_send", {
                inputs: {
                  webhook: {
                    shadow: shadow("webhooks_createdWebhook")
                  }
                }
              }),
              block("webhooks_delete", {
                inputs: {
                  webhook: {
                    shadow: shadow("webhooks_createdWebhook")
                  }
                }
              }),
              block("webhooks_edit", {
                inputs: {
                  webhook: {
                    shadow: shadow("webhooks_createdWebhook")
                  },
                  name: {
                    shadow: shadow("text")
                  }
                }
              }),
              label("Information about a webhook ↓"),
              block("webhooks_name"),
              block("webhooks_id"),
              block("webhooks_owner"),
              block("webhooks_createdAt")
            ]
          },
          {
            kind: "category",
            name: "Emojis",
            colour: "#DEB144",
            contents: [
              label("Get an emoji ↓"),
              block("emoji_getemojiwith", {
                inputs: {
                  equal: {
                    shadow: shadow("text")
                  }
                }
              }),
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
              block("emoji_create", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  },
                  url: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("emoji_delete"),
              block("emoji_setname", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  }
                }
              })
            ]
          },
          {
            kind: "category",
            name: "Stickers",
            colour: "#7a9e37",
            contents: [
              label("Get a sticker ↓"),
              block("sticker_getwith", {
                inputs: {
                  equal: {
                    shadow: shadow("text")
                  }
                }
              }),
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
              block("sticker_create", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  },
                  file: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("sticker_delete"),
              block("sticker_setname", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  }
                }
              })
            ]
          }
        ]
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
              block("slash_create_mutator", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  },
                  dsc: {
                    shadow: shadow("text")
                  }
                }
              }),
              block("misc_permission"),
              block("slash_addoption", {
                inputs: {
                  name: { shadow: shadow("text") },
                  dsc: { shadow: shadow("text") },
                  required: { shadow: shadow("logic_boolean") }
                }
              }),
              block("slash_addchoice", {
                inputs: {
                  name: { shadow: shadow("text") },
                  value: { shadow: shadow("text") }
                }
              }),
              label("Subcommands (advanced) ↓"),
              block("slash_addsubcommand", {
                inputs: {
                  name: { shadow: shadow("text") },
                  dsc: { shadow: shadow("text") }
                }
              }),
              block("slash_addsubcommandgroup", {
                inputs: {
                  name: { shadow: shadow("text") },
                  dsc: { shadow: shadow("text") }
                }
              }),
              label("Events ↓"),
              block("slash_received"),
              label("Actions ↓"),
              block("cv2_replyInteraction", {
                inputs: {
                  ephemeral: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  }
                }
              }),
              label("Use 'defer reply' to show 'bot is thinking...' message"),
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              block("misc_int_deferReply", {
                inputs: {
                  ephemeral: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  }
                }
              }),
              block("cv2_editReplyInteraction"),
              label("Information about the command ran ↓"),
              block("slash_getoption"),
              block("slash_name"),
              block("misc_int_member"),
              block("misc_int_user"),
              block("misc_int_channel"),
              block("misc_int_server")
            ]
          },
          {
            kind: "category",
            name: "Modals",
            colour: "1A8793",
            contents: [
              label("Keep in mind that you can only show modals in slash commands!"),
              label("Show a modal to the user ↓"),
              block("modal_show"),
              label("Create a modal (put this in the block above) ↓"),
              block("modal_create", {
                inputs: {
                  title: { shadow: shadow("text") },
                  customId: { shadow: shadow("text") }
                }
              }),
              label("Put text input(s) inside the 'create modal' block ↓"),
              block("modal_add_text_input", {
                inputs: {
                  label: { shadow: shadow("text") },
                  customId: { shadow: shadow("text") },
                  required: { shadow: shadow("logic_boolean") }
                }
              }),
              block("modal_add_text_input_advanced", {
                inputs: {
                  label: { shadow: shadow("text") },
                  customId: { shadow: shadow("text") },
                  required: { shadow: shadow("logic_boolean") },
                  placeholder: { shadow: shadow("text") },
                  max: {
                    shadow: shadow("math_number", { fields: { NUM: 100 } })
                  },
                  min: { shadow: shadow("math_number", { fields: { NUM: 10 } }) }
                }
              }),
              label("Events ↓"),
              block("modal_handle_interaction"),
              label("Information about the submitted modal ↓"),
              block("modal_get_input_value", {
                inputs: {
                  customId: { shadow: shadow("text") }
                }
              }),
              block("modal_get_author"),
              block("modal_get_customId"),
              label("Reply to the modal after submitted ↓"),
              block("cv2_replyInteraction"),
              label("Use 'defer reply' to show 'bot is thinking...' message"),
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              block("misc_int_deferReply", {
                inputs: {
                  ephemeral: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  }
                }
              }),
              block("cv2_editReplyInteraction")
            ]
          },
          {
            kind: "category",
            name: "Context Menus",
            colour: "#00A859",
            contents: [
              label("Setup context menus ↓"),
              block("misc_createcontainer_global"),
              label("Add a context menu ↓"),
              block("contextMenu_create", {
                inputs: {
                  name: {
                    shadow: shadow("text")
                  },
                  dms: {
                    shadow: shadow("logic_boolean")
                  }
                }
              }),
              label("Events ↓"),
              block("contextMenu_received"),
              label("Actions ↓"),
              block("cv2_replyInteraction"),
              label("Use 'defer reply' to show 'bot is thinking...' message"),
              label(
                "If you defer reply, you should EDIT the reply when you want to respond, instead of sending a new reply"
              ),
              block("misc_int_deferReply", {
                inputs: {
                  ephemeral: {
                    shadow: shadow("logic_boolean", {
                      fields: { BOOL: "FALSE" }
                    })
                  }
                }
              }),
              block("cv2_editReplyInteraction"),
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
              block("contextMenu_targetMessage")
            ]
          }
        ]
      },
      {
        kind: "category",
        name: "Events",
        colour: "FF4F4F",
        contents: [
          {
            kind: "category",
            name: "Server Actions",
            colour: "#A33DAC",
            contents: [
              block("events_guild_memberAdd"),
              block("events_guild_memberAdd_member"),
              block("events_guild_memberAdd_server"),
              block("events_guild_memberAdd_invite"),
              label("------------------------------------------------"),
              block("events_remove_guildmemberremove"),
              block("events_remove_guildmemberremove_member"),
              block("events_remove_guildmemberremove_server"),
              label("------------------------------------------------"),
              block("events_guild_created"),
              block("events_guild_created_guild"),
              block("events_guild_deleted"),
              block("events_guild_deleted_guild")
            ]
          },
          {
            kind: "category",
            name: "Boosts",
            colour: "#A33DAC",
            contents: [
              block("events_boosts_serverBoosted"),
              block("events_boosts_serverBoosted_member"),
              block("events_boosts_serverBoosted_server"),
              label("------------------------------------------------"),
              block("events_boosts_serverUnboosted"),
              block("events_boosts_serverUnboosted_member"),
              block("events_boosts_serverUnboosted_server"),
              label("------------------------------------------------"),
              block("events_boosts_levelUp"),
              block("events_boosts_levelUp_server"),
              block("events_boosts_levelUp_oldLevel"),
              block("events_boosts_levelUp_newLevel"),
              label("------------------------------------------------"),
              block("events_boosts_levelDown"),
              block("events_boosts_levelDown_server"),
              block("events_boosts_levelDown_oldLevel"),
              block("events_boosts_levelDown_newLevel")
            ]
          },
          {
            kind: "category",
            name: "Message Actions",
            colour: "#336EFF",
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
              block("events_message_pinned_message")
            ]
          },
          {
            kind: "category",
            name: "Member Actions",
            colour: "#3c9e56",
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
              block("events_members_nickname_newNickname")
            ]
          },
          {
            kind: "category",
            name: "Emojis & Stickers",
            colour: "#DEB144",
            contents: [
              block("events_emojis_created"),
              block("events_emojis_deleted"),
              block("events_emojis_createdOrDeletedEmoji"),
              label("------------------------------------------------"),
              block("events_emojis_changed"),
              block("events_emojis_changedOldEmoji"),
              block("events_emojis_changedNewEmoji"),
              label("------------------------------------------------"),
              block("events_stickers_created"),
              block("events_stickers_deleted"),
              block("events_stickers_createdOrDeletedSticker"),
              label("------------------------------------------------"),
              block("events_stickers_changed"),
              block("events_stickers_changedOldSticker"),
              block("events_stickers_changedNewSticker")
            ]
          },
          {
            kind: "category",
            name: "Custom",
            colour: "#999999",
            contents: [
              label("Use custom discord.js v14 events ↓"),
              block("events_custom"),
              block("events_customParameter")
            ]
          }
        ]
      },
      {
        kind: "category",
        name: "Cooldowns",
        colour: "#FF6E33",
        contents: [
          label("Run a command on cooldown ↓"),
          block("cooldown_check", {
            inputs: {
              duration: { shadow: shadow("math_number", { fields: { NUM: 5000 } }) }
            }
          }),
          label("Check if on cooldown ↓"),
          block("cooldown_has", {
            inputs: {
              command: { shadow: shadow("text") }
            }
          }),
          block("cooldown_get", {
            inputs: {
              command: { shadow: shadow("text") }
            }
          }),
          label("Cooldown actions ↓"),
          block("cooldown_set", {
            inputs: {
              command: { shadow: shadow("text") }
            }
          }),
          block("cooldown_clear", {
            inputs: {
              command: { shadow: shadow("text") }
            }
          }),
          block("cooldown_clearAll")
        ]
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
              block("db_get", {
                inputs: {
                  id: { shadow: shadow("text") }
                }
              }),
              block("db_has", {
                inputs: {
                  id: { shadow: shadow("text") }
                }
              }),
              block("db_all"),
              label("Actions in the database ↓"),
              block("db_set", {
                inputs: {
                  id: { shadow: shadow("text") },
                  val: { shadow: shadow("text") }
                }
              }),
              block("db_del", {
                inputs: {
                  id: { shadow: shadow("text") }
                }
              }),
              block("db_add", {
                inputs: {
                  id: { shadow: shadow("text") },
                  val: { shadow: shadow("math_number", { fields: { NUM: 1 } }) }
                }
              }),
              block("db_sub", {
                inputs: {
                  id: { shadow: shadow("text") },
                  val: { shadow: shadow("math_number", { fields: { NUM: 1 } }) }
                }
              }),
              block("db_push", {
                inputs: {
                  id: { shadow: shadow("text") },
                  val: { shadow: shadow("text") }
                }
              }),
              block("db_clear")
            ]
          }
        ]
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
              block("scratch_getprofile", {
                inputs: {
                  username: { shadow: shadow("text") }
                }
              }),
              block("scratch_getprofileinfo"),
              block("scratch_getmessages", {
                inputs: {
                  username: { shadow: shadow("text") }
                }
              })
            ]
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
              block("cv2_sendMessage", {
                inputs: {
                  files: {
                    block: block("captcha_addFile")
                  }
                }
              })
            ]
          },
          {
            kind: "category",
            name: "Fetch",
            colour: "#0fbd8c",
            contents: [
              label("Send a request to a url ↓"),
              block("fetch_send", {
                inputs: {
                  url: { shadow: shadow("text") }
                }
              }),
              label("----------------------------------------------"),
              label("Advanced request ↓"),
              block("fetch_sendAdvanced", {
                inputs: {
                  url: { shadow: shadow("text") },
                  config: {
                    block: block("fetch_configSection", {
                      inputs: {
                        key: {
                          shadow: shadow("text", {
                            fields: {
                              TEXT: "data"
                            }
                          })
                        },
                        value: {
                          block: block("object_new", {
                            inputs: {
                              keys: {
                                block: block("object_addkey", {
                                  inputs: {
                                    value: {
                                      shadow: shadow("text", {
                                        fields: {
                                          TEXT: "value"
                                        }
                                      })
                                    }
                                  }
                                })
                              }
                            }
                          })
                        }
                      }
                    })
                  }
                }
              }),
              block("fetch_configSection", {
                inputs: {
                  key: { shadow: shadow("text") },
                  value: { shadow: shadow("text") }
                }
              }),
              label("----------------------------------------------"),
              label("Information about the response ↓"),
              block("fetch_responseData"),
              block("fetch_responseStatus"),
              block("fetch_responseHeaders"),
              label("Get a key from the response data (from the objects category) ↓"),
              block("object_getkey", {
                inputs: {
                  key: {
                    shadow: shadow("text", {
                      fields: {
                        TEXT: ""
                      }
                    })
                  },
                  object: {
                    shadow: shadow("fetch_responseData")
                  }
                }
              })
            ]
          },
          {
            kind: "category",
            name: "Canvas",
            colour: "#4C9F70",
            contents: [
              label("Create a Canvas ↓"),
              block("canvas_createCanvas", {
                inputs: {
                  WIDTH: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 512
                      }
                    })
                  },
                  HEIGHT: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 512
                      }
                    })
                  }
                }
              }),
              label("Export the Canvas ↓"),
              block("cv2_sendMessage", {
                inputs: {
                  files: {
                    block: block("canvas_addFile")
                  }
                }
              }),
              block("canvas_asData"),
              label("Properties ↓"),
              block("canvas_width"),
              block("canvas_height"),
              label("Actions ↓"),
              block("canvas_setFillColor", {
                inputs: {
                  COLOR: {
                    shadow: shadow("colour_picker")
                  }
                }
              }),
              block("canvas_setStrokeColor", {
                inputs: {
                  COLOR: {
                    shadow: shadow("colour_picker")
                  }
                }
              }),
              block("canvas_setLineWidth", {
                inputs: {
                  WIDTH: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 5
                      }
                    })
                  }
                }
              }),
              block("canvas_setFont", {
                inputs: {
                  FONT: {
                    shadow: shadow("text", {
                      fields: {
                        TEXT: "20px Arial"
                      }
                    })
                  }
                }
              }),
              block("canvas_fillText", {
                inputs: {
                  TEXT: {
                    shadow: shadow("text", {
                      fields: {
                        TEXT: "Hello!"
                      }
                    })
                  },
                  X: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 10
                      }
                    })
                  },
                  Y: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 50
                      }
                    })
                  }
                }
              }),
              block("canvas_strokeText", {
                inputs: {
                  TEXT: {
                    shadow: shadow("text", {
                      fields: {
                        TEXT: "Outlined!"
                      }
                    })
                  },
                  X: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 10
                      }
                    })
                  },
                  Y: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 90
                      }
                    })
                  }
                }
              }),
              block("canvas_drawRectangle", {
                inputs: {
                  X: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  },
                  Y: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  },
                  W: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 512
                      }
                    })
                  },
                  H: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 512
                      }
                    })
                  }
                }
              }),
              block("canvas_drawCircle", {
                inputs: {
                  X: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  },
                  Y: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  },
                  R: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 256
                      }
                    })
                  }
                }
              }),
              block("canvas_drawLine", {
                inputs: {
                  X1: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  },
                  Y1: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  },
                  X2: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 512
                      }
                    })
                  },
                  Y2: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 512
                      }
                    })
                  }
                }
              }),
              block("canvas_drawImage", {
                inputs: {
                  SRC: {
                    shadow: shadow("text", {
                      fields: {
                        TEXT: "https://www.disfuse.xyz/media/disfuse.png"
                      }
                    })
                  },
                  X: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  },
                  Y: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  },
                  W: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 128
                      }
                    })
                  },
                  H: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 128
                      }
                    })
                  }
                }
              }),
              block("canvas_clearCanvas"),
              label("Transforms ↓"),
              block("canvas_save"),
              block("canvas_restore"),
              block("canvas_translate", {
                inputs: {
                  DX: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  },
                  DY: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0
                      }
                    })
                  }
                }
              }),
              block("canvas_rotate", {
                inputs: {
                  ANGLE: {
                    shadow: shadow("math_number", {
                      fields: {
                        NUM: 0.5
                      }
                    })
                  }
                }
              })
            ]
          }
        ]
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
          block("comment_value", {
            inputs: {
              VALUE: {
                block: block("text", {
                  fields: {
                    TEXT: "value"
                  }
                })
              }
            }
          })
        ]
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
              song: { shadow: shadow("text") }
            }
          }),
          block("music_findLyrics_lyrics")
        ]
      },
      {
        kind: "category",
        name: "Files",
        colour: "#eb8334",
        contents: [
          label("Files will be created AFTER the bot is run"),
          label("Read data from files ↓"),
          block("fs_readFile", {
            inputs: {
              path: { shadow: shadow("text") }
            }
          }),
          block("fs_readFile_data"),
          block("fs_readdir", {
            inputs: {
              path: { shadow: shadow("text") }
            }
          }),
          block("fs_readdir_name"),
          block("fs_readdir_path"),
          label("Write a file ↓"),
          block("fs_writeFile", {
            inputs: {
              path: { shadow: shadow("text") },
              data: { shadow: shadow("text") }
            }
          }),
          label("File actions ↓"),
          block("fs_deleteFile", {
            inputs: {
              path: { shadow: shadow("text") }
            }
          }),
          block("fs_renameFile", {
            inputs: {
              path: { shadow: shadow("text") },
              newpath: { shadow: shadow("text") }
            }
          })
        ]
      },
      sep(),
      {
        kind: "category",
        name: "Workshop",
        colour: "#014f98",
        contents: [
          label(
            `You have ${blockPacks.length} installed block pack${
              blockPacks.length === 0
                ? "s. Go to the workshop page to discover and install new block packs."
                : blockPacks.length === 1
                  ? ":"
                  : "s:"
            }`
          ),
          ...blockPacks.map(pack =>
            label(
              `- ${pack.name} v${pack.versions[pack.versions.length - 1]?.version || "0.0.0"}`
            )
          ),
          ...blockPacks.map(pack => ({
            kind: "category",
            name: pack.name,
            colour: pack.color || "#014f98",
            contents: pack.versions[pack.versions.length - 1]?.blocks?.length
              ? pack.versions[pack.versions.length - 1]?.blocks?.map(b => block(b.name))
              : []
          }))
        ]
      },
      {
        kind: "category",
        name: "BlockBuddy",
        colour: "#014f98",
        contents: [
          label("Click BlockBuddy > Create to make new custom blocks"),
          ...(user?.customBlocks || []).map(b => block(b.definition.type))
        ]
      }
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
    ]
  };
}
