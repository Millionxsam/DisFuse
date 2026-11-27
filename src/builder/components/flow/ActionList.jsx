import { useEffect, useRef, useState } from "react";

import { inputVisible, literalOf } from "../../codegen/context.js";
import { OpError, findAction, isRepeatItem } from "../../model/ops.js";
import { describeRef, locationOf } from "../../model/scope.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Badge, IconButton, Popover, confirm, toast } from "../../ui/index.js";
import { useFlowContext } from "./FlowContext.js";
import HandlerStrip from "./HandlerStrip.jsx";
import InputField from "./InputField.jsx";

/* =====================================================================
   Steps, and the sections inside them
   ---------------------------------------------------------------------
   <ActionList actions={...} location={{ parentId, branch, itemId }} />

   A column of step cards with a "+" between each pair (on hover) and
   an "Add a step" button at the end. Cards can be dragged by their
   handle into any gap, including gaps inside other steps' sections;
   every move is also in each card's menu (Move up, Move down, Move out
   of this section) for keyboards and touch screens.

   A step with branches shows each one as a labelled section with a
   colored rail and its own steps: "Then", "Otherwise, if", "Otherwise".

   What's offered follows the step permissions of the command or event
   (FlowPage puts them in the flow context as `steps`): a collaborator
   who may only move steps gets the handles and nothing else.
   ===================================================================== */

const NO_STEPS = {
  add: false,
  edit: false,
  move: false,
  toggle: false,
  delete: false,
};
const ALL_STEPS = {
  add: true,
  edit: true,
  move: true,
  toggle: true,
  delete: true,
};

/** What may be done to the steps here: { add, edit, move, toggle, delete }. */
function useSteps() {
  const flow = useFlowContext();
  const { readOnly } = useBuilder();
  if (readOnly) return NO_STEPS;
  return flow?.steps ?? ALL_STEPS;
}

/** Anything in a step's menu this person may use. */
const hasMenu = (steps) =>
  steps.add || steps.toggle || steps.move || steps.delete;

function safely(run) {
  try {
    return run();
  } catch (error) {
    if (error instanceof OpError) toast.error(error.message);
    else throw error;
    return undefined;
  }
}

