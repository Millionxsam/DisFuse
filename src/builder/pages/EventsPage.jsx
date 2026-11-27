import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageLayout, { PageHeader } from "../components/layout/PageLayout.jsx";
import { handlerSources } from "../model/handlers.js";
import { OpError } from "../model/ops.js";
import { LIMITS, checkEventLabel } from "../model/rules.js";
import { validateProject } from "../model/validate.js";
import { useBuilder } from "../state/BuilderProvider.jsx";
import { Badge, Button, CatalogPicker, EmptyState, Field, Modal, SearchInput, TextInput } from "../ui/index.js";
import { DOCS } from "../../config/docs.js";

/* =====================================================================
   Events
   ---------------------------------------------------------------------
   Everything the bot reacts to. Each event shows its own label big (so
   ten "When a message is sent" events are still easy to tell apart) and
   its type underneath. Adding one is two steps: pick what happens from
   the searchable catalog, then give it a label only you will see.
   ===================================================================== */

export function NewEventModal({ open, onClose }) {
  const { catalog, createEvent, paths } = useBuilder();
  const navigate = useNavigate();
  const [chosen, setChosen] = useState(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState(null);

  const items = useMemo(
    () =>
      [...catalog.events.values()].filter((def) => !def.hidden).map((def) => ({
        id: def.id,
        label: def.label,
        description: def.description,
        icon: def.icon,
        category: def.category,
        group: def.group,
        keywords: def.keywords,
      })),
    [catalog],
  );

  const close = () => {
    onClose();
    setTimeout(() => {
      setChosen(null);
      setLabel("");
      setError(null);
    }, 250);
  };

  const create = (event) => {
    event?.preventDefault();
    const problem = checkEventLabel(label);
    if (problem) return setError(problem);
    try {
      const created = createEvent({ type: chosen.id, label: label.trim() });
      close();
      navigate(`${paths.workspace}/events/${created.id}`);
    } catch (thrown) {
      if (thrown instanceof OpError) setError(thrown.message);
      else throw thrown;
    }
  };

  const def = chosen && catalog.events.get(chosen.id);
  const category = def && catalog.categoryById[def.category];

  return (
    <Modal
      open={open}
      onClose={close}
      title={chosen ? "Name your event" : "Add an event"}
      subtitle={chosen ? "Give it a label so you can tell your events apart. The bot never uses it." : "What should your bot react to?"}
      icon="fa-solid fa-bolt"
      iconColor="linear-gradient(135deg, #ffb648, #ff7a45)"
      size={chosen ? "md" : "xl"}
      flush={!chosen}
      footer={
        chosen && (
          <>
            <Button variant="ghost" icon="fa-solid fa-arrow-left" onClick={() => setChosen(null)}>
              Back
            </Button>
            <Button variant="primary" icon="fa-solid fa-plus" onClick={create}>
              Add event
            </Button>
          </>
        )
      }
    >
      {!chosen ? (
        <CatalogPicker items={items} categories={catalog.categories} onPick={setChosen} placeholder="Search events, like “message” or “joins”" />
      ) : (
        <form onSubmit={create} className="dfb-stack">
          <div className="dfb-list-item" style={{ "--tint": category?.color ?? "#ffb648", cursor: "default" }}>
            <span className="dfb-list-item__icon">
              <i className={def.icon ?? category?.icon} aria-hidden />
            </span>
            <span className="dfb-list-item__text">
              <span className="dfb-list-item__title">{def.label}</span>
              <span className="dfb-list-item__sub" style={{ whiteSpace: "normal" }}>
                {def.description}
              </span>
            </span>
          </div>
          <Field label="Label" optional error={error} help="Like “Welcome new members” or “Log deleted messages”." counter={{ value: [...label].length, max: LIMITS.eventLabelLength }}>
            <TextInput value={label} placeholder={def.label} onChange={(event) => { setLabel(event.target.value); setError(null); }} data-autofocus />
          </Field>
          <button type="submit" hidden />
        </form>
      )}
    </Modal>
  );
}

export default function EventsPage() {
  const { builder, catalog, paths, readOnly, can } = useBuilder();
  const canCreate = !readOnly && can("events.create");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const problems = useMemo(() => {
    const map = new Map();
    for (const problem of validateProject(builder, catalog)) if (problem.level !== "info" && problem.flowId) map.set(problem.flowId, (map.get(problem.flowId) ?? 0) + 1);
    return map;
  }, [builder, catalog]);

  const q = query.trim().toLowerCase();
  const shown = builder.events.filter((event) => {
    if (!q) return true;
    const def = catalog.events.get(event.type);
    return `${event.label} ${def?.label ?? ""}`.toLowerCase().includes(q);
  });

  return (
    <PageLayout crumbs={[{ label: "Events", icon: "fa-solid fa-bolt" }]}>
      <PageHeader
        icon="fa-solid fa-bolt"
        color="linear-gradient(135deg, #ffb648, #ff7a45)"
        title="Events"
        subtitle="Things that happen on Discord, and what your bot does when they do."
        docs={DOCS.builderEvents}
      >
        {canCreate && (
          <Button variant="primary" icon="fa-solid fa-plus" onClick={() => setAdding(true)}>
            Add event
          </Button>
        )}
      </PageHeader>

      {!builder.events.length ? (
        <EmptyState
          icon="fa-solid fa-bolt"
          color="linear-gradient(135deg, #ffb648, #e23fe2)"
          title="No events yet"
          action={
            canCreate && (
              <Button variant="primary" icon="fa-solid fa-plus" onClick={() => setAdding(true)}>
                Add your first event
              </Button>
            )
          }
        >
          Events let your bot react to things, like welcoming people when they join or replying when someone says hello.
        </EmptyState>
      ) : (
        <>
          {builder.events.length > 6 && (
            <div className="dfb-toolbar">
              <SearchInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an event" aria-label="Find an event" />
            </div>
          )}
          <div className="dfb-list">
            {shown.map((event, index) => {
              const def = catalog.events.get(event.type);
              const category = catalog.categoryById[def?.category];
              const count = problems.get(event.id) ?? 0;
              const linked = handlerSources(builder, catalog, event);
              const from = linked?.sources[0];
              return (
                <Link
                  key={event.id}
                  to={`${paths.workspace}/events/${event.id}`}
                  className={`dfb-list-item ${event.enabled === false ? "dfb-list-item--off" : ""}`}
                  style={{ "--tint": category?.color ?? "#ffb648", animationDelay: `${index * 40}ms` }}
                >
                  <span className="dfb-list-item__icon">
                    <i className={def?.icon ?? "fa-solid fa-bolt"} aria-hidden />
                  </span>
                  <span className="dfb-list-item__text">
                    <span className="dfb-list-item__title">{event.label || def?.label || "Unknown event"}</span>
                    <span className="dfb-list-item__sub">{event.label ? def?.label : def?.description}</span>
                  </span>
                  <span className="dfb-list-item__meta">
                    {event.enabled === false && <Badge>Off</Badge>}
                    {from && (
                      <Badge icon="fa-solid fa-link" className="dfb-badge--from">
                        <span>{from.flowName}</span>
                      </Badge>
                    )}
                    {linked?.id && !from && (
                      <Badge tone="amber" icon="fa-solid fa-link-slash">
                        {linked.kind === "form" ? "Nothing shows it" : "Nothing sends it"}
                      </Badge>
                    )}
                    {count > 0 && (
                      <Badge tone="amber" icon="fa-solid fa-triangle-exclamation">
                        {count}
                      </Badge>
                    )}
                    <Badge>
                      {event.actions?.length ?? 0} step{event.actions?.length === 1 ? "" : "s"}
                    </Badge>
                    <i className="fa-solid fa-chevron-right dfb-list-item__chevron" aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
          {q && !shown.length && <p style={{ color: "var(--dfb-faint)" }}>No events match “{query}”.</p>}
        </>
      )}

      <NewEventModal open={adding} onClose={() => setAdding(false)} />
    </PageLayout>
  );
}
