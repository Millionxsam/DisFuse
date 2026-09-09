import { useState } from "react";

import ControlModal from "./ControlModal";
import { avatarUrl } from "./discordUtils";

/* =====================================================================
   The bot itself
   ---------------------------------------------------------------------
   Status and activity are a GATEWAY operation — there is no REST
   endpoint for them, which is one of the reasons a Control session holds
   a real gateway connection rather than polling Discord.

   Username and avatar are account-wide and rate limited hard by Discord
   (a username can be changed twice an hour), so they live behind their
   own section with that said out loud.
   ===================================================================== */

const STATUSES = [
  { id: "online", label: "Online", icon: "fa-solid fa-circle" },
  { id: "idle", label: "Idle", icon: "fa-solid fa-moon" },
  { id: "dnd", label: "Do Not Disturb", icon: "fa-solid fa-circle-minus" },
  { id: "invisible", label: "Invisible", icon: "fa-regular fa-circle" },
];

const ACTIVITY_TYPES = [
  { id: 0, label: "Playing" },
  { id: 2, label: "Listening to" },
  { id: 3, label: "Watching" },
  { id: 5, label: "Competing in" },
  { id: 1, label: "Streaming" },
  { id: 4, label: "Custom status" },
];

export default function BotPanel({ session, guild, onClose, action, notify }) {
  const [status, setStatus] = useState("online");
  const [activityType, setActivityType] = useState(0);
  const [activityName, setActivityName] = useState("");
  const [activityUrl, setActivityUrl] = useState("");
  const [nick, setNick] = useState(guild?.self?.nick || "");
  const [username, setUsername] = useState(session?.bot?.username || "");
  const [busy, setBusy] = useState(null);

  const privileged = session?.privileged || {};

  async function run(key, type, params, success) {
    setBusy(key);
    try {
      await action(type, params);
      notify.success(success);
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <ControlModal
      title={session?.bot?.username || "This bot"}
      icon="fa-solid fa-robot"
      subtitle="Everything here happens as the bot, from the DisFuse backend."
      onClose={onClose}
    >
      <div className="dc-panel-hero">
        <img src={avatarUrl(session?.bot, 128)} alt="" />
        <div>
          <h3>
            {session?.bot?.globalName || session?.bot?.username}
            <span className="dc-bot-tag">APP</span>
          </h3>
          <p className="dc-muted">
            {session?.guildCount ?? 0} servers · connected to Discord as{" "}
            <code>{session?.bot?.id}</code>
          </p>
        </div>
      </div>

      <section className="dc-panel-section">
        <h4>Gateway</h4>
        <div className="dc-intent-grid">
          <IntentChip on={privileged.messageContent} label="Message Content" />
          <IntentChip on={privileged.members} label="Server Members" />
          <IntentChip on={privileged.presences} label="Presence" />
        </div>
        <p className="dc-muted small">
          Privileged intents are switched on in the Discord developer portal.
          Without Message Content the bot only sees the text of messages that
          mention it; without Server Members the member list is paged in over
          REST; without Presence nobody has an online status.
        </p>
      </section>

      <section className="dc-panel-section">
        <h4>Status &amp; activity</h4>

        <div className="dc-status-picker">
          {STATUSES.map((entry) => (
            <button
              key={entry.id}
              className={`dc-status-option${status === entry.id ? " active" : ""}`}
              onClick={() => setStatus(entry.id)}
            >
              <i className={`${entry.icon} dc-status-dot-${entry.id}`}></i>
              {entry.label}
            </button>
          ))}
        </div>

        <div className="dc-field-row">
          <select
            value={activityType}
            onChange={(event) => setActivityType(Number(event.target.value))}
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            maxLength={128}
            placeholder="Activity text (leave empty for none)"
            value={activityName}
            onChange={(event) => setActivityName(event.target.value)}
          />
        </div>

        {activityType === 1 && (
          <input
            type="url"
            placeholder="Twitch or YouTube URL"
            value={activityUrl}
            onChange={(event) => setActivityUrl(event.target.value)}
          />
        )}

        <button
          className="dc-primary"
          disabled={busy === "presence"}
          onClick={() =>
            run(
              "presence",
              "bot.setPresence",
              {
                status,
                activityType,
                activityName: activityName || undefined,
                activityState: activityType === 4 ? activityName : undefined,
                activityUrl: activityUrl || undefined,
              },
              "The bot's status was updated.",
            )
          }
        >
          {busy === "presence" ? "Saving…" : "Set status"}
        </button>
      </section>

      {guild && (
        <section className="dc-panel-section">
          <h4>Nickname in {guild.name}</h4>
          <div className="dc-field-row">
            <input
              type="text"
              maxLength={32}
              placeholder={session?.bot?.username}
              value={nick}
              onChange={(event) => setNick(event.target.value)}
            />
            <button
              disabled={busy === "nick"}
              onClick={() =>
                run(
                  "nick",
                  "bot.setNickname",
                  { guildId: guild.id, nick },
                  "Nickname updated.",
                )
              }
            >
              {busy === "nick" ? "Saving…" : "Save"}
            </button>
          </div>
          {!guild.permissionNames?.includes("ChangeNickname") && (
            <p className="dc-warning">
              <i className="fa-solid fa-triangle-exclamation"></i> The bot
              doesn't have Change Nickname here, so Discord will refuse this.
            </p>
          )}
        </section>
      )}

      <section className="dc-panel-section">
        <h4>Account</h4>
        <div className="dc-field-row">
          <input
            type="text"
            maxLength={32}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <button
            disabled={busy === "profile" || username === session?.bot?.username}
            onClick={() =>
              run(
                "profile",
                "bot.editProfile",
                { username },
                "The bot's username was changed.",
              )
            }
          >
            {busy === "profile" ? "Saving…" : "Change username"}
          </button>
        </div>
        <p className="dc-muted small">
          Discord only allows a bot's username to change twice an hour, and it
          applies everywhere the bot is.
        </p>
      </section>
    </ControlModal>
  );
}

function IntentChip({ on, label }) {
  return (
    <span className={`dc-intent${on ? " on" : ""}`}>
      <i className={`fa-solid ${on ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
      {label}
    </span>
  );
}
