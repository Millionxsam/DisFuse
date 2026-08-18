import axios from "axios";
import { useEffect, useState } from "react";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";
import { userCache } from "../../cache.ts";

import { apiUrl } from "../../config/config.js";

export default function Favorites() {
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const favIds = userCache.user?.favorites;
    if (!favIds?.length) {
      setProjects([]);
      setShown([]);
      setLoading(false);
      return;
    }

    function resolveFavorites(allProjects) {
      const favSet = new Set(favIds);
      return allProjects.filter((p) => favSet.has(p._id));
    }

    if (userCache.explore) {
      setProjects(resolveFavorites(userCache.explore));
      setShown(resolveFavorites(userCache.explore));
      setLoading(false);
      return;
    }

    axios
      .get(`${apiUrl}/projects?limit=200`, {
        headers: { Authorization: localStorage.getItem("disfuse-token") },
      })
      .then(({ data }) => {
        userCache.explore = data.projects;
        const favProjects = resolveFavorites(data.projects);
        setProjects(favProjects);
        setShown(favProjects);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function search() {
    const query = document.querySelector("input.search").value;

    setShown(
      projects.filter(
        (p) =>
          p?.name?.toLowerCase().includes(query.toLowerCase()) ||
          p?.description?.toLowerCase().includes(query.toLowerCase()),
      ),
    );
  }

  return (
    <div className="df-page">
      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-star"></i> Favorites
        </h1>
        <div className="df-toolbar">
          <input
            onChange={search}
            type="search"
            placeholder="Search favorites"
            className="search"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingAnim />
      ) : shown.length > 0 ? (
        <div className="df-grid">
          {shown.map((project) => (
            <PubProject project={project} key={project._id} />
          ))}
        </div>
      ) : (
        <div className="df-empty">
          <i className="fa-solid fa-star"></i>
          <h3>No favorites yet</h3>
          <p>
            Star projects from the Explore page and they'll show up here for
            quick access.
          </p>
        </div>
      )}
    </div>
  );
}
