import { PACK_LIMITS } from "../../model/packs.js";
import { Badge, Button, Checkbox, Field, IconButton, Tabs, TextArea, TextInput } from "../../ui/index.js";
import { Section } from "../layout/PageLayout.jsx";
import {
  CodeTemplate,
  ContextSelect,
  IconField,
  InputsEditor,
  ProvidedEditor,
  TypeSelect,
  autoKey,
  inputTokens,
} from "./PackFields.jsx";
import PackPreview from "./PackPreview.jsx";

/* =====================================================================
   Editing one event, step or value of a builder pack
   ---------------------------------------------------------------------
   The same words people see in DisFuse Builder: an event is a trigger,
   an action is a "step", a value goes in a step's inputs. Each one ends
   in the code it writes, with the live preview beside it.
   ===================================================================== */

export const KIND_INFO = {
  event: {
    noun: "event",
    title: "Event",
    icon: "fa-solid fa-bolt",
    tint: "#ffb648",
    blurb: "Something that happens, which a bot's steps run after. People add it on their Events page.",
  },
  action: {
    noun: "step",
    title: "Step",
    icon: "fa-solid fa-cube",
    tint: "#35d0a0",
    blurb: "Something the bot does. People add it to a command or an event, and fill in its inputs.",
  },
  value: {
    noun: "value",
    title: "Value",
    icon: "fa-solid fa-circle-dot",
    tint: "#4fa8ff",
    blurb: "Something that gives back a value, which people put in a step's input. Its code is an expression.",
  },
};

/* Common discord.js client events, offered while typing. */
const CLIENT_EVENTS = [
  "messageCreate", "messageDelete", "messageUpdate", "messageReactionAdd", "messageReactionRemove",
  "guildMemberAdd", "guildMemberRemove", "guildMemberUpdate", "guildCreate", "guildDelete", "guildUpdate",
  "channelCreate", "channelDelete", "channelUpdate", "roleCreate", "roleDelete", "roleUpdate",
  "interactionCreate", "voiceStateUpdate", "presenceUpdate", "typingStart", "threadCreate", "threadDelete",
  "inviteCreate", "inviteDelete", "guildBanAdd", "guildBanRemove", "emojiCreate", "emojiDelete", "clientReady",
];

function Placeholders() {
  return (
    <details className="dfb-pack-help">
      <summary>
        <i className="fa-solid fa-circle-question" aria-hidden /> How the code works
      </summary>
      <ul>
        <li>
          <code>{"{{name}}"}</code> puts in an input, as code: typed text comes out in quotes, a number as a number, and a value someone placed there as its code.
        </li>
        <li>
          <code>{"{{raw:name}}"}</code> puts in a dropdown's choice exactly as it is, without quotes.
        </li>
        <li>
          <code>{"{{steps:name}}"}</code> is where the steps someone puts in a section run.
        </li>
        <li>
          <code>{"{{id}}"}</code> is a short suffix unique to each use of the step, for names that mustn't clash: <code>{"const result{{id}} = ..."}</code>
        </li>
        <li>
          The bot already has <code>client</code> and <code>Discord</code> (discord.js). Steps can use <code>await</code>. Inside a command, <code>interaction</code> is the command.
        </li>
      </ul>
    </details>
  );
}

function Basics({ kind, item, patch, color }) {
  const info = KIND_INFO[kind];
  return (
    <Section title="About it" icon="fa-solid fa-pen" description="How it shows up in DisFuse Builder's pickers.">
      <div className="dfb-pack-form">
        <Field label="Name" required counter={{ value: item.label.length, max: PACK_LIMITS.label }} help={kind === "event" ? 'Like "When a member levels up".' : kind === "action" ? 'Like "Give a member XP".' : 'Like "A member\'s level".'}>
          <TextInput value={item.label} maxLength={PACK_LIMITS.label} onChange={(event) => patch({ label: event.target.value })} />
        </Field>
        <Field label="What it does" optional counter={{ value: item.description.length, max: PACK_LIMITS.description }} help="One plain sentence, shown under the name.">
          <TextArea value={item.description} maxLength={PACK_LIMITS.description} onChange={(event) => patch({ description: event.target.value })} />
        </Field>
        <div className="dfb-pack-row">
          <Field label="Icon" optional help="Pick one, or type any Font Awesome class.">
            <IconField value={item.icon} fallback={info.icon} color={color} onChange={(icon) => patch({ icon })} />
          </Field>
          <Field label="Group" optional help="Puts it under a heading in your pack's list.">
            <TextInput value={item.group} maxLength={PACK_LIMITS.group} placeholder="Like “Levels”" onChange={(event) => patch({ group: event.target.value })} />
          </Field>
        </div>
      </div>
    </Section>
  );
}

