import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PriProject from "../../components/PriProject";

const { discordUrl, apiUrl } = require("../../config/config.json");

export default function Projects() {
  const token = localStorage.getItem("disfuse-token");
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState({});

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
          .get(apiUrl + `/users/${data.id}/projects`)
          .then(({ data: p }) => setProjects(p));
      });
  }, [token]);

  function newProject() {
    const Queue = Swal.mixin({
      progressSteps: ["1", "2", "3"],
      animation: false,
      confirmButtonText: "Next >",
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
          if (i.length >= 3) return false;
          else return "The name must be at least 3 characters";
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
      }).then((result) => {
        if (result.isConfirmed) dsc = result.value;
        else cancelled = true;
      });

      if (cancelled) return;

      await Queue.fire({
        title: "Project Visibility",
        currentProgressStep: 2,
        showCancelButton: true,
        confirmButtonText: "Create",
        input: "select",
        inputOptions: {
          public: "Public",
          private: "Private",
        },
      }).then((result) => {
        if (result.isConfirmed) isPrivate = result.value === "private";
        else cancelled = true;
      });

      if (cancelled) return;

      axios
        .post(
          apiUrl + `/projects/${user.id}`,
          {
            project: {
              name,
              description: dsc,
              private: isPrivate,
            },
          },
          {
            headers: {
              Authorization: token,
            },
          }
        )
        .then(({ data }) => (window.location = `/workspace/${data._id}`));
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
            if (i.length >= 3) return false;
            else return "The name must be at least 3 characters";
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
        }).then((result) => {
          if (result.isConfirmed) dsc = result.value;
          else cancelled = true;
        });

        if (cancelled) return;

        await Queue.fire({
          title: "Project Visibility",
          currentProgressStep: 2,
          showCancelButton: true,
          confirmButtonText: "Create",
          input: "select",
          inputOptions: {
            public: "Public",
            private: "Private",
          },
        }).then((result) => {
          if (result.isConfirmed) isPrivate = result.value === "private";
          else cancelled = true;
        });

        if (cancelled) return;

        axios
          .post(
            apiUrl + `/projects/${user.id}`,
            {
              project: {
                name,
                description: dsc,
                private: isPrivate,
                data,
              },
            },
            {
              headers: {
                Authorization: token,
              },
            }
          )
          .then(({ data }) => (window.location = `/workspace/${data._id}`));
      };

      reader.readAsText(file);
    });

    fileInput.click();
    fileInput.remove();
  }

  return (
    <>
      <div className="projects-container">
        <div className="nametag">
          Hello,
          <img
            src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.webp?size=32`}
            alt=""
          />
          <div>{user?.username}</div>
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
        </div>
        <div className="projects">
          {projects.length > 0
            ? projects.map((project) => <PriProject project={project} />)
            : "No projects"}
        </div>
      </div>
    </>
  );
}
