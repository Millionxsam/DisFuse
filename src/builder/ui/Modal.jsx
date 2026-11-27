import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { docsUrl } from "../../config/docs.js";
import { Button } from "./Button.jsx";
import { Field, TextInput } from "./fields.jsx";
import { isTopLayer, pushLayer } from "./layers.js";

/* =====================================================================
   Modals
   ---------------------------------------------------------------------
   The builder's own dialogs. The user asked for no SweetAlert: these are
   ordinary React components with their own animation, focus handling
   and inputs.

     <Modal open={open} onClose={close} title="New command" icon="fa-solid fa-terminal"
            footer={<Button ...>Create</Button>}>
       ...
     </Modal>

   For the common "are you sure?" and "type a name" cases there are two
   promise helpers, rendered by <DialogHost /> (in the builder layout):

     if (await confirm({ title: "Delete this step?", danger: true })) ...
     const name = await promptText({ title: "New variable", label: "Name" });
   ===================================================================== */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0;

export function Modal({
  open,
  onClose,
  docs,
  title,
  subtitle,
  icon,
  iconColor,
  tone,
  size = "md",
  footer,
  children,
  closeOnBackdrop = true,
  flush = false,
  initialFocus,
  labelledBy,
}) {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const dialog = useRef(null);
  const returnFocus = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  /* Stay on screen for the closing animation. */
  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return undefined;
    }
    if (!rendered) return undefined;
    setClosing(true);
    const timer = setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [open, rendered]);

  /* Focus, Escape, and keeping Tab inside. */
  useEffect(() => {
    if (!open) return undefined;
    const layer = pushLayer();
    returnFocus.current = document.activeElement;
    openCount += 1;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const target = initialFocus?.current ?? dialog.current?.querySelector("[data-autofocus]") ?? dialog.current?.querySelector(FOCUSABLE);
      /* No scrolling: a field at the bottom of a long dialog shouldn't
         open it halfway down. */
      target?.focus?.({ preventScroll: true });
    };
    const frame = requestAnimationFrame(focusFirst);

    const onKey = (event) => {
      if (!isTopLayer(layer.id)) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      cancelAnimationFrame(frame);
      layer.remove();
      document.removeEventListener("keydown", onKey, true);
      openCount -= 1;
      if (!openCount) document.body.style.overflow = "";
      returnFocus.current?.focus?.();
    };
  }, [initialFocus, open]);

  if (!rendered) return null;

  const titleId = labelledBy ?? "dfb-modal-title";

  return createPortal(
    <div
      className={`dfb-portal dfb-modal-backdrop ${closing ? "dfb-modal-backdrop--closing" : ""}`}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div ref={dialog} className={`dfb-modal dfb-modal--${size}`} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}>
        {(title || icon) && (
          <header className="dfb-modal__header">
            {icon && (
              <div className={`dfb-modal__icon ${tone === "danger" ? "dfb-modal__icon--danger" : ""}`} style={iconColor ? { "--icon-bg": iconColor } : undefined}>
                <i className={icon} aria-hidden />
              </div>
            )}
            <div className="dfb-modal__titles">
              {title && (
                <h2 className="dfb-modal__title" id={titleId}>
                  {title}
                </h2>
              )}
              {subtitle && <p className="dfb-modal__subtitle">{subtitle}</p>}
            </div>
            {docs && (
              <a className="dfb-icon-btn" href={docsUrl(docs)} target="_blank" rel="noopener noreferrer" aria-label="Help: open the DisFuse docs" title="Help">
                <i className="fa-solid fa-circle-question" aria-hidden />
              </a>
            )}
            {onClose && (
              <button type="button" className="dfb-icon-btn" aria-label="Close" onClick={onClose}>
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            )}
          </header>
        )}
        <div className={`dfb-modal__body ${flush ? "dfb-modal__body--flush" : ""}`}>{children}</div>
        {footer && <footer className="dfb-modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------------
   confirm() and promptText()
   --------------------------------------------------------------------- */

const listeners = new Set();
let dialogCounter = 0;

function openDialog(kind, options) {
  return new Promise((resolve) => {
    dialogCounter += 1;
    const dialog = { id: dialogCounter, kind, options, resolve };
    for (const listener of listeners) listener(dialog);
  });
}

/**
 * Asks a yes/no question.
 * @param {{ title, message, confirmLabel, cancelLabel, danger, icon }} options
 * @returns {Promise<boolean>}
 */
export function confirm(options) {
  return openDialog("confirm", options);
}

/**
 * Asks for a line of text.
 * @param {{ title, message, label, initial, placeholder, confirmLabel, validate: (text) => string|null, maxLength, icon }} options
 * @returns {Promise<string|null>} null when cancelled
 */
export function promptText(options) {
  return openDialog("prompt", options);
}

function ConfirmDialog({ dialog, onDone }) {
  const { title, message, confirmLabel = "OK", cancelLabel = "Cancel", danger = false, icon } = dialog.options;
  const [open, setOpen] = useState(true);
  const finish = (answer) => {
    setOpen(false);
    dialog.resolve(answer);
    setTimeout(onDone, 240);
  };
  return (
    <Modal
      open={open}
      onClose={() => finish(false)}
      title={title}
      icon={icon ?? (danger ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-question")}
      tone={danger ? "danger" : undefined}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => finish(false)}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={() => finish(true)} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="dfb-modal__message">{message}</p>}
    </Modal>
  );
}

function PromptDialog({ dialog, onDone }) {
  const { title, message, label, initial = "", placeholder, confirmLabel = "Save", validate, maxLength, icon } = dialog.options;
  const [open, setOpen] = useState(true);
  const [text, setText] = useState(initial);
  const [touched, setTouched] = useState(false);
  const error = validate ? validate(text) : null;

  const finish = (answer) => {
    setOpen(false);
    dialog.resolve(answer);
    setTimeout(onDone, 240);
  };
  const submit = (event) => {
    event?.preventDefault();
    setTouched(true);
    if (error) return;
    finish(text);
  };

  return (
    <Modal
      open={open}
      onClose={() => finish(null)}
      title={title}
      icon={icon ?? "fa-solid fa-pen"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => finish(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={touched && Boolean(error)}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        {message && <p className="dfb-modal__message">{message}</p>}
        <Field label={label} error={touched ? error : null} counter={maxLength ? { value: text.length, max: maxLength } : null}>
          <TextInput
            value={text}
            placeholder={placeholder}
            onChange={(event) => {
              setText(event.target.value);
              setTouched(true);
            }}
            invalid={touched && Boolean(error)}
            data-autofocus
          />
        </Field>
      </form>
    </Modal>
  );
}

/** Renders confirm() and promptText() dialogs. Put one in the layout. */
export function DialogHost() {
  const [dialogs, setDialogs] = useState([]);
  useEffect(() => {
    const listener = (dialog) => setDialogs((list) => [...list, dialog]);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  const remove = (id) => setDialogs((list) => list.filter((d) => d.id !== id));
  return dialogs.map((dialog) =>
    dialog.kind === "confirm" ? (
      <ConfirmDialog key={dialog.id} dialog={dialog} onDone={() => remove(dialog.id)} />
    ) : (
      <PromptDialog key={dialog.id} dialog={dialog} onDone={() => remove(dialog.id)} />
    ),
  );
}
