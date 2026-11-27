import { inputVisible, literalOf } from "../../codegen/context.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import InputField from "../flow/InputField.jsx";
import { findIn, updateIn } from "./ComponentTree.jsx";

/* =====================================================================
   The details of the piece selected in a message or form builder
   ---------------------------------------------------------------------
   Its fields are ordinary inputs, so values work here too: a text
   block can say the member's name, a button can take its label from a
   variable.
   ===================================================================== */

export default function PieceEditor({ components, selectedId, onChange, scope, readOnly, emptyText }) {
  const { catalog } = useBuilder();
  const component = selectedId ? findIn(components, selectedId) : null;
  const def = component && catalog.components.get(component.type);

  if (!def)
    return (
      <div className="dfb-mb__hint">
        <i className="fa-solid fa-hand-pointer" aria-hidden />
        <p>{emptyText}</p>
      </div>
    );

  const rawOf = (key) => literalOf(def.fields.find((f) => f.key === key), component.inputs?.[key]);
  const setField = (key, value) =>
    onChange(
      updateIn(components, component.id, (c) => {
        const inputs = { ...(c.inputs ?? {}) };
        if (value === null) delete inputs[key];
        else inputs[key] = value;
        return { ...c, inputs };
      }),
    );

  return (
    <div className="dfb-mb__piece" key={component.id}>
      <div className="dfb-mb__piece-head">
        <span className="dfb-mb__piece-icon">
          <i className={def.icon} aria-hidden />
        </span>
        <div>
          <h3>{def.label}</h3>
          <p>{def.description}</p>
        </div>
      </div>
      {def.fields.length === 0 && <p className="dfb-mb__piece-note">Nothing to set here. Add things inside it on the left.</p>}
      <div className="dfb-stack">
        {def.fields
          .filter((field) => inputVisible(field, rawOf))
          .map((field) => (
            <InputField key={field.key} def={field} value={component.inputs?.[field.key]} onChange={(value) => setField(field.key, value)} scope={{ ...scope, path: [], ownerId: def.id }} readOnly={readOnly} />
          ))}
      </div>
    </div>
  );
}
