import { useRef, useState } from "react";

import { acceptsValues } from "../../catalog/define.js";
import { literalOf } from "../../codegen/context.js";
import { newId } from "../../model/ids.js";
import { checkVariableName } from "../../model/rules.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import SecretsModal from "../settings/SecretsModal.jsx";
import {
  Button,
  ColorInput,
  IconButton,
  MultiSelect,
  NumberInput,
  Select,
  TextArea,
  TextInput,
  Toggle,
  Tooltip,
  promptText,
  toast,
} from "../../ui/index.js";
import FormField from "../form/FormField.jsx";
import MessageField from "../message/MessageField.jsx";
import ValuePicker from "./ValuePicker.jsx";
import ValuePill from "./ValuePill.jsx";

/* =====================================================================
   One input of a step, a value, an event or a message piece
   ---------------------------------------------------------------------
   <InputField def={inputDef} value={inputValue} onChange={(value, { debounce }) => ...}
               scope={{ location, path, ownerId }} />

   The control depends on the input's kind, the way the user asked:

     text      a text box to type into, plus a button to use a value
               instead; the value replaces the box
     number    a number box, plus the value button
     boolean   a checkbox (switch), plus the value button
     colour    a color picker, plus the value button
     dropdown  a real dropdown. Never takes values (like the block editor)
     multi     pick several from a list
     slot      no box: only "Choose a value" (a member, a channel...)
     code      a code box
     group     a list of small forms (poll answers, menu options)
     variable  pick which variable
     message   the message builder
     modal     the form builder

   `onChange(null)` removes what's there, so the input goes back to its
   default. Typing is sent with { debounce: true }.

   `scope` is where the input is: the step's location, the inputs it's
   nested inside (`path`), and the id of the thing that owns it, so the
   value picker can offer what's available right here.
   ===================================================================== */

const TYPING = new Set(["text", "number", "code", "colour"]);

