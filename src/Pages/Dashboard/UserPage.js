import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PubProject from "../../components/PubProject";
import LoadingAnim from "../../components/LoadingAnim";
import { Helmet } from "react-helmet";

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
    <>
      <Helmet>
        <meta property="og:title" content={`@${user.username} on DisFuse`} />
        <meta
          property="og:description"
          content="Create a Discord bot with block coding!"
        />
      </Helmet>

      <div className="user-profile-container">
        <div className="head">
          <div className="nametag">
            <img src={user.avatar} alt="" />
            <div>
              <h1>{user.displayName || user.username}</h1>
              <p>@{user.username}</p>
            </div>
          </div>
          <div className="stats">
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
    </>
  );
}
