import { block, label, shadow } from "../helpers.js";

/** Everything about a guild: channels, roles, invites, members, webhooks, emojis, stickers. */
export default {
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
        block("member_unban"),
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
};
