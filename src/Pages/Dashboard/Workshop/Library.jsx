import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingAnim from "../../../components/LoadingAnim";
import WorkshopItem from "../../../components/WorkshopItem";

const { apiUrl, discordUrl } = require("../../../config/config.js");

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
                })
              )
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
    <div className="library-container">
      <div className="head">
        <i className="fa-solid fa-cubes-stacked"></i> Library
      </div>
      <div className="buttons">
        <button
          style={{ width: "min-content" }}
          onClick={() => navigate("/workshop")}
        >
          <i className="fa-solid fa-arrow-left"></i> Workshop
        </button>
        {
          <input
            type="text"
            className="search"
            placeholder="Search your library..."
            onChange={(e) => {
              setShown(
                packs.filter((p) =>
                  p.name.toLowerCase().includes(e.target.value.toLowerCase())
                )
              );
            }}
          />
        }
      </div>
      <div className="content">
        {isLoading ? (
          <LoadingAnim />
        ) : (
          <>
            {shown.length ? (
              shown.map((pack, index) => (
                <WorkshopItem pack={pack} key={index} />
              ))
            ) : (
              <p>No packs installed</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
