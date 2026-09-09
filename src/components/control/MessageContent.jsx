import { Fragment, useState } from "react";

import { emojiUrl, roleColor } from "./discordUtils";

/* =====================================================================
   Discord message markup
   ---------------------------------------------------------------------
   Discord's flavour of markdown, rendered the way Discord renders it:
   bold/italic/underline/strikethrough, inline code and code blocks,
   block quotes, headings, lists, spoilers, custom emoji, timestamps,
   links, and mentions resolved to real names and colours.

   It is written by hand rather than with react-markdown (which DisFuse
   already uses elsewhere) because none of the interesting parts are
   markdown: `<@123>`, `<#456>`, `<:pepe:789>` and `<t:1700000000:R>` are
   Discord's own syntax, and mentions have to be resolved against the
   guild that's on screen. Everything is escaped by React itself — the
   parser only ever produces elements and strings, never HTML.
   ===================================================================== */

/** Matches every inline construct at once, longest-first where it matters. */
const INLINE = new RegExp(
  [
    "(\\|\\|[\\s\\S]+?\\|\\|)", // spoiler
    "(`{1,2}[^`\\n]+?`{1,2})", // inline code
    "(\\*\\*\\*[\\s\\S]+?\\*\\*\\*)", // bold italic
    "(\\*\\*[\\s\\S]+?\\*\\*)", // bold
    "(__[\\s\\S]+?__)", // underline
    "(\\*[^*\\n]+?\\*)", // italic
    "(_[^_\\n]+?_)", // italic
    "(~~[\\s\\S]+?~~)", // strikethrough
    "(<a?:\\w+:\\d{15,25}>)", // custom emoji
    "(<@!?\\d{15,25}>)", // user mention
    "(<@&\\d{15,25}>)", // role mention
    "(<#\\d{15,25}>)", // channel mention
    "(<t:-?\\d+(?::[tTdDfFR])?>)", // timestamp
    "(@everyone|@here)", // broadcast mention
    "(https?://[^\\s<>()]+)", // link
  ].join("|"),
  "g",
);

/**
 * @param {{content: string, guild?: object, channels?: Array,
 *          onMention?: (kind: string, id: string) => void}} props
 */
export default function MessageContent({ content, guild, channels, onMention }) {
  if (!content) return null;

  return (
    <span className="dc-markup">
      {renderBlocks(content, { guild, channels, onMention })}
    </span>
  );
}

/* ---- Block level -------------------------------------------------------- */

function renderBlocks(text, ctx) {
  const nodes = [];
  const fence = /```(?:([a-zA-Z0-9+#._-]*)\n)?([\s\S]*?)```/g;

  let index = 0;
  let match;

  while ((match = fence.exec(text)) !== null) {
    if (match.index > index)
      nodes.push(...renderLines(text.slice(index, match.index), ctx, nodes.length));

    nodes.push(
      <pre className="dc-codeblock" key={`code-${match.index}`}>
        {match[1] ? <span className="dc-code-lang">{match[1]}</span> : null}
        <code>{match[2]}</code>
      </pre>,
    );

    index = fence.lastIndex;
  }

  if (index < text.length)
    nodes.push(...renderLines(text.slice(index), ctx, nodes.length));

  return nodes;
}

function renderLines(text, ctx, offset) {
  const lines = text.split("\n");
  const nodes = [];

  let quote = [];

  const flushQuote = (key) => {
    if (!quote.length) return;

    nodes.push(
      <blockquote className="dc-quote" key={`q-${offset}-${key}`}>
        {quote.map((line, index) => (
          <Fragment key={index}>
            {index > 0 && <br />}
            {renderInline(line, ctx)}
          </Fragment>
        ))}
      </blockquote>,
    );

    quote = [];
  };

  lines.forEach((line, index) => {
    const quoted = /^>\s?(.*)$/.exec(line);
    if (quoted) {
      quote.push(quoted[1]);
      return;
    }

    flushQuote(index);

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const Tag = `h${heading[1].length}`;
      nodes.push(
        <Tag className="dc-heading" key={`h-${offset}-${index}`}>
          {renderInline(heading[2], ctx)}
        </Tag>,
      );
      return;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      nodes.push(
        <div className="dc-list-item" key={`li-${offset}-${index}`}>
          <span className="dc-bullet">•</span>
          <span>{renderInline(bullet[1], ctx)}</span>
        </div>,
      );
      return;
    }

    nodes.push(
      <Fragment key={`l-${offset}-${index}`}>
        {index > 0 && nodes.length > 0 ? <br /> : null}
        {renderInline(line, ctx)}
      </Fragment>,
    );
  });

  flushQuote("end");
  return nodes;
}

/* ---- Inline level ------------------------------------------------------- */

function renderInline(text, ctx, depth = 0) {
  if (!text) return null;
  /* Formatting nests (bold inside a quote inside italics), but not
     forever — a pathological message must not lock the tab up. */
  if (depth > 6) return text;

  const nodes = [];
  const pattern = new RegExp(INLINE.source, "g");

  let index = 0;
  let key = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > index) nodes.push(text.slice(index, match.index));
    index = pattern.lastIndex;

    const token = match[0];
    key += 1;

    nodes.push(renderToken(token, ctx, depth, key));
  }

  if (index < text.length) nodes.push(text.slice(index));
  return nodes;
}

