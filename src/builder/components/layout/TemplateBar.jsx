import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { errorMessage } from "../../../api/client.js";
import { deleteTemplate, updateTemplate } from "../../../api/templates.js";
import { TEMPLATE_LIMITS } from "../../../components/templates/templateDialogs.js";
import { hasTemplateContent, secretNamesIn } from "../../model/templates.js";
import { validateProject } from "../../model/validate.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Badge, Button, Field, Modal, TextArea, TextInput, confirm, toast } from "../../ui/index.js";

/* =====================================================================
   The template builder's buttons
   ---------------------------------------------------------------------
   In the top bar of every page while a DisFuse Builder template is open
   (PageLayout adds it): whether it's published, its details, and
   Publish. Like the block template builder, the work saves as a draft
   on its own and nobody else sees it until Publish is pressed.
   ===================================================================== */

/** Name, description and who can see it. Delete lives here too, as in the block template builder. */
export function TemplateDetailsModal({ open, onClose }) {
  const { template, mergeTemplate, discardChanges } = useBuilder();
  const navigate = useNavigate();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [isPrivate, setPrivate] = useState(Boolean(template.private));
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  /* Fresh each time it opens. */
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName(template.name);
      setDescription(template.description ?? "");
      setPrivate(Boolean(template.private));
      setTouched(false);
    }
  }

  const trimmed = name.trim();
  const nameError =
    trimmed.length < TEMPLATE_LIMITS.minNameLength ? `The name must be at least ${TEMPLATE_LIMITS.minNameLength} characters long.` : null;

  const save = async (event) => {
    event?.preventDefault();
    setTouched(true);
    if (nameError || saving) return;
    setSaving(true);
    try {
      const updated = await updateTemplate(template._id, { name: trimmed, description: description.trim(), private: isPrivate });
      mergeTemplate({ name: updated.name, description: updated.description, private: updated.private });
      toast.success("Details saved");
      onClose();
    } catch (error) {
      toast.error("Couldn't save those details", { detail: errorMessage(error, "Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const sure = await confirm({
      title: "Delete this template?",
      message: `${template.name} will be deleted, along with its likes and comments. Projects that already added it keep their copy of its commands and events.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!sure) return;
    try {
      await deleteTemplate(template._id);
      discardChanges();
      toast.success("Template deleted");
      navigate("/templates?tab=mine");
    } catch (error) {
      toast.error("Couldn't delete it", { detail: errorMessage(error, "Please try again.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Template details"
      icon="fa-solid fa-sliders"
      footer={
        <>
          <Button variant="danger" icon="fa-solid fa-trash" onClick={remove} style={{ marginRight: "auto" }}>
            Delete template
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} loading={saving} disabled={touched && Boolean(nameError)}>
            Save
          </Button>
        </>
      }
    >
      <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        <Field label="Name" error={touched ? nameError : null} counter={{ value: name.length, max: TEMPLATE_LIMITS.maxNameLength }}>
          <TextInput
            value={name}
            maxLength={TEMPLATE_LIMITS.maxNameLength}
            placeholder="e.g. Moderation commands"
            onChange={(event) => setName(event.target.value)}
            invalid={touched && Boolean(nameError)}
            data-autofocus
          />
        </Field>
        <Field label="Description" help="What does it do, and how do people use it? You can use Markdown." optional>
          <TextArea
            value={description}
            maxLength={TEMPLATE_LIMITS.maxDescriptionLength}
            minRows={4}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div className="dfb-tpl-visibility" role="radiogroup" aria-label="Who can see it">
          {[
            { value: false, icon: "fa-solid fa-earth-americas", title: "Public", text: "Anyone can find it, like it and add it to their bots once you publish it." },
            { value: true, icon: "fa-solid fa-lock", title: "Private", text: "Only you can see it and add it to your bots." },
          ].map((choice) => (
            <button
              key={choice.title}
              type="button"
              role="radio"
              aria-checked={isPrivate === choice.value}
              className={`dfb-tpl-choice ${isPrivate === choice.value ? "dfb-tpl-choice--on" : ""}`}
              onClick={() => setPrivate(choice.value)}
            >
              <i className={choice.icon} aria-hidden />
              <span>
                <b>{choice.title}</b>
                {choice.text}
              </span>
            </button>
          ))}
        </div>
      </form>
    </Modal>
  );
}

export default function TemplateBar() {
  const { template, builder, catalog, changedSincePublish, publish, unpublish } = useBuilder();
  const [details, setDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const published = Boolean(template.published);
  const empty = !hasTemplateContent(builder);

  const problems = useMemo(() => validateProject(builder, catalog).filter((p) => p.level === "error"), [builder, catalog]);

  const doPublish = async () => {
    if (busy || empty) return;
    const secrets = secretNamesIn(builder);
    const firstTime = !published;
    const lines = [
      firstTime
        ? template.private
          ? "It's private, so only you will be able to see it and add it to your bots."
          : "Anyone will be able to find it on the Templates page and add it to their DisFuse Builder projects."
        : "People who add it from now on will get these commands and events. Projects that already added it keep what they have.",
    ];
    if (secrets.length)
      lines.push(
        `It reads ${secrets.length === 1 ? "a secret" : "these secrets"} (${secrets.join(", ")}). Secrets aren't part of a template, so people who add it will need to save ${secrets.length === 1 ? "one" : "them"} with the same name on their own bot.`,
      );
    if (problems.length)
      lines.push(
        `There ${problems.length === 1 ? "is 1 problem" : `are ${problems.length} problems`} to fix on the Commands and Events pages. People who add it will get ${problems.length === 1 ? "it" : "them"} too.`,
      );

    const sure = await confirm({
      title: firstTime ? "Publish this template?" : "Publish your changes?",
      message: lines.map((line, index) => (
        <span key={index} style={{ display: "block", marginTop: index ? 10 : 0 }}>
          {line}
        </span>
      )),
      confirmLabel: firstTime ? "Publish" : "Publish changes",
      icon: "fa-solid fa-upload",
    });
    if (!sure) return;

    setBusy(true);
    try {
      await publish();
      toast.success(firstTime ? "Published!" : "Changes published");
    } catch (error) {
      toast.error("Couldn't publish", { detail: errorMessage(error, "Please try again.") });
    } finally {
      setBusy(false);
    }
  };

  const doUnpublish = async () => {
    const sure = await confirm({
      title: "Unpublish this template?",
      message: `${template.name} will be removed from the Templates page, and nobody will be able to add it to a project. Your work stays saved, so you can publish it again anytime. Projects that already added it keep what they have.`,
      confirmLabel: "Unpublish",
    });
    if (!sure) return;
    setBusy(true);
    try {
      await unpublish();
      toast.success("Unpublished");
    } catch (error) {
      toast.error("Couldn't unpublish it", { detail: errorMessage(error, "Please try again.") });
    } finally {
      setBusy(false);
    }
  };

  const status = !published
    ? { tone: undefined, icon: "fa-solid fa-pen-ruler", label: "Draft" }
    : changedSincePublish
      ? { tone: "amber", icon: "fa-solid fa-circle-half-stroke", label: "Changes not published" }
      : { tone: "mint", icon: "fa-solid fa-circle-check", label: "Published" };

  return (
    <div className="dfb-tpl-bar">
      <Badge tone={status.tone} icon={status.icon}>
        {status.label}
      </Badge>
      <Badge icon={template.private ? "fa-solid fa-lock" : "fa-solid fa-earth-americas"}>{template.private ? "Private" : "Public"}</Badge>
      {published && (
        <a className="dfb-btn dfb-btn--ghost dfb-btn--sm" href={`/templates/${template._id}`} target="_blank" rel="noopener noreferrer">
          <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden /> View page
        </a>
      )}
      <Button size="sm" variant="ghost" icon="fa-solid fa-sliders" onClick={() => setDetails(true)}>
        Details
      </Button>
      {published && (
        <Button size="sm" variant="ghost" icon="fa-solid fa-eye-slash" onClick={doUnpublish} disabled={busy}>
          Unpublish
        </Button>
      )}
      <Button
        size="sm"
        variant="primary"
        icon="fa-solid fa-upload"
        onClick={doPublish}
        loading={busy}
        disabled={empty || (published && !changedSincePublish)}
        title={empty ? "Add a command or an event first" : published && !changedSincePublish ? "Nothing has changed since you last published" : undefined}
      >
        {published ? "Publish changes" : "Publish"}
      </Button>
      <TemplateDetailsModal open={details} onClose={() => setDetails(false)} />
    </div>
  );
}
