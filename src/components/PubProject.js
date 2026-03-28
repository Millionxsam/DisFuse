import { Link } from "react-router-dom";
import UserTag from "./UserTag";
import { userCache } from "../cache.ts";

export default function PubProject({ project }) {
  if (!project) return;

  return (
    <>
      <div className="pubProject">
        <div className="info">
          <div className="name-container">
            <h1>
              {!project.botPrivate ? (
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
                ""
              )}
              {project.name}
            </h1>
            {project.private && project.botPrivate ? (
              <i className="fa-solid fa-lock"></i>
            ) : (
              ""
            )}
          </div>
          {project.private &&
          project.botPrivate &&
          project.owner !== userCache?.user._id ? (
            <i style={{ opacity: ".5" }}>Only visible to staff</i>
          ) : (
            ""
          )}
          <div className="owner">
            <UserTag user={project.owner} />
            {project.collaborators?.length ? (
              <i>{project.collaborators.length} more</i>
            ) : (
              ""
            )}
          </div>
          <p>{project.description}</p>
        </div>

        <div className="stats">
          <p>{project.likes.length} Likes</p>
          <p>{project.clones.length} Clones</p>
        </div>

        {!project.private && project.botPrivate ? (
          <div className="buttons">
            <Link to={`/@${project.owner.username}/${project._id}`}>
              <button style={{ borderRadius: "var(--button-radius)" }}>
                <i className="fa-solid fa-eye"></i> View
              </button>
            </Link>
          </div>
        ) : (
          <div className="buttons">
            <Link to={`/@${project.owner.username}/${project._id}`}>
              <button>
                <i className="fa-solid fa-eye"></i> View
              </button>
            </Link>
            <Link
              target="_blank"
              rel="noopener"
              to={`https://discord.com/oauth2/authorize?client_id=${project.bot?.id}&scope=bot&permissions=${project.permissions || 0}`}
            >
              <button>
                <i className="fa-solid fa-arrow-up-right-from-square"></i> Add
                Bot
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
