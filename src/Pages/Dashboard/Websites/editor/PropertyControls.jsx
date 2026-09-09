import { useEffect, useState } from "react";

import { themeTokens } from "../../../../config/websiteElements";

/**
 * The inspector's form controls. Every field in the element registry
 * (config/websiteElements.js) is rendered by `PropField`, so adding a new
 * field type means adding one case here.
 */

export function Field({ label, help, children, inline = false }) {
  return (
    <label className={`df-ws-field${inline ? " inline" : ""}`}>
      <span className="df-ws-field-label">{label}</span>
      {children}
      {help && <small className="df-ws-field-help">{help}</small>}
    </label>
  );
}

/** Colour picker with the website's theme tokens as one-click swatches. */
export function ColorInput({ value = "", onChange }) {
  /* <input type="color"> only understands hex, so var()/rgba() values keep
     working through the text box next to it. */
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";

  return (
    <div className="df-ws-color">
      <div className="df-ws-color-row">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Pick a colour"
        />
        <input
          type="text"
          value={value}
          placeholder="transparent"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="df-ws-swatches">
        {themeTokens.map((token) => (
          <button
            type="button"
            key={token.key}
            title={token.label}
            className={value === `var(${token.cssVar})` ? "active" : ""}
            style={{ background: `var(${token.cssVar})` }}
            onClick={() => onChange(`var(${token.cssVar})`)}
          />
        ))}
        <button
          type="button"
          title="Transparent"
          className={`transparent${value === "transparent" ? " active" : ""}`}
          onClick={() => onChange("transparent")}
        />
      </div>
    </div>
  );
}

/** Either an internal page ("page:<id>") or any URL. */
export function LinkInput({ value = "", onChange, pages = [] }) {
  const isPage = value.startsWith("page:");

  /**
   * "Custom URL" has to be remembered separately from the value.
   * Choosing it clears the value, and if the mode were derived from the
   * value alone the dropdown would immediately snap back to "Nothing"
   * with nowhere to type the URL.
   */
  const [custom, setCustom] = useState(!isPage && value !== "");

  useEffect(() => {
    if (value.startsWith("page:")) setCustom(false);
    else if (value !== "") setCustom(true);
  }, [value]);

  const mode = isPage ? value : custom ? "url" : "";

  return (
    <div className="df-ws-link">
      <select
        value={mode}
        onChange={(e) => {
          const next = e.target.value;

          if (next === "url") {
            setCustom(true);
            if (isPage) onChange("");
            return;
          }

          setCustom(false);
          onChange(next);
        }}
      >
        <option value="">Nothing</option>
        {pages.map((page) => (
          <option key={page.id} value={`page:${page.id}`}>
            Page: {page.name}
          </option>
        ))}
        <option value="url">Custom URL…</option>
      </select>

      {mode === "url" && (
        <input
          type="text"
          placeholder="https://discord.com/oauth2/authorize?..."
          value={isPage ? "" : value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/** Editable list of objects — navbar links, list items, select options. */
export function Repeater({ field, value = [], onChange, pages }) {
  const items = Array.isArray(value) ? value : [];

  const setItem = (index, key, next) =>
    onChange(
      items.map((item, i) => (i === index ? { ...item, [key]: next } : item)),
    );

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="df-ws-repeater">
      {items.map((item, index) => (
        <div className="df-ws-repeater-item" key={index}>
          <div className="df-ws-repeater-head">
            <span>#{index + 1}</span>
            <div>
              <button
                type="button"
                onClick={() => move(index, -1)}
                title="Move up"
              >
                <i className="fa-solid fa-chevron-up"></i>
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                title="Move down"
              >
                <i className="fa-solid fa-chevron-down"></i>
              </button>
              <button
                type="button"
                className="danger"
                title="Remove"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {field.itemFields.map((itemField) => (
            <PropField
              key={itemField.key}
              field={itemField}
              value={item[itemField.key]}
              pages={pages}
              onChange={(next) => setItem(index, itemField.key, next)}
            />
          ))}
        </div>
      ))}

      <button
        type="button"
        className="df-ws-add-item"
        onClick={() => onChange([...items, { ...field.newItem }])}
      >
        <i className="fa-solid fa-plus"></i> Add {field.label.toLowerCase()}
      </button>
    </div>
  );
}

export function PropField({ field, value, onChange, pages = [] }) {
  switch (field.type) {
    case "textarea":
      return (
        <Field label={field.label} help={field.help}>
          <textarea
            rows={3}
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );

    case "select":
      return (
        <Field label={field.label} help={field.help}>
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      );

    case "boolean":
      return (
        <Field label={field.label} help={field.help} inline>
          <label className="switch">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </Field>
      );

    case "number":
      return (
        <Field label={field.label} help={field.help}>
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </Field>
      );

    case "color":
      return (
        <Field label={field.label} help={field.help}>
          <ColorInput value={value ?? ""} onChange={onChange} />
        </Field>
      );

    case "link":
      return (
        <Field label={field.label} help={field.help}>
          <LinkInput value={value ?? ""} onChange={onChange} pages={pages} />
        </Field>
      );

    case "repeater":
      return (
        <Field label={field.label} help={field.help}>
          <Repeater
            field={field}
            value={value}
            onChange={onChange}
            pages={pages}
          />
        </Field>
      );

    case "settingKey":
      return (
        <Field
          label={field.label}
          help="Where this control is stored in website.data. Your bot reads this key."
        >
          <input
            type="text"
            className="df-ws-mono"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value.trim())}
          />
        </Field>
      );

    default:
      return (
        <Field label={field.label} help={field.help}>
          <input
            type="text"
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );
  }
}
