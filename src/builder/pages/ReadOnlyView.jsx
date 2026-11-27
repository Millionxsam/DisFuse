import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import "../../styles/builder/flow.css";
import "../../styles/builder/pages.css";

import UserTag from "../../components/UserTag";
import { ActionList } from "../components/flow/ActionList.jsx";
import { FlowContext } from "../components/flow/FlowContext.js";
import { walkOptions } from "../model/ops.js";
import { OPTION_TYPES } from "../model/rules.js";
import { flowInfo } from "../model/scope.js";
import { validateFlow } from "../model/validate.js";
import { BuilderProvider, useBuilder } from "../state/BuilderProvider.jsx";
import useBotInfo from "../state/useBotInfo.js";
import { Badge, Button, EmptyState, Spinner } from "../ui/index.js";

/* =====================================================================
   A DisFuse Builder project, read-only
   ---------------------------------------------------------------------
   What /@user/:projectId/view shows for a builder project: the bot, its
   commands and events, and what each one does, drawn with the same step
   cards as the builder with editing turned off. The block editor's
   version of this page shows its workspace instead.
   ===================================================================== */

function FlowBlock({ flowId, title, subtitle, icon, tint }) {
  const { builder, catalog } = useBuilder();
  const [open, setOpen] = useState(false);
  const info = useMemo(() => flowInfo(builder, flowId, catalog), [builder, catalog, flowId]);
  const context = useMemo(
    () => ({ flowId, info, issues: info ? validateFlow(builder, flowId, catalog, info) : new Map(), dragging: null, setDragging: () => {}, dropAt: () => {}, openPicker: () => {}, flashId: null, locationOf: () => ({}) }),
    [builder, catalog, flowId, info],
  );
  if (!info) return null;

  return (
    <div className="dfb-ro-flow">
      <button type="button" className="dfb-list-item" style={{ "--tint": tint }} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="dfb-list-item__icon">
          <i className={icon} aria-hidden />
        </span>
        <span className="dfb-list-item__text">
          <span className="dfb-list-item__title">{title}</span>
          {subtitle && <span className="dfb-list-item__sub">{subtitle}</span>}
        </span>
        <span className="dfb-list-item__meta">
          <Badge>
            {info.actions.length} step{info.actions.length === 1 ? "" : "s"}
          </Badge>
          <i className={`fa-solid fa-chevron-${open ? "up" : "down"} dfb-list-item__chevron`} aria-hidden />
        </span>
      </button>
      {open && (
        <div className="dfb-ro-flow__steps">
          <FlowContext.Provider value={context}>
            {info.actions.length ? <ActionList actions={info.actions} location={{ parentId: null, branch: null, itemId: null }} /> : <p style={{ color: "var(--dfb-faint)", margin: 0 }}>No steps yet.</p>}
          </FlowContext.Provider>
        </div>
      )}
    </div>
  );
}

/**
 * Every command (each subcommand on its own) and event, with what each
 * does. Read-only. Used here and to preview DisFuse Builder templates.
 */
export function BuilderOverview({ emptyText = "Nothing here yet." }) {
  const { builder, catalog } = useBuilder();

  const flows = [];
  for (const command of builder.commands) {
    const slash = (command.kind ?? "slash") === "slash";
    const structural = (command.options ?? []).some((o) => o.type === 1 || o.type === 2);
    if (slash && structural)
      walkOptions(command.options, (option, parent) => {
        if (option.type === 1)
          flows.push({ id: option.id, title: `/${[command.name, parent?.type === 2 ? parent.name : null, option.name].filter(Boolean).join(" ")}`, subtitle: option.description, icon: OPTION_TYPES[1].icon, tint: "#35d0a0" });
      });
    else flows.push({ id: command.id, title: slash ? `/${command.name}` : command.name, subtitle: slash ? command.description : "Right-click command", icon: slash ? "fa-solid fa-slash" : "fa-solid fa-computer-mouse", tint: "#35d0a0" });
  }
  const events = builder.events.map((event) => {
    const def = catalog.events.get(event.type);
    return { id: event.id, title: event.label || def?.label || "Event", subtitle: event.label ? def?.label : def?.description, icon: def?.icon ?? "fa-solid fa-bolt", tint: catalog.categoryById[def?.category]?.color ?? "#ffb648" };
  });

  return (
    <>
      {!flows.length && !events.length && (
        <EmptyState icon="fa-solid fa-seedling" title="Nothing here yet">
          {emptyText}
        </EmptyState>
      )}

      {flows.length > 0 && (
        <>
          <h3 className="dfb-subhead">
            <i className="fa-solid fa-terminal" aria-hidden /> Commands · {flows.length}
          </h3>
          <div className="dfb-list">
            {flows.map((flow) => (
              <FlowBlock key={flow.id} flowId={flow.id} {...flow} />
            ))}
          </div>
        </>
      )}
      {events.length > 0 && (
        <>
          <h3 className="dfb-subhead">
            <i className="fa-solid fa-bolt" aria-hidden /> Events · {events.length}
          </h3>
          <div className="dfb-list">
            {events.map((event) => (
              <FlowBlock key={event.id} flowId={event.id} {...event} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function View() {
  const { project, loading, error, isOwner, isCollaborator, paths } = useBuilder();
  const bot = useBotInfo(project);

  if (error)
    return (
      <div className="dfb-fullscreen">
        <div className="dfb-fullscreen__card">
          <i className="fa-solid fa-lock" aria-hidden />
          <h1>You can't view this project</h1>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  if (loading)
    return (
      <div className="dfb-fullscreen">
        <Spinner size={34} />
      </div>
    );

  return (
    <div className="dfb-shell">
      <Helmet>
        <title>{`${project.name} | DisFuse`}</title>
      </Helmet>
      <header className="dfb-topbar">
        <Link to={paths.project} className="dfb-topbar__logo" aria-label="Back to the project page">
          <img src="/media/disfuse-clear.png" alt="" />
        </Link>
        <span style={{ fontWeight: 700 }}>{project.name}</span>
        <div className="dfb-topbar__right">
          <Badge tone="violet" icon="fa-solid fa-eye">
            View only
          </Badge>
          <Link to={paths.project} className="dfb-btn dfb-btn--ghost dfb-btn--sm">
            <i className="fa-solid fa-id-card" aria-hidden /> Project page
          </Link>
          {(isOwner || isCollaborator) && (
            <Link to={paths.workspace} className="dfb-btn dfb-btn--primary dfb-btn--sm">
              <i className="fa-solid fa-pen" aria-hidden /> Open dashboard
            </Link>
          )}
        </div>
      </header>
      <main className="dfb-main">
        <div className="dfb-page-header">
          <img src={bot.avatarUrl} alt="" style={{ width: 70, height: 70, borderRadius: "50%" }} />
          <div className="dfb-page-header__text">
            <div className="dfb-page-header__eyebrow">Built with DisFuse Builder</div>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
            <div style={{ marginTop: 8 }}>
              <UserTag user={project.owner} />
            </div>
          </div>
        </div>

        <BuilderOverview emptyText="This bot doesn't have any commands or events yet." />
      </main>
    </div>
  );
}

export default function ReadOnlyView() {
  const { projectId } = useParams();
  return (
    <BuilderProvider projectId={projectId} readOnly>
      <div className="dfb-root dfb-app">
        <View />
      </div>
    </BuilderProvider>
  );
}
