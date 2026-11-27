import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api, { data } from "../../api/client.js";
import LoadingAnim from "../../components/LoadingAnim";
import BuilderApp from "../../builder/pages/BuilderApp.jsx";
import Workspace from "./index.jsx";

/* =====================================================================
   One address, two editors
   ---------------------------------------------------------------------
   /@user/:projectId/workspace opens whichever editor the project was
   made with. DisFuse Builder projects have `type: "builder"`; everything
   else (including every project from before DisFuse Builder, which has
   no type at all) opens the block editor exactly as it always has.

   Only the type is needed to decide, so this asks for the project once
   and hands off. The block editor loads its project over its own socket
   as before; the builder loads its data itself.
   ===================================================================== */

export default function WorkspaceGate() {
  const { projectId } = useParams();
  const [type, setType] = useState(null);

  useEffect(() => {
    let current = true;
    setType(null);
    api
      .get(`/projects/${projectId}`)
      .then(data)
      .then((project) => current && setType(project?.type === "builder" ? "builder" : "blocks"))
      /* If the project can't be read here, the block editor has always
         been the one to explain why (not found, private, suspended). */
      .catch(() => current && setType("blocks"));
    return () => {
      current = false;
    };
  }, [projectId]);

  if (!type)
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#050913" }}>
        <LoadingAnim />
      </div>
    );

  return type === "builder" ? <BuilderApp /> : <Workspace />;
}
