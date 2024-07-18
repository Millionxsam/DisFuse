import { Route, Routes } from "react-router-dom";
import Workspace from "./Pages/Workspace";
import Home from "./Pages/Home";
import WorkspaceBar from "./components/WorkspaceBar";
import Navbar from "./components/Navbar";
import "./index.css";
import Auth from "./Auth";
import Sidebar from "./Pages/Dashboard/Sidebar";
import Projects from "./Pages/Dashboard/Projects";
import Explore from "./Pages/Dashboard/Explore";
import UserProfile from "./Pages/UserProfile";
import ProjectPage from "./Pages/ProjectPage";
import Favorites from "./Pages/Dashboard/Favorites";
import Settings from "./Pages/Dashboard/Settings";
import Staff from "./Pages/Staff";

export default function App() {
  setInterval(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("shown", entry.isIntersecting);
      });
    });

    document.querySelectorAll(".hidden").forEach((e) => observer.observe(e));
  }, 250);

  return (
    <>
      <Routes>
        <Route path="/" element={[<Navbar />, <Home />]} />
        <Route path="/staff" element={[<Navbar />, <Staff />]} />

        <Route path="/" element={[<Auth />, <Sidebar />]}>
          <Route path="projects" element={<Projects />} />
          <Route path="explore" element={<Explore />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/" element={[<Sidebar />, <Auth />]}>
          <Route path="/:username" element={<UserProfile />} />
          <Route path="/:username/:projectId" element={<ProjectPage />} />
        </Route>

        <Route
          path="/:username/:projectId/workspace"
          element={[<Auth />, <WorkspaceBar />, <Workspace />]}
        />
      </Routes>
    </>
  );
}
