import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";

import DocsLink from "../../../components/DocsLink.jsx";
import TemplateGallery from "../../../components/templates/TemplateGallery.jsx";
import {
  createTemplateFlow,
  pickProjectForTemplate,
  projectUrlWithTemplate,
} from "../../../components/templates/templateDialogs.js";
import { userCache } from "../../../cache.ts";
import modalThemeColor from "../../../functions/modalThemeColor.js";
import { DOCS } from "../../../config/docs.js";

const modalColors = modalThemeColor(null, true);

/* =====================================================================
   Templates
   ---------------------------------------------------------------------
   The dashboard's way into the template gallery — the same gallery the
   editor shows under Utilities › Templates. Importing needs a project,
   so "Use" here asks which one and opens it with the template waiting;
   the editor does the import itself.

   The open tab lives in the URL (`?tab=mine`), so "back to my
   templates" from the builder is a link.
   ===================================================================== */

export default function Templates() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  async function use(template) {
    const project = await pickProjectForTemplate(template, modalColors);
    if (project) navigate(projectUrlWithTemplate(project, template._id));
  }

  function create() {
    createTemplateFlow({ openIn: "here", navigate, modalColors });
  }

  return (
    <div className="df-page df-templates-page">
      <Helmet>
        <title>Templates | DisFuse</title>
      </Helmet>

      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-shapes" /> Templates
        </h1>
        <div className="df-toolbar">
          <div className="df-btn-group">
            <DocsLink page={DOCS.templates} />
          </div>
        </div>
      </div>

      <p className="df-templates-lede">
        Ready-made blocks shared by the community and the DisFuse team. Add
        one to any project, and its blocks are yours to change however you
        like.
      </p>

      <TemplateGallery
        viewer={userCache.user}
        onOpen={(template) => navigate(`/templates/${template._id}`)}
        onUse={use}
        useLabel="Add"
        onEdit={(template) => navigate(`/templates/${template._id}/builder`)}
        onCreate={create}
        initialFilter={searchParams.get("tab") ?? "all"}
        onFilterChange={(tab) =>
          setSearchParams(tab === "all" ? {} : { tab }, { replace: true })
        }
      />
    </div>
  );
}
