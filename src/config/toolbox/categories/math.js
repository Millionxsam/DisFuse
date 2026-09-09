import { block, shadow } from "../helpers.js";

/** Numbers and arithmetic, including the random and rounding helpers. */
export default {
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
};
