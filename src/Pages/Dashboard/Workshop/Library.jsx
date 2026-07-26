import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingAnim from "../../../components/LoadingAnim";
import WorkshopItem from "../../../components/WorkshopItem";

import { apiUrl, discordUrl } from "../../../config/config.js";

export default function Library() {
  const [packs, setPacks] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        axios
          .get(apiUrl + `/users/${data.id}`, {
            headers: { Authorization: localStorage.getItem("disfuse-token") },
          })
          .then((res) => {
            Promise.all(
              res.data.installedBlockPacks?.map((packId) =>
                axios.get(apiUrl + `/workshop/${packId}`, {
                  headers: {
                    Authorization: localStorage.getItem("disfuse-token"),
                  },
                }),
              ),
            )
              .then((responses) => {
                let packs = responses.map((response) => response.data);
                setPacks(packs);
                setShown(packs);
              })
              .finally(() => {
                setLoading(false);
              });
          });
      });
  }, []);

  return (
    <div className="df-page">
      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-cubes-stacked"></i> Library
        </h1>
        <div className="df-toolbar">
          <div className="df-back-link" onClick={() => navigate("/workshop")}>
            <i className="fa-solid fa-arrow-left"></i> Workshop
          </div>
          <input
            type="text"
            className="search"
            placeholder="Search your library..."
            onChange={(e) => {
              setShown(
                packs.filter((p) =>
                  p.name.toLowerCase().includes(e.target.value.toLowerCase()),
                ),
              );
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingAnim />
      ) : shown.length ? (
        <div className="df-grid">
          {shown.map((pack, index) => (
            <WorkshopItem pack={pack} key={index} />
          ))}
        </div>
      ) : (
        <div className="df-empty">
          <i className="fa-solid fa-cubes-stacked"></i>
          <h3>No packs installed</h3>
          <p>Install block packs from the Workshop to see them here.</p>
        </div>
      )}
    </div>
  );
}
