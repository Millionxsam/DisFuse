import { useState } from "react";

import ComponentBuilder from "./ComponentBuilder";
import ControlModal from "./ControlModal";
import MessageContent from "./MessageContent";
import { avatarUrl } from "./discordUtils";

/* =====================================================================
   The composers behind the message box's buttons
   ---------------------------------------------------------------------
   Three things worth a dialog of their own.

   EMBEDS are the clearest example of Control being a BOT client rather
   than a Discord client: a person cannot send an embed at all, and a bot
   can. COMPONENTS — buttons and menus — are the same story, and live in
   ComponentBuilder.jsx.

   Neither of those SENDS anything. They hand what they built back to the
   message box, which carries it like an attachment until the message
   goes: that is what lets one message have text, embeds and buttons at
   once, instead of the embed leaving on its own the moment it's built.

   POLLS are the exception, and send straight away. Discord won't carry a
   poll in the same message as embeds or components, so there is nothing
   for a poll to wait around and be combined with.
   ===================================================================== */

export default function RichSendPanel({
  mode,
  editIndex,
  channel,
  guild,
  draft,
  onClose,
  onSend,
  onAttach,
}) {
  if (mode === "poll")
    return <PollComposer channel={channel} onClose={onClose} onSend={onSend} />;

  if (mode === "components")
    return (
      <ComponentBuilder
        channel={channel}
        guild={guild}
        initial={draft?.components}
        onClose={onClose}
        onAttach={(rows) => onAttach("components", rows)}
      />
    );

  return (
    <EmbedComposer
      channel={channel}
      guild={guild}
      initial={
        typeof editIndex === "number" ? draft?.embeds?.[editIndex] : null
      }
      onClose={onClose}
      onAttach={(embed) => onAttach("embed", embed, editIndex)}
    />
  );
}

/* ---- Embeds -------------------------------------------------------------- */

const PRESET_COLOURS = [
  { name: "Blurple", value: 0x5865f2 },
  { name: "Green", value: 0x23a55a },
  { name: "Yellow", value: 0xf0b232 },
  { name: "Red", value: 0xf23f43 },
  { name: "DisFuse", value: 0x014f98 },
];

/**
 * An embed already attached to the message, read back into the fields
 * that built it.
 *
 * The composer keeps ONE copy of an embed — the finished Discord object
 * — rather than that plus the form state behind it, so editing one means
 * unpicking it. The mapping is near enough one-to-one that this is
 * cheaper than keeping two representations in step.
 */
function hydrate(embed) {
  return {
    title: embed?.title || "",
    description: embed?.description || "",
    url: embed?.url || "",
    color: typeof embed?.color === "number" ? embed.color : 0x5865f2,
    author: embed?.author?.name || "",
    footer: embed?.footer?.text || "",
    image: embed?.image?.url || "",
    thumbnail: embed?.thumbnail?.url || "",
    timestamp: Boolean(embed?.timestamp),
  };
}

