import axios from "axios";
import { useEffect, useState } from "react";
import PubProject from "../../components/PubProject";

const { apiUrl, discordUrl } = require("../../config/config.json");

export default function Favorites() {
  const [projects, setProjects] = useState([]);

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
            setProjects(
              users
                .find((u) => u.id === data.id)
                .favorites.map((f) => projects.find((p) => p._id === f))
            );
          });
        });
      });
  }, []);

  return (
    <div className="fav-container">
      <div className="head">
        <i class="fa-solid fa-star"></i> Favorites
      </div>
      <div className="favorites">
        <input type="search" placeholder="Search Projects" className="search" />
        <div className="content">
          {projects.map((project) => (
            <PubProject project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
