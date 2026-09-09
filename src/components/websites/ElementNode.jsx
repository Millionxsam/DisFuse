import { elementScope, getElementDef } from "../../config/websiteElements";
import { useDashboard } from "./DashboardContext";
import { useRender } from "./WebsiteRenderer";

/**
 * Renders a single website element (and, for containers, its children).
 *
 * Adding a new element type means adding an entry to
 * config/websiteElements.js and a `case` to the switch below.
 */

/**
 * Website content is authored by DisFuse users but rendered on
 * disfuse.xyz, where dashboard visitors are signed in. A `javascript:`
 * URL would therefore run in the visitor's origin, so only navigational
 * schemes are allowed through.
 */
const SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;

function safeUrl(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Relative and root-relative URLs can't carry a scheme.
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("?")
  )
    return trimmed;

  if (SAFE_SCHEME.test(trimmed)) return trimmed;

  // No scheme at all (e.g. "example.com") — treat it as https.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return `https://${trimmed}`;

  return null;
}

/** "page:<id>" → a real path; anything else is a sanitised URL. */
function resolveHref(value, ctx) {
  if (!value) return null;

  if (value.startsWith("page:")) {
    const page = ctx.pages.find((p) => p.id === value.slice(5));
    if (!page) return null;
    return page.path ? `${ctx.basePath}/${page.path}` : ctx.basePath || "/";
  }

  return safeUrl(value);
}

function isInternal(value) {
  return typeof value === "string" && value.startsWith("page:");
}

/** Splits a style object into the outer shell and the inner content wrapper. */
function splitStyle(style = {}, innerKeys) {
  if (!innerKeys) return [style, null];

  const outer = {};
  const inner = {};

  for (const [key, value] of Object.entries(style)) {
    if (innerKeys.includes(key)) inner[key] = value;
    else outer[key] = value;
  }

  return [outer, inner];
}

