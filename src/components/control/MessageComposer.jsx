import { useEffect, useMemo, useRef, useState } from "react";

import { summariseComponents } from "./ComponentBuilder";
import { botCan, canSendIn, emojiUrl, formatBytes } from "./discordUtils";

/* =====================================================================
   The message box
   ---------------------------------------------------------------------
   Composes as the BOT. Everything that would need a user account is
   absent rather than disabled-and-mysterious: there's no voice message
   button, no nitro emoji picker across servers, no GIF tab.

   What is here is what a bot can genuinely send — text, files, replies,
   an emoji picker over this server's emoji, and an edit mode for the
   bot's own messages.

   Embeds and components are built in their own dialogs and then WAIT
   here, listed above the box like the attachments they effectively are.
   That is the whole reason those dialogs don't send: a Discord message
   carries text, embeds and buttons together, so the message box is where
   the three of them meet before anything leaves.

   The composer disables itself, with a reason, whenever the bot can't
   post: no Send Messages permission, an archived thread, a channel it
   can't see, or a socket that isn't connected.
   ===================================================================== */

/* Discord's ceiling. Said here so the button goes quiet at the limit
   rather than the eleventh embed vanishing on its way out. */
const MAX_EMBEDS = 10;

const COMMON_EMOJI = [
  "👍", "👎", "❤️", "🔥", "🎉", "😄", "😂", "🥲", "😮", "😢",
  "😡", "🙏", "👀", "✅", "❌", "⭐", "💯", "🚀", "🤔", "👋",
];

