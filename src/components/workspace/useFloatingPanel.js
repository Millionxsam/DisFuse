import { useCallback, useEffect, useRef, useState } from "react";

/* =====================================================================
   A preview panel that floats over the canvas
   ---------------------------------------------------------------------
   Shared by the message and modal previews: where the panel sits, the
   header that drags it, the native resize grip, Escape to close, and
   remembering all of that between sessions.

   The panel floats rather than docking. Docking it would reflow the
   Blockly canvas on every open and close, and Blockly's canvas reflow is
   the expensive thing this editor already works hardest to avoid.
   ===================================================================== */

const MARGIN = 12;

export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    /* Private browsing, or something else wrote nonsense there. */
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* The panel still works; it just won't be where you left it. */
  }
}

/** Keeps the panel on screen, whatever size the window is now. */
function clampPosition(position, size) {
  return {
    x: Math.min(
      Math.max(MARGIN, position.x),
      Math.max(MARGIN, window.innerWidth - size.width - MARGIN),
    ),
    y: Math.min(
      Math.max(MARGIN, position.y),
      Math.max(MARGIN, window.innerHeight - size.height - MARGIN),
    ),
  };
}

function defaultPosition(size) {
  return clampPosition(
    { x: window.innerWidth - size.width - 24, y: 110 },
    size,
  );
}

function remember(storageKey, panel) {
  const box = panel?.getBoundingClientRect();
  if (!box) return;

  writeStored(storageKey, {
    x: box.left,
    y: box.top,
    width: box.width,
    height: box.height,
  });
}

/**
 * @param {object} options
 * @param {string|null} options.active the block being previewed; the
 *   panel only exists while this is set
 * @param {string} options.storageKey where the position and size live
 * @param {{width: number, height: number}} options.defaultSize must match
 *   the panel's CSS size, which is what it opens at the first time
 * @param {() => void} options.onClose what Escape does
 */
export default function useFloatingPanel({
  active,
  storageKey,
  defaultSize,
  onClose,
}) {
  const [position, setPosition] = useState(() => defaultPosition(defaultSize));

  const panelRef = useRef(null);
  const dragRef = useRef(null);

  /* Keyed on `active` rather than run once: the component using this is
     mounted for the whole life of the editor and renders nothing until a
     preview is asked for, so at mount there is no panel to measure. */
  useEffect(() => {
    if (!active) return undefined;

    const stored = readStored(storageKey, null);

    /* Width and height are written straight onto the element rather
       than held in state and rendered. The panel has a native resize
       grip, which sets `style.width` itself — and a `style` prop
       carrying a width would undo every resize on the next redraw,
       which happens every time the user types into a block. */
    if (stored?.width && panelRef.current) {
      panelRef.current.style.width = `${stored.width}px`;
      panelRef.current.style.height = `${stored.height}px`;
    }

    if (stored?.x !== undefined)
      setPosition(
        clampPosition(stored, {
          width: stored.width ?? defaultSize.width,
          height: stored.height ?? defaultSize.height,
        }),
      );
    else setPosition(defaultPosition(defaultSize));

    function onResize() {
      setPosition((current) =>
        clampPosition(
          current,
          panelRef.current?.getBoundingClientRect() ?? defaultSize,
        ),
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

      onClose();
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
    };
    // `defaultSize` and `onClose` are constants at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, storageKey]);

  /* Remembering the size the grip was dragged to is the whole reason
     this observer exists — nothing here reads back into layout, so it
     can't loop. */
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return undefined;

    let timer = null;

    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => remember(storageKey, panel), 400);
    });

    observer.observe(panel);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [active, storageKey]);

  const onPointerDown = useCallback((event) => {
    /* The header carries the docs link and the buttons as well. */
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

  const onPointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag) return;

    setPosition(
      clampPosition(
        { x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY },
        drag,
      ),
    );
  }, []);

  const endDrag = useCallback(
    (event) => {
      if (!dragRef.current) return;

      dragRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);

      remember(storageKey, panelRef.current);
    },
    [storageKey],
  );

  return {
    panelRef,
    position,
    /** Spread onto the header that drags the panel. */
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
