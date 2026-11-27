import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { OpError } from "../../model/ops.js";
import {
  LIMITS,
  LOCALES,
  OPTION_TYPES,
  checkChoice,
  checkContextMenuName,
  checkDescription,
  checkName,
  isStructural,
} from "../../model/rules.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Badge, Button, Field, IconButton, Modal, NumberInput, Select, TextArea, TextInput } from "../../ui/index.js";
import { newId } from "../../model/ids.js";

/* =====================================================================
   Pieces shared by the command, option and event pages
   ===================================================================== */

/** "Ban User!" → "ban-user": a suggestion for a slash command name. */
export function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITS.nameLength);
}

/**
 * A text field that checks what's typed as you go and saves it when
 * it's valid. Invalid text stays in the box with the reason under it;
 * it's never saved.
 *
 * @param {object} props
 * @param {string} props.value       what's saved
 * @param {(text) => string|null} [props.validate]
 * @param {(text) => void} props.onSave  may throw OpError (shown inline)
 */
export function ValidatedText({ label, value, validate, onSave, multiline = false, maxLength, placeholder, help, suggest, disabled, mono = false }) {
  const [text, setText] = useState(value ?? "");
  const [error, setError] = useState(null);
  const focused = useRef(false);

  /* Follow the saved value when it changes from elsewhere (a reload),
     but never while someone is typing in this box. */
  useEffect(() => {
    if (!focused.current) {
      setText(value ?? "");
      setError(null);
    }
  }, [value]);

  const change = (next) => {
    setText(next);
    const problem = validate?.(next) ?? null;
    setError(problem);
    if (problem || next === value) return;
    try {
      onSave(next);
    } catch (thrown) {
      if (thrown instanceof OpError) setError(thrown.message);
      else throw thrown;
    }
  };

  const suggestion = error && suggest ? suggest(text) : null;
  const Input = multiline ? TextArea : TextInput;

  return (
    <Field label={label} error={error} help={help} counter={maxLength ? { value: [...text].length, max: maxLength } : null}>
      <Input
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        invalid={Boolean(error)}
        style={mono ? { fontFamily: "var(--dfb-mono)" } : undefined}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          if (error) {
            setText(value ?? "");
            setError(null);
          }
        }}
        onChange={(event) => change(event.target.value)}
      />
      {suggestion && suggestion !== text && !validate?.(suggestion) && (
        <button type="button" className="dfb-btn dfb-btn--ghost dfb-btn--sm" style={{ justifySelf: "start", alignSelf: "flex-start" }} onMouseDown={(event) => event.preventDefault()} onClick={() => change(suggestion)}>
          <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> Use “{suggestion}” instead
        </button>
      )}
    </Field>
  );
}

/* ---------------------------------------------------------------------
   New command
   --------------------------------------------------------------------- */

const COMMAND_KINDS = [
  { value: "slash", label: "Slash command", icon: "fa-solid fa-slash", tint: "#35d0a0", description: "People type it in chat, like /ping." },
  { value: "user", label: "Right-click on a user", icon: "fa-solid fa-user", tint: "#4fa8ff", description: "Shows up under Apps when you right-click someone." },
  { value: "message", label: "Right-click on a message", icon: "fa-solid fa-message", tint: "#e23fe2", description: "Shows up under Apps when you right-click a message." },
];

