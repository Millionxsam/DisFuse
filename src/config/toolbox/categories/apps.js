import { block, label, shadow } from "../helpers.js";

/** Integrations with things that aren't Discord: Scratch, Roblox, captchas, HTTP, canvas. */
export default {
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
      name: "Roblox",
      colour: "#e2231a",
      contents: [
        label("No API key needed, all of this is public info ↓"),
        label("----------------------------------------------"),
        label("Get a user first, then use the info block ↓"),
        block("roblox_getUser", {
          inputs: {
            username: {
              shadow: shadow("text", { fields: { TEXT: "Roblox" } })
            }
          }
        }),
        block("roblox_userInfo"),
        label("----------------------------------------------"),
        label("Quick user info (no need to get the user first) ↓"),
        block("roblox_userId", {
          inputs: {
            username: { shadow: shadow("text") }
          }
        }),
        block("roblox_userAvatar", {
          inputs: {
            username: { shadow: shadow("text") }
          }
        }),
        block("roblox_profileLink", {
          inputs: {
            username: { shadow: shadow("text") }
          }
        }),
        label("----------------------------------------------"),
        label("Groups ↓"),
        block("roblox_getGroup", {
          inputs: {
            id: { shadow: shadow("math_number", { fields: { NUM: 7 } }) }
          }
        }),
        block("roblox_groupInfo"),
        block("roblox_userInGroup", {
          inputs: {
            username: { shadow: shadow("text") },
            id: { shadow: shadow("math_number", { fields: { NUM: 7 } }) }
          }
        }),
        block("roblox_userGroupRank", {
          inputs: {
            username: { shadow: shadow("text") },
            id: { shadow: shadow("math_number", { fields: { NUM: 7 } }) }
          }
        }),
        label("----------------------------------------------"),
        label("Games (the place ID is the number in the game's link) ↓"),
        block("roblox_getGame", {
          inputs: {
            id: {
              shadow: shadow("math_number", { fields: { NUM: 1818 } })
            }
          }
        }),
        block("roblox_gameInfo"),
        label("----------------------------------------------"),
        label("Gamepasses & badges ↓"),
        block("roblox_ownsGamepass", {
          inputs: {
            username: { shadow: shadow("text") },
            id: { shadow: shadow("math_number", { fields: { NUM: 0 } }) }
          }
        }),
        block("roblox_ownsBadge", {
          inputs: {
            username: { shadow: shadow("text") },
            id: { shadow: shadow("math_number", { fields: { NUM: 0 } }) }
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
};
