import { block, label, shadow } from "../helpers.js";

/** Strings: building them, searching them, and taking them apart. */
export default {
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
};
