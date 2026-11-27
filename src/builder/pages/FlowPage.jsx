import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";

import "../../styles/builder/flow.css";

import ActionPicker from "../components/flow/ActionPicker.jsx";
import { ActionList } from "../components/flow/ActionList.jsx";
import { FlowContext } from "../components/flow/FlowContext.js";
import HandlerSource from "../components/flow/HandlerSource.jsx";
import PageLayout from "../components/layout/PageLayout.jsx";
import { OpError, findAction, findCommand, findOption } from "../model/ops.js";
import { OPTION_TYPES } from "../model/rules.js";
import { locationOf } from "../model/scope.js";
import { useBuilder, useFlow } from "../state/BuilderProvider.jsx";
import { Badge, Chip, toast } from "../ui/index.js";
import { commandCrumb } from "./CommandPage.jsx";

/* =====================================================================
   The step builder
   ---------------------------------------------------------------------
   What a command, subcommand or event does, as a column of steps. The
   card at the top says what starts it and what it makes available;
   under it, the steps, top to bottom.

   This page owns the things every card needs: the step picker (so there
   is one of it), what's being dragged, and dropping it somewhere.
   ===================================================================== */

function useFlowTarget(source) {
  const { commandId, optionId, eventId } = useParams();
  const { builder, catalog, paths } = useBuilder();

  return useMemo(() => {
    if (source === "event") {
      const event = builder.events.find((e) => e.id === eventId);
      if (!event) return { missing: `${paths.workspace}/events` };
      const def = catalog.events.get(event.type);
      const category = catalog.categoryById[def?.category];
      return {
        flowId: event.id,
        back: `${paths.workspace}/events/${event.id}`,
        crumbs: [
          { label: "Events", icon: "fa-solid fa-bolt", to: `${paths.workspace}/events` },
          { label: event.label || def?.label || "Event", icon: def?.icon, to: `${paths.workspace}/events/${event.id}` },
          { label: "Steps", icon: "fa-solid fa-hammer" },
        ],
        trigger: {
          icon: def?.icon ?? "fa-solid fa-bolt",
          tint: category?.color ?? "#ffb648",
          title: event.label || def?.label || "Unknown event",
          text: event.label ? `${def?.label ?? "Unknown event"}. ${def?.description ?? ""}` : def?.description,
        },
        available: (def?.values ?? []).map((v) => v.label),
        off: event.enabled === false,
        event,
      };
    }

    const command = findCommand(builder, commandId);
    if (!command) return { missing: `${paths.workspace}/commands` };
    const slash = (command.kind ?? "slash") === "slash";

    if (source === "option") {
      const found = findOption(command, optionId);
      if (!found || found.option.type !== 1) return { missing: `${paths.workspace}/commands/${command.id}` };
      const { option, path } = found;
      const name = `/${[command.name, ...path.map((p) => p.name), option.name].join(" ")}`;
      return {
        flowId: option.id,
        back: `${paths.workspace}/commands/${command.id}/options/${option.id}`,
        crumbs: [
          { label: "Commands", icon: "fa-solid fa-terminal", to: `${paths.workspace}/commands` },
          commandCrumb(command, paths),
          ...path.map((p) => ({ label: p.name, icon: OPTION_TYPES[p.type]?.icon, to: `${paths.workspace}/commands/${command.id}/options/${p.id}` })),
          { label: option.name, icon: OPTION_TYPES[1].icon, to: `${paths.workspace}/commands/${command.id}/options/${option.id}` },
          { label: "Steps", icon: "fa-solid fa-hammer" },
        ],
        trigger: { icon: "fa-solid fa-slash", tint: "#35d0a0", title: `When someone uses ${name}`, text: option.description },
        available: (option.options ?? []).map((o) => o.name),
      };
    }

    const hasSubs = (command.options ?? []).some((o) => o.type === 1 || o.type === 2);
    if (slash && hasSubs) return { missing: `${paths.workspace}/commands/${command.id}` };
    return {
      flowId: command.id,
      back: `${paths.workspace}/commands/${command.id}`,
      crumbs: [
        { label: "Commands", icon: "fa-solid fa-terminal", to: `${paths.workspace}/commands` },
        commandCrumb(command, paths),
        { label: "Steps", icon: "fa-solid fa-hammer" },
      ],
      trigger: slash
        ? { icon: "fa-solid fa-slash", tint: "#35d0a0", title: `When someone uses /${command.name}`, text: command.description }
        : {
            icon: command.kind === "user" ? "fa-solid fa-user" : "fa-solid fa-message",
            tint: "#4fa8ff",
            title: `When someone uses “${command.name}”`,
            text: command.kind === "user" ? "From the Apps menu when right-clicking a user." : "From the Apps menu when right-clicking a message.",
          },
      available: slash ? (command.options ?? []).map((o) => o.name) : [command.kind === "user" ? "Right-clicked user" : "Right-clicked message"],
    };
  }, [builder, catalog, commandId, eventId, optionId, paths, source]);
}

