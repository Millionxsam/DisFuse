import axios from "axios";
import { useEffect, useState } from "react";

const { apiUrl } = require("../config/config.json");

export default function UserTag({ user: u, userId }) {
  const [user, setUser] = useState(u || {});

  useEffect(() => {
    if (userId) {
      axios
        .get(apiUrl + "/users/" + userId, {
          headers: { Authorization: localStorage.getItem("disfuse-token") },
        })
        .then(({ data }) => setUser(data));
    }
  }, [userId]);

  return (
    <div
      className="userTag"
      onClick={() => (window.location = `/@${user?.username}`)}
    >
      <img
        src={user?.avatar}
        alt=""
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://cdn.discordapp.com/embed/avatars/0.png";
        }}
      />
      <p>{user?.displayName || user?.username || "Loading..."}</p>
    </div>
  );
}
