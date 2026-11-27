import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { AddOptionModal, LocalizationsEditor, OptionList, StepsSummary, ValidatedText } from "../components/commands/shared.jsx";
import PageLayout, { PageHeader, Section } from "../components/layout/PageLayout.jsx";
import { COMMAND_CONTEXTS, INTEGRATION_TYPES, LIMITS, PERMISSIONS, checkContextMenuName, checkDescription, checkName } from "../model/rules.js";
import { findCommand } from "../model/ops.js";
import { useBuilder, useFlow } from "../state/BuilderProvider.jsx";
import { Button, Checkbox, MultiSelect, Toggle, confirm, toast } from "../ui/index.js";
import { DOCS } from "../../config/docs.js";

/* =====================================================================
   One command
   ---------------------------------------------------------------------
   Everything Discord lets a command have: name and description (and
   their translations), who can use it by default, whether it's
   age-restricted, where it works and how it's installed, its options,
   and what it does.

   A slash command with subcommands doesn't run steps of its own: each
   subcommand does. Its own steps are kept, so removing the subcommands
   brings them back.
   ===================================================================== */

export function commandCrumb(command, paths, current = false) {
  const slash = (command.kind ?? "slash") === "slash";
  return {
    label: slash ? `/${command.name}` : command.name,
    icon: slash ? "fa-solid fa-slash" : "fa-solid fa-computer-mouse",
    to: current ? undefined : `${paths.workspace}/commands/${command.id}`,
  };
}

