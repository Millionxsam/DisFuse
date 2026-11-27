import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { Section } from "../components/layout/PageLayout.jsx";
import ItemEditor, { KIND_INFO } from "../components/packs/ItemEditor.jsx";
import { PackDetailsModal, PublishModal } from "../components/packs/PackModals.jsx";
import { CodeTemplate } from "../components/packs/PackFields.jsx";
import { publishPack, savePackDraft, savePackDraftOnExit } from "../components/packs/packApi.js";
import { latestPackItems } from "../catalog/packs.js";
import {
  PACK_LIMITS,
  breakingChanges,
  cleanPackItems,
  countPackItems,
  emptyPackItems,
  newPackItemId,
  packProblems,
  restoreBreaking,
} from "../model/packs.js";
import { Badge, Breadcrumbs, Button, DialogHost, EmptyState, IconButton, SaveIndicator, Toaster, confirm, toast } from "../ui/index.js";

import "../../styles/builder/pages.css";
import "../../styles/builder/packs.css";

/* =====================================================================
   The Workshop's editor for builder packs
   ---------------------------------------------------------------------
   What /workshop/:packId/workspace shows for a pack made for DisFuse
   Builder (block packs keep their Blockly workspace). A pack is a list
   of events, steps and values, each a small form and a code template,
   plus code shared by all of them. Nothing about a bot: no token, no
   secrets, no settings. Those belong to whoever installs it.

   Like the block workshop, everything saves as you go (to the pack's
   draft) and nobody else sees it until it's published as a version.
   ===================================================================== */

const SAVE_DELAY_MS = 900;

const LISTS = [
  { kind: "event", key: "events", title: "Events", add: "Add an event" },
  { kind: "action", key: "actions", title: "Steps", add: "Add a step" },
  { kind: "value", key: "values", title: "Values", add: "Add a value" },
];

function blankItem(kind) {
  const common = { id: newPackItemId(), label: "", description: "", icon: "", group: "" };
  if (kind === "event")
    return { ...common, mode: "client", listen: "", params: [], once: false, code: "", prelude: "", settings: [], values: [], provides: [] };
  if (kind === "action") return { ...common, requires: [], inputs: [], branches: [], code: "" };
  return { ...common, output: "String", requires: [], inputs: [], code: "" };
}

/** The draft to start from: the saved one, else the last version, else nothing. */
function initialItems(pack) {
  if (pack.data) {
    try {
      return cleanPackItems(JSON.parse(pack.data));
    } catch {
      /* Not JSON: fall through. */
    }
  }
  return latestPackItems(pack) ?? emptyPackItems();
}

const serialize = (items) => JSON.stringify(cleanPackItems(items));

/* ---------------------------------------------------------------------
   The pieces of the page
   --------------------------------------------------------------------- */

