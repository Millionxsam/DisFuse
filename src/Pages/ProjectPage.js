import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UserTag from "../components/UserTag";
import Swal from "sweetalert2";

const { apiUrl, discordUrl } = require("../config/config.json");

export default function ProjectPage() {
  const [project, setProject] = useState({});
  const [user, setUser] = useState({});
  const [newLike, setNewLike] = useState(false);
  const [newFav, setNewFav] = useState(false);

  const { projectId, username } = useParams();

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        axios
          .get(apiUrl + "/users")
          .then(({ data: users }) =>
            setUser(users.find((u) => u.id === data.id))
          );
      });

    axios
      .get(apiUrl + `/projects/${projectId}`)
      .then(({ data }) =>
        setProject(
          data.owner.username === username.replace("@", "") ? data : null
        )
      );
  }, []);

  function toggleLike() {
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

  function toggleFav(favId) {
    axios
      .patch(
        apiUrl + `/users/${user.id}/favorites`,
        { favId },
        {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        }
      )
      .then(({ data }) => {
        if (data.favorites.includes(favId)) setNewFav(true);
        setUser(data);
      });
  }

  function cloneProject() {
    const Queue = Swal.mixin({
      progressSteps: ["1", "2", "3"],
      animation: false,
      confirmButtonText: "Next >",
    });

    (async () => {
      let name, dsc, isPrivate;
      let cancelled = false;

      await Queue.fire({
        title: "Enter your project name",
        input: "text",
        inputValue: project.name + " Clone",
        inputPlaceholder: "DisFuse Project",
        showCancelButton: true,
        inputValidator: (i) => {
          if (i.length >= 3) return false;
          else return "The name must be at least 3 characters";
        },
        animation: true,
        currentProgressStep: 0,
      }).then((result) => {
        if (result.isConfirmed) name = result.value;
        else cancelled = true;
      });

      if (cancelled) return;

      await Queue.fire({
        title: "Enter the description (optional)",
        currentProgressStep: 1,
        input: "text",
        showCancelButton: true,
        inputPlaceholder: "Some description",
      }).then((result) => {
        if (result.isConfirmed) dsc = result.value;
        else cancelled = true;
      });

      if (cancelled) return;

      await Queue.fire({
        title: "Project Visibility",
        currentProgressStep: 2,
        showCancelButton: true,
        confirmButtonText: "Create",
        input: "select",
        inputOptions: {
          public: "Public",
          private: "Private",
        },
      }).then((result) => {
        if (result.isConfirmed) isPrivate = result.value === "private";
        else cancelled = true;
      });

      if (cancelled) return;

      axios.patch(apiUrl + `/projects/${projectId}/clones`, null, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      });

      axios
        .post(
          apiUrl + `/projects/${user.id}`,
          {
            project: {
              name,
              description: dsc,
              private: isPrivate,
              data: project.data,
            },
          },
          {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          }
        )
        .then(({ data }) => (window.location = `/workspace/${data._id}`));
    })();
  }

  return (
    <div className="project-page-container">
      <div className="head">
        <div className="info">
          <h1>{project.name}</h1>
          <UserTag user={project.owner} />
          <p>{project.description}</p>
        </div>
        <div className="buttons">
          <div
            onClick={toggleLike}
            className={`darkBtn like${
              project.likes?.includes(user.id) ? " active" : ""
            }${newLike ? " newLike" : ""}`}
          >
            <i class="fa-solid fa-heart"></i>
            <div>{project.likes?.length} Likes</div>
          </div>
          <div onClick={cloneProject} className="darkBtn clone">
            <i class="fa-solid fa-clone"></i>
            <div>{project.clones?.length} Clones</div>
          </div>
          <div
            onClick={() => toggleFav(projectId)}
            className={`darkBtn fav${
              user.favorites?.includes(projectId) ? " active" : ""
            }${newFav ? " newFav" : ""}`}
          >
            <i class="fa-solid fa-star"></i>
            <div>
              {user.favorites?.includes(projectId) ? "Unfavorite" : "Favorite"}
            </div>
          </div>
        </div>
      </div>
      <h1>Comments</h1>
      <div className="body">Coming soon</div>
    </div>
  );
}
