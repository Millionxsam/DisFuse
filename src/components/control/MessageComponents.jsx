import MessageContent from "./MessageContent";
import { formatBytes } from "./discordUtils";

/* =====================================================================
   Message components
   ---------------------------------------------------------------------
   Discord has two component systems and a bot in the wild uses both.

   LEGACY   action rows carrying buttons and select menus, sitting under
            a message's `content` and `embeds`.

   V2       opted into with the IS_COMPONENTS_V2 flag (1 << 15). It
            REPLACES `content` and `embeds` entirely: the message body
            arrives as Text Displays, Sections, Containers, Media
            Galleries and Separators inside `components`.

   That second case is why bot messages looked empty here before. Dank
   Memer, and DisFuse's own generated bots, send V2 messages whose
   `content` is an empty string — rendering `content` and `embeds` and
   treating `components` as a footnote showed nothing at all.

   Interactive components are rendered faithfully but always disabled:
   clicking one sends an INTERACTION, and only the bot's own running code
   can answer that. Control drives a bot from outside; it is not the
   bot's runtime. Showing them live would be a lie, so they carry a
   tooltip saying who does handle them.
   ===================================================================== */

export const IS_COMPONENTS_V2 = 1 << 15;

export function usesComponentsV2(message) {
  return Boolean(message?.flags & IS_COMPONENTS_V2);
}

const NOT_INTERACTIVE =
  "Buttons and menus are handled by the bot's own code, not by Control";

/**
 * A one-line summary of a message, wherever its text actually lives.
 *
 * Reply previews, the pin list and anything else that needs "what does
 * this message say" cannot just read `content`: on a Components V2
 * message that is always an empty string, and the text is inside a Text
 * Display somewhere in the component tree. Reading `content` alone is
 * why replies to V2 messages showed "Message has no text".
 */
export function previewText(message) {
  if (!message) return null;
  if (message.content?.trim()) return message.content;

  const fromComponents = collectText(message.components);
  if (fromComponents) return fromComponents;

  const embed = message.embeds?.[0];
  if (embed) return embed.title || embed.description || "Embed";

  if (message.poll?.question?.text) return `Poll: ${message.poll.question.text}`;
  if (message.attachments?.length)
    return message.attachments.length === 1
      ? message.attachments[0].filename
      : `${message.attachments.length} attachments`;
  if (message.stickerItems?.length) return "Sticker";

  return null;
}

function collectText(components, depth = 0) {
  if (!Array.isArray(components) || depth > 8) return "";

  for (const component of components) {
    if (component?.type === 10 && component.content?.trim())
      return component.content;

    const nested =
      collectText(component?.components, depth + 1) ||
      collectText(component?.accessory ? [component.accessory] : null, depth + 1);

    if (nested) return nested;
  }

  return "";
}

/**
 * @param {{components: Array, message?: object, guild?: object,
 *          channels?: Array, onOpenUser?: Function}} props
 */
export default function MessageComponents({
  components,
  message,
  guild,
  channels,
  onOpenUser,
}) {
  if (!components?.length) return null;

  return (
    <div className="dc-components">
      {components.map((component, index) => (
        <Component
          key={component.id ?? index}
          component={component}
          message={message}
          guild={guild}
          channels={channels}
          onOpenUser={onOpenUser}
        />
      ))}
    </div>
  );
}