function EmbedComposer({ channel, guild, initial, onClose, onAttach }) {
  const [embed, setEmbed] = useState(() => hydrate(initial));
  const [fields, setFields] = useState(() =>
    (initial?.fields || []).map((field) => ({
      name: field.name || "",
      value: field.value || "",
      inline: Boolean(field.inline),
    })),
  );

  const set = (key, value) => setEmbed((e) => ({ ...e, [key]: value }));

  const built = {
    ...(embed.title ? { title: embed.title } : {}),
    ...(embed.description ? { description: embed.description } : {}),
    ...(embed.url ? { url: embed.url } : {}),
    color: embed.color,
    ...(embed.author ? { author: { name: embed.author } } : {}),
    ...(embed.footer ? { footer: { text: embed.footer } } : {}),
    ...(embed.image ? { image: { url: embed.image } } : {}),
    ...(embed.thumbnail ? { thumbnail: { url: embed.thumbnail } } : {}),
    ...(embed.timestamp ? { timestamp: new Date().toISOString() } : {}),
    ...(fields.length
      ? {
          fields: fields
            .filter((f) => f.name.trim() && f.value.trim())
            .map((f) => ({ name: f.name, value: f.value, inline: f.inline })),
        }
      : {}),
  };

  const empty =
    !embed.title && !embed.description && !fields.some((f) => f.name.trim());

  return (
    <ControlModal
      title={`Add an embed to a message in #${channel?.name || "this channel"}`}
      icon="fa-solid fa-rectangle-list"
      subtitle="Only bots can send embeds. This one waits in the message box, so you can write text and add buttons before it goes."
      wide
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button
            className="dc-primary"
            disabled={empty}
            onClick={() => {
              onAttach(built);
              onClose();
            }}
          >
            {initial ? "Save embed" : "Add embed"}
          </button>
        </>
      }
    >
      <div className="dc-embed-builder">
        <div className="dc-embed-fields">
          <label>
            Author
            <input
              type="text"
              maxLength={256}
              value={embed.author}
              onChange={(e) => set("author", e.target.value)}
            />
          </label>

          <label>
            Title
            <input
              type="text"
              maxLength={256}
              value={embed.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </label>

          <label>
            Title link
            <input
              type="url"
              value={embed.url}
              placeholder="https://"
              onChange={(e) => set("url", e.target.value)}
            />
          </label>

          <label>
            Description
            <textarea
              rows={5}
              maxLength={4096}
              value={embed.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>

          <label>
            Colour
            <div className="dc-colour-row">
              {PRESET_COLOURS.map((preset) => (
                <button
                  key={preset.value}
                  title={preset.name}
                  className={`dc-colour-dot${embed.color === preset.value ? " active" : ""}`}
                  style={{ background: `#${preset.value.toString(16).padStart(6, "0")}` }}
                  onClick={() => set("color", preset.value)}
                />
              ))}
              <input
                type="color"
                value={`#${embed.color.toString(16).padStart(6, "0")}`}
                onChange={(e) => set("color", parseInt(e.target.value.slice(1), 16))}
              />
            </div>
          </label>

          <label>
            Image URL
            <input
              type="url"
              value={embed.image}
              placeholder="https://"
              onChange={(e) => set("image", e.target.value)}
            />
          </label>

          <label>
            Thumbnail URL
            <input
              type="url"
              value={embed.thumbnail}
              placeholder="https://"
              onChange={(e) => set("thumbnail", e.target.value)}
            />
          </label>

          <label>
            Footer
            <input
              type="text"
              maxLength={2048}
              value={embed.footer}
              onChange={(e) => set("footer", e.target.value)}
            />
          </label>

          <label className="dc-checkbox">
            <input
              type="checkbox"
              checked={embed.timestamp}
              onChange={(e) => set("timestamp", e.target.checked)}
            />
            Include a timestamp
          </label>

          <section className="dc-panel-section">
            <h4>Fields</h4>
            {fields.map((field, index) => (
              <div className="dc-embed-field-row" key={index}>
                <input
                  type="text"
                  placeholder="Name"
                  maxLength={256}
                  value={field.name}
                  onChange={(e) =>
                    setFields((f) =>
                      f.map((entry, i) =>
                        i === index ? { ...entry, name: e.target.value } : entry,
                      ),
                    )
                  }
                />
                <input
                  type="text"
                  placeholder="Value"
                  maxLength={1024}
                  value={field.value}
                  onChange={(e) =>
                    setFields((f) =>
                      f.map((entry, i) =>
                        i === index ? { ...entry, value: e.target.value } : entry,
                      ),
                    )
                  }
                />
                <label className="dc-checkbox" title="Show side by side">
                  <input
                    type="checkbox"
                    checked={field.inline}
                    onChange={(e) =>
                      setFields((f) =>
                        f.map((entry, i) =>
                          i === index
                            ? { ...entry, inline: e.target.checked }
                            : entry,
                        ),
                      )
                    }
                  />
                  Inline
                </label>
                <button
                  title="Remove field"
                  onClick={() =>
                    setFields((f) => f.filter((_, i) => i !== index))
                  }
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
            {fields.length < 25 && (
              <button
                className="dc-ghost"
                onClick={() =>
                  setFields((f) => [...f, { name: "", value: "", inline: false }])
                }
              >
                <i className="fa-solid fa-plus"></i> Add field
              </button>
            )}
          </section>
        </div>

        <div className="dc-embed-preview">
          <h4>Preview</h4>
          <div className="dc-message-body" style={{ paddingLeft: 0 }}>
            <div className="dc-message-gutter">
              <img
                className="dc-avatar"
                src={avatarUrl(guild?.self?.user, 80)}
                alt=""
              />
            </div>
            <div className="dc-message-main">
              <div className="dc-message-head">
                <span className="dc-author">
                  {guild?.self?.nick || guild?.self?.user?.username || "Your bot"}
                </span>
                <span className="dc-bot-tag">APP</span>
              </div>
              <div className="dc-embeds">
                <PreviewEmbed embed={built} guild={guild} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ControlModal>
  );
}

function PreviewEmbed({ embed, guild }) {
  const colour = `#${(embed.color ?? 0).toString(16).padStart(6, "0")}`;

  return (
    <div className="dc-embed" style={{ borderLeftColor: colour }}>
      {embed.author?.name && (
        <div className="dc-embed-author">
          <span>{embed.author.name}</span>
        </div>
      )}
      {embed.title && <div className="dc-embed-title">{embed.title}</div>}
      {embed.description && (
        <div className="dc-embed-description">
          <MessageContent content={embed.description} guild={guild} />
        </div>
      )}
      {embed.fields?.length > 0 && (
        <div className="dc-embed-fields">
          {embed.fields.map((field, index) => (
            <div
              className={`dc-embed-field${field.inline ? " inline" : ""}`}
              key={index}
            >
              <div className="name">{field.name}</div>
              <div className="value">
                <MessageContent content={field.value} guild={guild} />
              </div>
            </div>
          ))}
        </div>
      )}
      {embed.image?.url && (
        <div className="dc-embed-image">
          <img src={embed.image.url} alt="" />
        </div>
      )}
      {embed.footer?.text && (
        <div className="dc-embed-footer">
          <span>{embed.footer.text}</span>
        </div>
      )}
    </div>
  );
}

/* ---- Polls --------------------------------------------------------------- */

const DURATIONS = [
  { hours: 1, label: "1 hour" },
  { hours: 4, label: "4 hours" },
  { hours: 8, label: "8 hours" },
  { hours: 24, label: "1 day" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "1 week" },
  { hours: 336, label: "2 weeks" },
];

function PollComposer({ channel, onClose, onSend }) {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState(["", ""]);
  const [hours, setHours] = useState(24);
  const [multi, setMulti] = useState(false);
  const [busy, setBusy] = useState(false);

  const valid =
    question.trim().length > 0 &&
    answers.filter((a) => a.trim().length).length >= 2;

  async function send() {
    setBusy(true);
    try {
      await onSend({
        poll: {
          question,
          answers: answers.filter((a) => a.trim().length),
          hours,
          allowMultiselect: multi,
        },
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ControlModal
      title={`Create a poll in #${channel?.name || "this channel"}`}
      icon="fa-solid fa-square-poll-vertical"
      subtitle="The poll is posted by the bot, and anyone in the channel can vote."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button className="dc-primary" disabled={busy || !valid} onClick={send}>
            {busy ? "Posting…" : "Create poll"}
          </button>
        </>
      }
    >
      <label>
        Question
        <input
          type="text"
          maxLength={300}
          value={question}
          placeholder="What are we deciding?"
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>

      <section className="dc-panel-section">
        <h4>Answers</h4>
        {answers.map((answer, index) => (
          <div className="dc-field-row" key={index}>
            <input
              type="text"
              maxLength={55}
              value={answer}
              placeholder={`Answer ${index + 1}`}
              onChange={(e) =>
                setAnswers((a) =>
                  a.map((entry, i) => (i === index ? e.target.value : entry)),
                )
              }
            />
            {answers.length > 2 && (
              <button
                title="Remove"
                onClick={() => setAnswers((a) => a.filter((_, i) => i !== index))}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        ))}
        {answers.length < 10 && (
          <button className="dc-ghost" onClick={() => setAnswers((a) => [...a, ""])}>
            <i className="fa-solid fa-plus"></i> Add answer
          </button>
        )}
      </section>

      <label>
        Runs for
        <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
          {DURATIONS.map((d) => (
            <option key={d.hours} value={d.hours}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label className="dc-checkbox">
        <input
          type="checkbox"
          checked={multi}
          onChange={(e) => setMulti(e.target.checked)}
        />
        Allow more than one answer per person
      </label>
    </ControlModal>
  );
}
