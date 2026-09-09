import ms from "ms";
import { useState } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";

import { deleteWebsite } from "../../api/websites";
import { publishedWebsiteUrl } from "../../config/config";
import { websiteUsesDashboard } from "../../functions/websiteTree";
import modalThemeColor from "../../functions/modalThemeColor";
import { userCache } from "../../cache.ts";

const modalColors = modalThemeColor(null, true);

/** Grid card for one website — mirrors PriProject's card on My Projects. */
export default function WebsiteCard({ website, onDelete = () => {} }) {
  const navigate = useNavigate();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!website) return null;

  const lastEdited = new Date(website.lastEdited || 0);
  const pageCount = website.config?.pages?.length || 0;
  const hasDashboard = websiteUsesDashboard(website);
  /* The API returns the canonical address; the local fallback builds the
     same thing from the custom path (or bot ID) it was saved with. */
  const publicUrl = website.url || publishedWebsiteUrl(website);

  /* The project this website was built for. Absent once that project has
     been deleted — the site keeps working, but nothing on Discord does. */
  const project = website.project;
  /* Live, but not linked from DisFuse: `botPrivate` hides the bot's whole
     public face, and its website is part of that. */
  const unlisted = website.published && project?.botPrivate;

  const open = () => navigate(`/websites/${website._id}/editor`);

  const copyLink = () => {
    navigator.clipboard?.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div
      className={`df-project-card df-website-card${website.published ? "" : " draft"}`}
    >
      <div className="card-top">
        {website.bot?.id && website.bot?.avatar && !avatarFailed ? (
          <img
            className="avatar"
            src={`https://cdn.discordapp.com/avatars/${website.bot.id}/${website.bot.avatar}.png`}
            alt=""
            onClick={open}
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="avatar df-website-avatar" onClick={open}>
            <i className="fa-solid fa-globe"></i>
          </div>
        )}

        <div className="title-block">
          <h1 onClick={open}>{website.name}</h1>

          <div className="badges">
            <span
              className={`badge ${website.published ? "published" : "draft"}`}
            >
              <i
                className={`fa-solid ${
                  website.published ? "fa-circle-check" : "fa-pen-ruler"
                }`}
              ></i>
              {website.published ? "Published" : "Draft"}
            </span>
            {hasDashboard && (
              <span className="badge dashboard">
                <i className="fa-solid fa-sliders"></i> Dashboard
              </span>
            )}
            {unlisted && (
              <span
                className="badge private"
                title="Your bot's visibility is private, so this website isn't linked from your project. It's still live for anyone with the link."
              >
                <i className="fa-solid fa-eye-slash"></i> Unlisted
              </span>
            )}
          </div>
        </div>

        {website.published && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Visit published website"
          >
            <i className="fa-solid fa-arrow-up-right-from-square card-edit" />
          </a>
        )}
      </div>

      <p className="description">
        {website.config?.seo?.description || "No description"}
      </p>

      <div className="stat-row">
        <span className="stat-chip">
          <i className="fa-solid fa-file-lines"></i> {pageCount} page
          {pageCount === 1 ? "" : "s"}
        </span>
        {project ? (
          <Link
            className="stat-chip"
            to={`/@${project.owner?.username}/${project._id}`}
            title={`Open the project — bot ${website.botID}`}
          >
            <i className="fa-solid fa-cubes"></i> {project.name}
          </Link>
        ) : (
          <span
            className="stat-chip"
            title="This website is no longer linked to a project, so its dashboard controls can't reach Discord."
          >
            <i className="fa-solid fa-link-slash"></i> {website.botID}
          </span>
        )}
        <button
          className="stat-chip"
          title={publicUrl}
          onClick={copyLink}
          type="button"
        >
          <i className={`fa-solid ${copied ? "fa-check" : "fa-link"}`}></i>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      {lastEdited.getTime() !== 0 && (
        <p className="meta">
          Edited{" "}
          {ms(Math.max(Date.now() - lastEdited.getTime(), 1000), {
            long: true,
          })}{" "}
          ago
        </p>
      )}

      <div className="card-buttons">
        <button className="primary" onClick={open}>
          <i className="fa-solid fa-pen-ruler"></i>
          Open builder
        </button>
        <button
          className="red"
          onClick={() => confirmDelete(website, onDelete)}
        >
          <i className="fa-solid fa-trash"></i>
          Delete
        </button>
      </div>
    </div>
  );
}

function confirmDelete(website, onDelete) {
  Swal.fire({
    title: "Delete Website",
    text: `Are you sure you want to delete "${website.name}"?`,
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

    deleteWebsite(website._id)
      .then(() => onDelete())
      .catch((err) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error Deleting Website",
          text:
            err.response?.data?.error ||
            "An error occurred while deleting the website. Please try again.",
          ...modalThemeColor(userCache.user),
        });
      });
  });
}
