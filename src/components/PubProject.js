import { Link } from "react-router-dom";
import UserTag from "./UserTag";

export default function PubProject({ project }) {
  if (!project) return;

  return (
    <>
      <div className="pubProject">
        <div className="info">
          <div className="name-container">
            <h1>{project.name}</h1>
            {project.private ? <i class="fa-solid fa-lock"></i> : ""}
          </div>
          <UserTag user={project.owner} />
          <p>{project.description}</p>
        </div>

        <div className="stats">
          <p>{project.likes.length} Likes</p>
          <p>{project.clones.length} Clones</p>
        </div>

        <div className="buttons">
          <Link to={`/@${project.owner.username}/${project._id}`}>
            <button>View</button>
          </Link>
        </div>
      </div>
    </>
  );
}
