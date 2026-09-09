import { useCallback, useEffect, useState } from "react";

import ControlModal from "./ControlModal";
import LoadingAnim from "../LoadingAnim";
import MessageContent from "./MessageContent";
import { previewText } from "./MessageComponents";
import {
  avatarUrl,
  botCan,
  formatMessageDate,
  memberColor,
} from "./discordUtils";

/**
 * A channel's pinned messages.
 *
 * Discord puts these behind the pin in the channel header, and so does
 * this. Unpinning needs Manage Messages, so the button only appears when
 * the bot has it — and the API refuses it either way.
 */
export default function PinnedPanel({
  channel,
  guild,
  action,
  notify,
  onClose,
  onJump,
}) {
  const [state, setState] = useState({ loading: true, messages: [], error: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));

    action("channel.fetchPins", { channelId: channel.id })
      .then((result) =>
        setState({ loading: false, messages: result.messages || [], error: null }),
      )
      .catch((err) =>
        setState({ loading: false, messages: [], error: err.message }),
      );
  }, [action, channel.id]);

  useEffect(() => {
    load();
  }, [load]);

  const canUnpin = botCan(channel, "ManageMessages");

  return (
    <ControlModal
      title="Pinned messages"
      icon="fa-solid fa-thumbtack"
      subtitle={channel.name ? `#${channel.name}` : undefined}
      onClose={onClose}
    >
      {state.loading ? (
        <div className="dc-tab-loading">
          <LoadingAnim onlySpinner />
        </div>
      ) : state.error ? (
        <div className="dc-tab-error">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <p>{state.error}</p>
          <button onClick={load}>
            <i className="fa-solid fa-rotate-right"></i> Try again
          </button>
        </div>
      ) : state.messages.length ? (
        <div className="dc-pin-list">
          {state.messages.map((message) => {
            const member = guild?.members?.find(
              (m) => m.user?.id === message.author?.id,
            );
            const colour = memberColor(member, guild?.roles);

            return (
              <div className="dc-pin-item" key={message.id}>
                <img src={avatarUrl(message.author, 48)} alt="" loading="lazy" />
                <div className="dc-pin-body">
                  <div className="dc-pin-head">
                    <span style={colour ? { color: colour } : undefined}>
                      {member?.nick ||
                        message.author?.globalName ||
                        message.author?.username}
                    </span>
                    <time>{formatMessageDate(message.timestamp)}</time>
                  </div>
                  <div className="dc-pin-text">
                    {previewText(message) ? (
                      <MessageContent
                        content={previewText(message)}
                        guild={guild}
                      />
                    ) : (
                      <em>No text content</em>
                    )}
                  </div>
                </div>
                <div className="dc-pin-actions">
                  <button title="Jump to message" onClick={() => onJump(message)}>
                    <i className="fa-solid fa-arrow-right-to-bracket"></i>
                  </button>
                  {canUnpin && (
                    <button
                      title="Unpin"
                      onClick={async () => {
                        try {
                          await action("message.unpin", {
                            channelId: channel.id,
                            messageId: message.id,
                          });
                          notify.success("Message unpinned.");
                          load();
                        } catch (err) {
                          notify.error(err.message);
                        }
                      }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dc-tab-empty">
          <i className="fa-solid fa-thumbtack"></i>
          <p>
            Nothing is pinned in this channel yet. Pin a message from its
            &ldquo;more&rdquo; menu.
          </p>
        </div>
      )}
    </ControlModal>
  );
}
