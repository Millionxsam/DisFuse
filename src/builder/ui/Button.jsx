import { forwardRef } from "react";

import { Tooltip } from "./Popover.jsx";

/* =====================================================================
   Buttons
   ---------------------------------------------------------------------
   <Button variant="primary" icon="fa-solid fa-plus">New command</Button>

   variant: "primary" (the solid violet one, one per screen), "secondary",
            "ghost", "danger", "mint"
   size:    "sm" | "md" | "lg"
   icon / iconRight: Font Awesome classes
   loading: shows a spinner and blocks clicks
   ===================================================================== */

export const Button = forwardRef(function Button(
  { variant = "secondary", size = "md", icon, iconRight, loading = false, block = false, className = "", children, type = "button", disabled, ...rest },
  ref,
) {
  const classes = [
    "dfb-btn",
    `dfb-btn--${variant}`,
    size !== "md" && `dfb-btn--${size}`,
    block && "dfb-btn--block",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="dfb-btn__spinner" aria-hidden /> : icon ? <i className={icon} aria-hidden /> : null}
      {children}
      {iconRight && !loading ? <i className={iconRight} aria-hidden /> : null}
    </button>
  );
});

/**
 * A square button with just an icon. `label` is required: it's the
 * tooltip and what screen readers say.
 */
export const IconButton = forwardRef(function IconButton(
  { icon, label, size = "md", tone, className = "", tooltip = true, type = "button", ...rest },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={["dfb-icon-btn", size === "sm" && "dfb-icon-btn--sm", tone === "danger" && "dfb-icon-btn--danger", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <i className={icon} aria-hidden />
    </button>
  );
  return tooltip ? <Tooltip text={label}>{button}</Tooltip> : button;
});
