import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";
import { userCache } from "../../cache.ts";

const { apiUrl } = require("../../config/config.json");

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (userCache.explore) {
      setProjects(userCache.explore);
      setShown(userCache.explore);
      setLoading(false);
      return;
    } else
      axios
        .get(apiUrl + "/projects", {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        })
        .then(({ data }) => {
          let projects = data.sort((a, b) => b.likes.length - a.likes.length);

          userCache.explore = projects;

          setProjects(projects);
          setShown(projects);
          setLoading(false);
        });
  }, []);

  function search() {
    const query = document.querySelector("input.search").value;

    setShown(
      projects.filter(
        (p) =>
          p?.name?.toLowerCase().includes(query.toLowerCase()) ||
          p?.description?.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  function sort() {
    Swal.fire({
      title: "Sort Projects",
      input: "select",
      inputOptions: {
        newest: "Newest First",
        oldest: "Oldest First",
        mostLiked: "Most Liked",
        mostCloned: "Most Cloned",
      },
      inputPlaceholder: "Select sorting order",
      showCancelButton: true,
      confirmButtonText: "Sort",
      inputValidator: (value) => {
        if (!value) {
          return "You need to choose a sorting order!";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        let sortedProjects = [...projects];

        if (result.value === "oldest") {
          sortedProjects.sort(
            (a, b) => new Date(a.created) - new Date(b.created)
          );
        } else if (result.value === "newest") {
          sortedProjects.sort(
            (a, b) => new Date(b.created) - new Date(a.created)
          );
        } else if (result.value === "mostLiked") {
          sortedProjects.sort((a, b) => b.likes.length - a.likes.length);
        } else if (result.value === "mostCloned") {
          sortedProjects.sort((a, b) => b.clones.length - a.clones.length);
        }

        setShown(sortedProjects);
        setProjects(sortedProjects);
      }
    });
  }

  return (
    <div className="explore-container">
      <div className="head">
        <i className="fa-solid fa-earth-americas"></i> Explore
      </div>
      <div className="buttons">
        <input
          onChange={search}
          type="search"
          placeholder="Search Projects"
          className="search"
        />
        <button onClick={sort}>
          <i className="fa-solid fa-arrow-up-wide-short"></i> Sort Projects
        </button>
      </div>
      <div className="exploration">
        <h1>Featured</h1>
        {isLoading ? <LoadingAnim /> : ""}
        <div className="content">
          {shown.length > 0
            ? shown.map((project) => <PubProject project={project} />)
            : !isLoading
            ? "No projects"
            : ""}
        </div>
      </div>
    </div>
  );
}
