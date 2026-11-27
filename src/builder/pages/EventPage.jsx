import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import "../../styles/builder/flow.css";

import { StepsSummary, ValidatedText } from "../components/commands/shared.jsx";
import { FlowContext } from "../components/flow/FlowContext.js";
import HandlerSource from "../components/flow/HandlerSource.jsx";
import InputField from "../components/flow/InputField.jsx";
import PageLayout, {
  PageHeader,
  Section,
} from "../components/layout/PageLayout.jsx";
import { inputVisible, literalOf } from "../codegen/context.js";
import { OpError } from "../model/ops.js";
import { LIMITS, checkEventLabel } from "../model/rules.js";
import { useBuilder, useFlow } from "../state/BuilderProvider.jsx";
import { Button, Chip, Toggle, confirm, toast } from "../ui/index.js";
import { DOCS } from "../../config/docs.js";

/* =====================================================================
   One event
   ---------------------------------------------------------------------
   Its label (only for you), what kind of event it is, an on/off switch,
   any settings the event has (like "Only for this button ID"), what it
   makes available to its steps, and the way into the builder.
   ===================================================================== */

export default function EventPage() {
  const { eventId } = useParams();
  const { builder, catalog, paths, readOnly, can, updateEvent, deleteEvent } =
    useBuilder();
  /* Each part of an event has its own permission. */
  const cannot = (permission) => readOnly || !can(permission);
  const { info, issues } = useFlow(eventId);
  const navigate = useNavigate();

  const event = builder.events.find((e) => e.id === eventId);
  if (!event) return <Navigate to={`${paths.workspace}/events`} replace />;

  const def = catalog.events.get(event.type);
  const category = def && catalog.categoryById[def.category];
  const title = event.label || def?.label || "Unknown event";

  const remove = async () => {
    const ok = await confirm({
      title: `Delete “${title}”?`,
      message:
        "The event and all of its steps will be deleted. This can't be undone.",
      confirmLabel: "Delete event",
      danger: true,
    });
    if (!ok) return;
    deleteEvent(event.id);
    navigate(`${paths.workspace}/events`);
    toast.success("Event deleted");
  };

  const setting = (key, value, options) => {
    try {
      updateEvent(event.id, { settings: { [key]: value } }, options);
    } catch (error) {
      if (error instanceof OpError) toast.error(error.message);
      else throw error;
    }
  };

  const rawOf = (key) =>
    literalOf(
      def?.settings.find((s) => s.key === key),
      event.settings?.[key],
    );

  return (
    <FlowContext.Provider value={{ flowId: event.id, info, issues }}>
      <PageLayout
        crumbs={[
          {
            label: "Events",
            icon: "fa-solid fa-bolt",
            to: `${paths.workspace}/events`,
          },
          { label: title, icon: def?.icon ?? "fa-solid fa-bolt" },
        ]}
      >
        <PageHeader
          docs={DOCS.builderEvents}
          icon={def?.icon ?? "fa-solid fa-bolt"}
          color={
            category
              ? `linear-gradient(135deg, ${category.color}, color-mix(in srgb, ${category.color} 55%, #000))`
              : undefined
          }
          eyebrow={def?.label ?? "Unknown event"}
          title={title}
          subtitle={
            def?.description ?? "This kind of event doesn't exist anymore."
          }
        >
          <Link
            to={`${paths.workspace}/events/${event.id}/builder`}
            className="dfb-btn dfb-btn--primary dfb-page-header__shortcut"
          >
            <i className="fa-solid fa-hammer" aria-hidden /> Open builder
          </Link>
        </PageHeader>

        <HandlerSource event={event} className="dfb-handlers--page" />

        <StepsSummary
          actions={event.actions}
          issues={issues}
          to={`${paths.workspace}/events/${event.id}/builder`}
        />

        <Section title="About this event" icon="fa-solid fa-tag">
          <div className="dfb-grid-2">
            <ValidatedText
              label="Label"
              value={event.label}
              maxLength={LIMITS.eventLabelLength}
              placeholder={def?.label}
              disabled={cannot("events.rename")}
              help="Only for you, to tell your events apart. The bot never uses it."
              validate={checkEventLabel}
              onSave={(label) =>
                updateEvent(event.id, { label }, { debounce: true })
              }
            />
            <div className="dfb-field">
              <span className="dfb-field__label">Turned on</span>
              <Toggle
                checked={event.enabled !== false}
                disabled={cannot("events.toggle")}
                label={
                  event.enabled === false ? "Off: this event won't run" : "On"
                }
                onChange={(enabled) => updateEvent(event.id, { enabled })}
              />
              <span className="dfb-field__help">
                Disable it to keep it without it running.
              </span>
            </div>
          </div>
        </Section>

        {def?.settings?.length > 0 && (
          <Section
            title="Settings"
            icon="fa-solid fa-sliders"
            description="Narrow down when this event runs."
          >
            <div className="dfb-grid-2">
              {def.settings
                .filter((input) => inputVisible(input, rawOf))
                .map((input) => (
                  <InputField
                    key={input.key}
                    def={input}
                    value={event.settings?.[input.key]}
                    onChange={(value, options) =>
                      setting(input.key, value, options)
                    }
                    scope={{ location: {}, path: [], ownerId: def.id }}
                    readOnly={cannot("events.settings")}
                  />
                ))}
            </div>
          </Section>
        )}

        {def?.values?.length > 0 && (
          <Section
            title="What you can use in its steps"
            icon="fa-solid fa-wand-magic-sparkles"
            description="These values are available to every step of this event."
          >
            <div className="dfb-row">
              {def.values.map((value) => (
                <Chip
                  key={value.key}
                  icon="fa-solid fa-diagram-next"
                  color={category?.color ?? "#35d0a0"}
                  title={value.description}
                >
                  {value.label}
                </Chip>
              ))}
            </div>
          </Section>
        )}

        {!cannot("events.delete") && (
          <Section className="dfb-danger-zone">
            <div>
              <h2 style={{ margin: 0, fontSize: "1.02rem" }}>
                Delete this event
              </h2>
              <p>Removes it and all of its steps.</p>
            </div>
            <Button
              variant="danger"
              icon="fa-solid fa-trash-can"
              onClick={remove}
            >
              Delete event
            </Button>
          </Section>
        )}
      </PageLayout>
    </FlowContext.Provider>
  );
}
