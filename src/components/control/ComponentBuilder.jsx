import { useState } from "react";

import ControlModal from "./ControlModal";
import MessageComponents from "./MessageComponents";

/* =====================================================================
   Building buttons and menus
   ---------------------------------------------------------------------
   Components are the other half of "only a bot can send this": a person
   cannot post a button in Discord at all, and a bot can.

   Control is not the bot's RUNTIME, though — it drives a bot from
   outside, so a button posted from here fires an interaction that only
   the bot's own code can answer. That shapes the whole panel:

     · a CUSTOM ID is optional. Someone whose bot already listens for
       `confirm-order` types that in and the button works the moment it
       lands; leave it blank and the backend invents one, because Discord
       insists on a unique ID whether or not anything is listening.

     · a LINK button is the exception that needs no code at all. It
       carries a URL instead of an ID, Discord fires no interaction for
       it, and it works for everybody — so the style picker swaps the
       custom ID field for a link field when it's chosen.

   Nothing is sent from this panel. It hands rows back to the composer,
   which attaches them to the message being written alongside any embeds
   and any text.
   ===================================================================== */

const BUTTON_STYLES = [
  { value: "primary", label: "Primary", hint: "Blurple" },
  { value: "secondary", label: "Secondary", hint: "Grey" },
  { value: "success", label: "Success", hint: "Green" },
  { value: "danger", label: "Danger", hint: "Red" },
  { value: "link", label: "Link", hint: "Opens a URL" },
];

const STYLE_NUMBERS = {
  primary: 1,
  secondary: 2,
  success: 3,
  danger: 4,
  link: 5,
};

const SELECT_KINDS = [
  { value: "string", label: "Options you write" },
  { value: "user", label: "Members" },
  { value: "role", label: "Roles" },
  { value: "mentionable", label: "Members and roles" },
  { value: "channel", label: "Channels" },
];

const SELECT_TYPE_NUMBERS = {
  string: 3,
  user: 5,
  role: 6,
  mentionable: 7,
  channel: 8,
};

const MAX_ROWS = 5;
const MAX_BUTTONS_PER_ROW = 5;
const MAX_OPTIONS = 25;

const newButton = () => ({
  kind: "button",
  style: "primary",
  label: "",
  emoji: "",
  customId: "",
  url: "",
  disabled: false,
});

const newSelect = () => ({
  kind: "string",
  customId: "",
  placeholder: "",
  minValues: "",
  maxValues: "",
  disabled: false,
  options: [{ label: "", value: "", description: "" }],
});

const isButtonRow = (row) => row.components?.[0]?.kind === "button";

/* ---- The Discord shape --------------------------------------------------- */

/**
 * The rows as Discord will receive them.
 *
 * The backend builds this itself from the same input — it has to, since
 * a browser's word is not worth trusting — so this exists purely so the
 * preview can be rendered by the very component that draws real
 * messages. What you see in the panel is drawn by the same code that
 * will draw the message once it lands.
 */
export function toDiscordComponents(rows) {
  return (rows || [])
    .filter((row) => row.components?.length)
    .map((row) => ({
      type: 1,
      components: row.components.map((entry) =>
        entry.kind === "button" ? toDiscordButton(entry) : toDiscordSelect(entry),
      ),
    }));
}

function toDiscordButton(button) {
  const style = STYLE_NUMBERS[button.style] || 1;

  return {
    type: 2,
    style,
    ...(button.label ? { label: button.label } : {}),
    ...(parseEmoji(button.emoji) ? { emoji: parseEmoji(button.emoji) } : {}),
    ...(button.disabled ? { disabled: true } : {}),
    ...(style === 5
      ? { url: button.url }
      : { custom_id: button.customId || "control-generated" }),
  };
}

function toDiscordSelect(select) {
  const type = SELECT_TYPE_NUMBERS[select.kind] || 3;

  return {
    type,
    custom_id: select.customId || "control-generated",
    ...(select.placeholder ? { placeholder: select.placeholder } : {}),
    ...(select.disabled ? { disabled: true } : {}),
    ...(type === 3
      ? {
          options: (select.options || [])
            .filter((option) => option.label.trim())
            .map((option) => ({
              label: option.label,
              value: option.value || option.label,
              ...(option.description ? { description: option.description } : {}),
            })),
        }
      : {}),
  };
}

