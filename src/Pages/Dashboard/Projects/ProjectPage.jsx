import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import UserTag from "../../../components/UserTag";
import Comment from "../../../components/Comment";
import LoadingAnim from "../../../components/LoadingAnim";

import api, { authToken, data } from "../../../api/client.js";
import { apiUrl, discordUrl } from "../../../config/config.js";

/* `GET /users` takes at most 100 ids at a time. */
const ID_BATCH = 100;

/**
 * The people who wrote a project's comments and replies.
 *
 * `GET /users` is authenticated and no longer returns the whole user
 * collection, so ask it for exactly the authors shown on this page.
 */
async function fetchCommentAuthors(comments) {
  const ids = [
    ...new Set(
      comments.flatMap((comment) => [
        comment.authorId,
        ...(comment.replies?.map((reply) => reply.authorId) ?? []),
      ]),
    ),
  ].filter(Boolean);

  const batches = [];
  for (let i = 0; i < ids.length; i += ID_BATCH)
    batches.push(ids.slice(i, i + ID_BATCH));

  const found = await Promise.all(
    batches.map((batch) =>
      api.get("/users", { params: { ids: batch.join(",") } }).then(data),
    ),
  );

  return found.flat();
}

/**
 * Why the owner's website isn't linked from their own project page.
 *
 * Only the owner is ever sent a website that isn't being advertised, so
 * this is the one place that has a `hidden` reason to explain. None of
 * these stop the website itself working: it stays live at its own
 * address whatever this says.
 */
function websiteVisibilityNote(website) {
  if (!website || website.listed !== false) return null;

  switch (website.hidden) {
    case "draft":
      return "Your website isn't published yet, so it isn't shown here to anyone else.";
    case "botPrivate":
      return "Your bot's visibility is private, so your website isn't shown here or on your project card. It's still live for anyone with the link.";
    case "suspended":
      return "This project is suspended, so its website isn't linked from DisFuse.";
    default:
      return null;
  }
}

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
    async function fetchData() {
      const { data: discordUser } = await axios.get(discordUrl + "/users/@me", {
        headers: { Authorization: authToken() },
      });

      setUser(await api.get("/users/" + discordUser.id).then(data));

      let project;
      try {
        project = await api.get(`/projects/${projectId}`).then(data);
      } catch {
        window.location = "/explore";
        return;
      }

      setProject(project);

      /* The comments come first because they name the authors to fetch. */
      const comments = await api.get(`/comments/${projectId}`).then(data);
      const authors = await fetchCommentAuthors(comments);

      setAllUsers(authors);
      setComments(comments);
      setLoading(false);
    }

    fetchData().catch((error) => {
      console.error("Error loading project:", error);
      setLoading(false);
    });
  }, [projectId]);

  if (!project) return (window.location = "/explore");

  /* The project's website, as the API decided this viewer may see it.
     A stranger is only ever sent one that is published *and* belongs to a
     public bot; the owner is sent theirs either way, along with the
     reason it isn't linked publicly. */
  const website = project.website;
  const isOwner = Boolean(user?.id) && project?.owner?.id === user?.id;

  /* A draft has an address but nothing at it yet. `published` is only
     part of the owner's view — anyone else is only told about a website
     that is already live. */
  const canVisitWebsite = Boolean(website?.url) && website.published !== false;
  const websiteNote = websiteVisibilityNote(website);

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
    <div className="df-project-detail">
      <Helmet>
        <title>{`${project.name || "Project"} | DisFuse`}</title>
      </Helmet>
      <div className="df-project-detail-head">
        <h1
          className={`title-row${project.owner?.id === user?.id ? " editable" : ""}`}
          onClick={
            project.owner?.id === user?.id
              ? () =>
                  navigate(`/@${project.owner.username}/${project._id}/edit`)
              : null
          }
        >
          {!isLoading && project?.bot?.avatar ? (
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
            <i className="fa-solid fa-lock"></i>
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
          <i className="visibility-note">
            One or more option(s) below will not be visible to other users due
            to visibility settings
          </i>
        ) : (
          ""
        )}

        {isOwner && websiteNote ? (
          <i className="visibility-note website-note">
            <i className="fa-solid fa-globe"></i> {websiteNote}
          </i>
        ) : (
          ""
        )}

        <div
          className="df-detail-actions"
          style={isLoading ? { pointerEvents: "none", opacity: 0.5 } : {}}
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

          {/* The bot's website. The API decides whether anyone but the
              owner is told about it — a private bot's website is left off
              this page even though it stays live at its own address. */}
          {canVisitWebsite ? (
            <Link to={website.url} target="_blank" rel="noopener">
              <div className="darkBtn website">
                <i className="fa-solid fa-globe"></i>
                <div>Website</div>
              </div>
            </Link>
          ) : (
            ""
          )}

          {isOwner && website && !website.published ? (
            <Link to={`/websites/${website._id}/editor`}>
              <div className="darkBtn website">
                <i className="fa-solid fa-pen-ruler"></i>
                <div>Finish website</div>
              </div>
            </Link>
          ) : (
            ""
          )}

          {isOwner && !isLoading && !website ? (
            <Link to={`/websites/new?project=${project._id}`}>
              <div className="darkBtn website">
                <i className="fa-solid fa-globe"></i>
                <div>Add a website</div>
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
        <div>
          <h2>Collaborators</h2>
          <ul className="df-collab-list">
            {[project.owner?.id, ...project.collaborators].map((id) => (
              <UserTag userId={id} key={id} />
            ))}
          </ul>
        </div>
      ) : (
        ""
      )}

      <h2>Comments</h2>
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