function renderToken(token, ctx, depth, key) {
  const inner = (value) => renderInline(value, ctx, depth + 1);

  if (token.startsWith("||") && token.endsWith("||"))
    return <Spoiler key={key}>{inner(token.slice(2, -2))}</Spoiler>;

  if (token.startsWith("`")) {
    const ticks = token.startsWith("``") ? 2 : 1;
    return (
      <code className="dc-code" key={key}>
        {token.slice(ticks, -ticks)}
      </code>
    );
  }

  if (token.startsWith("***"))
    return (
      <strong key={key}>
        <em>{inner(token.slice(3, -3))}</em>
      </strong>
    );

  if (token.startsWith("**"))
    return <strong key={key}>{inner(token.slice(2, -2))}</strong>;

  if (token.startsWith("__"))
    return <u key={key}>{inner(token.slice(2, -2))}</u>;

  if (token.startsWith("~~"))
    return <s key={key}>{inner(token.slice(2, -2))}</s>;

  if (token.startsWith("*") || token.startsWith("_"))
    return <em key={key}>{inner(token.slice(1, -1))}</em>;

  const emoji = /^<(a)?:(\w+):(\d{15,25})>$/.exec(token);
  if (emoji)
    return (
      <img
        className="dc-emoji"
        key={key}
        src={emojiUrl(emoji[3], Boolean(emoji[1]), 48)}
        alt={`:${emoji[2]}:`}
        title={`:${emoji[2]}:`}
        loading="lazy"
      />
    );

  const user = /^<@!?(\d{15,25})>$/.exec(token);
  if (user) {
    const member = ctx.guild?.members?.find((m) => m.user?.id === user[1]);
    const name =
      member?.nick || member?.user?.globalName || member?.user?.username;

    return (
      <span
        className="dc-mention"
        key={key}
        role={ctx.onMention ? "button" : undefined}
        tabIndex={ctx.onMention ? 0 : undefined}
        onClick={() => ctx.onMention?.("user", user[1])}
        onKeyDown={(e) => e.key === "Enter" && ctx.onMention?.("user", user[1])}
      >
        @{name || "unknown-user"}
      </span>
    );
  }

  const role = /^<@&(\d{15,25})>$/.exec(token);
  if (role) {
    const found = ctx.guild?.roles?.find((r) => r.id === role[1]);
    const colour = found?.color ? roleColor(found) : null;

    return (
      <span
        className="dc-mention dc-mention-role"
        key={key}
        style={
          colour
            ? { color: colour, background: `${colour}22` }
            : undefined
        }
      >
        @{found?.name || "unknown-role"}
      </span>
    );
  }

  const channel = /^<#(\d{15,25})>$/.exec(token);
  if (channel) {
    const found = (ctx.channels || []).find((c) => c.id === channel[1]);

    return (
      <span
        className="dc-mention"
        key={key}
        role={ctx.onMention ? "button" : undefined}
        tabIndex={ctx.onMention ? 0 : undefined}
        onClick={() => ctx.onMention?.("channel", channel[1])}
        onKeyDown={(e) =>
          e.key === "Enter" && ctx.onMention?.("channel", channel[1])
        }
      >
        #{found?.name || "unknown-channel"}
      </span>
    );
  }

  const timestamp = /^<t:(-?\d+)(?::([tTdDfFR]))?>$/.exec(token);
  if (timestamp)
    return (
      <span className="dc-timestamp" key={key}>
        {formatDiscordTimestamp(Number(timestamp[1]), timestamp[2] || "f")}
      </span>
    );

  if (token === "@everyone" || token === "@here")
    return (
      <span className="dc-mention dc-mention-broadcast" key={key}>
        {token}
      </span>
    );

  if (/^https?:\/\//.test(token))
    return (
      <a
        className="dc-link"
        key={key}
        href={token}
        target="_blank"
        rel="noreferrer noopener"
      >
        {token}
      </a>
    );

  return token;
}

function Spoiler({ children }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      className={`dc-spoiler${revealed ? " revealed" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => setRevealed(true)}
      onKeyDown={(event) => event.key === "Enter" && setRevealed(true)}
    >
      {children}
    </span>
  );
}

/** Discord's `<t:…:X>` styles, in the reader's own locale and timezone. */
export function formatDiscordTimestamp(seconds, style) {
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  switch (style) {
    case "t":
      return date.toLocaleTimeString([], { timeStyle: "short" });
    case "T":
      return date.toLocaleTimeString([], { timeStyle: "medium" });
    case "d":
      return date.toLocaleDateString([], { dateStyle: "short" });
    case "D":
      return date.toLocaleDateString([], { dateStyle: "long" });
    case "F":
      return date.toLocaleString([], { dateStyle: "full", timeStyle: "short" });
    case "R":
      return relativeTime(date);
    default:
      return date.toLocaleString([], { dateStyle: "long", timeStyle: "short" });
  }
}

function relativeTime(date) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size || unit === "second")
      return formatter.format(Math.round(seconds / size), unit);
  }

  return "now";
}
