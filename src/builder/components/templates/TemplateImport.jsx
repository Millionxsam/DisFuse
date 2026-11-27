import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { errorMessage } from "../../../api/client.js";
import { userCache } from "../../../cache.ts";
import { getTemplate, installTemplatePacks, recordTemplateImport } from "../../../api/templates.js";
import { commandLabel, parseTemplateContent, prepareTemplateImport, secretNamesIn } from "../../model/templates.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button, Chip, Modal, Spinner, toast } from "../../ui/index.js";

/* =====================================================================
   Adding a template to a DisFuse Builder project
   ---------------------------------------------------------------------
   "Add to a project" on a template's page opens the project with
   `?template=<id>`, and this picks it up: it shows what the template
   will add, and adds it when the person says so.

   An import is a copy. Everything gets new ids and lands in the project
   as ordinary commands, events and variables, with nothing pointing back
   at the template, so whatever happens to the template afterwards
   (edited, unpublished, deleted), this project never notices.

   A template made with the block editor works here too: its blocks are
   turned into commands and events first, by the same conversion as
   "Copy to DisFuse Builder" (Pages/Workspace/editor/templateConversion.js,
   loaded only when it's needed, since it brings Blockly with it). Blocks
   from Workshop packs become the packs' own steps, and the packs are
   installed for the person, as they are when the template goes into a
   block editor project.

   In order:
     1. read the template (converting it if it's made of blocks), and
        refuse early if it can't go in here;
     2. show what it adds, which names clash (and what they'll be called
        instead), and which secrets the person will need to add;
     3. add it all with one change (importTemplate in ops.js), which the
        API applies again, checking the person's permissions;
     4. tell the API, so the import is counted.
   ===================================================================== */

