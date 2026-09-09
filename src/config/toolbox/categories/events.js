import { block, label } from "../helpers.js";

/** The bot reacting to things happening on Discord. */
export default {
  kind: "category",
  name: "Events",
  colour: "FF4F4F",
  contents: [
    {
      kind: "category",
      name: "Server Actions",
      colour: "#A33DAC",
      contents: [
        block("events_guild_memberAdd"),
        block("events_guild_memberAdd_member"),
        block("events_guild_memberAdd_server"),
        block("events_guild_memberAdd_invite"),
        label("------------------------------------------------"),
        block("events_remove_guildmemberremove"),
        block("events_remove_guildmemberremove_member"),
        block("events_remove_guildmemberremove_server"),
        label("------------------------------------------------"),
        block("events_guild_created"),
        block("events_guild_created_guild"),
        block("events_guild_deleted"),
        block("events_guild_deleted_guild")
      ]
    },
    {
      kind: "category",
      name: "Boosts",
      colour: "#A33DAC",
      contents: [
        block("events_boosts_serverBoosted"),
        block("events_boosts_serverBoosted_member"),
        block("events_boosts_serverBoosted_server"),
        label("------------------------------------------------"),
        block("events_boosts_serverUnboosted"),
        block("events_boosts_serverUnboosted_member"),
        block("events_boosts_serverUnboosted_server"),
        label("------------------------------------------------"),
        block("events_boosts_levelUp"),
        block("events_boosts_levelUp_server"),
        block("events_boosts_levelUp_oldLevel"),
        block("events_boosts_levelUp_newLevel"),
        label("------------------------------------------------"),
        block("events_boosts_levelDown"),
        block("events_boosts_levelDown_server"),
        block("events_boosts_levelDown_oldLevel"),
        block("events_boosts_levelDown_newLevel")
      ]
    },
    {
      kind: "category",
      name: "Message Actions",
      colour: "#336EFF",
      contents: [
        block("events_message_deleted"),
        block("events_message_deleted_message"),
        label("------------------------------------------------"),
        block("events_message_ReactionAdd"),
        block("events_message_ReactionAdd_user"),
        block("events_message_ReactionAdd_msg"),
        block("events_message_ReactionAdd_emoji"),
        block("events_message_ReactionAdd_count"),
        label("------------------------------------------------"),
        block("events_message_edited"),
        block("events_message_edited_message"),
        block("events_message_edited_oldContent"),
        block("events_message_edited_newContent"),
        label("------------------------------------------------"),
        block("events_message_pinned"),
        block("events_message_pinned_message"),
        label("------------------------------------------------"),
        block("events_message_reply"),
        block("msg_msg")
      ]
    },
    {
      kind: "category",
      name: "Member Actions",
      colour: "#3c9e56",
      contents: [
        block("events_members_addRole"),
        block("events_members_addRole_member"),
        block("events_members_addRole_role"),
        label("------------------------------------------------"),
        block("events_members_removeRole"),
        block("events_members_removeRole_member"),
        block("events_members_removeRole_role"),
        label("------------------------------------------------"),
        block("events_members_nickname"),
        block("events_members_nickname_member"),
        block("events_members_nickname_oldNickname"),
        block("events_members_nickname_newNickname")
      ]
    },
    {
      kind: "category",
      name: "Thread Actions",
      colour: "#5b67a5",
      contents: [
        block("events_thread_created"),
        block("events_thread_created_thread"),
        block("events_thread_created_parent"),
        label("------------------------------------------------"),
        block("events_thread_deleted"),
        block("events_thread_deleted_thread")
      ]
    },
    {
      kind: "category",
      name: "Emojis & Stickers",
      colour: "#DEB144",
      contents: [
        block("events_emojis_created"),
        block("events_emojis_deleted"),
        block("events_emojis_createdOrDeletedEmoji"),
        label("------------------------------------------------"),
        block("events_emojis_changed"),
        block("events_emojis_changedOldEmoji"),
        block("events_emojis_changedNewEmoji"),
        label("------------------------------------------------"),
        block("events_stickers_created"),
        block("events_stickers_deleted"),
        block("events_stickers_createdOrDeletedSticker"),
        label("------------------------------------------------"),
        block("events_stickers_changed"),
        block("events_stickers_changedOldSticker"),
        block("events_stickers_changedNewSticker")
      ]
    },
    {
      kind: "category",
      name: "Custom",
      colour: "#999999",
      contents: [
        label("Use custom discord.js v14 events ↓"),
        block("events_custom"),
        block("events_customParameter")
      ]
    }
  ]
};
