import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "./Button.jsx";
import { subscribeToasts } from "./toast.js";

/* =====================================================================
   Small pieces
   ---------------------------------------------------------------------
   Badge, Chip, Spinner, Skeleton, Kbd, EmptyState, Tabs, Breadcrumbs,
   SaveIndicator, Toaster, PageTransition and AnimatedNumber.
   ===================================================================== */

export function Badge({ tone, icon, children, className = "" }) {
  return (
    <span className={`dfb-badge ${tone ? `dfb-badge--${tone}` : ""} ${className}`}>
      {icon && <i className={icon} aria-hidden />}
      {children}
    </span>
  );
}

export function Chip({ icon, color, children, onRemove, title }) {
  const style = color ? { "--chip-bg": `color-mix(in srgb, ${color} 18%, transparent)`, "--chip-border": `color-mix(in srgb, ${color} 45%, transparent)` } : undefined;
  return (
    <span className="dfb-chip" style={style} title={title}>
      {icon && <i className={icon} aria-hidden style={color ? { color } : undefined} />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
      {onRemove && (
        <button type="button" aria-label="Remove" onClick={onRemove}>
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>
      )}
    </span>
  );
}

export const Spinner = ({ size }) => <span className="dfb-spinner" style={size ? { width: size, height: size } : undefined} role="status" aria-label="Loading" />;

export const Skeleton = ({ width = "100%", height = 16, radius, style }) => (
  <span className="dfb-skeleton" style={{ display: "block", width, height, borderRadius: radius, ...style }} aria-hidden />
);

export const Kbd = ({ children }) => <kbd className="dfb-kbd">{children}</kbd>;

export function EmptyState({ icon = "fa-solid fa-wand-magic-sparkles", color, title, children, action }) {
  return (
    <div className="dfb-empty">
      <div className="dfb-empty__art" style={color ? { "--empty-bg": color } : undefined}>
        <i className={icon} aria-hidden />
      </div>
      {title && <h3>{title}</h3>}
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, ariaLabel }) {
  return (
    <div className="dfb-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          type="button"
          role="tab"
          key={tab.value}
          aria-selected={tab.value === value}
          className={`dfb-tabs__tab ${tab.value === value ? "dfb-tabs__tab--active" : ""}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon && <i className={tab.icon} aria-hidden />}
          {tab.label}
          {tab.count !== undefined && <span style={{ opacity: 0.6 }}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Where you are: BOT NAME > Commands > /ban > reason.
 * items: [{ label, to, icon, image }] — the last one is the current page.
 */
export function Breadcrumbs({ items }) {
  const middle = (index) => items.length > 3 && index > 0 && index < items.length - 1;
  return (
    <nav aria-label="Where you are" style={{ minWidth: 0 }}>
      <ol className="dfb-crumbs">
        {items.map((item, index) => {
          const content = (
            <>
              {item.image ? <img src={item.image} alt="" /> : item.icon ? <i className={item.icon} aria-hidden /> : null}
              <span className="dfb-crumbs__label">{item.label}</span>
            </>
          );
          const last = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`} className={middle(index) ? "dfb-crumbs__middle" : ""} style={{ animationDelay: `${index * 40}ms` }}>
              {last || !item.to ? <span aria-current={last ? "page" : undefined}>{content}</span> : <Link to={item.to}>{content}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function sinceText(date) {
  if (!date) return "";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return date.toLocaleTimeString([], { timeStyle: "short" });
}

/** "Saving…", "All changes saved", "Couldn't save". */
export function SaveIndicator({ state, lastSavedAt }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(timer);
  }, []);

  const text =
    state === "saving" ? "Saving…" : state === "error" ? "Couldn't save" : lastSavedAt ? `Saved ${sinceText(lastSavedAt)}` : "All changes saved";

  return (
    <span className={`dfb-save dfb-save--${state}`} role="status" aria-live="polite" title={text}>
      <span className="dfb-save__dot" aria-hidden />
      <span className="dfb-save__text">{text}</span>
    </span>
  );
}

const TOAST_ICONS = {
  success: "fa-solid fa-check",
  error: "fa-solid fa-triangle-exclamation",
  info: "fa-solid fa-circle-info",
};

/** Draws toast.success/error/info notices. Put one in the layout. */
export function Toaster() {
  const [notices, setNotices] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    const dismiss = (id) => {
      setNotices((list) => list.map((n) => (n.id === id ? { ...n, leaving: true } : n)));
      setTimeout(() => setNotices((list) => list.filter((n) => n.id !== id)), 240);
    };
    const unsubscribe = subscribeToasts((notice) => {
      setNotices((list) => [...list.slice(-3), notice]);
      timers.current.set(notice.id, setTimeout(() => dismiss(notice.id), notice.duration));
    });
    const pending = timers.current;
    return () => {
      unsubscribe();
      pending.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="dfb-portal dfb-toaster" aria-live="polite">
      {notices.map((notice) => (
        <div key={notice.id} className={`dfb-toast dfb-toast--${notice.kind} ${notice.leaving ? "dfb-toast--leaving" : ""}`} role={notice.kind === "error" ? "alert" : "status"}>
          <span className="dfb-toast__icon">
            <i className={TOAST_ICONS[notice.kind]} aria-hidden />
          </span>
          <div className="dfb-toast__body">
            <strong>{notice.message}</strong>
            {notice.detail && <span>{notice.detail}</span>}
          </div>
          {notice.action && (
            <Button size="sm" variant="secondary" onClick={notice.action.onClick}>
              {notice.action.label}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

/** Replays an entrance animation whenever the page changes. */
export function PageTransition({ children, className = "" }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className={`dfb-page-enter ${className}`}>
      {children}
    </div>
  );
}

/** A number that counts up to its value. */
export function AnimatedNumber({ value, duration = 700 }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
    const start = performance.now();
    const initial = from.current;
    let frame;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(initial + (value - initial) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
      else from.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);
  if (typeof value !== "number" || !Number.isFinite(value)) return <>{value ?? "…"}</>;
  return <>{shown.toLocaleString()}</>;
}