/** `<a:name:id>` is what a person copies out of Discord, so accept it. */
function parseEmoji(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;

  const custom = /^<(a)?:([\w~]+):(\d{15,25})>$/.exec(trimmed);
  if (custom)
    return { name: custom[2], id: custom[3], animated: Boolean(custom[1]) };

  return trimmed.includes(":") ? null : { name: trimmed };
}

/* ---- What the composer shows on its chip --------------------------------- */

export function summariseComponents(rows) {
  let buttons = 0;
  let menus = 0;

  for (const row of rows || [])
    for (const entry of row.components || [])
      if (entry.kind === "button") buttons += 1;
      else menus += 1;

  const parts = [];
  if (buttons) parts.push(`${buttons} button${buttons === 1 ? "" : "s"}`);
  if (menus) parts.push(`${menus} menu${menus === 1 ? "" : "s"}`);

  return parts.join(" and ") || "No components yet";
}

/**
 * Why the rows can't be attached yet, or null when they can.
 *
 * The same rules the backend enforces, said early: a person shouldn't
 * have to send a message to find out that a link button needs a link.
 */
export function componentsProblem(rows) {
  const live = (rows || []).filter((row) => row.components?.length);
  if (!live.length) return "Add a button or a menu first.";

  const ids = new Set();

  for (const row of live)
    for (const entry of row.components) {
      if (entry.kind === "button") {
        if (!entry.label.trim() && !entry.emoji.trim())
          return "Every button needs a label or an emoji.";

        if (!emojiLooksReal(entry.emoji))
          return "That emoji isn't one — use a real emoji, or <:name:id>.";

        if (entry.style === "link") {
          if (!/^(https?|discord):\/\/\S+$/i.test(entry.url.trim()))
            return "A link button needs a link starting with https://";
          continue;
        }
      } else if (entry.kind === "string") {
        const filled = entry.options.filter((option) => option.label.trim());
        if (!filled.length)
          return "A menu of options needs at least one option.";

        /* The value defaults to the label, so two options named the same
           thing collide even when nobody typed a value. */
        const values = new Set();
        for (const option of filled) {
          const value = (option.value.trim() || option.label.trim()).slice(0, 100);
          if (values.has(value))
            return `Two options share the value "${value}".`;
          values.add(value);
        }
      }

      const id = entry.customId.trim();
      if (!id) continue;
      if (ids.has(id)) return `Two components share the custom ID "${id}".`;
      ids.add(id);
    }

  return null;
}

/**
 * Whether what's in an emoji field could be an emoji at all.
 *
 * Typed into the wrong box, an ordinary word reaches Discord as an emoji
 * name and fails the whole message with a 50035 — so it's caught here
 * instead. No emoji contains an ASCII letter or a space; keycap emoji
 * like 1️⃣ do contain digits, so only letters and whitespace disqualify.
 */
function emojiLooksReal(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return true;

  if (/^<a?:[\w~]+:\d{15,25}>$/.test(trimmed)) return true;

  return !/[a-z\s]/i.test(trimmed);
}

/** The rows with the blank rows and half-filled options dropped. */
function tidy(rows) {
  return rows
    .filter((row) => row.components?.length)
    .map((row) => ({
      components: row.components.map((entry) =>
        entry.kind === "button"
          ? entry
          : {
              ...entry,
              options: (entry.options || []).filter((option) =>
                option.label.trim(),
              ),
            },
      ),
    }));
}

/* ---- The panel ----------------------------------------------------------- */

