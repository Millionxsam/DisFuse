import axios from "axios";
import { useEffect, useState } from "react";
import { userCache } from "../cache.ts";

const { apiUrl } = require("../config/config");

export default function UserTag({ user: u, userId }) {
  const [user, setUser] = useState({});

  useEffect(() => {
    if (typeof u === "object" && "id" in u) {
      setUser(u);
    } else if (userId && userId.trim() !== "") {
      if (
        userCache.allUsers !== null &&
        userCache.allUsers.some((i) => i.id === userId)
      ) {
        setUser(userCache.allUsers.find((i) => i.id === userId));
      } else {
        axios
          .get(apiUrl + "/users/" + userId, {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          })
          .then((response) => setUser(response.data))
          .catch(console.error);
      }
    }
  }, [userId, u]);

  return (
    <div
      className="userTag"
      onClick={() => (window.location = `/@${user?.username}`)}
    >
      <img
        src={user?.avatar}
        alt=""
        onError={(e) => {
          e.preventDefault();
          e.target.onerror = null;
          e.target.src = "https://cdn.discordapp.com/embed/avatars/0.png";
        }}
      />
      <p>{user?.displayName || user?.username || "Loading..."}</p>
    </div>
  );
}
