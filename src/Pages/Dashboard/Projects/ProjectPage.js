import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import UserTag from "../../../components/UserTag";
import Comment from "../../../components/Comment";
import LoadingAnim from "../../../components/LoadingAnim";

const { apiUrl, discordUrl } = require("../../../config/config.js");

export default function ProjectPage() {
  const [project, setProject] = useState({});
  const [user, setUser] = useState({});
  const [comments, setComments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [newLike, setNewLike] = useState(false);
  const [newFav, setNewFav] = useState(false);
  const [isLoading, setLoading] = useState(true);

  const navigate = useNavigate();

  const { projectId } = useParams();

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        axios
          .get(apiUrl + "/users/" + data.id, {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          })
          .then(({ data: user }) => {
            setUser(user);

            axios
              .get(apiUrl + `/projects/${projectId}`, {
                headers: {
                  Authorization: localStorage.getItem("disfuse-token"),
                },
              })
              .then(async ({ data: project }) => {
                setProject(project);

                axios.get(apiUrl + "/users").then(({ data }) => {
                  setAllUsers(data);

                  axios
                    .get(apiUrl + `/comments/${projectId}`)
                    .then(({ data }) => {
                      setComments(data);
                      setLoading(false);
                    });
                });
              })
              .catch(() => (window.location = "/explore"));
          });
      });
  }, [projectId]);

  if (!project) return (window.location = "/explore");

  var likeButtonEnabled = true;
  function toggleLike() {
    if (!likeButtonEnabled) return;
    if (!project.name) return;

    likeButtonEnabled = false;
    setTimeout(() => (likeButtonEnabled = true), 700);

    axios
      .patch(apiUrl + `/projects/${project._id}/likes`, null, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        if (data.likes.includes(user.id)) setNewLike(true);
        setProject(data);
      });
  }

  var favButtonEnabled = true;
  function toggleFav(favId) {
    if (!favButtonEnabled) return;
    if (!project.name) return;

    favButtonEnabled = false;
    setTimeout(() => (favButtonEnabled = true), 700);

    axios
      .patch(
        apiUrl + `/users/${user.id}/favorites`,
        { favId },
        {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        },
      )
      .then(({ data }) => {
        if (data.favorites.includes(favId)) setNewFav(true);
        setUser(data);
      });
  }

  function postComment() {
    if (!project.name) return;

    const content = document
      .querySelector("textarea.commentInput")
      .value.trim();

    if (content === "" || !content) return;

    document.querySelector("textarea.commentInput").value = "";

    axios
      .post(
        apiUrl + `/comments/${project._id}`,
        {
          content,
        },
        {
          headers: { Authorization: localStorage.getItem("disfuse-token") },
        },
      )
      .then(({ data }) => {
        window.location.hash = data._id;
        window.location.reload();
      });
  }

  return (
    <div className="project-page-container">
      <div className="head">
        <div className="info">
          <h1
            className={project.owner?.id === user?.id ? "editable" : ""}
            onClick={
              project.owner?.id === user?.id
                ? () =>
                    navigate(`/@${project.owner.username}/${project._id}/edit`)
                : null
            }
          >
            {!isLoading &&
            project?.bot?.avatar &&
            (!project.botPrivate || project.owner?.id === user?.id) ? (
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
            {isLoading ? <LoadingAnim /> : project.name}
            {project?.private && project?.botPrivate ? (
              <i class="fa-solid fa-lock"></i>
            ) : (
              ""
            )}
          </h1>
          <div className="owner">
            {isLoading ? (
              ""
            ) : (
              <>
                <UserTag user={project.owner} />
                {project.collaborators?.length ? (
                  <i>and {project.collaborators.length} more</i>
                ) : (
                  ""
                )}
              </>
            )}
          </div>
          <p>{project.description}</p>
          {(project?.private || project?.botPrivate) &&
          project?.owner?.id === user?.id ? (
            <i style={{ opacity: ".5", marginTop: "1rem" }}>
              One or more option(s) below will not be visible to other users due
              to visibility settings
            </i>
          ) : (
            ""
          )}
        </div>
        <div
          className="buttons"
          style={
            isLoading
              ? { pointerEvents: "none", opacity: 0.5 }
              : {
                  marginTop:
                    project?.private || project?.botPrivate ? "-1rem" : "0",
                }
          }
        >
          {project?.bot?.id &&
          (!project.botPrivate || project?.owner?.id === user?.id) ? (
            <Link
              to={`https://discord.com/oauth2/authorize?client_id=${project.bot?.id}&scope=bot&permissions=${project.permissions || 0}`}
              target="_blank"
              rel="noopener"
            >
              <div className="darkBtn">
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                <div>Add Bot</div>
              </div>
            </Link>
          ) : (
            ""
          )}
          {!project.private || project?.owner?.id === user?.id ? (
            <Link to={`/@${project.owner?.username}/${project._id}/view`}>
              <div className="darkBtn">
                <i className="fa-solid fa-eye"></i>
                <div>View</div>
              </div>
            </Link>
          ) : (
            ""
          )}

          <div
            onClick={toggleLike}
            className={`darkBtn like${
              project.likes?.includes(user.id) ? " active" : ""
            }${newLike ? " newLike" : ""}`}
          >
            <i className="fa-solid fa-heart"></i>
            <div>{project.likes?.length} Likes</div>
          </div>

          {!project.private || project?.owner?.id === user?.id ? (
            <div
              onClick={() =>
                navigate(`/@${project.owner.username}/${project._id}/clone`)
              }
              className="darkBtn clone"
            >
              <i className="fa-solid fa-clone"></i>
              <div>{project.clones?.length} Clones</div>
            </div>
          ) : (
            ""
          )}

          <div
            onClick={() => toggleFav(projectId)}
            className={`darkBtn fav${
              user.favorites?.includes(projectId) ? " active" : ""
            }${newFav ? " newFav" : ""}`}
          >
            <i className="fa-solid fa-star"></i>
            <div>
              {user.favorites?.includes(projectId) ? "Unfavorite" : "Favorite"}
            </div>
          </div>
        </div>
      </div>
      {project?.collaborators?.length ? (
        <>
          <h1>Collaborators</h1>
          <ul className="collaborators">
            {[project.owner?.id, ...project.collaborators].map((id) => (
              <UserTag userId={id} />
            ))}
          </ul>
        </>
      ) : (
        ""
      )}
      <h1>Comments</h1>
      <div className="addComment">
        <textarea
          placeholder="Add a comment..."
          className="commentInput"
        ></textarea>
        <button onClick={postComment} className="postBtn">
          Post
        </button>
      </div>
      <div className="body">
        {comments.map((comment, i) => (
          <Comment
            comment={comment}
            project={project}
            user={user}
            allUsers={allUsers}
            repliable={true}
            index={i}
            key={i}
          />
        ))}
      </div>
    </div>
  );
}
