import { block, label, shadow } from "../helpers.js";

/** Slash commands, modals and context menus. */
export default {
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
        label("Put these inside the 'create modal' block ↓"),
        label("A modal can hold up to 5 of them"),
        block("modalc_label", {
          inputs: {
            label: { shadow: shadow("text") },
            description: { shadow: shadow("text") }
          }
        }),
        block("modalc_textDisplay", {
          inputs: {
            content: { shadow: shadow("text") }
          }
        }),
        label("Plug one of these into the label block ↓"),
        block("modalc_textInput", {
          inputs: {
            customId: { shadow: shadow("text") },
            placeholder: { shadow: shadow("text") },
            value: { shadow: shadow("text") },
            min: { shadow: shadow("math_number", { fields: { NUM: 0 } }) },
            max: {
              shadow: shadow("math_number", { fields: { NUM: 1000 } })
            },
            required: { shadow: shadow("logic_boolean") }
          }
        }),
        block("modalc_stringSelect", {
          inputs: {
            customId: { shadow: shadow("text") },
            placeholder: { shadow: shadow("text") },
            min: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            max: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            required: { shadow: shadow("logic_boolean") }
          }
        }),
        block("modalc_userSelect", {
          inputs: {
            customId: { shadow: shadow("text") },
            placeholder: { shadow: shadow("text") },
            min: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            max: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            required: { shadow: shadow("logic_boolean") }
          }
        }),
        block("modalc_roleSelect", {
          inputs: {
            customId: { shadow: shadow("text") },
            placeholder: { shadow: shadow("text") },
            min: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            max: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            required: { shadow: shadow("logic_boolean") }
          }
        }),
        block("modalc_mentionableSelect", {
          inputs: {
            customId: { shadow: shadow("text") },
            placeholder: { shadow: shadow("text") },
            min: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            max: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            required: { shadow: shadow("logic_boolean") }
          }
        }),
        block("modalc_channelSelect", {
          inputs: {
            customId: { shadow: shadow("text") },
            placeholder: { shadow: shadow("text") },
            min: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            max: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            required: { shadow: shadow("logic_boolean") },
            channelTypes: {
              block: {
                type: "lists_create_with",
                inputs: {
                  ADD0: { block: { type: "misc_channelType" } },
                  ADD1: { block: { type: "misc_channelType" } },
                  ADD2: { block: { type: "misc_channelType" } }
                }
              }
            }
          }
        }),
        block("modalc_fileUpload", {
          inputs: {
            customId: { shadow: shadow("text") },
            min: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            max: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            required: { shadow: shadow("logic_boolean") }
          }
        }),
        block("modalc_radioGroup", {
          inputs: {
            customId: { shadow: shadow("text") },
            required: { shadow: shadow("logic_boolean") }
          }
        }),
        block("modalc_checkboxGroup", {
          inputs: {
            customId: { shadow: shadow("text") },
            min: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            max: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            required: { shadow: shadow("logic_boolean") }
          }
        }),
        block("modalc_checkbox", {
          inputs: {
            customId: { shadow: shadow("text") },
            checked: {
              shadow: shadow("logic_boolean", { fields: { BOOL: "FALSE" } })
            }
          }
        }),
        label("Options for the select menu ↓"),
        block("modalc_selectOption", {
          inputs: {
            label: { shadow: shadow("text") },
            description: { shadow: shadow("text") },
            emoji: { shadow: shadow("text") },
            value: { shadow: shadow("text") },
            default: {
              shadow: shadow("logic_boolean", { fields: { BOOL: "FALSE" } })
            }
          }
        }),
        label("Options for the radio buttons / checkboxes ↓"),
        block("modalc_choiceOption", {
          inputs: {
            label: { shadow: shadow("text") },
            description: { shadow: shadow("text") },
            value: { shadow: shadow("text") },
            default: {
              shadow: shadow("logic_boolean", { fields: { BOOL: "FALSE" } })
            }
          }
        }),
        label("Events ↓"),
        block("modal_handle_interaction"),
        label("Get what the user submitted ↓"),
        block("modal_get_input_value", {
          inputs: {
            customId: { shadow: shadow("text") }
          }
        }),
        block("modalc_getStringSelectValues", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        block("modalc_getSelectedUsers", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        block("modalc_getSelectedMembers", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        block("modalc_getSelectedRoles", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        block("modalc_getSelectedChannels", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        block("modalc_getSelectedMentionables", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        block("modalc_getUploadedFileUrls", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        block("modalc_getRadioGroup", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        block("modalc_getCheckboxGroup", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        block("modalc_getCheckbox", {
          inputs: { customId: { shadow: shadow("text") } }
        }),
        label("Information about the submitted modal ↓"),
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
};
