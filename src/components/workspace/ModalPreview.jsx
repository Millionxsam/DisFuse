import { useCallback, useEffect, useState } from "react";
import * as Blockly from "blockly";

import MessageContent from "../control/MessageContent";
import { avatarUrl, emojiUrl } from "../control/discordUtils";
import buildModal from "../../functions/modalPreview/buildModal";
import { findModalBlock } from "../../functions/modalPreview/modalBlocks";
import {
  DYNAMIC_CLOSE,
  DYNAMIC_OPEN,
  toDisplay,
} from "../../functions/messagePreview/values";
import {
  closeModalPreview,
  openModalPreview,
  useModalPreviewTarget,
} from "./modalPreviewStore";
import useFloatingPanel, { readStored, writeStored } from "./useFloatingPanel";

import "../../styles/workspace/message-preview.css";
import "../../styles/workspace/modal-preview.css";

import DocsLink from "../DocsLink.jsx";
import { DOCS } from "../../config/docs.js";

/* =====================================================================
   Modal preview
   ---------------------------------------------------------------------
   What a "show modal" block will pop up on someone's screen once the
   bot runs it: the app's icon and the modal's title, each label with
   its input, and Discord's Cancel / Submit footer.

   It works exactly like the message preview beside it — opened from a
   block's right-click menu, one at a time, closed with the X or Escape,
   and reopened on any other modal block whenever it's asked for — and it
   borrows that panel's frame (`.df-msg-preview*`) so the two read as one
   feature. Only the stage differs: a message sits in a channel, a modal
   floats over a dimmed client.

   Nothing inside the modal is interactive. It is a picture of the form,
   not the form: typing into it would suggest the bot receives what was
   typed here.
   ===================================================================== */

/** Quiet time before a workspace edit redraws the preview. */
const REFRESH_DELAY_MS = 140;

const STORAGE_KEY = "dfModalPreviewPanel";
const FOLLOW_KEY = "dfModalPreviewFollow";

/* Must match `.df-modal-preview` in modal-preview.css. */
const DEFAULT_SIZE = { width: 480, height: 600 };

const NOT_INTERACTIVE = "Preview only — this is how the modal will look";

const ENTITY_PLACEHOLDERS = {
  5: "Select a user",
  6: "Select a role",
  7: "Select a user or role",
  8: "Select a channel",
};

const PLACEHOLDER_PATTERN = new RegExp(
  `(${DYNAMIC_OPEN}[^${DYNAMIC_CLOSE}]*${DYNAMIC_CLOSE})`,
);

/**
 * Plain text that may contain runtime placeholders. Labels, options and
 * placeholders are not markdown on Discord, so they don't go through
 * MessageContent — but a `{member's name}` in them still gets a chip.
 */
