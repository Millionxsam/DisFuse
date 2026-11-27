import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { NewCommandModal } from "../components/commands/shared.jsx";
import PageLayout, { PageHeader } from "../components/layout/PageLayout.jsx";
import { validateProject } from "../model/validate.js";
import { useBuilder } from "../state/BuilderProvider.jsx";
import { Badge, Button, EmptyState, SearchInput } from "../ui/index.js";
import { DOCS } from "../../config/docs.js";

/* =====================================================================
   Commands
   ---------------------------------------------------------------------
   Every slash command and right-click command, and the button to make
   a new one. Commands are only created in the exported bot, by
   discord.js, when it starts; nothing here talks to Discord.
   ===================================================================== */

function CommandRow({ command, index, problems }) {
  const { paths } = useBuilder();
  const slash = (command.kind ?? "slash") === "slash";
  const subs = (command.options ?? []).filter((o) => o.type === 1 || o.type === 2);
  const values = (command.options ?? []).filter((o) => o.type !== 1 && o.type !== 2);
  const tint = slash ? "#35d0a0" : command.kind === "user" ? "#4fa8ff" : "#e23fe2";
  const detail = slash
    ? subs.length
      ? `${subs.length} subcommand${subs.length === 1 ? "" : "s"}`
      : `${values.length} option${values.length === 1 ? "" : "s"} · ${command.actions?.length ?? 0} step${command.actions?.length === 1 ? "" : "s"}`
    : `${command.actions?.length ?? 0} step${command.actions?.length === 1 ? "" : "s"}`;

  return (
    <Link to={`${paths.workspace}/commands/${command.id}`} className="dfb-list-item" style={{ "--tint": tint, animationDelay: `${index * 40}ms` }}>
      <span className="dfb-list-item__icon">
        <i className={slash ? "fa-solid fa-slash" : command.kind === "user" ? "fa-solid fa-user" : "fa-solid fa-message"} aria-hidden />
      </span>
      <span className="dfb-list-item__text">
        <span className="dfb-list-item__title">
          {slash ? <code>/{command.name}</code> : command.name}
          {command.nsfw && <Badge tone="danger">Age-restricted</Badge>}
        </span>
        <span className="dfb-list-item__sub">{slash ? command.description : command.kind === "user" ? "Right-click a user, then Apps" : "Right-click a message, then Apps"}</span>
      </span>
      <span className="dfb-list-item__meta">
        {problems > 0 && (
          <Badge tone="amber" icon="fa-solid fa-triangle-exclamation">
            {problems}
          </Badge>
        )}
        <Badge>{detail}</Badge>
        <i className="fa-solid fa-chevron-right dfb-list-item__chevron" aria-hidden />
      </span>
    </Link>
  );
}

export default function CommandsPage() {
  const { builder, catalog, readOnly, can } = useBuilder();
  const canCreate = !readOnly && can("commands.create");
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  const problemsByCommand = useMemo(() => {
    const map = new Map();
    for (const problem of validateProject(builder, catalog)) {
      if (problem.level === "info") continue;
      const id = problem.to?.split("/")[1];
      if (id) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [builder, catalog]);

  const q = query.trim().toLowerCase();
  const matches = (c) => !q || `${c.name} ${c.description ?? ""}`.toLowerCase().includes(q);
  const slash = builder.commands.filter((c) => (c.kind ?? "slash") === "slash" && matches(c));
  const rightClick = builder.commands.filter((c) => (c.kind ?? "slash") !== "slash" && matches(c));

  return (
    <PageLayout crumbs={[{ label: "Commands", icon: "fa-solid fa-terminal" }]}>
      <PageHeader
        docs={DOCS.builderCommands}
        icon="fa-solid fa-terminal"
        color="linear-gradient(135deg, #35d0a0, #1f8f7a)"
        title="Commands"
        subtitle="Slash commands people type, and commands in the right-click Apps menu. Your bot sets them up with Discord every time it starts."
      >
        {canCreate && (
          <Button variant="primary" icon="fa-solid fa-plus" onClick={() => setCreating(true)}>
            New command
          </Button>
        )}
      </PageHeader>

      {builder.commands.length === 0 ? (
        <EmptyState
          icon="fa-solid fa-terminal"
          color="linear-gradient(135deg, #35d0a0, #4fa8ff)"
          title="No commands yet"
          action={
            canCreate && (
              <Button variant="primary" icon="fa-solid fa-plus" onClick={() => setCreating(true)}>
                Make your first command
              </Button>
            )
          }
        >
          A command is something people type to your bot, like /ping or /ban. Make one, then choose what it does.
        </EmptyState>
      ) : (
        <>
          {builder.commands.length > 6 && (
            <div className="dfb-toolbar">
              <SearchInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a command" aria-label="Find a command" />
            </div>
          )}
          {slash.length > 0 && (
            <>
              <h3 className="dfb-subhead">
                <i className="fa-solid fa-slash" aria-hidden /> Slash commands · {slash.length}
              </h3>
              <div className="dfb-list">
                {slash.map((command, index) => (
                  <CommandRow key={command.id} command={command} index={index} problems={problemsByCommand.get(command.id) ?? 0} />
                ))}
              </div>
            </>
          )}
          {rightClick.length > 0 && (
            <>
              <h3 className="dfb-subhead">
                <i className="fa-solid fa-computer-mouse" aria-hidden /> Right-click commands · {rightClick.length}
              </h3>
              <div className="dfb-list">
                {rightClick.map((command, index) => (
                  <CommandRow key={command.id} command={command} index={index} problems={problemsByCommand.get(command.id) ?? 0} />
                ))}
              </div>
            </>
          )}
          {q && !slash.length && !rightClick.length && <p style={{ color: "var(--dfb-faint)" }}>No commands match “{query}”.</p>}
        </>
      )}

      <NewCommandModal open={creating} onClose={() => setCreating(false)} />
    </PageLayout>
  );
}
