import { useEffect, useState } from "react";
import UserTag from "./UserTag";
import axios from "axios";
import Swal from "sweetalert2";
import modalThemeColor from "../functions/modalThemeColor.js";
import { userCache } from "../cache.ts";

import { apiUrl, discordUrl } from "../config/config";
import { PACK_TYPES, countOfferedPackItems, packType } from "../builder/model/packs.js";

export default function WorkshopItem({ pack: p, editable = false }) {
  const [pack, setPack] = useState(p);
  const [user, setUser] = useState(null);
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: discordUser } = await axios.get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      });

      const { data: user } = await axios.get(
        apiUrl + "/users/" + discordUser.id,
        {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        },
      );

      setLocalUser(user);

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
        { headers: { Authorization: localStorage.getItem("disfuse-token") } },
      )
      .then((res) => {
        setPack(res.data);

        if (res.data.users.includes(localUser.id)) {
          Swal.fire({
            toast: true,
            text: "Added to your library",
            timerProgressBar: true,
            timer: 5000,
            showConfirmButton: false,
            icon: "success",
            position: "top-right",
            ...modalThemeColor(userCache.user),
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
            ...modalThemeColor(userCache.user),
          });
        }
      });
  }

  const installed = localUser?.installedBlockPacks?.includes(pack._id);
  const type = packType(pack);
  const latest = pack.versions?.[pack.versions.length - 1];
  const count =
    type === "builder"
      ? countOfferedPackItems(latest?.items)
      : /* Archived blocks still load for projects using them, but the
           pack no longer offers them. */
        (latest?.blocks || []).filter((b) => !b.archived).length;

  return (
    <div className="df-pack-card">
      <div className="card-top">
        <h3>
          {pack.private && <i className="fa-solid fa-lock"></i>}
          {pack.name}
        </h3>
      </div>

      <span
        className={`df-pack-type df-pack-type-${type}`}
        title={`Made with ${PACK_TYPES[type].editor}. Works in every project.`}
      >
        <i className={PACK_TYPES[type].icon}></i> {PACK_TYPES[type].editor}
      </span>

      <UserTag user={user} />

      <p className="description">
        {pack.description.slice(0, 150) +
          (pack.description.length > 150 ? "..." : "")}
      </p>

      <div className="stat-row">
        <span className="stat-chip">
          <i className="fa-solid fa-cubes"></i> {count}{" "}
          {type === "builder"
            ? count === 1
              ? "Item"
              : "Items"
            : count === 1
              ? "Block"
              : "Blocks"}
        </span>
        <span className="stat-chip">
          <i className="fa-solid fa-users"></i> {pack.users?.length || 0} Users
        </span>
        <span className="stat-chip">
          <i className="fa-solid fa-heart"></i> {pack.likes?.length || 0} Likes
        </span>
      </div>

      <div className="card-buttons">
        {editable && (
          <button
            className="primary"
            onClick={() =>
              (window.location = `/workshop/${pack._id}/workspace`)
            }
          >
            <i className="fa-solid fa-square-arrow-up-right"></i>
            Edit
          </button>
        )}
        <button onClick={() => (window.location = `/workshop/${pack._id}`)}>
          <i className="fa-solid fa-eye"></i>
          View
        </button>
        <button onClick={installPack}>
          {installed ? (
            <>
              <i className="fa-solid fa-xmark"></i> Uninstall
            </>
          ) : (
            <>
              <i className="fa-solid fa-plus"></i> Install
            </>
          )}
        </button>
      </div>
    </div>
  );
}
