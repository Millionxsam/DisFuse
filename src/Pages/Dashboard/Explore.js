import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";
import { userCache } from "../../cache.ts";
import modalThemeColor from "../../functions/modalThemeColor.js";

const { apiUrl } = require("../../config/config.js");

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(projects.length === 0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  Swal.fire({
    ...modalThemeColor(userCache.user, true),
    title: "DisFuse is Currently Unavailable",
    text: "We are currently experiencing some technical difficulties that are causing some parts of the website to be unavailable. Please be patient while we work to resolve this issue (started August 15). We're sorry for the inconvenience.",
    icon: "error",
    showCloseButton: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
  });

  useEffect(() => {
    if (!userCache.explore) {
      axios
        .get(`${apiUrl}/projects`, {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        })
        .then(({ data }) => {
          const sorted = data.sort((a, b) => b.likes.length - a.likes.length);
          userCache.explore = sorted;
          setProjects(sorted);
          setShown(sorted);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching projects:", err);
          setLoading(false);
        });
    } else {
      const sorted = userCache.explore.sort(
        (a, b) => b.likes.length - a.likes.length
      );
      setProjects(sorted);
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [shown]);

  function search() {
    const query = document.querySelector("input.search").value.toLowerCase();
    const filtered = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
    setShown(filtered);
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
        if (!value) return "You need to choose a sorting order!";
      },
    }).then((result) => {
      if (result.isConfirmed) {
        let sorted = [...projects];
        switch (result.value) {
          case "oldest":
            sorted.sort((a, b) => new Date(a.created) - new Date(b.created));
            break;
          default:
          case "newest":
            sorted.sort((a, b) => new Date(b.created) - new Date(a.created));
            break;
          case "mostLiked":
            sorted.sort((a, b) => b.likes.length - a.likes.length);
            break;
          case "mostCloned":
            sorted.sort((a, b) => b.clones.length - a.clones.length);
            break;
        }
        setProjects(sorted);
        setShown(sorted);
      }
    });
  }

  const totalPages = Math.ceil(shown.length / pageSize);
  const startIdx = (page - 1) * pageSize;
  const displayed = shown.slice(startIdx, startIdx + pageSize);

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
        {isLoading && <LoadingAnim />}
        <div className="content">
          {!isLoading && displayed.length === 0 && "No projects"}
          {displayed.map((project, _) => (
            <PubProject project={project} key={project._id} />
          ))}
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