function VariableSelect({ value, onChange, readOnly }) {
  const { builder, createVariable, can } = useBuilder();
  const NEW = "__new_variable__";
  const options = [
    ...builder.variables.map((v) => ({ value: v.id, label: v.name, icon: "fa-solid fa-box" })),
    ...(can("variables.create") ? [{ value: NEW, label: "New variable…", icon: "fa-solid fa-plus" }] : []),
  ];
  const selected = value?.ref?.kind === "variable" ? value.ref.id : null;
  const missing = selected && !builder.variables.some((v) => v.id === selected);

  const change = async (id) => {
    if (id !== NEW) return onChange({ ref: { kind: "variable", id } });
    const name = await promptText({
      title: "New variable",
      message: "A variable remembers a value while the bot runs, so any command or event can use it later. It starts out empty.",
      label: "Name",
      placeholder: "score",
      icon: "fa-solid fa-box",
      confirmLabel: "Create",
      validate: (text) => checkVariableName(text, builder.variables.map((v) => v.name)),
    });
    if (!name) return;
    try {
      const variable = createVariable(name.trim());
      onChange({ ref: { kind: "variable", id: variable.id } });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <Select value={missing ? null : selected} options={options} onChange={change} placeholder="Pick a variable" disabled={readOnly} />
      {missing && <div className="dfb-field__error">This variable was deleted. Pick another one.</div>}
    </>
  );
}

function GroupEditor({ def, items, onChange, scope, readOnly }) {
  const list = Array.isArray(items) ? items : [];
  const setItem = (id, key, value, options) =>
    onChange(
      list.map((item) => {
        if (item.id !== id) return item;
        const inputs = { ...(item.inputs ?? {}) };
        if (value === null) delete inputs[key];
        else inputs[key] = value;
        return { ...item, inputs };
      }),
      options,
    );
  const move = (index, delta) => {
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className="dfb-group">
      {list.map((item, index) => (
        <div className="dfb-group__item" key={item.id}>
          <span className="dfb-group__num">
            {def.itemLabel ?? "Item"} {index + 1}
          </span>
          {(def.fields ?? []).map((field) => (
            <InputField key={field.key} def={field} value={item.inputs?.[field.key]} onChange={(value, options) => setItem(item.id, field.key, value, options)} scope={scope} readOnly={readOnly} />
          ))}
          {!readOnly && (
            <div className="dfb-group__item-tools">
              <IconButton size="sm" icon="fa-solid fa-xmark" label="Remove" tone="danger" onClick={() => onChange(list.filter((i) => i.id !== item.id))} />
              {index > 0 && <IconButton size="sm" icon="fa-solid fa-chevron-up" label="Move up" onClick={() => move(index, -1)} />}
              {index < list.length - 1 && <IconButton size="sm" icon="fa-solid fa-chevron-down" label="Move down" onClick={() => move(index, 1)} />}
            </div>
          )}
        </div>
      ))}
      {!readOnly && (!def.maxItems || list.length < def.maxItems) && (
        <Button size="sm" icon="fa-solid fa-plus" onClick={() => onChange([...list, { id: newId(), inputs: {} }])} style={{ justifySelf: "start", alignSelf: "flex-start" }}>
          Add {(def.itemLabel ?? "item").toLowerCase()}
        </Button>
      )}
    </div>
  );
}

/* Under the Secret value's name box: the secrets saved on the project,
   to pick from, and a way to add one without leaving the step. */
function SecretSuggestions({ current, onPick }) {
  const { mode, project } = useBuilder();
  const [managing, setManaging] = useState(false);
  const names = (project?.secrets ?? []).map((secret) => secret.name);

  /* A template has no bot, so no secrets of its own: just the name the
     people who add it will save theirs under. */
  if (mode === "template")
    return (
      <div className="dfb-suggest">
        <span className="dfb-suggest__label">
          <i className="fa-solid fa-circle-info" aria-hidden /> Secrets aren't part of a template. People who add it will be asked to save a secret with this name on their own bot.
        </span>
      </div>
    );

  return (
    <div className="dfb-suggest">
      <span className="dfb-suggest__label">{names.length ? "Your secrets:" : "You haven't saved any secrets yet."}</span>
      {names.map((name) => (
        <button type="button" key={name} className={`dfb-suggest__chip ${name === current ? "dfb-suggest__chip--on" : ""}`} onClick={() => onPick(name)}>
          {name}
        </button>
      ))}
      <button type="button" className="dfb-suggest__chip dfb-suggest__chip--add" onClick={() => setManaging(true)}>
        <i className={names.length ? "fa-solid fa-gear" : "fa-solid fa-plus"} aria-hidden /> {names.length ? "Manage" : "Add a secret"}
      </button>
      <SecretsModal open={managing} onClose={() => setManaging(false)} onAdded={(name) => !current && onPick(name)} />
      {typeof current === "string" && current && !names.includes(current) && (
        <span className="dfb-suggest__missing">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden /> You don't have a secret called {current} yet, so this will be empty.
        </span>
      )}
    </div>
  );
}

export default function InputField({ def, value, onChange, scope = {}, readOnly = false, hideLabel = false, className = "" }) {
  const valueButton = useRef(null);
  const [picking, setPicking] = useState(false);

  const canUseValues = acceptsValues(def);
  const isRef = Boolean(value?.ref) && canUseValues;
  const literal = literalOf(def, value);
  const pickerScope = { location: scope.location ?? {}, path: [...(scope.path ?? []), { source: scope.ownerId, input: def.key }] };

  const set = (next) => onChange(next === undefined ? null : { literal: next }, { debounce: TYPING.has(def.kind) });
  const wide = ["message", "modal", "group", "code"].includes(def.kind) || (def.kind === "text" && def.multiline);

  const valueButtonEl = canUseValues && !readOnly && (
    <Tooltip text="Use a value instead">
      <button ref={valueButton} type="button" className="dfb-value-btn" aria-label={`Use a value for ${def.label}`} onClick={() => setPicking(true)}>
        <i className="fa-solid fa-wand-magic-sparkles" aria-hidden />
      </button>
    </Tooltip>
  );

  let control;

  if (isRef) {
    control = <ValuePill reference={value.ref} onChange={(ref, options) => onChange(ref ? { ref } : null, options)} scope={pickerScope} accepts={def.accepts} inputKind={def.kind} readOnly={readOnly} />;
  } else {
    switch (def.kind) {
      case "text": {
        const Box = def.multiline ? TextArea : TextInput;
        control = (
          <div className="dfb-input-field__row">
            <Box value={literal ?? ""} placeholder={def.placeholder ?? "Type here"} maxLength={def.maxLength} disabled={readOnly} onChange={(event) => set(event.target.value)} aria-label={def.label} />
            {valueButtonEl}
          </div>
        );
        break;
      }
      case "number":
        control = (
          <div className="dfb-input-field__row">
            <NumberInput value={literal ?? ""} min={def.min} max={def.max} step={def.step} integer={def.integer} placeholder={def.optional ? "No limit" : "0"} disabled={readOnly} onChange={(n) => (n === null ? onChange(null) : set(n))} aria-label={def.label} />
            {valueButtonEl}
          </div>
        );
        break;
      case "boolean":
        control = (
          <div className="dfb-input-field__row">
            <div className="dfb-bool">
              <Toggle checked={literal === true} disabled={readOnly} label={literal === true ? "Yes" : "No"} onChange={(on) => set(on)} />
            </div>
            {valueButtonEl}
          </div>
        );
        break;
      case "colour":
        control = (
          <div className="dfb-input-field__row">
            <ColorInput value={literal ?? def.default} disabled={readOnly} onChange={(color) => set(color)} presets={false} />
            {valueButtonEl}
          </div>
        );
        break;
      case "dropdown":
        control = <Select value={literal ?? def.default} options={def.options} disabled={readOnly} onChange={(v) => onChange({ literal: v })} ariaLabel={def.label} />;
        break;
      case "multi":
        control = <MultiSelect value={Array.isArray(literal) ? literal : []} options={def.options} disabled={readOnly} onChange={(v) => onChange({ literal: v })} ariaLabel={def.label} />;
        break;
      case "code":
        control = <TextArea code value={literal ?? ""} placeholder={def.placeholder ?? "// Your JavaScript here"} disabled={readOnly} minRows={4} onChange={(event) => set(event.target.value)} aria-label={def.label} />;
        break;
      case "slot":
        control = (
          <button ref={valueButton} type="button" className={`dfb-choose-value ${def.optional ? "" : "dfb-choose-value--missing"}`} disabled={readOnly} onClick={() => setPicking(true)}>
            <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> Choose a value
          </button>
        );
        break;
      case "variable":
        control = <VariableSelect value={value} onChange={(v) => onChange(v)} readOnly={readOnly} />;
        break;
      case "group":
        control = <GroupEditor def={def} items={literal} onChange={(items, options) => onChange({ literal: items }, options ?? { debounce: true })} scope={scope} readOnly={readOnly} />;
        break;
      case "message":
        control = <MessageField def={def} value={literal} onChange={(spec) => onChange({ literal: spec }, { debounce: true })} scope={scope} readOnly={readOnly} />;
        break;
      case "modal":
        control = <FormField def={def} value={literal} onChange={(spec) => onChange({ literal: spec }, { debounce: true })} scope={scope} readOnly={readOnly} />;
        break;
      default:
        control = <span className="dfb-field__help">This input can't be shown.</span>;
    }
  }

  return (
    <div className={`dfb-input-field ${wide ? "dfb-input-field--wide" : ""} ${className}`}>
      {!hideLabel && (
        <span className="dfb-input-field__label">
          {def.label}
          {def.optional && def.kind === "slot" && <span className="dfb-field__optional">(optional)</span>}
          {def.maxLength && def.kind === "text" && !isRef && typeof literal === "string" && literal.length > def.maxLength * 0.8 && (
            <span className="dfb-field__counter">
              {literal.length}/{def.maxLength}
            </span>
          )}
        </span>
      )}
      {control}
      {def.suggest === "secrets" && def.kind === "text" && !isRef && !readOnly && <SecretSuggestions current={literal} onPick={(name) => onChange({ literal: name })} />}
      {def.help && <span className="dfb-input-field__help">{def.help}</span>}
      {(canUseValues || def.kind === "slot") && (
        <ValuePicker
          anchor={valueButton}
          open={picking}
          onClose={() => setPicking(false)}
          scope={pickerScope}
          accepts={def.accepts}
          inputKind={def.kind}
          onPick={(ref) => {
            setPicking(false);
            onChange({ ref });
          }}
        />
      )}
    </div>
  );
}
