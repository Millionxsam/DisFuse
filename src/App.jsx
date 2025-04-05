import "./index.css";

import { Route, Routes, Navigate } from "react-router-dom";
import Workspace from "./Pages/Workspace.jsx";
import Home from "./Pages/Home.jsx";
import Navbar from "./components/Navbar.jsx";
import Auth from "./Auth.jsx";
import Sidebar from "./Pages/Dashboard/Sidebar.jsx";
import Explore from "./Pages/Dashboard/Explore.jsx";
import Favorites from "./Pages/Dashboard/Favorites.jsx";
import Staff from "./Pages/Staff.jsx";
import Tos from "./Pages/Tos.jsx";
import Settings from "./Pages/Dashboard/Settings/Settings.jsx";
import MyProjects from "./Pages/Dashboard/Projects/MyProjects.jsx";
import UserPage from "./Pages/Dashboard/UserPage.jsx";
import ProjectPage from "./Pages/Dashboard/Projects/ProjectPage.jsx";
import ViewProject from "./Pages/Dashboard/Projects/ViewProject.jsx";
import Inbox from "./Pages/Dashboard/Inbox.jsx";
import WorkspaceSettings from "./Pages/Dashboard/Settings/WorkspaceSettings.jsx";
import NotificationSettings from "./Pages/Dashboard/Settings/NotificationSettings.jsx";
import OptimizationSettings from "./Pages/Dashboard/Settings/OptimizationSettings.jsx";
import StaffPanel from "./Pages/Dashboard/StaffPanel.jsx";
import Workshop from "./Pages/Dashboard/Workshop/Workshop.jsx";
import BlockPackPage from "./Pages/Dashboard/Workshop/BlockPackPage.jsx";
import WorkshopWorkspace from "./Pages/Dashboard/Workshop/WorkshopWorkspace.jsx";
import "./index.css";
import Library from "./Pages/Dashboard/Workshop/Library";

export default function App() {
  window.addEventListener("unhandledrejection", function (event) {
    if (event?.reason?.response && event?.reason?.response?.data?.error) {
      const data = event.reason.response.data;
      if (data.error !== "You are temporarily banned from DisFuse.")
        return console.error(event.reason);

      event.preventDefault();
      console.log(data, event.reason.response);

      window.document.body.innerHTML = `
      <div className="home-container">
        <div className="head">
          <h1>You are banned from DisFuse</h1>
          <h2>You may not access DisFuse until: ${new Date(
            data.bannedUntil
          ).toDateString()}.</h2>
        </div>
      </div>`;
    }
  });

  setInterval(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("shown", entry.isIntersecting);
      });
    });

    document.querySelectorAll(".hidden").forEach((e) => observer.observe(e));
  }, 200);

  return (
    <>
      <Routes>
        <Route path="/" element={[<Navbar />, <Home />]} />
        <Route path="/staff" element={[<Navbar />, <Staff />]} />
        <Route path="/tos" element={[<Navbar />, <Tos />]} />

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
            <Auth>
              <Sidebar />
            </Auth>
          }
        >
          <Route path="projects" element={<MyProjects />} />
          <Route path="explore" element={<Explore />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="workshop" element={<Workshop />} />
          <Route path="workshop/library" element={<Library />} />
          <Route path="workshop/:packId" element={<BlockPackPage />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="/:username" element={<UserPage />} />
          <Route path="/:username/:projectId" element={<ProjectPage />} />
          <Route path="settings" element={<Settings />}>
            <Route index element={<Navigate to={"/settings/workspace"} />} />
            <Route path="workspace" element={<WorkspaceSettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="optimization" element={<OptimizationSettings />} />
          </Route>
          <Route path="staff/panel" element={<StaffPanel />} />
        </Route>

        <Route path="/:username/:projectId/view" element={<ViewProject />} />

        <Route
          path="/:username/:projectId/workspace"
          element={[<Auth />, <Workspace />]}
        />

        <Route
          path="/workshop/:packId/workspace"
          element={[<Auth />, <WorkshopWorkspace />]}
        />
      </Routes>
    </>
  );
}
