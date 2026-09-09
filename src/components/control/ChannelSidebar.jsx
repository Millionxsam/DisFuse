import { useMemo, useState } from "react";

import {
  CHANNEL_TYPES,
  avatarUrl,
  botCan,
  channelIcon,
  dmName,
  isThread,
  isVoice,
} from "./discordUtils";

/* =====================================================================
   Channel sidebar
   ---------------------------------------------------------------------
   Categories, then channels, then the threads that live inside them —
   the same shape as Discord's, built from what the gateway told us the
   bot can see.

   Channels the bot has no View Channel permission for are shown greyed
   out rather than hidden. A bot owner debugging "why can't my bot post
   in #general" needs to see that the channel exists and the bot can't
   read it; silently omitting it hides the answer.
   ===================================================================== */

export default function ChannelSidebar({
  guild,
  dms,
  activeChannelId,
  onSelectChannel,
  onOpenGuildSettings,
  onCreateChannel,
  unread,
  mentions,
  voiceStates,
  connecting,
}) {
  const [collapsed, setCollapsed] = useState({});
  const [query, setQuery] = useState("");

  const tree = useMemo(() => buildTree(guild?.channels || []), [guild]);

  /* ---- Direct messages ---- */
  if (!guild) {
    const shown = (dms || []).filter((channel) =>
      dmName(channel).toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
      <aside className="dc-sidebar">
        <header className="dc-sidebar-head">
          <span>Direct Messages</span>
        </header>

        <div className="dc-sidebar-search">
          <input
            type="search"
            placeholder="Find a conversation"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="dc-channel-list">
          {shown.length ? (
            shown.map((channel) => (
              <button
                key={channel.id}
                className={`dc-channel dc-dm${
                  channel.id === activeChannelId ? " active" : ""
                }${unread?.[channel.id] ? " unread" : ""}`}
                onClick={() => onSelectChannel(channel.id)}
              >
                <img
                  className="dc-dm-avatar"
                  src={avatarUrl(channel.recipients?.[0], 32)}
                  alt=""
                  loading="lazy"
                />
                <span className="dc-channel-name">{dmName(channel)}</span>
                {mentions?.[channel.id] > 0 && (
                  <span className="dc-mention-badge">
                    {mentions[channel.id]}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="dc-sidebar-empty">
              <i className="fa-solid fa-inbox"></i>
              <p>
                Discord doesn't let a bot list its DMs. A conversation appears
                here once someone messages the bot, or when you open one from a
                member's profile.
              </p>
            </div>
          )}
        </div>
      </aside>
    );
  }

  /* ---- A server ---- */
  const canManageChannels = guild.permissionNames?.includes("ManageChannels");

  return (
    <aside className="dc-sidebar">
      <button
        className="dc-sidebar-head dc-guild-head"
        onClick={onOpenGuildSettings}
        title="Server settings"
      >
        <span className="dc-guild-name">{guild.name}</span>
        <i className="fa-solid fa-chevron-down"></i>
      </button>

      {connecting && (
        <div className="dc-sidebar-note">
          <i className="fa-solid fa-circle-notch fa-spin"></i> Syncing…
        </div>
      )}

      <div className="dc-channel-list">
        {tree.map((group) => {
          const key = group.category?.id || "__none";
          const isCollapsed = collapsed[key];

          return (
            <section className="dc-channel-group" key={key}>
              {group.category && (
                <button
                  className={`dc-category${isCollapsed ? " collapsed" : ""}`}
                  onClick={() =>
                    setCollapsed((state) => ({ ...state, [key]: !state[key] }))
                  }
                >
                  <i className="fa-solid fa-chevron-down"></i>
                  <span>{group.category.name}</span>
                  {canManageChannels && (
                    <span
                      className="dc-category-add"
                      role="button"
                      tabIndex={0}
                      title="Create channel here"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCreateChannel?.(group.category.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.stopPropagation();
                        onCreateChannel?.(group.category.id);
                      }}
                    >
                      <i className="fa-solid fa-plus"></i>
                    </span>
                  )}
                </button>
              )}

              {!isCollapsed &&
                group.channels.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    threads={group.threadsByParent[channel.id] || []}
                    activeChannelId={activeChannelId}
                    onSelectChannel={onSelectChannel}
                    unread={unread}
                    mentions={mentions}
                    voiceStates={voiceStates}
                    guild={guild}
                  />
                ))}
            </section>
          );
        })}

        {!tree.length && (
          <div className="dc-sidebar-empty">
            <i className="fa-solid fa-eye-slash"></i>
            <p>
              This bot can't see any channels in this server. Give it the View
              Channel permission and they'll appear here.
            </p>
          </div>
        )}
      </div>

      {canManageChannels && (
        <button
          className="dc-sidebar-action"
          onClick={() => onCreateChannel?.(null)}
        >
          <i className="fa-solid fa-plus"></i> Create channel
        </button>
      )}
    </aside>
  );
}

function ChannelRow({
  channel,
  threads,
  activeChannelId,
  onSelectChannel,
  unread,
  mentions,
  voiceStates,
  guild,
}) {
  const visible = botCan(channel, "ViewChannel");
  const inVoice = isVoice(channel)
    ? (voiceStates || []).filter((state) => state.channelId === channel.id)
    : [];

  return (
    <>
      <button
        className={`dc-channel${channel.id === activeChannelId ? " active" : ""}${
          unread?.[channel.id] ? " unread" : ""
        }${visible ? "" : " locked"}`}
        onClick={() => onSelectChannel(channel.id)}
        title={
          visible
            ? channel.topic || channel.name
            : "The bot can't see this channel"
        }
      >
        <i className={channelIcon(channel)}></i>
        <span className="dc-channel-name">{channel.name}</span>
        {!visible && <i className="fa-solid fa-lock dc-channel-lock"></i>}
        {mentions?.[channel.id] > 0 && (
          <span className="dc-mention-badge">{mentions[channel.id]}</span>
        )}
      </button>

      {inVoice.length > 0 && (
        <div className="dc-voice-members">
          {inVoice.map((state) => {
            const member = guild.members?.find(
              (m) => m.user?.id === state.userId,
            );

            return (
              <div className="dc-voice-member" key={state.userId}>
                <img src={avatarUrl(member?.user, 32)} alt="" loading="lazy" />
                <span>
                  {member?.nick ||
                    member?.user?.globalName ||
                    member?.user?.username ||
                    state.userId}
                </span>
                {(state.selfMute || state.mute) && (
                  <i className="fa-solid fa-microphone-slash"></i>
                )}
                {(state.selfDeaf || state.deaf) && (
                  <i className="fa-solid fa-headphones-simple"></i>
                )}
                {state.selfStream && <i className="fa-solid fa-desktop"></i>}
              </div>
            );
          })}
        </div>
      )}

      {threads.length > 0 && (
        <div className="dc-thread-list">
          {threads.map((thread) => (
            <button
              key={thread.id}
              className={`dc-channel dc-thread${
                thread.id === activeChannelId ? " active" : ""
              }`}
              onClick={() => onSelectChannel(thread.id)}
            >
              <span className="dc-thread-line" />
              <i className="fa-solid fa-comment-dots"></i>
              <span className="dc-channel-name">{thread.name}</span>
              {thread.threadMetadata?.archived && (
                <i className="fa-solid fa-box-archive" title="Archived"></i>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/** Categories in Discord's own order, with orphan channels first. */
function buildTree(channels) {
  const categories = channels
    .filter((channel) => channel.type === CHANNEL_TYPES.CATEGORY)
    .sort((a, b) => a.position - b.position);

  const threads = channels.filter(isThread);

  const threadsByParent = {};
  for (const thread of threads) {
    if (!thread.parentId) continue;
    (threadsByParent[thread.parentId] ||= []).push(thread);
  }

  const sortable = (list) =>
    list.slice().sort((a, b) => {
      /* Discord sorts voice below text, then by position, then by ID. */
      const aVoice = isVoice(a) ? 1 : 0;
      const bVoice = isVoice(b) ? 1 : 0;
      if (aVoice !== bVoice) return aVoice - bVoice;
      if (a.position !== b.position) return a.position - b.position;
      return a.id.localeCompare(b.id);
    });

  const inCategory = (categoryId) =>
    sortable(
      channels.filter(
        (channel) =>
          !isThread(channel) &&
          channel.type !== CHANNEL_TYPES.CATEGORY &&
          (channel.parentId || null) === categoryId,
      ),
    );

  const groups = [];

  const orphans = inCategory(null);
  if (orphans.length)
    groups.push({ category: null, channels: orphans, threadsByParent });

  for (const category of categories) {
    groups.push({
      category,
      channels: inCategory(category.id),
      threadsByParent,
    });
  }

  return groups;
}
