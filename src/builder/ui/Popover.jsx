import {
  cloneElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { isTopLayer, pushLayer } from "./layers.js";

/* =====================================================================
   Popovers and tooltips
   ---------------------------------------------------------------------
   <Popover anchor={buttonElement} open onClose={...}>...</Popover>

   Drawn in a portal so nothing can clip it, placed under (or over, when
   there's no room below) the anchor, and kept on screen while the page
   scrolls. Clicking outside or pressing Escape closes it.

   <Tooltip text="Delete step"><button>...</button></Tooltip>
   ===================================================================== */

const GAP = 8;
const MARGIN = 10;

function measure(anchor, panel, { placement, matchWidth }) {
  const rect = anchor.getBoundingClientRect();
  const width = matchWidth ? Math.max(rect.width, panel?.offsetWidth ?? 0) : panel?.offsetWidth ?? 0;
  const height = panel?.offsetHeight ?? 0;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const below = viewportH - rect.bottom;
  const above = rect.top;
  const up = placement.startsWith("top") ? above > height + GAP || above > below : below < height + GAP && above > below;

  let top = up ? rect.top - height - GAP : rect.bottom + GAP;
  top = Math.max(MARGIN, Math.min(top, viewportH - height - MARGIN));

  let left = placement.endsWith("end") ? rect.right - width : placement.endsWith("center") ? rect.left + rect.width / 2 - width / 2 : rect.left;
  left = Math.max(MARGIN, Math.min(left, viewportW - width - MARGIN));

  return { top, left, up, minWidth: matchWidth ? rect.width : undefined };
}

export function Popover({
  anchor,
  open,
  onClose,
  placement = "bottom-start",
  matchWidth = false,
  className = "",
  children,
  role = "dialog",
  ariaLabel,
  style,
}) {
  const panel = useRef(null);
  const [position, setPosition] = useState(null);

  const place = useCallback(() => {
    const element = anchor?.current ?? anchor;
    if (!element || !panel.current) return;
    setPosition(measure(element, panel.current, { placement, matchWidth }));
  }, [anchor, matchWidth, placement]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }
    place();
    const again = () => place();
    window.addEventListener("resize", again);
    window.addEventListener("scroll", again, true);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(again) : null;
    if (observer && panel.current) observer.observe(panel.current);
    return () => {
      window.removeEventListener("resize", again);
      window.removeEventListener("scroll", again, true);
      observer?.disconnect();
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const layer = pushLayer();
    const onDown = (event) => {
      if (!isTopLayer(layer.id)) return;
      const element = anchor?.current ?? anchor;
      if (panel.current?.contains(event.target) || element?.contains?.(event.target)) return;
      onClose?.();
    };
    const onKey = (event) => {
      if (event.key !== "Escape" || !isTopLayer(layer.id)) return;
      event.stopPropagation();
      onClose?.();
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      layer.remove();
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [anchor, onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panel}
      role={role}
      aria-label={ariaLabel}
      className={`dfb-portal dfb-popover ${position?.up ? "dfb-popover--up" : ""} ${className}`}
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        minWidth: position?.minWidth,
        visibility: position ? "visible" : "hidden",
        ...style,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

/** Shows `text` above its child on hover and keyboard focus. */
export function Tooltip({ text, children, placement = "top" }) {
  const anchor = useRef(null);
  const [shown, setShown] = useState(false);
  const [position, setPosition] = useState(null);
  const bubble = useRef(null);
  const timer = useRef(null);

  const show = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(true), 280);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setShown(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    if (!shown || !anchor.current || !bubble.current) return;
    const rect = anchor.current.getBoundingClientRect();
    const box = bubble.current.getBoundingClientRect();
    const below = placement === "bottom" || rect.top < box.height + 12;
    const top = below ? rect.bottom + 8 : rect.top - box.height - 8;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - box.width / 2, window.innerWidth - box.width - 8));
    setPosition({ top, left });
  }, [placement, shown]);

  if (!text) return children;

  const child = cloneElement(children, {
    ref: (node) => {
      anchor.current = node;
      const { ref } = children;
      if (typeof ref === "function") ref(node);
      else if (ref && typeof ref === "object") ref.current = node;
    },
    onMouseEnter: (event) => {
      show();
      children.props.onMouseEnter?.(event);
    },
    onMouseLeave: (event) => {
      hide();
      children.props.onMouseLeave?.(event);
    },
    onFocus: (event) => {
      show();
      children.props.onFocus?.(event);
    },
    onBlur: (event) => {
      hide();
      children.props.onBlur?.(event);
    },
    onMouseDown: (event) => {
      hide();
      children.props.onMouseDown?.(event);
    },
  });

  return (
    <>
      {child}
      {shown &&
        createPortal(
          <div
            ref={bubble}
            role="tooltip"
            className="dfb-portal dfb-tooltip"
            style={{ top: position?.top ?? -9999, left: position?.left ?? -9999 }}
          >
            {text}
          </div>,
          document.body,
        )}
    </>
  );
}
