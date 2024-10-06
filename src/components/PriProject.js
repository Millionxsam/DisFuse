import axios from "axios";
import ms from "ms";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

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
            {project.private ? <i class="fa-solid fa-lock"></i> : ""}
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
