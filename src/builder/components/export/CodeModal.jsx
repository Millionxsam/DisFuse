import { useEffect, useMemo, useState } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";

import "../../../hljs.css";
import { buildBotCode } from "../../codegen/export.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button, Modal, Spinner, toast } from "../../ui/index.js";

hljs.registerLanguage("javascript", javascript);

/* =====================================================================
   View code
   ---------------------------------------------------------------------
   The bot's index.js exactly as the export writes it, highlighted the
   same way the block editor's code view is.
   ===================================================================== */

export default function CodeModal({ open, onClose }) {
  const { project, builder, catalog } = useBuilder();
  const [code, setCode] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    let current = true;
    setCode(null);
    buildBotCode(project, builder, catalog)
      .then((result) => current && setCode(result.code))
      .catch(() => current && setCode("// Something went wrong while building the code."));
    return () => {
      current = false;
    };
  }, [builder, catalog, open, project]);

  const html = useMemo(() => (code ? hljs.highlight(code, { language: "javascript" }).value : ""), [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code ?? "");
      toast.success("Code copied");
    } catch {
      toast.error("Couldn't copy the code");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your bot's code"
      subtitle="This is what DisFuse writes for you. You don't need to read it, but it's here if you're curious."
      icon="fa-solid fa-code"
      iconColor="var(--dfb-grad-cool)"
      size="xl"
      flush
      footer={
        <Button variant="secondary" icon="fa-regular fa-copy" onClick={copy} disabled={!code}>
          Copy code
        </Button>
      }
    >
      {!code ? (
        <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
          <Spinner size={30} />
        </div>
      ) : (
        <pre className="dfb-code">
          <code className="hljs language-javascript" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      )}
    </Modal>
  );
}