export default function ComponentBuilder({
  channel,
  guild,
  initial,
  onClose,
  onAttach,
}) {
  const [rows, setRows] = useState(() =>
    initial?.length ? initial : [{ components: [newButton()] }],
  );

  const problem = componentsProblem(rows);

  const editRow = (index, change) =>
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...change } : row)),
    );

  const editEntry = (rowIndex, entryIndex, change) =>
    setRows((current) =>
      current.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              components: row.components.map((entry, j) =>
                j === entryIndex ? { ...entry, ...change } : entry,
              ),
            }
          : row,
      ),
    );

  const removeEntry = (rowIndex, entryIndex) =>
    setRows((current) =>
      current
        .map((row, i) =>
          i === rowIndex
            ? {
                ...row,
                components: row.components.filter((_, j) => j !== entryIndex),
              }
            : row,
        )
        /* A row with nothing left in it is not a row. */
        .filter((row) => row.components.length),
    );

  return (
    <ControlModal
      title={`Add components to a message in #${channel?.name || "this channel"}`}
      icon="fa-solid fa-puzzle-piece"
      subtitle="Only bots can post buttons and menus. Clicks are answered by your bot's own code — or by nobody, which is fine too."
      wide
      onClose={onClose}
      footer={
        <>
          {problem && <span className="dc-modal-problem">{problem}</span>}
          <button onClick={onClose}>Cancel</button>
          <button
            className="dc-primary"
            disabled={Boolean(problem)}
            onClick={() => {
              onAttach(tidy(rows));
              onClose();
            }}
          >
            {initial?.length ? "Save components" : "Add components"}
          </button>
        </>
      }
    >
      <div className="dc-embed-builder">
        <div className="dc-component-builder">
          {rows.map((row, rowIndex) => (
            <section className="dc-builder-row" key={rowIndex}>
              <header>
                <h4>
                  Row {rowIndex + 1} ·{" "}
                  {isButtonRow(row) ? "Buttons" : "Select menu"}
                </h4>
                <button
                  className="dc-icon-button"
                  title="Remove this row"
                  onClick={() =>
                    setRows((current) =>
                      current.filter((_, i) => i !== rowIndex),
                    )
                  }
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </header>

              {row.components.map((entry, entryIndex) =>
                entry.kind === "button" ? (
                  <ButtonFields
                    key={entryIndex}
                    button={entry}
                    only={row.components.length === 1}
                    onChange={(change) =>
                      editEntry(rowIndex, entryIndex, change)
                    }
                    onRemove={() => removeEntry(rowIndex, entryIndex)}
                  />
                ) : (
                  <SelectFields
                    key={entryIndex}
                    select={entry}
                    onChange={(change) =>
                      editEntry(rowIndex, entryIndex, change)
                    }
                  />
                ),
              )}

              {isButtonRow(row) && row.components.length < MAX_BUTTONS_PER_ROW && (
                <button
                  className="dc-ghost"
                  onClick={() =>
                    editRow(rowIndex, {
                      components: [...row.components, newButton()],
                    })
                  }
                >
                  <i className="fa-solid fa-plus"></i> Add a button to this row
                </button>
              )}
            </section>
          ))}

          {rows.length < MAX_ROWS && (
            <div className="dc-field-row">
              <button
                className="dc-ghost"
                onClick={() =>
                  setRows((current) => [
                    ...current,
                    { components: [newButton()] },
                  ])
                }
              >
                <i className="fa-solid fa-plus"></i> Row of buttons
              </button>
              <button
                className="dc-ghost"
                onClick={() =>
                  setRows((current) => [
                    ...current,
                    { components: [newSelect()] },
                  ])
                }
              >
                <i className="fa-solid fa-plus"></i> Select menu
              </button>
            </div>
          )}
        </div>

        <div className="dc-embed-preview">
          <h4>Preview</h4>
          <MessageComponents
            components={toDiscordComponents(rows)}
            guild={guild}
          />
          <p className="dc-preview-note">
            <i className="fa-solid fa-circle-info"></i> Components are shown
            here the way Discord will draw them. They aren't clickable inside
            Control — your bot's code answers them once the message is sent.
          </p>
        </div>
      </div>
    </ControlModal>
  );
}

