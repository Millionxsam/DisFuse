import { forwardRef, useEffect, useId, useLayoutEffect, useRef } from "react";

/* =====================================================================
   Fields
   ---------------------------------------------------------------------
   <Field label="Name" help="Up to 32 characters" error={message}
          counter={{ value: name.length, max: 32 }} optional>
     <TextInput value={name} onChange={...} />
   </Field>

   Field wires its label to the first input inside it, shows help and
   errors under it, and an optional character counter.
   ===================================================================== */

export function Field({ label, help, error, counter, optional = false, required = false, children, className = "", id: givenId, labelExtra }) {
  const autoId = useId();
  const id = givenId ?? autoId;
  const over = counter && counter.value > counter.max;

  return (
    <div className={`dfb-field ${className}`}>
      {(label || counter) && (
        <label className="dfb-field__label" htmlFor={id}>
          {label}
          {required && <span aria-hidden style={{ color: "var(--dfb-pink)" }}>*</span>}
          {optional && <span className="dfb-field__optional">(optional)</span>}
          {labelExtra}
          {counter && (
            <span className={`dfb-field__counter ${over ? "dfb-field__counter--over" : ""}`}>
              {counter.value}/{counter.max}
            </span>
          )}
        </label>
      )}
      <FieldContext id={id}>{children}</FieldContext>
      {error ? (
        <div className="dfb-field__error" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden style={{ marginTop: 2 }} />
          <span>{error}</span>
        </div>
      ) : help ? (
        <div className="dfb-field__help">{help}</div>
      ) : null}
    </div>
  );
}

/* Gives the first input inside a Field the Field's id, so the label
   points at it, without every caller passing ids around. */
function FieldContext({ id, children }) {
  const wrapper = useRef(null);
  useEffect(() => {
    const target = wrapper.current?.querySelector("input, textarea, button, select");
    if (target && !target.id) target.id = id;
  }, [id]);
  return (
    <div ref={wrapper} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

export const TextInput = forwardRef(function TextInput({ invalid = false, className = "", ...rest }, ref) {
  return <input ref={ref} type="text" className={`dfb-input ${invalid ? "dfb-input--invalid" : ""} ${className}`} autoComplete="off" spellCheck={false} {...rest} />;
});

/** A textarea that grows with its text. */
export const TextArea = forwardRef(function TextArea({ invalid = false, code = false, className = "", minRows = 2, maxHeight = 360, onKeyDown, ...rest }, forwarded) {
  const inner = useRef(null);
  const ref = (node) => {
    inner.current = node;
    if (typeof forwarded === "function") forwarded(node);
    else if (forwarded) forwarded.current = node;
  };

  useLayoutEffect(() => {
    const node = inner.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight + 2, maxHeight)}px`;
  }, [rest.value, maxHeight]);

  /* In code boxes, Tab indents instead of leaving the box. */
  const handleKey = (event) => {
    if (code && event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      const node = event.currentTarget;
      const { selectionStart, selectionEnd, value } = node;
      const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(node, next);
      node.dispatchEvent(new Event("input", { bubbles: true }));
      requestAnimationFrame(() => node.setSelectionRange(selectionStart + 2, selectionStart + 2));
    }
    onKeyDown?.(event);
  };

  return (
    <textarea
      ref={ref}
      rows={minRows}
      spellCheck={!code}
      className={`dfb-textarea ${code ? "dfb-textarea--code" : ""} ${invalid ? "dfb-input--invalid" : ""} ${className}`}
      onKeyDown={handleKey}
      {...rest}
    />
  );
});

/**
 * A number box. `value` may be "" (empty) for optional numbers;
 * onChange gets a number, or null when emptied.
 */
export const NumberInput = forwardRef(function NumberInput({ value, onChange, min, max, step, integer = false, invalid = false, className = "", ...rest }, ref) {
  return (
    <input
      ref={ref}
      type="number"
      inputMode={integer ? "numeric" : "decimal"}
      className={`dfb-input dfb-input--number ${invalid ? "dfb-input--invalid" : ""} ${className}`}
      value={value ?? ""}
      min={min}
      max={max}
      step={step ?? (integer ? 1 : "any")}
      onChange={(event) => {
        const text = event.target.value;
        if (text === "") return onChange?.(null);
        const n = Number(text);
        if (Number.isFinite(n)) onChange?.(integer ? Math.trunc(n) : n);
      }}
      {...rest}
    />
  );
});

export function Toggle({ checked, onChange, label, disabled = false, id, size }) {
  return (
    <label className={`dfb-toggle ${disabled ? "dfb-toggle--disabled" : ""}`} data-size={size}>
      <input type="checkbox" id={id} checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />
      <span className="dfb-toggle__track" aria-hidden />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Checkbox({ checked, onChange, label, description, disabled = false, id }) {
  return (
    <label className="dfb-check" style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
      <input type="checkbox" id={id} checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />
      <span className="dfb-check__box" aria-hidden>
        <i className="fa-solid fa-check" />
      </span>
      {(label || description) && (
        <span className="dfb-check__text">
          {label}
          {description && <small>{description}</small>}
        </span>
      )}
    </label>
  );
}

const PRESETS = ["#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", "#FFFFFF", "#23272A", "#35D0A0", "#FFB648", "#8B6CFF"];

/** A color: a swatch that opens the system picker, the hex code, and presets. */
export function ColorInput({ value, onChange, disabled = false, presets = true }) {
  const hex = /^#[0-9a-f]{6}$/i.test(value ?? "") ? value : "#5865F2";
  return (
    <div className="dfb-color">
      <label className="dfb-color__swatch" style={{ background: hex }}>
        <input type="color" value={hex} disabled={disabled} onChange={(event) => onChange?.(event.target.value.toUpperCase())} aria-label="Pick a color" />
      </label>
      <TextInput
        value={value ?? ""}
        disabled={disabled}
        maxLength={7}
        style={{ width: 110, fontFamily: "var(--dfb-mono)" }}
        onChange={(event) => {
          let text = event.target.value.trim();
          if (text && !text.startsWith("#")) text = `#${text}`;
          onChange?.(text.toUpperCase());
        }}
      />
      {presets && (
        <div className="dfb-color__presets">
          {PRESETS.map((color) => (
            <button
              type="button"
              key={color}
              aria-label={color}
              className={`dfb-color__preset ${color.toUpperCase() === String(value).toUpperCase() ? "dfb-color__preset--active" : ""}`}
              style={{ background: color }}
              disabled={disabled}
              onClick={() => onChange?.(color)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const SearchInput = forwardRef(function SearchInput({ className = "", ...rest }, ref) {
  return (
    <div className={`dfb-search ${className}`}>
      <i className="fa-solid fa-magnifying-glass" aria-hidden />
      {/* type="text", because the site restyles every type="search" box. */}
      <TextInput ref={ref} type="text" role="searchbox" inputMode="search" enterKeyHint="search" {...rest} />
    </div>
  );
});
