module.exports = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "main_ready",
        id: "Jyv6-#-TL.1-if(l~{4M",
        x: 257,
        y: 289,
        inputs: {
          event: {
            block: {
              type: "slash_createcontainer",
              id: ";y)Ob46k|W^f~r/Y+w0$",
              icons: {
                comment: {
                  text: "If the guild id is blank, this command will be registered on all of the servers the bot is in. You can enter a guild id here to only register these commands in a single server",
                  pinned: false,
                  height: 112,
                  width: 249,
                },
              },
              inputs: {
                commands: {
                  block: {
                    type: "slash_create",
                    id: "EN6#5HwKCtGx^JxRsWM/",
                    inputs: {
                      name: {
                        shadow: {
                          type: "text",
                          id: "MjI)f3~#pp?Uw)uD,NoI",
                          fields: { TEXT: "" },
                        },
                        block: {
                          type: "text",
                          id: "$N(;q_%*BD.?S{u):+4q",
                          icons: {
                            comment: {
                              text: "The name of your command (without the slash)",
                              pinned: false,
                              height: 80,
                              width: 196,
                            },
                          },
                          fields: { TEXT: "name" },
                        },
                      },
                      dsc: {
                        shadow: {
                          type: "text",
                          id: "GVQGcHSato]VY8DkyObA",
                          fields: { TEXT: "The description of your command" },
                        },
                      },
                      nsfw: {
                        shadow: {
                          type: "logic_boolean",
                          id: "noNvc)o9aRoQ89O^S=Cx",
                          fields: { BOOL: "FALSE" },
                        },
                        block: {
                          type: "logic_boolean",
                          id: "p-{2cynuARvi/bfDxI=#",
                          icons: {
                            comment: {
                              text: "If nsfw is set to true, the command will only be usable in nsfw channels",
                              pinned: false,
                              height: 88,
                              width: 198,
                            },
                          },
                          fields: { BOOL: "FALSE" },
                        },
                      },
                      dm: {
                        shadow: {
                          type: "logic_boolean",
                          id: "PySFPbf3mbZ!:QZ):R=7",
                          fields: { BOOL: "TRUE" },
                        },
                        block: {
                          type: "logic_boolean",
                          id: "7G-Ini7Z5uDn!+u4r-[5",
                          icons: {
                            comment: {
                              text: "If this is false, users cannot use this command in dms with the bot",
                              pinned: false,
                              height: 101,
                              width: 218,
                            },
                          },
                          fields: { BOOL: "TRUE" },
                        },
                      },
                      perms: {
                        block: {
                          type: "lists_create_with",
                          id: ",qqIA=Q|3X%65GhBq,TY",
                          extraState: { itemCount: 3 },
                          icons: {
                            comment: {
                              text: "Users who do not have these permissions will not be able to run or view this command at all.\nThis can be a list of permissions, or a single permission.",
                              pinned: false,
                              height: 109,
                              width: 311,
                            },
                          },
                          inputs: {
                            ADD0: {
                              block: {
                                type: "misc_permission",
                                id: "UWklu2Vk;gcDR6w}g!tY",
                                fields: { permission: "Administrator" },
                              },
                            },
                          },
                        },
                      },
                      options: {
                        block: {
                          type: "slash_addoption",
                          id: "cr_e#@E2?b^Cawj%M2o8",
                          fields: { type: "3" },
                          inputs: {
                            name: {
                              block: {
                                type: "text",
                                id: "HrE]e#f7sJ-H-Jp,f[)$",
                                fields: { TEXT: "text" },
                              },
                            },
                            dsc: {
                              block: {
                                type: "text",
                                id: ";,}^8n32~y;2]C]xyR}S",
                                fields: { TEXT: "Description of this option" },
                              },
                            },
                            required: {
                              block: {
                                type: "logic_boolean",
                                id: "gn*F?;np+JXgn=kRnSkS",
                                fields: { BOOL: "TRUE" },
                              },
                            },
                            choices: {
                              block: {
                                type: "slash_addchoice",
                                id: "npt%v1bVC)?GJrHSD#gk",
                                icons: {
                                  comment: {
                                    text: "You can only add these choices to text options. If a text option has choices, the user will choose one of the choices when running the command. If there are no choices, users will type in any text.",
                                    pinned: false,
                                    height: 105,
                                    width: 334,
                                  },
                                },
                                inputs: {
                                  name: {
                                    block: {
                                      type: "text",
                                      id: ")|*h-x6wa`gtxQ:drErX",
                                      fields: { TEXT: "Some cool choice name" },
                                    },
                                  },
                                  value: {
                                    block: {
                                      type: "text",
                                      id: "(.}ANxT4S6J4M#|IA3V,",
                                      fields: { TEXT: "choice" },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          next: {
                            block: {
                              type: "slash_addoption",
                              id: "B@tNadid!8gZZym^hdbT",
                              icons: {
                                comment: {
                                  text: "Leave the choices blank if it's not a text option",
                                  pinned: false,
                                  height: 80,
                                  width: 160,
                                },
                              },
                              fields: { type: "7" },
                              inputs: {
                                name: {
                                  block: {
                                    type: "text",
                                    id: "Zaq_Y;;d5T7aV?@2D%Sb",
                                    fields: { TEXT: "channel" },
                                  },
                                },
                                dsc: {
                                  block: {
                                    type: "text",
                                    id: "i;Ut1bE*~G[`(zS]+Fk7",
                                    fields: { TEXT: "Select a channel" },
                                  },
                                },
                                required: {
                                  block: {
                                    type: "logic_boolean",
                                    id: "f;,_W%Yr9T$M[I~`{zM;",
                                    fields: { BOOL: "TRUE" },
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
      },
      {
        type: "slash_received",
        id: "9DJgKP@%uBUO5gQy}({M",
        x: 1239,
        y: 359,
        icons: {
          comment: {
            text: "Responding to the command",
            pinned: false,
            height: 80,
            width: 160,
          },
        },
        inputs: {
          event: {
            block: {
              type: "controls_if",
              id: "vODIu,`10[.l_+NZ$rGO",
              icons: {
                comment: {
                  text: 'The "when a slash command is received" event runs whenever a command is run, so you have to check which command was actually ran. If your bot has multiple commands, then you would have multiple "if" blocks.',
                  pinned: false,
                  height: 134,
                  width: 306,
                },
              },
              inputs: {
                IF0: {
                  block: {
                    type: "logic_compare",
                    id: "l*NMWg/WgM[]mat!5S?^",
                    fields: { OP: "EQ" },
                    inputs: {
                      A: {
                        block: {
                          type: "slash_name",
                          id: "|CR6Mc1oObXOT,c(`kK5",
                        },
                      },
                      B: {
                        block: {
                          type: "text",
                          id: "N.@gJ(!?/LE$^3f{AXAz",
                          fields: { TEXT: "name" },
                        },
                      },
                    },
                  },
                },
                DO0: {
                  block: {
                    type: "slash_reply",
                    id: "^kt3uyP9@r7m:Rk96#d=",
                    icons: {
                      comment: {
                        text: "You can leave the embeds blank if you only want to send content, and vice versa.",
                        pinned: false,
                        height: 80,
                        width: 160,
                      },
                    },
                    inputs: {
                      content: {
                        block: {
                          type: "slash_getoption",
                          id: "kArbyb/:Llf6s1r,O7U?",
                          icons: {
                            comment: {
                              text: 'This returns the value that the user inputted into the command. Select the type of the option and the name of the option. This will be "null" if the user did not input anything (it will never be null in this case because the option is required)',
                              pinned: false,
                              height: 131,
                              width: 288,
                            },
                          },
                          fields: { type: "String" },
                          inputs: {
                            name: {
                              block: {
                                type: "text",
                                id: "p:)oe3{rP,+RI`(K`vsZ",
                                fields: { TEXT: "text" },
                              },
                            },
                          },
                        },
                      },
                      ephemeral: {
                        block: {
                          type: "logic_boolean",
                          id: "p0+p:jE8H7}X-#Y{b40:",
                          icons: {
                            comment: {
                              text: "If this is true, only the user who ran the command will be able to see this response.",
                              pinned: false,
                              height: 80,
                              width: 160,
                            },
                          },
                          fields: { BOOL: "TRUE" },
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
        type: "comment_float",
        id: "_|i82)B:{nOO+Fi[~o0^",
        x: 658,
        y: 119,
        fields: {
          TEXT: "Click the question marks to read more info of each section",
        },
      },
    ],
  },
  variables: [{ name: "item", id: "F+0w$pPmhb@|bMUt}|CY" }],
  backpack: [],
};
