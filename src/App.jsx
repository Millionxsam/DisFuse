import { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Workspace from "./Pages/Workspace";
import Home from "./Pages/Home";
import Navbar from "./components/Navbar";
import Auth from "./Auth";
import Sidebar from "./Pages/Dashboard/Sidebar";
import Explore from "./Pages/Dashboard/Explore";
import Favorites from "./Pages/Dashboard/Favorites";
import Staff from "./Pages/Staff";
import Tos from "./Pages/Tos";
import Settings from "./Pages/Dashboard/Settings/Settings";
import MyProjects from "./Pages/Dashboard/Projects/MyProjects";
import UserPage from "./Pages/Dashboard/UserPage";
import ProjectPage from "./Pages/Dashboard/Projects/ProjectPage";
import ViewProject from "./Pages/Dashboard/Projects/ViewProject";
import Inbox from "./Pages/Dashboard/Inbox";
import WorkspaceSettings from "./Pages/Dashboard/Settings/WorkspaceSettings";
import NotificationSettings from "./Pages/Dashboard/Settings/NotificationSettings";
import OptimizationSettings from "./Pages/Dashboard/Settings/OptimizationSettings";
import StaffPanel from "./Pages/Dashboard/StaffPanel";
import Workshop from "./Pages/Dashboard/Workshop/Workshop";
import BlockPackPage from "./Pages/Dashboard/Workshop/BlockPackPage";
import WorkshopWorkspace from "./Pages/Dashboard/Workshop/WorkshopWorkspace";
import "./styles/index.css";
import Library from "./Pages/Dashboard/Workshop/Library";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import Footer from "./components/Footer";
import useRevealOnScroll from "./functions/useRevealOnScroll";
import NewProject from "./Pages/Dashboard/Projects/NewProject";
import EditProject from "./Pages/Dashboard/Projects/EditProject";
import CloneProject from "./Pages/Dashboard/Projects/CloneProject";
import Websites from "./Pages/Dashboard/Websites/Websites";
import NewWebsite from "./Pages/Dashboard/Websites/NewWebsite";
import WebsiteEditor from "./Pages/Dashboard/Websites/WebsiteEditor";
import PremiumGate from "./components/websites/PremiumGate";
import PublishedSiteRedirect from "./components/websites/PublishedSiteRedirect";
import PremiumSettings from "./Pages/Dashboard/Settings/PremiumSettings";
import Insights from "./Pages/Dashboard/Insights/Insights";
import BotInsights from "./Pages/Dashboard/Insights/BotInsights";
import InsightsLogs from "./Pages/Dashboard/Insights/InsightsLogs";
import InsightsUpgrade from "./Pages/Dashboard/Insights/InsightsUpgrade";
import Control from "./Pages/Dashboard/Control/Control";
import BotControl from "./Pages/Dashboard/Control/BotControl";
import ControlUpgrade from "./Pages/Dashboard/Control/ControlUpgrade";

/* A ban is enforced by the API, so it can arrive as the answer to any
   request. Taking over the page is blunt, but it is what the app has
   always done and the alternative is the user bouncing off every route
   in turn. */
function showBanNotice(bannedUntil) {
  document.body.replaceChildren();

  const container = document.createElement("div");
  container.className = "home-container";
  container.innerHTML = `
    <div class="head">
      <h1>You are banned from DisFuse</h1>
      <h2>You may not access DisFuse until: ${new Date(
        bannedUntil,
      ).toDateString()}.</h2>
    </div>`;

  document.body.appendChild(container);
}

export default function App() {
  /* These were in the render body, so every render added another
     listener, another observer and another interval — none of which
     were ever removed. The class name in the old markup was `className`
     too, which does nothing in raw HTML. */
  useEffect(() => {
    function onRejection(event) {
      const data = event?.reason?.response?.data;
      if (!data?.error) return;

      if (data.error !== "You are temporarily banned from DisFuse.")
        return console.error(event.reason);

      event.preventDefault();
      showBanNotice(data.bannedUntil);
    }

    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  useRevealOnScroll();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={[<Navbar key={0} />, <Home key={1} />, <Footer key={2} />]}
        />
        <Route
          path="/staff"
          element={[<Navbar key={0} />, <Staff key={1} />, <Footer key={2} />]}
        />
        <Route
          path="/tos"
          element={[<Navbar key={0} />, <Tos key={1} />, <Footer key={2} />]}
        />
        <Route
          path="/pp"
          element={[
            <Navbar key={0} />,
            <PrivacyPolicy key={1} />,
            <Footer key={2} />,
          ]}
        />

        <Route
          path="/dashboard/projects"
          element={<Navigate to="/projects" />}
        />
        <Route path="/dashboard/explore" element={<Navigate to="/explore" />} />
        <Route
          path="/dashboard/favorites"
          element={<Navigate to="/favorites" />}
        />
        <Route
          path="/dashboard/settings"
          element={<Navigate to="/settings" />}
        />

        <Route
          path="/"
          element={
            <Auth key={-1}>
              <Sidebar key={-2} />
            </Auth>
          }
        >
          <Route path="projects" element={<MyProjects key={0} />} />
          <Route path="projects/new" element={<NewProject key={0} />} />
          <Route
            path="websites"
            element={
              <PremiumGate key={0}>
                <Websites />
              </PremiumGate>
            }
          />
          <Route
            path="websites/new"
            element={
              <PremiumGate key={0}>
                <NewWebsite />
              </PremiumGate>
            }
          />
          {/* Insights is premium and owner-only. The gate is UX; the API
              enforces both ownership and the subscription itself. */}
          <Route
            path="insights"
            element={
              <PremiumGate key={0} fallback={<InsightsUpgrade />}>
                <Insights />
              </PremiumGate>
            }
          />
          <Route
            path="insights/:projectId"
            element={
              <PremiumGate key={0} fallback={<InsightsUpgrade />}>
                <BotInsights />
              </PremiumGate>
            }
          />
          <Route
            path="insights/:projectId/logs"
            element={
              <PremiumGate key={0} fallback={<InsightsUpgrade />}>
                <InsightsLogs />
              </PremiumGate>
            }
          />
          {/* Control is premium and owner-only. Like Insights, the gate
              is UX: the Socket.IO layer checks the subscription and the
              bot's ownership itself on every connection and action. */}
          <Route
            path="control"
            element={
              <PremiumGate key={0} fallback={<ControlUpgrade />}>
                <Control />
              </PremiumGate>
            }
          />
          <Route path="explore" element={<Explore key={0} />} />
          <Route path="favorites" element={<Favorites key={0} />} />
          <Route path="workshop" element={<Workshop key={0} />} />
          <Route path="workshop/library" element={<Library key={0} />} />
          <Route path="workshop/:packId" element={<BlockPackPage key={0} />} />
          <Route path="inbox" element={<Inbox key={0} />} />
          <Route path="/:username" element={<UserPage key={0} />} />
          <Route
            path="/:username/:projectId"
            element={<ProjectPage key={0} />}
          />
          <Route
            path="/:username/:projectId/edit"
            element={<EditProject key={0} />}
          />
          <Route
            path="/:username/:projectId/clone"
            element={<CloneProject key={0} />}
          />
          <Route path="settings" element={<Settings key={0} />}>
            <Route
              index
              element={<Navigate to={"/settings/workspace"} key={0} />}
            />
            <Route path="workspace" element={<WorkspaceSettings key={0} />} />
            <Route
              path="notifications"
              element={<NotificationSettings key={0} />}
            />
            <Route
              path="optimization"
              element={<OptimizationSettings key={0} />}
            />
            <Route path="premium" element={<PremiumSettings key={0} />} />
          </Route>
          <Route path="staff/panel" element={<StaffPanel key={0} />} />
        </Route>

        <Route
          path="/:username/:projectId/view"
          element={<ViewProject key={0} />}
        />

        {/* Auth WRAPS these, like every other protected route. Rendered
            as siblings — which is what an array does — Auth received no
            children, so the editor mounted and began loading a project
            before anyone had checked whether the user was signed in. */}
        <Route
          path="/:username/:projectId/workspace"
          element={
            <Auth>
              <Workspace />
            </Auth>
          }
        />

        <Route
          path="/workshop/:packId/workspace"
          element={
            <Auth>
              <WorkshopWorkspace />
            </Auth>
          }
        />

        {/* Full-screen website builder — same shape as the Blockly
            workspace: authenticated, but outside the sidebar shell. */}
        <Route
          path="/websites/:websiteId/editor"
          element={
            <Auth key={0}>
              <PremiumGate key={1}>
                <WebsiteEditor key={2} />
              </PremiumGate>
            </Auth>
          }
        />

        {/* The Control client is a full-screen app, like the Blockly
            workspace and the website builder — authenticated, premium,
            and outside the sidebar shell. */}
        <Route
          path="/control/:projectId"
          element={
            <Auth key={0}>
              <PremiumGate key={1} fallback={<ControlUpgrade />}>
                <BotControl key={2} />
              </PremiumGate>
            </Auth>
          }
        />

        {/* Published websites moved to their own application at
            sites.disfuse.xyz. These two routes forward the old links. */}
        <Route
          path="/site/:botID"
          element={<PublishedSiteRedirect key={0} />}
        />
        <Route
          path="/site/:botID/:pagePath"
          element={<PublishedSiteRedirect key={0} />}
        />
      </Routes>
    </>
  );
}
