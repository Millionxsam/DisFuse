import { useNavigate } from "react-router-dom";

import { HANDLERS, handlerEvent, handlerFor, interactionIds } from "../../model/handlers.js";
import { OpError } from "../../model/ops.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button, toast } from "../../ui/index.js";

/* =====================================================================
   "What happens when it's used"
   ---------------------------------------------------------------------
   Under a step that sends buttons or menus, or shows a form: one row
   per ID, with a way to the event that handles it, or a button that
   makes that event with the ID already filled in.
   ===================================================================== */

export default function HandlerStrip({ action }) {
  const { catalog, builder, paths, readOnly, can, createEvent } = useBuilder();
  const navigate = useNavigate();
  const ids = interactionIds(action, catalog);
  if (!ids.length) return null;

  const eventPath = (event) => `${paths.workspace}/events/${event.id}`;

  const make = (item) => {
    try {
      const created = createEvent(handlerEvent(item));
      toast.success("Event made", {
        detail: `It runs when someone ${HANDLERS[item.kind].uses} with the ID “${item.id}”.`,
        action: { label: "Open it", onClick: () => navigate(eventPath(created)) },
      });
    } catch (error) {
      if (error instanceof OpError) toast.error("Couldn't make the event", { detail: error.message });
      else throw error;
    }
  };

  return (
    <div className="dfb-handlers">
      <div className="dfb-handlers__title">
        <i className="fa-solid fa-bolt" aria-hidden /> When they're used
      </div>
      <ul className="dfb-handlers__list">
        {ids.map((item) => {
          const handler = HANDLERS[item.kind];
          const event = handlerFor(builder, catalog, item.kind, item.id);
          return (
            <li key={`${item.kind}:${item.id}`} className="dfb-handlers__row">
              <i className={`${handler.icon} dfb-handlers__icon`} aria-hidden />
              <span className="dfb-handlers__text">
                <span className="dfb-handlers__what">
                  {item.kind === "form" ? "Form" : item.kind === "menu" ? "Menu" : "Button"} <b>{item.label}</b>
                </span>
                <code className="dfb-handlers__id">{item.id}</code>
              </span>
              {event ? (
                <Button size="sm" variant="ghost" icon="fa-solid fa-arrow-right" onClick={() => navigate(eventPath(event))}>
                  Open its event
                </Button>
              ) : readOnly || !can("events.create") ? (
                <span className="dfb-handlers__none">Nothing handles it yet</span>
              ) : (
                <Button size="sm" variant="secondary" icon="fa-solid fa-plus" onClick={() => make(item)}>
                  Make an event for it
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
