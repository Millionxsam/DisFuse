import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";

const { apiUrl } = require("../../config/config.json");

export default function UserPage() {
  const { username } = useParams();
  const [user, setUser] = useState({});
  const [projects, setProjects] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(apiUrl + "/users").then(({ data: users }) => {
      let user = users.find((u) => u.username === username.replace("@", ""));
      setUser(user);

      axios
        .get(apiUrl + `/users/${user.id}/projects`, {
          headers: { Authorization: localStorage.getItem("disfuse-token") },
        })
        .then(({ data }) => {
          setProjects(data);
          setLoading(false);
        });
    });
  }, [username]);

  return (
    <div className="user-profile-container">
      <div className="head">
        <div className="nametag">
          <img src={user.avatar} alt="" />
          <h1>{user.username}</h1>
        </div>
        <div className="stats">
          <p>0 Followers</p>
          <p>{projects.length} Projects</p>
        </div>
      </div>
      <h1>Projects</h1>
      {isLoading ? <LoadingAnim /> : ""}
      <div className="body">
        {projects.length > 0
          ? projects.map((project) => <PubProject project={project} />)
          : !isLoading
          ? "No public projects"
          : ""}
      </div>
    </div>
  );
}
