import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import LoadingAnim from "../../components/LoadingAnim";
import { getTemplate } from "../../api/templates.js";
import { userCache } from "../../cache.ts";
import TemplateApp from "../../builder/pages/TemplateApp.jsx";
import TemplateBuilder from "./TemplateBuilder.jsx";

/* =====================================================================
   One address, two template builders
   ---------------------------------------------------------------------
   /templates/:templateId/builder opens whichever builder the template
   was made with, the way /workspace does for projects: a Blockly
   workspace for block templates (every template from before DisFuse
   Builder), or DisFuse Builder's own pages for builder templates.

   The block template builder loads the template itself and explains
   anything that goes wrong (not found, someone else's), so anything but
   a builder template the viewer owns is handed to it unchanged.
   ===================================================================== */

export default function TemplateBuilderGate() {
  const { templateId } = useParams();
  const [found, setFound] = useState(null);

  useEffect(() => {
    let current = true;
    setFound(null);
    getTemplate(templateId)
      .then((template) => current && setFound({ template }))
      .catch(() => current && setFound({ template: null }));
    return () => {
      current = false;
    };
  }, [templateId]);

  if (!found)
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <LoadingAnim />
      </div>
    );

  const { template } = found;
  if (template?.type !== "builder") return <TemplateBuilder />;

  /* Someone else's template: its page, where they can add it. */
  if (template.owner?.id !== userCache.user?.id) return <Navigate to={`/templates/${templateId}`} replace />;

  return <TemplateApp key={template._id} template={template} />;
}
