import axios from "axios";
import { useEffect, useState } from "react";
import PubProject from "../../components/PubProject";

const { apiUrl, discordUrl } = require("../../config/config.json");

export default function Favorites() {
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        axios.get(apiUrl + "/users").then(({ data: users }) => {
          axios.get(apiUrl + "/projects").then(({ data: projects }) => {
            let p = users
              .find((u) => u.id === data.id)
              .favorites.map((f) => projects.find((p) => p._id === f));
            setProjects(p);
            setShown(p);
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
        <i class="fa-solid fa-star"></i> Favorites
      </div>
      <div className="favorites">
        <input
          onChange={search}
          type="search"
          placeholder="Search Favorites"
          className="search"
        />
        <div className="content">
          {shown.map((project) => (
            <PubProject project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
