import { useMemo } from "react";

import "../../styles/builder/flow.css";
import "../../styles/builder/pages.css";
import "../../styles/builder/templates.css";

import { parseTemplateContent, secretNamesIn } from "../../builder/model/templates.js";
import { BuilderOverview } from "../../builder/pages/ReadOnlyView.jsx";
import { StaticBuilderProvider } from "../../builder/state/TemplateBuilderProvider.jsx";

/* =====================================================================
   A DisFuse Builder template, to look at
   ---------------------------------------------------------------------
   The block template preview's counterpart: every command and event in
   the template, each opening to its steps, drawn with the same cards as
   the builder's read-only project page. Nothing can be changed.
   ===================================================================== */

/**
 * @param {object} props
 * @param {string} props.data   the template's saved content
 * @param {string} props.name
 * @param {string} props.templateId
 */
export default function BuilderTemplatePreview({ data, name, templateId }) {
  const builder = useMemo(() => parseTemplateContent(data), [data]);
  const secrets = useMemo(() => secretNamesIn(builder), [builder]);

  return (
    <div className="dfb-root dfb-tpl-preview">
      <StaticBuilderProvider builder={builder} name={name} templateId={templateId}>
        {secrets.length > 0 && (
          <div className="dfb-note dfb-note--amber">
            <i className="fa-solid fa-user-secret" aria-hidden />
            <div>
              <strong>It uses {secrets.length === 1 ? "a secret" : "secrets"}:</strong> {secrets.join(", ")}. After adding it, save{" "}
              {secrets.length === 1 ? "one" : "them"} with the same name on your bot's dashboard.
            </div>
          </div>
        )}
        <BuilderOverview emptyText="There's nothing in this template yet." />
      </StaticBuilderProvider>
    </div>
  );
}
