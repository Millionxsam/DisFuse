import { Link } from "react-router-dom";
import UserTag from "./UserTag";
import { userCache } from "../cache.ts";

export default function PubProject({ project }) {
  if (!project) return;

  const hiddenFromViewer =
    project.private &&
    project.botPrivate &&
    project.owner !== userCache?.user?._id &&
    project.collaborators?.includes(userCache?.user?._id);

  const canAddBot = project?.bot?.id && !project.botPrivate;

  /* The bot's website, if it has one worth linking to. The API applies
     the rule — a website is only advertised when the bot is public and
     the site is published.

     `published` is only ever set on the owner's own copy, which is the
     one case this listing can hand back a website nobody can visit yet:
     an owner browsing Explore sees their own drafts. */
  const website =
    project.website?.url && project.website.published !== false
      ? project.website
      : null;

  return (
    <div className="df-project-card">
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
          />
        ) : (
          <div className="avatar-fallback">
            <i className="fa-solid fa-robot"></i>
          </div>
        )}

        <div className="title-block">
          <h3>
            {project.private && project.botPrivate && (
              <i className="fa-solid fa-lock title-lock" title="Private"></i>
            )}
            {project.name}
          </h3>
          <div className="badges">
            {hiddenFromViewer && (
              <span className="badge">Only visible to staff</span>
            )}
          </div>
        </div>
      </div>

      <div className="owner-row">
        <UserTag user={project.owner} />
        {project.collaborators?.length ? (
          <span>{project.collaborators.length} more</span>
        ) : (
          ""
        )}
      </div>

      <p className="description">{project.description}</p>

      <div className="stat-row">
        <span className="stat-chip">
          <i className="fa-solid fa-heart"></i> {project.likes.length}
        </span>
        <span className="stat-chip">
          <i className="fa-solid fa-code-fork"></i> {project.clones.length}
        </span>
      </div>

      <div className="card-buttons">
        <Link to={`/@${project.owner.username}/${project._id}`}>
          <button className="primary">
            <i className="fa-solid fa-eye"></i> View
          </button>
        </Link>
        {canAddBot && (
          <Link
            target="_blank"
            rel="noopener"
            to={`https://discord.com/oauth2/authorize?client_id=${project.bot?.id}&scope=bot&permissions=${project.permissions || 0}`}
          >
            <button>
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Add Bot
            </button>
          </Link>
        )}
        {website && (
          <Link
            target="_blank"
            rel="noopener"
            to={website.url}
            title={website.name}
          >
            <button className="website">
              <i className="fa-solid fa-globe"></i> Website
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
