import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Blockly from "blockly";
import UserTag from "./UserTag";
import { userCache } from "../cache.ts";
import Swal from "sweetalert2";
import modalThemeColor from "../functions/modalThemeColor.js";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";
import javascript, { javascriptGenerator } from "blockly/javascript";
import getToolbox from "../config/toolbox.js";
import LoadingAnim from "./LoadingAnim";
import { io } from "socket.io-client";
import HostModal from "./HostModal.js";

const { apiUrl, hostUrl } = require("../config/config.js");

export default function WorkspaceBar({
  project,
  workspace,
  currentWorkspace,
  activeUsers = [],
}) {
  const [active, setActive] = useState(false);
  const [blockbuddySuggestRes, setBlockbuddyRes] = useState("");
  const [fileDropdownOpen, setFileDropdown] = useState(false);
  const [utilDropdownOpen, setUtilDropdown] = useState(false);
  const [socket, setSocket] = useState();

  useEffect(() => {
    setSocket(
      io(hostUrl, {
        auth: { token: localStorage.getItem("disfuse-token") },
      })
    );
  }, []);

  // exportBlockInfo();

  function showSecrets() {
    if (project.owner?.id !== userCache.user.id) return;
    document.querySelector(".secrets-view").showModal();
  }

  function openMenu() {
    if (!active) {
      if (document.body.clientWidth <= 396) {
        document.querySelector(
          ".workspace-navbar .content-container"
        ).style.height = "45%";
      } else {
        document.querySelector(
          ".workspace-navbar .content-container"
        ).style.height = "30vh";
      }

      setActive(true);
    } else {
      document.querySelector(
        ".workspace-navbar .content-container"
      ).style.height = "0";

      setActive(false);
    }
  }

  return (
    <>
      <HostModal
        socket={socket}
        project={project}
        workspace={workspace}
        workspaceId={currentWorkspace._id}
      />
      <dialog className="blockBuddy-suggestions">
        <h1>Suggestions</h1>
        {blockbuddySuggestRes === "" ? (
          <LoadingAnim />
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {blockbuddySuggestRes}
          </ReactMarkdown>
        )}

        <button
          onClick={() =>
            document.querySelector("dialog.blockBuddy-suggestions").close()
          }
        >
          Close
        </button>
      </dialog>
      <div className="workspace-navbar">
        <div className="logo">
          <Link to="/projects">
            <img src="/media/disfuse-clear.png" alt="" />
          </Link>
        </div>
        <div className="projectName">
          <p></p>
        </div>
        <div id="workspace-tabs-open-container">
          <i
            onClick={() => openWorkspaceTabs(workspace)}
            className="workspace-tabs-open fa-solid fa-chevron-down"
          ></i>
        </div>
        <div className="content-container">
          <div className="left">
            <ul>
              <div className="dropdown" style={{ position: "relative" }}>
                <button
                  className="dropdown-button"
                  onClick={() => {
                    setFileDropdown(!fileDropdownOpen);
                    setUtilDropdown(false);
                  }}
                >
                  <i className="fa-solid fa-file"></i>
                  <div>File</div>
                  <i
                    className={`fa-solid fa-chevron-${
                      fileDropdownOpen ? "up" : "down"
                    } noRotate`}
                  ></i>
                </button>
                <div
                  className="dropdown-content"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    zIndex: 1000,
                    flexDirection: "column",
                    alignContent: "center",
                    alignItems: "center",
                    justifyItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    display: fileDropdownOpen ? "flex" : "none",
                  }}
                >
                  <button
                    id="save"
                    onClick={() => {
                      setFileDropdown(false);
                      setUtilDropdown(false);
                    }}
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    Save File
                  </button>
                  <button
                    id="load"
                    onClick={() => {
                      setFileDropdown(false);
                      setUtilDropdown(false);
                    }}
                  >
                    <i className="fa-solid fa-upload"></i>
                    Load File
                  </button>
                  <button
                    onClick={() => {
                      setFileDropdown(false);
                      setUtilDropdown(false);
                    }}
                    id="showCode"
                  >
                    <i className="fa-brands fa-square-js"></i>
                    <div>Show Code</div>
                  </button>
                </div>
              </div>
              <div className="dropdown" style={{ position: "relative" }}>
                <button
                  className="dropdown-button"
                  onClick={() => {
                    setUtilDropdown(!utilDropdownOpen);
                    setFileDropdown(false);
                  }}
                >
                  <i className="fa-solid fa-wrench"></i>
                  <div>Utilities</div>
                  <i
                    className={`fa-solid fa-chevron-${
                      utilDropdownOpen ? "up" : "down"
                    } noRotate`}
                  ></i>
                </button>
                <div
                  className="dropdown-content"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    zIndex: 1000,
                    flexDirection: "column",
                    alignContent: "center",
                    alignItems: "center",
                    justifyItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    display: utilDropdownOpen ? "flex" : "none",
                  }}
                >
                  <button
                    className="secrets"
                    onClick={() => {
                      setFileDropdown(false);
                      setUtilDropdown(false);
                      showSecrets();
                    }}
                  >
                    <i className="fa-solid fa-key"></i>
                    <div>Secrets</div>
                  </button>
                  <button
                    id="templates"
                    onClick={() => {
                      setFileDropdown(false);
                      setUtilDropdown(false);
                    }}
                  >
                    <i className="fa-solid fa-shapes"></i>
                    <div>Templates</div>
                  </button>
                </div>
              </div>

              <button id="blockbuddy" onClick={openBlockBuddy}>
                <i className="fa-solid fa-robot"></i>
                <div>BlockBuddy</div>
              </button>
            </ul>
          </div>
          <div className="right">
            <ul>
              {activeUsers.length >= 2 ? (
                <div className="activeUsers">
                  <div
                    onClick={() =>
                      document
                        .querySelector(".activeUsers ul")
                        .classList.toggle("active")
                    }
                  >
                    {activeUsers.map((user) => (
                      <img
                        src={
                          user?.avatar ??
                          "https://cdn.discordapp.com/embed/avatars/0.png"
                        }
                        alt=""
                      />
                    ))}{" "}
                    {activeUsers.length} Active User
                    {activeUsers.length === 1 ? "" : "s"}
                    <i class="fa-solid fa-chevron-down"></i>
                  </div>
                  <ul>
                    {activeUsers.map((user) => (
                      <li>
                        <UserTag user={user} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                ""
              )}

              <i className="indicator" id="blocks-indicator"></i>
              <i
                className="indicator"
                id="autosave-indicator"
                style={{ display: "none" }}
              >
                Autosave
              </i>
              <button className="invite">
                <div>Invite</div>
                <i className="fa-solid fa-share"></i>
              </button>
              <button
                className="host"
                style={{
                  borderRadius: "1.5rem .25rem .25rem 1.5rem",
                }}
              >
                {localStorage.getItem("hostingOnboardingComplete") ? (
                  ""
                ) : (
                  <i className="newLabel noRotate">New</i>
                )}
                <div>Host</div>
                <i className="fa-solid fa-server"></i>
              </button>
              <button
                className="export"
                style={{
                  borderRadius: ".25rem 1.5rem 1.5rem .25rem",
                  marginLeft: "-.35vw",
                }}
              >
                <div>Export</div>
                <i className="fa-solid fa-download"></i>
              </button>
            </ul>
          </div>
        </div>
        <i onClick={openMenu} className="fa-solid fa-bars menu"></i>
      </div>
    </>
  );

  // eslint-disable-next-line
  function openBlockBuddy() {
    const modalColors = modalThemeColor(userCache.user);

    Swal.fire({
      ...modalColors,
      title: "BlockBuddy",
      showConfirmButton: false,
      showCancelButton: true,
      footer: "BlockBuddy is only for simple tasks; it may make mistakes",
      didOpen: () => {
        document
          .querySelector(".blockBuddy-container #suggest")
          .addEventListener("click", async () => {
            setBlockbuddyRes("");

            Swal.fire({
              ...modalColors,
              title: "BlockBuddy Suggest",
              confirmButtonText: "Generate",
              showCancelButton: true,
              inputPlaceholder: "What should I name my bot?",
              html: `Ask BlockBuddy a question or leave blank to suggest changes

              <br />
              <br />
              
              <select id="blockBuddy-suggestion-context">
                <option value="project">Whole project</option>
                <option value="workspace">Only this workspace</option>
              </select>`,
              input: "text",
            }).then(async (v) => {
              if (!v.isConfirmed) return;

              document
                .querySelector("dialog.blockBuddy-suggestions")
                .showModal();

              const stream = await fetch(
                apiUrl + `/projects/${project._id}/blockbuddy/suggest`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    prompt: v.value,
                    context:
                      document.querySelector("#blockBuddy-suggestion-context")
                        .value === "project"
                        ? "project"
                        : currentWorkspace._id,
                  }),
                  headers: {
                    authorization: localStorage.getItem("disfuse-token"),
                    "content-type": "application/json",
                  },
                }
              );

              const reader = stream.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                setBlockbuddyRes((prev) => prev + decoder.decode(value));
              }
            });
          });

        document
          .querySelector(".blockBuddy-container #create")
          .addEventListener("click", async () => {
            Swal.fire({
              ...modalColors,
              title: "BlockBuddy Create",
              confirmButtonText: "Create",
              showCancelButton: true,
              inputPlaceholder: "A block that logs something in the console",
              html: "Describe one or more blocks to create",
              input: "text",
              showLoaderOnConfirm: true,
              preConfirm: async (prompt) => {
                return (
                  await axios.post(
                    apiUrl + `/users/${userCache.user.id}/blockbuddy/blocks`,
                    {
                      prompt,
                    },
                    {
                      headers: {
                        Authorization: localStorage.getItem("disfuse-token"),
                      },
                    }
                  )
                ).data;
              },
            }).then(async (response) => {
              if (!response.isConfirmed) return;

              Blockly.defineBlocksWithJsonArray(
                response.value.map((b) => b.definition)
              );

              response.value.forEach((customBlock) => {
                const bl = workspace.newBlock(customBlock.definition.type);
                bl.initSvg();
                bl.render();
                bl.setDeletable(true);

                // eslint-disable-next-line no-new-func
                const genCode = new Function(
                  "javascript",
                  customBlock.javascriptGenerator
                );

                genCode(javascript);
              });

              let installedBlockPacks = [];

              const responses = await Promise.all(
                userCache.user.installedBlockPacks?.map((packId) =>
                  axios.get(apiUrl + `/workshop/${packId}`, {
                    headers: {
                      Authorization: localStorage.getItem("disfuse-token"),
                    },
                  })
                )
              );

              installedBlockPacks = responses.map((response) => response.data);

              userCache.user.customBlocks = [
                ...(userCache.user.customBlocks || []),
                ...response.value,
              ];

              workspace.updateToolbox(
                getToolbox(installedBlockPacks, userCache.user)
              );
            });
          });
        document
          .querySelector(".blockBuddy-container #complete")
          .addEventListener("click", async () => {
            Swal.fire({
              ...modalColors,
              title: "BlockBuddy Complete",
              confirmButtonText: "Generate",
              showCancelButton: true,
              inputPlaceholder: "Create a simple help command",
              html: "Describe a command or feature to create",
              input: "text",
              showLoaderOnConfirm: true,
              preConfirm: async (prompt) => {
                const blockTypes = Object.keys(Blockly.Blocks);
                const blockSchemas = blockTypes
                  .map(getBlockMetadata)
                  .filter(Boolean);

                return (
                  await axios.post(
                    apiUrl + `/projects/${project._id}/blockbuddy/complete`,
                    {
                      prompt,
                      availableBlocks: blockSchemas,
                    },
                    {
                      headers: {
                        Authorization: localStorage.getItem("disfuse-token"),
                      },
                    }
                  )
                ).data;
              },
            }).then((response) => {
              if (!response.isConfirmed) return;

              try {
                Blockly.Xml.domToWorkspace(
                  Blockly.utils.xml.textToDom(response.value.xml),
                  workspace
                );

                Swal.fire({
                  ...modalColors,
                  title: "BlockBuddy Complete",
                  text: response.value.completionText,
                });
              } catch (e) {
                console.error(e);

                Swal.fire({
                  ...modalColors,
                  title: "There was a problem",
                  icon: "error",
                  text: "There was a problem generating the blocks. Please try again.",
                });
              }
            });
          });
        document
          .querySelector(".blockBuddy-container #convert")
          .addEventListener("click", async () => {
            Swal.fire({
              ...modalColors,
              title: "BlockBuddy Convert",
              confirmButtonText: "Convert",
              showCancelButton: true,
              html: "Insert the contents of your index.js file below",
              input: "textarea",
              showLoaderOnConfirm: true,
              preConfirm: async (code) => {
                const blockTypes = Object.keys(Blockly.Blocks);
                const blockSchemas = blockTypes
                  .map(getBlockMetadata)
                  .filter(Boolean);

                return (
                  await axios.post(
                    apiUrl + `/projects/${project._id}/blockbuddy/convert`,
                    {
                      code,
                      availableBlocks: blockSchemas,
                    },
                    {
                      headers: {
                        Authorization: localStorage.getItem("disfuse-token"),
                      },
                    }
                  )
                ).data;
              },
            }).then((response) => {
              if (!response.isConfirmed) return;

              try {
                Blockly.Xml.domToWorkspace(
                  Blockly.utils.xml.textToDom(response.value.xml),
                  workspace
                );

                Swal.fire({
                  ...modalColors,
                  title: "BlockBuddy Convert",
                  text: response.value.completionText,
                });
              } catch (e) {
                console.error(e);

                Swal.fire({
                  ...modalColors,
                  title: "There was a problem",
                  icon: "error",
                  text: "There was a problem generating the blocks. Please try again.",
                });
              }
            });
          });
      },
      html: renderToStaticMarkup(
        <>
          <div className="blockBuddy-container">
            <div id="complete">
              <div>
                <i class="fa-solid fa-cubes-stacked"></i>
                <h3>Complete</h3>
              </div>
              <p>Create commands or features using toolbox blocks</p>
            </div>
            <div id="suggest">
              <div>
                <i class="fa-solid fa-list-check"></i>
                <h3>Suggest</h3>
              </div>
              <p>Make a list of changes or improvements for your bot</p>
            </div>
            <div id="create">
              <div>
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <h3>Create</h3>
              </div>
              <p>Describe custom blocks to create</p>
            </div>
            <div id="convert">
              <div>
                <i class="fa-solid fa-repeat"></i>
                <h3>Convert</h3>
              </div>
              <p>Convert JavaScript code to blocks</p>
            </div>
          </div>
        </>
      ),
    }).then(() => localStorage.setItem("blockBuddy-discovered", true));
  }

  // This function is used to export the information of all blocks to a json file.
  // This file is used in the DisFuse bot in order to provide support in the Discord server using AI.

  // function exportBlockInfo() {
  //   const blockTypes = Object.keys(Blockly.Blocks);
  //   const blockSchemas = blockTypes.map(getBlockMetadata).filter(Boolean);

  //   const zip = new JSZip();
  //   zip.file("f.json", JSON.stringify(blockSchemas));

  //   zip.generateAsync({ type: "blob" }).then((content) => {
  //     let url = window.URL.createObjectURL(content);
  //     let anchor = document.createElement("a");
  //     anchor.href = url;
  //     anchor.download = `test.zip`;

  //     anchor.click();

  //     window.URL.revokeObjectURL(url);
  //   });
  // }
}

