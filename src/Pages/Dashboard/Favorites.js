import axios from "axios";
import { useEffect, useState } from "react";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";
import { userCache } from "../../cache.ts";

const { apiUrl, discordUrl } = require("../../config/config.js");

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
          p?.description?.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  return (
    <div className="fav-container">
      <div className="head">
        <i className="fa-solid fa-star"></i> Favorites
      </div>
      <div className="favorites">
        <input
          onChange={search}
          type="search"
          placeholder="Search Favorites"
          className="search"
        />
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
