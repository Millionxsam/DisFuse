import { DOCS, docsUrl } from "../config/docs.js";

/* =====================================================================
   A link into the documentation
   ---------------------------------------------------------------------
   The same control everywhere a page can point at docs.disfuse.xyz, so
   that "where is the help button?" has one answer on every page: a
   question mark, top right of the heading.

   Three shapes, because the places that need one are not all alike:

     button  a pill beside the other page-head buttons — the default,
             and what every dashboard page uses;
     icon    the pill with the label dropped, for toolbars and card
             headers that are already full;
     inline  a text link, for sentences like "read about secrets".

   Everything opens in a new tab: a help link that navigated away from a
   half-built bot would be worse than no help link.
   ===================================================================== */

/**
 * @param {object} props
 * @param {string} [props.page]    a value from DOCS, e.g. DOCS.secrets
 * @param {string} [props.label]   the text on a `button` or `inline` link
 * @param {"button"|"icon"|"inline"} [props.variant]
 * @param {string} [props.title]   tooltip; defaults to a sensible one
 * @param {string} [props.className]
 */
export default function DocsLink({
  page = DOCS.intro,
  label = "Help",
  variant = "button",
  title,
  className = "",
}) {
  const tooltip = title || `${label} — opens the DisFuse docs`;

  return (
    <a
      href={docsUrl(page)}
      target="_blank"
      rel="noopener noreferrer"
      className={`df-docs-link df-docs-link-${variant} ${className}`.trim()}
      title={tooltip}
      aria-label={variant === "icon" ? tooltip : undefined}
    >
      <i className="fa-solid fa-circle-question" />
      {variant !== "icon" && <span>{label}</span>}
    </a>
  );
}