function getBlockMetadata(blockType) {
  const blockDef = Blockly.Blocks[blockType];
  if (!blockDef) return null;

  const workspace = Blockly.inject(document.createElement("div"), {
    toolbox: null,
  });
  const block = workspace.newBlock(blockType);

  const metadata = {
    type: blockType,
    inputs: {},
    fields: {},
    output: block.outputConnection?.check_ ?? null,
    hasPreviousStatement: block.previousConnection !== null,
    hasNextStatement: block.nextConnection !== null,
    code: null,
  };

  for (const input of block.inputList) {
    metadata.inputs[input.name] = {
      inputType:
        input.type === Blockly.INPUT_VALUE
          ? "value"
          : input.type === Blockly.NEXT_STATEMENT
          ? "statement"
          : "dummy",
      check: input.connection?.check_ ?? null,
    };
  }

  for (const input of block.inputList) {
    for (const field of input.fieldRow) {
      metadata.fields[field.name] = {
        type: field.constructor.name,
        value: field.getValue(),
      };
    }
  }

  javascriptGenerator.init(workspace);

  try {
    const generatedCode = javascriptGenerator.blockToCode(block);
    metadata.code = Array.isArray(generatedCode)
      ? generatedCode[0]
      : generatedCode;
  } catch (e) {
    console.error(e);
    metadata.code = "// Code generation failed";
  }

  block.dispose();
  workspace.dispose();

  return metadata;
}

function openWorkspaceTabs(workspace) {
  document.querySelector(".workspace-tabs").style.height = "5vh";
  document.querySelector(
    ".workspace-navbar .workspace-tabs-open"
  ).style.opacity = "0";

  Blockly.svgResize(workspace);

  setTimeout(() => {
    document.getElementById("workspace-tabs-open-container").style.width = "0";
    document.querySelector("#workspace").style.height = "87.5vh";

    Blockly.svgResize(workspace);

    setTimeout(() => {
      Blockly.svgResize(workspace);
    }, 310);
  }, 310);
}
