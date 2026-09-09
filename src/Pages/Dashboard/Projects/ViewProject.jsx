import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import LoadingAnim from "../../../components/LoadingAnim";
import * as Blockly from "blockly";

import getToolbox from "../../../config/toolbox";

/* Registers every DisFuse block definition and generator. Without it
   this page injects a toolbox full of block types Blockly has never been
   told about, and a saved project loaded here renders as nothing. It used
   to be a glob that only the editor page had. */
import "../../../blocks/index.js";
import { DFTheme } from "../../../components/themes/DFTheme";
import axios from "axios";
import UserTag from "../../../components/UserTag";
import WorkspaceTabs from "../../../components/WorkspaceTabs";
import javascript from "blockly/javascript.js";
import { apiUrl } from "../../../config/config.js";
import { useNavigate } from "react-router-dom";
import {
  getVersion,
  getVersions,
  latestVersion,
} from "../../../api/versions.js";

/**
 * Read-only view of somebody else's project.
 *
 * A project shows one set of workspaces here, and which set depends on
 * the system it is on: its own `workspaces`, or the workspaces inside
 * one of its versions. On a Version Control project the newest version
 * is shown first — that is the project as it stands — and the picker
 * beside the title opens any of the others.
 */
export default function ViewProject() {
  let { projectId } = useParams();
  const [isLoading, setLoading] = useState(true);
  const [project, setProject] = useState({});
  const [currentWorkspace, setCurrentWorkspace] = useState({});
  const [workspace, setWorkspace] = useState({});
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(apiUrl + `/projects/${projectId}`, {
        headers: { Authorization: localStorage.getItem("disfuse-token") },
      })
      .then(async ({ data: project }) => {
        const customBlocks = [...(project.owner.customBlocks || [])];

        for (let id of project.collaborators) {
          const collaborator = (
            await axios.get(apiUrl + `/users/${id}`, {
              headers: {
                Authorization: localStorage.getItem("disfuse-token"),
              },
            })
          ).data;

          customBlocks.push(...(collaborator.customBlocks || []));
        }

        if (customBlocks.length) {
          Blockly.defineBlocksWithJsonArray(
            customBlocks.map((b) => b.definition),
          );

          customBlocks.forEach((customBlock) => {
            try {
              // eslint-disable-next-line no-new-func
              const genCode = new Function(
                "javascript",
                customBlock.javascriptGenerator,
              );

              genCode(javascript);
            } catch {}
          });
        }

        const workspace = Blockly.inject(
          document.getElementById("previewWorkspace"),
          {
            readOnly: true,
            toolbox: getToolbox(),
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
          },
        );

        /* A project that has never used Version Control answers with an
           empty list here, and everything below then reads its own
           workspaces exactly as it always has. */
        const state = await getVersions(projectId).catch(() => null);
        const available = state?.versions || [];

        let shown = project.workspaces || [];
        let opened = null;

        if (available.length) {
          opened = latestVersion(available);

          const full = await getVersion(projectId, opened._id).catch(
            () => null,
          );

          shown = full?.workspaces || [];
        }

        setVersions(available);
        setActiveVersionId(opened ? String(opened._id) : null);
        setProject({ ...project, workspaces: shown });
        setCurrentWorkspace(shown[0] || {});

        if (shown.length) loadBlocks(workspace, shown[0].data);
        else if (project.data?.length) {
          /* Old projects from before sub-workspaces existed. */
          loadBlocks(workspace, project.data);
        }

        setWorkspace(workspace);
        setLoading(false);
      });
  }, [projectId]);

  return (
    <>
      <Helmet>
        <title>{`${project.name || "View Project"} | DisFuse`}</title>
      </Helmet>
      <div className="previewWorkspaceNavbar">
        <Link to={`/@${project.owner?.username}/${project._id}`}>
          <button style={{ fontSize: "17px" }}>
            <i className="fa-solid fa-arrow-left"></i>
            <p>Back to project info</p>
          </button>
        </Link>

        <div>
          <div
            className="projectName"
            onClick={() =>
              navigate("/@" + project.owner?.username + "/" + project._id)
            }
          >
            <p>{project.name}</p>
          </div>
          by
          <UserTag user={project.owner} />
          {versions.length ? (
            <label className="previewVersionPicker" title="Version">
              <i className="fa-solid fa-code-branch"></i>
              <select
                value={activeVersionId ?? ""}
                onChange={(e) => switchVersion(e.target.value)}
              >
                {[...versions]
                  .sort((a, b) => (b.number ?? 0) - (a.number ?? 0))
                  .map((version) => (
                    <option key={version._id} value={version._id}>
                      {version.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            ""
          )}
        </div>
      </div>
      <WorkspaceTabs
        onClick={loadTab}
        currentTab={currentWorkspace}
        project={project}
        workspace={workspace}
        editable={false}
      />
      <div className="workspace-load-container">
        {isLoading ? <LoadingAnim /> : ""}
      </div>
      <div id="previewWorkspace"></div>
    </>
  );

  async function loadTab(index) {
    const target = project.workspaces?.[index];
    if (!target) return;

    setCurrentWorkspace(target);
    loadBlocks(workspace, target.data);
  }

  /** Shows another version of this project. */
  async function switchVersion(versionId) {
    if (String(versionId) === String(activeVersionId)) return;

    setLoading(true);

    try {
      const opened = await getVersion(projectId, versionId);
      const shown = opened.workspaces || [];

      setActiveVersionId(String(opened._id));
      setProject({ ...project, workspaces: shown });
      setCurrentWorkspace(shown[0] || {});

      if (shown.length) loadBlocks(workspace, shown[0].data);
      else workspace.clear();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
}

/** Puts saved blocks on screen, tolerating an empty or broken workspace. */
function loadBlocks(workspace, data) {
  if (!workspace?.clear) return;

  if (!data?.length) return workspace.clear();

  try {
    Blockly.serialization.workspaces.load(JSON.parse(data), workspace);
  } catch (error) {
    console.error(error);
    workspace.clear();
  }
}