function Gap({ location, index }) {
  const flow = useFlowContext();
  const steps = useSteps();
  const [over, setOver] = useState(false);

  if (!steps.add && !steps.move) return <div className="dfb-gap" />;

  return (
    <div
      className={`dfb-gap ${over ? "dfb-gap--over" : ""}`}
      onDragOver={(event) => {
        if (!flow.dragging || !steps.move) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (steps.move) flow.dropAt(location, index);
      }}
    >
      <span className="dfb-gap__drop" aria-hidden />
      {steps.add && (
        <button
          type="button"
          className="dfb-gap__add"
          aria-label="Add a step here"
          onClick={() => flow.openPicker({ ...location, index })}
        >
          <i className="fa-solid fa-plus" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function ActionList({ actions = [], location, compact = false }) {
  const flow = useFlowContext();
  const steps = useSteps();

  return (
    <div className="dfb-steps">
      {actions.map((action, index) => (
        <div key={action.id}>
          <Gap location={location} index={index} />
          <ActionCard
            action={action}
            location={location}
            index={index}
            count={actions.length}
          />
        </div>
      ))}
      <Gap location={location} index={actions.length} />
      {steps.add && (
        <button
          type="button"
          className={`dfb-add-step ${compact ? "dfb-add-step--small" : ""} ${!actions.length && !location.parentId ? "dfb-add-step--big" : ""}`}
          onClick={() =>
            flow.openPicker({ ...location, index: actions.length })
          }
        >
          <i className="fa-solid fa-plus" aria-hidden />{" "}
          {actions.length
            ? "Add a step"
            : location.parentId
              ? "Add a step here"
              : "Add the first step"}
        </button>
      )}
    </div>
  );
}

/** "Set status to Online" from a def's `sentence`. */
function sentenceFor(def, action, env) {
  if (!def?.sentence) return null;
  return def.sentence.replace(/\{(\w+)\}/g, (_, key) => {
    const inputDef = def.inputs.find((i) => i.key === key);
    const value = action.inputs?.[key];
    if (!inputDef) return "";
    if (value?.ref) return describeRef(value.ref, env).label;
    const literal = literalOf(inputDef, value);
    if (inputDef.kind === "dropdown")
      return (
        inputDef.options.find((o) => o.value === String(literal))?.label ?? ""
      );
    if (inputDef.kind === "boolean") return literal ? "yes" : "no";
    if (literal === undefined || literal === null || literal === "") return "…";
    return String(literal).slice(0, 40);
  });
}

function StepMenu({ anchor, open, onClose, action, location, index, count }) {
  const flow = useFlowContext();
  const steps = useSteps();
  const {
    duplicateAction,
    setActionDisabled,
    moveAction,
    deleteAction,
    insertAction,
  } = useBuilder();

  const run = (fn) => {
    onClose();
    safely(fn);
  };

  const moveOut = () => {
    const parent = findAction(flow.info.actions, location.parentId);
    if (!parent) return;
    const outer = locationOf(flow.info.actions, location.parentId);
    moveAction(flow.flowId, action.id, { ...outer, index: parent.index + 1 });
  };

  const remove = async () => {
    onClose();
    const hasInside = Object.values(action.branches ?? {}).some((entries) =>
      (entries ?? []).some((e) => (isRepeatItem(e) ? e.actions.length : true)),
    );
    if (
      hasInside &&
      !(await confirm({
        title: "Delete this step?",
        message: "The steps inside it will be deleted too.",
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    const saved = JSON.parse(JSON.stringify(action));
    safely(() => deleteAction(flow.flowId, action.id));
    /* Undoing puts the step back, which is adding one. */
    toast.info(
      "Step deleted",
      steps.add
        ? {
            action: {
              label: "Undo",
              onClick: () =>
                safely(() =>
                  insertAction(flow.flowId, saved, { ...location, index }),
                ),
            },
          }
        : undefined,
    );
  };

  return (
    <Popover
      anchor={anchor}
      open={open}
      onClose={onClose}
      placement="bottom-end"
      role="menu"
    >
      <div className="dfb-menu" style={{ minWidth: 230 }}>
        {steps.add && (
          <button
            type="button"
            role="menuitem"
            className="dfb-menu__item"
            onClick={() => run(() => duplicateAction(flow.flowId, action.id))}
          >
            <i className="fa-regular fa-clone" aria-hidden /> Duplicate
          </button>
        )}
        {steps.toggle && (
          <button
            type="button"
            role="menuitem"
            className="dfb-menu__item"
            onClick={() =>
              run(() =>
                setActionDisabled(flow.flowId, action.id, !action.disabled),
              )
            }
          >
            <i
              className={
                action.disabled
                  ? "fa-solid fa-toggle-on"
                  : "fa-solid fa-toggle-off"
              }
              aria-hidden
            />{" "}
            {action.disabled ? "Enable" : "Disable"}
          </button>
        )}
        {steps.move && (steps.add || steps.toggle) && (
          <div className="dfb-menu__divider" />
        )}
        {steps.move && (
          <>
            <button
              type="button"
              role="menuitem"
              className="dfb-menu__item"
              disabled={index === 0}
              onClick={() =>
                run(() =>
                  moveAction(flow.flowId, action.id, {
                    ...location,
                    index: index - 1,
                  }),
                )
              }
            >
              <i className="fa-solid fa-arrow-up" aria-hidden /> Move up
            </button>
            <button
              type="button"
              role="menuitem"
              className="dfb-menu__item"
              disabled={index >= count - 1}
              onClick={() =>
                run(() =>
                  moveAction(flow.flowId, action.id, {
                    ...location,
                    index: index + 1,
                  }),
                )
              }
            >
              <i className="fa-solid fa-arrow-down" aria-hidden /> Move down
            </button>
            {location.parentId && (
              <button
                type="button"
                role="menuitem"
                className="dfb-menu__item"
                onClick={() => run(moveOut)}
              >
                <i className="fa-solid fa-arrow-turn-up" aria-hidden /> Move out
                of this section
              </button>
            )}
          </>
        )}
        {steps.delete && (steps.add || steps.toggle || steps.move) && (
          <div className="dfb-menu__divider" />
        )}
        {steps.delete && (
          <button
            type="button"
            role="menuitem"
            className="dfb-menu__item"
            style={{ color: "#ff9b9b" }}
            onClick={remove}
          >
            <i
              className="fa-solid fa-trash-can"
              aria-hidden
              style={{ color: "#ff8a8a" }}
            />{" "}
            Delete
          </button>
        )}
      </div>
    </Popover>
  );
}

function Branch({ action, def, branch, tint }) {
  const flow = useFlowContext();
  const steps = useSteps();
  const {
    setBranchEnabled,
    addBranchItem,
    removeBranchItem,
    updateBranchItem,
  } = useBuilder();
  const entries = action.branches?.[branch.key];
  const location = { parentId: action.id, branch: branch.key, itemId: null };
  const enabled = Array.isArray(entries);

  if (branch.optional && !enabled) return null;

  const provides = (branch.provides ?? []).length > 0 && (
    <span className="dfb-branch__provides">
      {branch.provides.map((value) => (
        <Badge key={value.key} tone="mint" icon="fa-solid fa-diagram-next">
          {value.label}
        </Badge>
      ))}
    </span>
  );

  if (branch.repeat) {
    const items = enabled ? entries : [];
    return (
      <>
        {items.map((item, index) => (
          <div className="dfb-branch" style={{ "--btint": tint }} key={item.id}>
            <div className="dfb-branch__head">
              <span className="dfb-branch__label">
                <i className="fa-solid fa-code-branch" aria-hidden />{" "}
                {branch.itemLabel ?? branch.label}
                {items.length > 1 ? ` ${index + 1}` : ""}
              </span>
              {provides}
              {steps.edit && (
                <IconButton
                  size="sm"
                  icon="fa-solid fa-xmark"
                  label={`Remove this ${(branch.itemLabel ?? branch.label).toLowerCase()}`}
                  tone="danger"
                  onClick={async () => {
                    if (
                      item.actions.length &&
                      !(await confirm({
                        title: "Remove this section?",
                        message: "The steps inside it will be deleted too.",
                        confirmLabel: "Remove",
                        danger: true,
                      }))
                    )
                      return;
                    safely(() =>
                      removeBranchItem(
                        flow.flowId,
                        action.id,
                        branch.key,
                        item.id,
                      ),
                    );
                  }}
                />
              )}
            </div>
            {branch.inputs?.length > 0 && (
              <div className="dfb-branch__item-inputs">
                {branch.inputs.map((inputDef) => (
                  <InputField
                    key={inputDef.key}
                    def={inputDef}
                    value={item.inputs?.[inputDef.key]}
                    scope={{
                      location: flow.locationOf(action.id),
                      path: [],
                      ownerId: def.id,
                    }}
                    readOnly={!steps.edit}
                    onChange={(value, options) =>
                      safely(() =>
                        updateBranchItem(
                          flow.flowId,
                          action.id,
                          branch.key,
                          item.id,
                          { [inputDef.key]: value },
                          options,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            )}
            <ActionList
              actions={item.actions}
              location={{
                parentId: action.id,
                branch: branch.key,
                itemId: item.id,
              }}
              compact
            />
          </div>
        ))}
        {steps.edit && (
          <div
            className="dfb-branch-toggles"
            style={{ marginTop: items.length ? 0 : undefined }}
          >
            <button
              type="button"
              className="dfb-branch-toggle"
              onClick={() =>
                safely(() => addBranchItem(flow.flowId, action.id, branch.key))
              }
            >
              <i className="fa-solid fa-plus" aria-hidden /> Add{" "}
              {(branch.itemLabel ?? branch.label).toLowerCase()}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="dfb-branch" style={{ "--btint": tint }}>
      <div className="dfb-branch__head">
        <span className="dfb-branch__label">
          <i className="fa-solid fa-turn-down" aria-hidden /> {branch.label}
        </span>
        {provides}
        {branch.optional && steps.edit && (
          <IconButton
            size="sm"
            icon="fa-solid fa-xmark"
            label={`Remove “${branch.label}”`}
            tone="danger"
            onClick={async () => {
              if (
                entries.length &&
                !(await confirm({
                  title: `Remove “${branch.label}”?`,
                  message: "The steps inside it will be deleted too.",
                  confirmLabel: "Remove",
                  danger: true,
                }))
              )
                return;
              safely(() =>
                setBranchEnabled(flow.flowId, action.id, branch.key, false),
              );
            }}
          />
        )}
      </div>
      {branch.description && (
        <p className="dfb-input-field__help" style={{ margin: "0 0 8px" }}>
          {branch.description}
        </p>
      )}
      <ActionList actions={entries ?? []} location={location} compact />
    </div>
  );
}

export function ActionCard({ action, location, index, count }) {
  const flow = useFlowContext();
  const steps = useSteps();
  const { catalog, builder, updateActionInputs, setBranchEnabled } =
    useBuilder();
  const menuAnchor = useRef(null);
  const card = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const def = catalog.actions.get(action.type);
  const category = catalog.categoryById[def?.category];
  const tint = category?.color ?? "#8b6cff";
  const issues = flow.issues.get(action.id) ?? [];
  const hasError = issues.some((issue) => issue.level === "error");

  useEffect(() => {
    if (flow.flashId !== action.id || !card.current) return;
    card.current.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [action.id, flow.flashId]);

  if (!def)
    return (
      <div className="dfb-step dfb-step--error" style={{ "--tint": "#ff5c5c" }}>
        <div className="dfb-step__head">
          <span className="dfb-step__icon">
            <i className="fa-solid fa-circle-question" aria-hidden />
          </span>
          <div className="dfb-step__titles">
            <h3 className="dfb-step__title">Unknown step</h3>
            <div className="dfb-step__summary">
              This step doesn't exist anymore. Delete it.
            </div>
          </div>
          {hasMenu(steps) && (
            <div className="dfb-step__tools">
              <IconButton
                ref={menuAnchor}
                icon="fa-solid fa-ellipsis"
                label="Step options"
                onClick={() => setMenuOpen(true)}
              />
            </div>
          )}
        </div>
        <StepMenu
          anchor={menuAnchor}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          action={action}
          location={location}
          index={index}
          count={count}
        />
      </div>
    );

  const rawOf = (key) =>
    literalOf(
      def.inputs.find((i) => i.key === key),
      action.inputs?.[key],
    );
  const visibleInputs = def.inputs.filter((inputDef) =>
    inputVisible(inputDef, rawOf),
  );
  const env = { catalog, builder, info: flow.info, location };
  const summary = sentenceFor(def, action, env) ?? def.description;
  const scope = { location, path: [], ownerId: def.id };
  const toggles = def.branches.filter(
    (branch) =>
      branch.optional && !Array.isArray(action.branches?.[branch.key]),
  );

  return (
    <article
      ref={card}
      className={`dfb-step ${hasError ? "dfb-step--error" : ""} ${action.disabled ? "dfb-step--off" : ""} ${flow.dragging === action.id ? "dfb-step--drag" : ""} ${flow.flashId === action.id ? "dfb-step--flash" : ""}`}
      style={{ "--tint": tint, animationDelay: `${Math.min(index, 8) * 35}ms` }}
      aria-label={def.label}
    >
      <header className="dfb-step__head">
        {steps.move && (
          <span
            className="dfb-step__grip"
            draggable
            role="button"
            tabIndex={-1}
            aria-label="Drag to move"
            title="Drag to move"
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", action.id);
              if (card.current)
                event.dataTransfer.setDragImage(card.current, 30, 24);
              flow.setDragging(action.id);
            }}
            onDragEnd={() => flow.setDragging(null)}
          >
            <i className="fa-solid fa-grip-vertical" aria-hidden />
          </span>
        )}
        <span className="dfb-step__icon">
          <i
            className={def.icon ?? category?.icon ?? "fa-solid fa-circle"}
            aria-hidden
          />
        </span>
        <div
          className="dfb-step__titles"
          onClick={() => setCollapsed((c) => !c)}
        >
          <h3 className="dfb-step__title">
            {def.label}
            {action.disabled && <Badge>Off</Badge>}
            {issues.length > 0 && (
              <Badge
                tone={hasError ? "danger" : "amber"}
                icon="fa-solid fa-triangle-exclamation"
              >
                {issues.length}
              </Badge>
            )}
          </h3>
          {(collapsed || def.sentence) && summary && (
            <div className="dfb-step__summary">{summary}</div>
          )}
        </div>
        <div className="dfb-step__tools">
          <IconButton
            icon={
              collapsed ? "fa-solid fa-chevron-down" : "fa-solid fa-chevron-up"
            }
            label={collapsed ? "Show details" : "Hide details"}
            onClick={() => setCollapsed((c) => !c)}
          />
          {hasMenu(steps) && (
            <IconButton
              ref={menuAnchor}
              icon="fa-solid fa-ellipsis"
              label="Step options"
              onClick={() => setMenuOpen(true)}
            />
          )}
        </div>
      </header>

      {!collapsed && issues.length > 0 && (
        <div className="dfb-step__issues">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={`dfb-step__issue ${issue.level === "warning" ? "dfb-step__issue--warning" : ""}`}
            >
              <i
                className={
                  issue.level === "error"
                    ? "fa-solid fa-circle-xmark"
                    : "fa-solid fa-triangle-exclamation"
                }
                aria-hidden
                style={{ marginTop: 2 }}
              />
              {issue.message}
            </div>
          ))}
        </div>
      )}

      {!collapsed && visibleInputs.length > 0 && (
        <div className="dfb-step__body dfb-step__body--wide">
          {!def.sentence && def.description && visibleInputs.length > 2 && (
            <p className="dfb-step__description">{def.description}</p>
          )}
          {visibleInputs.map((inputDef) => (
            <InputField
              key={inputDef.key}
              def={inputDef}
              value={action.inputs?.[inputDef.key]}
              scope={scope}
              readOnly={!steps.edit}
              onChange={(value, options) =>
                safely(() =>
                  updateActionInputs(
                    flow.flowId,
                    action.id,
                    { [inputDef.key]: value },
                    options,
                  ),
                )
              }
            />
          ))}
        </div>
      )}

      {!collapsed && <HandlerStrip action={action} />}

      {!collapsed &&
        !visibleInputs.length &&
        !def.branches.length &&
        def.description && (
          <p
            className="dfb-step__description"
            style={{ padding: "0 16px 14px", margin: 0 }}
          >
            {def.description}
          </p>
        )}

      {!collapsed &&
        def.branches.map((branch) => (
          <Branch
            key={branch.key}
            action={action}
            def={def}
            branch={branch}
            tint={tint}
          />
        ))}

      {!collapsed && steps.edit && toggles.length > 0 && (
        <div className="dfb-branch-toggles">
          {toggles.map((branch) => (
            <button
              type="button"
              key={branch.key}
              className="dfb-branch-toggle"
              onClick={() =>
                safely(() =>
                  setBranchEnabled(flow.flowId, action.id, branch.key, true),
                )
              }
            >
              <i className="fa-solid fa-plus" aria-hidden /> {branch.label}
            </button>
          ))}
        </div>
      )}

      {hasMenu(steps) && (
        <StepMenu
          anchor={menuAnchor}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          action={action}
          location={location}
          index={index}
          count={count}
        />
      )}
    </article>
  );
}

export default ActionList;
