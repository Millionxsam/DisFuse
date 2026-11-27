import { useRef, useState } from "react";

import { CONTEXTS } from "../../catalog/contexts.js";
import { TYPES } from "../../catalog/types.js";
import { PACK_CONTEXTS, PACK_LIMITS, PACK_VALUE_TYPES } from "../../model/packs.js";
import {
  Button,
  Checkbox,
  ColorInput,
  Field,
  IconButton,
  MultiSelect,
  NumberInput,
  Popover,
  Select,
  TextArea,
  TextInput,
  Tooltip,
} from "../../ui/index.js";

/* =====================================================================
   The pack editor's form pieces
   ---------------------------------------------------------------------
   InputsEditor    the boxes people fill in on a step, value or event
   ProvidedEditor  values a section or an event makes available
   CodeTemplate    a code box, with the placeholders it can use as chips
                   that insert themselves where the cursor is
   IconField, TypeSelect, ContextSelect
   ===================================================================== */

/* ---------------------------------------------------------------------
   Small helpers
   --------------------------------------------------------------------- */

/** A code name from a label: "Channel to use" → "channelToUse". */
export function autoKey(label) {
  const words = String(label ?? "")
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let key = words.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join("");
  if (/^\d/.test(key)) key = `_${key}`;
  if (["id", "steps", "raw"].includes(key)) key += "Value";
  return key.slice(0, 40);
}

/** The next free code name like "input", "input2"... */
function freeKey(base, taken) {
  let key = base;
  for (let i = 2; taken.has(key); i++) key = `${base}${i}`;
  return key;
}

