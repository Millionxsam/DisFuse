import { useEffect, useMemo, useState } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import prettier from "prettier/standalone";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";

import "../../../hljs.css";
import { previewItem } from "./preview.js";

hljs.registerLanguage("javascript", javascript);

/* =====================================================================
   "The code it writes"
   ---------------------------------------------------------------------
   What one item adds to a bot, with every input as it starts, updated
   as the item is edited. It's formatted the way exports are, and when
   the formatter can't read it, that's shown: it usually means a missing
   bracket in the template.
   ===================================================================== */

/* Statements outside a function can't use await or return; the preview
   wraps them so a step's code is checked the way it's really used. */
async function tidy(code, kind) {
  const wrapped = kind === "event" ? code : `async function preview() {\n${code}\n}`;
  try {
    const formatted = await prettier.format(wrapped, { plugins: [babel, estree], parser: "babel", printWidth: 72, tabWidth: 2, semi: true, trailingComma: "none", arrowParens: "avoid" });
    if (kind === "event") return { code: formatted.trim(), error: null };
    const lines = formatted.trim().split("\n").slice(1, -1).map((line) => line.replace(/^ {2}/, ""));
    return { code: lines.join("\n"), error: null };
  } catch (error) {
    const first = String(error?.message ?? "").split("\n")[0].replace(/\s*\(\d+:\d+\)$/, "");
    return { code, error: first || "This doesn't look like valid JavaScript." };
  }
}

export default function PackPreview({ pack, items, kind, item }) {
  const preview = useMemo(() => {
    try {
      return previewItem(pack, items, kind, item);
    } catch (error) {
      return { code: "", top: "", packages: [], issues: [error.message] };
    }
  }, [pack, items, kind, item]);

  const [shown, setShown] = useState({ code: preview.code, error: null });

  /* Formatting takes a moment; typing shouldn't wait for it. */
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      tidy(preview.code, kind).then((result) => current && setShown(result));
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [kind, preview.code]);

  const html = useMemo(() => hljs.highlight(shown.code || "// Nothing yet", { language: "javascript" }).value, [shown.code]);
  const topHtml = useMemo(() => (preview.top ? hljs.highlight(preview.top, { language: "javascript" }).value : ""), [preview.top]);

  return (
    <div className="dfb-pack-preview">
      <div className="dfb-pack-preview__head">
        <i className="fa-solid fa-code" aria-hidden />
        <span>The code it writes</span>
      </div>
      <p className="dfb-pack-preview__note">With every input as it starts. People's own choices go in when they use it.</p>
      <pre className="dfb-code dfb-pack-preview__code">
        <code className="hljs language-javascript" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>

      {shown.error && (
        <div className="dfb-pack-preview__error" role="status">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden />
          <span>
            <b>This might not run.</b> {shown.error}
          </span>
        </div>
      )}
      {preview.issues.map((issue, index) => (
        <div className="dfb-pack-preview__error" role="status" key={index}>
          <i className="fa-solid fa-circle-exclamation" aria-hidden />
          <span>{issue}</span>
        </div>
      ))}

      {(preview.top || preview.packages.length > 0) && (
        <>
          <div className="dfb-pack-preview__head dfb-pack-preview__head--small">
            <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden />
            <span>Added once, at the top of the bot</span>
          </div>
          {preview.packages.length > 0 && (
            <p className="dfb-pack-preview__note">
              Packages in package.json: <code>{preview.packages.join(", ")}</code>
            </p>
          )}
          {preview.top && (
            <pre className="dfb-code dfb-pack-preview__code dfb-pack-preview__code--top">
              <code className="hljs language-javascript" dangerouslySetInnerHTML={{ __html: topHtml }} />
            </pre>
          )}
        </>
      )}
    </div>
  );
}
