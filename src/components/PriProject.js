import axios from "axios";
import ms from "ms";
import Swal from "sweetalert2";
import modalThemeColor from "../functions/modalThemeColor";

const modalColors = modalThemeColor(null, true);

const { apiUrl } = require("../config/config.json");

export default function PriProject({ project }) {
  if (!project) return;

  let lastEdited = new Date(project?.lastEdited);

  return (
    <>
      <div className="priProject">
        <div className="top">
          <div className="name-container">
            <h1>{project.name}</h1>

            {project.private && <i className="fa-solid fa-lock" />}
            <i
              className="fa-solid fa-pen-to-square"
              style={{ cursor: "pointer", marginLeft: "auto" }}
              onClick={() => editProject(project)}
            />
          </div>
          <i>
            {project?.lastEdited && lastEdited && lastEdited.getTime() !== 0 ? (
              <>
                Edited{" "}
                {ms(Date.now() - lastEdited.getTime(), {
                  long: true,
                })}{" "}
                ago
              </>
            ) : (
              ""
            )}
          </i>
        </div>
        <p>{project.description || "No description"}</p>
        <div className="buttons">
          <button
            onClick={() =>
              (window.location = `/@${project.owner.username}/${project._id}/workspace`)
            }
          >
            <i className="fa-solid fa-square-arrow-up-right"></i>
            Open
          </button>
          <button onClick={() => deleteProject(project)} id="red">
            <i className="fa-solid fa-trash"></i>
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

function deleteProject(project) {
  const token = localStorage.getItem("disfuse-token");

  Swal.fire({
    title: "Delete Project",
    text: `Are you sure you want to delete "${project.name}"?`,
    icon: "warning",
    footer: "This action is irreversible!",
    confirmButtonColor: "red",
    confirmButtonText: "Delete forever",
    showCancelButton: true,
    focusCancel: true,
    animation: true,
    ...modalColors,
  }).then((result) => {
    if (!result.isConfirmed) return;

    axios
      .delete(apiUrl + `/projects/${project._id}`, {
        headers: {
          Authorization: token,
        },
      })
      .then(() => window.location.reload());
  });
}

function editProject(project) {
  const token = localStorage.getItem("disfuse-token");

  (async () => {
    let name = project.name;
    let dsc = project.description;
    let isPrivate = project.private;
    let cancelled = false;

    const editChoice = await Swal.fire({
      title: "What do you want to edit?",
      html: `
        <div style="text-align: left; justify-self: center;">
          <input type="checkbox" id="name" value="Project Name">
          <label for="name"> Project Name</label><br>
          <input type="checkbox" id="description" value="Project Description">
          <label for="description"> Project Description</label><br>
          <input type="checkbox" id="visibility" value="Visibility">
          <label for="visibility"> Visibility</label>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Edit selected",
      animation: true,
      ...modalColors,
      preConfirm: () => {
        const selected = [];
        if (document.getElementById("name").checked) selected.push("name");
        if (document.getElementById("description").checked)
          selected.push("description");
        if (document.getElementById("visibility").checked)
          selected.push("visibility");
        return selected;
      },
    });

    if (!editChoice.isConfirmed || editChoice.value?.length < 1) return;

    const sequence = ["name", "description", "visibility"].filter((i) =>
      editChoice.value.includes(i)
    );
    const steps = sequence.map((_, i) => (i + 1).toString());

    for (let i = 0; i < sequence.length; i++) {
      const currentField = sequence[i];

      const isLastStep = i === sequence.length - 1;
      const confirmText = isLastStep ? "Finish" : "Next >";

      const commonOptions = {
        showCancelButton: true,
        currentProgressStep: i,
        progressSteps: steps,
        confirmButtonText: confirmText,
        animation: true,
        ...modalColors,
      };

      if (currentField === "name") {
        const result = await Swal.fire({
          title: "Enter your new project name",
          input: "text",
          inputPlaceholder: "DisFuse Project",
          inputValue: name,
          inputValidator: (i) => {
            if (i.length < 3) return "The name must be at least 2 characters";
            if (i.length > 18) return "The name must be below 18 characters";
            return null;
          },
          ...commonOptions,
          ...modalColors,
        });

        if (!result.isConfirmed) {
          cancelled = true;
          break;
        }
        name = result.value;
      } else if (currentField === "description") {
        const result = await Swal.fire({
          title: "Enter the new description",
          input: "text",
          inputPlaceholder: "Some description",
          inputValue: dsc,
          inputValidator: (i) => {
            if (i.length > 500)
              return "The description must be below 500 characters";
            return null;
          },
          ...commonOptions,
          ...modalColors,
        });

        if (!result.isConfirmed) {
          cancelled = true;
          break;
        }
        dsc = result.value;
      } else if (currentField === "visibility") {
        const result = await Swal.fire({
          title: "Change project visibility",
          input: "select",
          inputOptions: {
            private: "Private",
            public: "Public",
          },
          inputValue: isPrivate ? "private" : "public",
          ...commonOptions,
          ...modalColors,
        });

        if (!result.isConfirmed) {
          cancelled = true;
          break;
        }
        isPrivate = result.value === "private";
      }
    }

    if (cancelled) return;

    axios
      .patch(
        apiUrl + `/projects/${project._id}`,
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
      .then(() => window.location.reload());
  })();
}
