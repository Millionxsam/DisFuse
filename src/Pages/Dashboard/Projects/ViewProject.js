import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingAnim from "../../../components/LoadingAnim";
import * as Blockly from "blockly";

import getToolbox from "../../../config/toolbox";
import { DFTheme } from "../../../components/themes/DFTheme";
import axios from "axios";
import UserTag from "../../../components/UserTag";
import WorkspaceTabs from "../../../components/WorkspaceTabs";
const { apiUrl } = require("../../../config/config.js");

export default function ViewProject() {
  let { projectId } = useParams();
  const [isLoading, setLoading] = useState(true);
  const [project, setProject] = useState({});
  const [currentWorkspace, setCurrentWorkspace] = useState({});
  const [workspace, setWorkspace] = useState({});

  useEffect(() => {
    axios
      .get(apiUrl + `/projects/${projectId}`, {
        headers: { Authorization: localStorage.getItem("disfuse-token") },
      })
      .then(({ data: project }) => {
        setProject(project);

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
          }
        );

        setCurrentWorkspace(project.workspaces[0] || {});

        if (!project.workspaces?.length && project.data?.length > 0) {
          // for old projects that haven't migrated to subworkspaces yet
          Blockly.serialization.workspaces.load(
            JSON.parse(project.data),
            workspace
          );
        } else
          Blockly.serialization.workspaces.load(
            JSON.parse(project.workspaces[0].data),
            workspace
          );

        setWorkspace(workspace);
        setLoading(false);
      });
  }, [projectId]);

  return (
    <>
      <div className="previewWorkspaceNavbar">
        <Link to={`/@${project.owner?.username}/${project._id}`}>
          <button style={{ fontSize: "17px" }}>
            <i className="fa-solid fa-arrow-left"></i>
            <p>Back to project info</p>
          </button>
        </Link>

        <div>
          <h1 className="projectName">{project.name}</h1>
          by
          <UserTag user={project.owner} />
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
    setCurrentWorkspace(project.workspaces[index]);

    if (project.workspaces[index].data?.length)
      Blockly.serialization.workspaces.load(
        JSON.parse(project.workspaces[index].data),
        workspace
      );
    else workspace.clear();
  }
}
