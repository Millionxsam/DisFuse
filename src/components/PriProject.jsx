import axios from "axios";
import ms from "ms";
import Swal from "sweetalert2";
import modalThemeColor from "../functions/modalThemeColor";
import { userCache } from "../cache.ts";
import { useNavigate } from "react-router-dom";

const modalColors = modalThemeColor(null, true);

import { apiUrl } from "../config/config";

export default function PriProject({
  project,
  onDelete = () => window.location.reload(),
}) {
  const navigate = useNavigate();

  if (!project) return;

  let lastEdited = new Date(project?.lastEdited);

  return (
    <>
      <div className="priProject">
        <div className="top">
          <div className="name-container">
            <h1
              onClick={() =>
                navigate(`/@${project?.owner?.username}/${project?._id}`)
              }
            >
              {project?.bot?.id ? (
                <img
                  src={
                    "https://cdn.discordapp.com/avatars/" +
                    project?.bot?.id +
                    "/" +
                    project?.bot?.avatar +
                    ".png"
                  }
                  alt="Bot avatar"
                />
              ) : (
                <i
                  className="fa-solid fa-circle-exclamation"
                  onClick={(e) => {
                    e.stopPropagation();
                    Swal.fire({
                      title: "Project Setup Incomplete",
                      text: "This project is currently unusable. Open the project for more details.",
                      icon: "warning",
                      ...modalThemeColor(userCache.user),
                    });
                  }}
                ></i>
              )}

              {project.name}
            </h1>

            {project.private && project.botPrivate ? (
              <i className="fa-solid fa-lock" />
            ) : (
              ""
            )}

            {project?.owner?.id === userCache?.user?.id &&
              project?.suspension?.status !== true && (
                <i
                  className="fa-solid fa-pen-to-square"
                  style={{ cursor: "pointer", marginLeft: "auto" }}
                  onClick={() =>
                    navigate(`/@${project.owner.username}/${project._id}/edit`)
                  }
                />
              )}
          </div>
        </div>

        <p>{project.description || "No description"}</p>

        <div className="info">
          {project?.owner?.id === userCache.user.id &&
            project?.lastEdited &&
            lastEdited &&
            lastEdited.getTime() !== 0 && (
              <p>
                Edited{" "}
                {ms(Date.now() - lastEdited.getTime(), {
                  long: true,
                })}{" "}
                ago
              </p>
            )}

          {project?.owner?.id !== userCache.user.id && (
            <p>
              <i className="fa-solid fa-share-from-square"></i> Shared by{" "}
              {project?.owner?.displayName}
            </p>
          )}

          {project?.suspension?.status === true && (
            <p className="suspended">
              Suspended,{" "}
              <span onClick={() => openSuspendedReason(project)}>
                check why
              </span>
            </p>
          )}
        </div>

        <div className="buttons">
          <button
            onClick={() =>
              (window.location = `/@${project.owner.username}/${project._id}/workspace`)
            }
            disabled={project?.suspension?.status === true}
          >
            <i className="fa-solid fa-square-arrow-up-right"></i>
            Open
          </button>
          {project?.owner?.id === userCache.user.id && (
            <button
              onClick={() => deleteProject(project, onDelete)}
              className="red"
            >
              <i className="fa-solid fa-trash"></i>
              Delete
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function deleteProject(project, onDelete) {
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
      .then(() => {
        onDelete();
      });
  });
}

function openSuspendedReason(project) {
  if (project?.suspension?.status !== true) return;

  Swal.fire({
    ...modalThemeColor(userCache.user),
    title: "Project Suspended",
    icon: "error",
    html: `This project was detected to break our terms of service and has been suspended for the following reason:
      <br />
      <br />
      ${project.suspension.reason}`,
    footer:
      '<a rel="noopener" target="_blank" href="https://discord.gg/Xwx4zkQcmJ">Join our Discord for support</a>',
    showConfirmButton: true,
    allowEscapeKey: false,
    allowOutsideClick: false,
  });
}
