import { useRef, useState } from "react";

import { inputVisible, literalOf } from "../../codegen/context.js";
import { describeRef, typeMismatch } from "../../model/scope.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button, Popover } from "../../ui/index.js";
import { useFlowContext } from "./FlowContext.js";
import InputField from "./InputField.jsx";
import ValuePicker from "./ValuePicker.jsx";

/* =====================================================================
   A placed value
   ---------------------------------------------------------------------
   The colored pill that replaces an input's box once a value is put in
   it ("Member's nickname"). Clicking it opens the value's own inputs,
   so a value can take values too (the nickname OF which member?), plus
   Change and Remove.

   A value that no longer fits (its event changed, its variable was
   deleted, the step moved) turns red and says why.
   ===================================================================== */

export default function ValuePill({ reference, onChange, scope, accepts, inputKind, readOnly }) {
  const { builder, catalog } = useBuilder();
  const flow = useFlowContext();
  const anchor = useRef(null);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);

  const described = describeRef(reference, { catalog, builder, info: flow?.info, location: scope.location, path: scope.path });
  const mismatch = described.valid ? typeMismatch(described.output, accepts, inputKind) : "";
  const problem = described.valid ? mismatch : described.reason;
  const def = reference.kind === "value" ? described.def : null;
  const hasInputs = Boolean(def?.inputs?.length);

  const open = () => {
    if (readOnly && !hasInputs) return;
    if (hasInputs) setEditing(true);
    else setPicking(true);
  };

  const setInner = (key, value) => {
    const inputs = { ...(reference.inputs ?? {}) };
    if (value === null) delete inputs[key];
    else inputs[key] = value;
    onChange({ ...reference, inputs }, { debounce: true });
  };

  const rawOf = (key) => literalOf(def?.inputs?.find((i) => i.key === key), reference.inputs?.[key]);
  const summary = hasInputs
    ? def.inputs
        .filter((i) => inputVisible(i, rawOf))
        .map((i) => {
          const v = reference.inputs?.[i.key];
          if (v?.ref) {
            const inner = describeRef(v.ref, { catalog, builder, info: flow?.info, location: scope.location, path: scope.path });
            return inner.valid ? inner.label : "…";
          }
          const literal = literalOf(i, v);
          if (i.kind === "dropdown") return i.options.find((o) => o.value === String(literal))?.label ?? "";
          if (typeof literal === "string") return literal ? `“${literal.slice(0, 18)}”` : "";
          return "";
        })
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <>
      <span className="dfb-pill-wrap" style={{ display: "flex", minWidth: 0 }}>
        <button
          ref={anchor}
          type="button"
          className={`dfb-pill ${problem ? "dfb-pill--invalid" : ""}`}
          style={{ "--pill": described.color }}
          onClick={open}
          title={problem || (hasInputs ? "Click to change its details" : "Click to pick a different value")}
          aria-label={`Value: ${described.label}${problem ? `. Problem: ${problem}` : ""}`}
        >
          <span className="dfb-pill__icon" style={{ background: problem ? "#ff5c5c" : described.color }}>
            <i className={problem ? "fa-solid fa-triangle-exclamation" : described.icon} aria-hidden />
          </span>
          <span className="dfb-pill__label">{described.label}</span>
          {summary && <span className="dfb-pill__sub">{summary}</span>}
          {!readOnly && (
            <span
              role="button"
              tabIndex={0}
              className="dfb-pill__remove"
              aria-label="Remove this value"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange(null);
                }
              }}
            >
              <i className="fa-solid fa-xmark" aria-hidden />
            </span>
          )}
        </button>
      </span>
      {problem && <div className="dfb-field__error">{problem}</div>}

      <Popover anchor={anchor} open={editing} onClose={() => setEditing(false)} ariaLabel={described.label}>
        <div className="dfb-pill-editor">
          <div className="dfb-pill-editor__head">
            <span className="dfb-pill__icon" style={{ background: described.color, width: 34, height: 34, fontSize: "0.85rem" }}>
              <i className={described.icon} aria-hidden />
            </span>
            <div>
              <b>{described.label}</b>
              {def?.description && <p>{def.description}</p>}
            </div>
          </div>
          {def?.inputs
            ?.filter((inputDef) => inputVisible(inputDef, rawOf))
            .map((inputDef) => (
              <InputField
                key={inputDef.key}
                def={inputDef}
                value={reference.inputs?.[inputDef.key]}
                onChange={(value) => setInner(inputDef.key, value)}
                scope={{ location: scope.location, path: scope.path, ownerId: def.id }}
                readOnly={readOnly}
              />
            ))}
          {!readOnly && (
            <div className="dfb-row" style={{ justifyContent: "space-between" }}>
              <Button
                size="sm"
                variant="ghost"
                icon="fa-solid fa-trash-can"
                onClick={() => {
                  setEditing(false);
                  onChange(null);
                }}
              >
                Remove
              </Button>
              <Button
                size="sm"
                icon="fa-solid fa-arrows-rotate"
                onClick={() => {
                  setEditing(false);
                  setPicking(true);
                }}
              >
                Use a different value
              </Button>
            </div>
          )}
        </div>
      </Popover>

      <ValuePicker
        anchor={anchor}
        open={picking}
        onClose={() => setPicking(false)}
        scope={scope}
        accepts={accepts}
        inputKind={inputKind}
        onPick={(ref) => {
          setPicking(false);
          onChange(ref);
        }}
      />
    </>
  );
}
