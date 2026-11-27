import { useRef, useState } from "react";

import { literalOf } from "../../codegen/context.js";
import { newId } from "../../model/ids.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { IconButton, Popover } from "../../ui/index.js";

/* =====================================================================
   The pieces of a message or form, as a tree
   ---------------------------------------------------------------------
   Shared by the message builder and the form builder. Pieces can only
   be added where Discord allows them: each piece says where it can go
   (`placement`) and what it can hold (`children.accepts`), so a button
   can only go in a row, an option only in a menu, and so on.
   ===================================================================== */

/* A new menu with no options (or a question with no way to answer) is
   useless, so some pieces start with one thing inside. */
const STARTERS = {
  msg_menu: ["msg_menu_option"],
  msg_gallery: ["msg_gallery_item"],
  msg_row: ["msg_button"],
  form_question: ["form_text_input"],
  form_menu: ["form_menu_option"],
  form_radio: ["form_choice", "form_choice"],
  form_checkboxes: ["form_choice"],
};

/* What a new question asks, to suit how it's answered. */
const QUESTIONS = {
  form_menu: "Pick one",
  form_user_menu: "Who is it?",
  form_role_menu: "Which role?",
  form_mentionable_menu: "Who or which role?",
  form_channel_menu: "Which channel?",
  form_file_upload: "Add a file",
  form_radio: "Pick one",
  form_checkboxes: "Check all that apply",
  form_checkbox: "Do you agree?",
};

/** A new piece. `inner` picks what a one-piece holder (a question)
    starts with, instead of its usual starter. */
export function makeComponent(catalog, type, inner) {
  const def = catalog.components.get(type);
  const component = { id: newId(), type, inputs: {} };
  if (def?.children) component.children = (inner ? [inner] : (STARTERS[type] ?? [])).map((child) => makeComponent(catalog, child));
  if (type === "form_question" && QUESTIONS[inner]) component.inputs.label = { literal: QUESTIONS[inner] };
  return component;
}

/* A piece that holds exactly one other piece, like a question and its
   answer. Adding one means picking both at once. */
const holdsOne = (def) => def?.children?.min === 1 && def?.children?.max === 1;

/* What a menu of pieces offers: each piece, except that a one-piece
   holder is listed once per thing it can hold ("Question" becomes
   "Text box", "Menu", "Checkboxes"...), under its own heading. */
function menuEntries(catalog, family, placement) {
  const plain = [];
  const held = [];
  for (const def of catalog.components.values()) {
    if (def.family !== family || !def.placement.includes(placement)) continue;
    if (!holdsOne(def)) {
      plain.push({ key: def.id, def, type: def.id });
      continue;
    }
    const inner = [...catalog.components.values()].filter((c) => c.family === family && c.placement.includes(def.children.accepts));
    held.push({ heading: `${def.label}, answered with`, entries: inner.map((c) => ({ key: `${def.id}:${c.id}`, def: c, type: def.id, inner: c.id })) });
  }
  return [...held, ...(plain.length ? [{ heading: held.length ? "Other" : null, entries: plain }] : [])];
}

/* Discord refuses a message where two buttons or menus share an ID, and
   a form where two questions do. New and copied pieces get the next free
   one: my-button, my-button-2, and so on. */
const isIdField = (field) => field.kind === "text" && / ID$/.test(field.label) && !field.key.startsWith("filter");

function usedIds(catalog, list, used = new Set()) {
  for (const component of list ?? []) {
    for (const field of catalog.components.get(component.type)?.fields ?? []) {
      if (!isIdField(field)) continue;
      const value = component.inputs?.[field.key]?.literal ?? field.default;
      if (value) used.add(String(value));
    }
    usedIds(catalog, component.children, used);
  }
  return used;
}

function giveUniqueIds(catalog, component, used) {
  for (const field of catalog.components.get(component.type)?.fields ?? []) {
    if (!isIdField(field) || component.inputs?.[field.key]?.ref) continue;
    const base = String(component.inputs?.[field.key]?.literal ?? field.default ?? "") || field.placeholder || "id";
    let value = base;
    for (let n = 2; used.has(value); n++) value = `${base}-${n}`;
    used.add(value);
    component.inputs = { ...component.inputs, [field.key]: { literal: value } };
  }
  for (const child of component.children ?? []) giveUniqueIds(catalog, child, used);
  return component;
}

/** Fresh pieces (a starter's, say) with IDs that don't clash. */
export function withUniqueIds(catalog, list, existing = []) {
  const used = usedIds(catalog, existing);
  return list.map((component) => giveUniqueIds(catalog, component, used));
}

