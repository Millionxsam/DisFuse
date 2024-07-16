import axios from "axios";
import Swal from "sweetalert2";

const { apiUrl } = require("../config/config.json");

export default function PriProject({ project }) {
  if (!project) return;

  return (
    <>
      <div className="priProject">
        <h1>
          {project.name}
          {project.private ? <i class="fa-solid fa-lock"></i> : ""}
        </h1>
        <p>{project.description || "No description"}</p>
        <div className="buttons">
          <button
            onClick={() =>
              (window.location = `/@${project.owner.username}/${project._id}/workspace`)
            }
          >
            Open
          </button>
          <button onClick={() => deleteProject(project._id)} id="rdbt">
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

function deleteProject(projectId) {
  const token = localStorage.getItem("disfuse-token");

  (async () => {
    let project = (await axios.get(apiUrl + `/projects/${projectId}`)).data;

    Swal.fire({
      title: "Delete Project",
      text: `Are you sure you want to delete "${project.name}"?`,
      icon: "warning",
      footer: "This action is irreversible!",
      confirmButtonColor: "red",
      confirmButtonText: "Delete forever",
      showCancelButton: true,
      focusCancel: true,
    }).then((result) => {
      if (!result.isConfirmed) return;

      axios
        .delete(apiUrl + `/projects/${projectId}`, {
          headers: {
            Authorization: token,
          },
        })
        .then(() => {
          window.location = window.location;
        });
    });
  })();
}
