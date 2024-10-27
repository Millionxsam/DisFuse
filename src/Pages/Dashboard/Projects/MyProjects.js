import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PriProject from "../../../components/PriProject";
import LoadingAnim from "../../../components/LoadingAnim";
import modalThemeColor from "../../../functions/modalThemeColor";

const { discordUrl, apiUrl } = require("../../../config/config.json");

const modalColors = modalThemeColor(null, true);

export default function MyProjects() {
  const token = localStorage.getItem("disfuse-token");
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);
  const [user, setUser] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: token,
        },
      })
      .then(({ data }) => {
        setUser(data);
        axios
          .get(apiUrl + `/users/${data.id}/projects`, {
            headers: { Authorization: localStorage.getItem("disfuse-token") },
          })
          .then(({ data: p }) => {
            setProjects(
              p.sort(
                (a, b) =>
                  new Date(b.lastEdited || 0) - new Date(a.lastEdited || 0)
              )
            );
            setShown(p);
            setLoading(false);
          });
      });
  }, [token]);

  function newProject() {
    const Queue = Swal.mixin({
      progressSteps: ["1", "2", "3"],
      animation: false,
      confirmButtonText: "Next >",
      ...modalColors,
    });

    (async () => {
      let name, dsc, isPrivate;
      let cancelled = false;

      await Queue.fire({
        title: "Enter your project name",
        input: "text",
        inputPlaceholder: "DisFuse Project",
        showCancelButton: true,
        inputValidator: (i) => {
          if (i.length < 3) return "The name must be at least 2 characters";
          if (i.length > 12) return "The name must be below 12 characters";
          return false;
        },
        animation: true,
        currentProgressStep: 0,
      }).then((result) => {
        if (result.isConfirmed) name = result.value;
        else cancelled = true;
      });

      if (cancelled) return;

      await Queue.fire({
        title: "Enter the description (optional)",
        currentProgressStep: 1,
        input: "text",
        showCancelButton: true,
        inputPlaceholder: "Some description",
        inputValidator: (i) => {
          if (i.length > 500) return "The description must be below 500 characters";
          else return false;
        },
      }).then((result) => {
        if (result.isConfirmed) dsc = result.value;
        else cancelled = true;
      });

      if (cancelled) return;

      await Queue.fire({
        title: "Project visibility",
        currentProgressStep: 2,
        showCancelButton: true,
        confirmButtonText: "Create",
        input: "select",
        inputOptions: {
          private: "Private",
          public: "Public",
        },
      }).then((result) => {
        if (result.isConfirmed) isPrivate = result.value === "private";
        else cancelled = true;
      });

      if (cancelled) return;

      axios
        .post(
          apiUrl + `/projects`,
          {
            name,
            description: dsc,
            private: isPrivate,
          },
          {
            headers: {
              Authorization: token,
            },
          }
        )
        .then(
          ({ data }) =>
            (window.location = `/@${user.username}/${data._id}/workspace`)
        );
    })();
  }

  function loadFile() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".df";

    fileInput.addEventListener("change", (e) => {
      let file = e.target.files[0];
      if (!file) return;

      let reader = new FileReader();

      reader.onload = async (event) => {
        let data = event.target.result;

        const Queue = Swal.mixin({
          progressSteps: ["1", "2", "3"],
          animation: false,
          confirmButtonText: "Next >",
          ...modalColors,
        });

        let name, dsc, isPrivate;
        let cancelled = false;

        await Queue.fire({
          title: "Enter your project name",
          input: "text",
          inputValue: file.name.replace(".df", ""),
          showCancelButton: true,
          inputPlaceholder: "DisFuse Project",
          inputValidator: (i) => {
            if (i.length < 3) return "The name must be at least 2 characters";
            if (i.length > 12) return "The name must be below 12 characters";
            return false;
          },
          animation: true,
          currentProgressStep: 0,
        }).then((result) => {
          if (result.isConfirmed) name = result.value;
          else cancelled = true;
        });

        if (cancelled) return;

        await Queue.fire({
          title: "Enter the description (optional)",
          currentProgressStep: 1,
          showCancelButton: true,
          input: "text",
          inputPlaceholder: "Some description",
          inputValidator: (i) => {
            if (i.length > 500) return "The description must be below 500 characters";
            else return false;
          },
        }).then((result) => {
          if (result.isConfirmed) dsc = result.value;
          else cancelled = true;
        });

        if (cancelled) return;

        await Queue.fire({
          title: "Project visibility",
          currentProgressStep: 2,
          showCancelButton: true,
          confirmButtonText: "Create",
          input: "select",
          inputOptions: {
            private: "Private",
            public: "Public",
          },
        }).then((result) => {
          if (result.isConfirmed) isPrivate = result.value === "private";
          else cancelled = true;
        });

        if (cancelled) return;

        axios
          .post(
            apiUrl + `/projects`,
            {
              name,
              description: dsc,
              private: isPrivate,
              data,
            },
            {
              headers: {
                Authorization: token,
              },
            }
          )
          .then(
            ({ data }) =>
              (window.location = `/@${user.username}/${data._id}/workspace`)
          );
      };

      reader.readAsText(file);
    });

    fileInput.click();
    fileInput.remove();
  }

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
        let sortedProjects = projects;

        if (result.value === "a-z") {
          sortedProjects.sort((a, b) => a.name.localeCompare(b.name));
        } else if (result.value === "z-a") {
          sortedProjects.sort((a, b) => b.name.localeCompare(a.name));
        } else if (result.value === "oldest") {
          sortedProjects.sort(
            (a, b) => new Date(a.created) - new Date(b.created)
          );
        } else if (result.value === "newest") {
          sortedProjects.sort(
            (a, b) => new Date(b.created) - new Date(a.created)
          );
        } else if (result.value === "lastEdited") {
          sortedProjects.sort(
            (a, b) => new Date(b.lastEdited || 0) - new Date(a.lastEdited || 0)
          );
        }

        const query = document.querySelector("input.search").value;

        setProjects(sortedProjects);
        setShown(
          sortedProjects.filter(
            (p) =>
              p?.name?.toLowerCase().includes(query.toLowerCase()) ||
              p?.description?.toLowerCase().includes(query.toLowerCase())
          )
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
          p?.description?.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  return (
    <>
      <div className="projects-container">
        <div className="nametag">
          <img
            src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.webp?size=32`}
            alt=""
          />
          Hello,
          <div>{user?.global_name || user?.username}</div>
        </div>
        <div className="head">
          <i class="fa-solid fa-cubes"></i> My Projects
        </div>
        <div className="buttons">
          <button onClick={newProject}>
            <i class="fa-solid fa-plus"></i> New Project
          </button>
          <button onClick={loadFile}>
            <i class="fa-solid fa-upload"></i> Load from file
          </button>
          <button onClick={sort}>
            <i class="fa-solid fa-arrow-up-wide-short"></i> Sort Projects
          </button>
          <button onClick={filter}>
            <i class="fa-solid fa-filter"></i> Filter Projects
          </button>
        </div>
        <input
          onChange={search}
          type="search"
          placeholder="Search Projects"
          className="search"
          style={{ marginLeft: "1rem" }}
        />
        {isLoading ? <LoadingAnim /> : ""}
        <div className="projects">
          {shown.length > 0
            ? shown.map((project) => <PriProject project={project} />)
            : !isLoading
              ? "No projects"
              : ""}
        </div>
      </div>
    </>
  );
}