export default function CommandPage() {
  const { commandId } = useParams();
  const { builder, paths, readOnly, can, updateCommand, deleteCommand } = useBuilder();
  /* Each part of a command has its own permission. */
  const cannot = (permission) => readOnly || !can(permission);
  const { issues } = useFlow(commandId);
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const command = findCommand(builder, commandId);
  if (!command) return <Navigate to={`${paths.workspace}/commands`} replace />;

  const slash = (command.kind ?? "slash") === "slash";
  const subs = (command.options ?? []).filter((o) => o.type === 1 || o.type === 2);
  const hasSubs = subs.length > 0;
  const save = (patch) => updateCommand(command.id, patch, { debounce: true });
  const saveNow = (patch) => {
    try {
      updateCommand(command.id, patch);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Delete ${slash ? "/" : ""}${command.name}?`,
      message: "The command, its options and all of its steps will be deleted. This can't be undone.",
      confirmLabel: "Delete command",
      danger: true,
    });
    if (!ok) return;
    deleteCommand(command.id);
    navigate(`${paths.workspace}/commands`);
    toast.success("Command deleted");
  };

  const userInstall = (command.integrationTypes ?? []).includes("UserInstall");

  return (
    <PageLayout crumbs={[{ label: "Commands", icon: "fa-solid fa-terminal", to: `${paths.workspace}/commands` }, commandCrumb(command, paths, true)]}>
      <PageHeader
        docs={DOCS.builderCommands}
        icon={slash ? "fa-solid fa-slash" : command.kind === "user" ? "fa-solid fa-user" : "fa-solid fa-message"}
        color={slash ? "linear-gradient(135deg, #35d0a0, #1f8f7a)" : "linear-gradient(135deg, #4fa8ff, #8b6cff)"}
        eyebrow={slash ? "Slash command" : command.kind === "user" ? "Right-click command on a user" : "Right-click command on a message"}
        title={slash ? `/${command.name}` : command.name}
        subtitle={slash ? command.description : "People find it by right-clicking and opening Apps."}
      >
        {(!slash || !hasSubs) && (
          <Link to={`${paths.workspace}/commands/${command.id}/builder`} className="dfb-btn dfb-btn--primary dfb-page-header__shortcut">
            <i className="fa-solid fa-hammer" aria-hidden /> Open builder
          </Link>
        )}
      </PageHeader>

      {(!slash || !hasSubs) && <StepsSummary actions={command.actions} issues={issues} to={`${paths.workspace}/commands/${command.id}/builder`} />}

      <Section title="Name and description" icon="fa-solid fa-signature">
        <div className={slash ? "dfb-grid-2" : "dfb-stack"}>
          <ValidatedText
            label="Name"
            value={command.name}
            maxLength={LIMITS.nameLength}
            mono={slash}
            disabled={cannot("commands.rename")}
            help={slash ? "Lowercase letters, numbers, dashes and underscores." : "Up to 32 characters."}
            validate={(text) =>
              (slash ? checkName(text) : checkContextMenuName(text)) ??
              (builder.commands.some((c) => c.id !== command.id && (c.kind ?? "slash") === (command.kind ?? "slash") && c.name.toLowerCase() === text.toLowerCase()) ? "You already have a command with that name." : null)
            }
            onSave={(name) => save({ name })}
          />
          {slash && (
            <ValidatedText
              label="Description"
              value={command.description}
              maxLength={LIMITS.descriptionLength}
              disabled={cannot("commands.describe")}
              help="Shown under the name when people pick the command."
              validate={checkDescription}
              onSave={(description) => save({ description })}
            />
          )}
        </div>
        <div style={{ marginTop: 16 }}>
          <LocalizationsEditor
            names={command.nameLocalizations}
            descriptions={slash ? command.descriptionLocalizations ?? {} : undefined}
            nameCheck={slash ? checkName : checkContextMenuName}
            disabled={cannot("commands.translate")}
            onSaveNames={(nameLocalizations) => save({ nameLocalizations })}
            onSaveDescriptions={(descriptionLocalizations) => save({ descriptionLocalizations })}
          />
        </div>
      </Section>

      {slash && (
        <Section
          title="Options"
          icon="fa-solid fa-sliders"
          description={
            hasSubs
              ? "This command has subcommands. Each one has its own options and its own steps."
              : "Extra things people fill in when they use the command, like a user to ban. Required options always come first in Discord."
          }
          actions={
            !cannot("options.create") && (
              <Button icon="fa-solid fa-plus" onClick={() => setAdding(true)}>
                {hasSubs ? "Add subcommand or group" : "Add option"}
              </Button>
            )
          }
        >
          <OptionList command={command} emptyText="No options. People just type the command and send it." />
          {hasSubs && command.actions?.length > 0 && (
            <div className="dfb-note dfb-note--amber" style={{ marginTop: 14 }}>
              <i className="fa-solid fa-box-archive" aria-hidden />
              <div>
                The {command.actions.length} step{command.actions.length === 1 ? "" : "s"} you built for /{command.name} itself are kept, but won't run while it has subcommands. Remove the subcommands to use them again.
              </div>
            </div>
          )}
        </Section>
      )}

      <Section title="Who can use it" icon="fa-solid fa-user-shield" description="By default everyone can. Server admins can always change this later in Server Settings, then Integrations.">
        <div className="dfb-stack">
          <div className="dfb-field">
            <span className="dfb-field__label">Only people with these permissions</span>
            <MultiSelect
              value={command.defaultMemberPermissions ?? []}
              options={PERMISSIONS.map((p) => ({ value: p.value, label: p.label }))}
              placeholder="Everyone"
              ariaLabel="Required permissions"
              disabled={cannot("commands.access")}
              onChange={(defaultMemberPermissions) => saveNow({ defaultMemberPermissions })}
            />
            <span className="dfb-field__help">Pick Administrator to hide it from everyone except admins.</span>
          </div>
          <Toggle checked={command.nsfw} disabled={cannot("commands.access")} label="Age-restricted (NSFW): only works in age-restricted channels" onChange={(nsfw) => saveNow({ nsfw })} />
        </div>
      </Section>

      <Section title="Where it works" icon="fa-solid fa-location-dot">
        <div className="dfb-grid-2">
          <div className="dfb-stack" style={{ gap: 10 }}>
            <span className="dfb-field__label">Where it can be used</span>
            {COMMAND_CONTEXTS.map((context) => {
              const unavailable = context.value === "PrivateChannel" && !userInstall;
              const checked = (command.contexts ?? []).includes(context.value);
              return (
                <Checkbox
                  key={context.value}
                  label={context.label}
                  description={unavailable ? "Turn on \"Added to someone's account\" first." : context.description}
                  checked={checked && !unavailable}
                  disabled={cannot("commands.contexts") || unavailable}
                  onChange={(on) => saveNow({ contexts: on ? [...(command.contexts ?? []), context.value] : (command.contexts ?? []).filter((c) => c !== context.value) })}
                />
              );
            })}
          </div>
          <div className="dfb-stack" style={{ gap: 10 }}>
            <span className="dfb-field__label">How it can be installed</span>
            {INTEGRATION_TYPES.map((type) => (
              <Checkbox
                key={type.value}
                label={type.label}
                description={type.description}
                checked={(command.integrationTypes ?? []).includes(type.value)}
                disabled={cannot("commands.contexts")}
                onChange={(on) => saveNow({ integrationTypes: on ? [...(command.integrationTypes ?? []), type.value] : (command.integrationTypes ?? []).filter((t) => t !== type.value) })}
              />
            ))}
            {userInstall && (
              <p className="dfb-field__help" style={{ margin: 0 }}>
                For this to work, turn on User Install for your app in the Discord Developer Portal too.
              </p>
            )}
          </div>
        </div>
      </Section>

      {!cannot("commands.delete") && (
        <Section className="dfb-danger-zone">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.02rem" }}>Delete this command</h2>
            <p>Removes it and everything inside it.</p>
          </div>
          <Button variant="danger" icon="fa-solid fa-trash-can" onClick={remove}>
            Delete command
          </Button>
        </Section>
      )}

      {slash && <AddOptionModal open={adding} onClose={() => setAdding(false)} command={command} parent={null} />}
    </PageLayout>
  );
}
