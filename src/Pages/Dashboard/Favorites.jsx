import axios from "axios";
import { useEffect, useState } from "react";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";
import { userCache } from "../../cache.ts";

import { apiUrl, discordUrl } from "../../config/config.js";

export default function Favorites() {
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (userCache.user && userCache.user?.favorites) {
      let favoriteProjects = userCache.user.favorites;

      setProjects(favoriteProjects);
      setShown(favoriteProjects);
      setLoading(false);
      return;
    }

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
            axios
              .get(apiUrl + "/projects", {
                headers: {
                  Authorization: localStorage.getItem("disfuse-token"),
                },
              })
              .then(({ data: allProjects }) => {
                let favoriteProjects = user.favorites
                  .filter((f) => allProjects.find((p) => p._id === f))
                  .map((f) => allProjects.find((p) => p._id === f));

                setProjects(favoriteProjects);
                setShown(favoriteProjects);
                setLoading(false);
              });
          });
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
