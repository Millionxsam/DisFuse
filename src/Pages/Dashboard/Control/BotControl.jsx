import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Swal from "sweetalert2";

import useControlSession from "../../../functions/useControlSession";
import modalThemeColor from "../../../functions/modalThemeColor";
import LoadingAnim from "../../../components/LoadingAnim";

import GuildRail from "../../../components/control/GuildRail";
import ChannelSidebar from "../../../components/control/ChannelSidebar";
import MemberList from "../../../components/control/MemberList";
import MessageComposer from "../../../components/control/MessageComposer";
import Message from "../../../components/control/Message";
import MemberPanel from "../../../components/control/MemberPanel";
import ServerPanel from "../../../components/control/ServerPanel";
import ChannelPanel from "../../../components/control/ChannelPanel";
import BotPanel from "../../../components/control/BotPanel";
import PinnedPanel from "../../../components/control/PinnedPanel";
import UserPanel from "../../../components/control/UserPanel";
import ForumView from "../../../components/control/ForumView";
import RichSendPanel from "../../../components/control/RichSendPanel";
import {
  botCan,
  canSendIn,
  channelIcon,
  channelLabel,
  emojiUrl,
  formatDayDivider,
  groupsWith,
  isForum,
  isThread,
  isVoice,
} from "../../../components/control/discordUtils";

const modalColors = modalThemeColor(null, true);

const REACTION_SUGGESTIONS = [
  "👍", "👎", "❤️", "🔥", "🎉", "😂", "😮", "😢", "👀", "✅", "❌", "🙏",
];

/* =====================================================================
   Control — the Discord client
   ---------------------------------------------------------------------
   Everything on this page is driven by one Socket.IO session
   (functions/useControlSession.js). The browser holds no Discord
   credential of any kind: it asks the DisFuse API to do things, the API
   does them as the bot, and Discord's own events come back down the same
   socket and patch the state below.

   State is a reducer rather than a pile of useStates because the same
   twenty-odd Discord events have to fold into it consistently, whether
   they arrive from the initial sync, from a live gateway event, or as
   the result of an action the person just took.
   ===================================================================== */

const initialState = {
  guilds: [],
  dms: [],
  guild: null,
  messages: {},
  hasMore: {},
  unread: {},
  mentions: {},
  /** Mention counts rolled up per server, for the rail badge. */
  guildMentions: {},
  typing: {},
};

