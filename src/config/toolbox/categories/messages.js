import { block, label, sep, shadow } from "../helpers.js";

/** Sending, editing and reacting to messages; threads and polls. */
export default {
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
        block("msg_reaction_users"),
        label("Reply information ↓"),
        block("msg_isReply", {
          inputs: {
            message: { shadow: shadow("msg_msg") }
          }
        }),
        block("msg_replyPing", {
          inputs: {
            message: { shadow: shadow("msg_msg") }
          }
        }),
        block("msg_replyTo", {
          inputs: {
            message: { shadow: shadow("msg_msg") }
          }
        })
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
        block("threads_removeUser"),
        block("threads_delete", {
          inputs: {
            thread: { shadow: shadow("threads_createdThread") }
          }
        }),
        label("Thread information ↓"),
        block("threads_msgInThread", {
          inputs: {
            message: { shadow: shadow("msg_msg") }
          }
        }),
        block("threads_getThread", {
          inputs: {
            message: { shadow: shadow("msg_msg") }
          }
        }),
        block("threads_isStatus", {
          inputs: {
            thread: { shadow: shadow("threads_createdThread") }
          }
        })
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
};
