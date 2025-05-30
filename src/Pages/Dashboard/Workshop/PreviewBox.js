import * as Blockly from "blockly";
import { useEffect, useState } from "react";
import { DFTheme } from "../../../components/themes/DFTheme";
import registerCustomBlocks from "../../../functions/registerCustomBlocks";
import getToolbox from "../../../config/toolbox";
import { javascriptGenerator } from "blockly/javascript";
import hljs from "highlight.js/lib/core";
import beautify from "beautify";
import javascript from "highlight.js/lib/languages/javascript";

hljs.registerLanguage("javascript", javascript);

export default function PreviewBox({ blocks = [] }) {
  const [previewWorkspace, setWorkspace] = useState();

  useEffect(() => {
    const workspace = Blockly.inject(
      document.getElementById("workshopPreviewWorkspace"),
      {
        toolbox: getToolbox([]),
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

    workspace.addChangeListener(() => {
      const code = javascriptGenerator.workspaceToCode(workspace);

      document.getElementById("workshopPreviewCode").innerHTML = hljs.highlight(
        beautify(code, {
          format: "js",
        }),
        {
          language: "javascript",
        }
      ).value;
    });
  }, []);

  useEffect(() => {
    if (!previewWorkspace) return;
    previewWorkspace.clear();
    registerCustomBlocks(blocks, previewWorkspace);
  }, [blocks, previewWorkspace]);

  return (
    <>
      <div className="workshopPreview">
        <h1>Preview</h1>
        <div id="workshopPreviewWorkspace"></div>
        <h1>Output</h1>
        <pre id="workshopPreviewCode"></pre>
      </div>
    </>
  );
}
