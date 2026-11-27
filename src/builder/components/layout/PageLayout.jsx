import { Link } from "react-router-dom";

import { useBuilder } from "../../state/BuilderProvider.jsx";
import useBotInfo from "../../state/useBotInfo.js";
import { Badge, Breadcrumbs, PageTransition, SaveIndicator } from "../../ui/index.js";
import TemplateBar from "./TemplateBar.jsx";
import { docsUrl } from "../../../config/docs.js";

/* =====================================================================
   The frame of every builder page
   ---------------------------------------------------------------------
   <PageLayout crumbs={[...]} actions={<Button>...</Button>}>...</PageLayout>

   A slim bar across the top: the DisFuse mark (back to your projects),
   where you are (BOT NAME > Commands > /ban), whether your changes are
   saved, and any buttons the page wants there. `crumbs` are the ones
   AFTER the bot; the bot is always first.

   In the template builder the template takes the bot's place, and the
   bar also carries the template's own buttons (Details, Publish).
   ===================================================================== */

/** The first breadcrumb: the bot, linking to the dashboard. */
export function useBotCrumb() {
  const { mode, project, paths } = useBuilder();
  const bot = useBotInfo(project);
  if (mode === "template") return { label: project?.name ?? "Template", icon: "fa-solid fa-shapes", to: paths?.workspace };
  return { label: bot.user?.username ?? project?.name ?? "Your bot", image: bot.avatarUrl, to: paths?.workspace };
}

export default function PageLayout({ crumbs = [], actions, children, wide = false, className = "" }) {
  const { mode, saveState, lastSavedAt, viewOnly, paths, versions } = useBuilder();
  /* With Version Control, which version every change is going into. */
  const editing = mode === "project" ? versions?.active : null;
  const botCrumb = useBotCrumb();

  return (
    <div className={`dfb-shell ${className}`}>
      <header className="dfb-topbar">
        <Link
          to={paths?.home ?? "/projects"}
          className="dfb-topbar__logo"
          aria-label={mode === "template" ? "Back to your templates" : "Back to your projects"}
        >
          <img src="/media/disfuse-clear.png" alt="" />
        </Link>
        <Breadcrumbs items={[botCrumb, ...crumbs]} />
        <div className="dfb-topbar__right">
          {editing && paths?.versions && (
            <Link to={paths.versions} className="dfb-topbar__version" title={`Editing ${editing.name}. Open Versions to switch.`}>
              <i className="fa-solid fa-code-branch" aria-hidden />
              <span>{editing.name}</span>
            </Link>
          )}
          {viewOnly ? <Badge tone="danger" icon="fa-solid fa-lock">View only</Badge> : <SaveIndicator state={saveState} lastSavedAt={lastSavedAt} />}
          {actions}
          {mode === "template" && <TemplateBar />}
        </div>
      </header>
      <main className={`dfb-main ${wide ? "dfb-main--wide" : ""}`}>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}

/** A big page heading with an icon tile, a title, a line under it and buttons. */
/**
 * `docs` is a page of the DisFuse docs (a value of DOCS in
 * config/docs.js); it adds a Help link next to the page's buttons.
 */
export function PageHeader({ icon, color, title, subtitle, children, eyebrow, docs }) {
  return (
    <div className="dfb-page-header">
      {icon && (
        <div className="dfb-page-header__icon" style={color ? { "--tile": color } : undefined}>
          <i className={icon} aria-hidden />
        </div>
      )}
      <div className="dfb-page-header__text">
        {eyebrow && <div className="dfb-page-header__eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {(children || docs) && (
        <div className="dfb-page-header__actions">
          {children}
          {docs && (
            <a className="dfb-btn dfb-btn--ghost dfb-btn--sm" href={docsUrl(docs)} target="_blank" rel="noopener noreferrer" title="Open the DisFuse docs for this page">
              <i className="fa-solid fa-circle-question" aria-hidden /> Help
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** A titled block of a page. */
export function Section({ title, icon, description, actions, children, className = "", id }) {
  return (
    <section className={`dfb-section ${className}`} id={id}>
      {(title || actions) && (
        <div className="dfb-section__head">
          <div>
            {title && (
              <h2>
                {icon && <i className={icon} aria-hidden />}
                {title}
              </h2>
            )}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="dfb-section__actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