function ValueFields({ item, patch }) {
  return (
    <>
      <Section title="What it gives" icon="fa-solid fa-circle-dot" description="Decides which inputs it fits in. A text input also takes numbers and anything else with a text form.">
        <div className="dfb-pack-row">
          <Field label="Type of value">
            <TypeSelect value={item.output} onChange={(output) => patch({ output })} />
          </Field>
          <Field label="Only works in" optional help="Leave it empty if it works anywhere.">
            <ContextSelect value={item.requires} onChange={(requires) => patch({ requires })} />
          </Field>
        </div>
      </Section>
      <Section title="Inputs" icon="fa-solid fa-sliders" description="Boxes people fill in on the value.">
        <InputsEditor inputs={item.inputs} onChange={(inputs) => patch({ inputs })} />
      </Section>
      <Section title="Code" icon="fa-solid fa-code" description="An expression that gives the value. It can use await.">
        <CodeTemplate value={item.code} onChange={(code) => patch({ code })} tokens={[...inputTokens(item.inputs), { token: "{{id}}", label: "Unique suffix", tone: "id" }]} placeholder="await someLibrary.lookup({{name}})" minRows={3} />
        <Placeholders />
      </Section>
    </>
  );
}

function BranchesEditor({ branches, onChange }) {
  const set = (index, fields) => onChange(branches.map((b, n) => (n === index ? { ...b, ...fields } : b)));
  return (
    <div className="dfb-pack-cards">
      {!branches.length && <p className="dfb-pack-hint">Most steps don't need any. Add one for steps that run other steps, like “Try this” or “For each”.</p>}
      {branches.map((branch, index) => (
        <div className="dfb-pack-card dfb-pack-card--open" key={index}>
          <div className="dfb-pack-card__head">
            <span className="dfb-pack-card__dot" aria-hidden>
              <i className="fa-solid fa-diagram-next" />
            </span>
            <TextInput
              value={branch.label}
              placeholder="Name people see, like “Then”"
              maxLength={PACK_LIMITS.label}
              onChange={(event) => {
                const label = event.target.value;
                const following = !branch.key || branch.key === autoKey(branch.label);
                set(index, { label, ...(following ? { key: autoKey(label) } : {}) });
              }}
              aria-label="Name"
            />
            <span className="dfb-pack-card__key">
              <span aria-hidden>{"{{steps:"}</span>
              <input value={branch.key} maxLength={40} spellCheck={false} onChange={(event) => set(index, { key: event.target.value.replace(/[^A-Za-z0-9_]/g, "") })} aria-label="Code name" />
              <span aria-hidden>{"}}"}</span>
            </span>
            <div className="dfb-pack-card__tools">
              <IconButton icon="fa-solid fa-trash-can" label="Remove section" size="sm" tone="danger" onClick={() => onChange(branches.filter((_, n) => n !== index))} />
            </div>
          </div>
          <div className="dfb-pack-card__body">
            <Checkbox checked={branch.optional} onChange={(optional) => set(index, { optional })} label="Turned on by the person using it" description="Like “Otherwise”. When it's off, {{steps:...}} is empty." />
            <Field label="Values inside this section" optional help="Offered only to the steps inside it, like the error in a “Catch” section.">
              <ProvidedEditor values={branch.provides} onChange={(provides) => set(index, { provides })} codePlaceholder="result{{id}}" allowId />
            </Field>
          </div>
        </div>
      ))}
      {branches.length < PACK_LIMITS.branches && (
        <Button variant="ghost" icon="fa-solid fa-plus" className="dfb-pack-add" onClick={() => onChange([...branches, { key: "", label: "", optional: false, provides: [] }])}>
          Add a section
        </Button>
      )}
    </div>
  );
}

function ActionFields({ item, patch }) {
  return (
    <>
      <Section title="Inputs" icon="fa-solid fa-sliders" description="Boxes people fill in on the step.">
        <InputsEditor inputs={item.inputs} onChange={(inputs) => patch({ inputs })} />
      </Section>
      <Section title="Sections" icon="fa-solid fa-diagram-next" description="Places people put more steps, inside this one.">
        <BranchesEditor branches={item.branches} onChange={(branches) => patch({ branches })} />
      </Section>
      <Section title="Where it works" icon="fa-solid fa-location-dot" description="Leave it empty if it works anywhere. Elsewhere it shows grayed out, with the reason.">
        <Field label="Only works in" optional>
          <ContextSelect value={item.requires} onChange={(requires) => patch({ requires })} />
        </Field>
      </Section>
      <Section title="Code" icon="fa-solid fa-code" description="What the step runs. It can use await.">
        <CodeTemplate
          value={item.code}
          onChange={(code) => patch({ code })}
          tokens={[
            ...inputTokens(item.inputs),
            ...item.branches.filter((b) => b.key).map((b) => ({ token: `{{steps:${b.key}}}`, label: b.label || b.key, help: `Where the steps in "${b.label || b.key}" run.`, tone: "steps" })),
            { token: "{{id}}", label: "Unique suffix", tone: "id" },
          ]}
          placeholder={'await {{channel}}.send({{text}});'}
          minRows={6}
        />
        <Placeholders />
      </Section>
    </>
  );
}

function EventFields({ item, patch }) {
  const settingTokens = inputTokens(item.settings);
  return (
    <>
      <Section title="When it runs" icon="fa-solid fa-satellite-dish" description="An event the bot's client sends, or your own code that runs the steps.">
        <Tabs
          ariaLabel="How it's triggered"
          value={item.mode}
          onChange={(mode) => patch({ mode })}
          tabs={[
            { value: "client", label: "A client event", icon: "fa-brands fa-discord" },
            { value: "custom", label: "My own code", icon: "fa-solid fa-code" },
          ]}
        />
        <div className="dfb-pack-form" style={{ marginTop: 14 }}>
          {item.mode === "client" ? (
            <>
              <div className="dfb-pack-row">
                <Field label="Event name" required help="As discord.js names it. Packages that add events to the client work too.">
                  <TextInput value={item.listen} list="dfb-pack-client-events" maxLength={100} placeholder="guildMemberAdd" style={{ fontFamily: "var(--dfb-mono)" }} onChange={(event) => patch({ listen: event.target.value })} />
                </Field>
                <Field label="What it gives you" optional help="Names for the listener's parameters, in order, split by commas.">
                  <TextInput
                    value={item.params.join(", ")}
                    placeholder="member"
                    style={{ fontFamily: "var(--dfb-mono)" }}
                    onChange={(event) => patch({ params: event.target.value.split(",").map((p) => p.trim()).slice(0, 10) })}
                  />
                </Field>
              </div>
              <datalist id="dfb-pack-client-events">
                {CLIENT_EVENTS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <Checkbox checked={item.once} onChange={(once) => patch({ once })} label="Only the first time" description="Uses client.once, so the steps run once after the bot starts." />
            </>
          ) : (
            <CodeTemplate
              label="Listener code"
              help="Runs once when the bot starts. Put {{steps}} where the event's steps should run."
              value={item.code}
              onChange={(code) => patch({ code })}
              tokens={[{ token: "{{steps}}", label: "The event's steps", tone: "steps" }, ...settingTokens, { token: "{{id}}", label: "Unique suffix", tone: "id" }]}
              placeholder={"setInterval(async () => {\n{{steps}}}, 60000);"}
              minRows={5}
            />
          )}
        </div>
      </Section>

      <Section title="Values inside it" icon="fa-solid fa-circle-dot" description="Offered only to the steps in this event, like “The member who joined”.">
        <ProvidedEditor values={item.values} onChange={(values) => patch({ values })} codePlaceholder={item.params.find(Boolean) ?? "member"} />
      </Section>

      <Section title="Settings" icon="fa-solid fa-sliders" description="Filled in on the event's page, like a channel to watch.">
        <InputsEditor inputs={item.settings} onChange={(settings) => patch({ settings })} addLabel="Add a setting" />
      </Section>

      <Section title="Code that runs first" icon="fa-solid fa-filter" description="Optional. Runs before the steps every time, usually to stop early.">
        <CodeTemplate value={item.prelude} onChange={(prelude) => patch({ prelude })} tokens={[...settingTokens, { token: "{{id}}", label: "Unique suffix", tone: "id" }]} placeholder="if (member.user.bot) return;" minRows={2} />
      </Section>

      <Section title="What steps can do here" icon="fa-solid fa-unlock" description="Lets steps that need it be used in this event. Name the parameter interaction (or message) for these to work.">
        <Field label="Gives steps" optional>
          <ContextSelect value={item.provides} onChange={(provides) => patch({ provides })} placeholder="Nothing extra" />
        </Field>
      </Section>
      <Placeholders />
    </>
  );
}

/**
 * @param {object} props
 * @param {"event"|"action"|"value"} props.kind
 * @param {object} props.item
 * @param {object} props.pack
 * @param {object} props.items     the whole draft (for the preview)
 * @param {object[]} props.problems  this item's problems
 */
export default function ItemEditor({ kind, item, pack, items, problems, onChange, onDuplicate, onDelete, onArchive }) {
  const info = KIND_INFO[kind];
  const patch = (fields) => onChange({ ...item, ...fields });

  return (
    <div className="dfb-pack-editor">
      <div className="dfb-pack-editor__form">
        <div className="dfb-page-header">
          <div className="dfb-page-header__icon" style={{ "--tile": pack.color || "#014f98" }}>
            <i className={item.icon || info.icon} aria-hidden />
          </div>
          <div className="dfb-page-header__text">
            <div className="dfb-page-header__eyebrow">{info.title}</div>
            <h1>{item.label || `Untitled ${info.noun}`}</h1>
            <p>{info.blurb}</p>
          </div>
          <div className="dfb-page-header__actions">
            <IconButton icon="fa-regular fa-copy" label="Duplicate" onClick={onDuplicate} />
            {onArchive && (
              <IconButton
                icon={item.archived ? "fa-solid fa-box-open" : "fa-solid fa-box-archive"}
                label={item.archived ? "Restore" : "Archive"}
                onClick={() => onArchive(!item.archived)}
              />
            )}
            <IconButton icon="fa-solid fa-trash-can" label="Delete" tone="danger" onClick={onDelete} />
          </div>
        </div>

        {item.archived && (
          <div className="dfb-pack-archived" role="status">
            <i className="fa-solid fa-box-archive" aria-hidden />
            <p>
              <b>Archived.</b> Projects already using it keep working, but nobody can add it anymore.{" "}
              <button type="button" onClick={() => onArchive?.(false)}>
                Restore it
              </button>
            </p>
          </div>
        )}

        {problems.length > 0 && (
          <div className="dfb-pack-problems" role="status">
            <Badge tone="amber" icon="fa-solid fa-triangle-exclamation">
              {problems.length === 1 ? "1 thing to fix before publishing" : `${problems.length} things to fix before publishing`}
            </Badge>
            <ul>
              {problems.map((problem, index) => (
                <li key={index}>{problem.message}</li>
              ))}
            </ul>
          </div>
        )}

        <Basics kind={kind} item={item} patch={patch} color={pack.color || "#014f98"} />
        {kind === "value" && <ValueFields item={item} patch={patch} />}
        {kind === "action" && <ActionFields item={item} patch={patch} />}
        {kind === "event" && <EventFields item={item} patch={patch} />}
      </div>

      <aside className="dfb-pack-editor__preview">
        <PackPreview pack={pack} items={items} kind={kind} item={item} />
      </aside>
    </div>
  );
}
