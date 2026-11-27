import { useEffect, useState } from "react";

import { MODAL_FIELDS } from "../../codegen/modal.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button, Modal, Tabs } from "../../ui/index.js";
import InputField from "../flow/InputField.jsx";
import ComponentTree, { makeComponent, withUniqueIds } from "../message/ComponentTree.jsx";
import PieceEditor from "../message/PieceEditor.jsx";
import FormPreview from "./FormPreview.jsx";

import "../../../styles/builder/message.css";
import { DOCS } from "../../../config/docs.js";

/* =====================================================================
   The form builder
   ---------------------------------------------------------------------
   Where "Show a form" gets its form (Discord calls these modals): a
   title, a form ID for "When a form is submitted" to recognise it, and
   up to five pieces: questions, each with one way to answer (a text
   box, a menu, a file upload, radio buttons, checkboxes...), and
   blocks of text. Same layout as the
   message builder, with a preview of the form.
   ===================================================================== */

/* Ways to start an empty form. Every other kind of answer is in "Add a
   question or text". */
const STARTERS = [
  { inner: "form_text_input", label: "A question with a text box", icon: "fa-solid fa-i-cursor" },
  { inner: "form_menu", label: "A question with a menu", icon: "fa-solid fa-list" },
  { inner: "form_checkboxes", label: "A question with checkboxes", icon: "fa-solid fa-list-check" },
];

export default function FormBuilder({ open, onClose, value, onChange, scope = {}, readOnly = false }) {
  const { catalog } = useBuilder();
  const spec = value ?? { inputs: {}, components: [] };
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("build");

  useEffect(() => {
    if (open) setSelectedId(spec.components?.[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setComponents = (components) => onChange({ ...spec, components });
  const setSetting = (key, next) => {
    const inputs = { ...(spec.inputs ?? {}) };
    if (next === null) delete inputs[key];
    else inputs[key] = next;
    onChange({ ...spec, inputs });
  };
  const empty = !spec.components?.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      docs={DOCS.builderForms}
      title="Form builder"
      subtitle="A pop-up form people fill in. Read their answers in the “When a form is submitted” event."
      icon="fa-solid fa-window-maximize"
      iconColor="linear-gradient(135deg, #1a8793, #35d0a0)"
      size="full"
      flush
      footer={
        <Button variant="primary" icon="fa-solid fa-check" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="dfb-mb" data-tab={tab}>
        <div className="dfb-mb__tabs">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: "build", label: "Build", icon: "fa-solid fa-hammer" }, { value: "preview", label: "Preview", icon: "fa-solid fa-eye" }]} />
        </div>
        <aside className="dfb-mb__tree-pane">
          <h4 className="dfb-mb__pane-title">Form</h4>
          <div className="dfb-stack" style={{ marginBottom: 16 }}>
            {MODAL_FIELDS.map((field) => (
              <InputField key={field.key} def={field} value={spec.inputs?.[field.key]} onChange={(next) => setSetting(field.key, next)} scope={{ ...scope, path: [], ownerId: "form" }} readOnly={readOnly} />
            ))}
          </div>
          <h4 className="dfb-mb__pane-title">Questions</h4>
          {empty && !readOnly && (
            <div className="dfb-mb__starters">
              <p>Start with:</p>
              {STARTERS.map((starter) => (
                <button
                  type="button"
                  key={starter.inner}
                  className="dfb-mb__starter"
                  onClick={() => {
                    const [question] = withUniqueIds(catalog, [makeComponent(catalog, "form_question", starter.inner)]);
                    setComponents([question]);
                    setSelectedId(question.id);
                  }}
                >
                  <i className={starter.icon} aria-hidden /> {starter.label}
                </button>
              ))}
            </div>
          )}
          <ComponentTree family="modal" rootPlacement="modal" components={spec.components ?? []} onChange={setComponents} selectedId={selectedId} onSelect={setSelectedId} readOnly={readOnly} rootLabel="Add a question or text" maxRoot={5} />
        </aside>
        <section className="dfb-mb__editor-pane">
          <PieceEditor components={spec.components ?? []} selectedId={selectedId} onChange={setComponents} scope={scope} readOnly={readOnly} emptyText="Click a question on the left to change it." />
        </section>
        <section className="dfb-mb__preview-pane">
          <h4 className="dfb-mb__pane-title">Preview</h4>
          <FormPreview spec={spec} location={scope.location} />
        </section>
      </div>
    </Modal>
  );
}
