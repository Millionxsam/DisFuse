import axios from "axios";
import { useEffect, useState } from "react";
import { userCache } from "../cache.ts";

const { apiUrl } = require("../config/config");

export default function UserTag({ user: u, userId }) {
  const [user, setUser] = useState(typeof u === "object" ? u : {});

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      if (userId && userId.trim() !== "") {
        if (
          userCache.allUsers !== null &&
          userCache.allUsers.some((i) => i.id === userId)
        ) {
          const cachedUser = userCache.allUsers.find((i) => i.id === userId);
          if (!cancelled) setUser(cachedUser);
        } else {
          try {
            const { data } = await axios.get(apiUrl + "/users/" + userId, {
              headers: { Authorization: localStorage.getItem("disfuse-token") },
            });
            if (!cancelled) setUser(data);
          } catch (err) {
            console.error("failed to fetch user", err);
          }
        }
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
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
