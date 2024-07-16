import axios from "axios";
import { useEffect, useState } from "react";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";

const { apiUrl } = require("../../config/config.json");

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(true);

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
