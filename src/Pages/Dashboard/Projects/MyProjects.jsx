import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import PriProject from "../../../components/PriProject";
import LoadingAnim from "../../../components/LoadingAnim";
import modalThemeColor from "../../../functions/modalThemeColor";
import { userCache } from "../../../cache.ts";
import { Link } from "react-router-dom";

const { discordUrl, apiUrl } = require("../../../config/config.js");

const modalColors = modalThemeColor(null, true);

export default function MyProjects() {
  const token = localStorage.getItem("disfuse-token");
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);
  const [user, setUser] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem("projectSystemMigration") === "true") return;

      const queue = Swal.mixin({
        progressSteps: ["1", "2", "3", "4"],
        confirmButtonText: "Next",
        cancelButtonText: "Skip",
        showCancelButton: true,
        animation: false,
      });

      const { isConfirmed } = await queue.fire({
        animation: true,
        currentProgressStep: 0,
        title: "New Project Creation Process",
        icon: "info",
        text: "We've made changes to the project creation process in order to make it easier to manage and share your Discord bots.",
        footer: "You may ignore this if you are a new user",
        ...modalThemeColor(userCache.user),
      });

      if (!isConfirmed)
        return localStorage.setItem("projectSystemMigration", "true");

      const { isConfirmed: two } = await queue.fire({
        currentProgressStep: 1,
        title: "How It Works",
        icon: "info",
        text: "When creating a new project, you will now enter your bot token before the project is created. This will link your Discord bot to your DisFuse project and will allow you to see your bot information directly from DisFuse, and will also let other users add your bot from the explore page.",
        footer: "You may ignore this if you are a new user",
        ...modalThemeColor(userCache.user),
      });

      if (!two) return localStorage.setItem("projectSystemMigration", "true");

      const { isConfirmed: three } = await queue.fire({
        currentProgressStep: 2,
        title: "New Bot Visibility Setting",
        icon: "info",
        text: "You can now set your bot visibility to public or private (different from project visibility). Public bots will show up on the explore page and other users can add your bot to their servers directly from DisFuse.",
        footer: "You may ignore this if you are a new user",
        ...modalThemeColor(userCache.user),
      });

      if (!three) return localStorage.setItem("projectSystemMigration", "true");

      await queue.fire({
        currentProgressStep: 3,
        title: "Old Projects",
        icon: "info",
        text: "All old projects will be unusable until a bot token is set in the project settings. You will need to enter your token the next time you open your project.",
        footer: "You may ignore this if you are a new user",
        showCancelButton: false,
        confirmButtonText: "Finish",
        ...modalThemeColor(userCache.user),
      });

      localStorage.setItem("projectSystemMigration", "true");
    })();
  }, []);

  const fetchProjects = useCallback((userData) => {
    if (!userData?.id) return;
    axios
      .get(apiUrl + `/users/${userData.id}/projects`, {
        headers: { Authorization: localStorage.getItem("disfuse-token") },
      })
      .then(({ data: projects }) => {
        let sortedProjects = projects.sort(
          (a, b) => new Date(b.lastEdited || 0) - new Date(a.lastEdited || 0),
        );
        userCache.projects = sortedProjects;
        setProjects(sortedProjects);
        setShown(sortedProjects);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!(userCache.user && userCache.projects)) {
      axios
        .get(discordUrl + "/users/@me", { headers: { Authorization: token } })
        .then(({ data: userData }) => {
          setUser(userData);
        });
    } else {
      setUser(userCache.user);
      setProjects(userCache.projects);
      setShown(userCache.projects);
      setLoading(false);
      return;
    }

    axios
      .get(discordUrl + "/users/@me", {
        headers: { Authorization: token },
      })
      .then(({ data: userData }) => {
        setUser(userData);
        userCache.user = userData;
        fetchProjects(userData);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token, fetchProjects]);

  function sort() {
    Swal.fire({
      title: "Sort Projects",
      input: "select",
      inputOptions: {
        lastEdited: "Last Edited",
        "a-z": "Alphabetically (A to Z)",
        "z-a": "Reverse Alphabetically (Z to A)",
        oldest: "Oldest First",
        newest: "Newest First",
      },
      inputPlaceholder: "Select sorting order",
      showCancelButton: true,
      confirmButtonText: "Sort",
      inputValidator: (value) => {
        if (!value) {
          return "You need to choose a sorting order!";
        }
      },
      ...modalColors,
    }).then((result) => {
      if (result.isConfirmed) {
        let sortedProjects = [...projects];

        if (result.value === "a-z") {
          sortedProjects.sort((a, b) => a.name.localeCompare(b.name));
        } else if (result.value === "z-a") {
          sortedProjects.sort((a, b) => b.name.localeCompare(a.name));
        } else if (result.value === "oldest") {
          sortedProjects.sort(
            (a, b) => new Date(a.created) - new Date(b.created),
          );
        } else if (result.value === "newest") {
          sortedProjects.sort(
            (a, b) => new Date(b.created) - new Date(a.created),
          );
        } else if (result.value === "lastEdited") {
          sortedProjects.sort(
            (a, b) => new Date(b.lastEdited || 0) - new Date(a.lastEdited || 0),
          );
        }

        const query = document.querySelector("input.search").value;

        setProjects(sortedProjects);
        setShown(
          sortedProjects.filter(
            (p) =>
              p?.name?.toLowerCase().includes(query.toLowerCase()) ||
              p?.description?.toLowerCase().includes(query.toLowerCase()),
          ),
        );
      }
    });
  }

  function filter() {
    Swal.fire({
      title: "Filter Projects",
      input: "select",
      inputOptions: {
        none: "Show All",
        public: "Only Public",
        private: "Only Private",
      },
      inputPlaceholder: "Select filter for projects",
      showCancelButton: true,
      confirmButtonText: "Filter",
      inputValidator: (value) => {
        if (!value) {
          return "You need to choose a filter for the projects!";
        }
      },
      ...modalColors,
    }).then((result) => {
      if (result.isConfirmed) {
        let filterProjects = [...projects];

        if (result.value === "public") {
          filterProjects = filterProjects.filter((p) => !p.private);
        } else if (result.value === "private") {
          filterProjects = filterProjects.filter((p) => p.private);
        }

        setShown(filterProjects);
      }
    });
  }

  function search() {
    const query = document.querySelector("input.search").value;

    setShown(
      projects.filter(
        (p) =>
          p?.name?.toLowerCase().includes(query.toLowerCase()) ||
          p?.description?.toLowerCase().includes(query.toLowerCase()),
      ),
    );
  }

  return (
    <>
      <div className="projects-container">
        <div className="head">
          <i className="fa-solid fa-cubes"></i> My Projects
        </div>
        <div className="buttons">
          <Link to="/projects/new">
            <button
            // onClick={() => newProject()}
            >
              <i className="fa-solid fa-plus"></i> New Project
            </button>
          </Link>
          <button onClick={sort}>
            <i className="fa-solid fa-arrow-up-wide-short"></i> Sort Projects
          </button>
          <button onClick={filter}>
            <i className="fa-solid fa-filter"></i> Filter Projects
          </button>
        </div>
        <input
          onChange={search}
          type="search"
          placeholder="Search Projects"
          className="search"
          style={{ marginLeft: "1rem" }}
        />
        {isLoading ? (
          <LoadingAnim />
        ) : (
          <div className="projects">
            {shown.length > 0
              ? shown.map((project, index) => (
                  <PriProject
                    project={project}
                    onDelete={() => {
                      setLoading(true);
                      fetchProjects(user);
                    }}
                    key={index}
                  />
                ))
              : "No projects"}
          </div>
        )}
      </div>
    </>
  );
}
