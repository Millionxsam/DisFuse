import { useCallback, useEffect, useRef, useState } from "react";
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

   The panel floats rather than docking. Docking it would reflow the
   Blockly canvas on every open and close, and Blockly's canvas reflow is
   the expensive thing this editor already works hardest to avoid.
   ===================================================================== */

/** Quiet time before a workspace edit redraws the preview. */
const REFRESH_DELAY_MS = 140;

const STORAGE_KEY = "dfMessagePreviewPanel";
const FOLLOW_KEY = "dfMessagePreviewFollow";

const DEFAULT_SIZE = { width: 430, height: 520 };
const MARGIN = 12;

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    /* Private browsing, or something else wrote nonsense there. */
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* The panel still works; it just won't be where you left it. */
  }
}

/** Keeps the panel on screen, whatever size the window is now. */
function clampPosition(position, size) {
  const width = size?.width ?? DEFAULT_SIZE.width;
  const height = size?.height ?? DEFAULT_SIZE.height;

  return {
    x: Math.min(
      Math.max(MARGIN, position.x),
      Math.max(MARGIN, window.innerWidth - width - MARGIN),
    ),
    y: Math.min(
      Math.max(MARGIN, position.y),
      Math.max(MARGIN, window.innerHeight - height - MARGIN),
    ),
  };
}

function defaultPosition() {
  return clampPosition(
    {
      x: window.innerWidth - DEFAULT_SIZE.width - 24,
      y: 110,
    },
    DEFAULT_SIZE,
  );
}

/**
 * @param {object} props
 * @param {{current: object}} props.workspaceRef the injected workspace
 * @param {object} props.project so the preview can wear the bot's name
 */
export default function MessagePreview({ workspaceRef, project }) {
  const blockId = useMessagePreviewTarget();

  const [preview, setPreview] = useState(null);
  const [missing, setMissing] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const [follow, setFollow] = useState(() => readStored(FOLLOW_KEY, false));

  const panelRef = useRef(null);
  const dragRef = useRef(null);

  /* The store outlives this page — it is a module, and the editor is one
     route of a single-page app. Without this, leaving the workspace with
     a preview open and coming back reopens it pointing at a block id
     that no longer exists. */
  useEffect(() => closeMessagePreview, []);

  /* ---- Where the panel sits ---------------------------------------- */

  /* Keyed on `blockId` rather than run once: this component is mounted
     for the whole life of the editor and renders nothing until a preview
     is asked for, so at mount there is no panel to measure or size. */
  useEffect(() => {
    if (!blockId) return undefined;

    const stored = readStored(STORAGE_KEY, null);

    /* Width and height are written straight onto the element rather
       than held in state and rendered. The panel has a native resize
       grip, which sets `style.width` itself — and a `style` prop
       carrying a width would undo every resize on the next redraw,
       which happens every time the user types into a block. */
    if (stored?.width && panelRef.current) {
      panelRef.current.style.width = `${stored.width}px`;
      panelRef.current.style.height = `${stored.height}px`;
    }

    if (stored?.x !== undefined) setPosition(clampPosition(stored, stored));
    else setPosition(defaultPosition());

    function onResize() {
      setPosition((current) =>
        clampPosition(current, panelRef.current?.getBoundingClientRect()),
      );
    }

    function onKeyDown(event) {
      if (event.key !== "Escape") return;

      /* Not while a Blockly field editor or a dialog is taking the key —
         Escape means "cancel that" there, not "close the preview". */
      if (
        document.querySelector(
          ".blocklyHtmlInput, dialog[open], .swal2-container",
        )
      )
        return;

      closeMessagePreview();
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [blockId]);

  /* The panel has a native resize grip. Remembering the size it was
     dragged to is the whole reason this observer exists — nothing here
     reads back into layout, so it can't loop. */
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return undefined;

    let timer = null;

    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        const box = panel.getBoundingClientRect();

        writeStored(STORAGE_KEY, {
          x: box.left,
          y: box.top,
          width: box.width,
          height: box.height,
        });
      }, 400);
    });

    observer.observe(panel);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [blockId]);

  const startDrag = useCallback((event) => {
    /* The header carries the docs link and the three buttons as well. */
    if (event.target.closest("button, a")) return;
    if (event.button !== 0) return;

    const panel = panelRef.current;
    if (!panel) return;

    const box = panel.getBoundingClientRect();

    dragRef.current = {
      offsetX: event.clientX - box.left,
      offsetY: event.clientY - box.top,
      width: box.width,
      height: box.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, []);

  const onDrag = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag) return;

    setPosition(
      clampPosition(
        { x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY },
        drag,
      ),
    );
  }, []);

  const endDrag = useCallback((event) => {
    if (!dragRef.current) return;

    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    const box = panelRef.current?.getBoundingClientRect();
    if (box)
      writeStored(STORAGE_KEY, {
        x: box.left,
        y: box.top,
        width: box.width,
        height: box.height,
      });
  }, []);

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
      <header
        className="df-msg-preview-head"
        onPointerDown={startDrag}
        onPointerMove={onDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
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