function reducer(state, event) {
  const { type, data } = event;

  switch (type) {
    /* ---- Wholesale ---- */
    case "snapshot":
      return {
        ...initialState,
        guilds: data.guilds || [],
        dms: data.dms || [],
      };

    case "setGuild":
      return { ...state, guild: data };

    case "setMessages": {
      /* Only a handful of channels are worth keeping in memory; the rest
         are re-fetched instantly when opened again. */
      const messages = { ...state.messages, [data.channelId]: data.messages };
      const keys = Object.keys(messages);

      if (keys.length > 8) delete messages[keys[0]];

      return {
        ...state,
        messages,
        hasMore: { ...state.hasMore, [data.channelId]: data.hasMore },
        ...clearUnread(state, data.channelId),
      };
    }

    case "prependMessages":
      return {
        ...state,
        messages: {
          ...state.messages,
          [data.channelId]: [
            ...data.messages,
            ...(state.messages[data.channelId] || []),
          ],
        },
        hasMore: { ...state.hasMore, [data.channelId]: data.hasMore },
      };

    case "markRead":
      return { ...state, ...clearUnread(state, data.channelId) };

    /* ---- Servers ---- */
    case "guildCreate":
    case "guildAvailable":
      return {
        ...state,
        guilds: upsert(state.guilds, data.guild, (g) => g.id).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      };

    case "guildUpdate":
      return {
        ...state,
        guilds: upsert(state.guilds, data.guild, (g) => g.id),
        guild:
          state.guild?.id === data.guild.id
            ? { ...state.guild, ...data.guild }
            : state.guild,
      };

    case "guildDelete":
    case "guildUnavailable":
      return {
        ...state,
        guilds: state.guilds.filter((g) => g.id !== data.guildId),
        guild: state.guild?.id === data.guildId ? null : state.guild,
      };

    /* ---- Channels ---- */
    case "channelCreate":
    case "channelUpdate":
    case "threadCreate":
    case "threadUpdate": {
      const channel = data.channel;

      if (!channel.guildId) {
        return { ...state, dms: upsert(state.dms, channel, (c) => c.id) };
      }

      if (state.guild?.id !== channel.guildId) return state;

      return {
        ...state,
        guild: {
          ...state.guild,
          channels: upsert(state.guild.channels, channel, (c) => c.id),
        },
      };
    }

    case "channelDelete":
    case "threadDelete": {
      const messages = { ...state.messages };
      delete messages[data.channelId];

      if (state.guild?.id !== data.guildId) return { ...state, messages };

      return {
        ...state,
        messages,
        guild: {
          ...state.guild,
          channels: state.guild.channels.filter((c) => c.id !== data.channelId),
        },
      };
    }

    case "threadListSync": {
      if (state.guild?.id !== data.guildId) return state;

      return {
        ...state,
        guild: {
          ...state.guild,
          channels: data.threads.reduce(
            (list, thread) => upsert(list, thread, (c) => c.id),
            state.guild.channels,
          ),
        },
      };
    }

    /* ---- Roles ---- */
    case "roleCreate":
    case "roleUpdate":
      if (state.guild?.id !== data.guildId) return state;
      return {
        ...state,
        guild: {
          ...state.guild,
          roles: upsert(state.guild.roles, data.role, (r) => r.id),
        },
      };

    case "roleDelete":
      if (state.guild?.id !== data.guildId) return state;
      return {
        ...state,
        guild: {
          ...state.guild,
          roles: state.guild.roles.filter((r) => r.id !== data.roleId),
        },
      };

    /* ---- Members ---- */
    case "memberAdd":
    case "memberUpdate":
      if (state.guild?.id !== data.guildId) return state;
      return {
        ...state,
        guild: {
          ...state.guild,
          members: upsert(state.guild.members, data.member, (m) => m.user?.id),
          self: data.isSelf ? data.member : state.guild.self,
        },
      };

    case "selfMemberUpdate":
      if (state.guild?.id !== data.guildId) return state;
      return {
        ...state,
        guild: { ...state.guild, self: data.member },
      };

    case "memberRemove":
      if (state.guild?.id !== data.guildId) return state;
      return {
        ...state,
        guild: {
          ...state.guild,
          members: state.guild.members.filter((m) => m.user?.id !== data.userId),
        },
      };

    case "memberChunk":
    case "membersLoaded":
      if (state.guild?.id !== data.guildId) return state;
      return {
        ...state,
        guild: {
          ...state.guild,
          members: data.members.reduce(
            (list, member) => upsert(list, member, (m) => m.user?.id),
            state.guild.members,
          ),
        },
      };

    case "presenceUpdate": {
      if (state.guild?.id !== data.guildId) return state;

      return {
        ...state,
        guild: {
          ...state.guild,
          members: state.guild.members.map((member) =>
            member.user?.id === data.userId
              ? { ...member, status: data.status, activities: data.activities }
              : member,
          ),
        },
      };
    }

    case "voiceStateUpdate": {
      if (state.guild?.id !== data.guildId) return state;

      const others = (state.guild.voiceStates || []).filter(
        (entry) => entry.userId !== data.state.userId,
      );

      return {
        ...state,
        guild: {
          ...state.guild,
          voiceStates: data.state.channelId ? [...others, data.state] : others,
          members: data.member
            ? upsert(state.guild.members, data.member, (m) => m.user?.id)
            : state.guild.members,
        },
      };
    }

    /* ---- Messages ---- */
    case "messageCreate": {
      const list = state.messages[data.message.channelId];
      if (!list) return state;

      return {
        ...state,
        messages: {
          ...state.messages,
          [data.message.channelId]: [
            ...list.filter((m) => m.id !== data.message.id),
            data.message,
          ].slice(-300),
        },
      };
    }

    case "messageActivity": {
      if (data.channelId === data.activeChannelId || data.fromBot) return state;

      return {
        ...state,
        unread: {
          ...state.unread,
          [data.channelId]: (state.unread[data.channelId] || 0) + 1,
        },
        mentions: data.mentionsBot
          ? {
              ...state.mentions,
              [data.channelId]: (state.mentions[data.channelId] || 0) + 1,
            }
          : state.mentions,
        guildMentions:
          data.mentionsBot && data.guildId
            ? {
                ...state.guildMentions,
                [data.guildId]: (state.guildMentions[data.guildId] || 0) + 1,
              }
            : state.guildMentions,
      };
    }

    case "messageUpdate":
    case "reactionAdd":
    case "reactionRemove":
    case "reactionClear": {
      const message = data.message;
      if (!message) return state;

      const list = state.messages[message.channelId];
      if (!list) return state;

      return {
        ...state,
        messages: {
          ...state.messages,
          [message.channelId]: list.map((entry) =>
            entry.id === message.id ? { ...entry, ...message } : entry,
          ),
        },
      };
    }

    case "messageDelete": {
      const list = state.messages[data.channelId];
      if (!list) return state;

      return {
        ...state,
        messages: {
          ...state.messages,
          [data.channelId]: list.filter((m) => m.id !== data.messageId),
        },
      };
    }

    case "messageDeleteBulk": {
      const list = state.messages[data.channelId];
      if (!list) return state;

      const removed = new Set(data.messageIds);

      return {
        ...state,
        messages: {
          ...state.messages,
          [data.channelId]: list.filter((m) => !removed.has(m.id)),
        },
      };
    }

    /* ---- Typing ---- */
    case "typingStart": {
      const name =
        data.member?.nick ||
        data.member?.user?.globalName ||
        data.member?.user?.username ||
        "Someone";

      return {
        ...state,
        typing: {
          ...state.typing,
          [data.channelId]: {
            ...(state.typing[data.channelId] || {}),
            [data.userId]: { name, at: Date.now() },
          },
        },
      };
    }

    case "typingExpire": {
      const channel = state.typing[data.channelId];
      if (!channel) return state;

      const kept = Object.fromEntries(
        Object.entries(channel).filter(
          ([, entry]) => Date.now() - entry.at < 9000,
        ),
      );

      return { ...state, typing: { ...state.typing, [data.channelId]: kept } };
    }

    /* ---- Expressions ---- */
    case "emojisUpdate":
      if (state.guild?.id !== data.guildId) return state;
      return { ...state, guild: { ...state.guild, emojis: data.emojis } };

    case "stickersUpdate":
      if (state.guild?.id !== data.guildId) return state;
      return { ...state, guild: { ...state.guild, stickers: data.stickers } };

    default:
      return state;
  }
}

/**
 * Clearing a channel also has to take its mentions back off the server
 * badge, or the rail keeps a count for a channel that's already read.
 */
