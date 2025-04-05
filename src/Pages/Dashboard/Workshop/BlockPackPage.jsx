import * as Blockly from "blockly";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UserTag from "../../../components/UserTag";
import { DFTheme } from "../../../components/themes/DFTheme";
import registerCustomBlocks from "../../../functions/registerCustomBlocks";
import Swal from "sweetalert2";
import ReactMarkdown from "react-markdown";
import getToolbox from "../../../config/toolbox";
import LoadingAnim from "../../../components/LoadingAnim";
import remarkGfm from "remark-gfm";

import { apiUrl, authUrl, devAuthUrl, discordUrl } from "../../../config/config.json";

export default function BlockPackPage() {
  const [pack, setPack] = useState({});
  const [owner, setOwner] = useState({});
  const [user, setUser] = useState({});
  const [newInstall, setNewInstall] = useState(false);
  const [newLike, setNewLike] = useState(false);
  const [loading, setLoading] = useState(true);

  const { packId } = useParams();

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        axios
          .get(apiUrl + "/users/" + data.id, {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          })
          .then(({ data: user }) => {
            setUser(user);
          });
      });
  }, [pack]);

  useEffect(() => {
    axios
      .get(apiUrl + `/workshop/${packId}`, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data: pack }) => {
        setPack(pack);
        setLoading(false);

        axios
          .get(apiUrl + `/users/${pack.owner}`, {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          })
          .then(({ data: owner }) => {
            setOwner(owner);

            const previewWs = Blockly.inject(
              document.getElementById("blockPackPreviewWorkspace"),
              {
                toolbox: {
                  contents: [{ kind: "category", name: "Loading..." }],
                },
                theme: DFTheme,
                move: {
                  wheel: true,
                  drag: true,
                },
                renderer: "zelos",
                collapse: true,
                comments: false,
                disable: false,
                maxBlocks: Infinity,
                trashcan: false,
                horizontalLayout: false,
                toolboxPosition: "start",
                css: true,
                media: "https://blockly-demo.appspot.com/static/media/",
                rtl: false,
                scrollbars: true,
                oneBasedIndex: true,
                grid: {
                  spacing: "35",
                  length: 5,
                  colour: "#8888886e",
                  snap: false,
                },
                zoom: {
                  controls: true,
                  wheel: true,
                  startScale: 1.5,
                  maxScale: 3,
                  minScale: 0.3,
                  scaleSpeed: 1.2,
                },
              }
            );

            registerCustomBlocks(
              pack.versions[pack.versions.length - 1]?.blocks || [],
              previewWs
            );

            previewWs.updateToolbox(getToolbox([pack]));
          });
      });
  }, [packId]);

  return loading ? (
    <LoadingAnim />
  ) : (
    <div className="blockPackPage">
      <div className="head">
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
          <UserTag user={owner} />
        </div>
        <div className="stats">
          <p>
            {pack.versions[pack.versions?.length - 1]?.blocks?.length || 0}{" "}
            Block
            {(pack.versions[pack.versions?.length - 1]?.blocks?.length || 0) ===
            1
              ? ""
              : "s"}
          </p>
          <p>
            {pack.users?.length || 0} User
            {(pack.users?.length || 0) === 1 ? "" : "s"}
          </p>
        </div>
        <div className="buttons">
          <div
            onClick={installPack}
            className={`darkBtn install${
              user.installedBlockPacks?.includes(packId) ? " active" : ""
            }${newInstall ? " installAnim" : ""}`}
          >
            <i className="fa-solid fa-plus"></i>
            <div>
              {user.installedBlockPacks?.includes(packId)
                ? "Uninstall"
                : "Install"}
            </div>
          </div>

          <div
            onClick={toggleLike}
            className={`darkBtn like${
              pack.likes?.includes(user.id) ? " active" : ""
            }
            ${newLike ? " newLike" : ""}
            `}
          >
            <i className="fa-solid fa-heart"></i>
            <div>{pack.likes?.length} Likes</div>
          </div>
        </div>
      </div>
      {pack.flags?.length ? (
        <div className="flags-container">
          {pack.flags.map((flag, index) => {
            return (
              <div key={index} className={`flag ${flag.type}`}>
                <i
                  className={`fa-solid ${
                    flag.type === "info"
                      ? "fa-circle-info"
                      : flag.type === "warning"
                      ? "fa-triangle-exclamation"
                      : "fa-circle-exclamation"
                  }`}
                ></i>
                <p>{flag.value}</p>
              </div>
            );
          })}
        </div>
      ) : (
        ""
      )}
      <p>
        {pack.description?.split("\n").map((l) => {
          if (!l.length) return <br />;
          return <ReactMarkdown remarkPlugins={[remarkGfm]}>{l}</ReactMarkdown>;
        })}
      </p>
      <div className="body">
        <h1>Blocks</h1>
        <div className="blocksList">
          {pack.versions[pack.versions.length - 1]?.blocks?.length > 0 ? (
            pack.versions[pack.versions.length - 1]?.blocks.map(
              (block, index) => {
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: ".5rem",
                      alignItems: "center",
                    }}
                  >
                    <h2>{block.name}</h2> - <p>{block.description}</p>
                  </div>
                );
              }
            )
          ) : (
            <p>No blocks found</p>
          )}
        </div>
        <h1>Preview</h1>
        <div id="blockPackPreviewWorkspace"></div>
        <h1>Versions</h1>
        <div className="versionList">
          {pack.versions?.length ? (
            [...pack.versions].reverse().map((version, index) => {
              return (
                <div key={index} className="versionItem">
                  <div>
                    <h2>v{version.version}</h2>-
                    <p>
                      {new Date(version.releaseDate).toLocaleString([], {
                        dateStyle: "long",
                      })}
                    </p>
                    - <p>{version.blocks?.length || 0} blocks</p>
                  </div>
                  <div>{version.changelog}</div>
                </div>
              );
            })
          ) : (
            <p>No versions</p>
          )}
        </div>
      </div>
    </div>
  );

  function toggleLike() {
    if (!pack.name) return;

    axios
      .patch(apiUrl + `/workshop/${pack._id}/likes`, null, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        if (data.likes.includes(user.id)) setNewLike(true);
        setPack(data);
      });
  }

  function installPack() {
    axios
      .patch(
        apiUrl + `/workshop/${packId}/users`,
        {},
        { headers: { Authorization: localStorage.getItem("disfuse-token") } }
      )
      .then((res) => {
        setPack(res.data);

        if (res.data.users.includes(user.id)) {
          setNewInstall(true);

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
          setNewInstall(false);

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
}
