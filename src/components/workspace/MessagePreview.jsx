import { useCallback, useEffect, useState } from "react";
import * as Blockly from "blockly";

import MessageComponents from "../control/MessageComponents";
import { avatarUrl, formatMessageDate } from "../control/discordUtils";
import buildMessage from "../../functions/messagePreview/buildMessage";
import { findSendBlock } from "../../functions/messagePreview/sendBlocks";
import {
  closeMessagePreview,
  openMessagePreview,
  useMessagePreviewTarget,
} from "./messagePreviewStore";
import useFloatingPanel, { readStored, writeStored } from "./useFloatingPanel";

import "../../styles/workspace/message-preview.css";

import DocsLink from "../DocsLink.jsx";
import { DOCS } from "../../config/docs.js";

/* =====================================================================
   Message preview
   ---------------------------------------------------------------------
   What one "send message" block will look like once the bot runs it,
   drawn by the same renderer the Control client uses for real messages
   from real bots.

   It is opened from a block's right-click menu and never opens itself,
   which is what makes it safe to have it follow the canvas: nothing
   appears over the workspace until somebody asks for it, and closing it
   puts the canvas back. One preview is open at a time (see
   `messagePreviewStore`), so the multi-command case — open one command's
   message, close it, open another's — is just asking again.

   Where the panel sits, and how it is dragged and resized, is shared
   with the modal preview (see `useFloatingPanel`).
   ===================================================================== */

/** Quiet time before a workspace edit redraws the preview. */
const REFRESH_DELAY_MS = 140;

const STORAGE_KEY = "dfMessagePreviewPanel";
const FOLLOW_KEY = "dfMessagePreviewFollow";

/* Must match `.df-msg-preview` in message-preview.css. */
const DEFAULT_SIZE = { width: 430, height: 520 };

/**
 * @param {object} props
 * @param {{current: object}} props.workspaceRef the injected workspace
 * @param {object} props.project so the preview can wear the bot's name
 */
export default function MessagePreview({ workspaceRef, project }) {
  const blockId = useMessagePreviewTarget();

  const [preview, setPreview] = useState(null);
  const [missing, setMissing] = useState(false);
  const [follow, setFollow] = useState(() => readStored(FOLLOW_KEY, false));

  const { panelRef, position, dragHandlers } = useFloatingPanel({
    active: blockId,
    storageKey: STORAGE_KEY,
    defaultSize: DEFAULT_SIZE,
    onClose: closeMessagePreview,
  });

  /* The store outlives this page — it is a module, and the editor is one
     route of a single-page app. Without this, leaving the workspace with
     a preview open and coming back reopens it pointing at a block id
     that no longer exists. */
  useEffect(() => closeMessagePreview, []);

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
        /* Deleted, or the user switched to another sub-workspace — block
           ids don't survive that. Saying so beats vanishing. */
        setMissing(true);
        setPreview(null);
        return;
      }

      setMissing(false);
      setPreview(buildMessage(block));
    }

    function onChange(event) {
      /* VIEWPORT_CHANGE fires on every frame of a pan; CLICK and SELECTED
         change nothing about what the message says. */
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

  /* ---- Following the selection --------------------------------------
     Off by default and switched on from inside the panel, so it can only
     ever change a preview the user already opened. */

  useEffect(() => {
    const workspace = workspaceRef?.current;
    if (!workspace || !blockId || !follow) return undefined;

    function onSelect(event) {
      if (event.type !== Blockly.Events.SELECTED) return;
      if (!event.newElementId) return;

      const selected = workspace.getBlockById(event.newElementId);
      const sending = findSendBlock(selected);

      if (sending && sending.id !== blockId) openMessagePreview(sending.id);
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

  /** Puts the block being previewed back in the middle of the canvas. */
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

  return (
    <section
      className="df-msg-preview df-discord-surface"
      ref={panelRef}
      style={{
        left: position.x,
        top: position.y,
      }}
      aria-label="Message preview"
    >
      <header className="df-msg-preview-head" {...dragHandlers}>
        <i className={`fa-solid ${preview?.icon || "fa-comment"}`}></i>

        <div className="df-msg-preview-title">
          <strong>{preview?.title || "Message preview"}</strong>
          {preview?.destination && <span>{preview.destination}</span>}
        </div>

        {/* What is being previewed is a Components V2 message, and that
            is the page that explains how the pieces fit together. */}
        <DocsLink
          page={DOCS.componentsV2}
          variant="icon"
          label="How messages are built"
        />

        <button type="button" onClick={locate} title="Find this block">
          <i className="fa-solid fa-location-crosshairs"></i>
        </button>

        <button
          type="button"
          className={follow ? "active" : ""}
          onClick={toggleFollow}
          title={
            follow
              ? "Following your selection — click to pin this message"
              : "Pinned to this message — click to follow whichever message block you select"
          }
        >
          <i
            className={`fa-solid ${follow ? "fa-arrow-pointer" : "fa-thumbtack"}`}
          ></i>
        </button>

        <button
          type="button"
          onClick={closeMessagePreview}
          title="Close the preview"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </header>

      {preview?.context && (
        <p className="df-msg-preview-context">{preview.context}</p>
      )}

      <div className="df-msg-preview-stage">
        {missing ? (
          <div className="df-msg-preview-empty">
            <i className="fa-solid fa-link-slash"></i>
            <p>
              That block isn't in this workspace any more. Right-click another
              message block to preview it.
            </p>
          </div>
        ) : (
          <div className="dc-message">
            <div className="dc-message-body">
              <div className="dc-message-gutter">
                <img
                  className="dc-avatar"
                  src={avatarUrl(author, 80)}
                  alt=""
                  loading="lazy"
                />
              </div>

              <div className="dc-message-main">
                <div className="dc-message-head">
                  <span className="dc-author">
                    {bot?.username || project?.name || "Your bot"}
                  </span>
                  <span className="dc-bot-tag">APP</span>
                  <time>{formatMessageDate(Date.now())}</time>
                </div>

                <MessageComponents
                  components={preview?.message?.components}
                  message={preview?.message}
                />

                {preview?.ephemeral === true && (
                  <div className="df-msg-preview-ephemeral">
                    <i className="fa-solid fa-eye"></i> Only you can see this
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {!missing && (
        <footer className="df-msg-preview-foot">
          <span className="df-msg-preview-count">
            {preview?.componentCount ?? 0} component
            {preview?.componentCount === 1 ? "" : "s"}
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
