import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import UserTag from "../UserTag";
import TemplatePreview from "./TemplatePreview.jsx";
import { TemplateBadges } from "./TemplateCard.jsx";
import { errorMessage } from "../../api/client.js";
import { toggleTemplateLike } from "../../api/templates.js";

/* =====================================================================
   One template, in full
   ---------------------------------------------------------------------
   What a template is, who made it, what it needs, and what its blocks
   look like — the "post" a gallery card opens. The dashboard shows it as
   a page with comments underneath; the editor shows it inside the
   Templates dialog, where its main button imports it on the spot.

   It doesn't fetch the template: the page and the dialog each need to
   react to it changing (a like, an unpublish), so they own it and hand
   it down.
   ===================================================================== */

function formatDate(value) {
  if (!value) return null;

  return new Date(value).toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * @param {object} props
 * @param {object} props.template   GET /templates/:id
 * @param {object} props.viewer
 * @param {(changes: object) => void} props.onChange  merge into the template
 * @param {"page"|"editor"} [props.context]
 * @param {() => void} [props.onUse]     the main button
 * @param {string} [props.useLabel]
 * @param {Array<{label: string, icon: string, onClick?: Function, href?: string, danger?: boolean}>} [props.ownerActions]
 * @param {Array} [props.staffActions]   the same, for staff on someone else's
 */
export default function TemplateDetail({
  template,
  viewer,
  onChange,
  context = "page",
  onUse,
  useLabel = "Use in a project",
  ownerActions = [],
  staffActions = [],
}) {
  const [liking, setLiking] = useState(false);
  const [popped, setPopped] = useState(false);
  const [likeError, setLikeError] = useState(null);

  useEffect(() => setPopped(false), [template._id]);

  const own = Boolean(viewer?.id) && template.owner?.id === viewer.id;

  /* The owner is looking at a template nobody else can see yet: show them
     the draft, which is what they have been building. */
  const previewData = template.published ? template.data : template.draft;
  const unavailablePacks = (template.packs ?? []).filter(
    (pack) => !pack.available,
  );

  async function like() {
    if (liking || !template.published) return;

    setLiking(true);
    setLikeError(null);

    try {
      const result = await toggleTemplateLike(template._id);
      onChange(result);
      setPopped(result.liked);
    } catch (error) {
      setLikeError(errorMessage(error, "Couldn't like that"));
    } finally {
      setLiking(false);
    }
  }

  function renderAction(action) {
    const inner = (
      <>
        <i className={action.icon} aria-hidden="true" />
        <div>{action.label}</div>
      </>
    );

    const className = `darkBtn${action.danger ? " danger" : ""}`;

    return action.href ? (
      <a
        key={action.label}
        className={className}
        href={action.href}
        target={action.newTab ? "_blank" : undefined}
        rel={action.newTab ? "noopener noreferrer" : undefined}
      >
        {inner}
      </a>
    ) : (
      <button
        key={action.label}
        type="button"
        className={className}
        onClick={action.onClick}
        disabled={action.disabled}
      >
        {inner}
      </button>
    );
  }

  return (
    <article className={`df-template-detail ${context}`}>
      <header className="df-project-detail-head df-template-detail-head">
        <h1 className="title-row">
          <span className="df-template-icon" aria-hidden="true">
            <i className="fa-solid fa-shapes" />
          </span>
          <span className="df-template-title">{template.name}</span>
        </h1>

        <div className="df-template-detail-badges">
          <TemplateBadges template={template} showOwnerState={own} />
        </div>

        <div className="owner">
          <UserTag user={template.owner} />
          <i>
            {template.published
              ? `Published ${formatDate(template.publishedAt)}`
              : "Not published yet"}
          </i>
        </div>

        <div className="df-template-description">
          {template.description ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {template.description}
            </ReactMarkdown>
          ) : (
            <p className="df-template-muted">No description</p>
          )}
        </div>

        {own && !template.published ? (
          <p className="visibility-note">
            <i className="fa-solid fa-pen-ruler" /> Only you can see this
            template until you publish it from the builder.
          </p>
        ) : null}

        {own && template.published && template.unpublishedChanges ? (
          <p className="visibility-note">
            <i className="fa-solid fa-circle-half-stroke" /> You've changed this
            template in the builder since you published it. People importing it
            still get the published version.
          </p>
        ) : null}

        {template.private && own ? (
          <p className="visibility-note">
            <i className="fa-solid fa-lock" /> Private: only you can see it and
            import it.
          </p>
        ) : null}

        <div className="df-detail-actions">
          {onUse && template.canImport ? (
            <button
              type="button"
              className="darkBtn primary"
              onClick={onUse}
              disabled={unavailablePacks.length > 0}
              title={
                unavailablePacks.length
                  ? "A Workshop pack this template needs is no longer available"
                  : undefined
              }
            >
              <i
                className={
                  context === "editor"
                    ? "fa-solid fa-file-import"
                    : "fa-solid fa-plus"
                }
              />
              <div>{useLabel}</div>
            </button>
          ) : null}

          <button
            type="button"
            onClick={like}
            disabled={!template.published || liking}
            className={`darkBtn like${template.liked ? " active" : ""}${
              popped ? " newLike" : ""
            }`}
            title={
              likeError ??
              (template.published ? undefined : "Publish it to collect likes")
            }
            aria-pressed={Boolean(template.liked)}
          >
            <i className="fa-solid fa-heart" />
            <div>
              {template.likes} Like{template.likes === 1 ? "" : "s"}
            </div>
          </button>

          <span className="darkBtn static" title="People who imported it">
            <i className="fa-solid fa-file-import" />
            <div>
              {template.imports} Import{template.imports === 1 ? "" : "s"}
            </div>
          </span>

          {template.published ? (
            <span className="darkBtn static" title="Blocks in it">
              <i className="fa-solid fa-cube" />
              <div>
                {template.blockCount} Block
                {template.blockCount === 1 ? "" : "s"}
              </div>
            </span>
          ) : null}

          {own ? ownerActions.map(renderAction) : null}
          {!own ? staffActions.map(renderAction) : null}
        </div>

        {likeError ? <p className="df-template-error">{likeError}</p> : null}
      </header>

      {template.packs?.length ? (
        <section className="df-template-packs">
          <h2>
            <i className="fa-solid fa-cubes-stacked" /> Workshop packs
          </h2>
          <p>
            This template uses blocks from{" "}
            {template.packs.length === 1
              ? "a Workshop pack"
              : "these Workshop packs"}
            . Importing it adds {template.packs.length === 1 ? "it" : "them"} to
            your library.
          </p>
          <ul>
            {template.packs.map((pack) => (
              <li
                key={pack._id}
                className={pack.available ? "" : "unavailable"}
                style={pack.color ? { "--pack-color": pack.color } : undefined}
              >
                {pack.available ? (
                  <a
                    href={`/workshop/${pack._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pack.name}
                    {pack.version ? <span> v{pack.version}</span> : null}
                  </a>
                ) : (
                  <span>
                    {pack.name ?? "A deleted pack"} — no longer available
                  </span>
                )}
              </li>
            ))}
          </ul>
          {unavailablePacks.length ? (
            <p className="df-template-error">
              <i className="fa-solid fa-triangle-exclamation" /> A pack this
              template needs can no longer be installed, so it can't be
              imported.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="df-template-blocks">
        <h2>
          <i className="fa-solid fa-cubes" />{" "}
          {template.published ? "Blocks" : "Draft blocks"}
        </h2>
        <TemplatePreview data={previewData} packs={template.packs ?? []} />
      </section>
    </article>
  );
}
