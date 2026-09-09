import { useState } from "react";

import ControlModal from "./ControlModal";
import { CHANNEL_TYPES, botCan, channelIcon } from "./discordUtils";

/* =====================================================================
   Create or edit a channel
   ---------------------------------------------------------------------
   Only the fields that make sense for the type being created — a voice
   channel has no topic and a text channel has no bitrate — and only the
   types a bot can create over the REST API. Stage channels are here;
   directory channels are not, because only a Student Hub can have one.
   ===================================================================== */

const TYPES = [
  { id: CHANNEL_TYPES.TEXT, label: "Text", hint: "Send and read messages" },
  {
    id: CHANNEL_TYPES.VOICE,
    label: "Voice",
    hint: "Voice, which the bot can manage but not join",
  },
  {
    id: CHANNEL_TYPES.ANNOUNCEMENT,
    label: "Announcement",
    hint: "Publishable to following servers",
  },
  { id: CHANNEL_TYPES.FORUM, label: "Forum", hint: "Threads as posts" },
  { id: CHANNEL_TYPES.STAGE, label: "Stage", hint: "Audience-style voice" },
  { id: CHANNEL_TYPES.CATEGORY, label: "Category", hint: "Groups channels" },
];

export default function ChannelPanel({
  guild,
  channel,
  parentId,
  onClose,
  action,
  notify,
  onDone,
}) {
  const editing = Boolean(channel);

  const [type, setType] = useState(channel?.type ?? CHANNEL_TYPES.TEXT);
  const [name, setName] = useState(channel?.name || "");
  const [topic, setTopic] = useState(channel?.topic || "");
  const [nsfw, setNsfw] = useState(Boolean(channel?.nsfw));
  const [slowmode, setSlowmode] = useState(channel?.rateLimitPerUser ?? 0);
  const [userLimit, setUserLimit] = useState(channel?.userLimit ?? 0);
  const [category, setCategory] = useState(
    channel?.parentId ?? parentId ?? "",
  );
  const [busy, setBusy] = useState(false);

  const categories = (guild?.channels || [])
    .filter((entry) => entry.type === CHANNEL_TYPES.CATEGORY)
    .sort((a, b) => a.position - b.position);

  const isVoice = type === CHANNEL_TYPES.VOICE || type === CHANNEL_TYPES.STAGE;
  const isCategory = type === CHANNEL_TYPES.CATEGORY;
  const isText = !isVoice && !isCategory;

  const allowed = editing
    ? botCan(channel, "ManageChannels")
    : guild?.permissionNames?.includes("ManageChannels") ||
      guild?.permissionNames?.includes("Administrator");

  async function save() {
    setBusy(true);

    try {
      if (editing) {
        await action("channel.edit", {
          channelId: channel.id,
          name,
          ...(isText ? { topic, nsfw, rateLimitPerUser: Number(slowmode) } : {}),
          ...(isVoice ? { userLimit: Number(userLimit) } : {}),
          ...(isCategory ? {} : { parentId: category || null }),
        });
        notify.success("Channel updated.");
      } else {
        const result = await action("channel.create", {
          guildId: guild.id,
          name,
          type,
          ...(isCategory ? {} : { parentId: category || undefined }),
          ...(isText ? { topic, nsfw, rateLimitPerUser: Number(slowmode) } : {}),
          ...(isVoice ? { userLimit: Number(userLimit) } : {}),
        });
        notify.success("Channel created.");
        onDone?.(result.channel);
      }

      onClose();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ControlModal
      title={editing ? `Edit #${channel.name}` : "Create channel"}
      icon={editing ? channelIcon(channel) : "fa-solid fa-plus"}
      subtitle={guild?.name}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button
            className="dc-primary"
            disabled={busy || !name.trim() || !allowed}
            onClick={save}
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Create channel"}
          </button>
        </>
      }
    >
      {!allowed && (
        <p className="dc-warning">
          <i className="fa-solid fa-triangle-exclamation"></i> The bot doesn't
          have Manage Channels here, so Discord will refuse this.
        </p>
      )}

      {!editing && (
        <section className="dc-panel-section">
          <h4>Type</h4>
          <div className="dc-type-grid">
            {TYPES.map((entry) => (
              <button
                key={entry.id}
                className={`dc-type-option${type === entry.id ? " active" : ""}`}
                onClick={() => setType(entry.id)}
              >
                <i className={channelIcon({ type: entry.id })}></i>
                <strong>{entry.label}</strong>
                <span>{entry.hint}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <label>
        Name
        <input
          type="text"
          maxLength={100}
          value={name}
          placeholder={isVoice ? "General" : "new-channel"}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      {!isCategory && (
        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">No category</option>
            {categories.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {isText && (
        <>
          <label>
            Topic
            <textarea
              rows={3}
              maxLength={1024}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
          </label>

          <label>
            Slowmode (seconds)
            <input
              type="number"
              min={0}
              max={21600}
              value={slowmode}
              onChange={(event) => setSlowmode(event.target.value)}
            />
          </label>

          <label className="dc-checkbox">
            <input
              type="checkbox"
              checked={nsfw}
              onChange={(event) => setNsfw(event.target.checked)}
            />
            Age-restricted channel
          </label>
        </>
      )}

      {isVoice && (
        <label>
          User limit (0 = unlimited)
          <input
            type="number"
            min={0}
            max={99}
            value={userLimit}
            onChange={(event) => setUserLimit(event.target.value)}
          />
        </label>
      )}
    </ControlModal>
  );
}
