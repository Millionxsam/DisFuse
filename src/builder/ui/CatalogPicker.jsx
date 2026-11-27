import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { SearchInput } from "./fields.jsx";

/* =====================================================================
   The catalog picker
   ---------------------------------------------------------------------
   How people choose an event, a step or a value: a rail of color-coded
   categories on the left, a search box, and cards with an icon, a name
   and a line saying what each one does. Never a plain dropdown.

   <CatalogPicker
     items={[{ id, label, description, icon, category, group, keywords,
               disabled, reason, badge }]}
     categories={catalog.categories}
     recent={["channel_send_message"]}
     onPick={(item) => ...}
   />

   Search matches the name, the description, extra keywords and the
   category, all words in any order, and ranks names that start with
   what was typed first. Arrow keys move, Enter picks.
   ===================================================================== */

const norm = (text) => String(text ?? "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

function score(item, words, categoryLabel) {
  const label = norm(item.label);
  const haystack = `${label} ${norm(item.description)} ${norm((item.keywords ?? []).join(" "))} ${norm(categoryLabel)} ${norm(item.group)}`;
  let total = 0;
  for (const word of words) {
    if (!haystack.includes(word)) return -1;
    if (label.startsWith(word)) total += 6;
    else if (label.split(/\s+/).some((part) => part.startsWith(word))) total += 4;
    else if (label.includes(word)) total += 3;
    else total += 1;
  }
  return total;
}

export function CatalogPicker({ items, categories, onPick, placeholder = "Search…", emptyText = "Nothing matches that. Try other words.", recent = [], autoFocus = true }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(recent.length ? "recent" : "all");
  const [active, setActive] = useState(0);
  const search = useRef(null);
  const results = useRef(null);

  const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const counts = useMemo(() => {
    const map = new Map();
    for (const item of items) map.set(item.category, (map.get(item.category) ?? 0) + 1);
    return map;
  }, [items]);

  const usedCategories = categories.filter((c) => counts.has(c.id));

  /* What's shown, as [{ title, color, items }]. */
  const sections = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);

    if (words.length) {
      const scored = items
        .map((item) => ({ item, s: score(item, words, categoryById[item.category]?.label) }))
        .filter((entry) => entry.s >= 0)
        .sort((a, b) => b.s - a.s || Number(Boolean(a.item.disabled)) - Number(Boolean(b.item.disabled)));
      return scored.length ? [{ title: `${scored.length} result${scored.length === 1 ? "" : "s"}`, items: scored.map((e) => e.item) }] : [];
    }

    if (category === "recent") {
      const list = recent.map((id) => items.find((i) => i.id === id)).filter(Boolean);
      return list.length ? [{ title: "Used recently", items: list }] : [];
    }

    const inCategory = (id) => items.filter((i) => i.category === id);
    const cats = category === "all" ? usedCategories : usedCategories.filter((c) => c.id === category);
    const out = [];
    for (const cat of cats) {
      const list = inCategory(cat.id);
      /* The category's own items first, then its groups. A group named
         like its category ("Messages" in Messages) is the same thing. */
      const groups = new Map([["", []]]);
      for (const item of list) {
        const group = item.group ?? "";
        const key = group.toLowerCase() === cat.label.toLowerCase() ? "" : group;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
      }
      if (!groups.get("").length) groups.delete("");
      for (const [group, groupItems] of groups)
        out.push({ title: category === "all" ? (group ? `${cat.label}: ${group}` : cat.label) : group || cat.label, color: cat.color, items: groupItems });
    }
    return out;
  }, [category, categoryById, items, query, recent, usedCategories]);

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => setActive(0), [query, category]);

  useEffect(() => {
    results.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const move = (delta) => {
    if (!flat.length) return;
    let next = active;
    for (let i = 0; i < flat.length; i++) {
      next = (next + delta + flat.length) % flat.length;
      if (!flat[next].disabled) break;
    }
    setActive(next);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown" || (event.key === "ArrowRight" && event.target !== search.current)) {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp" || (event.key === "ArrowLeft" && event.target !== search.current)) {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter") {
      const item = flat[active];
      if (item && !item.disabled) {
        event.preventDefault();
        onPick(item);
      }
    }
  };

  let index = -1;

  return (
    <div className="dfb-picker" onKeyDown={onKeyDown}>
      <nav className="dfb-picker__rail" aria-label="Categories">
        {recent.length > 0 && (
          <button type="button" className={`dfb-picker__cat ${category === "recent" && !query ? "dfb-picker__cat--active" : ""}`} style={{ "--cat": "#ffb648" }} onClick={() => setCategory("recent")}>
            <span className="dfb-picker__cat-icon">
              <i className="fa-solid fa-clock-rotate-left" aria-hidden />
            </span>
            Recent
          </button>
        )}
        <button type="button" className={`dfb-picker__cat ${category === "all" && !query ? "dfb-picker__cat--active" : ""}`} style={{ "--cat": "#8b6cff" }} onClick={() => setCategory("all")}>
          <span className="dfb-picker__cat-icon">
            <i className="fa-solid fa-border-all" aria-hidden />
          </span>
          Everything
          <span className="dfb-picker__cat-count">{items.length}</span>
        </button>
        {usedCategories.map((cat, index) => (
          <Fragment key={cat.id}>
          {cat.section && cat.section !== usedCategories[index - 1]?.section && (
            <div className="dfb-picker__rail-heading" role="presentation">
              {cat.section}
            </div>
          )}
          <button
            type="button"
            className={`dfb-picker__cat ${category === cat.id && !query ? "dfb-picker__cat--active" : ""}`}
            style={{ "--cat": cat.color }}
            onClick={() => {
              setCategory(cat.id);
              setQuery("");
            }}
          >
            <span className="dfb-picker__cat-icon">
              <i className={cat.icon} aria-hidden />
            </span>
            {cat.label}
            <span className="dfb-picker__cat-count">{counts.get(cat.id)}</span>
          </button>
          </Fragment>
        ))}
      </nav>

      <div className="dfb-picker__main">
        <div className="dfb-picker__search">
          <SearchInput ref={search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} autoFocus={autoFocus} aria-label="Search" data-autofocus />
        </div>
        <div className="dfb-picker__results" ref={results} role="listbox" aria-label="Results">
          {!sections.length && <div className="dfb-menu__empty">{emptyText}</div>}
          {sections.map((section) => (
            <section key={section.title}>
              <h4 className="dfb-picker__group-title">
                {section.color && <span style={{ width: 8, height: 8, borderRadius: 3, background: section.color }} aria-hidden />}
                {section.title}
              </h4>
              <div className="dfb-picker__grid">
                {section.items.map((item) => {
                  index += 1;
                  const cat = categoryById[item.category];
                  const i = index;
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      aria-disabled={item.disabled || undefined}
                      key={item.id}
                      data-index={i}
                      className={`dfb-picker__item ${i === active ? "dfb-picker__item--active" : ""} ${item.disabled ? "dfb-picker__item--disabled" : ""}`}
                      style={{ "--cat": cat?.color ?? "#8b6cff", animationDelay: `${Math.min(i, 18) * 18}ms` }}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => !item.disabled && onPick(item)}
                    >
                      <span className="dfb-picker__item-icon">
                        <i className={item.icon ?? cat?.icon ?? "fa-solid fa-circle"} aria-hidden />
                      </span>
                      <span className="dfb-picker__item-text">
                        <span className="dfb-picker__item-label">{item.label}</span>
                        {item.description && <span className="dfb-picker__item-desc">{item.description}</span>}
                        {item.disabled && item.reason && <span className="dfb-picker__item-reason">{item.reason}</span>}
                        {item.badge && <span className={`dfb-badge dfb-badge--${item.badge.tone ?? "violet"}`}>{item.badge.label}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
