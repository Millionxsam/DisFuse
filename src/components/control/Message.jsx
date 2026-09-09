import { useRef, useState } from "react";

import MessageContent from "./MessageContent";
import MessageComponents, {
  previewText,
  usesComponentsV2,
} from "./MessageComponents";
import {
  avatarUrl,
  botCan,
  formatBytes,
  formatMessageDate,
  formatTime,
  isSystemMessage,
  memberAvatarUrl,
  memberColor,
  SYSTEM_MESSAGE_TEXT,
} from "./discordUtils";

/* =====================================================================
   One message
   ---------------------------------------------------------------------
   Laid out the way Discord lays a message out: consecutive messages from
   the same person within a few minutes collapse into one block with a
   single avatar, and the hover toolbar carries the actions the BOT can
   actually perform in this channel.

   Every action here is a request to the DisFuse API, which performs it
   as the bot. Buttons the bot lacks permission for aren't rendered —
   `botCan` reads the permission list the backend computed, so the UI can
   never claim the bot may do something the API would refuse.
   ===================================================================== */

const IMAGE_TYPES = /^image\/(png|jpe?g|gif|webp|avif|bmp)$/i;
const VIDEO_TYPES = /^video\/(mp4|webm|quicktime)$/i;
const AUDIO_TYPES = /^audio\//i;

