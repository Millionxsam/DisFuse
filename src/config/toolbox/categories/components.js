import { block, label, shadow } from "../helpers.js";

/** Components V2 — the message system that replaced content and embeds. */
export default {
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
};