export default function MessageComposer({
  channel,
  guild,
  disabled,
  disabledReason,
  replyingTo,
  editing,
  onCancelReply,
  onCancelEdit,
  onSend,
  onEditSave,
  onTyping,
  limits,
  onCompose,
  draft,
  onEditDraft,
  onRemoveDraft,
}) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const typingSentAt = useRef(0);

  const maxLength = limits?.maxMessageLength || 2000;

  useEffect(() => {
    if (editing) setValue(editing.content || "");
  }, [editing]);

  /* Switching channels must not carry a half-written message across. */
  useEffect(() => {
    setFiles((current) => {
      current.forEach((file) => file.preview && URL.revokeObjectURL(file.preview));
      return [];
    });
    setValue("");
    setPickerOpen(false);
  }, [channel?.id]);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;

    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 320)}px`;
  }, [value]);

  const canAttach = botCan(channel, "AttachFiles");
  const guildEmojis = useMemo(
    () => (guild?.emojis || []).filter((emoji) => emoji.available),
    [guild],
  );

  const blocked = disabled || !canSendIn(channel);
  const overLimit = value.length > maxLength;

  /* An embed or a row of buttons is a message on its own, so a draft
     holding either is reason enough for the send button to light up. */
  const draftEmbeds = editing ? [] : draft?.embeds || [];
  const draftComponents = editing ? [] : draft?.components || [];
  const hasDraft = draftEmbeds.length > 0 || draftComponents.length > 0;

  async function submit() {
    if (blocked || busy) return;
    if (!value.trim() && !files.length && !hasDraft) return;
    if (overLimit) return;

    setBusy(true);

    try {
      if (editing) await onEditSave(value);
      else await onSend({ content: value, files });

      setValue("");
      setFiles([]);
    } finally {
      setBusy(false);
      textareaRef.current?.focus();
    }
  }

  function keyDown(event) {
    if (event.key === "Escape") {
      if (editing) onCancelEdit?.();
      else if (replyingTo) onCancelReply?.();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function changed(event) {
    setValue(event.target.value);

    /* Discord's typing indicator lasts ten seconds, so re-sending more
       often than every eight is pointless traffic. */
    const now = Date.now();
    if (!blocked && !editing && now - typingSentAt.current > 8000) {
      typingSentAt.current = now;
      onTyping?.();
    }
  }

  async function addFiles(list) {
    const max = limits?.maxAttachments || 10;
    const maxBytes = limits?.maxAttachmentBytes || 8 * 1024 * 1024;
    const incoming = [...list].slice(0, max - files.length);

    const read = await Promise.all(
      incoming.map(async (file) => {
        if (file.size > maxBytes)
          return { name: file.name, error: "too large", size: file.size };

        try {
          /* The bytes travel as an ArrayBuffer: Socket.IO sends that as a
             real binary frame, where base64 would have been a third
             larger and used to blow past the connection's buffer. The
             object URL is only for the thumbnail in the composer. */
          return {
            name: file.name,
            contentType: file.type,
            size: file.size,
            data: await file.arrayBuffer(),
            preview: file.type.startsWith("image/")
              ? URL.createObjectURL(file)
              : null,
          };
        } catch {
          return { name: file.name, error: "couldn't be read" };
        }
      }),
    );

    setFiles((current) => [...current, ...read].slice(0, max));
  }

  function paste(event) {
    const pasted = [...(event.clipboardData?.files || [])];
    if (!pasted.length || !canAttach) return;

    event.preventDefault();
    addFiles(pasted);
  }

  function insertEmoji(token) {
    setValue((current) => `${current}${current.endsWith(" ") || !current ? "" : " "}${token} `);
    setPickerOpen(false);
    textareaRef.current?.focus();
  }

  if (blocked)
    return (
      <div className="dc-composer dc-composer-blocked">
        <i className="fa-solid fa-lock"></i>
        <span>
          {disabledReason ||
            (canSendIn(channel)
              ? "The bot doesn't have permission to send messages here."
              : "Messages can't be sent to this kind of channel.")}
        </span>
      </div>
    );

  return (
    <div className="dc-composer">
      {replyingTo && !editing && (
        <div className="dc-composer-banner">
          <span>
            Replying to{" "}
            <strong>
              {replyingTo.author?.globalName || replyingTo.author?.username}
            </strong>
          </span>
          <button onClick={onCancelReply} title="Cancel reply">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {editing && (
        <div className="dc-composer-banner editing">
          <span>
            Editing a message: <em>escape to cancel, enter to save</em>
          </span>
          <button onClick={onCancelEdit} title="Cancel edit">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {hasDraft && (
        <div className="dc-composer-attached">
          {draftEmbeds.map((embed, index) => (
            <div className="dc-composer-attachment" key={`embed-${index}`}>
              <i
                className="fa-solid fa-rectangle-list"
                style={{
                  color: `#${(embed.color ?? 0x5865f2)
                    .toString(16)
                    .padStart(6, "0")}`,
                }}
              ></i>
              <div className="dc-attachment-label">
                <span className="kind">
                  Embed{draftEmbeds.length > 1 ? ` ${index + 1}` : ""}
                </span>
                <span className="detail">
                  {embed.title ||
                    embed.author?.name ||
                    embed.description ||
                    "No title"}
                </span>
              </div>
              <button
                title="Edit this embed"
                onClick={() => onEditDraft?.("embed", index)}
              >
                <i className="fa-solid fa-pen"></i>
              </button>
              <button
                title="Remove this embed"
                onClick={() => onRemoveDraft?.("embed", index)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ))}

          {draftComponents.length > 0 && (
            <div className="dc-composer-attachment">
              <i className="fa-solid fa-puzzle-piece"></i>
              <div className="dc-attachment-label">
                <span className="kind">Components</span>
                <span className="detail">
                  {summariseComponents(draftComponents)}
                </span>
              </div>
              <button
                title="Edit the components"
                onClick={() => onEditDraft?.("components")}
              >
                <i className="fa-solid fa-pen"></i>
              </button>
              <button
                title="Remove the components"
                onClick={() => onRemoveDraft?.("components")}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="dc-composer-files">
          {files.map((file, index) => (
            <div
              className={`dc-composer-file${file.error ? " error" : ""}`}
              key={`${file.name}-${index}`}
            >
              {file.preview ? (
                <img src={file.preview} alt="" />
              ) : (
                <i className="fa-solid fa-file"></i>
              )}
              <span className="name">{file.name}</span>
              <span className="size">
                {file.error ? file.error : formatBytes(file.size)}
              </span>
              <button
                title="Remove"
                onClick={() => {
                  if (file.preview) URL.revokeObjectURL(file.preview);
                  setFiles((current) => current.filter((_, i) => i !== index));
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="dc-composer-row">
        {canAttach && !editing && (
          <>
            <button
              className="dc-composer-icon"
              title="Attach a file"
              onClick={() => fileRef.current?.click()}
              disabled={files.length >= (limits?.maxAttachments || 10)}
            >
              <i className="fa-solid fa-circle-plus"></i>
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </>
        )}

        <textarea
          ref={textareaRef}
          className="dc-composer-input"
          rows={1}
          value={value}
          placeholder={
            editing
              ? "Edit this message"
              : `Message ${
                  channel?.name ? `#${channel.name}` : "this conversation"
                } as the bot`
          }
          onChange={changed}
          onKeyDown={keyDown}
          onPaste={paste}
        />

        <div className="dc-composer-tools">
          {!editing && (
            <>
              {/* An embed is the clearest thing Control can do that a
                  person cannot: only bots may send them. Buttons and
                  menus are the same story, and both wait in the box
                  rather than leaving on their own. */}
              <button
                className="dc-composer-icon"
                title={
                  draftEmbeds.length >= MAX_EMBEDS
                    ? `A message can carry ${MAX_EMBEDS} embeds at most.`
                    : "Add an embed (bots only)"
                }
                disabled={draftEmbeds.length >= MAX_EMBEDS}
                onClick={() => onCompose?.("embed")}
              >
                <i className="fa-solid fa-rectangle-list"></i>
              </button>
              <button
                className={`dc-composer-icon${draftComponents.length ? " active" : ""}`}
                title="Add buttons and menus (bots only)"
                onClick={() => onCompose?.("components")}
              >
                <i className="fa-solid fa-puzzle-piece"></i>
              </button>
              <button
                className="dc-composer-icon"
                title="Create a poll"
                onClick={() => onCompose?.("poll")}
              >
                <i className="fa-solid fa-square-poll-vertical"></i>
              </button>
            </>
          )}

          {overLimit && (
            <span className="dc-composer-count over">
              {maxLength - value.length}
            </span>
          )}
          {!overLimit && value.length > maxLength - 200 && (
            <span className="dc-composer-count">
              {maxLength - value.length}
            </span>
          )}

          <div className="dc-emoji-wrap">
            <button
              className="dc-composer-icon"
              title="Emoji"
              onClick={() => setPickerOpen((open) => !open)}
            >
              <i className="fa-regular fa-face-smile"></i>
            </button>

            {pickerOpen && (
              <>
                <div
                  className="dc-menu-backdrop"
                  onClick={() => setPickerOpen(false)}
                />
                <div className="dc-emoji-picker">
                  <h5>Frequently used</h5>
                  <div className="dc-emoji-grid">
                    {COMMON_EMOJI.map((emoji) => (
                      <button key={emoji} onClick={() => insertEmoji(emoji)}>
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {guildEmojis.length > 0 && (
                    <>
                      <h5>{guild?.name}</h5>
                      <div className="dc-emoji-grid">
                        {guildEmojis.slice(0, 120).map((emoji) => (
                          <button
                            key={emoji.id}
                            title={`:${emoji.name}:`}
                            onClick={() =>
                              insertEmoji(
                                `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`,
                              )
                            }
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
              </>
            )}
          </div>

          <button
            className="dc-composer-send"
            title={editing ? "Save changes" : "Send as the bot"}
            onClick={submit}
            disabled={
              busy || overLimit || (!value.trim() && !files.length && !hasDraft)
            }
          >
            {busy ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              <i className="fa-solid fa-paper-plane"></i>
            )}
          </button>
        </div>
      </div>

      {channel?.rateLimitPerUser > 0 && (
        <p className="dc-composer-note">
          <i className="fa-solid fa-hourglass-half"></i> Slowmode:{" "}
          {channel.rateLimitPerUser}s. Bots with Manage Messages are exempt.
        </p>
      )}
    </div>
  );
}
