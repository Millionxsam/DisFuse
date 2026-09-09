import { useEffect } from "react";

/**
 * The dialog shell every Control panel sits in.
 *
 * DisFuse uses SweetAlert for confirmations and short prompts, and it
 * still does here — but a member profile or a server's role list is a
 * panel, not an alert, so those get a real dialog with Discord's own
 * proportions. Escape closes, the backdrop closes, and the body doesn't
 * scroll underneath.
 */
export default function ControlModal({
  title,
  icon,
  subtitle,
  wide,
  onClose,
  children,
  footer,
}) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dc-modal-backdrop" onClick={onClose}>
      <div
        className={`dc-modal${wide ? " wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dc-modal-head">
          <div>
            <h2>
              {icon && <i className={icon}></i>} {title}
            </h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="dc-modal-close" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div className="dc-modal-body">{children}</div>

        {footer && <footer className="dc-modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
