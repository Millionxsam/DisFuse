import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { AddOptionModal, ChoicesEditor, LocalizationsEditor, OptionList, StepsSummary, ValidatedText } from "../components/commands/shared.jsx";
import PageLayout, { PageHeader, Section } from "../components/layout/PageLayout.jsx";
import { findCommand, findOption } from "../model/ops.js";
import { CHANNEL_TYPES, LIMITS, OPTION_TYPES, VALUE_OPTION_TYPES, checkDescription, checkName } from "../model/rules.js";
import { useBuilder, useFlow } from "../state/BuilderProvider.jsx";
import { Button, Field, MultiSelect, NumberInput, Select, Toggle, confirm, toast } from "../ui/index.js";
import { commandCrumb } from "./CommandPage.jsx";
import { DOCS } from "../../config/docs.js";

/* =====================================================================
   An option, subcommand or subcommand group
   ---------------------------------------------------------------------
   Any depth: /settings roles add has the command, then the group
   "roles", then the subcommand "add", each with its own page. The
   breadcrumb shows the whole way down.

     group        its subcommands
     subcommand   its options, and its steps (a subcommand runs its own)
     option       everything Discord lets an option have for its type:
                  required, preset choices, suggestions while typing,
                  channel types, number limits and text length limits
   ===================================================================== */

const TINTS = { 1: "#8b6cff", 2: "#e23fe2" };

function NumberPair({ label, help, min, max, onChange, integer, lowest, highest, disabled }) {
  return (
    <Field label={label} help={help}>
      <div className="dfb-row" style={{ flexWrap: "nowrap" }}>
        <NumberInput aria-label="Smallest" placeholder="No limit" value={min ?? ""} integer={integer} min={lowest} max={highest} disabled={disabled} onChange={(n) => onChange({ min: n })} />
        <span style={{ color: "var(--dfb-faint)" }}>to</span>
        <NumberInput aria-label="Largest" placeholder="No limit" value={max ?? ""} integer={integer} min={lowest} max={highest} disabled={disabled} onChange={(n) => onChange({ max: n })} />
      </div>
    </Field>
  );
}

