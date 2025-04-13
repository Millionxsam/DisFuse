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
            <h1>{project.name}</h1>
            {project.private ? <i className="fa-solid fa-lock"></i> : ""}
          </div>
          {project.private && project.owner !== userCache?.user._id ? (
            <i style={{ opacity: ".5" }}>Only visible to staff</i>
          ) : (
            ""
          )}
          <UserTag user={project.owner} />
          <p>{project.description}</p>
        </div>

        <div className="stats">
          <p>{project.likes.length} Likes</p>
          <p>{project.clones.length} Clones</p>
        </div>

        <div className="buttons">
          <Link to={`/@${project.owner.username}/${project._id}`}>
            <button>
              <i class="fa-solid fa-eye"></i> View
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
