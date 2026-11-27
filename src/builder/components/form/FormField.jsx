import { useState } from "react";

import { literalOf } from "../../codegen/context.js";
import { MODAL_FIELDS } from "../../codegen/modal.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Badge, Button } from "../../ui/index.js";
import FormBuilder from "./FormBuilder.jsx";

/* A form input on a step: what the form is, and the button that opens
   the form builder. */

export default function FormField({ value, onChange, scope, readOnly }) {
  const { readOnly: projectReadOnly } = useBuilder();
  const [open, setOpen] = useState(false);
  const count = value?.components?.length ?? 0;
  const title = value?.inputs?.title?.ref ? "A title from a value" : literalOf(MODAL_FIELDS[0], value?.inputs?.title);
  const id = value?.inputs?.customId?.ref ? null : literalOf(MODAL_FIELDS[1], value?.inputs?.customId);

  return (
    <div className="dfb-special">
      <div className="dfb-special__preview">
        {count ? (
          <div className="dfb-row">
            <i className="fa-solid fa-window-maximize" aria-hidden style={{ color: "#35d0a0" }} />
            <b>{title || "Untitled form"}</b>
            <Badge>
              {count} piece{count === 1 ? "" : "s"}
            </Badge>
            {id ? <Badge tone="violet">Form ID: {id}</Badge> : <Badge tone="amber">No form ID</Badge>}
          </div>
        ) : (
          <span className="dfb-special__empty">
            <i className="fa-solid fa-window-maximize" aria-hidden /> No form yet. Open the form builder to make one.
          </span>
        )}
      </div>
      <Button variant={count ? "secondary" : "primary"} icon="fa-solid fa-pen-ruler" onClick={() => setOpen(true)}>
        {readOnly || projectReadOnly ? "View form" : count ? "Edit form" : "Build form"}
      </Button>
      <FormBuilder open={open} onClose={() => setOpen(false)} value={value} onChange={onChange} scope={scope} readOnly={readOnly || projectReadOnly} />
    </div>
  );
}
