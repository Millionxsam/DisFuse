import { block, label } from "../helpers.js";

/* =====================================================================
   Legacy
   ---------------------------------------------------------------------
   Every retired block, so it can still be found. These are the blocks in
   `blocks/deprecated/` (DEPRECATED_TYPES), the message-sending blocks
   Components V2 replaced that still live beside their replacements, and
   the definitions that were orphaned in live files — registered and
   generating code, but missing from every other category.

   They are kept so old projects can be understood and patched. Anything
   new should use the blocks in the regular categories instead.
   ===================================================================== */

const COLOUR = "#7a7a7a";

const WARNING = label(
  "These blocks are deprecated and may be removed. Prefer the blocks in the other categories."
);

/** One sub-category of Legacy. Strings are block types; anything else is passed through. */
function legacy(name, items) {
  return {
    kind: "category",
    name,
    colour: COLOUR,
    contents: [
      WARNING,
      ...items.map(item => (typeof item === "string" ? block(item) : item))
    ]
  };
}

export default {
  kind: "category",
  name: "Legacy",
  colour: COLOUR,
  contents: [
    WARNING,

    /* Replaced by the Components V2 send / reply / edit blocks. */
    legacy("Sending Messages", [
      "channel_send",
      "channel_send_rows",
      "channel_send_mutator",
      "msg_reply",
      "msg_reply_rows",
      "msg_reply_mutator",
      "msg_edit",
      "msg_edit_mutator",
      "member_dm",
      "member_dm_rows",
      "member_dm_mutator",
      "fs_sendFile",
      "misc_addFile"
    ]),

    /* Replies to slash commands, buttons and menus from before Components V2. */
    legacy("Interaction Replies", [
      "misc_int_reply",
      "misc_int_reply_rows",
      "misc_int_reply_mutator",
      "misc_int_edit",
      "misc_int_edit_mutator",
      "misc_int_id",
      "slash_reply",
      "slash_reply_rows",
      "slash_editreply",
      "slash_edit",
      "menus_reply",
      "menus_edit",
      "menus_update"
    ]),

    /* Command registration and modal inputs with newer replacements. */
    legacy("Commands & Modals", [
      "slash_create",
      "slash_createcontainer",
      "misc_createcontainer",
      "modal_add_text_input",
      "modal_add_text_input_advanced"
    ]),

    /* Superseded by Components V2 containers. */
    legacy("Embeds", [
      "embed_create",
      "embed_settitle",
      "embed_seturl",
      "embed_setdsc",
      "embed_setcolor",
      "embed_setauthor",
      "embed_setthumb",
      "embed_setimage",
      "embed_addfield",
      "embed_setfooter",
      "embed_settimestamp"
    ]),

    /* Per-event shortcuts, replaced by the event's object plus a property block. */
    legacy("Event Variables", [
      label("Message received ↓"),
      "msg_content",
      "msg_member",
      "msg_user",
      "msg_channel",
      "msg_server",
      "msg_delete",
      label("Slash commands ↓"),
      "slash_member",
      "slash_user",
      "slash_channel",
      "slash_server",
      label("Buttons ↓"),
      "buttons_member",
      "buttons_user",
      "buttons_channel",
      "buttons_server",
      label("Menus ↓"),
      "menus_member",
      "menus_user",
      "menus_channel",
      "menus_server",
      label("Context menus ↓"),
      "contextMenu_member",
      "contextMenu_user",
      "contextMenu_channel",
      "contextMenu_server",
      label("Member joins ↓"),
      "events_joins_guildmemberadd",
      "events_joins_guildmemberadd_member",
      "events_joins_guildmemberadd_server"
    ]),

    legacy("Captcha", [
      "captcha_create",
      "captcha_send",
      "captcha_reply",
      "captcha_replyInteraction"
    ]),

    legacy("Games", [
      "game_2048",
      "game_connect4",
      "game_fasttype",
      "game_findemoji",
      "game_flood",
      "game_hangman",
      "game_matchpairs",
      "game_minesweeper",
      "game_rps",
      "game_slots",
      "game_snake",
      "game_tictactoe",
      "game_trivia",
      "game_wordle"
    ]),

    legacy("Local Variables", [
      "localVars_set",
      "localVars_change",
      "localVars_get"
    ]),

    legacy("Miscellaneous", [
      "main_amountservers",
      "channel_set_permission",
      "invite_createGuild",
      "colour_hex",
      "text_regexp_search",
      "object_merge",
      "comment_stack",
      "comment_stackImage"
    ])
  ]
};
