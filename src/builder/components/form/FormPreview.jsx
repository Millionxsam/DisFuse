import { useMemo } from "react";

import MessageContent from "../../../components/control/MessageContent";
import { emojiUrl } from "../../../components/control/discordUtils";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import useBotInfo from "../../state/useBotInfo.js";
import { useFlowContext } from "../flow/FlowContext.js";
import { DYNAMIC_CLOSE, DYNAMIC_OPEN, buildFormPreview, toDisplay } from "../message/preview.js";

import "../../../styles/workspace/message-preview.css";
import "../../../styles/workspace/modal-preview.css";

/* =====================================================================
   A form, drawn like Discord draws one
   ---------------------------------------------------------------------
   The drawing parts are the block editor's modal preview
   (components/workspace/ModalPreview.jsx), which can't be imported
   because that file also reads Blockly blocks. Same markup, same styles.
   ===================================================================== */

const ENTITY_PLACEHOLDERS = { 5: "Select a user", 6: "Select a role", 7: "Select a user or role", 8: "Select a channel" };
const PLACEHOLDER_PATTERN = new RegExp(`(${DYNAMIC_OPEN}[^${DYNAMIC_CLOSE}]*${DYNAMIC_CLOSE})`);

function PlainText({ text }) {
  if (!text) return null;
  return String(text)
    .split(PLACEHOLDER_PATTERN)
    .map((part, index) =>
      part.startsWith(DYNAMIC_OPEN) ? (
        <span className="dc-placeholder" key={index}>
          {toDisplay(part)}
        </span>
      ) : (
        part
      ),
    );
}

function OptionEmoji({ emoji }) {
  if (!emoji) return null;
  if (emoji.id) return <img className="dc-modal-emoji" src={emojiUrl(emoji.id, emoji.animated, 32)} alt={emoji.name || ""} />;
  return <span className="dc-modal-emoji">{emoji.name}</span>;
}

function Input({ component }) {
  if (!component) return <p className="dc-modal-missing">Nothing to answer with yet</p>;
  switch (component.type) {
    case 4:
      return (
        <div className={`dc-modal-input${component.style === 2 ? " paragraph" : ""}${component.value ? "" : " empty"}`}>
          <PlainText text={component.value || component.placeholder} />
        </div>
      );
    case 3:
    case 5:
    case 6:
    case 7:
    case 8: {
      const chosen = (component.options ?? []).filter((o) => o.default);
      return (
        <div className="dc-modal-input dc-modal-select">
          {chosen.length ? (
            <span className="dc-modal-select-chosen">
              {chosen.map((option, index) => (
                <span key={index}>
                  <OptionEmoji emoji={option.emoji} />
                  <PlainText text={option.label} />
                  {index < chosen.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          ) : component.hasDefaults ? (
            <span className="dc-modal-select-chosen">
              <span className="dc-placeholder">picked when the bot runs</span>
            </span>
          ) : (
            <span className="dc-modal-select-placeholder">{component.placeholder ? <PlainText text={component.placeholder} /> : ENTITY_PLACEHOLDERS[component.type] || "Make a selection"}</span>
          )}
          <i className="fa-solid fa-chevron-down" aria-hidden />
        </div>
      );
    }
    case 19: {
      const max = component.max_values ?? 1;
      return (
        <div className="dc-modal-upload">
          <i className="fa-solid fa-cloud-arrow-up" aria-hidden />
          <span>
            Drag and drop or <strong>browse</strong> {max === 1 ? "a file" : "files"}
          </span>
          {max > 1 && <small>Up to {max} files</small>}
        </div>
      );
    }
    case 21:
    case 22:
      return (
        <div className="dc-modal-choices">
          {(component.options ?? []).map((option, index) => (
            <div key={index} className={`dc-modal-choice${option.default ? " checked" : ""}`}>
              <span className={component.type === 22 ? "dc-modal-checkbox" : "dc-modal-radio"} aria-hidden="true">
                {component.type === 22 && option.default && <i className="fa-solid fa-check" />}
              </span>
              <span className="dc-modal-choice-text">
                <span className="dc-modal-choice-label">
                  <PlainText text={option.label} />
                </span>
                {option.description && (
                  <span className="dc-modal-choice-description">
                    <PlainText text={option.description} />
                  </span>
                )}
              </span>
            </div>
          ))}
          {!component.options?.length && <p className="dc-modal-missing">No choices yet</p>}
        </div>
      );
    default:
      return null;
  }
}

function Row({ row }) {
  if (row.type === 10)
    return (
      <div className="dc-modal-text">
        <MessageContent content={row.content} />
      </div>
    );

  if (row.component?.type === 23)
    return (
      <div className="dc-modal-field">
        <div className={`dc-modal-choice${row.component.default ? " checked" : ""}`}>
          <span className="dc-modal-checkbox" aria-hidden="true">
            {row.component.default && <i className="fa-solid fa-check" />}
          </span>
          <span className="dc-modal-choice-text">
            <span className="dc-modal-label">
              <PlainText text={row.label} />
            </span>
            {row.description && (
              <span className="dc-modal-description">
                <PlainText text={row.description} />
              </span>
            )}
          </span>
        </div>
      </div>
    );

  return (
    <div className="dc-modal-field">
      <div className="dc-modal-label">
        <PlainText text={row.label} />
        {row.component?.required !== false && (
          <span className="dc-modal-required" aria-label="required">
            *
          </span>
        )}
      </div>
      {row.description && (
        <div className="dc-modal-description">
          <PlainText text={row.description} />
        </div>
      )}
      <Input component={row.component} />
    </div>
  );
}

export default function FormPreview({ spec, location, notes: showNotes = true }) {
  const { catalog, builder, project } = useBuilder();
  const flow = useFlowContext();
  const bot = useBotInfo(project);
  const preview = useMemo(() => buildFormPreview(spec, { catalog, builder, info: flow?.info, location: location ?? {} }), [builder, catalog, flow?.info, location, spec]);

  return (
    <div className="dfb-discord df-discord-surface df-modal-preview">
      <div className="dc-modal">
        <div className="dc-modal-head">
          <img className="dc-modal-avatar" src={bot.avatarUrl} alt="" />
          <h2 className="dc-modal-title">{preview.title ? <PlainText text={preview.title} /> : <span className="dc-modal-untitled">Untitled form</span>}</h2>
          <span className="dc-modal-close" aria-hidden="true">
            <i className="fa-solid fa-xmark" />
          </span>
        </div>
        <div className="dc-modal-body">
          {preview.rows.map((row, index) => (
            <Row key={index} row={row} />
          ))}
          {!preview.rows.length && <p className="dc-modal-missing">No questions yet</p>}
        </div>
        <div className="dc-modal-foot">
          <span className="dc-modal-cancel">Cancel</span>
          <span className="dc-modal-submit">Submit</span>
        </div>
      </div>
      {showNotes && preview.notes.length > 0 && (
        <ul className="dfb-discord__notes">
          {preview.notes.map((note) => (
            <li key={note}>
              <i className="fa-solid fa-triangle-exclamation" aria-hidden /> {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