export default function FlowPage({ source }) {
  const target = useFlowTarget(source);
  const { info, issues } = useFlow(target.flowId);
  const { addStep, moveAction, stepPermissions } = useBuilder();
  /* A command's steps and an event's steps have separate permissions. */
  const steps = stepPermissions(target.flowId);
  const stepsKey = JSON.stringify(steps);

  const [picker, setPicker] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [flashId, setFlashId] = useState(null);

  const flash = useCallback((id) => {
    setFlashId(id);
    setTimeout(() => setFlashId((current) => (current === id ? null : current)), 1300);
  }, []);

  const dropAt = useCallback(
    (location, index) => {
      if (!dragging || !info) return;
      const id = dragging;
      setDragging(null);
      const from = locationOf(info.actions, id);
      const found = findAction(info.actions, id);
      const same = from.parentId === (location.parentId ?? null) && from.branch === (location.branch ?? null) && from.itemId === (location.itemId ?? null);
      /* The move removes the step first, so a later spot in the same
         list is one earlier by then. */
      const target = same && found && found.index < index ? index - 1 : index;
      if (same && found && (target === found.index)) return;
      try {
        moveAction(info.flowId, id, { ...location, index: target });
        flash(id);
      } catch (error) {
        if (error instanceof OpError) toast.error(error.message);
        else throw error;
      }
    },
    [dragging, flash, info, moveAction],
  );

  const context = useMemo(
    () => ({
      flowId: target.flowId,
      info,
      issues,
      dragging,
      setDragging,
      flashId,
      dropAt,
      openPicker: (location) => setPicker(location),
      locationOf: (actionId) => locationOf(info?.actions ?? [], actionId),
      steps,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragging, dropAt, flashId, info, issues, target.flowId, stepsKey],
  );

  /* "Go to that step" from elsewhere lands here with ?step=…: scroll to
     it and light it up once, then drop it from the address. */
  const [search, setSearch] = useSearchParams();
  const step = search.get("step");
  useEffect(() => {
    if (!step || !info) return;
    if (findAction(info.actions, step)) flash(step);
    setSearch((current) => {
      const next = new URLSearchParams(current);
      next.delete("step");
      return next;
    }, { replace: true });
  }, [flash, info, setSearch, step]);

  if (target.missing) return <Navigate to={target.missing} replace />;
  if (!info) return null;

  const problemCount = [...issues.values()].reduce((n, list) => n + list.filter((i) => i.level === "error").length, 0);

  return (
    <FlowContext.Provider value={context}>
      <PageLayout
        crumbs={target.crumbs}
        wide
        actions={
          <Link to={target.back} className="dfb-btn dfb-btn--ghost dfb-btn--sm">
            <i className="fa-solid fa-sliders" aria-hidden /> Settings
          </Link>
        }
      >
        <div className={`dfb-flow ${dragging ? "dfb-dragging" : ""}`}>
          <div className="dfb-flow__trigger" style={{ "--tint": target.trigger.tint }}>
            <span className="dfb-flow__trigger-icon">
              <i className={target.trigger.icon} aria-hidden />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1>{target.trigger.title}</h1>
              {target.trigger.text && <p>{target.trigger.text}</p>}
            </div>
            {target.off && <Badge tone="amber">Turned off</Badge>}
            {problemCount > 0 && (
              <Badge tone="danger" icon="fa-solid fa-triangle-exclamation">
                {problemCount} to fix
              </Badge>
            )}
          </div>
          {target.available?.length > 0 && (
            <div className="dfb-flow__available">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> You can use:
              {target.available.slice(0, 8).map((label) => (
                <Chip key={label} color="#35d0a0">
                  {label}
                </Chip>
              ))}
              {target.available.length > 8 && <span>and {target.available.length - 8} more</span>}
            </div>
          )}
          {target.event && <HandlerSource event={target.event} />}
          <div className="dfb-flow__connector" aria-hidden />
          <ActionList actions={info.actions} location={{ parentId: null, branch: null, itemId: null }} />
        </div>

        <ActionPicker
          open={Boolean(picker)}
          location={picker}
          onClose={() => setPicker(null)}
          onPick={(type) => {
            const location = picker;
            setPicker(null);
            try {
              const action = addStep(info.flowId, type, location);
              flash(action.id);
            } catch (error) {
              if (error instanceof OpError) toast.error(error.message);
              else throw error;
            }
          }}
        />
      </PageLayout>
    </FlowContext.Provider>
  );
}
