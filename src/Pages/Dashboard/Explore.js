import axios from "axios";
import { useEffect, useState } from "react";
import PubProject from "../../components/PubProject";

const { apiUrl } = require("../../config/config.json");

export default function Explore() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    axios
      .get(apiUrl + "/projects", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => setProjects(data));
  }, []);

  return (
    <div className="explore-container">
      <div className="head">
        <i class="fa-solid fa-earth-americas"></i> Explore
      </div>
      <div className="exploration">
        <input type="search" placeholder="Search Projects" className="search" />
        <h1>Featured</h1>
        <div className="content">
          {projects.map((project) => (
            <PubProject project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