export default function OptionPage() {
  const { commandId, optionId } = useParams();
  const { builder, paths, readOnly, can, updateOption, deleteOption } = useBuilder();
  const editLocked = readOnly || !can("options.edit");
  const { issues } = useFlow(optionId);
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const command = findCommand(builder, commandId);
  const found = command && findOption(command, optionId);
  if (!command || !found) return <Navigate to={command ? `${paths.workspace}/commands/${commandId}` : `${paths.workspace}/commands`} replace />;

  const { option, path } = found;
  const type = OPTION_TYPES[option.type];
  const structural = option.type === 1 || option.type === 2;
  const save = (patch) => updateOption(command.id, option.id, patch, { debounce: true });
  const saveNow = (patch) => {
    try {
      updateOption(command.id, option.id, patch);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const crumbs = [
    { label: "Commands", icon: "fa-solid fa-terminal", to: `${paths.workspace}/commands` },
    commandCrumb(command, paths),
    ...path.map((ancestor) => ({ label: ancestor.name, icon: OPTION_TYPES[ancestor.type]?.icon, to: `${paths.workspace}/commands/${command.id}/options/${ancestor.id}` })),
    { label: option.name, icon: type?.icon },
  ];

  const parentUrl = path.length
    ? `${paths.workspace}/commands/${command.id}/options/${path[path.length - 1].id}`
    : `${paths.workspace}/commands/${command.id}`;

  const remove = async () => {
    const noun = option.type === 1 ? "subcommand" : option.type === 2 ? "group" : "option";
    const ok = await confirm({
      title: `Delete ${option.name}?`,
      message:
        option.type === 2
          ? "The group and every subcommand in it, with their steps, will be deleted."
          : option.type === 1
            ? "The subcommand, its options and its steps will be deleted."
            : "Steps that use this option will go back to their defaults.",
      confirmLabel: `Delete ${noun}`,
      danger: true,
    });
    if (!ok) return;
    deleteOption(command.id, option.id);
    navigate(parentUrl);
    toast.success(`Deleted ${option.name}`);
  };

  const changeType = async (next) => {
    if (next === option.type) return;
    const hasSettings = option.choices?.length || option.suggestions?.length || option.channelTypes?.length || option.minValue != null || option.maxValue != null || option.minLength != null || option.maxLength != null;
    if (hasSettings && !(await confirm({ title: "Change the type?", message: "Settings that only fit the old type (like preset choices and limits) will be cleared.", confirmLabel: "Change type" }))) return;
    saveNow({ type: next });
  };

  const commandPath = `/${[command.name, ...path.map((p) => p.name), option.name].join(" ")}`;

  return (
    <PageLayout crumbs={crumbs}>
      <PageHeader
        docs={DOCS.builderCommands}
        icon={type?.icon}
        color={structural ? `linear-gradient(135deg, ${TINTS[option.type]}, #3d2a8c)` : "linear-gradient(135deg, #4fa8ff, #2b5fa8)"}
        eyebrow={`${type?.label} in ${commandPath.split(" ").slice(0, -1).join(" ")}`}
        title={structural ? commandPath : option.name}
        subtitle={option.description}
      >
        {option.type === 1 && (
          <Link to={`${paths.workspace}/commands/${command.id}/options/${option.id}/builder`} className="dfb-btn dfb-btn--primary dfb-page-header__shortcut">
            <i className="fa-solid fa-hammer" aria-hidden /> Open builder
          </Link>
        )}
      </PageHeader>

      {option.type === 1 && <StepsSummary actions={option.actions} issues={issues} to={`${paths.workspace}/commands/${command.id}/options/${option.id}/builder`} description={option.actions?.length ? undefined : `What happens when someone uses ${commandPath}. Open the builder and add the first step.`} />}

      <Section title="Name and description" icon="fa-solid fa-signature">
        <div className="dfb-grid-2">
          <ValidatedText
            label="Name"
            mono
            value={option.name}
            maxLength={LIMITS.nameLength}
            disabled={editLocked}
            validate={(text) => checkName(text) ?? (found.siblings.some((o) => o.id !== option.id && o.name === text) ? "There's already one with that name here." : null)}
            onSave={(name) => save({ name })}
          />
          <ValidatedText label="Description" value={option.description} maxLength={LIMITS.descriptionLength} disabled={editLocked} validate={checkDescription} onSave={(description) => save({ description })} />
        </div>
        <div style={{ marginTop: 16 }}>
          <LocalizationsEditor
            names={option.nameLocalizations}
            descriptions={option.descriptionLocalizations ?? {}}
            nameCheck={checkName}
            disabled={editLocked}
            onSaveNames={(nameLocalizations) => save({ nameLocalizations })}
            onSaveDescriptions={(descriptionLocalizations) => save({ descriptionLocalizations })}
          />
        </div>
      </Section>

      {option.type === 2 && (
        <Section
          title="Subcommands"
          icon="fa-solid fa-diagram-project"
          description="Each subcommand in this group has its own options and its own steps."
          actions={!readOnly && can("options.create") && <Button icon="fa-solid fa-plus" onClick={() => setAdding(true)}>Add subcommand</Button>}
        >
          <OptionList command={command} parent={option} emptyText="No subcommands yet. Discord needs at least one in every group." />
        </Section>
      )}

      {option.type === 1 && (
        <Section
          title="Options"
          icon="fa-solid fa-sliders"
          description="Extra things people fill in when they use this subcommand."
          actions={!readOnly && can("options.create") && <Button icon="fa-solid fa-plus" onClick={() => setAdding(true)}>Add option</Button>}
        >
          <OptionList command={command} parent={option} emptyText="No options. People just pick the subcommand and send it." />
        </Section>
      )}

      {!structural && (
        <Section title="What people fill in" icon="fa-solid fa-keyboard">
          <div className="dfb-stack">
            <div className="dfb-grid-2">
              <Field label="Type" help={type?.description}>
                <Select
                  value={option.type}
                  disabled={editLocked}
                  onChange={(value) => changeType(Number(value))}
                  options={VALUE_OPTION_TYPES.map((t) => ({ value: t, label: OPTION_TYPES[t].label, icon: OPTION_TYPES[t].icon, description: OPTION_TYPES[t].description }))}
                />
              </Field>
              <Field label="Required" help="Required options have to be filled in before the command can be sent.">
                <Toggle checked={option.required} disabled={editLocked} label={option.required ? "Required" : "Optional"} onChange={(required) => saveNow({ required })} />
              </Field>
            </div>

            {[3, 4, 10].includes(option.type) && (
              <>
                <Field label="Suggestions while typing" help="Shows a list of suggestions that narrows as people type. They can still type something else.">
                  <Toggle checked={option.autocomplete} disabled={editLocked} label={option.autocomplete ? "On" : "Off"} onChange={(autocomplete) => saveNow({ autocomplete })} />
                </Field>
                {option.autocomplete ? (
                  <Field label="Suggestions" help="People see the name. Your steps get the value.">
                    <ChoicesEditor type={option.type} value={option.suggestions ?? []} max={LIMITS.suggestions} noun="suggestion" disabled={editLocked} onSave={(suggestions) => updateOption(command.id, option.id, { suggestions }, { debounce: true })} />
                  </Field>
                ) : (
                  <Field label="Preset choices" help="If you add choices, people have to pick one of them. People see the name. Your steps get the value.">
                    <ChoicesEditor type={option.type} value={option.choices ?? []} max={LIMITS.choices} noun="choice" disabled={editLocked} onSave={(choices) => updateOption(command.id, option.id, { choices }, { debounce: true })} />
                  </Field>
                )}
              </>
            )}

            {option.type === 7 && (
              <Field label="Only these kinds of channels" help="Leave it empty to allow every kind of channel.">
                <MultiSelect
                  value={option.channelTypes ?? []}
                  options={CHANNEL_TYPES.map((c) => ({ value: c.value, label: c.label }))}
                  placeholder="Any channel"
                  disabled={editLocked}
                  onChange={(channelTypes) => saveNow({ channelTypes })}
                />
              </Field>
            )}

            {(option.type === 4 || option.type === 10) && (
              <NumberPair
                label="Smallest and largest number allowed"
                integer={option.type === 4}
                min={option.minValue}
                max={option.maxValue}
                disabled={editLocked}
                onChange={({ min, max }) => saveNow(min !== undefined ? { minValue: min } : { maxValue: max })}
              />
            )}

            {option.type === 3 && (
              <NumberPair
                label="Shortest and longest answer (characters)"
                help="From 0 to 6000."
                integer
                lowest={0}
                highest={6000}
                min={option.minLength}
                max={option.maxLength}
                disabled={editLocked}
                onChange={({ min, max }) => saveNow(min !== undefined ? { minLength: min } : { maxLength: max })}
              />
            )}
          </div>
        </Section>
      )}

      {!structural && (
        <div className="dfb-note" style={{ marginTop: 22 }}>
          <i className="fa-solid fa-lightbulb" aria-hidden />
          <div>
            In the builder, what people fill in here shows up as the value <strong>{option.name}</strong>
            {option.type === 6 ? " (and as a member, for their server details)" : ""}. You can put it in any step.
          </div>
        </div>
      )}

      {!readOnly && can("options.delete") && (
        <Section className="dfb-danger-zone">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.02rem" }}>Delete this {option.type === 1 ? "subcommand" : option.type === 2 ? "group" : "option"}</h2>
            <p>This can't be undone.</p>
          </div>
          <Button variant="danger" icon="fa-solid fa-trash-can" onClick={remove}>
            Delete
          </Button>
        </Section>
      )}

      {structural && <AddOptionModal open={adding} onClose={() => setAdding(false)} command={command} parent={option} />}
    </PageLayout>
  );
}