export default function TemplateImport() {
  const { builder, getBuilder, project, importTemplate, flush, readOnly } = useBuilder();
  const [searchParams, setSearchParams] = useSearchParams();
  const templateId = searchParams.get("template");

  const [template, setTemplate] = useState(null);
  /* A block template's blocks as builder content: { content, report }. */
  const [converted, setConverted] = useState(null);
  const [status, setStatus] = useState("idle");
  const [problem, setProblem] = useState(null);
  const [adding, setAdding] = useState(false);

  const close = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("template");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!templateId) {
      setStatus("idle");
      setTemplate(null);
      setConverted(null);
      return undefined;
    }
    let current = true;
    setStatus("loading");
    setProblem(null);
    setConverted(null);
    getTemplate(templateId)
      .then(async (found) => {
        if (!current) return;
        setTemplate(found);
        const unavailable = (found.packs ?? []).find((pack) => !pack.available);
        if (!found.canImport) setProblem(found.published ? "It's private." : "It hasn't been published yet.");
        else if (!found.data) setProblem("There's nothing in it to add.");
        else if (unavailable)
          setProblem(`It needs ${unavailable.name ? `the "${unavailable.name}" Workshop pack` : "a Workshop pack"}, which is no longer available.`);
        else if (found.type !== "builder") {
          const { blockTemplateToBuilder } = await import("../../../Pages/Workspace/editor/templateConversion.js");
          const result = await blockTemplateToBuilder(found);
          if (!current) return;
          if (!result.content.commands.length && !result.content.events.length)
            setProblem("None of its blocks have anything like them in DisFuse Builder yet, so there's nothing to add.");
          else setConverted(result);
        }
        setStatus("ready");
      })
      .catch((error) => {
        if (!current) return;
        setProblem(error?.response?.status === 404 ? "It may have been unpublished or deleted." : errorMessage(error, "Please try again."));
        setStatus("ready");
      });
    return () => {
      current = false;
    };
  }, [templateId]);

  /* What it will add here, worked out against the project as it is now. */
  const plan = useMemo(() => {
    if (!template?.data || problem) return null;
    if (template.type !== "builder" && !converted) return null;
    const content = converted ? parseTemplateContent(converted.content) : parseTemplateContent(template.data);
    const { renamed } = prepareTemplateImport(builder, content);
    const saved = new Set((project?.secrets ?? []).map((secret) => secret.name));
    const secrets = secretNamesIn(content).map((name) => ({ name, saved: saved.has(name) }));
    return { content, renamed, secrets };
  }, [builder, converted, problem, project?.secrets, template]);

  if (!templateId) return null;

  const add = async () => {
    if (!plan || adding) return;
    setAdding(true);
    setProblem(null);
    try {
      /* The Workshop packs it uses go in the person's library, so the
         steps from them keep working the next time the project opens. */
      if (template.packs?.length) await installTemplatePacks(template._id);

      /* Prepared again now, so the ids and names are fresh against the
         project as it is at this moment. */
      const { content } = prepareTemplateImport(getBuilder(), plan.content);
      const result = importTemplate(content);
      await flush();

      /* A refused change is undone by reloading the project, so what's on
         screen says whether it landed. */
      const firstId = result.commands[0] ?? result.events[0];
      const now = getBuilder();
      const landed = !firstId || now.commands.some((c) => c.id === firstId) || now.events.some((e) => e.id === firstId);
      if (!landed) {
        setProblem("It couldn't be saved to your project. The message that just appeared says why.");
        return;
      }

      recordTemplateImport(template._id).catch((error) => console.warn("Couldn't count that import:", error));
      const missing = plan.secrets.filter((secret) => !secret.saved);
      toast.success(`Added "${template.name}"`, {
        detail: missing.length
          ? `Add ${missing.length === 1 ? "the secret" : "the secrets"} ${missing.map((s) => s.name).join(", ")} from the dashboard so ${missing.length === 1 ? "it works" : "they work"}.`
          : "Its commands and events are in your project now.",
        duration: missing.length ? 9000 : undefined,
      });
      close();
    } catch (error) {
      setProblem(error?.message ?? "Couldn't add that template.");
    } finally {
      setAdding(false);
    }
  };

  const content = plan?.content;
  const commandRenames = new Map((plan?.renamed ?? []).filter((r) => r.kind === "command").map((r) => [`${r.commandKind}:${r.from}`, r.to]));
  const variableRenames = (plan?.renamed ?? []).filter((r) => r.kind === "variable");
  const missingSecrets = (plan?.secrets ?? []).filter((secret) => !secret.saved);

  return (
    <Modal
      open
      onClose={close}
      title={template ? `Add "${template.name}"` : "Add a template"}
      icon="fa-solid fa-shapes"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {plan ? "Cancel" : "Close"}
          </Button>
          {plan && (
            <Button variant="primary" icon="fa-solid fa-file-import" onClick={add} loading={adding} disabled={readOnly}>
              Add to this project
            </Button>
          )}
        </>
      }
    >
      {status === "loading" ? (
        <div style={{ display: "grid", placeItems: "center", padding: 30 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <div className="dfb-tpl-import">
          {template?.owner?.username && plan && (
            <p className="dfb-modal__message">
              By <b>{template.owner.username}</b>. A copy goes into this project, so later changes to the template won't affect it.
            </p>
          )}

          {converted && plan && <ConversionNote report={converted.report} packs={template.packs ?? []} />}

          {problem && (
            <div className="dfb-note dfb-note--danger">
              <i className="fa-solid fa-circle-exclamation" aria-hidden />
              <div>
                {plan ? <strong>Couldn't add it. </strong> : <strong>You can't add this template here. </strong>}
                {problem}
              </div>
            </div>
          )}

          {content && content.commands.length > 0 && (
            <div className="dfb-tpl-import__group">
              <h4>
                <i className="fa-solid fa-terminal" aria-hidden /> Commands · {content.commands.length}
              </h4>
              <ul>
                {content.commands.map((command) => {
                  const kind = command.kind ?? "slash";
                  const renamedTo = commandRenames.get(`${kind}:${command.name}`);
                  return (
                    <li key={command.id}>
                      <Chip icon={kind === "slash" ? "fa-solid fa-slash" : "fa-solid fa-computer-mouse"} color="#35d0a0">
                        {renamedTo ? commandLabel({ ...command, name: renamedTo }) : commandLabel(command)}
                      </Chip>
                      {renamedTo && (
                        <span className="dfb-tpl-import__renamed">
                          You already have {commandLabel(command)}, so this one will be called {commandLabel({ ...command, name: renamedTo })}.
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {content && content.events.length > 0 && (
            <div className="dfb-tpl-import__group">
              <h4>
                <i className="fa-solid fa-bolt" aria-hidden /> Events · {content.events.length}
              </h4>
              <ul className="dfb-tpl-import__chips">
                {content.events.map((event) => (
                  <li key={event.id}>
                    <EventChip event={event} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {variableRenames.length > 0 && (
            <p className="dfb-tpl-import__renamed">
              <i className="fa-solid fa-box" aria-hidden /> Your project already has{" "}
              {variableRenames.map((r, index) => (
                <span key={r.from}>
                  {index ? ", " : ""}a variable called <b>{r.from}</b> (the template's will be <b>{r.to}</b>)
                </span>
              ))}
              .
            </p>
          )}

          {missingSecrets.length > 0 && (
            <div className="dfb-note dfb-note--amber">
              <i className="fa-solid fa-user-secret" aria-hidden />
              <div>
                <strong>It needs {missingSecrets.length === 1 ? "a secret" : "secrets"} you haven't saved:</strong> {missingSecrets.map((s) => s.name).join(", ")}. Templates
                never include secrets. Add {missingSecrets.length === 1 ? "it" : "them"} with {missingSecrets.length === 1 ? "that name" : "those names"} under Secrets on your
                bot's dashboard after adding the template.
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/** What changed when a block template was turned into commands and events. */
function ConversionNote({ report, packs }) {
  const installed = new Set((userCache.user?.installedBlockPacks ?? []).map(String));
  const newPacks = packs.filter((pack) => !installed.has(String(pack._id)));
  const named = (list) => list.map((p) => (p.name ? `"${p.name}"` : "a Workshop pack")).join(", ");
  const left = [
    ...Object.entries(report.unsupported ?? {}).map(([label, count]) => `${label}${count > 1 ? ` (${count})` : ""}`),
  ];
  const partial = Object.entries(report.partial ?? {}).map(([label, count]) => `${label}${count > 1 ? ` (${count})` : ""}`);
  const notes = (report.notes ?? []).filter((note) => !/^Blocks from Workshop packs were copied/.test(note));
  return (
    <div className="dfb-note">
      <i className="fa-solid fa-puzzle-piece" aria-hidden />
      <div>
        <strong>This template was made with the Block Editor.</strong> Its blocks have been turned into DisFuse Builder commands and events
        {packs.length ? `, and the blocks from ${named(packs)} into ${packs.length === 1 ? "that pack's" : "those packs'"} own steps` : ""}.
        {newPacks.length > 0 && <> Adding it installs {named(newPacks)} in your library too.</>}
        {left.length > 0 && <> Some blocks have nothing like them in DisFuse Builder, so they were left out: {left.join(", ")}.</>}
        {report.unknownBlocks > 0 && <> {report.unknownBlocks === 1 ? "One block" : `${report.unknownBlocks} blocks`} couldn't be read and were left out.</>}
        {partial.length > 0 && <> Check these after adding it, as a setting didn't fit: {partial.join(", ")}.</>}
        {notes.map((note) => (
          <span key={note}> {note}</span>
        ))}
      </div>
    </div>
  );
}

function EventChip({ event }) {
  const { catalog } = useBuilder();
  const def = catalog.events.get(event.type);
  return (
    <Chip icon={def?.icon ?? "fa-solid fa-bolt"} color={catalog.categoryById[def?.category]?.color ?? "#ffb648"}>
      {event.label || def?.label || "Event"}
    </Chip>
  );
}
