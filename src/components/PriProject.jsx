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
  const isOwner = project?.owner?.id === userCache?.user?.id;
  const isSuspended = project?.suspension?.status === true;
  const hasEdited = project?.lastEdited && lastEdited.getTime() !== 0;

  /* The project's website. The owner's copy carries the website's id, so
     their card opens the builder; a collaborator only ever gets one that
     is published and public, and theirs opens the live site. */
  const website = project?.website;
  const websiteLink = website?._id
    ? `/websites/${website._id}/editor`
    : website?.url || null;

  return (
    <div className={`df-project-card${isSuspended ? " suspended" : ""}`}>
      {project.type === "builder" && (
        <div className="builder-ribbon" title="Built with DisFuse Builder">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
        </div>
      )}

      <div className="card-top">
        {project?.bot?.id ? (
          <img
            className="avatar"
            src={
              "https://cdn.discordapp.com/avatars/" +
              project?.bot?.id +
              "/" +
              project?.bot?.avatar +
              ".png"
            }
            alt=""
            onClick={() =>
              navigate(`/@${project?.owner?.username}/${project?._id}`)
            }
          />
        ) : (
          <div
            className="avatar-fallback"
            onClick={(e) => {
              e.stopPropagation();
              Swal.fire({
                title: "Project Setup Incomplete",
                text: "This project is currently unusable. Open the project for more details.",
                icon: "warning",
                ...modalThemeColor(userCache.user),
              });
            }}
          >
            <i className="fa-solid fa-circle-exclamation"></i>
          </div>
        )}

        <div className="title-block">
          <h1
            onClick={() =>
              navigate(`/@${project?.owner?.username}/${project?._id}`)
            }
          >
            {project.private && project.botPrivate && (
              <i className="fa-solid fa-lock title-lock" title="Private"></i>
            )}
            {project.name}
          </h1>

          <div className="badges">
            {websiteLink && (
              <span
                className="badge website"
                title={
                  website.published === false
                    ? `${website.name} — not published yet`
                    : website.name
                }
                onClick={() => openWebsite(navigate, websiteLink)}
              >
                <i
                  className={`fa-solid ${
                    website.published === false ? "fa-pen-ruler" : "fa-globe"
                  }`}
                ></i>{" "}
                {website.published === false ? "Website draft" : "Website"}
              </span>
            )}
            {isSuspended && (
              <span
                className="badge suspended"
                onClick={() => openSuspendedReason(project)}
              >
                <i className="fa-solid fa-triangle-exclamation"></i> Suspended
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="description">{project.description || "No description"}</p>

      {isOwner && (hasEdited || !isSuspended) && (
        <p className="meta">
          {hasEdited &&
            `Edited ${ms(Date.now() - lastEdited.getTime(), { long: true })} ago`}
          {!isSuspended && (
            <i
              className="fa-solid fa-pen-to-square card-edit"
              title="Edit project"
              onClick={() =>
                navigate(`/@${project.owner.username}/${project._id}/edit`)
              }
            />
          )}
        </p>
      )}

      {!isOwner && (
        <p className="meta">
          <i className="fa-solid fa-share-from-square"></i> Shared by{" "}
          {project?.owner?.displayName}
        </p>
      )}

      <div className="card-buttons">
        <button
          className="primary"
          onClick={() =>
            (window.location = `/@${project.owner.username}/${project._id}/workspace`)
          }
          disabled={isSuspended}
        >
          <i className="fa-solid fa-square-arrow-up-right"></i>
          Open
        </button>
        {isOwner && (
          <button
            onClick={() => deleteProject(project, onDelete, website)}
            className="red"
          >
            <i className="fa-solid fa-trash"></i>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/** Opens a website link, which may be a DisFuse page or the live site. */
function openWebsite(navigate, link) {
  if (!link) return;
  if (link.startsWith("/")) return navigate(link);

  window.open(link, "_blank", "noopener");
}

function deleteProject(project, onDelete, website) {
  const token = localStorage.getItem("disfuse-token");

  Swal.fire({
    title: "Delete Project",
    text: `Are you sure you want to delete "${project.name}"?`,
    icon: "warning",
    /* Deleting the project does not delete its website — a published site
       stays up rather than disappearing on its visitors — but it takes
       away the bot token behind it, which is what every dashboard control
       on that site runs on. */
    footer: website
      ? `"${website.name}" stays online, but its dashboard settings stop working without this project's bot token. This action is irreversible!`
      : "This action is irreversible!",
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
