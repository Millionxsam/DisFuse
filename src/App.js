import "./index.css";

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
import "./index.css";
import Library from "./Pages/Dashboard/Workshop/Library";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import Footer from "./components/Footer";
import Swal from "sweetalert2";

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

  const intersection = new IntersectionObserver((entries, _) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("shown", entry.isIntersecting);
    });
  });

  setInterval(() => {
    document.querySelectorAll(".hidden").forEach((i) => {
      if (i.dataset.observed !== true) {
        intersection.observe(i);
        i.dataset.observed = true;
      }
    });
  }, 500);

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
          </Route>
          <Route path="staff/panel" element={<StaffPanel key={0} />} />
        </Route>

        <Route
          path="/:username/:projectId/view"
          element={<ViewProject key={0} />}
        />

        <Route
          path="/:username/:projectId/workspace"
          element={[<Auth key={0} />, <Workspace key={1} />]}
        />

        <Route
          path="/workshop/:packId/workspace"
          element={[<Auth key={0} />, <WorkshopWorkspace key={1} />]}
        />
      </Routes>
    </>
  );
}