export default function ElementNode({ node }) {
  const def = getElementDef(node.type);
  const ctx = useRender();
  const dashboard = useDashboard();

  if (!def) return null;

  const props = node.props || {};
  const [style, innerStyle] = splitStyle(node.style, def.innerStyleKeys);

  const className = [
    "ws-el",
    `ws-${node.type}`,
    ctx.editing && ctx.selectedId === node.id ? "ws-selected" : "",
    ctx.editing && ctx.hoveredId === node.id ? "ws-hovered" : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* Editor-only wiring: clicking selects instead of following the link. */
  const interactive = ctx.editing
    ? {
        "data-ws-id": node.id,
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          ctx.onSelect(node.id);
        },
        onMouseOver: (e) => {
          e.stopPropagation();
          ctx.onHover(node.id);
        },
        onMouseOut: () => ctx.onHover(null),
      }
    : { "data-ws-id": node.id };

  const linkProps = (href, newTab) => {
    const resolved = resolveHref(href, ctx);
    /* Inside the builder every outbound link opens in a new tab so a
       preview click can't navigate the editor away. */
    const external = Boolean(resolved) && !isInternal(href);
    const blank = external && (newTab || ctx.openLinksInNewTab);

    return {
      href: resolved || undefined,
      target: blank ? "_blank" : undefined,
      rel: blank ? "noopener noreferrer" : undefined,
      onClick: (e) => {
        if (ctx.editing) return; // handled by `interactive`
        if (!resolved) return;

        if (isInternal(href) && ctx.onNavigate) {
          e.preventDefault();
          ctx.onNavigate(resolved, href);
        }
      },
    };
  };

  const children = (node.children || []).map((child) => (
    <ElementNode key={child.id} node={child} />
  ));

  const containerBody =
    children.length || !ctx.editing ? (
      children
    ) : (
      <span className="ws-drop-hint">Empty {def.label.toLowerCase()}</span>
    );

  switch (node.type) {
    /* ---------------- Layout ---------------- */

    case "section":
      return (
        <section className={className} style={style} {...interactive}>
          <div
            className="ws-section-inner"
            style={{
              ...innerStyle,
              maxWidth:
                props.width === "full" ? "none" : "var(--ws-content-width)",
            }}
          >
            {containerBody}
          </div>
        </section>
      );

    case "container":
    case "card":
      return (
        <div className={className} style={style} {...interactive}>
          {containerBody}
        </div>
      );

    case "spacer":
      return (
        <div
          className={className}
          style={{ ...style, height: props.height || "48px" }}
          {...interactive}
        />
      );

    case "divider":
      return <hr className={className} style={style} {...interactive} />;

    /* ---------------- Content ---------------- */

    case "heading": {
      const Tag = ["h1", "h2", "h3", "h4"].includes(props.level)
        ? props.level
        : "h2";

      return (
        <Tag className={className} style={style} {...interactive}>
          {props.text || "Heading"}
        </Tag>
      );
    }

    case "text":
      return (
        <p className={className} style={style} {...interactive}>
          {props.text}
        </p>
      );

    case "list": {
      const Tag = props.ordered ? "ol" : "ul";
      const items = props.items || [];

      return (
        <Tag
          className={`${className} ws-list-${props.marker || "dot"}`}
          style={style}
          {...interactive}
        >
          {items.map((item, index) => (
            <li key={index}>
              {props.marker === "check" && (
                <i className="fa-solid fa-check"></i>
              )}
              {props.marker === "dot" && <span className="ws-list-dot" />}
              <span>{item.text}</span>
            </li>
          ))}
        </Tag>
      );
    }

    case "icon":
      return (
        <i
          className={`${className} ${props.icon || "fa-solid fa-bolt"}`}
          style={style}
          {...interactive}
        />
      );

    /* ---------------- Media & actions ---------------- */

    case "image": {
      const src = safeUrl(props.src);
      const image = src ? (
        <img src={src} alt={props.alt || ""} style={style} />
      ) : (
        <span className="ws-image-placeholder" style={style}>
          <i className="fa-solid fa-image"></i>
        </span>
      );

      return props.href ? (
        <a
          className={className}
          {...linkProps(props.href, true)}
          {...interactive}
        >
          {image}
        </a>
      ) : (
        <span className={className} {...interactive}>
          {image}
        </span>
      );
    }

    case "button":
      return (
        <a
          className={`${className} ws-button-${props.variant || "primary"}`}
          style={style}
          {...linkProps(props.href, props.newTab)}
          {...interactive}
        >
          {props.icon && <i className={props.icon}></i>}
          {props.label}
        </a>
      );

    case "link":
      return (
        <a
          className={className}
          style={style}
          {...linkProps(props.href, props.newTab)}
          {...interactive}
        >
          {props.text}
        </a>
      );

    /* ---------------- Navigation ---------------- */

    case "navbar":
      return (
        <header
          className={className}
          style={{
            ...style,
            position: props.sticky ? "sticky" : undefined,
            top: props.sticky ? 0 : undefined,
          }}
          {...interactive}
        >
          <div className="ws-navbar-inner" style={innerStyle}>
            <span className="ws-navbar-brand">
              {safeUrl(props.brandImage) && (
                <img src={safeUrl(props.brandImage)} alt="" />
              )}
              {props.brand}
            </span>
            <nav className="ws-navbar-links">
              {(props.links || []).map((link, index) => (
                <a key={index} {...linkProps(link.href, false)}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
      );

    /* ---------------- Dashboard controls ----------------
       These read and write website.data for the selected server. They
       render read-only whenever there is no dashboard context (which is
       every plain informational website). */

    case "setting-toggle":
    case "setting-text":
    case "setting-number":
    case "setting-select":
    case "setting-channel":
    case "setting-role":
      return (
        <SettingElement
          node={node}
          def={def}
          className={className}
          style={style}
          interactive={interactive}
          dashboard={dashboard}
        />
      );

    case "dashboard-save":
      return (
        <button
          type="button"
          className={`${className} ws-button ws-button-primary ws-control`}
          style={style}
          disabled={!dashboard || dashboard.saving || !dashboard.dirty}
          onClick={() => dashboard?.save?.()}
          {...interactive}
        >
          <i className="fa-solid fa-floppy-disk"></i>
          {dashboard?.saving ? "Saving…" : props.label || "Save changes"}
        </button>
      );

    case "guild-info":
      return (
        <div className={className} style={style} {...interactive}>
          <span className="ws-guild-icon">
            {dashboard?.guild?.icon ? (
              <img
                src={`https://cdn.discordapp.com/icons/${dashboard.guild.id}/${dashboard.guild.icon}.png`}
                alt=""
              />
            ) : (
              (dashboard?.guild?.name || "S").charAt(0)
            )}
          </span>
          <span className="ws-guild-meta">
            <strong>{dashboard?.guild?.name || "Your server"}</strong>
            <small>Configuring this server</small>
          </span>
          {props.showSwitch && (
            <button
              type="button"
              className="ws-guild-switch ws-control"
              onClick={() => dashboard?.switchGuild?.()}
            >
              Switch server
            </button>
          )}
        </div>
      );

    default:
      return null;
  }
}

/* ---- Dashboard setting controls -------------------------------------- */

function SettingElement({
  node,
  def,
  className,
  style,
  interactive,
  dashboard,
}) {
  const { editing } = useRender();

  const props = node.props || {};
  const key = props.settingKey;

  /* Server-scoped controls read website.data.guilds[guild]; user-scoped
     ones read website.data.users[visitor]. Never the same bucket. */
  const scope = elementScope(node);
  const bucket = dashboard?.values?.[scope] ?? null;

  const hasValue = bucket && Object.prototype.hasOwnProperty.call(bucket, key);
  const value = hasValue ? bucket[key] : props.default;

  /* A server setting isn't editable until a server has been chosen. */
  const awaitingGuild = scope === "guild" && dashboard && !dashboard.guild;
  const disabled = !dashboard || dashboard.readOnly || awaitingGuild;

  const setValue = (next) => dashboard?.setValue?.(scope, key, next);

  const resourceOptions = () => {
    const list = dashboard?.resources?.[def.resource] || [];
    const prefix = def.resource === "channels" ? "#" : "@";

    return list.map((item) => ({
      value: item.id,
      label: `${prefix}${item.name}`,
    }));
  };

  let control = null;

  switch (node.type) {
    case "setting-toggle":
      control = (
        <label className="switch ws-control">
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={(e) => setValue(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      );
      break;

    case "setting-text":
      control = props.multiline ? (
        <textarea
          className="ws-control"
          rows={3}
          placeholder={props.placeholder}
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
        />
      ) : (
        <input
          className="ws-control"
          type="text"
          placeholder={props.placeholder}
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
        />
      );
      break;

    case "setting-number":
      control = (
        <input
          className="ws-control"
          type="number"
          min={props.min}
          max={props.max}
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) =>
            setValue(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      );
      break;

    case "setting-select":
      control = (
        <select
          className="ws-control"
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Not set</option>
          {(props.options || []).map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;

    case "setting-channel":
    case "setting-role": {
      const options = resourceOptions();

      control = (
        <select
          className="ws-control"
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">
            {options.length
              ? `Select a ${def.resource === "channels" ? "channel" : "role"}`
              : `No ${def.resource} available`}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    }

    default:
      control = null;
  }

  return (
    <div className={`${className} ws-setting`} style={style} {...interactive}>
      <div className="ws-setting-label">
        <strong>
          {props.label}
          {/* Only in the builder — visitors shouldn't see wiring details. */}
          {editing && (
            <span className={`ws-scope-badge ${scope}`}>
              {scope === "user" ? "per user" : "per server"}
            </span>
          )}
        </strong>
        {props.description && <p>{props.description}</p>}
      </div>
      <div className="ws-setting-control">{control}</div>
    </div>
  );
}
