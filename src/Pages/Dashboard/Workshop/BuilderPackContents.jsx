import { typeLabel } from "../../../builder/catalog/types.js";
import { cleanPackItems } from "../../../builder/model/packs.js";

/* =====================================================================
   What's in a builder pack
   ---------------------------------------------------------------------
   A builder pack's page lists its events, steps and values the way
   DisFuse Builder's pickers show them: an icon, a name, a line saying
   what it does, and what you fill in. Block packs show a Blockly
   preview instead (BlockPackPage).
   ===================================================================== */

const KINDS = [
  {
    key: "events",
    title: "Events",
    icon: "fa-solid fa-bolt",
    empty: "No events",
    fallbackIcon: "fa-solid fa-bolt",
  },
  {
    key: "actions",
    title: "Steps",
    icon: "fa-solid fa-list-check",
    empty: "No steps",
    fallbackIcon: "fa-solid fa-cube",
  },
  {
    key: "values",
    title: "Values",
    icon: "fa-solid fa-circle-dot",
    empty: "No values",
    fallbackIcon: "fa-solid fa-circle-dot",
  },
];

function details(kind, item) {
  const parts = [];
  const inputs = kind === "events" ? item.settings : item.inputs;
  if (inputs?.length)
    parts.push(
      `${kind === "events" ? "Settings" : "Inputs"}: ${inputs
        .map((i) => i.label || i.key)
        .join(", ")}`,
    );
  if (kind === "values") parts.push(`Gives: ${typeLabel(item.output)}`);
  if (kind === "actions" && item.branches?.length)
    parts.push(`Sections: ${item.branches.map((b) => b.label || b.key).join(", ")}`);
  if (kind === "events" && item.values?.length)
    parts.push(`Values inside it: ${item.values.map((v) => v.label || v.key).join(", ")}`);
  return parts;
}

export default function BuilderPackContents({ items: raw, color }) {
  /* Archived items are still published, so projects using them work,
     but the pack no longer offers them. */
  const all = cleanPackItems(raw);
  const offered = (list) => list.filter((item) => !item.archived);
  const items = { ...all, events: offered(all.events), actions: offered(all.actions), values: offered(all.values) };

  return (
    <div className="df-bp-contents" style={{ "--pack": color || "#014f98" }}>
      {KINDS.map((kind) =>
        items[kind.key].length ? (
          <section key={kind.key}>
            <h1>
              <i className={kind.icon}></i> {kind.title}
            </h1>
            <div className="df-bp-list">
              {items[kind.key].map((item) => (
                <div className="df-bp-item" key={item.id}>
                  <span className="df-bp-item-icon">
                    <i className={item.icon || kind.fallbackIcon}></i>
                  </span>
                  <div>
                    <h2>
                      {item.label}
                      {item.group && <small>{item.group}</small>}
                    </h2>
                    {item.description && <p>{item.description}</p>}
                    {details(kind.key, item).map((line) => (
                      <p className="df-bp-item-meta" key={line}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null,
      )}
      {!items.events.length && !items.actions.length && !items.values.length && (
        <p>Nothing has been published yet.</p>
      )}
    </div>
  );
}