const move = (list, index, delta) => {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

/** Changes a label, and the code name with it while it still follows the label. */
function relabel(entry, label) {
  /* A new one starts as "input2" or "value3" until it has a name. */
  const following = !entry.key || entry.key === autoKey(entry.label) || (!entry.label && /^(input|value)\d*$/.test(entry.key));
  return { ...entry, label, ...(following ? { key: autoKey(label) } : {}) };
}

/* ---------------------------------------------------------------------
   Types, contexts and icons
   --------------------------------------------------------------------- */

export const TYPE_OPTIONS = [
  { value: "", label: "Anything", icon: "fa-solid fa-circle", description: "Any kind of value" },
  ...PACK_VALUE_TYPES.map((type) => ({ value: type, label: TYPES[type]?.label ?? type, icon: TYPES[type]?.icon, color: TYPES[type]?.color })),
];

export function TypeSelect({ value, onChange, ariaLabel = "Type" }) {
  return <Select value={value ?? ""} options={TYPE_OPTIONS} onChange={(next) => onChange(next || null)} ariaLabel={ariaLabel} searchable />;
}

const CONTEXT_OPTIONS = PACK_CONTEXTS.map((key) => ({
  value: key,
  label: CONTEXTS[key]?.label ? CONTEXTS[key].label.replace(/^./, (c) => c.toUpperCase()) : key,
  description: CONTEXTS[key]?.description,
}));

export function ContextSelect({ value, onChange, placeholder = "Anywhere" }) {
  return <MultiSelect value={value ?? []} options={CONTEXT_OPTIONS} onChange={onChange} placeholder={placeholder} ariaLabel="Where it works" />;
}

const ICONS = [
  "fa-solid fa-cube", "fa-solid fa-bolt", "fa-solid fa-circle-dot", "fa-solid fa-star", "fa-solid fa-heart",
  "fa-solid fa-gear", "fa-solid fa-wrench", "fa-solid fa-wand-magic-sparkles", "fa-solid fa-message", "fa-solid fa-comments",
  "fa-solid fa-user", "fa-solid fa-users", "fa-solid fa-shield-halved", "fa-solid fa-hashtag", "fa-solid fa-server",
  "fa-solid fa-database", "fa-solid fa-floppy-disk", "fa-solid fa-cloud", "fa-solid fa-globe", "fa-solid fa-link",
  "fa-solid fa-code", "fa-solid fa-terminal", "fa-solid fa-calculator", "fa-solid fa-clock", "fa-solid fa-calendar",
  "fa-solid fa-image", "fa-solid fa-music", "fa-solid fa-gamepad", "fa-solid fa-dice", "fa-solid fa-trophy",
  "fa-solid fa-coins", "fa-solid fa-cart-shopping", "fa-solid fa-bell", "fa-solid fa-envelope", "fa-solid fa-lock",
  "fa-solid fa-key", "fa-solid fa-robot", "fa-solid fa-chart-line", "fa-solid fa-list", "fa-solid fa-filter",
  "fa-solid fa-magnifying-glass", "fa-solid fa-paper-plane", "fa-solid fa-rotate", "fa-solid fa-trash-can", "fa-solid fa-flag",
  "fa-solid fa-fire", "fa-solid fa-leaf", "fa-solid fa-moon", "fa-brands fa-github", "fa-brands fa-youtube",
];

/** A Font Awesome icon: a grid of common ones, or any class typed in. */
export function IconField({ value, fallback, color, onChange }) {
  const [anchor, setAnchor] = useState(null);
  const shown = value || fallback;
  return (
    <div className="dfb-pack-icon-field">
      <button type="button" className="dfb-pack-icon-field__swatch" style={{ "--pack": color }} onClick={(event) => setAnchor(anchor ? null : event.currentTarget)} aria-label="Pick an icon">
        <i className={shown} aria-hidden />
      </button>
      <TextInput value={value ?? ""} placeholder={fallback} maxLength={PACK_LIMITS.icon} onChange={(event) => onChange(event.target.value)} style={{ fontFamily: "var(--dfb-mono)" }} aria-label="Icon class" />
      <Popover anchor={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} ariaLabel="Icons">
        <div className="dfb-pack-icon-grid">
          {ICONS.map((icon) => (
            <button
              type="button"
              key={icon}
              className={icon === value ? "dfb-pack-icon-grid__active" : ""}
              aria-label={icon}
              onClick={() => {
                onChange(icon);
                setAnchor(null);
              }}
            >
              <i className={icon} aria-hidden />
            </button>
          ))}
        </div>
      </Popover>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Inputs
   --------------------------------------------------------------------- */

export const INPUT_KINDS = [
  { value: "text", label: "Text", icon: "fa-solid fa-font", description: "A text box. A value can go in it too." },
  { value: "number", label: "Number", icon: "fa-solid fa-hashtag", description: "A number box. A value can go in it too." },
  { value: "boolean", label: "True/false", icon: "fa-solid fa-toggle-on", description: "A checkbox. A value can go in it too." },
  { value: "dropdown", label: "Dropdown", icon: "fa-solid fa-caret-down", description: "A fixed list of choices." },
  { value: "colour", label: "Color", icon: "fa-solid fa-palette", description: "A color picker. A value can go in it too." },
  { value: "slot", label: "Value", icon: "fa-solid fa-circle-dot", description: "Only takes a value, like a member or a channel." },
  { value: "code", label: "Code", icon: "fa-solid fa-code", description: "JavaScript typed in, used exactly as it is." },
];

const KIND_BY_VALUE = Object.fromEntries(INPUT_KINDS.map((kind) => [kind.value, kind]));

function DefaultField({ input, onChange }) {
  switch (input.kind) {
    case "text":
      return (
        <Field label="Starts as" optional>
          <TextInput value={input.default ?? ""} maxLength={PACK_LIMITS.text} onChange={(event) => onChange({ default: event.target.value })} />
        </Field>
      );
    case "code":
      return (
        <Field label="Starts as" optional>
          <TextArea code value={input.default ?? ""} maxLength={PACK_LIMITS.text} onChange={(event) => onChange({ default: event.target.value })} />
        </Field>
      );
    case "number":
      return (
        <div className="dfb-pack-row">
          <Field label="Starts as" optional>
            <NumberInput value={input.default ?? ""} onChange={(n) => onChange({ default: n })} />
          </Field>
          <Field label="Lowest" optional>
            <NumberInput value={input.min ?? ""} onChange={(n) => onChange({ min: n })} />
          </Field>
          <Field label="Highest" optional>
            <NumberInput value={input.max ?? ""} onChange={(n) => onChange({ max: n })} />
          </Field>
        </div>
      );
    case "boolean":
      return <Checkbox checked={input.default === true} onChange={(checked) => onChange({ default: checked })} label="Checked to start with" />;
    case "colour":
      return (
        <Field label="Starts as">
          <ColorInput value={input.default} onChange={(color) => onChange({ default: color })} />
        </Field>
      );
    case "slot":
      return (
        <Field label="Takes" help="The kind of value that fits in it.">
          <TypeSelect value={input.accepts} onChange={(accepts) => onChange({ accepts })} />
        </Field>
      );
    case "dropdown":
      return <ChoicesEditor input={input} onChange={onChange} />;
    default:
      return null;
  }
}

function ChoicesEditor({ input, onChange }) {
  const options = input.options ?? [];
  const set = (next) => onChange({ options: next });
  return (
    <Field label="Choices" help="What people see, and what goes in the code ({{raw:name}} gives it as typed, {{name}} in quotes).">
      <div className="dfb-pack-choices">
        {options.map((option, index) => (
          <div className="dfb-pack-choice" key={index}>
            <input
              type="radio"
              name={`default-${input.key}`}
              aria-label="Picked to start with"
              title="Picked to start with"
              checked={input.default ? input.default === option.value : index === 0}
              onChange={() => onChange({ default: option.value })}
            />
            <TextInput
              value={option.label}
              placeholder="Label"
              maxLength={PACK_LIMITS.label}
              onChange={(event) => {
                const label = event.target.value;
                const following = !option.value || option.value === autoKey(option.label);
                set(options.map((o, i) => (i === index ? { label, value: following ? autoKey(label) : o.value } : o)));
              }}
            />
            <TextInput
              value={option.value}
              placeholder="Value"
              maxLength={PACK_LIMITS.label}
              style={{ fontFamily: "var(--dfb-mono)" }}
              onChange={(event) => set(options.map((o, i) => (i === index ? { ...o, value: event.target.value } : o)))}
            />
            <IconButton icon="fa-solid fa-xmark" label="Remove choice" size="sm" tone="danger" onClick={() => set(options.filter((_, i) => i !== index))} />
          </div>
        ))}
        {options.length < PACK_LIMITS.options && (
          <Button size="sm" variant="ghost" icon="fa-solid fa-plus" onClick={() => set([...options, { label: "", value: "" }])}>
            Add a choice
          </Button>
        )}
      </div>
    </Field>
  );
}

function InputCard({ input, index, count, onChange, onRemove, onMove, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const kind = KIND_BY_VALUE[input.kind] ?? KIND_BY_VALUE.text;
  const patch = (fields) => onChange({ ...input, ...fields });

  return (
    <div className={`dfb-pack-card ${open ? "dfb-pack-card--open" : ""}`}>
      <div className="dfb-pack-card__head">
        <button type="button" className="dfb-pack-card__toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Hide details" : "Show details"}>
          <i className={`fa-solid fa-chevron-${open ? "down" : "right"}`} aria-hidden />
        </button>
        <div className="dfb-pack-card__kind">
          <Select value={input.kind} options={INPUT_KINDS} onChange={(value) => patch({ kind: value, ...(value === "dropdown" && !input.options?.length ? { options: [{ label: "", value: "" }] } : {}) })} ariaLabel="Kind of input" />
        </div>
        <TextInput value={input.label} placeholder="Name people see" maxLength={PACK_LIMITS.label} onChange={(event) => onChange(relabel(input, event.target.value))} aria-label="Name" />
        <Tooltip text="The name you use in the code, like {{name}}">
          <span className="dfb-pack-card__key">
            <span aria-hidden>{"{{"}</span>
            <input value={input.key} maxLength={40} spellCheck={false} onChange={(event) => patch({ key: event.target.value.replace(/[^A-Za-z0-9_]/g, "") })} aria-label="Code name" />
            <span aria-hidden>{"}}"}</span>
          </span>
        </Tooltip>
        <div className="dfb-pack-card__tools">
          <IconButton icon="fa-solid fa-arrow-up" label="Move up" size="sm" disabled={index === 0} onClick={() => onMove(-1)} />
          <IconButton icon="fa-solid fa-arrow-down" label="Move down" size="sm" disabled={index === count - 1} onClick={() => onMove(1)} />
          <IconButton icon="fa-solid fa-trash-can" label="Remove" size="sm" tone="danger" onClick={onRemove} />
        </div>
      </div>
      {open && (
        <div className="dfb-pack-card__body">
          <p className="dfb-pack-hint">
            <i className={kind.icon} aria-hidden /> {kind.description}
          </p>
          <Field label="Help" optional help="One line shown under the input.">
            <TextInput value={input.help} maxLength={PACK_LIMITS.help} onChange={(event) => patch({ help: event.target.value })} />
          </Field>
          {["text", "number", "code"].includes(input.kind) && (
            <Field label="Placeholder" optional>
              <TextInput value={input.placeholder} maxLength={PACK_LIMITS.label} onChange={(event) => patch({ placeholder: event.target.value })} />
            </Field>
          )}
          <DefaultField input={input} onChange={patch} />
          <div className="dfb-pack-checks">
            {input.kind === "text" && <Checkbox checked={input.multiline} onChange={(multiline) => patch({ multiline })} label="Several lines" />}
            {input.kind !== "boolean" && input.kind !== "dropdown" && (
              <Checkbox checked={input.optional} onChange={(optional) => patch({ optional })} label="Can be left empty" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object[]} props.inputs
 * @param {(inputs: object[]) => void} props.onChange
 * @param {string} [props.addLabel]
 */
export function InputsEditor({ inputs, onChange, addLabel = "Add an input", emptyText }) {
  const [added, setAdded] = useState(null);
  const add = () => {
    const key = freeKey("input", new Set(inputs.map((i) => i.key)));
    const next = { key, kind: "text", label: "", help: "", placeholder: "", optional: false, default: "", multiline: false };
    setAdded(inputs.length);
    onChange([...inputs, next]);
  };
  return (
    <div className="dfb-pack-cards">
      {!inputs.length && emptyText && <p className="dfb-pack-hint">{emptyText}</p>}
      {inputs.map((input, index) => (
        <InputCard
          key={index}
          input={input}
          index={index}
          count={inputs.length}
          defaultOpen={added === index}
          onChange={(next) => onChange(inputs.map((i, n) => (n === index ? next : i)))}
          onRemove={() => onChange(inputs.filter((_, n) => n !== index))}
          onMove={(delta) => onChange(move(inputs, index, delta))}
        />
      ))}
      {inputs.length < PACK_LIMITS.inputs && (
        <Button variant="ghost" icon="fa-solid fa-plus" onClick={add} className="dfb-pack-add">
          {addLabel}
        </Button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Provided values
   --------------------------------------------------------------------- */

/**
 * Values made available somewhere: inside an event, or inside a step's
 * section. Each has a name, a code name, a type and the code that reads it.
 */
export function ProvidedEditor({ values, onChange, codePlaceholder = "member.user", addLabel = "Add a value", allowId = false }) {
  const set = (index, fields) => onChange(values.map((v, n) => (n === index ? { ...v, ...fields } : v)));
  return (
    <div className="dfb-pack-cards">
      {values.map((value, index) => (
        <div className="dfb-pack-card dfb-pack-card--open" key={index}>
          <div className="dfb-pack-card__head">
            <span className="dfb-pack-card__dot" aria-hidden>
              <i className="fa-solid fa-circle-dot" />
            </span>
            <TextInput value={value.label} placeholder="Name people see" maxLength={PACK_LIMITS.label} onChange={(event) => onChange(values.map((v, n) => (n === index ? relabel(v, event.target.value) : v)))} aria-label="Name" />
            <div className="dfb-pack-card__kind">
              <TypeSelect value={value.type} onChange={(type) => set(index, { type })} />
            </div>
            <div className="dfb-pack-card__tools">
              <IconButton icon="fa-solid fa-trash-can" label="Remove" size="sm" tone="danger" onClick={() => onChange(values.filter((_, n) => n !== index))} />
            </div>
          </div>
          <div className="dfb-pack-card__body dfb-pack-row">
            <Field label="Code" help={allowId ? "Where the value is. {{id}} is the step's own suffix." : "Where the value is, like a parameter of the event."}>
              <TextInput value={value.code} placeholder={codePlaceholder} maxLength={PACK_LIMITS.text} style={{ fontFamily: "var(--dfb-mono)" }} onChange={(event) => set(index, { code: event.target.value })} />
            </Field>
            <Field label="Code name">
              <TextInput value={value.key} maxLength={40} style={{ fontFamily: "var(--dfb-mono)" }} onChange={(event) => set(index, { key: event.target.value.replace(/[^A-Za-z0-9_]/g, "") })} />
            </Field>
          </div>
        </div>
      ))}
      {values.length < PACK_LIMITS.provided && (
        <Button
          variant="ghost"
          icon="fa-solid fa-plus"
          className="dfb-pack-add"
          onClick={() => onChange([...values, { key: freeKey("value", new Set(values.map((v) => v.key))), label: "", type: null, code: "", description: "" }])}
        >
          {addLabel}
        </Button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Code
   --------------------------------------------------------------------- */

/**
 * A code template box.
 *
 * @param {object} props
 * @param {Array<{ token: string, label: string, help?: string }>} props.tokens  placeholders to offer
 */
export function CodeTemplate({ label, ariaLabel = "Code", help, value, onChange, tokens = [], placeholder, minRows = 4, error, max = PACK_LIMITS.code }) {
  const box = useRef(null);

  const insert = (token) => {
    const node = box.current;
    const text = value ?? "";
    const start = node?.selectionStart ?? text.length;
    const end = node?.selectionEnd ?? text.length;
    onChange(text.slice(0, start) + token + text.slice(end));
    requestAnimationFrame(() => {
      node?.focus();
      node?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <Field label={label} help={help} error={error}>
      <TextArea ref={box} code aria-label={label ?? ariaLabel} value={value ?? ""} placeholder={placeholder} minRows={minRows} maxHeight={520} maxLength={max} onChange={(event) => onChange(event.target.value)} />
      {tokens.length > 0 && (
        <div className="dfb-pack-tokens" aria-label="Placeholders you can use">
          {tokens.map((token) => (
            <Tooltip key={token.token} text={token.help ?? token.label}>
              <button type="button" className={`dfb-pack-token dfb-pack-token--${token.tone ?? "input"}`} onClick={() => insert(token.token)}>
                <code>{token.token}</code>
                {token.label && <span>{token.label}</span>}
              </button>
            </Tooltip>
          ))}
        </div>
      )}
    </Field>
  );
}

/** The chips for a list of inputs: {{key}}, plus {{raw:key}} for dropdowns. */
export function inputTokens(inputs) {
  const tokens = [];
  for (const input of inputs ?? []) {
    if (!input.key) continue;
    const name = input.label || input.key;
    tokens.push({ token: `{{${input.key}}}`, label: name, help: `"${name}" as code: typed text comes out quoted, a value placed there as its code.` });
    if (input.kind === "dropdown")
      tokens.push({ token: `{{raw:${input.key}}}`, label: `${name}, as typed`, help: `"${name}" exactly as it was picked or typed, without quotes.`, tone: "raw" });
  }
  return tokens;
}
