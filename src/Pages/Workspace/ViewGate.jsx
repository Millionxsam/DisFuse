import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api, { data } from "../../api/client.js";
import LoadingAnim from "../../components/LoadingAnim";
import ReadOnlyView from "../../builder/pages/ReadOnlyView.jsx";
import ViewProject from "../Dashboard/Projects/ViewProject.jsx";

/* /@user/:projectId/view, for either editor: the block editor's
   read-only workspace, or DisFuse Builder's read-only steps. */

export default function ViewGate() {
  const { projectId } = useParams();
  const [type, setType] = useState(null);

  useEffect(() => {
    let current = true;
    setType(null);
    api
      .get(`/projects/${projectId}`)
      .then(data)
      .then((project) => current && setType(project?.type === "builder" ? "builder" : "blocks"))
      .catch(() => current && setType("blocks"));
    return () => {
      current = false;
    };
  }, [projectId]);

  if (!type)
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <LoadingAnim />
      </div>
    );

  return type === "builder" ? <ReadOnlyView /> : <ViewProject />;
}