export default function Message({
  message,
  grouped,
  guild,
  channel,
  channels,
  botId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  onPin,
  onStartThread,
  onOpenUser,
  onJumpToChannel,
  highlighted,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  /* A menu opened near the bottom of the viewport used to render past
     the edge with its last items unreachable. */
  const [menuUp, setMenuUp] = useState(false);
  const moreRef = useRef(null);

  const author = message.author;

  /* The guild member is the richer object (nickname, per-server avatar,
     live roles). MESSAGE_CREATE carries a partial member with no `user`
     on it, so the author is grafted back on before it's used — otherwise
     the per-server avatar lookup has no ID to work with. */
  const member =
    guild?.members?.find((m) => m.user?.id === author?.id) ||
    (message.member ? { ...message.member, user: author } : null);

  const colour = memberColor(member, guild?.roles);

  /* A Components V2 message has no `content` and no `embeds` at all —
     the whole body lives in `components`. Rendering the old fields would
     show an empty message, which is exactly what used to happen. */
  const v2 = usesComponentsV2(message);

  const own = author?.id === botId;
  const canManage = botCan(channel, "ManageMessages");
  const canReact = botCan(channel, "AddReactions");
  const canSend = botCan(channel, "SendMessages");

  if (isSystemMessage(message))
    return (
      <div className="dc-system-message">
        <i className="fa-solid fa-arrow-right-to-bracket"></i>
        <span>
          <strong>{author?.globalName || author?.username || "Someone"}</strong>{" "}
          {SYSTEM_MESSAGE_TEXT[message.type]}
        </span>
        <time>{formatTime(message.timestamp)}</time>
      </div>
    );

  return (
    <div
      className={`dc-message${grouped ? " grouped" : ""}${
        highlighted ? " highlighted" : ""
      }${message.pinned ? " pinned" : ""}`}
      id={`msg-${message.id}`}
    >
      {message.interaction && (
        <InteractionHeader
          interaction={message.interaction}
          guild={guild}
          onOpenUser={onOpenUser}
        />
      )}

      {message.messageReference?.type !== 1 && message.messageReference && (
        <ReplyPreview
          reference={message.referencedMessage}
          guild={guild}
          onOpenUser={onOpenUser}
        />
      )}

      <div className="dc-message-body">
        <div className="dc-message-gutter">
          {grouped ? (
            <time className="dc-hover-time">{formatTime(message.timestamp)}</time>
          ) : (
            <img
              className="dc-avatar"
              src={
                member
                  ? memberAvatarUrl(member, guild?.id, 80)
                  : avatarUrl(author, 80)
              }
              alt=""
              loading="lazy"
              onClick={() => onOpenUser?.(author?.id)}
            />
          )}
        </div>

        <div className="dc-message-main">
          {!grouped && (
            <div className="dc-message-head">
              <span
                className="dc-author"
                style={colour ? { color: colour } : undefined}
                onClick={() => onOpenUser?.(author?.id)}
              >
                {member?.nick || author?.globalName || author?.username}
              </span>
              {author?.bot && (
                <span className="dc-bot-tag">
                  {/* Every interaction response carries a webhook_id, so
                      that alone doesn't make it a webhook post — Discord
                      labels those APP too. */}
                  {message.webhookId && !message.interaction ? "WEBHOOK" : "APP"}
                </span>
              )}
              <time title={new Date(message.timestamp).toString()}>
                {formatMessageDate(message.timestamp)}
              </time>
              {message.pinned && (
                <span className="dc-pin-flag" title="Pinned">
                  <i className="fa-solid fa-thumbtack"></i>
                </span>
              )}
            </div>
          )}

          {message.content && !v2 ? (
            <div className="dc-message-text">
              <MessageContent
                content={message.content}
                guild={guild}
                channels={channels}
                onMention={(kind, id) =>
                  kind === "user" ? onOpenUser?.(id) : onJumpToChannel?.(id)
                }
              />
              {message.editedTimestamp && (
                <span
                  className="dc-edited"
                  title={formatMessageDate(message.editedTimestamp)}
                >
                  (edited)
                </span>
              )}
            </div>
          ) : null}

          {message.attachments?.length > 0 && (
            <div className="dc-attachments">
              {message.attachments.map((attachment) => (
                <Attachment attachment={attachment} key={attachment.id} />
              ))}
            </div>
          )}

          {message.stickerItems?.length > 0 && (
            <div className="dc-stickers">
              {message.stickerItems.map((sticker) => (
                <img
                  key={sticker.id}
                  className="dc-sticker"
                  alt={sticker.name}
                  title={sticker.name}
                  loading="lazy"
                  src={`https://media.discordapp.net/stickers/${sticker.id}.png?size=160`}
                />
              ))}
            </div>
          )}

          {!v2 && message.embeds?.length > 0 && (
            <div className="dc-embeds">
              {message.embeds.slice(0, 10).map((embed, index) => (
                <Embed embed={embed} guild={guild} key={index} />
              ))}
            </div>
          )}

          {message.poll && <Poll poll={message.poll} />}

          {message.messageSnapshots?.length > 0 && (
            <div className="dc-forwards">
              {message.messageSnapshots.map((snapshot, index) => (
                <Forwarded
                  key={index}
                  snapshot={snapshot}
                  guild={guild}
                  channels={channels}
                />
              ))}
            </div>
          )}

          {message.components?.length > 0 && (
            <MessageComponents
              components={message.components}
              message={message}
              guild={guild}
              channels={channels}
              onOpenUser={onOpenUser}
            />
          )}

          {message.thread && (
            <button
              className="dc-thread-chip"
              onClick={() => onJumpToChannel?.(message.thread.id)}
            >
              <i className="fa-solid fa-comment-dots"></i> {message.thread.name}
            </button>
          )}

          {message.reactions?.length > 0 && (
            <div className="dc-reactions">
              {message.reactions.map((reaction) => (
                <ReactionChip
                  key={reaction.emoji.id || reaction.emoji.name}
                  reaction={reaction}
                  disabled={!canReact}
                  onToggle={() =>
                    reaction.me
                      ? onRemoveReaction?.(message, reaction.emoji)
                      : onReact?.(message, reaction.emoji)
                  }
                />
              ))}
              {canReact && (
                <button
                  className="dc-reaction dc-reaction-add"
                  title="Add reaction"
                  onClick={() => onReact?.(message, null)}
                >
                  <i className="fa-regular fa-face-smile"></i>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="dc-message-actions">
          {canReact && (
            <button title="Add reaction" onClick={() => onReact?.(message, null)}>
              <i className="fa-regular fa-face-smile"></i>
            </button>
          )}
          {canSend && (
            <button title="Reply" onClick={() => onReply?.(message)}>
              <i className="fa-solid fa-reply"></i>
            </button>
          )}
          {own && (
            <button title="Edit" onClick={() => onEdit?.(message)}>
              <i className="fa-solid fa-pen"></i>
            </button>
          )}
          <div className="dc-more-wrap" ref={moreRef}>
            <button
              title="More"
              onClick={() => {
                if (!menuOpen) {
                  /* Roughly the tallest the menu gets; measuring it would
                     mean rendering it off-screen first. */
                  const below =
                    window.innerHeight -
                    (moreRef.current?.getBoundingClientRect().bottom || 0);
                  setMenuUp(below < 260);
                }
                setMenuOpen((open) => !open);
              }}
            >
              <i className="fa-solid fa-ellipsis"></i>
            </button>
            {menuOpen && (
              <>
                <div
                  className="dc-menu-backdrop"
                  onClick={() => setMenuOpen(false)}
                />
                <div className={`dc-menu${menuUp ? " up" : ""}`}>
                  {canManage && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onPin?.(message);
                      }}
                    >
                      <i className="fa-solid fa-thumbtack"></i>{" "}
                      {message.pinned ? "Unpin message" : "Pin message"}
                    </button>
                  )}
                  {botCan(channel, "CreatePublicThreads") && !message.thread && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStartThread?.(message);
                      }}
                    >
                      <i className="fa-solid fa-comment-dots"></i> Start thread
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigator.clipboard?.writeText(message.id);
                    }}
                  >
                    <i className="fa-solid fa-copy"></i> Copy message ID
                  </button>
                  {message.guildId && (
                    <a
                      className="dc-menu-link"
                      href={`https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="fa-brands fa-discord"></i> Open in Discord
                    </a>
                  )}
                  {(own || canManage) && (
                    <button
                      className="danger"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete?.(message);
                      }}
                    >
                      <i className="fa-solid fa-trash"></i> Delete message
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Pieces ------------------------------------------------------------- */

function ReplyPreview({ reference, guild, onOpenUser }) {
  if (!reference)
    return (
      <div className="dc-reply-preview missing">
        <i className="fa-solid fa-reply"></i>
        <span className="dc-reply-text">
          Original message was deleted or isn't loaded
        </span>
      </div>
    );

  const member = guild?.members?.find(
    (m) => m.user?.id === reference.author?.id,
  );
  const colour = memberColor(member, guild?.roles);

  return (
    <div className="dc-reply-preview">
      <i className="fa-solid fa-reply"></i>
      <img
        className="dc-reply-avatar"
        src={avatarUrl(reference.author, 32)}
        alt=""
        loading="lazy"
      />
      <span
        className="dc-reply-author"
        style={colour ? { color: colour } : undefined}
        onClick={() => onOpenUser?.(reference.author?.id)}
      >
        {member?.nick ||
          reference.author?.globalName ||
          reference.author?.username}
      </span>
      <span className="dc-reply-text">
        {previewText(reference) || "Message has no text"}
      </span>
    </div>
  );
}

function Attachment({ attachment }) {
  const type = attachment.contentType || "";

  if (IMAGE_TYPES.test(type))
    return (
      <a
        className="dc-attachment-image"
        href={attachment.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        <img
          src={attachment.url}
          alt={attachment.description || attachment.filename}
          loading="lazy"
          style={
            attachment.width && attachment.height
              ? { aspectRatio: `${attachment.width} / ${attachment.height}` }
              : undefined
          }
        />
      </a>
    );

  if (VIDEO_TYPES.test(type))
    return (
      <video className="dc-attachment-video" controls preload="metadata">
        <source src={attachment.url} type={type} />
      </video>
    );

  if (AUDIO_TYPES.test(type))
    return (
      <div className="dc-attachment-file">
        <i className="fa-solid fa-file-audio"></i>
        <div>
          <span className="name">{attachment.filename}</span>
          <audio controls preload="none" src={attachment.url} />
        </div>
      </div>
    );

  return (
    <a
      className="dc-attachment-file"
      href={attachment.url}
      target="_blank"
      rel="noreferrer noopener"
    >
      <i className="fa-solid fa-file-arrow-down"></i>
      <div>
        <span className="name">{attachment.filename}</span>
        <span className="size">{formatBytes(attachment.size)}</span>
      </div>
    </a>
  );
}

function Embed({ embed }) {
  const colour =
    typeof embed.color === "number"
      ? `#${embed.color.toString(16).padStart(6, "0")}`
      : "var(--dc-border)";

  return (
    <div className="dc-embed" style={{ borderLeftColor: colour }}>
      {embed.author?.name && (
        <div className="dc-embed-author">
          {embed.author.icon_url && (
            <img src={embed.author.icon_url} alt="" loading="lazy" />
          )}
          {embed.author.url ? (
            <a href={embed.author.url} target="_blank" rel="noreferrer noopener">
              {embed.author.name}
            </a>
          ) : (
            <span>{embed.author.name}</span>
          )}
        </div>
      )}

      {embed.title && (
        <div className="dc-embed-title">
          {embed.url ? (
            <a href={embed.url} target="_blank" rel="noreferrer noopener">
              {embed.title}
            </a>
          ) : (
            embed.title
          )}
        </div>
      )}

      {embed.description && (
        <div className="dc-embed-description">
          <MessageContent content={embed.description} />
        </div>
      )}

      {embed.fields?.length > 0 && (
        <div className="dc-embed-fields">
          {embed.fields.slice(0, 25).map((field, index) => (
            <div
              className={`dc-embed-field${field.inline ? " inline" : ""}`}
              key={index}
            >
              <div className="name">{field.name}</div>
              <div className="value">
                <MessageContent content={field.value} />
              </div>
            </div>
          ))}
        </div>
      )}

      {embed.image?.url && (
        <a
          className="dc-embed-image"
          href={embed.image.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          <img src={embed.image.url} alt="" loading="lazy" />
        </a>
      )}

      {embed.thumbnail?.url && !embed.image?.url && (
        <img
          className="dc-embed-thumb"
          src={embed.thumbnail.url}
          alt=""
          loading="lazy"
        />
      )}

      {(embed.footer?.text || embed.timestamp) && (
        <div className="dc-embed-footer">
          {embed.footer?.icon_url && (
            <img src={embed.footer.icon_url} alt="" loading="lazy" />
          )}
          <span>
            {embed.footer?.text}
            {embed.footer?.text && embed.timestamp ? " • " : ""}
            {embed.timestamp
              ? new Date(embed.timestamp).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function Poll({ poll }) {
  const total =
    poll.results?.answer_counts?.reduce((sum, a) => sum + (a.count || 0), 0) || 0;

  return (
    <div className="dc-poll">
      <div className="dc-poll-question">
        <i className="fa-solid fa-square-poll-vertical"></i>{" "}
        {poll.question?.text || "Poll"}
      </div>
      {(poll.answers || []).map((answer) => {
        const count =
          poll.results?.answer_counts?.find(
            (a) => a.answer_id === answer.answer_id,
          )?.count || 0;
        const percent = total ? Math.round((count / total) * 100) : 0;

        return (
          <div className="dc-poll-answer" key={answer.answer_id}>
            <div className="dc-poll-bar" style={{ width: `${percent}%` }} />
            <span className="dc-poll-text">
              {answer.poll_media?.text || "Option"}
            </span>
            <span className="dc-poll-count">
              {count} · {percent}%
            </span>
          </div>
        );
      })}
      <div className="dc-poll-total">
        {total} vote{total === 1 ? "" : "s"}
        {poll.results?.is_finalized ? " · final" : ""}
      </div>
    </div>
  );
}

/**
 * "@someone used /command", the way Discord labels an interaction
 * response. These messages are type 20 or 23 and carry no reply
 * reference, so without this they looked like a bot talking to nobody.
 */
function InteractionHeader({ interaction, guild, onOpenUser }) {
  const user = interaction.user;
  const member = guild?.members?.find((m) => m.user?.id === user?.id);
  const colour = memberColor(member, guild?.roles);

  /* type 2 is an application command; 3 is a component, 5 a modal. */
  const verb = interaction.type === 2 ? "used" : "interacted with";
  const prefix = interaction.commandType === 1 || interaction.type === 2 ? "/" : "";

  return (
    <div className="dc-interaction-header">
      <img src={avatarUrl(user, 32)} alt="" loading="lazy" />
      <span
        className="dc-interaction-user"
        style={colour ? { color: colour } : undefined}
        onClick={() => onOpenUser?.(user?.id)}
      >
        {member?.nick || user?.globalName || user?.username || "Someone"}
      </span>
      <span className="dc-interaction-text">
        {verb}{" "}
        {interaction.name ? (
          <strong>
            {prefix}
            {interaction.name}
          </strong>
        ) : (
          "a command"
        )}
      </span>
    </div>
  );
}

/** A forwarded message: its content lives in a snapshot, not here. */
function Forwarded({ snapshot, guild, channels }) {
  return (
    <div className="dc-forward">
      <div className="dc-forward-label">
        <i className="fa-solid fa-share"></i> Forwarded
      </div>
      {snapshot.content && (
        <div className="dc-message-text">
          <MessageContent
            content={snapshot.content}
            guild={guild}
            channels={channels}
          />
        </div>
      )}
      {snapshot.attachments?.length > 0 && (
        <div className="dc-attachments">
          {snapshot.attachments.map((attachment) => (
            <Attachment attachment={attachment} key={attachment.id} />
          ))}
        </div>
      )}
      {snapshot.embeds?.length > 0 && (
        <div className="dc-embeds">
          {snapshot.embeds.slice(0, 4).map((embed, index) => (
            <Embed embed={embed} key={index} />
          ))}
        </div>
      )}
      {snapshot.components?.length > 0 && (
        <MessageComponents
          components={snapshot.components}
          message={snapshot}
          guild={guild}
          channels={channels}
        />
      )}
    </div>
  );
}

function ReactionChip({ reaction, onToggle, disabled }) {
  const { emoji } = reaction;

  return (
    <button
      className={`dc-reaction${reaction.me ? " mine" : ""}`}
      onClick={onToggle}
      disabled={disabled}
      title={disabled ? "The bot can't react in this channel" : undefined}
    >
      {emoji.id ? (
        <img
          src={`https://cdn.discordapp.com/emojis/${emoji.id}.${
            emoji.animated ? "gif" : "webp"
          }?size=32`}
          alt={emoji.name}
        />
      ) : (
        <span className="dc-reaction-emoji">{emoji.name}</span>
      )}
      <span className="dc-reaction-count">{reaction.count}</span>
    </button>
  );
}
