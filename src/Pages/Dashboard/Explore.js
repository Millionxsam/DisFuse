import axios from "axios";
import { useEffect, useState } from "react";
import PubProject from "../../components/PubProject";

const { apiUrl } = require("../../config/config.json");

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);

  useEffect(() => {
    axios
      .get(apiUrl + "/projects", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        setProjects(data);
        setShown(data);
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
    <div className="explore-container">
      <div className="head">
        <i class="fa-solid fa-earth-americas"></i> Explore
      </div>
      <div className="exploration">
        <input
          onChange={search}
          type="search"
          placeholder="Search Projects"
          className="search"
        />
        <h1>Featured</h1>
        <div className="content">
          {shown.map((project) => (
            <PubProject project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
