import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";
import { userCache } from "../../cache.ts";

import { apiUrl } from "../../config/config.js";

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(projects.length === 0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (userCache.explore) {
      const sorted = [...userCache.explore].sort(
        (a, b) => b.likes.length - a.likes.length,
      );
      setProjects(sorted);
      setShown(sorted);
      setLoading(false);
      return;
    }

    axios
      .get(`${apiUrl}/projects?limit=200`, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        const sorted = data.projects.sort(
          (a, b) => b.likes.length - a.likes.length,
        );
        userCache.explore = sorted;
        setProjects(sorted);
        setShown(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching projects:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [shown]);

  function search() {
    const query = document.querySelector("input.search").value.toLowerCase();
    const filtered = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query),
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
    <div className="df-page">
      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-earth-americas"></i> Explore
        </h1>
        <div className="df-toolbar">
          <input
            onChange={search}
            type="search"
            placeholder="Search projects"
            className="search"
          />
          <div className="df-btn-group">
            <button onClick={sort}>
              <i className="fa-solid fa-arrow-up-wide-short"></i> Sort
            </button>
          </div>
        </div>
      </div>

      {isLoading && <LoadingAnim />}

      {!isLoading && displayed.length === 0 && (
        <div className="df-empty">
          <i className="fa-solid fa-magnifying-glass"></i>
          <h3>No projects found</h3>
          <p>Try a different search, or check back once more bots are shared publicly.</p>
        </div>
      )}

      {!isLoading && displayed.length > 0 && (
        <div className="df-grid">
          {displayed.map((project) => (
            <PubProject project={project} key={project._id} />
          ))}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="df-pagination">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            <i className="fa-solid fa-chevron-left"></i> Prev
          </button>
          <span className="page-indicator">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}
