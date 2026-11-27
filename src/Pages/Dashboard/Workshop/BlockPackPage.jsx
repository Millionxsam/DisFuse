import * as Blockly from "blockly";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import UserTag from "../../../components/UserTag";
import { DFTheme } from "../../../components/themes/DFTheme";
import registerCustomBlocks from "../../../blocks/lib/registerCustomBlocks";
import Swal from "sweetalert2";
import ReactMarkdown from "react-markdown";
import getToolbox from "../../../config/toolbox";

/* Registers every DisFuse block definition and generator. Without it
   this page injects a toolbox full of block types Blockly has never been
   told about, and a saved project loaded here renders as nothing. It used
   to be a glob that only the editor page had. */
import "../../../blocks/index.js";
import LoadingAnim from "../../../components/LoadingAnim";
import remarkGfm from "remark-gfm";
import modalThemeColor from "../../../functions/modalThemeColor.js";
import { userCache } from "../../../cache.ts";

import { apiUrl, discordUrl } from "../../../config/config.js";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";
import {
  PACK_TYPES,
  countOfferedPackItems,
  countPackItems,
  packType,
} from "../../../builder/model/packs.js";
import BuilderPackContents from "./BuilderPackContents.jsx";

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

            /* A builder pack has no blocks to preview. */
            if (packType(pack) === "builder") return;

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
              },
            );

            registerCustomBlocks(
              pack.versions[pack.versions.length - 1]?.blocks || [],
              previewWs,
            );

            previewWs.updateToolbox(getToolbox([pack]));
          });
      });
  }, [packId]);

  const type = packType(pack);
  const latest = pack.versions?.[pack.versions.length - 1];
  /* Archived blocks are still published so projects using them work,
     but the pack no longer offers them. */
  const visibleBlocks = (latest?.blocks || []).filter(
    (block) => !block.archived,
  );
  const itemCount =
    type === "builder" ? countOfferedPackItems(latest?.items) : visibleBlocks.length;
  const itemWord = (n) =>
    type === "builder" ? (n === 1 ? "item" : "items") : n === 1 ? "block" : "blocks";

  return loading ? (
    <LoadingAnim />
  ) : (
    <div className="df-pack-page">
      <Helmet>
        <title>{`${pack.name || "Pack"} | DisFuse`}</title>
      </Helmet>
      <div className="df-pack-page-head">
        <div className="title-row">
          <h1>{pack.name}</h1>
          {pack.private ? <i className="fa-solid fa-lock"></i> : ""}
        </div>

        <UserTag user={owner} />

        <div className="stat-row">
          <span
            className={`df-pack-type df-pack-type-${type}`}
            title="Once installed, it works in Block Editor and DisFuse Builder projects."
          >
            <i className={PACK_TYPES[type].icon}></i> Made with{" "}
            {PACK_TYPES[type].editor} · works in every project
          </span>
          <span className="stat-chip">
            <i className="fa-solid fa-cubes"></i> {itemCount}{" "}
            {itemWord(itemCount).replace(/^./, (c) => c.toUpperCase())}
          </span>
          <span className="stat-chip">
            <i className="fa-solid fa-users"></i> {pack.users?.length || 0}{" "}
            User
            {(pack.users?.length || 0) === 1 ? "" : "s"}
          </span>
        </div>

        <div className="df-detail-actions">
          <DocsLink
            page={`${DOCS.workshop}#installing`}
            label="About packs"
          />
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
            }${newLike ? " newLike" : ""}`}
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
        {pack.description?.split("\n").map((l, i) => {
          if (!l.length) return <br key={i} />;
          return (
            <ReactMarkdown remarkPlugins={[remarkGfm]} key={i}>
              {l}
            </ReactMarkdown>
          );
        })}
      </p>

      {type === "builder" ? (
        <div className="body">
          <BuilderPackContents items={latest?.items} color={pack.color} />

          <h1>Versions</h1>
          <div className="versionList">
            {pack.versions?.length ? (
              [...pack.versions].reverse().map((version, index) => {
                const count = countPackItems(version.items);
                return (
                  <div key={index} className="versionItem">
                    <div>
                      <h2>v{version.version}</h2>-
                      <p>
                        {new Date(version.releaseDate).toLocaleString([], {
                          dateStyle: "long",
                        })}
                      </p>
                      - <p>{count} {itemWord(count)}</p>
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
      ) : (
      <div className="body">
        <h1>Blocks</h1>
        <div className="blocksList">
          {visibleBlocks.length > 0 ? (
            visibleBlocks.map(
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
              },
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
      )}
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
        { headers: { Authorization: localStorage.getItem("disfuse-token") } },
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
            ...modalThemeColor(userCache.user),
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
            ...modalThemeColor(userCache.user),
          });
        }
      });
  }
}
