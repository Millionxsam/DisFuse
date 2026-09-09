/* =====================================================================
   Blocks that still load but can no longer be added
   ---------------------------------------------------------------------
   Every file in this folder defines blocks that are no longer in the
   toolbox. They are still registered, and deliberately so: a project
   saved years ago must still open, still show its blocks, and still
   generate the same code. What a user cannot do is drag out a new one.

   Deprecation used to be spread across four unrelated places — a file
   called `deprecated.js`, a file whose own header declared the whole
   thing dead (`embeds.js`, superseded by Components V2), and two files
   whose toolbox categories had simply been commented out (`games.js`,
   `localVars.js`) with nothing anywhere saying so. Putting them in one
   folder means "is this block retired?" is answered by where it lives.

   One category of retired block is NOT here: the message-sending blocks
   Components V2 replaced (`channel_send`, `msg_edit`, `member_dm`, the
   `slash_*` and `menus_*` reply blocks and their mutator variants). They
   sit beside their replacements in the live files, because their
   generators share helpers with them and separating the two would mean
   duplicating that code. They are just as retired.
   ===================================================================== */

/**
 * The block types defined in this folder.
 *
 * Exported so the retirement backlog can be *seen* — nothing consumes it
 * at runtime.
 */
export const DEPRECATED_TYPES = [
  "colour_hex",
  "embed_addfield",
  "embed_create",
  "embed_setauthor",
  "embed_setcolor",
  "embed_setdsc",
  "embed_setfooter",
  "embed_setimage",
  "embed_setthumb",
  "embed_settimestamp",
  "embed_settitle",
  "embed_seturl",
  "events_joins_guildmemberadd",
  "events_joins_guildmemberadd_member",
  "events_joins_guildmemberadd_server",
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
  "game_wordle",
  "localVars_change",
  "localVars_get",
  "localVars_set",
  "main_amountservers",
  "misc_int_edit",
  "misc_int_reply",
  "misc_int_reply_rows",
  "modal_add_text_input",
  "modal_add_text_input_advanced",
  "msg_reply",
  "msg_reply_rows",
  "slash_create",
  "slash_createcontainer",
  "slash_editreply",
  "slash_reply",
  "slash_reply_rows",
];
