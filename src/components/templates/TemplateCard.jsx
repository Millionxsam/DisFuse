import { useEffect, useState } from "react";

import UserTag from "../UserTag";
import { errorMessage } from "../../api/client.js";
import { toggleTemplateLike } from "../../api/templates.js";

/* =====================================================================
   A template in the gallery
   ---------------------------------------------------------------------
   Styled after the Explore page's project cards so the two galleries
   read as one family: name and badges, who made it, what it does, its
   likes and imports, and what you can do with it from here.

   The heart is a real button. Liking from the card rather than only from
   a template's page is what makes likes a useful signal — nobody opens a
   page to like something they already know they want.
   ===================================================================== */

/**
 * A description as a card shows it: two lines of plain text. The page
 * renders the Markdown; a card showing `**bold**` and list dashes
 * verbatim reads as broken.
 */
function plainText(markdown = "") {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`#>]+/g, "")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Official" — made by DisFuse staff. */
export function OfficialBadge({ compact = false }) {
  return (
    <span
      className="df-template-badge official"
      title="Made by the DisFuse team"
    >
      <i className="fa-solid fa-circle-check" aria-hidden="true" />
      {compact ? null : "Official"}
    </span>
  );
}

/** The badges a template can carry, in the order they matter. */
export function TemplateBadges({ template, showOwnerState = false }) {
  return (
    <>
      {template.official && <OfficialBadge />}
      {template.private && (
        <span
          className="df-template-badge private"
          title="Only you can see this"
        >
          <i className="fa-solid fa-lock" aria-hidden="true" /> Private
        </span>
      )}
      {showOwnerState && !template.published && (
        <span
          className="df-template-badge draft"
          title="Only you can see this until you publish it"
        >
          <i className="fa-solid fa-pen-ruler" aria-hidden="true" /> Draft
        </span>
      )}
      {showOwnerState && template.published && template.unpublishedChanges && (
        <span
          className="df-template-badge changes"
          title="You've changed it in the builder since you last published"
        >
          <i className="fa-solid fa-circle-half-stroke" aria-hidden="true" />{" "}
          Unpublished changes
        </span>
      )}
    </>
  );
}

/**
 * @param {object} props
 * @param {object} props.template   a card from GET /templates
 * @param {(template: object) => void} props.onOpen
 * @param {(template: object) => void} [props.onUse]   "Import" in the
 *   editor, "Use" on the dashboard
 * @param {string} [props.useLabel]
 * @param {(template: object) => void} [props.onEdit]  the owner's
 *   "Edit" — opens the builder
 * @param {object} [props.viewer]  the signed-in user
 */
export default function TemplateCard({
  template: initial,
  onOpen,
  onUse,
  useLabel = "Use",
  useIcon = "fa-solid fa-plus",
  onEdit,
  viewer,
}) {
  const [template, setTemplate] = useState(initial);
  const [liking, setLiking] = useState(false);
  const [popped, setPopped] = useState(false);
  const [likeError, setLikeError] = useState(null);

  /* A re-fetched gallery hands the same card fresher numbers. */
  useEffect(() => setTemplate(initial), [initial]);

  const own = viewer?.id && template.owner?.id === viewer.id;

  async function like(event) {
    event.stopPropagation();
    if (liking || !template.published) return;

    setLiking(true);
    setLikeError(null);

    try {
      const result = await toggleTemplateLike(template._id);
      setTemplate((current) => ({ ...current, ...result }));
      setPopped(result.liked);
    } catch (error) {
      setLikeError(errorMessage(error, "Couldn't like that"));
    } finally {
      setLiking(false);
    }
  }

  return (
    <div
      className={`df-project-card df-template-card${
        template.official ? " official" : ""
      }${!template.published ? " draft" : ""}`}
    >
      <div className="card-top">
        <div className="df-template-icon" aria-hidden="true">
          <i className="fa-solid fa-shapes" />
        </div>

        <div className="title-block">
          <h3 onClick={() => onOpen(template)} title={template.name}>
            {template.name}
          </h3>
          <div className="badges">
            <TemplateBadges template={template} showOwnerState={own} />
          </div>
        </div>
      </div>

      <div className="owner-row">
        <UserTag user={template.owner} />
      </div>

      <p className="description">
        {plainText(template.description) || (
          <span className="df-template-muted">No description</span>
        )}
      </p>

      <div className="stat-row">
        <button
          type="button"
          className={`stat-chip df-template-like${template.liked ? " active" : ""}${
            popped ? " popped" : ""
          }`}
          onClick={like}
          disabled={!template.published || liking}
          title={
            likeError ??
            (template.published
              ? template.liked
                ? "Unlike"
                : "Like"
              : "Publish it to collect likes")
          }
          aria-pressed={Boolean(template.liked)}
        >
          <i
            className={`fa-${template.liked ? "solid" : "regular"} fa-heart`}
          />
          {template.likes}
        </button>
        <span className="stat-chip" title="People who imported it">
          <i className="fa-solid fa-file-import" /> {template.imports}
        </span>
        {template.published && (
          <span className="stat-chip" title="Blocks in it">
            <i className="fa-solid fa-cube" /> {template.blockCount}
          </span>
        )}
      </div>

      <div className="card-buttons">
        {own && onEdit ? (
          <button className="primary" onClick={() => onEdit(template)}>
            <i className="fa-solid fa-pen-ruler" /> Edit
          </button>
        ) : null}

        <button
          className={own && onEdit ? "" : "primary"}
          onClick={() => onOpen(template)}
        >
          <i className="fa-solid fa-eye" /> View
        </button>

        {onUse && template.published && (!template.private || own) ? (
          <button onClick={() => onUse(template)}>
            <i className={useIcon} /> {useLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
