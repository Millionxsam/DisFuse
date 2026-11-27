import { useNavigate } from "react-router-dom";

import { HANDLERS, handlerSources } from "../../model/handlers.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button } from "../../ui/index.js";

/* =====================================================================
   "Answers the button …"
   ---------------------------------------------------------------------
   At the top of an event that runs for one button, menu or form: which
   one it is, the step that sends it, and a way back to that step. The
   other half of HandlerStrip, which sits under the step.
   ===================================================================== */

const NOUN = { button: "button", menu: "menu", form: "form" };
const SENDS = { button: "sends", menu: "sends", form: "shows" };

export default function HandlerSource({ event, className = "" }) {
  const { builder, catalog, paths } = useBuilder();
  const navigate = useNavigate();
  const found = handlerSources(builder, catalog, event);
  /* Not a button, menu or form event, or one that runs for all of them. */
  if (!found?.id) return null;

  const { kind, id, startsWith, sources } = found;
  const noun = NOUN[kind];
  const idText = startsWith ? "an ID starting with" : "the ID";

  return (
    <div className={`dfb-handlers dfb-handlers--source ${sources.length ? "" : "dfb-handlers--missing"} ${className}`}>
      <div className="dfb-handlers__title">
        <i className={HANDLERS[kind].icon} aria-hidden />
        {sources.length ? `Runs for this ${noun}` : `No step ${SENDS[kind]} this ${noun} yet`}
      </div>
      {sources.length ? (
        <ul className="dfb-handlers__list">
          {sources.map((source) => (
            <li key={`${source.actionId}:${source.id}`} className="dfb-handlers__row">
              <i className={`${source.flowIcon} dfb-handlers__icon`} aria-hidden />
              <span className="dfb-handlers__text">
                <span className="dfb-handlers__what">
                  {noun[0].toUpperCase() + noun.slice(1)} <b>{source.label}</b>
                </span>
                <code className="dfb-handlers__id">{source.id}</code>
                <span className="dfb-handlers__from">
                  {kind === "form" ? "Shown" : "Sent"} by <b>{source.stepLabel}</b> in{" "}
                  {source.flowWhat === "event" ? "the event " : ""}
                  <b>{source.flowName}</b>
                </span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                icon="fa-solid fa-arrow-right"
                onClick={() => navigate(`${paths.workspace}${source.path}`)}
              >
                Go to that step
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dfb-handlers__hint">
          This event runs when someone {HANDLERS[kind].uses} with {idText} <code className="dfb-handlers__id">{id}</code>, but
          none of your steps {SENDS[kind] === "shows" ? "show" : "send"} one. Check the ID matches, or add a{" "}
          {noun} with this ID to a step.
        </p>
      )}
    </div>
  );
}
