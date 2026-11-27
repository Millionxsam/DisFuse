import { useEffect, useState } from "react";

import { DEFAULT_PINGS, FILE_FIELDS } from "../../codegen/message.js";
import { newId } from "../../model/ids.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button, Checkbox, IconButton, Modal, Tabs } from "../../ui/index.js";
import InputField from "../flow/InputField.jsx";
import ComponentTree, { makeComponent, withUniqueIds } from "./ComponentTree.jsx";
import MessagePreviewCard from "./MessagePreviewCard.jsx";
import PieceEditor from "./PieceEditor.jsx";

import "../../../styles/builder/message.css";
import { DOCS } from "../../../config/docs.js";

/* =====================================================================
   The message builder
   ---------------------------------------------------------------------
   Where send, reply, edit and DM steps get their message. In the block
   editor a message was a stack of component blocks inside the send
   block; here it's built like a document:

     left     the message's pieces (text, containers, pictures, rows of
              buttons and menus...), nested where Discord allows
     middle   the details of the selected piece
     right    a live preview, drawn the way Discord draws it

   Every change is passed up straight away (the step saves it, debounced).
   ===================================================================== */

const STARTERS = [
  { label: "Just text", icon: "fa-solid fa-font", build: (catalog) => [makeComponent(catalog, "msg_text")] },
  {
    label: "Text in a box",
    icon: "fa-regular fa-square",
    build: (catalog) => {
      const container = makeComponent(catalog, "msg_container");
      container.children = [makeComponent(catalog, "msg_text")];
      container.inputs = { useColor: { literal: true } };
      return [container];
    },
  },
  {
    label: "Text with buttons",
    icon: "fa-solid fa-hand-pointer",
    build: (catalog) => {
      const row = makeComponent(catalog, "msg_row");
      row.children = [makeComponent(catalog, "msg_button"), makeComponent(catalog, "msg_button")];
      return [makeComponent(catalog, "msg_text"), row];
    },
  },
  {
    label: "Pictures",
    icon: "fa-solid fa-images",
    build: (catalog) => [makeComponent(catalog, "msg_text"), makeComponent(catalog, "msg_gallery")],
  },
];

function FilesEditor({ files = [], onChange, scope, readOnly }) {
  const setFile = (id, key, value) =>
    onChange(
      files.map((file) => {
        if (file.id !== id) return file;
        const inputs = { ...(file.inputs ?? {}) };
        if (value === null) delete inputs[key];
        else inputs[key] = value;
        return { ...file, inputs };
      }),
    );

  return (
    <div className="dfb-mb__files">
      <h4>
        <i className="fa-solid fa-paperclip" aria-hidden /> Files
      </h4>
      <p>Attach files to the message. Show one inside it with a File piece, or in a picture gallery with attachment://name.</p>
      {files.map((file, index) => (
        <div className="dfb-group__item" key={file.id} style={{ paddingRight: 40 }}>
          <span className="dfb-group__num">File {index + 1}</span>
          {FILE_FIELDS.map((field) => (
            <InputField key={field.key} def={field} value={file.inputs?.[field.key]} onChange={(value) => setFile(file.id, field.key, value)} scope={{ ...scope, path: [], ownerId: "file" }} readOnly={readOnly} />
          ))}
          {!readOnly && (
            <div className="dfb-group__item-tools">
              <IconButton size="sm" icon="fa-solid fa-xmark" label="Remove file" tone="danger" onClick={() => onChange(files.filter((f) => f.id !== file.id))} />
            </div>
          )}
        </div>
      ))}
      {!readOnly && (
        <button type="button" className="dfb-tree__add" onClick={() => onChange([...files, { id: newId(), inputs: {} }])}>
          <i className="fa-solid fa-plus" aria-hidden /> Attach a file
        </button>
      )}
    </div>
  );
}

const PING_CHOICES = [
  { key: "users", label: "People", description: "@someone in the message notifies them." },
  { key: "roles", label: "Roles", description: "@role notifies everyone with it." },
  { key: "everyone", label: "@everyone and @here", description: "Notifies the whole server or channel." },
];

/* Who the message's pings notify. Only people by default, so nobody can
   get the bot to ping a role or @everyone for them by typing it. */
function PingsEditor({ pings, onChange, readOnly }) {
  const picked = { ...DEFAULT_PINGS, ...(pings ?? {}) };
  return (
    <div className="dfb-mb__files dfb-mb__pings">
      <h4>
        <i className="fa-solid fa-at" aria-hidden /> Allowed pings
      </h4>
      <p>Pings that aren't checked still show, but don't notify anyone.</p>
      {PING_CHOICES.map((choice) => (
        <Checkbox
          key={choice.key}
          checked={picked[choice.key]}
          label={choice.label}
          description={choice.description}
          disabled={readOnly}
          onChange={(checked) => onChange({ ...picked, [choice.key]: checked })}
        />
      ))}
    </div>
  );
}

export default function MessageBuilder({ open, onClose, value, onChange, scope = {}, title = "Message", ephemeral = false, allowFiles = true, readOnly = false }) {
  const { catalog } = useBuilder();
  const spec = value ?? { components: [], files: [] };
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("build");

  useEffect(() => {
    if (open) setSelectedId(spec.components?.[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setComponents = (components) => onChange({ ...spec, components });
  const empty = !spec.components?.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      docs={DOCS.builderMessages}
      title={`Message builder: ${title}`}
      subtitle="Build the message piece by piece. The preview shows what people will see."
      icon="fa-solid fa-message"
      iconColor="linear-gradient(135deg, #26a4af, #4fa8ff)"
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
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "build", label: "Build", icon: "fa-solid fa-hammer" },
              { value: "preview", label: "Preview", icon: "fa-solid fa-eye" },
            ]}
          />
        </div>
        <aside className="dfb-mb__tree-pane">
          <h4 className="dfb-mb__pane-title">Pieces</h4>
          {empty && !readOnly && (
            <div className="dfb-mb__starters">
              <p>Start with:</p>
              {STARTERS.map((starter) => (
                <button
                  type="button"
                  key={starter.label}
                  className="dfb-mb__starter"
                  onClick={() => {
                    const components = withUniqueIds(catalog, starter.build(catalog));
                    setComponents(components);
                    setSelectedId(components[0].id);
                  }}
                >
                  <i className={starter.icon} aria-hidden /> {starter.label}
                </button>
              ))}
            </div>
          )}
          <ComponentTree family="message" rootPlacement="root" components={spec.components ?? []} onChange={setComponents} selectedId={selectedId} onSelect={setSelectedId} readOnly={readOnly} />
          {allowFiles && <FilesEditor files={spec.files ?? []} onChange={(files) => onChange({ ...spec, files })} scope={scope} readOnly={readOnly} />}
          <PingsEditor pings={spec.pings} onChange={(pings) => onChange({ ...spec, pings })} readOnly={readOnly} />
        </aside>
        <section className="dfb-mb__editor-pane">
          <PieceEditor
            components={spec.components ?? []}
            selectedId={selectedId}
            onChange={setComponents}
            scope={scope}
            readOnly={readOnly}
            emptyText={empty ? "Pick a starter on the left, or add a piece. Then its details show up here." : "Click a piece on the left to change it."}
          />
        </section>
        <section className="dfb-mb__preview-pane">
          <h4 className="dfb-mb__pane-title">Preview</h4>
          <MessagePreviewCard spec={spec} location={scope.location} ephemeral={ephemeral} />
        </section>
      </div>
    </Modal>
  );
}