function copyComponent(component) {
  return { ...component, id: newId(), inputs: JSON.parse(JSON.stringify(component.inputs ?? {})), children: component.children?.map(copyComponent) };
}

/* ---- Tree edits: pure, return new arrays ---- */

export function updateIn(list, id, update) {
  return list.map((component) => {
    if (component.id === id) return update(component);
    if (component.children) return { ...component, children: updateIn(component.children, id, update) };
    return component;
  });
}

function removeIn(list, id) {
  return list
    .filter((component) => component.id !== id)
    .map((component) => (component.children ? { ...component, children: removeIn(component.children, id) } : component));
}

function moveIn(list, id, delta) {
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    const next = [...list];
    const target = index + delta;
    if (target < 0 || target >= next.length) return list;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }
  return list.map((component) => (component.children ? { ...component, children: moveIn(component.children, id, delta) } : component));
}

function duplicateIn(list, id, fix) {
  const index = list.findIndex((c) => c.id === id);
  if (index !== -1) {
    const next = [...list];
    next.splice(index + 1, 0, fix(copyComponent(list[index])));
    return next;
  }
  return list.map((component) => (component.children ? { ...component, children: duplicateIn(component.children, id, fix) } : component));
}

export function findIn(list, id) {
  for (const component of list ?? []) {
    if (component.id === id) return component;
    const inner = findIn(component.children, id);
    if (inner) return inner;
  }
  return null;
}

/** A short line describing a piece: its text, label or ID. */
function summaryOf(def, component) {
  for (const key of ["content", "text", "label", "placeholder", "url", "file", "value"]) {
    const field = def.fields.find((f) => f.key === key);
    if (!field) continue;
    const value = component.inputs?.[key];
    if (value?.ref) return "Uses a value";
    const literal = literalOf(field, value);
    if (literal) return String(literal).replace(/\s+/g, " ").slice(0, 60);
  }
  return "";
}

