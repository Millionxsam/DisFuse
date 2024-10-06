import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CodeView from "../../../components/CodeView";
import LoadingAnim from "../../../components/LoadingAnim";
import * as Blockly from "blockly";

import { toolbox } from "../../../config/toolbox";
import { DFTheme } from "../../../components/themes/DFTheme";
import axios from "axios";
import UserTag from "../../../components/UserTag";
const { apiUrl } = require("../../../config/config.json");

export default function ViewProject() {
  let { projectId } = useParams();
  const [isLoading, setLoading] = useState(true);
  const [project, setProject] = useState({});

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
            toolbox,
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

        setLoading(false);

        if (project.data) {
          Blockly.serialization.workspaces.load(
            JSON.parse(project.data),
            workspace
          );
        }
      });
  }, []);

  return (
    <>
      <div className="previewWorkspaceNavbar">
        <Link to={`/@${project.author?.username}/${project._id}`}>
          <button style={{ fontSize: "17px" }}>
            <i class="fa-solid fa-arrow-left"></i>
            <p>Back to project info</p>
          </button>
        </Link>
        <div>
          <h1 className="projectName">{project.name}</h1>
          by
          <UserTag user={project.owner} />
        </div>
      </div>
      <div className="workspace-load-container">
        {isLoading ? <LoadingAnim /> : ""}
      </div>
      <div id="previewWorkspace"></div>
    </>
  );
}