function ButtonFields({ button, only, onChange, onRemove }) {
  const isLink = button.style === "link";

  return (
    <div className="dc-builder-entry">
      <div className="dc-field-row">
        <label>
          Label
          <input
            type="text"
            maxLength={80}
            value={button.label}
            placeholder="Click me"
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </label>

        <label>
          Style
          <select
            value={button.style}
            onChange={(e) => onChange({ style: e.target.value })}
          >
            {BUTTON_STYLES.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label} — {style.hint}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="dc-field-row">
        <label>
          Emoji
          <input
            type="text"
            value={button.emoji}
            placeholder="🎉 or <:name:id>"
            onChange={(e) => onChange({ emoji: e.target.value })}
          />
        </label>

        {isLink ? (
          <label>
            Link
            <input
              type="url"
              value={button.url}
              placeholder="https://"
              onChange={(e) => onChange({ url: e.target.value })}
            />
          </label>
        ) : (
          <label>
            Custom ID
            <input
              type="text"
              maxLength={100}
              value={button.customId}
              placeholder="Random if left blank"
              onChange={(e) => onChange({ customId: e.target.value })}
            />
          </label>
        )}
      </div>

      <div className="dc-field-row">
        <label className="dc-checkbox">
          <input
            type="checkbox"
            checked={button.disabled}
            onChange={(e) => onChange({ disabled: e.target.checked })}
          />
          Show it greyed out
        </label>

        {!only && (
          <button className="dc-ghost" onClick={onRemove}>
            <i className="fa-solid fa-trash"></i> Remove button
          </button>
        )}
      </div>

      {isLink && (
        <p className="dc-builder-note">
          A link button opens the URL for whoever clicks it. Discord fires no
          interaction for one, so it needs no custom ID and no code behind it.
        </p>
      )}
    </div>
  );
}

function SelectFields({ select, onChange }) {
  const options = select.options || [];
  const editOption = (index, change) =>
    onChange({
      options: options.map((option, i) =>
        i === index ? { ...option, ...change } : option,
      ),
    });

  return (
    <div className="dc-builder-entry">
      <div className="dc-field-row">
        <label>
          Menu of
          <select
            value={select.kind}
            onChange={(e) => onChange({ kind: e.target.value })}
          >
            {SELECT_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Placeholder
          <input
            type="text"
            maxLength={150}
            value={select.placeholder}
            placeholder="Make a choice"
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
        </label>
      </div>

      <div className="dc-field-row">
        <label>
          Custom ID
          <input
            type="text"
            maxLength={100}
            value={select.customId}
            placeholder="Random if left blank"
            onChange={(e) => onChange({ customId: e.target.value })}
          />
        </label>

        <label className="narrow">
          Fewest choices
          <input
            type="number"
            min={0}
            max={25}
            value={select.minValues}
            placeholder="1"
            onChange={(e) => onChange({ minValues: e.target.value })}
          />
        </label>

        <label className="narrow">
          Most choices
          <input
            type="number"
            min={1}
            max={25}
            value={select.maxValues}
            placeholder="1"
            onChange={(e) => onChange({ maxValues: e.target.value })}
          />
        </label>
      </div>

      <label className="dc-checkbox">
        <input
          type="checkbox"
          checked={select.disabled}
          onChange={(e) => onChange({ disabled: e.target.checked })}
        />
        Show it greyed out
      </label>

      {select.kind === "string" ? (
        <section className="dc-panel-section">
          <h4>Options</h4>
          {options.map((option, index) => (
            <div className="dc-builder-option" key={index}>
              <input
                type="text"
                maxLength={100}
                placeholder="Label"
                value={option.label}
                onChange={(e) => editOption(index, { label: e.target.value })}
              />
              <input
                type="text"
                maxLength={100}
                placeholder="Value — the label, if blank"
                value={option.value}
                onChange={(e) => editOption(index, { value: e.target.value })}
              />
              {options.length > 1 ? (
                <button
                  className="dc-icon-button"
                  title="Remove this option"
                  onClick={() =>
                    onChange({ options: options.filter((_, i) => i !== index) })
                  }
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              ) : (
                <span />
              )}
              {/* Last in the row, and full width: three text boxes across
                  half a dialog leaves none of them readable. */}
              <input
                className="dc-option-description"
                type="text"
                maxLength={100}
                placeholder="Description (optional)"
                value={option.description}
                onChange={(e) =>
                  editOption(index, { description: e.target.value })
                }
              />
            </div>
          ))}

          {options.length < MAX_OPTIONS && (
            <button
              className="dc-ghost"
              onClick={() =>
                onChange({
                  options: [
                    ...options,
                    { label: "", value: "", description: "" },
                  ],
                })
              }
            >
              <i className="fa-solid fa-plus"></i> Add option
            </button>
          )}
        </section>
      ) : (
        <p className="dc-builder-note">
          Discord fills this menu in itself from the server, so there are no
          options to write.
        </p>
      )}
    </div>
  );
}
