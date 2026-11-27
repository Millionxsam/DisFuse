import { useMemo, useState } from "react";

import { typeInfo, typeLabel } from "../../catalog/types.js";
import { checkVariableName } from "../../model/rules.js";
import { availableValues } from "../../model/scope.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Popover, SearchInput, promptText, toast } from "../../ui/index.js";
import { useFlowContext } from "./FlowContext.js";

/* =====================================================================
   Picking a value for an input
   ---------------------------------------------------------------------
   Only values that fit are offered: the right type for the input, and
   available where the step is (this event's values, the command's
   options, values from the steps around it, variables, then everything
   else by category). Search covers names and descriptions.
   ===================================================================== */

export default function ValuePicker({ anchor, open, onClose, onPick, scope, accepts, inputKind }) {
  const { builder, catalog, createVariable, readOnly, can } = useBuilder();
  const flow = useFlowContext();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    if (!open) return [];
    return availableValues({ catalog, builder, info: flow?.info, location: scope?.location ?? {}, path: scope?.path ?? [], accepts, inputKind });
  }, [accepts, builder, catalog, flow?.info, inputKind, open, scope?.location, scope?.path]);

  const q = query.trim().toLowerCase();
  const shown = q
    ? groups
        .map((group) => ({ ...group, items: group.items.filter((item) => `${item.label} ${item.description} ${(item.def?.keywords ?? []).join(" ")} ${group.label}`.toLowerCase().includes(q)) }))
        .filter((group) => group.items.length)
    : groups;

  const pick = (ref) => {
    onPick(ref);
    setQuery("");
  };

  const newVariable = async () => {
    const name = await promptText({
      title: "New variable",
      message: "A variable remembers a value while the bot runs, so any command or event can use it later. It starts out empty.",
      label: "Name",
      placeholder: "score",
      icon: "fa-solid fa-box",
      confirmLabel: "Create",
      validate: (text) => checkVariableName(text, builder.variables.map((v) => v.name)),
    });
    if (!name) return;
    try {
      const variable = createVariable(name.trim());
      pick({ kind: "variable", id: variable.id });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Popover anchor={anchor} open={open} onClose={onClose} ariaLabel="Choose a value" className="dfb-vpick-popover">
      <div className="dfb-vpick">
        <div className="dfb-vpick__search">
          <SearchInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search values" autoFocus aria-label="Search values" />
          <p className="dfb-vpick__hint">Showing values that fit here: {typeLabel(accepts).toLowerCase()}{inputKind === "text" ? ", or anything that can be written as text" : ""}.</p>
        </div>
        <div className="dfb-vpick__list" role="listbox">
          {!shown.length && <div className="dfb-menu__empty">No values fit here{q ? ` for “${query}”` : ""}.</div>}
          {shown.map((group) => (
            <div key={group.id}>
              <div className="dfb-vpick__group" style={{ "--gcolor": group.color }}>
                <i className={group.icon} aria-hidden /> {group.label}
              </div>
              {group.items.map((item) => {
                const info = typeInfo(item.output);
                const color = item.def ? catalog.categoryById[item.def.category]?.color : group.color;
                return (
                  <button type="button" role="option" key={item.key} className="dfb-vpick__item" style={{ "--pill": color ?? info.color }} onClick={() => pick(item.ref)} title={item.description}>
                    <span className="dfb-pill__icon" style={{ background: color ?? info.color }}>
                      <i className={item.def?.icon ?? info.icon} aria-hidden />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      {item.label}
                      {item.description && <small>{item.description}</small>}
                    </span>
                    <span className="dfb-vpick__type">{typeLabel(item.output)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {!readOnly && can("variables.create") && (
          <div className="dfb-vpick__foot">
            <button type="button" className="dfb-btn dfb-btn--ghost dfb-btn--sm dfb-btn--block" onClick={newVariable}>
              <i className="fa-solid fa-box" aria-hidden /> New variable
            </button>
          </div>
        )}
      </div>
    </Popover>
  );
}
