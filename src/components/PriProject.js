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
            <div><i class="fa-solid fa-pen-to-square" onClick={() => editProject(project)}></i></div>
            <h1>{project.name}</h1>
            {project.private ? <div><i class="fa-solid fa-lock"></i></div> : ""}
          </div>
          <i>
            {project?.lastEdited && lastEdited && lastEdited.getTime() != 0 ? (
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
            Open
          </button>
          <button onClick={() => deleteProject(project)} id="red">
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
      title: "Enter your new project name",
      input: "text",
      inputPlaceholder: "DisFuse Project",
      inputValue: project.name,
      showCancelButton: true,
      animation: true,
      inputValidator: (i) => {
        if (i.length < 3) return "The name must be at least 2 characters";
        if (i.length > 12) return "The name must be below 12 characters";
        return false;
      },
      currentProgressStep: 0,
    }).then((result) => {
      if (result.isConfirmed) name = result.value;
      else cancelled = true;
    });

    if (cancelled) return;

    await Queue.fire({
      title: "Enter the new description (optional)",
      currentProgressStep: 1,
      input: "text",
      showCancelButton: true,
      inputPlaceholder: "Some description",
      inputValue: project.description,
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
      title: "Change project visibility",
      currentProgressStep: 2,
      showCancelButton: true,
      confirmButtonText: "Edit",
      input: "select",
      inputOptions: {
        private: "Private",
        public: "Public",
      },
      inputValue: project.private ? "private" : "public"
    }).then((result) => {
      if (result.isConfirmed) isPrivate = result.value === "private";
      else cancelled = true;
    });

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
      .then(
        () => window.location.reload()
      );
  })();
}