function AddMenu({ family, placement, onAdd, label, icon = "fa-solid fa-plus", disabledReason, current }) {
  const { catalog } = useBuilder();
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  const sections = menuEntries(catalog, family, placement);

  if (!sections.length) return null;

  return (
    <>
      <button ref={anchor} type="button" className="dfb-tree__add" disabled={Boolean(disabledReason)} title={disabledReason ?? undefined} onClick={() => setOpen(true)}>
        <i className={icon} aria-hidden /> {label}
      </button>
      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} role="menu">
        <div className="dfb-menu" style={{ width: 340 }}>
          {sections.map((section, sectionIndex) => (
            <div key={section.heading ?? sectionIndex} className="dfb-menu__section">
              {section.heading && <div className="dfb-menu__heading">{section.heading}</div>}
              {section.entries.map(({ key, def, type, inner }) => (
                <button
                  type="button"
                  role="menuitem"
                  key={key}
                  className={`dfb-menu__item ${def.id === current ? "dfb-menu__item--selected" : ""}`}
                  onClick={() => {
                    setOpen(false);
                    onAdd(type, inner);
                  }}
                >
                  <i className={def.icon} aria-hidden />
                  <span className="dfb-menu__label">
                    {def.label}
                    <small>{def.description}</small>
                  </span>
                  {def.id === current && <i className="fa-solid fa-check dfb-menu__check" aria-hidden />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </Popover>
    </>
  );
}

function Node({ component, family, depth, siblings, index, api }) {
  const { catalog } = useBuilder();
  const def = catalog.components.get(component.type);
  const selected = api.selectedId === component.id;

  if (!def)
    return (
      <li className="dfb-tree__node">
        <div className="dfb-tree__row dfb-tree__row--error">
          <i className="fa-solid fa-circle-question" aria-hidden />
          <span className="dfb-tree__label">Unknown piece</span>
          {!api.readOnly && <IconButton size="sm" icon="fa-solid fa-trash-can" label="Remove" tone="danger" onClick={() => api.remove(component.id)} />}
        </div>
      </li>
    );

  const children = component.children ?? [];
  const full = def.children?.max && children.length >= def.children.max;
  const summary = summaryOf(def, component);

  return (
    <li className="dfb-tree__node" style={{ animationDelay: `${index * 30}ms` }}>
      <div className={`dfb-tree__row ${selected ? "dfb-tree__row--selected" : ""}`}>
        <button type="button" className="dfb-tree__select" onClick={() => api.select(component.id)} aria-pressed={selected}>
          <span className="dfb-tree__icon">
            <i className={def.icon} aria-hidden />
          </span>
          <span className="dfb-tree__text">
            <span className="dfb-tree__label">{def.label}</span>
            {summary && <span className="dfb-tree__summary">{summary}</span>}
          </span>
        </button>
        {!api.readOnly && (
          <span className="dfb-tree__tools">
            <IconButton size="sm" icon="fa-solid fa-chevron-up" label="Move up" disabled={index === 0} onClick={() => api.move(component.id, -1)} />
            <IconButton size="sm" icon="fa-solid fa-chevron-down" label="Move down" disabled={index === siblings.length - 1} onClick={() => api.move(component.id, 1)} />
            <IconButton size="sm" icon="fa-regular fa-clone" label="Duplicate" onClick={() => api.duplicate(component.id)} />
            <IconButton size="sm" icon="fa-solid fa-trash-can" label="Remove" tone="danger" onClick={() => api.remove(component.id)} />
          </span>
        )}
      </div>
      {def.children && (
        <div className="dfb-tree__children">
          {children.length > 0 && (
            <ul className="dfb-tree__list">
              {children.map((child, childIndex) => (
                <Node key={child.id} component={child} family={family} depth={depth + 1} siblings={children} index={childIndex} api={api} />
              ))}
            </ul>
          )}
          {!api.readOnly &&
            (holdsOne(def) && full ? (
              <AddMenu
                family={family}
                placement={def.children.accepts}
                label={family === "modal" ? "Change how it's answered" : "Change what's inside"}
                icon="fa-solid fa-arrows-rotate"
                current={children[0]?.type}
                onAdd={(type) => api.swap(children[0].id, type)}
              />
            ) : (
              <AddMenu
                family={family}
                placement={def.children.accepts}
                label="Add inside"
                disabledReason={full ? `This holds up to ${def.children.max}.` : null}
                onAdd={(type, inner) => api.add(component.id, type, inner)}
              />
            ))}
        </div>
      )}
    </li>
  );
}

/**
 * @param {object} props
 * @param {"message"|"modal"} props.family
 * @param {string} props.rootPlacement  "root" for messages, "modal" for forms
 * @param {object[]} props.components
 * @param {(components) => void} props.onChange
 */
export default function ComponentTree({ family, rootPlacement, components = [], onChange, selectedId, onSelect, readOnly, rootLabel = "Add a piece", maxRoot }) {
  const { catalog } = useBuilder();

  const api = {
    selectedId,
    readOnly,
    select: onSelect,
    add: (parentId, type, inner) => {
      const created = giveUniqueIds(catalog, makeComponent(catalog, type, inner), usedIds(catalog, components));
      onChange(parentId ? updateIn(components, parentId, (c) => ({ ...c, children: [...(c.children ?? []), created] })) : [...components, created]);
      onSelect(created.id);
    },
    remove: (id) => {
      onChange(removeIn(components, id));
      if (selectedId === id) onSelect(null);
    },
    /* A different kind of piece in the same place. What both kinds
       have (an answer ID, "must be answered") comes along. */
    swap: (id, type) => {
      const old = findIn(components, id);
      if (!old || old.type === type) return;
      const fields = new Set((catalog.components.get(type)?.fields ?? []).map((f) => f.key));
      const kept = Object.fromEntries(Object.entries(old.inputs ?? {}).filter(([key]) => fields.has(key)));
      const created = { ...makeComponent(catalog, type), id: old.id, inputs: kept };
      onChange(updateIn(components, id, () => created));
      onSelect(created.id);
    },
    move: (id, delta) => onChange(moveIn(components, id, delta)),
    duplicate: (id) => onChange(duplicateIn(components, id, (copy) => giveUniqueIds(catalog, copy, usedIds(catalog, components)))),
  };

  return (
    <div className="dfb-tree">
      {components.length > 0 && (
        <ul className="dfb-tree__list dfb-tree__list--root">
          {components.map((component, index) => (
            <Node key={component.id} component={component} family={family} depth={0} siblings={components} index={index} api={api} />
          ))}
        </ul>
      )}
      {!readOnly && (
        <AddMenu
          family={family}
          placement={rootPlacement}
          label={rootLabel}
          disabledReason={maxRoot && components.length >= maxRoot ? `Discord allows up to ${maxRoot} here.` : null}
          onAdd={(type, inner) => api.add(null, type, inner)}
        />
      )}
    </div>
  );
}
