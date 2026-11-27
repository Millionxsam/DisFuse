import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import TemplateImport from "../components/templates/TemplateImport.jsx";
import { BuilderProvider, useBuilder } from "../state/BuilderProvider.jsx";
import { Button, DialogHost, Spinner, Toaster } from "../ui/index.js";
import CommandPage from "./CommandPage.jsx";
import CollaboratorsPage from "./CollaboratorsPage.jsx";
import CommandsPage from "./CommandsPage.jsx";
import DashboardPage from "./DashboardPage.jsx";
import EventPage from "./EventPage.jsx";
import EventsPage from "./EventsPage.jsx";
import FlowPage from "./FlowPage.jsx";
import OptionPage from "./OptionPage.jsx";
import VersionsPage from "./VersionsPage.jsx";

import "../../styles/builder/pages.css";

/* =====================================================================
   DisFuse Builder
   ---------------------------------------------------------------------
   What /@user/:projectId/workspace shows for a DisFuse Builder project:
   its own full-screen app, with no site sidebar and no block editor
   toolbar. Every page has its own address under /workspace:

     /workspace                                   the dashboard
     /workspace/commands                          every command
     /workspace/commands/:commandId               one command
     /workspace/commands/:commandId/builder       its steps
     /workspace/commands/:c/options/:optionId     an option, subcommand or group
     /workspace/commands/:c/options/:o/builder    a subcommand's steps
     /workspace/events                            every event
     /workspace/events/:eventId                   one event
     /workspace/events/:eventId/builder           its steps
     /workspace/collaborators                     who's on the project, and what each may do
     /workspace/versions                          Version Control: every version, and switching between them
     /workspace/settings                          → the project's edit page

   Any of them with `?template=<id>` offers to add that DisFuse Builder
   template to the project ("Add to a project" on a template's page).
   ===================================================================== */

function Shell() {
  const { loading, error, project, paths, readOnly, isOwner, isCollaborator } = useBuilder();

  if (error)
    return (
      <div className="dfb-fullscreen">
        <div className="dfb-fullscreen__card">
          <i className="fa-solid fa-plug-circle-xmark" aria-hidden />
          <h1>We couldn't open this project</h1>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.assign("/projects")}>
            Back to your projects
          </Button>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="dfb-fullscreen">
        <Spinner size={34} />
      </div>
    );

  /* Someone else's project opens read-only on its public page instead.
     Collaborators get the whole app; what they can change follows their
     permissions. */
  if (!isOwner && !isCollaborator) return <Navigate to={`${paths.project}/view`} replace />;

  return (
    <>
      <Helmet>
        <title>{`${project.name} | DisFuse Builder`}</title>
      </Helmet>
      {readOnly && (
        <div className="dfb-banner dfb-banner--danger" role="alert">
          <i className="fa-solid fa-lock" aria-hidden /> This project is suspended, so it can't be changed right now.
          {project.suspension?.reason ? ` Reason: ${project.suspension.reason}` : ""}
        </div>
      )}
      <Routes>
        <Route index element={<DashboardPage />} />
        <Route path="commands" element={<CommandsPage />} />
        <Route path="commands/:commandId" element={<CommandPage />} />
        <Route path="commands/:commandId/builder" element={<FlowPage source="command" />} />
        <Route path="commands/:commandId/options/:optionId" element={<OptionPage />} />
        <Route path="commands/:commandId/options/:optionId/builder" element={<FlowPage source="option" />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:eventId" element={<EventPage />} />
        <Route path="events/:eventId/builder" element={<FlowPage source="event" />} />
        <Route path="collaborators" element={<CollaboratorsPage />} />
        <Route path="versions" element={<VersionsPage />} />
        <Route path="settings" element={<Navigate to={paths.edit} replace />} />
        <Route path="*" element={<Navigate to={paths.workspace} replace />} />
      </Routes>
      <TemplateImport />
    </>
  );
}

export default function BuilderApp() {
  const { projectId } = useParams();
  return (
    <BuilderProvider projectId={projectId}>
      <div className="dfb-root dfb-app">
        <Shell />
        <Toaster />
        <DialogHost />
      </div>
    </BuilderProvider>
  );
}
