import { useEffect, useMemo, useRef, useState } from "react";

import { Popover } from "./Popover.jsx";

/* =====================================================================
   Select and MultiSelect
   ---------------------------------------------------------------------
   Real dropdowns (not the browser's), so they look like the rest of the
   builder, can show icons and a line of description per option, and
   can be searched when the list is long.

   <Select value={value} onChange={setValue}
           options={[{ value: "online", label: "Online", icon: "fa-solid fa-circle" }]} />

   Keyboard: Enter/Space/Down opens; arrows move; Enter picks; Escape
   closes; typing filters when the list has a search box.
   ===================================================================== */

function useMenuKeys({ open, setOpen, items, onPick }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) setActive(0);
  }, [open, items.length]);

  const onKeyDown = (event) => {
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[active];
      if (item && !item.disabled) onPick(item);
    } else if (event.key === "Tab") setOpen(false);
  };

  return { active, setActive, onKeyDown };
}

function filterOptions(options, query) {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => `${o.label} ${o.description ?? ""}`.toLowerCase().includes(q));
}

function MenuList({ items, active, setActive, selected, onPick, emptyText = "Nothing matches" }) {
  const list = useRef(null);
  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!items.length) return <div className="dfb-menu__empty">{emptyText}</div>;

  return (
    <div ref={list} role="listbox">
      {items.map((option, index) => {
        const isSelected = selected(option);
        return (
          <button
            type="button"
            role="option"
            aria-selected={isSelected}
            key={option.value}
            data-index={index}
            disabled={option.disabled}
            className={`dfb-menu__item ${index === active ? "dfb-menu__item--active" : ""} ${isSelected ? "dfb-menu__item--selected" : ""}`}
            onMouseEnter={() => setActive(index)}
            onClick={() => onPick(option)}
          >
            {option.icon && <i className={option.icon} aria-hidden style={option.color ? { color: option.color } : undefined} />}
            <span className="dfb-menu__label">
              {option.label}
              {option.description && <small>{option.description}</small>}
            </span>
            {isSelected && <i className="fa-solid fa-check dfb-menu__check" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

export function Select({ value, options, onChange, placeholder = "Choose…", searchable, disabled = false, className = "", ariaLabel, id }) {
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const withSearch = searchable ?? options.length > 9;
  const items = useMemo(() => filterOptions(options, query), [options, query]);
  const current = options.find((o) => String(o.value) === String(value));

  const pick = (option) => {
    onChange?.(option.value);
    setOpen(false);
    setQuery("");
    anchor.current?.focus();
  };
  const keys = useMenuKeys({ open, setOpen, items, onPick: pick });

  return (
    <>
      <button
        ref={anchor}
        id={id}
        type="button"
        className={`dfb-select ${open ? "dfb-select--open" : ""} ${className}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={keys.onKeyDown}
      >
        {current?.icon && <i className={current.icon} aria-hidden style={current.color ? { color: current.color } : undefined} />}
        <span className={`dfb-select__value ${current ? "" : "dfb-select__placeholder"}`}>{current?.label ?? placeholder}</span>
        <i className="fa-solid fa-chevron-down dfb-select__chevron" aria-hidden />
      </button>
      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} matchWidth role="presentation">
        <div className="dfb-menu" onKeyDown={keys.onKeyDown}>
          {withSearch && (
            <div className="dfb-menu__search">
              <input
                className="dfb-input"
                placeholder="Search…"
                value={query}
                autoFocus
                onChange={(event) => {
                  setQuery(event.target.value);
                  keys.setActive(0);
                }}
              />
            </div>
          )}
          <MenuList items={items} active={keys.active} setActive={keys.setActive} selected={(o) => String(o.value) === String(value)} onPick={pick} />
        </div>
      </Popover>
    </>
  );
}

/** Several choices. `value` is an array of option values. */
export function MultiSelect({ value = [], options, onChange, placeholder = "Choose…", searchable, disabled = false, ariaLabel }) {
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const withSearch = searchable ?? options.length > 9;
  const items = useMemo(() => filterOptions(options, query), [options, query]);
  const chosen = new Set((value ?? []).map(String));

  const toggle = (option) => {
    const next = chosen.has(String(option.value))
      ? value.filter((v) => String(v) !== String(option.value))
      : [...value, option.value];
    onChange?.(next);
  };
  const keys = useMenuKeys({ open, setOpen, items, onPick: toggle });

  return (
    <>
      <div
        ref={anchor}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`dfb-multi ${open ? "dfb-select--open" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={keys.onKeyDown}
        style={disabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
      >
        {value?.length ? (
          options
            .filter((o) => chosen.has(String(o.value)))
            .map((option) => (
              <span key={option.value} className="dfb-chip" style={{ "--chip-bg": "rgba(139,108,255,0.16)", "--chip-border": "rgba(139,108,255,0.4)" }}>
                {option.label}
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Remove ${option.label}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggle(option);
                    }}
                  >
                    <i className="fa-solid fa-xmark" aria-hidden />
                  </button>
                )}
              </span>
            ))
        ) : (
          <span className="dfb-multi__placeholder">{placeholder}</span>
        )}
        <i className="fa-solid fa-chevron-down dfb-select__chevron" aria-hidden style={{ marginLeft: "auto", paddingRight: 4 }} />
      </div>
      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} matchWidth role="presentation">
        <div className="dfb-menu" onKeyDown={keys.onKeyDown}>
          {withSearch && (
            <div className="dfb-menu__search">
              <input className="dfb-input" placeholder="Search…" value={query} autoFocus onChange={(event) => setQuery(event.target.value)} />
            </div>
          )}
          <MenuList items={items} active={keys.active} setActive={keys.setActive} selected={(o) => chosen.has(String(o.value))} onPick={toggle} />
        </div>
      </Popover>
    </>
  );
}
