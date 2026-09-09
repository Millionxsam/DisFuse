import ms from "ms";

/* =====================================================================
   One recorded event
   ---------------------------------------------------------------------
   Shared by the activity feed on Insights and by the Logs page, so a
   "bot joined a server" row looks the same wherever it is read.
   ===================================================================== */

/** Icon, tone and title for each event type the API can return. */
export const EVENT_STYLES = {
  command: {
    icon: "fa-solid fa-terminal",
    tone: "blue",
    label: "Slash command",
  },
  component: {
    icon: "fa-solid fa-hand-pointer",
    tone: "violet",
    label: "Component",
  },
  modal: { icon: "fa-solid fa-window-restore", tone: "violet", label: "Modal" },
  context: { icon: "fa-solid fa-bars", tone: "violet", label: "Context menu" },
  autocomplete: {
    icon: "fa-solid fa-keyboard",
    tone: "violet",
    label: "Autocomplete",
  },
  guildJoin: {
    icon: "fa-solid fa-circle-plus",
    tone: "mint",
    label: "Joined a server",
  },
  guildLeave: {
    icon: "fa-solid fa-circle-minus",
    tone: "danger",
    label: "Left a server",
  },
  ready: { icon: "fa-solid fa-power-off", tone: "amber", label: "Bot started" },
  error: {
    icon: "fa-solid fa-triangle-exclamation",
    tone: "danger",
    label: "Error",
  },
};

export const KIND_LABELS = {
  chat: "Slash command",
  button: "Button",
  select: "Menu",
  modal: "Modal",
  user: "User context menu",
  message: "Message context menu",
  autocomplete: "Autocomplete",
};

export function eventStyle(type) {
  return (
    EVENT_STYLES[type] || {
      icon: "fa-solid fa-circle-info",
      tone: "",
      label: type || "Event",
    }
  );
}

/* The interaction events insightsCode.js times with a stopwatch. For these,
   and only these, `value` is a handling time in milliseconds. The other
   types reuse the field as a count - members for a server event, servers
   for a restart - which describeEvent already spells out in the sentence. */
export const TIMED_TYPES = ["command", "component", "modal", "context"];

/** Handling time in ms, or null when this event's `value` is not one. */
export function eventDuration(event) {
  if (!event || !TIMED_TYPES.includes(event.type)) return null;

  return event.value ?? null;
}

/** "3 minutes ago", using the same helper as the rest of DisFuse. */
export function timeAgo(value) {
  if (!value) return "never";

  const elapsed = Date.now() - new Date(value).getTime();
  if (elapsed < 0) return "just now";
  if (elapsed < 5000) return "just now";

  return `${ms(elapsed, { long: true })} ago`;
}

export function formatMoment(value) {
  if (!value) return "Unknown";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** A sentence describing what happened, for the feed and the log rows. */
export function describeEvent(event) {
  const who = event.userName || (event.userId ? `User ${event.userId}` : null);
  const where = event.guildName || (event.guildId ? "a server" : null);

  switch (event.type) {
    case "command":
      return `${who || "Someone"} ran /${event.name || "unknown"}${
        where ? ` in ${where}` : ""
      }`;
    case "component":
      return `${who || "Someone"} used ${
        event.kind === "select" ? "a menu" : "a button"
      } (${event.name || "no id"})${where ? ` in ${where}` : ""}`;
    case "modal":
      return `${who || "Someone"} submitted the modal "${event.name || "no id"}"`;
    case "context":
      return `${who || "Someone"} used the context menu "${event.name || ""}"${
        where ? ` in ${where}` : ""
      }`;
    case "guildJoin":
      return `Added to ${event.guildName || "a server"}${
        event.value ? ` (${event.value.toLocaleString()} members)` : ""
      }`;
    case "guildLeave":
      return `Removed from ${event.guildName || "a server"}`;
    case "ready":
      return `${event.name || "The bot"} came online${
        event.value ? ` in ${event.value.toLocaleString()} servers` : ""
      }`;
    case "error":
      return event.detail || event.name || "The bot reported an error";
    default:
      return event.name || "Event";
  }
}

/**
 * @param {{event: object, compact?: boolean,
 *          onSelectUser?: Function, onSelectServer?: Function,
 *          onSelectCommand?: Function}} props
 */
export default function InsightEvent({
  event,
  compact = false,
  onSelectUser,
  onSelectServer,
  onSelectCommand,
}) {
  if (!event) return null;

  const style = eventStyle(event.type);
  const failed = event.ok === false || event.type === "error";
  const duration = eventDuration(event);

  return (
    <li className={`df-event${compact ? " compact" : ""}${failed ? " failed" : ""}`}>
      <span className={`df-event-icon ${style.tone}`}>
        <i className={style.icon}></i>
      </span>

      <div className="df-event-body">
        <p className="df-event-text">{describeEvent(event)}</p>

        <div className="df-event-meta">
          <span className="df-event-type">{style.label}</span>

          {event.type === "command" && event.name && onSelectCommand && (
            <button type="button" onClick={() => onSelectCommand(event.name)}>
              <i className="fa-solid fa-terminal"></i> /{event.name}
            </button>
          )}

          {event.userId && onSelectUser && (
            <button type="button" onClick={() => onSelectUser(event)}>
              <i className="fa-solid fa-user"></i>{" "}
              {event.userName || event.userId}
            </button>
          )}

          {event.guildId && onSelectServer && (
            <button type="button" onClick={() => onSelectServer(event)}>
              <i className="fa-solid fa-server"></i>{" "}
              {event.guildName || event.guildId}
            </button>
          )}

          {duration != null && (
            <span>
              <i className="fa-solid fa-stopwatch"></i> {duration}ms
            </span>
          )}

          {/* Only meaningful for an interaction: an error row is already
              an error, and saying "no response" about it reads oddly. */}
          {event.ok === false && event.type !== "error" && (
            <span className="danger">
              <i className="fa-solid fa-circle-exclamation"></i> No response
            </span>
          )}
        </div>
      </div>

      <time className="df-event-time" title={new Date(event.at).toLocaleString()}>
        {timeAgo(event.at)}
      </time>
    </li>
  );
}
