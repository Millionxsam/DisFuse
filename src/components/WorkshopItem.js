import { useEffect, useState } from "react";
import UserTag from "./UserTag";
import axios from "axios";
import Swal from "sweetalert2";
import { userCache } from "../cache.ts";

const { apiUrl, discordUrl } = require("../config/config.js");

export default function WorkshopItem({ pack: p, editable = false }) {
  const [pack, setPack] = useState(p);
  const [user, setUser] = useState(null);
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    (async () => {
      if (userCache.user !== null) {
        setLocalUser(userCache.user);
      } else {
        const { data } = await axios.get(discordUrl + "/users/@me", {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        });

        const { data: user } = await axios.get(apiUrl + "/users/" + data.id, {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        });

        setLocalUser(user);
      }

      const { data } = await axios.get(apiUrl + `/users/${pack.owner}`, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      });

      setUser(data);
    })();
  }, [pack]);

  function installPack() {
    axios
      .patch(
        apiUrl + `/workshop/${pack._id}/users`,
        {},
        { headers: { Authorization: localStorage.getItem("disfuse-token") } }
      )
      .then((res) => {
        setPack(res.data);

        if (res.data.users.includes(user.id)) {
          Swal.fire({
            toast: true,
            text: "Added to your library",
            timerProgressBar: true,
            timer: 5000,
            showConfirmButton: false,
            icon: "success",
            position: "top-right",
          });
        } else {
          Swal.fire({
            toast: true,
            text: "Removed from your library",
            timerProgressBar: true,
            timer: 5000,
            showConfirmButton: false,
            icon: "success",
            position: "top-right",
          });
        }
      });
  }

  return (
    <div className="workshop-item">
      <div className="info">
        <div>
          <h1>{pack.name}</h1>
          {pack.private ? (
            <div>
              <i className="fa-solid fa-lock"></i>
            </div>
          ) : (
            ""
          )}
        </div>
        <UserTag user={user} />
      </div>
      <p>
        {pack.description.slice(0, 150) +
          (pack.description.length > 150 ? "..." : "")}
      </p>
      <div className="stats">
        <p>
          {pack.versions[pack.versions.length - 1]?.blocks?.length || 0} Blocks
        </p>
        <p>{pack.users?.length || 0} Users</p>
        <p>{pack.likes?.length || 0} Likes</p>
      </div>
      <div className="buttons">
        {editable ? (
          <>
            <button
              onClick={() =>
                (window.location = `/workshop/${pack._id}/workspace`)
              }
            >
              <i className="fa-solid fa-square-arrow-up-right"></i>
              Edit
            </button>
            <button onClick={() => (window.location = `/workshop/${pack._id}`)}>
              <i className="fa-solid fa-eye"></i>
              View
            </button>
            <button onClick={installPack}>
              {localUser?.installedBlockPacks?.includes(pack._id) ? (
                <>
                  <i className="fa-solid fa-xmark"></i> Uninstall
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus"></i> Install
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => (window.location = `/workshop/${pack._id}`)}>
              <i className="fa-solid fa-eye"></i>
              View
            </button>
            <button onClick={installPack}>
              {localUser?.installedBlockPacks?.includes(pack._id) ? (
                <>
                  <i className="fa-solid fa-xmark"></i> Uninstall
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus"></i> Install
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