function clearUnread(state, channelId) {
  const mentions = state.mentions[channelId] || 0;

  const guildMentions = { ...state.guildMentions };
  if (mentions) {
    for (const [guildId, count] of Object.entries(guildMentions)) {
      const next = count - mentions;
      if (next > 0) guildMentions[guildId] = next;
      else delete guildMentions[guildId];
    }
  }

  return {
    unread: { ...state.unread, [channelId]: 0 },
    mentions: { ...state.mentions, [channelId]: 0 },
    guildMentions,
  };
}

function upsert(list, item, key) {
  if (!item) return list || [];

  const existing = list || [];
  const index = existing.findIndex((entry) => key(entry) === key(item));

  if (index < 0) return [...existing, item];

  const next = existing.slice();
  next[index] = { ...next[index], ...item };
  return next;
}

/* ===================================================================== */

export default function BotControl() {
  const { projectId } = useParams();

  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeGuildId, setActiveGuildId] = useState(null);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberCursor, setMemberCursor] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [panel, setPanel] = useState(null);
  /* Embeds and components built in their dialogs, waiting on the message
     box for whatever text is typed alongside them. */
  const [draft, setDraft] = useState({ embeds: [], components: [] });
  const [reactionTarget, setReactionTarget] = useState(null);
  const [mobilePane, setMobilePane] = useState("channels");
  const [resyncToken, setResyncToken] = useState(0);
  /* Discord's member list is a toggle, not a fixture. Below 1100px the
     stylesheet turns it into its own pane; above that this hides it. */
  const [membersOpen, setMembersOpen] = useState(true);

  const activeChannelRef = useRef(null);
  activeChannelRef.current = activeChannelId;

  const scroller = useRef(null);
  const pinnedToBottom = useRef(true);

  /* ---- Toasts ---- */
  const notify = useMemo(() => {
    const push = (tone, text) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current, { id, tone, text }]);
      setTimeout(
        () => setToasts((current) => current.filter((t) => t.id !== id)),
        tone === "error" ? 7000 : 4000,
      );
    };

    return {
      success: (text) => push("success", text),
      error: (text) => push("error", text),
      info: (text) => push("info", text),
    };
  }, []);

  /* ---- The session ---- */
  const onEvent = useCallback((event) => {
    if (event.type === "messageActivity") {
      dispatch({
        type: "messageActivity",
        data: { ...event.data, activeChannelId: activeChannelRef.current },
      });
      return;
    }

    dispatch(event);
  }, []);

  const { status, session, error, fatal, action, view, retry } =
    useControlSession(projectId, { onEvent });

  /* A snapshot arrives once per connect, and again whenever the bot
     re-identifies with Discord. Either way the browser's copy is
     replaced wholesale — `session.guilds` is a fresh array each time,
     which is what makes this fire. */
  const snapshotKey = session?.guilds;

  useEffect(() => {
    if (!snapshotKey) return;

    dispatch({ type: "snapshot", data: session });
    setResyncToken((token) => token + 1);
    /* `session` is deliberately not a dependency: status updates merge
       into it constantly and must not re-trigger a full reset. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotKey]);

  /* Re-establishing the view after a reconnect.

     A reconnect is a NEW socket, and a re-identify empties the backend's
     cache — either way the server no longer knows which server and
     channel this tab is looking at, so no events would arrive for them.
     This puts the scope back and reloads what's on screen, without
     disturbing the user's selection. */
  useEffect(() => {
    if (!resyncToken) return;
    if (!activeGuildId && !activeChannelId) return;

    let cancelled = false;

    (async () => {
      const scope = await view({
        guildId: activeGuildId,
        channelId: activeChannelId,
      });

      if (cancelled) return;

      if (!scope) {
        /* The bot was removed from that server while we were away. */
        setActiveGuildId(null);
        setActiveChannelId(null);
        dispatch({ type: "setGuild", data: null });
        return;
      }

      if (scope.guild) dispatch({ type: "setGuild", data: scope.guild });
      if (!activeChannelId) return;

      try {
        const result = await action("channel.fetchMessages", {
          channelId: activeChannelId,
          limit: 50,
        });

        if (cancelled) return;

        dispatch({
          type: "setMessages",
          data: {
            channelId: activeChannelId,
            messages: result.messages,
            hasMore: result.hasMore,
          },
        });

        pinnedToBottom.current = true;
      } catch {
        /* A voice channel, or one the bot can no longer read. The
           channel view handles both on its own. */
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resyncToken]);

  /* ---- Opening a server ---- */
  const openGuild = useCallback(
    async (guildId) => {
      setActiveGuildId(guildId);
      setActiveChannelId(null);
      setReplyingTo(null);
      setEditing(null);
      setMemberCursor(null);
      setMobilePane("channels");

      const result = await view({ guildId, channelId: null });
      if (result?.guild) dispatch({ type: "setGuild", data: result.guild });
      else if (!guildId) dispatch({ type: "setGuild", data: null });
    },
    [view],
  );

  /* ---- Opening a channel ---- */
  /**
   * `known` is passed when the channel was just created and hasn't
   * reached the reducer yet — opening a brand new DM would otherwise
   * find nothing and silently do nothing.
   */
  const openChannel = useCallback(
    async (channelId, known) => {
      const channel =
        known ||
        state.guild?.channels?.find((c) => c.id === channelId) ||
        state.dms.find((c) => c.id === channelId);

      if (!channel) return;

      setActiveChannelId(channelId);
      setReplyingTo(null);
      setEditing(null);
      setMobilePane("chat");
      dispatch({ type: "markRead", data: { channelId } });

      await view({ channelId });

      /* Voice channels have no history, and a forum has posts rather
         than messages — neither should ask Discord for a message page. */
      if (isVoice(channel) || isForum(channel)) return;

      setLoadingChannel(true);

      try {
        const result = await action("channel.fetchMessages", {
          channelId,
          limit: 50,
        });

        dispatch({
          type: "setMessages",
          data: {
            channelId,
            messages: result.messages,
            hasMore: result.hasMore,
          },
        });

        pinnedToBottom.current = true;
      } catch (err) {
        notify.error(err.message);
        dispatch({
          type: "setMessages",
          data: { channelId, messages: [], hasMore: false },
        });
      } finally {
        setLoadingChannel(false);
      }
    },
    [action, view, state.guild, state.dms, notify],
  );

  /* A half-built embed belongs to the channel it was written for, and
     the message box already clears its text and files on the way out. */
  useEffect(() => {
    setDraft({ embeds: [], components: [] });
  }, [activeChannelId]);

  /* Typing indicators expire on their own; Discord sends no "stopped". */
  useEffect(() => {
    if (!activeChannelId) return undefined;

    const timer = setInterval(
      () => dispatch({ type: "typingExpire", data: { channelId: activeChannelId } }),
      3000,
    );

    return () => clearInterval(timer);
  }, [activeChannelId]);

  /* Keep the view pinned to the newest message, the way a chat should. */
  const messages = state.messages[activeChannelId] || [];

  /**
   * Jump to the newest message.
   *
   * The dependency is the messages ARRAY, not its length. Re-opening a
   * channel whose history is already cached re-fetches the same number
   * of messages, so a length-based dependency never changed and this
   * never ran a second time — the effect had already fired while the
   * loading spinner was on screen, leaving the reader at the very top of
   * the channel. Every DM in the sidebar is a channel you have already
   * opened, which is why it showed up there first.
   *
   * `loadingChannel` is in here for the same reason: there is nothing to
   * scroll to until the real content has replaced the spinner.
   */
  useEffect(() => {
    if (loadingChannel || !pinnedToBottom.current) return;

    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, activeChannelId, loadingChannel]);

  /**
   * Stay pinned while the content is still growing.
   *
   * Images, embeds and stickers finish loading after their message has
   * rendered, and each one pushes the last message further down. Without
   * this, opening an image-heavy channel lands you a screen or two above
   * the bottom.
   */
  useEffect(() => {
    const node = scroller.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => {
      if (!pinnedToBottom.current) return;
      node.scrollTop = node.scrollHeight;
    });

    /* Observing the content, not the viewport: the scroller's own box
       never changes size, but what is inside it does. */
    for (const child of node.children) observer.observe(child);

    return () => observer.disconnect();
  }, [activeChannelId, loadingChannel]);

  const activeChannel = useMemo(
    () =>
      state.guild?.channels?.find((c) => c.id === activeChannelId) ||
      state.dms.find((c) => c.id === activeChannelId) ||
      null,
    [state.guild, state.dms, activeChannelId],
  );

  async function loadOlder() {
    if (!activeChannelId || loadingOlder) return;
    if (!state.hasMore[activeChannelId]) return;

    const oldest = messages[0];
    if (!oldest) return;

    setLoadingOlder(true);
    const node = scroller.current;
    const before = node?.scrollHeight || 0;

    try {
      const result = await action("channel.fetchMessages", {
        channelId: activeChannelId,
        before: oldest.id,
        limit: 50,
      });

      dispatch({
        type: "prependMessages",
        data: {
          channelId: activeChannelId,
          messages: result.messages,
          hasMore: result.hasMore,
        },
      });

      /* Hold the reader's place: without this, loading history yanks the
         viewport to the top. */
      requestAnimationFrame(() => {
        if (node) node.scrollTop = node.scrollHeight - before;
      });
    } catch (err) {
      notify.error(err.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  function onScroll() {
    const node = scroller.current;
    if (!node) return;

    pinnedToBottom.current =
      node.scrollHeight - node.scrollTop - node.clientHeight < 120;

    if (node.scrollTop < 200) loadOlder();
  }

  async function loadMoreMembers() {
    if (!state.guild || loadingMembers) return;

    setLoadingMembers(true);

    try {
      const result = await action("guild.fetchMembers", {
        guildId: state.guild.id,
        limit: 200,
        ...(memberCursor ? { after: memberCursor } : {}),
      });

      dispatch({ type: "membersLoaded", data: result });
      setMemberCursor(result.next);
    } catch (err) {
      notify.error(err.message);
      setMemberCursor(null);
    } finally {
      setLoadingMembers(false);
    }
  }

  /* ---- Message actions ---- */

  async function send({ content, files }) {
    try {
      await action("message.send", {
        channelId: activeChannelId,
        content,
        files: files?.length
          ? files
              .filter((file) => !file.error)
              .map((file) => ({
                name: file.name,
                contentType: file.contentType,
                data: file.data,
              }))
          : undefined,
        ...(draft.embeds.length ? { embeds: draft.embeds } : {}),
        ...(draft.components.length ? { components: draft.components } : {}),
        ...(replyingTo ? { replyTo: replyingTo.id } : {}),
      });

      files?.forEach((file) => file.preview && URL.revokeObjectURL(file.preview));
      setReplyingTo(null);
      setDraft({ embeds: [], components: [] });
      pinnedToBottom.current = true;
    } catch (err) {
      notify.error(err.message);
      throw err;
    }
  }

  async function saveEdit(content) {
    try {
      await action("message.edit", {
        channelId: editing.channelId,
        messageId: editing.id,
        content,
      });

      setEditing(null);
    } catch (err) {
      notify.error(err.message);
      throw err;
    }
  }

  async function deleteMessage(message) {
    const confirmed = await Swal.fire({
      ...modalColors,
      icon: "warning",
      title: "Delete this message?",
      text: "This can't be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirmed.isConfirmed) return;

    try {
      await action("message.delete", {
        channelId: message.channelId,
        messageId: message.id,
      });
    } catch (err) {
      notify.error(err.message);
    }
  }

  async function react(message, emoji) {
    if (!emoji) return setReactionTarget(message);

    try {
      await action("message.react", {
        channelId: message.channelId,
        messageId: message.id,
        emoji: emoji.id ? { id: emoji.id, name: emoji.name } : emoji.name,
      });
    } catch (err) {
      notify.error(err.message);
    }
  }

  async function removeReaction(message, emoji) {
    try {
      await action("message.unreact", {
        channelId: message.channelId,
        messageId: message.id,
        emoji: emoji.id ? { id: emoji.id, name: emoji.name } : emoji.name,
      });
    } catch (err) {
      notify.error(err.message);
    }
  }

  async function togglePin(message) {
    try {
      await action(message.pinned ? "message.unpin" : "message.pin", {
        channelId: message.channelId,
        messageId: message.id,
      });
      notify.success(message.pinned ? "Message unpinned." : "Message pinned.");
    } catch (err) {
      notify.error(err.message);
    }
  }

  async function startThread(message) {
    const result = await Swal.fire({
      ...modalColors,
      title: "Start a thread",
      input: "text",
      inputPlaceholder: "Thread name",
      showCancelButton: true,
      confirmButtonText: "Create",
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      const created = await action("message.startThread", {
        channelId: message.channelId,
        messageId: message.id,
        name: result.value,
      });

      notify.success("Thread created.");
      openChannel(created.thread.id);
    } catch (err) {
      notify.error(err.message);
    }
  }

  async function openMember(userId) {
    if (!userId) return;

    /* In a DM there is no server, so there is no member — the profile
       falls back to the plain Discord user. Same click, honest result. */
    if (!state.guild) {
      try {
        const result = await action("user.fetch", { userId });
        setPanel({ kind: "user", user: result.user });
      } catch (err) {
        notify.error(err.message);
      }
      return;
    }

    const cached = state.guild.members?.find((m) => m.user?.id === userId);
    if (cached) return setPanel({ kind: "member", member: cached });

    try {
      const result = await action("member.fetch", {
        guildId: state.guild.id,
        userId,
      });

      dispatch({
        type: "memberUpdate",
        data: { guildId: state.guild.id, member: result.member },
      });
      setPanel({ kind: "member", member: result.member });
    } catch (err) {
      /* Not in this server — still a real person worth showing. */
      try {
        const result = await action("user.fetch", { userId });
        setPanel({ kind: "user", user: result.user });
      } catch {
        notify.error(err.message);
      }
    }
  }

  /** Opens a DM as the bot and jumps straight into the conversation. */
  async function openDirectMessage(userId) {
    const result = await action("dm.open", { userId });
    const channel = result.channel;

    dispatch({ type: "channelCreate", data: { channel } });
    setActiveGuildId(null);
    dispatch({ type: "setGuild", data: null });
    setPanel(null);

    await view({ guildId: null });
    /* The channel is passed through because the reducer hasn't applied
       the dispatch above yet. */
    await openChannel(channel.id, channel);

    notify.success("Opened a DM as the bot.");
    return channel;
  }

  /* ---- Connection states ---- */

  if (status === "error")
    return (
      <ControlShell>
        <div className="dc-fullscreen-state">
          <i className="fa-solid fa-plug-circle-xmark"></i>
          <h2>Control couldn't start</h2>
          <p>{error || "Something went wrong opening this bot."}</p>
          <div className="dc-state-buttons">
            {!fatal && (
              <button className="dc-primary" onClick={retry}>
                <i className="fa-solid fa-rotate-right"></i> Try again
              </button>
            )}
            <Link to="/control">
              <button>
                <i className="fa-solid fa-arrow-left"></i> Back to Control
              </button>
            </Link>
          </div>
        </div>
      </ControlShell>
    );

  if (!session || status === "connecting")
    return (
      <ControlShell>
        <div className="dc-fullscreen-state">
          <LoadingAnim />
          <h2>Connecting your bot to Discord…</h2>
          <p>
            DisFuse is opening a gateway connection for this bot. This usually
            takes a couple of seconds.
          </p>
        </div>
      </ControlShell>
    );

  const canSend =
    activeChannel &&
    canSendIn(activeChannel) &&
    (activeChannel.permissionNames === null ||
      botCan(
        activeChannel,
        isThread(activeChannel) ? "SendMessagesInThreads" : "SendMessages",
      ));

  const typingNames = Object.values(state.typing[activeChannelId] || {})
    .filter((entry) => Date.now() - entry.at < 9000)
    .map((entry) => entry.name);

  const dmUnread = state.dms.reduce(
    (total, channel) => total + (state.unread[channel.id] || 0),
    0,
  );

  return (
    <ControlShell
      session={session}
      status={status}
      onBack={() => setMobilePane("channels")}
      mobilePane={mobilePane}
    >
      <Helmet>
        <title>{session.bot?.username || "Control"} | Control | DisFuse</title>
      </Helmet>

      {status === "reconnecting" && (
        <div className="dc-reconnect-banner">
          <i className="fa-solid fa-circle-notch fa-spin"></i> Reconnecting to
          DisFuse…
        </div>
      )}

      <div className={`dc-client pane-${mobilePane}`}>
        <GuildRail
          guilds={state.guilds}
          activeGuildId={activeGuildId}
          onSelectGuild={openGuild}
          onSelectHome={() => openGuild(null)}
          unreadByGuild={state.guildMentions}
          dmUnread={dmUnread}
          botUser={session.bot}
          onOpenBotSettings={() => setPanel({ kind: "bot" })}
        />

        <ChannelSidebar
          guild={activeGuildId ? state.guild : null}
          dms={state.dms}
          activeChannelId={activeChannelId}
          onSelectChannel={openChannel}
          onOpenGuildSettings={() => setPanel({ kind: "server" })}
          onCreateChannel={(parentId) =>
            setPanel({ kind: "channel", parentId })
          }
          unread={state.unread}
          mentions={state.mentions}
          voiceStates={state.guild?.voiceStates}
          connecting={activeGuildId && !state.guild}
        />

        <main className="dc-main">
          {activeChannel ? (
            <>
              <header className="dc-channel-header">
                <button
                  className="dc-mobile-back"
                  onClick={() => setMobilePane("channels")}
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <i className={channelIcon(activeChannel)}></i>
                <h2>{channelLabel(activeChannel)}</h2>
                {activeChannel.topic && (
                  <>
                    <span className="dc-header-divider" />
                    <p className="dc-channel-topic">{activeChannel.topic}</p>
                  </>
                )}
                <div className="dc-header-actions">
                  {!isVoice(activeChannel) && !isForum(activeChannel) && (
                    <button
                      title="Pinned messages"
                      onClick={() => setPanel({ kind: "pins" })}
                    >
                      <i className="fa-solid fa-thumbtack"></i>
                    </button>
                  )}
                  {botCan(activeChannel, "ManageChannels") &&
                    activeChannel.guildId && (
                      <button
                        title="Edit channel"
                        onClick={() =>
                          setPanel({ kind: "channel", channel: activeChannel })
                        }
                      >
                        <i className="fa-solid fa-gear"></i>
                      </button>
                    )}
                  {state.guild && (
                    <button
                      className={`dc-members-toggle${membersOpen ? " active" : ""}`}
                      title={membersOpen ? "Hide members" : "Show members"}
                      onClick={() => {
                        /* Narrow screens swap panes; wide ones show and
                           hide the column in place, as Discord does. */
                        if (window.innerWidth <= 1100) {
                          setMobilePane((pane) =>
                            pane === "members" ? "chat" : "members",
                          );
                        } else {
                          setMembersOpen((open) => !open);
                        }
                      }}
                    >
                      <i className="fa-solid fa-users"></i>
                    </button>
                  )}
                </div>
              </header>

              {isForum(activeChannel) ? (
                <ForumView
                  channel={activeChannel}
                  guild={state.guild}
                  action={action}
                  notify={notify}
                  botId={session.bot?.id}
                  onOpenPost={(threadId) => openChannel(threadId)}
                />
              ) : isVoice(activeChannel) ? (
                <VoiceChannelView
                  channel={activeChannel}
                  guild={state.guild}
                  onOpenMember={openMember}
                />
              ) : (
                <>
                  <div
                    className="dc-messages"
                    ref={scroller}
                    onScroll={onScroll}
                  >
                    {loadingChannel ? (
                      <div className="dc-messages-loading">
                        <LoadingAnim onlySpinner />
                      </div>
                    ) : (
                      <>
                        {state.hasMore[activeChannelId] ? (
                          <button
                            className="dc-load-older"
                            onClick={loadOlder}
                            disabled={loadingOlder}
                          >
                            {loadingOlder ? "Loading…" : "Load older messages"}
                          </button>
                        ) : (
                          <ChannelIntro channel={activeChannel} />
                        )}

                        {messages.map((message, index) => {
                          const previous = messages[index - 1];
                          const newDay =
                            !previous ||
                            new Date(previous.timestamp).toDateString() !==
                              new Date(message.timestamp).toDateString();

                          return (
                            <div key={message.id}>
                              {newDay && (
                                <div className="dc-day-divider">
                                  <span>
                                    {formatDayDivider(message.timestamp)}
                                  </span>
                                </div>
                              )}
                              <Message
                                message={message}
                                grouped={!newDay && groupsWith(previous, message)}
                                guild={state.guild}
                                channel={activeChannel}
                                channels={state.guild?.channels}
                                botId={session.bot?.id}
                                onReply={setReplyingTo}
                                onEdit={setEditing}
                                onDelete={deleteMessage}
                                onReact={react}
                                onRemoveReaction={removeReaction}
                                onPin={togglePin}
                                onStartThread={startThread}
                                onOpenUser={openMember}
                                onJumpToChannel={openChannel}
                                highlighted={editing?.id === message.id}
                              />
                            </div>
                          );
                        })}

                        {!messages.length && (
                          <div className="dc-empty-channel">
                            <i className="fa-solid fa-comment-slash"></i>
                            <p>
                              {botCan(activeChannel, "ReadMessageHistory")
                                ? "No messages here yet."
                                : "The bot doesn't have Read Message History in this channel, so it can't load anything that was sent before now."}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {typingNames.length > 0 && (
                    <div className="dc-typing">
                      <span className="dc-typing-dots">
                        <i />
                        <i />
                        <i />
                      </span>
                      {typingNames.slice(0, 3).join(", ")}{" "}
                      {typingNames.length === 1 ? "is" : "are"} typing…
                    </div>
                  )}

                  <MessageComposer
                    channel={activeChannel}
                    guild={state.guild}
                    disabled={!canSend || status !== "ready"}
                    disabledReason={
                      status !== "ready"
                        ? "Waiting for the bot's Discord connection…"
                        : activeChannel.threadMetadata?.archived
                          ? "This thread is archived."
                          : undefined
                    }
                    replyingTo={replyingTo}
                    editing={editing}
                    onCancelReply={() => setReplyingTo(null)}
                    onCancelEdit={() => setEditing(null)}
                    onSend={send}
                    onEditSave={saveEdit}
                    onTyping={() =>
                      action("channel.typing", {
                        channelId: activeChannelId,
                      }).catch(() => {})
                    }
                    limits={session.limits}
                    onCompose={(mode) =>
                      setPanel({
                        kind: "rich",
                        mode,
                        /* A fresh embed lands at the end of whatever is
                           already attached, rather than replacing it. */
                        ...(mode === "embed"
                          ? { editIndex: draft.embeds.length }
                          : {}),
                      })
                    }
                    draft={draft}
                    onEditDraft={(kind, index) =>
                      setPanel({
                        kind: "rich",
                        mode: kind === "embed" ? "embed" : "components",
                        ...(kind === "embed" ? { editIndex: index } : {}),
                      })
                    }
                    onRemoveDraft={(kind, index) =>
                      setDraft((current) =>
                        kind === "embed"
                          ? {
                              ...current,
                              embeds: current.embeds.filter(
                                (_, i) => i !== index,
                              ),
                            }
                          : { ...current, components: [] },
                      )
                    }
                  />
                </>
              )}
            </>
          ) : (
            <WelcomeView session={session} guild={state.guild} />
          )}
        </main>

        {state.guild && activeChannel && membersOpen && (
          <MemberList
            guild={state.guild}
            privileged={session.privileged}
            onOpenMember={openMember}
            onLoadMore={loadMoreMembers}
            loadingMore={loadingMembers}
            hasMore={
              typeof state.guild.memberCount === "number" &&
              (state.guild.members?.length || 0) < state.guild.memberCount
            }
          />
        )}
      </div>

      {/* ---- Panels ---- */}
      {panel?.kind === "member" && (
        <MemberPanel
          member={panel.member}
          guild={state.guild}
          session={session}
          action={action}
          notify={notify}
          onClose={() => setPanel(null)}
          onOpenDm={openDirectMessage}
        />
      )}

      {panel?.kind === "server" && state.guild && (
        <ServerPanel
          guild={state.guild}
          action={action}
          notify={notify}
          onClose={() => setPanel(null)}
        />
      )}

      {panel?.kind === "channel" && state.guild && (
        <ChannelPanel
          guild={state.guild}
          channel={panel.channel}
          parentId={panel.parentId}
          action={action}
          notify={notify}
          onClose={() => setPanel(null)}
          onDone={(channel) => channel && openChannel(channel.id)}
        />
      )}

      {panel?.kind === "pins" && activeChannel && (
        <PinnedPanel
          channel={activeChannel}
          guild={state.guild}
          action={action}
          notify={notify}
          onClose={() => setPanel(null)}
          onJump={(message) => {
            setPanel(null);
            const node = document.getElementById(`msg-${message.id}`);
            if (node) {
              node.scrollIntoView({ block: "center", behavior: "smooth" });
              node.classList.add("flash");
              setTimeout(() => node.classList.remove("flash"), 1600);
            } else {
              notify.info("That message isn't in the loaded history.");
            }
          }}
        />
      )}

      {panel?.kind === "user" && (
        <UserPanel
          user={panel.user}
          onClose={() => setPanel(null)}
          onOpenDm={
            panel.user?.bot
              ? null
              : async () => {
                  try {
                    await openDirectMessage(panel.user.id);
                  } catch (err) {
                    notify.error(err.message);
                  }
                }
          }
        />
      )}

      {panel?.kind === "rich" && activeChannel && (
        <RichSendPanel
          mode={panel.mode}
          editIndex={panel.editIndex}
          channel={activeChannel}
          guild={state.guild}
          draft={draft}
          onClose={() => setPanel(null)}
          onAttach={(kind, value, index) =>
            setDraft((current) => {
              if (kind === "components")
                return { ...current, components: value };

              const embeds = [...current.embeds];
              /* `index` is the slot the dialog was opened on — the end of
                 the list for a new embed, an existing one when editing. */
              embeds[typeof index === "number" ? index : embeds.length] = value;
              return { ...current, embeds: embeds.slice(0, 10) };
            })
          }
          onSend={async (payload) => {
            try {
              await action("message.send", {
                channelId: activeChannelId,
                ...payload,
              });
              pinnedToBottom.current = true;
            } catch (err) {
              notify.error(err.message);
              throw err;
            }
          }}
        />
      )}

      {panel?.kind === "bot" && (
        <BotPanel
          session={session}
          guild={state.guild}
          action={action}
          notify={notify}
          onClose={() => setPanel(null)}
        />
      )}

      {reactionTarget && (
        <ReactionPicker
          guild={state.guild}
          onClose={() => setReactionTarget(null)}
          onPick={(emoji) => {
            react(reactionTarget, emoji);
            setReactionTarget(null);
          }}
        />
      )}

      <div className="dc-toasts">
        {toasts.map((toast) => (
          <div className={`dc-toast ${toast.tone}`} key={toast.id}>
            <i
              className={`fa-solid ${
                toast.tone === "error"
                  ? "fa-circle-exclamation"
                  : toast.tone === "success"
                    ? "fa-circle-check"
                    : "fa-circle-info"
              }`}
            ></i>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </ControlShell>
  );
}

/* ---- Layout shell -------------------------------------------------------- */

function ControlShell({ children, session, status }) {
  return (
    <div className="df-control-client">
      <header className="dc-topbar">
        <Link to="/control" className="dc-topbar-back">
          <i className="fa-solid fa-arrow-left"></i>
          <span>Control</span>
        </Link>

        {session && (
          <div className="dc-topbar-bot">
            <span className={`dc-conn dc-conn-${status}`} />
            <strong>{session.bot?.username || session.projectName}</strong>
            <span className="dc-topbar-note">
              acting as this bot · {session.guildCount ?? 0} servers
            </span>
          </div>
        )}

        <a
          className="dc-topbar-hint"
          href="https://discord.com/developers/applications"
          target="_blank"
          rel="noreferrer noopener"
        >
          <i className="fa-solid fa-circle-question"></i>
          <span>Intents &amp; permissions</span>
        </a>
      </header>

      {children}
    </div>
  );
}

function ChannelIntro({ channel }) {
  /* A DM has no `name` — it is titled by whoever is in it, which is what
     `channelLabel` resolves. Without this the heading read "Welcome to
     #" with nothing after it. */
  const dm = !channel.guildId;
  const label = channelLabel(channel);

  return (
    <div className="dc-channel-intro">
      <div className="dc-intro-icon">
        <i className={channelIcon(channel)}></i>
      </div>
      <h1>
        {dm ? label : `Welcome to #${label}`}
      </h1>
      <p>
        {dm ? (
          <>
            This is the start of the bot's direct message history with{" "}
            <strong>{label}</strong>.
          </>
        ) : (
          <>
            This is the start of the <strong>#{label}</strong> channel.
            {channel.topic ? ` ${channel.topic}` : ""}
          </>
        )}
      </p>
    </div>
  );
}

function WelcomeView({ session, guild }) {
  return (
    <div className="dc-welcome">
      <i className="fa-solid fa-satellite-dish"></i>
      <h2>
        {guild ? `Pick a channel in ${guild.name}` : "Pick a server to start"}
      </h2>
      <p>
        You're controlling <strong>{session.bot?.username}</strong>. Everything
        you do here is performed by that bot through Discord's API, so it can
        only do what a bot is allowed to do, with the permissions it has.
      </p>

      {!session.privileged?.messageContent && (
        <div className="dc-welcome-note">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>
            <strong>Message Content Intent</strong> is off for this bot. Discord
            will hide the text of most messages until you switch it on in the
            developer portal.
          </span>
        </div>
      )}
    </div>
  );
}

function VoiceChannelView({ channel, guild, onOpenMember }) {
  const connected = (guild?.voiceStates || []).filter(
    (state) => state.channelId === channel.id,
  );

  return (
    <div className="dc-voice-view">
      <div className="dc-voice-head">
        <i className="fa-solid fa-volume-high"></i>
        <h2>{channel.name}</h2>
      </div>

      <p className="dc-muted">
        A Discord bot can only join a voice channel to stream audio, which
        Control doesn't do, so there's nothing to connect to here. It can still
        see who's in the call, move them, mute them and manage the channel.
      </p>

      {connected.length ? (
        <div className="dc-voice-grid">
          {connected.map((state) => {
            const member = guild?.members?.find(
              (m) => m.user?.id === state.userId,
            );

            return (
              <button
                className="dc-voice-tile"
                key={state.userId}
                onClick={() => onOpenMember?.(state.userId)}
              >
                <img
                  src={`https://cdn.discordapp.com/avatars/${state.userId}/${member?.user?.avatar}.png?size=128`}
                  onError={(event) => {
                    event.currentTarget.src =
                      "https://cdn.discordapp.com/embed/avatars/0.png";
                  }}
                  alt=""
                />
                <span>
                  {member?.nick ||
                    member?.user?.globalName ||
                    member?.user?.username ||
                    state.userId}
                </span>
                <span className="dc-voice-flags">
                  {(state.selfMute || state.mute) && (
                    <i className="fa-solid fa-microphone-slash"></i>
                  )}
                  {(state.selfDeaf || state.deaf) && (
                    <i className="fa-solid fa-headphones-simple"></i>
                  )}
                  {state.selfVideo && <i className="fa-solid fa-video"></i>}
                  {state.selfStream && <i className="fa-solid fa-desktop"></i>}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="dc-empty-channel">
          <i className="fa-solid fa-volume-xmark"></i>
          <p>Nobody is in this voice channel.</p>
        </div>
      )}
    </div>
  );
}

function ReactionPicker({ guild, onPick, onClose }) {
  const emojis = (guild?.emojis || []).filter((emoji) => emoji.available);

  return (
    <div className="dc-modal-backdrop" onClick={onClose}>
      <div
        className="dc-reaction-picker"
        onClick={(event) => event.stopPropagation()}
      >
        <h5>React as the bot</h5>

        <div className="dc-emoji-grid">
          {REACTION_SUGGESTIONS.map((emoji) => (
            <button key={emoji} onClick={() => onPick({ name: emoji })}>
              {emoji}
            </button>
          ))}
        </div>

        {emojis.length > 0 && (
          <>
            <h5>{guild.name}</h5>
            <div className="dc-emoji-grid">
              {emojis.slice(0, 100).map((emoji) => (
                <button
                  key={emoji.id}
                  title={`:${emoji.name}:`}
                  onClick={() => onPick({ id: emoji.id, name: emoji.name })}
                >
                  <img
                    src={emojiUrl(emoji.id, emoji.animated, 32)}
                    alt={emoji.name}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
