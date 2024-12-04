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
import NotificationSettings from './Pages/Dashboard/Settings/NotificationSettings';
import OptimizationSettings from './Pages/Dashboard/Settings/OptimizationSettings';
import StaffPanel from './Pages/Dashboard/StaffPanel';

import "./index.css";

export default function App() {
  window.addEventListener("unhandledrejection", function (event) {
    if (event?.reason?.response && event?.reason?.response?.data?.error) {
      const data = event.reason.response.data;
      if (data.error !== 'You are temporarily banned from DisFuse.') return console.error(event.reason);

      event.preventDefault();
      console.log(data, event.reason.response)

      window.document.body.innerHTML = `
      <div class="home-container">
        <div class="head">
          <h1>You are banned from DisFuse</h1>
          <h2>You may not access DisFuse until: ${new Date(data.bannedUntil).toDateString()}.</h2>
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
      </Routes>
    </>
  );
}