function Sidebar({ pack, items, selected, onSelect, onAdd, problemsById }) {
  const latest = pack.versions?.[pack.versions.length - 1];
  return (
    <nav className="dfb-pack-nav" aria-label="What's in the pack">
      <button type="button" className={`dfb-pack-nav__pack ${!selected ? "dfb-pack-nav__item--active" : ""}`} onClick={() => onSelect(null)} style={{ "--pack": pack.color || "#014f98" }}>
        <span className="dfb-pack-nav__swatch" aria-hidden>
          <i className="fa-solid fa-cubes-stacked" />
        </span>
        <span>
          <b>{pack.name}</b>
          <small>{latest ? `v${latest.version}` : "Not published yet"}</small>
        </span>
      </button>

      <button type="button" className={`dfb-pack-nav__item ${selected?.kind === "setup" ? "dfb-pack-nav__item--active" : ""}`} onClick={() => onSelect({ kind: "setup" })}>
        <i className="fa-solid fa-file-code" aria-hidden />
        <span>Shared code and packages</span>
      </button>

      {LISTS.map((list) => (
        <div className="dfb-pack-nav__group" key={list.kind}>
          <div className="dfb-pack-nav__title">
            <span>
              {list.title} <small>{items[list.key].length}</small>
            </span>
            {countPackItems(items) < PACK_LIMITS.items && <IconButton icon="fa-solid fa-plus" label={list.add} size="sm" onClick={() => onAdd(list.kind)} />}
          </div>
          {items[list.key].map((item) => {
            const active = selected?.kind === list.kind && selected.id === item.id;
            const problems = problemsById.get(item.id)?.length ?? 0;
            return (
              <button type="button" key={item.id} className={`dfb-pack-nav__item ${active ? "dfb-pack-nav__item--active" : ""}`} onClick={() => onSelect({ kind: list.kind, id: item.id })}>
                <i className={item.icon || KIND_INFO[list.kind].icon} aria-hidden style={{ color: pack.color || "#014f98" }} />
                <span className={item.label ? "" : "dfb-pack-nav__untitled"}>{item.label || `Untitled ${KIND_INFO[list.kind].noun}`}</span>
                {item.archived && (
                  <i className="fa-solid fa-box-archive dfb-pack-nav__archived" title="Archived" aria-label="Archived" />
                )}
                {problems > 0 && <span className="dfb-pack-nav__dot" title={`${problems} to fix`} aria-label={`${problems} to fix`} />}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Breaking({ breaking, onRestore }) {
  return (
    <div className="dfb-pack-problems dfb-pack-problems--error">
      <b>These would break projects using your last version</b>
      <ul>
        {breaking.map(([name, message], index) => (
          <li key={index}>
            <b>{name}</b>: {message}
          </li>
        ))}
      </ul>
      <div>
        <Button size="sm" icon="fa-solid fa-rotate-left" onClick={onRestore}>
          Put them back
        </Button>
      </div>
    </div>
  );
}

function Overview({ pack, items, onAdd, problems, breaking, onRestore, changed }) {
  const latest = pack.versions?.[pack.versions.length - 1];
  const empty = !countPackItems(items);
  return (
    <div className="dfb-pack-overview">
      <div className="dfb-page-header">
        <div className="dfb-page-header__icon" style={{ "--tile": pack.color || "#014f98" }}>
          <i className="fa-solid fa-cubes-stacked" aria-hidden />
        </div>
        <div className="dfb-page-header__text">
          <div className="dfb-page-header__eyebrow">Builder pack</div>
          <h1>{pack.name}</h1>
          <p>
            Events, steps and values for any project, whether it uses DisFuse Builder or the Block Editor. Everything saves as you go, and nobody sees it until you publish.
          </p>
        </div>
        <div className="dfb-page-header__actions">
          <Badge tone={pack.private ? "danger" : "mint"} icon={pack.private ? "fa-solid fa-lock" : "fa-solid fa-earth-americas"}>
            {pack.private ? "Private" : "Public"}
          </Badge>
          {latest ? <Badge icon="fa-solid fa-upload">v{latest.version}</Badge> : <Badge tone="amber">Unpublished</Badge>}
        </div>
      </div>

      {empty && (
        <Section title="Build your pack" icon="fa-solid fa-rocket" description="Each thing you add shows up in the pickers of everyone who installs it, in your pack's color.">
          <ol className="dfb-steps-guide" style={{ margin: 0, padding: 0 }}>
            <li>
              <span className="dfb-steps-guide__num">1</span>
              <span>
                <b>Add events, steps and values</b>Give each one a name, the inputs people fill in, and the JavaScript it writes.
              </span>
            </li>
            <li>
              <span className="dfb-steps-guide__num">2</span>
              <span>
                <b>Check the code</b>The preview beside each one shows exactly what it adds to a bot.
              </span>
            </li>
            <li>
              <span className="dfb-steps-guide__num">3</span>
              <span>
                <b>Publish it</b>Then anyone can install it from the Workshop and use it in any of their projects.
              </span>
            </li>
          </ol>
        </Section>
      )}

      <div className="dfb-pack-starters">
        {LISTS.map((list) => {
          const info = KIND_INFO[list.kind];
          return (
            <button type="button" key={list.kind} className="dfb-pack-starter" style={{ "--tint": info.tint }} onClick={() => onAdd(list.kind)} disabled={countPackItems(items) >= PACK_LIMITS.items}>
              <span className="dfb-pack-starter__icon">
                <i className={info.icon} aria-hidden />
              </span>
              <b>
                {list.add} <small>{items[list.key].length}</small>
              </b>
              <span>{info.blurb}</span>
            </button>
          );
        })}
      </div>

      {(!empty || breaking.length > 0) && (
        <Section
          title={problems.length || breaking.length ? "Things to fix before publishing" : changed ? "Ready to publish" : "Up to date"}
          icon={problems.length || breaking.length ? "fa-solid fa-screwdriver-wrench" : "fa-solid fa-circle-check"}
          description={
            problems.length || breaking.length
              ? "Publishing waits until these are fixed."
              : changed
                ? "You've changed things since the last version. Publish to share them."
                : "Everything here is in the published version."
          }
          actions={problems.length + breaking.length > 0 && <Badge tone="amber">{problems.length + breaking.length}</Badge>}
        >
          {breaking.length > 0 && <Breaking breaking={breaking} onRestore={onRestore} />}
          {problems.length > 0 && (
            <ul className="dfb-pack-problem-list">
              {problems.slice(0, 10).map((problem, index) => (
                <li key={index}>
                  <b>{problem.label}</b>: {problem.message}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title="Who sees it" icon="fa-solid fa-users" description="What people who install your pack get.">
        <p className="dfb-pack-hint">
          Your pack gets its own category, under Workshop, in the step, value and event pickers of every DisFuse Builder project its owner opens. In Block Editor projects it's a category of blocks in the toolbox: each event is a hat block, each step a block that stacks, and each value a round block. You don't need a bot token, secrets or bot settings: each bot that uses your pack brings its own.
        </p>
        <p className="dfb-pack-hint">
          <Link to={`/workshop/${pack._id}`} className="dfb-pack-link">
            See your pack's page <i className="fa-solid fa-arrow-right" aria-hidden />
          </Link>
        </p>
      </Section>
    </div>
  );
}

function SetupPage({ pack, items, onChange, onEditDetails }) {
  return (
    <div className="dfb-pack-overview">
      <div className="dfb-page-header">
        <div className="dfb-page-header__icon" style={{ "--tile": pack.color || "#014f98" }}>
          <i className="fa-solid fa-file-code" aria-hidden />
        </div>
        <div className="dfb-page-header__text">
          <div className="dfb-page-header__eyebrow">Shared by everything in the pack</div>
          <h1>Shared code and packages</h1>
          <p>Code put once at the top of a bot that uses anything from your pack, and the npm packages it needs.</p>
        </div>
      </div>

      <Section title="Shared code" icon="fa-solid fa-code" description="Runs once when the bot starts, before its commands and events. A good place to require packages and make helpers your steps share.">
        <CodeTemplate
          value={items.setup}
          max={PACK_LIMITS.setup}
          onChange={(setup) => onChange({ ...items, setup })}
          placeholder={'const axios = require("axios");\n\nasync function getWeather(city) {\n  const { data } = await axios.get("https://wttr.in/" + encodeURIComponent(city) + "?format=j1");\n  return data;\n}'}
          minRows={8}
        />
        <p className="dfb-pack-hint">
          Give anything you name here a name only your pack would use, so it can't clash with other packs: <code>weatherPackCache</code>, not <code>cache</code>.
        </p>
      </Section>

      <Section
        title="npm packages"
        icon="fa-brands fa-npm"
        description="Added to the package.json of every bot that uses your pack."
        actions={
          <Button size="sm" icon="fa-solid fa-pen" onClick={onEditDetails}>
            Edit
          </Button>
        }
      >
        {pack.dependencies?.length ? (
          <div className="dfb-navcard__chips">
            {pack.dependencies.map((name) => (
              <span className="dfb-chip" key={name}>
                <i className="fa-brands fa-npm" aria-hidden /> {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="dfb-pack-hint">None yet.</p>
        )}
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------------------
   The page
   --------------------------------------------------------------------- */

/**
 * @param {object} props
 * @param {object} props.pack  GET /workshop/:id, already checked to be the viewer's own builder pack
 */
export default function PackApp({ pack: initialPack }) {
  const packId = initialPack._id;
  const [pack, setPack] = useState(initialPack);
  const [items, setItems] = useState(() => initialItems(initialPack));
  const [selected, setSelected] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const itemsRef = useRef(items);
  const lastSaved = useRef(serialize(items));
  const timer = useRef(null);
  const inFlight = useRef(null);

  /* ---- Saving the draft -------------------------------------------- */

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current) await inFlight.current.catch(() => {});
    const draft = serialize(itemsRef.current);
    if (draft === lastSaved.current) {
      setSaveState((state) => (state === "saving" ? "saved" : state));
      return;
    }
    setSaveState("saving");
    inFlight.current = savePackDraft(packId, draft)
      .then(() => {
        lastSaved.current = draft;
        setSaveState("saved");
        setLastSavedAt(new Date());
      })
      .catch((error) => {
        console.error("Couldn't save the pack:", error);
        setSaveState("error");
      })
      .finally(() => {
        inFlight.current = null;
      });
    await inFlight.current;
  }, [packId]);

  useEffect(() => {
    const onVisibility = () => document.visibilityState === "hidden" && save();
    const onBeforeUnload = (event) => {
      const draft = serialize(itemsRef.current);
      if (draft === lastSaved.current && !inFlight.current) return;
      if (draft !== lastSaved.current && savePackDraftOnExit(packId, draft)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      /* Leaving for another page of the app. */
      if (serialize(itemsRef.current) !== lastSaved.current) save();
      clearTimeout(timer.current);
    };
  }, [packId, save]);

  const change = useCallback(
    (next) => {
      itemsRef.current = next;
      setItems(next);
      setSaveState("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(save, SAVE_DELAY_MS);
    },
    [save],
  );

  /* ---- Changing items ---------------------------------------------- */

  const listKey = (kind) => `${kind}s`;

  const addItem = (kind) => {
    if (countPackItems(itemsRef.current) >= PACK_LIMITS.items) return toast.error(`A pack can hold up to ${PACK_LIMITS.items} things.`);
    const item = blankItem(kind);
    change({ ...itemsRef.current, [listKey(kind)]: [...itemsRef.current[listKey(kind)], item] });
    setSelected({ kind, id: item.id });
  };

  const updateItem = (kind, next) =>
    change({ ...itemsRef.current, [listKey(kind)]: itemsRef.current[listKey(kind)].map((item) => (item.id === next.id ? next : item)) });

  const duplicateItem = (kind, item) => {
    if (countPackItems(itemsRef.current) >= PACK_LIMITS.items) return toast.error(`A pack can hold up to ${PACK_LIMITS.items} things.`);
    const copy = { ...structuredClone(item), id: newPackItemId(), label: `${item.label || "Untitled"} (copy)`.slice(0, PACK_LIMITS.label) };
    const list = itemsRef.current[listKey(kind)];
    const index = list.findIndex((i) => i.id === item.id);
    change({ ...itemsRef.current, [listKey(kind)]: [...list.slice(0, index + 1), copy, ...list.slice(index + 1)] });
    setSelected({ kind, id: copy.id });
  };

  const deleteItem = async (kind, item) => {
    const published = latestPackItems(pack)?.[listKey(kind)]?.some((i) => i.id === item.id);
    const ok = await confirm({
      title: `Delete this ${KIND_INFO[kind].noun}?`,
      message: published
        ? `"${item.label || "It"}" is in your published version, so projects may be using it. You can't publish a version without it. To stop offering it without breaking anything, archive it instead.`
        : `"${item.label || "It"}" will be removed from your pack.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    change({ ...itemsRef.current, [listKey(kind)]: itemsRef.current[listKey(kind)].filter((i) => i.id !== item.id) });
    setSelected(null);
  };

  /* ---- Problems and publishing ------------------------------------- */

  const problems = useMemo(() => packProblems(cleanPackItems(items)), [items]);
  const problemsById = useMemo(() => {
    const map = new Map();
    for (const problem of problems) if (problem.id) map.set(problem.id, [...(map.get(problem.id) ?? []), problem]);
    return map;
  }, [problems]);

  const published = useMemo(() => {
    const latest = latestPackItems(pack);
    return latest ? JSON.stringify(latest) : null;
  }, [pack]);
  const changed = published === null ? countPackItems(items) > 0 : serialize(items) !== published;
  const breaking = useMemo(() => breakingChanges(latestPackItems(pack), cleanPackItems(items)), [pack, items]);
  const restore = () => {
    change(restoreBreaking(latestPackItems(pack), cleanPackItems(itemsRef.current)));
    toast.success("Put back what the last version had");
  };

  const publish = async ({ version, changelog }) => {
    await save();
    const updated = await publishPack(packId, { items: cleanPackItems(itemsRef.current), version, changelog });
    setPack(updated);
    toast.success(`Published v${version}`, { detail: "People who install your pack get it now." });
  };

  /* ---- What's open --------------------------------------------------- */

  const current = selected && selected.kind !== "setup" ? items[listKey(selected.kind)].find((item) => item.id === selected.id) : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [selected?.kind, selected?.id]);

  let body;
  if (selected?.kind === "setup") body = <SetupPage pack={pack} items={items} onChange={change} onEditDetails={() => setDetailsOpen(true)} />;
  else if (current)
    body = (
      <ItemEditor
        key={current.id}
        kind={selected.kind}
        item={current}
        pack={pack}
        items={items}
        problems={problemsById.get(current.id) ?? []}
        onChange={(next) => updateItem(selected.kind, next)}
        onDuplicate={() => duplicateItem(selected.kind, current)}
        onDelete={() => deleteItem(selected.kind, current)}
        onArchive={(archived) => {
          const next = { ...current };
          if (archived) next.archived = true;
          else delete next.archived;
          updateItem(selected.kind, next);
          toast.success(archived ? "Archived" : "Restored", {
            detail: archived
              ? "Projects using it keep working. Once you publish, nobody can add it anymore."
              : "Once you publish, people can add it again.",
          });
        }}
      />
    );
  else if (selected)
    body = (
      <EmptyState icon="fa-solid fa-ghost" title="That isn't here anymore">
        It may have been deleted.
      </EmptyState>
    );
  else body = <Overview pack={pack} items={items} onAdd={addItem} problems={problems} breaking={breaking} onRestore={restore} changed={changed} />;

  return (
    <div className="dfb-root dfb-app">
      <Helmet>
        <title>{`${pack.name} | Workshop | DisFuse`}</title>
      </Helmet>
      <div className="dfb-shell">
        <header className="dfb-topbar">
          <Link to="/workshop" className="dfb-topbar__logo" aria-label="Back to the Workshop">
            <img src="/media/disfuse-clear.png" alt="" />
          </Link>
          <Breadcrumbs
            items={[
              { label: "Workshop", icon: "fa-solid fa-screwdriver-wrench", to: "/workshop" },
              { label: pack.name, icon: "fa-solid fa-cubes-stacked" },
              ...(current ? [{ label: current.label || `Untitled ${KIND_INFO[selected.kind].noun}` }] : selected?.kind === "setup" ? [{ label: "Shared code" }] : []),
            ]}
          />
          <div className="dfb-topbar__right">
            <SaveIndicator state={saveState} lastSavedAt={lastSavedAt} />
            <Button size="sm" icon="fa-solid fa-sliders" onClick={() => setDetailsOpen(true)}>
              Details
            </Button>
            <Button size="sm" variant="primary" icon="fa-solid fa-upload" onClick={() => setPublishOpen(true)} disabled={!changed}>
              Publish
            </Button>
          </div>
        </header>

        <main className="dfb-main dfb-main--wide dfb-pack">
          <Sidebar pack={pack} items={items} selected={selected} onSelect={setSelected} onAdd={addItem} problemsById={problemsById} />
          <div className="dfb-pack__body">{body}</div>
        </main>
      </div>

      <PackDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} pack={pack} onSaved={(saved) => setPack((p) => ({ ...p, ...saved }))} />
      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        pack={pack}
        problems={problems}
        breaking={breaking}
        onRestore={restore}
        onPublish={publish}
        onShowProblem={(problem) => {
          setPublishOpen(false);
          setSelected({ kind: problem.kind, id: problem.id });
        }}
      />
      <Toaster />
      <DialogHost />
    </div>
  );
}
