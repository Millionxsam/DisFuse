import { useEffect, useRef, useState } from "react";

import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button } from "../../ui/index.js";
import MessageBuilder from "./MessageBuilder.jsx";
import MessagePreviewCard from "./MessagePreviewCard.jsx";

/* A message input on a step: a small live preview and the button that
   opens the message builder. */

/* The small preview fades out at the bottom, but only when the message
   is taller than it and actually gets cut off. */
function useCutOff(shown) {
  const ref = useRef(null);
  const [cut, setCut] = useState(false);
  useEffect(() => {
    const box = ref.current;
    if (!box) return undefined;
    const check = () => setCut(box.scrollHeight > box.clientHeight + 1);
    check();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(check);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    return () => observer.disconnect();
  }, [shown]);
  return [ref, cut];
}

export default function MessageField({ def, value, onChange, scope, readOnly }) {
  const { readOnly: projectReadOnly } = useBuilder();
  const [open, setOpen] = useState(false);
  const count = value?.components?.length ?? 0;
  const [miniRef, cut] = useCutOff(count > 0);

  return (
    <div className="dfb-special">
      <div className="dfb-special__preview">
        {count ? (
          <div ref={miniRef} className={`dfb-special__mini ${cut ? "dfb-special__mini--cut" : ""}`}>
            <MessagePreviewCard spec={value} location={scope?.location} compact notes={false} />
          </div>
        ) : (
          <span className="dfb-special__empty">
            <i className="fa-solid fa-message" aria-hidden /> No message yet. Open the message builder to make one.
          </span>
        )}
      </div>
      <Button variant={count ? "secondary" : "primary"} icon="fa-solid fa-pen-ruler" onClick={() => setOpen(true)}>
        {readOnly || projectReadOnly ? "View message" : count ? "Edit message" : "Build message"}
      </Button>
      <MessageBuilder open={open} onClose={() => setOpen(false)} value={value} onChange={onChange} scope={scope} title={def.label} allowFiles={def.files !== false} readOnly={readOnly || projectReadOnly} />
    </div>
  );
}