function PlainText({ text }) {
  if (!text) return null;

  return text.split(PLACEHOLDER_PATTERN).map((part, index) =>
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

  if (emoji.id)
    return (
      <img
        className="dc-modal-emoji"
        src={emojiUrl(emoji.id, emoji.animated, 32)}
        alt={emoji.name || ""}
      />
    );

  return <span className="dc-modal-emoji">{emoji.name}</span>;
}

/* ---- The inputs --------------------------------------------------------- */

function TextInput({ component }) {
  const paragraph = component.style === 2;
  const text = component.value || component.placeholder;

  return (
    <div
      className={`dc-modal-input${paragraph ? " paragraph" : ""}${
        component.value ? "" : " empty"
      }`}
      title={NOT_INTERACTIVE}
    >
      <PlainText text={text} />
    </div>
  );
}

function Select({ component }) {
  const chosen = (component.options ?? []).filter((option) => option.default);

  let body;

  if (chosen.length)
    body = (
      <span className="dc-modal-select-chosen">
        {chosen.map((option, index) => (
          <span key={index}>
            <OptionEmoji emoji={option.emoji} />
            <PlainText text={option.label} />
            {index < chosen.length - 1 ? ", " : ""}
          </span>
        ))}
      </span>
    );
  else if (component.hasDefaults)
    body = (
      <span className="dc-modal-select-chosen">
        <span className="dc-placeholder">pre-selected when the bot runs</span>
      </span>
    );
  else
    body = (
      <span className="dc-modal-select-placeholder">
        {component.placeholder ? (
          <PlainText text={component.placeholder} />
        ) : (
          ENTITY_PLACEHOLDERS[component.type] || "Make a selection"
        )}
      </span>
    );

  return (
    <div className="dc-modal-input dc-modal-select" title={NOT_INTERACTIVE}>
      {body}
      <i className="fa-solid fa-chevron-down"></i>
    </div>
  );
}

function FileUpload({ component }) {
  const max = component.max_values ?? 1;

  return (
    <div className="dc-modal-upload" title={NOT_INTERACTIVE}>
      <i className="fa-solid fa-cloud-arrow-up"></i>
      <span>
        Drag and drop or <strong>browse</strong>{" "}
        {max === 1 ? "a file" : "files"}
      </span>
      {max > 1 && <small>Up to {max} files</small>}
    </div>
  );
}

function Choices({ component, multiple }) {
  return (
    <div className="dc-modal-choices" title={NOT_INTERACTIVE}>
      {(component.options ?? []).map((option, index) => (
        <div
          key={index}
          className={`dc-modal-choice${option.default ? " checked" : ""}`}
        >
          <span
            className={multiple ? "dc-modal-checkbox" : "dc-modal-radio"}
            aria-hidden="true"
          >
            {multiple && option.default && (
              <i className="fa-solid fa-check"></i>
            )}
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

      {!component.options?.length && (
        <p className="dc-modal-missing">No options yet</p>
      )}
    </div>
  );
}

function Input({ component }) {
  if (!component)
    return <p className="dc-modal-missing">Nothing plugged in yet</p>;

  switch (component.type) {
    case 4:
      return <TextInput component={component} />;
    case 3:
    case 5:
    case 6:
    case 7:
    case 8:
      return <Select component={component} />;
    case 19:
      return <FileUpload component={component} />;
    case 21:
      return <Choices component={component} />;
    case 22:
      return <Choices component={component} multiple />;
    default:
      return null;
  }
}

/* ---- One row of the modal ---------------------------------------------- */

function Field({ field }) {
  if (field.type === 10)
    return (
      <div className="dc-modal-text">
        <MessageContent content={field.content} />
      </div>
    );

  /* A lone checkbox sits beside its label, the way Discord draws it,
     rather than underneath it. */
  if (field.component?.type === 23)
    return (
      <div className="dc-modal-field">
        <div
          className={`dc-modal-choice${field.component.default ? " checked" : ""}`}
          title={NOT_INTERACTIVE}
        >
          <span className="dc-modal-checkbox" aria-hidden="true">
            {field.component.default && <i className="fa-solid fa-check"></i>}
          </span>
          <span className="dc-modal-choice-text">
            <span className="dc-modal-label">
              <PlainText text={field.label} />
            </span>
            {field.description && (
              <span className="dc-modal-description">
                <PlainText text={field.description} />
              </span>
            )}
          </span>
        </div>
      </div>
    );

  return (
    <div className="dc-modal-field">
      <div className="dc-modal-label">
        <PlainText text={field.label} />
        {field.component?.required !== false && (
          <span className="dc-modal-required" aria-label="required">
            *
          </span>
        )}
      </div>

      {field.description && (
        <div className="dc-modal-description">
          <PlainText text={field.description} />
        </div>
      )}

      <Input component={field.component} />
    </div>
  );
}

/**
 * @param {object} props
 * @param {{current: object}} props.workspaceRef the injected workspace
 * @param {object} props.project so the modal can wear the bot's name
 */
export default function ModalPreview({ workspaceRef, project }) {
  const blockId = useModalPreviewTarget();

  const [preview, setPreview] = useState(null);
  const [missing, setMissing] = useState(false);
  const [follow, setFollow] = useState(() => readStored(FOLLOW_KEY, false));

  const { panelRef, position, dragHandlers } = useFloatingPanel({
    active: blockId,
    storageKey: STORAGE_KEY,
    defaultSize: DEFAULT_SIZE,
    onClose: closeModalPreview,
  });

  /* The store outlives this page, as the message preview's does. */
  useEffect(() => closeModalPreview, []);

  /* ---- Keeping up with the blocks ----------------------------------- */

  useEffect(() => {
    const workspace = workspaceRef?.current;

    if (!workspace || !blockId) {
      setPreview(null);
      setMissing(false);
      return undefined;
    }

    let timer = null;

    function refresh() {
      timer = null;

      const block = workspace.getBlockById(blockId);

      if (!block) {
        setMissing(true);
        setPreview(null);
        return;
      }

      setMissing(false);
      setPreview(buildModal(block));
    }

    function onChange(event) {
      if (
        event.type === Blockly.Events.VIEWPORT_CHANGE ||
        event.type === Blockly.Events.CLICK ||
        event.type === Blockly.Events.SELECTED ||
        event.type === Blockly.Events.BUBBLE_OPEN ||
        event.type === Blockly.Events.THEME_CHANGE
      )
        return;

      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, REFRESH_DELAY_MS);
    }

    refresh();
    workspace.addChangeListener(onChange);

    return () => {
      if (timer) clearTimeout(timer);
      workspace.removeChangeListener(onChange);
    };
  }, [blockId, workspaceRef]);

  /* ---- Following the selection -------------------------------------- */

  useEffect(() => {
    const workspace = workspaceRef?.current;
    if (!workspace || !blockId || !follow) return undefined;

    function onSelect(event) {
      if (event.type !== Blockly.Events.SELECTED) return;
      if (!event.newElementId) return;

      const modal = findModalBlock(workspace.getBlockById(event.newElementId));
      if (modal && modal.id !== blockId) openModalPreview(modal.id);
    }

    workspace.addChangeListener(onSelect);
    return () => workspace.removeChangeListener(onSelect);
  }, [blockId, follow, workspaceRef]);

  const toggleFollow = useCallback(() => {
    setFollow((current) => {
      writeStored(FOLLOW_KEY, !current);
      return !current;
    });
  }, []);

  const locate = useCallback(() => {
    const workspace = workspaceRef?.current;
    const block = workspace?.getBlockById(blockId);
    if (!block) return;

    workspace.centerOnBlock(blockId);
    block.select();
  }, [blockId, workspaceRef]);

  if (!blockId) return null;

  const bot = project?.bot;
  const author = bot?.id ? { id: bot.id, avatar: bot.avatar, bot: true } : null;
  const botName = bot?.username || project?.name || "your bot";

  const warnings = (preview?.notes ?? []).filter(
    (item) => item.level === "warn",
  ).length;

  return (
    <section
      className="df-msg-preview df-modal-preview df-discord-surface"
      ref={panelRef}
      style={{ left: position.x, top: position.y }}
      aria-label="Modal preview"
    >
      <header className="df-msg-preview-head" {...dragHandlers}>
        <i className="fa-solid fa-window-maximize"></i>

        <div className="df-msg-preview-title">
          <strong>Modal preview</strong>
          <span>
            {preview?.customId
              ? `custom ID: ${preview.customId}`
              : "Shown in a pop-up over Discord"}
            {preview?.source ? ` · ${preview.source}` : ""}
          </span>
        </div>

        <DocsLink page={DOCS.modals} variant="icon" label="How modals work" />

        <button type="button" onClick={locate} title="Find this block">
          <i className="fa-solid fa-location-crosshairs"></i>
        </button>

        <button
          type="button"
          className={follow ? "active" : ""}
          onClick={toggleFollow}
          title={
            follow
              ? "Following your selection — click to pin this modal"
              : "Pinned to this modal — click to follow whichever modal block you select"
          }
        >
          <i
            className={`fa-solid ${follow ? "fa-arrow-pointer" : "fa-thumbtack"}`}
          ></i>
        </button>

        <button
          type="button"
          onClick={closeModalPreview}
          title="Close the preview"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </header>

      {preview?.context && (
        <p className="df-msg-preview-context">{preview.context}</p>
      )}

      <div className="df-msg-preview-stage df-modal-preview-stage">
        {missing || preview?.empty ? (
          <div className="df-msg-preview-empty">
            <i
              className={`fa-solid ${missing ? "fa-link-slash" : "fa-window-maximize"}`}
            ></i>
            <p>
              {missing
                ? "That block isn't in this workspace any more. Right-click another modal block to preview it."
                : preview.empty}
            </p>
          </div>
        ) : (
          <div
            className="dc-modal"
            role="dialog"
            aria-label={toDisplay(preview?.title) || "Modal"}
          >
            <div className="dc-modal-head">
              <img
                className="dc-modal-avatar"
                src={avatarUrl(author, 64)}
                alt=""
                loading="lazy"
              />
              <h2 className="dc-modal-title">
                {preview?.title ? (
                  <PlainText text={preview.title} />
                ) : (
                  <span className="dc-modal-untitled">Untitled modal</span>
                )}
              </h2>
              <span className="dc-modal-close" aria-hidden="true">
                <i className="fa-solid fa-xmark"></i>
              </span>
            </div>

            <div className="dc-modal-body">
              {(preview?.components ?? []).map((field, index) => (
                <Field field={field} key={index} />
              ))}

              <p className="dc-modal-disclaimer">
                This form will be submitted to <strong>{botName}</strong>. Do
                not share passwords or other sensitive information.
              </p>
            </div>

            <div className="dc-modal-foot">
              <span className="dc-modal-cancel">Cancel</span>
              <span className="dc-modal-submit">Submit</span>
            </div>
          </div>
        )}
      </div>

      {!missing && (
        <footer className="df-msg-preview-foot">
          <span className="df-msg-preview-count">
            {preview?.componentCount ?? 0} of 5 components
            {warnings
              ? ` · ${warnings} problem${warnings === 1 ? "" : "s"}`
              : ""}
          </span>

          <ul className="df-msg-preview-notes">
            {(preview?.notes ?? []).map((item) => (
              <li key={item.text} className={item.level}>
                <i
                  className={`fa-solid ${
                    item.level === "warn"
                      ? "fa-triangle-exclamation"
                      : "fa-circle-info"
                  }`}
                ></i>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </section>
  );
}
