import { useCallback, useEffect, useRef } from "react";

import "../../styles/workspace/modals.css";

/* =====================================================================
   The workspace dialog shell
   ---------------------------------------------------------------------
   Secrets, Invite Collaborators and Version Control all sit in this.

   A native `<dialog>` opened with `showModal()`, deliberately: it gives
   the top layer, the focus trap, inert background content and Escape
   for free, and all four are things a hand-rolled overlay gets wrong.
   What it does not give is a close animation — the element is hidden the
   instant `close()` is called — so closing runs the animation first and
   calls `close()` when it finishes.

   Opening and closing are driven by the `open` prop rather than by a
   `document.querySelector(...).showModal()` from somewhere else in the
   tree, which is how these were opened before. That mattered for more
   than tidiness: it meant the dialogs could only be found by class name,
   so restyling one risked breaking the thing that opened it.
   ===================================================================== */

/** Matches the close animation in modals.css. */
const CLOSE_ANIMATION_MS = 160;

export default function WorkspaceModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  footer,
  wide = false,
  children,
}) {
  const ref = useRef(null);
  const closingTimer = useRef(null);

  const close = useCallback(() => {
    const dialog = ref.current;
    if (!dialog?.open) return;

    dialog.classList.add("closing");

    clearTimeout(closingTimer.current);
    closingTimer.current = setTimeout(() => {
      dialog.classList.remove("closing");
      dialog.close();
    }, CLOSE_ANIMATION_MS);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.classList.remove("closing");
      dialog.showModal();
    } else if (!open && dialog.open) {
      close();
    }
  }, [close, open]);

  /* `close` on the element fires for Escape as well as for our own
     `close()`, so this is the one place that tells the page. */
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;

    function onNativeClose() {
      onClose?.();
    }

    /* Escape closes instantly, skipping the animation. Cancel the
       pending one so it can't close a dialog that has been reopened. */
    function onCancel() {
      clearTimeout(closingTimer.current);
      dialog.classList.remove("closing");
    }

    dialog.addEventListener("close", onNativeClose);
    dialog.addEventListener("cancel", onCancel);

    return () => {
      dialog.removeEventListener("close", onNativeClose);
      dialog.removeEventListener("cancel", onCancel);
      clearTimeout(closingTimer.current);
    };
  }, [onClose]);

  /* A click that lands on the dialog element itself — rather than on the
     panel inside it — is a click on the backdrop. */
  function onBackdropClick(event) {
    if (event.target === ref.current) onClose?.();
  }

  return (
    <dialog
      ref={ref}
      className={`df-modal${wide ? " wide" : ""}`}
      onClick={onBackdropClick}
      aria-labelledby={title ? "df-modal-title" : undefined}
    >
      <div className="df-modal-panel">
        <header className="df-modal-head">
          <div className="df-modal-heading">
            {icon && <i className={icon} aria-hidden="true" />}
            <div>
              <h2 id="df-modal-title">
                {title}
                {badge}
              </h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>

          <button
            type="button"
            className="df-modal-close"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </header>

        <div className="df-modal-body">{children}</div>

        {footer && <footer className="df-modal-foot">{footer}</footer>}
      </div>
    </dialog>
  );
}

/* ---- Pieces the dialogs share ------------------------------------------ */

/** The "nothing here yet" state. */
export function ModalEmpty({ icon, title, children }) {
  return (
    <div className="df-modal-empty">
      <i className={icon} aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

/** A spinner for while a dialog is fetching what it shows. */
export function ModalLoading({ label = "Loading…" }) {
  return (
    <div className="df-modal-loading" role="status">
      <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** An inline failure, with the option to try again. */
export function ModalError({ children, onRetry }) {
  return (
    <div className="df-modal-error" role="alert">
      <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <span>{children}</span>
      {onRetry && (
        <button type="button" className="df-modal-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
