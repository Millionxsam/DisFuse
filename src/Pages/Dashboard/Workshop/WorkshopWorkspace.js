import * as Blockly from "blockly";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingAnim from "../../../components/LoadingAnim";
import { DFTheme } from "../../../components/themes/DFTheme";
import { workshopToolbox } from "./WorkshopToolbox";
import PreviewBox from "./PreviewBox";
import ReactDOM from "react-dom/client";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";
import modalThemeColor from "../../../functions/modalThemeColor";
import { renderToStaticMarkup } from "react-dom/server";
import "@blockly/toolbox-search";

require
  .context("./workshopBlocks", true, /\.js$/)
  .keys()
  .forEach((key) => {
    key = key.replace("./", "");

    import(`./workshopBlocks/${key}`).catch(console.error);
  });

const { apiUrl, discordUrl } = require("../../../config/config.json");

export default function WorkshopWorkspace() {
  const [pack, setPack] = useState({});
  const [user, setUser] = useState({});
  const [workspace, setWorkspace] = useState();
  const [isLoading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState([]);

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
          .get(apiUrl + `/users/${data.id}`, {
            headers: { Authorization: localStorage.getItem("disfuse-token") },
          })
          .then(({ data: user }) => {
            setUser(user);

            axios
              .get(apiUrl + `/workshop/${packId}`, {
                headers: {
                  Authorization: localStorage.getItem("disfuse-token"),
                },
              })
              .then(({ data: pack }) => {
                setPack(pack);
                axios
                  .get(apiUrl + `/users/${pack.owner}`, {
                    headers: {
                      Authorization: localStorage.getItem("disfuse-token"),
                    },
                  })
                  .then(({ data: owner }) => {
                    if (user._id !== owner._id)
                      return (window.location = "/workshop");

                    setLoading(false);

                    const workspace = Blockly.inject(
                      document.getElementById("workshopWorkspace"),
                      {
                        toolbox: workshopToolbox,
                        theme: DFTheme,
                        move: {
                          wheel: true,
                        },
                        renderer: "zelos",
                        collapse: true,
                        comments: true,
                        disable: true,
                        maxBlocks: Infinity,
                        trashcan: true,
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
                          startScale: 1,
                          maxScale: 3,
                          minScale: 0.3,
                          scaleSpeed: 1.2,
                        },
                      }
                    );

                    setWorkspace(workspace);

                    if (pack.data?.length)
                      Blockly.serialization.workspaces.load(
                        JSON.parse(pack.data),
                        workspace
                      );

                    const modalColors = modalThemeColor(user);

                    if (!localStorage.getItem("workshopOnboardingCompleted")) {
                      Swal.fire({
                        icon: "info",
                        title: "Welcome to Block Workshop!",
                        text: "Start creating blocks by using the blocks in the toolbox. When you want to release your pack, click the Publish button in the top right corner. Your changes save automatically even if you do not publish, so you can continue working on it later.",
                        confirmButtonText: "Start",
                        ...modalColors,
                      }).then(() =>
                        localStorage.setItem(
                          "workshopOnboardingCompleted",
                          true
                        )
                      );
                    }

                    workspace.addChangeListener(Blockly.Events.disableOrphans);

                    workspace.addChangeListener((e) => {
                      let ignoredEvents = [
                        Blockly.Events.VIEWPORT_CHANGE,
                        Blockly.Events.SELECTED,
                        Blockly.Events.CLICK,
                        Blockly.Events.TOOLBOX_ITEM_SELECT,
                      ];
                      if (ignoredEvents.includes(e.type)) return;

                      let blockList = workspace
                        .getAllBlocks(false)
                        .filter((b) => b.type === "main_blockcreator")
                        .map((b) =>
                          JSON.parse(javascriptGenerator.blockToCode(b))
                        );

                      setBlocks(blockList);

                      axios.patch(
                        apiUrl + `/workshop/${packId}/data`,
                        {
                          data: JSON.stringify(
                            Blockly.serialization.workspaces.save(workspace)
                          ),
                        },
                        {
                          headers: {
                            Authorization:
                              localStorage.getItem("disfuse-token"),
                          },
                        }
                      );
                    });
                  });
              });
          });
      });
  }, [packId]);

  return (
    <>
      <div className="workshopWorkspaceNavbar">
        <div>
          <div className="logo">
            <Link to="/workshop">
              <img src="/media/disfuse-clear.png" alt="" />
              <span>Workshop</span>
            </Link>
          </div>
          <h1 className="packName">{pack.name}</h1>
          <i className="blockCount">
            <i class="fa-solid fa-cubes"></i> {blocks.length} block
            {blocks.length === 1 ? "" : "s"}
          </i>
        </div>
        <div>
          <i style={{ display: "flex", gap: ".5rem" }}>
            {pack.versions?.length ? (
              <>
                <i className="fa-solid fa-upload"></i>
                Last published
                {" " +
                  new Date(
                    pack.versions[pack.versions.length - 1]?.releaseDate || 0
                  ).toLocaleString([], {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
              </>
            ) : (
              <>
                <i className="fa-solid fa-folder-minus"></i> Unpublished
              </>
            )}
          </i>
          <button
            onClick={configurePack}
            className={isLoading ? "disabled" : ""}
          >
            <i className="fa-solid fa-sliders"></i> Configure
          </button>
          <button
            onClick={publishPack}
            className={
              isLoading ||
              !blocks.length ||
              arraysAreEqual(
                blocks,
                pack.versions[pack.versions.length - 1]?.blocks || []
              )
                ? "disabled"
                : ""
            }
          >
            <i className="fa-solid fa-upload"></i> Publish
          </button>
        </div>
      </div>
      <div className="workspace-load-container">
        {isLoading ? <LoadingAnim /> : ""}
      </div>
      <div className="workshop-workspace-container">
        <div id="workshopWorkspace"></div>
        {workspace && <PreviewBox key={1} blocks={blocks} />}
      </div>
    </>
  );

  function configurePack() {
    if (isLoading) return;
    const modalColors = modalThemeColor(user, false);

    Swal.fire({
      title: "Configure Block Pack",
      html: renderToStaticMarkup(
        <div className="configurePackModal">
          <div className="name">
            <label for="name">Pack Name:</label>
            <input type="text" defaultValue={pack.name} id="packNameInput" />
          </div>
          <span className="separator"></span>
          <div className="description">
            <label for="description">Pack Description:</label>
            <textarea
              defaultValue={pack.description}
              placeholder="Describe the blocks in your pack..."
              id="packDescriptionInput"
              rows="4"
            />
          </div>
          <span className="separator"></span>
          <div className="dependencies">
            <label htmlFor="dependenciesInput">Dependencies</label>
            <p>Add any npm modules your pack requires, separated by commas</p>
            <p>These modules will be automatically added to package.json:</p>
            <textarea
              placeholder="packageOne, packageTwo, etc..."
              id="dependenciesInput"
              defaultValue={(pack?.dependencies || []).join(", ")}
            ></textarea>
          </div>
          <span className="separator"></span>
          <div className="colorPicker">
            <label for="color">Pack Color:</label>
            <p>This is the color your category will be in the toolbox:</p>
            <input
              type="color"
              id="packColorPicker"
              defaultValue={pack.color}
            />
          </div>
        </div>
      ),
      confirmButtonText: "Save",
      showCancelButton: true,
      ...modalColors,
    }).then((r) => {
      if (!r.isConfirmed) return;

      const name = document.getElementById("packNameInput").value;
      const color = document.getElementById("packColorPicker").value;
      const description = document.getElementById("packDescriptionInput").value;
      const dependencies = (
        document.getElementById("dependenciesInput").value || ""
      )
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      axios
        .patch(
          apiUrl + `/workshop/${packId}`,
          {
            name,
            color,
            description,
            dependencies,
          },
          {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          }
        )
        .then((res) => {
          setPack(res.data);

          Swal.fire({
            icon: "success",
            text: "Pack updated successfully",
            toast: true,
            position: "top-right",
            timer: 5000,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        });
    });
  }

  function arraysAreEqual(arr1, arr2) {
    arr1 = arr1.sort((a, b) => a.name.localeCompare(b.name));
    arr2 = arr2.sort((a, b) => a.name.localeCompare(b.name));

    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
        return false;
      }
    }
    return true;
  }

  function publishPack() {
    if (
      arraysAreEqual(
        blocks,
        pack.versions[pack.versions.length - 1]?.blocks || []
      )
    )
      return;

    const modalColors = modalThemeColor(user, false);

    const latestVersion = (
      pack.versions[pack.versions.length - 1]?.version || "0.0.0"
    )?.split(".");

    Swal.fire({
      ...modalColors,
      title: "Publish Block Pack",
      html: '<div class="publishPackModal swal-no-scroll"></div>',
      didOpen: () => {
        const container =
          document.getElementsByClassName("publishPackModal")[0];
        if (container) {
          ReactDOM.createRoot(container).render(
            <>
              <div className="version">
                <label htmlFor="version">Version:</label>
                <div className="versionInputs">
                  <input
                    defaultValue={latestVersion[0]}
                    min={1}
                    type="number"
                    className="packVersionInput"
                  />
                  .
                  <input
                    defaultValue={latestVersion[1]}
                    min={0}
                    type="number"
                    className="packVersionInput"
                  />
                  .
                  <input
                    defaultValue={latestVersion[2]}
                    min={0}
                    type="number"
                    className="packVersionInput"
                  />
                </div>
              </div>
              <div className="changelog">
                <label htmlFor="changelog">Changelog:</label>
                <textarea
                  placeholder="Describe your changes..."
                  id="packChangelogInput"
                  rows="4"
                ></textarea>
              </div>
            </>
          );
        }
      },
      confirmButtonText: "Publish",
      showLoaderOnConfirm: true,
      showCancelButton: true,
      preConfirm: () => {
        const version = [
          document.getElementsByClassName("packVersionInput")[0].value,
          document.getElementsByClassName("packVersionInput")[1].value,
          document.getElementsByClassName("packVersionInput")[2].value,
        ].join(".");
        const changelog = document.getElementById("packChangelogInput").value;

        if (
          parseInt(latestVersion.join("")) >=
          parseInt(version.replaceAll(".", ""))
        ) {
          Swal.showValidationMessage(
            "The new version must be higher than the current version"
          );
          return false;
        }

        if (changelog.length < 10) {
          Swal.showValidationMessage(
            "The changelog must be at least 10 characters long"
          );
          return false;
        }

        return {
          version,
          changelog,
        };
      },
    }).then((r) => {
      if (!r.isConfirmed) return;

      axios
        .patch(
          apiUrl + `/workshop/${packId}/blocks`,
          { blocks, ...r.value },
          {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          }
        )
        .then((res) => {
          setPack(res.data);

          Swal.fire({
            icon: "success",
            text: "Pack published successfully",
            toast: true,
            position: "top-right",
            timer: 5000,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        })
        .catch((e) => {
          if (e.response.data.error === "There were errors when publishing.")
            Swal.fire({
              ...modalColors,
              icon: "error",
              title: "Errors Found",
              footer:
                '<a target="_blank" rel="noopener" style="color: lightblue" href="https://dsc.gg/disfuse">Join our Discord for support</a>',
              html: `There were problems publishing your pack:
            <br />
            <br />
            ${e.response.data.errors
              .map((b) => `<strong>${b[0]}</strong>: ${b[1]}`)
              .join("<br />")}
              <br />
              <br />
              This means you have changed your blocks in such a way that they would cause other projects that use these blocks to become corrupt. Please fix the issues and try again.`,
            });
          else if (e.response.data.error === "At least one block is required")
            Swal.fire({
              ...modalColors,
              icon: "error",
              title: "Error",
              text: "At least one block is required",
            });
        });
    });
  }
}