export function NewCommandModal({ open, onClose }) {
  const { builder, createCommand, paths } = useBuilder();
  const navigate = useNavigate();
  const [kind, setKind] = useState("slash");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (open) {
      setKind("slash");
      setName("");
      setDescription("");
      setTouched({});
      setServerError(null);
    }
  }, [open]);

  const slash = kind === "slash";
  const taken = builder.commands.some((c) => (c.kind ?? "slash") === kind && c.name.toLowerCase() === name.toLowerCase());
  const nameError = (slash ? checkName(name) : checkContextMenuName(name)) ?? (taken ? `You already have a command called ${slash ? "/" : ""}${name}.` : null);
  const descriptionError = slash ? checkDescription(description) : null;
  const suggestion = slash && nameError && !taken ? slugify(name) : null;

  const submit = (event) => {
    event?.preventDefault();
    setTouched({ name: true, description: true });
    if (nameError || descriptionError) return;
    try {
      const command = createCommand({ kind, name, description: slash ? description : undefined });
      onClose();
      navigate(`${paths.workspace}/commands/${command.id}`);
    } catch (error) {
      if (error instanceof OpError) setServerError(error.message);
      else throw error;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New command"
      subtitle="Commands are registered with Discord by your bot when it starts."
      icon="fa-solid fa-terminal"
      iconColor="var(--dfb-grad-mint)"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="fa-solid fa-plus" onClick={submit}>
            Create command
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="dfb-stack">
        <div className="dfb-kinds" role="radiogroup" aria-label="Kind of command">
          {COMMAND_KINDS.map((option) => (
            <button
              type="button"
              role="radio"
              aria-checked={kind === option.value}
              key={option.value}
              className={`dfb-kind ${kind === option.value ? "dfb-kind--active" : ""}`}
              style={{ "--tint": option.tint }}
              onClick={() => setKind(option.value)}
            >
              <i className={option.icon} aria-hidden />
              <b>{option.label}</b>
              <span>{option.description}</span>
            </button>
          ))}
        </div>

        <Field
          label="Name"
          error={touched.name ? nameError : null}
          help={slash ? "Lowercase letters, numbers, dashes and underscores. No spaces." : "Up to 32 characters. Spaces and capitals are fine."}
          counter={{ value: [...name].length, max: LIMITS.nameLength }}
        >
          <TextInput
            value={name}
            placeholder={slash ? "ping" : "Give a cookie"}
            invalid={touched.name && Boolean(nameError)}
            onChange={(event) => {
              setName(event.target.value);
              setTouched((t) => ({ ...t, name: true }));
              setServerError(null);
            }}
            data-autofocus
          />
          {touched.name && suggestion && suggestion !== name && (
            <button type="button" className="dfb-btn dfb-btn--ghost dfb-btn--sm" style={{ justifySelf: "start", alignSelf: "flex-start" }} onClick={() => setName(suggestion)}>
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> Use “{suggestion}” instead
            </button>
          )}
        </Field>

        {slash && (
          <Field
            label="Description"
            error={touched.description ? descriptionError : null}
            help="Shown under the name when people pick the command."
            counter={{ value: [...description].length, max: LIMITS.descriptionLength }}
          >
            <TextInput
              value={description}
              placeholder="Checks if the bot is awake"
              invalid={touched.description && Boolean(descriptionError)}
              onChange={(event) => {
                setDescription(event.target.value);
                setTouched((t) => ({ ...t, description: true }));
              }}
            />
          </Field>
        )}

        {(name || description) && (
          <div>
            <div className="dfb-field__label" style={{ marginBottom: 6 }}>
              How it looks in Discord
            </div>
            <div className="dfb-name-preview">
              {slash ? (
                <>
                  <b>/{name || "name"}</b> <span>{description || "description"}</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-grip" aria-hidden /> Apps <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.7em" }} aria-hidden /> <b>{name || "name"}</b>
                </>
              )}
            </div>
          </div>
        )}

        {serverError && <div className="dfb-field__error">{serverError}</div>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   Adding an option, subcommand or group
   --------------------------------------------------------------------- */

const TYPE_ORDER = [3, 4, 10, 5, 6, 7, 8, 9, 11, 1, 2];
const TYPE_TINTS = { 1: "#8b6cff", 2: "#e23fe2", 3: "#35d0a0", 4: "#4fa8ff", 10: "#4fa8ff", 5: "#ffb648", 6: "#57b8ff", 7: "#4fd1c5", 8: "#f472b6", 9: "#f472b6", 11: "#94a3b8" };

/** Why an option of `type` can't be added to `parent` (a command or option), or null. */
export function placementProblem(command, parent, type) {
  const siblings = parent ? parent.options ?? [] : command.options ?? [];
  const structural = isStructural({ type });
  if (siblings.length >= LIMITS.optionsPerLevel) return `Discord allows up to ${LIMITS.optionsPerLevel} here.`;
  if (!parent) {
    if (structural && siblings.some((o) => !isStructural(o))) return "A command can't have subcommands and other options together. Remove the options first.";
    if (!structural && siblings.some(isStructural)) return "This command has subcommands, so options go inside a subcommand.";
    return null;
  }
  if (parent.type === 2 && type !== 1) return "Groups can only hold subcommands.";
  if (parent.type === 1 && structural) return "Subcommands can't hold subcommands or groups.";
  return null;
}

export function AddOptionModal({ open, onClose, command, parent }) {
  const { createOption, paths } = useBuilder();
  const navigate = useNavigate();
  const [type, setType] = useState(3);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState(null);

  const types = TYPE_ORDER.map((t) => ({ type: t, ...OPTION_TYPES[t], problem: placementProblem(command, parent, t) }));

  useEffect(() => {
    if (!open) return;
    setType(types.find((t) => !t.problem)?.type ?? 3);
    setName("");
    setDescription("");
    setTouched(false);
    setServerError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const siblings = parent ? parent.options ?? [] : command.options ?? [];
  const nameError = checkName(name) ?? (siblings.some((o) => o.name === name) ? `There's already one called ${name} here.` : null);
  const descriptionError = checkDescription(description);
  const noun = type === 1 ? "subcommand" : type === 2 ? "group" : "option";

  const submit = (event) => {
    event?.preventDefault();
    setTouched(true);
    if (nameError || descriptionError || types.find((t) => t.type === type)?.problem) return;
    try {
      const option = createOption(command.id, parent?.id ?? null, { type, name, description });
      onClose();
      if (type === 1 || type === 2) navigate(`${paths.workspace}/commands/${command.id}/options/${option.id}`);
    } catch (error) {
      if (error instanceof OpError) setServerError(error.message);
      else throw error;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={parent?.type === 2 ? "New subcommand" : "Add to the command"}
      subtitle={parent?.type === 2 ? `Inside ${parent.name}.` : "Options are the extra things people fill in when they use the command."}
      icon="fa-solid fa-sliders"
      iconColor="var(--dfb-grad-cool)"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="fa-solid fa-plus" onClick={submit}>
            Add {noun}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="dfb-stack">
        <div className="dfb-kinds" role="radiogroup" aria-label="Type" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
          {types.map((t) => (
            <button
              type="button"
              role="radio"
              aria-checked={type === t.type}
              key={t.type}
              disabled={Boolean(t.problem)}
              title={t.problem ?? undefined}
              className={`dfb-kind ${type === t.type ? "dfb-kind--active" : ""}`}
              style={{ "--tint": TYPE_TINTS[t.type], ...(t.problem ? { opacity: 0.4, cursor: "not-allowed" } : {}) }}
              onClick={() => setType(t.type)}
            >
              <i className={t.icon} aria-hidden />
              <b>{t.label}</b>
              <span>{t.problem ?? t.description}</span>
            </button>
          ))}
        </div>
        <div className="dfb-grid-2">
          <Field label="Name" error={touched ? nameError : null} help="Lowercase, no spaces." counter={{ value: [...name].length, max: LIMITS.nameLength }}>
            <TextInput
              value={name}
              placeholder={type === 1 ? "add" : type === 2 ? "roles" : "user"}
              invalid={touched && Boolean(nameError)}
              onChange={(event) => {
                setName(event.target.value);
                setTouched(true);
              }}
              data-autofocus
            />
            {touched && nameError && slugify(name) !== name && slugify(name) && !checkName(slugify(name)) && (
              <button type="button" className="dfb-btn dfb-btn--ghost dfb-btn--sm" style={{ justifySelf: "start", alignSelf: "flex-start" }} onClick={() => setName(slugify(name))}>
                <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> Use “{slugify(name)}”
              </button>
            )}
          </Field>
          <Field label="Description" error={touched ? descriptionError : null} counter={{ value: [...description].length, max: LIMITS.descriptionLength }}>
            <TextInput value={description} placeholder="Who to give the role to" invalid={touched && Boolean(descriptionError)} onChange={(event) => setDescription(event.target.value)} />
          </Field>
        </div>
        {serverError && <div className="dfb-field__error">{serverError}</div>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   The list of options on a command or subcommand
   --------------------------------------------------------------------- */

export function OptionList({ command, parent, emptyText }) {
  const { paths, reorderOptions, readOnly, can } = useBuilder();
  const canReorder = !readOnly && can("options.reorder");
  const options = parent ? parent.options ?? [] : command.options ?? [];

  if (!options.length)
    return <p style={{ margin: 0, color: "var(--dfb-faint)", fontSize: "0.9rem" }}>{emptyText}</p>;

  const move = (index, delta) => {
    const order = options.map((o) => o.id);
    const [id] = order.splice(index, 1);
    order.splice(index + delta, 0, id);
    reorderOptions(command.id, parent?.id ?? null, order);
  };

  return (
    <div className="dfb-list">
      {options.map((option, index) => {
        const type = OPTION_TYPES[option.type];
        const children = option.options?.length ?? 0;
        return (
          <div key={option.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Link to={`${paths.workspace}/commands/${command.id}/options/${option.id}`} className="dfb-list-item" style={{ "--tint": TYPE_TINTS[option.type], animationDelay: `${index * 40}ms` }}>
              <span className="dfb-list-item__icon">
                <i className={type?.icon} aria-hidden />
              </span>
              <span className="dfb-list-item__text">
                <span className="dfb-list-item__title">
                  <code>{option.name}</code>
                  <Badge>{type?.label}</Badge>
                  {option.required && <Badge tone="amber">Required</Badge>}
                </span>
                <span className="dfb-list-item__sub">
                  {option.description}
                  {option.type === 2 && ` · ${children} subcommand${children === 1 ? "" : "s"}`}
                  {option.type === 1 && ` · ${option.actions?.length ?? 0} step${option.actions?.length === 1 ? "" : "s"}`}
                </span>
              </span>
              <i className="fa-solid fa-chevron-right dfb-list-item__chevron" aria-hidden />
            </Link>
            {canReorder && options.length > 1 && (
              <span style={{ display: "grid" }}>
                <IconButton icon="fa-solid fa-chevron-up" label="Move up" size="sm" disabled={index === 0} onClick={() => move(index, -1)} />
                <IconButton icon="fa-solid fa-chevron-down" label="Move down" size="sm" disabled={index === options.length - 1} onClick={() => move(index, 1)} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Steps summary: "what happens"
   --------------------------------------------------------------------- */

export function StepsSummary({ actions = [], issues, to, title = "What happens", description }) {
  const { catalog } = useBuilder();
  const count = useMemo(() => {
    let n = 0;
    const walk = (list) =>
      (list ?? []).forEach((action) => {
        n += 1;
        Object.values(action.branches ?? {}).forEach((entries) =>
          (entries ?? []).forEach((entry) => (entry.actions ? walk(entry.actions) : walk([entry]))),
        );
      });
    walk(actions);
    return n;
  }, [actions]);
  const problemCount = issues ? [...issues.values()].reduce((n, list) => n + list.filter((i) => i.level !== "info").length, 0) : 0;

  return (
    <div className="dfb-steps-summary">
      <div className="dfb-steps-summary__head">
        <div>
          <h2>
            <i className="fa-solid fa-diagram-project" aria-hidden /> {title}
          </h2>
          <p>
            {description ??
              (!count
                ? "Nothing yet. Open the builder and add the first step."
                : count > actions.length
                  ? `${count} steps in all, counting the ones inside other steps.`
                  : `${count === 1 ? "1 step" : `${count} steps`}, run top to bottom.`)}
          </p>
        </div>
        <Link to={to} className="dfb-btn dfb-btn--primary dfb-btn--lg">
          <i className="fa-solid fa-hammer" aria-hidden /> Open builder
        </Link>
      </div>
      {actions.length > 0 && (
        <ol className="dfb-steps-summary__list">
          {actions.slice(0, 6).map((action, index) => {
            const def = catalog.actions.get(action.type);
            const cat = catalog.categoryById[def?.category];
            return (
              <li key={action.id} style={{ "--tint": cat?.color ?? "#8b6cff", animationDelay: `${index * 50}ms` }} className={action.disabled ? "is-off" : ""}>
                <span className="dfb-steps-summary__dot">
                  <i className={def?.icon ?? cat?.icon ?? "fa-solid fa-circle"} aria-hidden />
                </span>
                {def?.label ?? "Unknown step"}
              </li>
            );
          })}
          {actions.length > 6 && <li className="dfb-steps-summary__more">+{actions.length - 6} more</li>}
        </ol>
      )}
      {problemCount > 0 && (
        <div className="dfb-note dfb-note--amber" style={{ marginTop: 14 }}>
          <i className="fa-solid fa-triangle-exclamation" aria-hidden />
          <div>
            {problemCount} thing{problemCount === 1 ? "" : "s"} to fix in these steps. Open the builder to see where.
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Choices / suggestions and translations
   --------------------------------------------------------------------- */

/**
 * A list of { id, name, value } rows (preset choices, or suggestions).
 * Saves the whole list on every change; invalid rows are shown but
 * nothing is saved until they're fixed.
 */
export function ChoicesEditor({ type, value = [], onSave, max, noun = "choice", disabled }) {
  const [rows, setRows] = useState(value);
  const [error, setError] = useState(null);
  const numeric = type === 4 || type === 10;

  useEffect(() => setRows(value), [value]);

  const commit = (next) => {
    setRows(next);
    const problem = next.map((row) => checkChoice(type, row)).find(Boolean) ?? null;
    setError(problem);
    if (problem) return;
    try {
      onSave(next.map((row) => ({ ...row, value: numeric ? Number(row.value) : String(row.value) })));
    } catch (thrown) {
      if (thrown instanceof OpError) setError(thrown.message);
      else throw thrown;
    }
  };

  return (
    <div className="dfb-choices">
      {rows.map((row, index) => (
        <div className="dfb-choice" key={row.id}>
          <TextInput aria-label={`${noun} ${index + 1} name`} value={row.name} placeholder="Shown to people" disabled={disabled} maxLength={100} onChange={(event) => commit(rows.map((r) => (r.id === row.id ? { ...r, name: event.target.value } : r)))} />
          {numeric ? (
            <NumberInput aria-label={`${noun} ${index + 1} value`} value={row.value} integer={type === 4} disabled={disabled} placeholder="Value" onChange={(n) => commit(rows.map((r) => (r.id === row.id ? { ...r, value: n ?? "" } : r)))} />
          ) : (
            <TextInput aria-label={`${noun} ${index + 1} value`} value={row.value} placeholder="What your steps get" disabled={disabled} maxLength={100} onChange={(event) => commit(rows.map((r) => (r.id === row.id ? { ...r, value: event.target.value } : r)))} />
          )}
          <IconButton icon="fa-solid fa-trash-can" label={`Remove this ${noun}`} tone="danger" size="sm" disabled={disabled} onClick={() => commit(rows.filter((r) => r.id !== row.id))} />
        </div>
      ))}
      {error && <div className="dfb-field__error">{error}</div>}
      <div className="dfb-row">
        <Button size="sm" icon="fa-solid fa-plus" disabled={disabled || rows.length >= max} onClick={() => setRows([...rows, { id: newId(), name: "", value: numeric ? "" : "" }])}>
          Add {noun}
        </Button>
        <span style={{ color: "var(--dfb-faint)", fontSize: "0.8rem" }}>
          {rows.length}/{max}
        </span>
      </div>
    </div>
  );
}

/** Names (and descriptions) in other languages. */
export function LocalizationsEditor({ names = {}, descriptions, onSaveNames, onSaveDescriptions, nameCheck, disabled }) {
  const [open, setOpen] = useState(Object.keys(names).length > 0);
  const [locale, setLocale] = useState(LOCALES.find((l) => !names[l.value])?.value ?? "fr");
  const used = new Set([...Object.keys(names), ...Object.keys(descriptions ?? {})]);

  if (!open)
    return (
      <Button size="sm" variant="ghost" icon="fa-solid fa-language" onClick={() => setOpen(true)}>
        Add translations
      </Button>
    );

  return (
    <div className="dfb-stack">
      <div className="dfb-row">
        <div style={{ minWidth: 220 }}>
          <Select value={locale} onChange={setLocale} options={LOCALES.map((l) => ({ value: l.value, label: l.label, description: used.has(l.value) ? "Translated" : undefined }))} ariaLabel="Language" />
        </div>
        <span style={{ color: "var(--dfb-faint)", fontSize: "0.82rem" }}>People whose Discord is in this language see these instead.</span>
      </div>
      <div className={descriptions ? "dfb-grid-2" : ""}>
        <ValidatedText
          key={`name-${locale}`}
          label={`Name in ${LOCALES.find((l) => l.value === locale)?.label}`}
          value={names[locale] ?? ""}
          maxLength={LIMITS.nameLength}
          disabled={disabled}
          validate={(text) => (text && nameCheck ? nameCheck(text) : null)}
          onSave={(text) => onSaveNames({ ...names, [locale]: text })}
        />
        {descriptions && (
          <ValidatedText
            key={`description-${locale}`}
            label="Description"
            value={descriptions[locale] ?? ""}
            maxLength={LIMITS.descriptionLength}
            disabled={disabled}
            onSave={(text) => onSaveDescriptions({ ...descriptions, [locale]: text })}
          />
        )}
      </div>
      {used.size > 0 && (
        <div className="dfb-row">
          {[...used].map((code) => (
            <button key={code} type="button" className="dfb-chip" onClick={() => setLocale(code)} style={code === locale ? { "--chip-bg": "rgba(139,108,255,0.2)" } : undefined}>
              <i className="fa-solid fa-language" aria-hidden /> {LOCALES.find((l) => l.value === code)?.label ?? code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
