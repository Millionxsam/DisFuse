import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PubProject from "../components/PubProject";

const { apiUrl } = require("../config/config.json");

export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState({});
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    axios
      .get(apiUrl + "/users")
      .then(({ data: users }) =>
        setUser(users.find((u) => u.username === username.replace("@", "")))
      );
  }, []);

  useEffect(() => {
    axios
      .get(apiUrl + `/users/${user.id}/projects`)
      .then(({ data }) => setProjects(data));
  }, [user]);

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
      <div className="body">
        {projects.length > 0
          ? projects.map((project) => <PubProject project={project} />)
          : "No projects"}
      </div>
    </div>
  );
}