function Component({ component, message, guild, channels, onOpenUser, depth = 0 }) {
  /* Containers can nest sections which nest more components; a message
     is capped at 40 components by Discord, but depth is guarded anyway. */
  if (!component || depth > 8) return null;

  const childProps = { message, guild, channels, onOpenUser, depth: depth + 1 };

  switch (component.type) {
    /* ---- Layout ---- */

    case 1: // Action row
      return (
        <div className="dc-component-row">
          {(component.components || []).map((child, index) => (
            <Component key={child.id ?? index} component={child} {...childProps} />
          ))}
        </div>
      );

    case 9: {
      // Section — text on the left, one accessory on the right
      return (
        <div className="dc-section">
          <div className="dc-section-body">
            {(component.components || []).map((child, index) => (
              <Component key={child.id ?? index} component={child} {...childProps} />
            ))}
          </div>
          {component.accessory && (
            <div className="dc-section-accessory">
              <Component component={component.accessory} {...childProps} />
            </div>
          )}
        </div>
      );
    }

    case 17: {
      // Container — the V2 replacement for an embed
      const accent =
        typeof component.accent_color === "number"
          ? `#${component.accent_color.toString(16).padStart(6, "0")}`
          : "var(--dc-border)";

      return (
        <div
          className={`dc-container${component.spoiler ? " spoiler" : ""}`}
          style={{ borderLeftColor: accent }}
        >
          {(component.components || []).map((child, index) => (
            <Component key={child.id ?? index} component={child} {...childProps} />
          ))}
        </div>
      );
    }

    case 14: // Separator
      return (
        <div
          className={`dc-separator spacing-${component.spacing ?? 1}${
            component.divider === false ? " no-line" : ""
          }`}
        />
      );

    case 18: // Label — wraps one interactive component with a caption
      return (
        <div className="dc-label">
          <span className="dc-label-text">{component.label}</span>
          {component.description && (
            <span className="dc-label-desc">{component.description}</span>
          )}
          {component.component && (
            <Component component={component.component} {...childProps} />
          )}
        </div>
      );

    /* ---- Content ---- */

    case 10: // Text display
      return (
        <div className="dc-text-display">
          <MessageContent
            content={component.content}
            guild={guild}
            channels={channels}
            onMention={(kind, id) => kind === "user" && onOpenUser?.(id)}
          />
        </div>
      );

    case 11: {
      // Thumbnail
      const url = resolveMedia(component.media, message);
      if (!url) return null;

      return (
        <img
          className={`dc-thumbnail${component.spoiler ? " spoiler" : ""}`}
          src={url}
          alt={component.description || ""}
          title={component.description || undefined}
          loading="lazy"
        />
      );
    }

    case 12: {
      // Media gallery
      const items = (component.items || [])
        .map((item) => ({ ...item, url: resolveMedia(item.media, message) }))
        .filter((item) => item.url);

      if (!items.length) return null;

      return (
        <div className={`dc-media-gallery count-${Math.min(items.length, 4)}`}>
          {items.slice(0, 10).map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className={item.spoiler ? "spoiler" : undefined}
            >
              <img src={item.url} alt={item.description || ""} loading="lazy" />
            </a>
          ))}
        </div>
      );
    }

    case 13: {
      // File
      const attachment = resolveAttachment(component.file, message);
      if (!attachment) return null;

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

    /* ---- Interactive (shown, never clickable) ---- */

    case 2: {
      // Button
      const style = component.style || 1;

      if (style === 5 && component.url)
        return (
          <a
            className="dc-component-button style-5"
            href={component.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            <ComponentEmoji emoji={component.emoji} />
            {component.label}
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        );

      return (
        <button
          className={`dc-component-button style-${style}`}
          disabled
          title={NOT_INTERACTIVE}
        >
          <ComponentEmoji emoji={component.emoji} />
          {component.label || (style === 6 ? "Premium" : "")}
        </button>
      );
    }

    case 3: // String select
    case 5: // User select
    case 6: // Role select
    case 7: // Mentionable select
    case 8: // Channel select
      return (
        <div className="dc-component-select" title={NOT_INTERACTIVE}>
          <span>
            {component.placeholder || selectPlaceholder(component.type)}
          </span>
          <i className="fa-solid fa-chevron-down"></i>
        </div>
      );

    case 4: // Text input (modals only — never on a message)
      return (
        <div className="dc-component-select" title={NOT_INTERACTIVE}>
          <span>{component.placeholder || "Text input"}</span>
        </div>
      );

    default:
      /* An unknown component means Discord shipped something new. Say so
         rather than rendering a blank space. */
      return (
        <div className="dc-component-unknown">
          <i className="fa-solid fa-puzzle-piece"></i> Unsupported component
          (type {component.type})
        </div>
      );
  }
}

function ComponentEmoji({ emoji }) {
  if (!emoji) return null;

  if (emoji.id)
    return (
      <img
        className="dc-component-emoji"
        src={`https://cdn.discordapp.com/emojis/${emoji.id}.${
          emoji.animated ? "gif" : "webp"
        }?size=32`}
        alt={emoji.name || ""}
      />
    );

  return <span className="dc-component-emoji">{emoji.name}</span>;
}

function selectPlaceholder(type) {
  switch (type) {
    case 5:
      return "Select a user";
    case 6:
      return "Select a role";
    case 7:
      return "Select a user or role";
    case 8:
      return "Select a channel";
    default:
      return "Select an option";
  }
}

/**
 * V2 media can point at an ordinary URL or at `attachment://filename`,
 * which refers to a file uploaded alongside the message.
 */
function resolveMedia(media, message) {
  const url = media?.url;
  if (!url) return null;

  if (!url.startsWith("attachment://")) return url;

  const filename = url.slice("attachment://".length);
  const attachment = (message?.attachments || []).find(
    (entry) => entry.filename === filename,
  );

  return attachment?.url || null;
}

function resolveAttachment(file, message) {
  const url = file?.url;
  if (!url) return null;

  if (url.startsWith("attachment://")) {
    const filename = url.slice("attachment://".length);
    return (message?.attachments || []).find(
      (entry) => entry.filename === filename,
    );
  }

  return { url, filename: url.split("/").pop(), size: 0 };
}
