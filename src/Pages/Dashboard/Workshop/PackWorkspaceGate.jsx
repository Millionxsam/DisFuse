import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import api, { data } from "../../../api/client.js";
import LoadingAnim from "../../../components/LoadingAnim";
import { userCache } from "../../../cache.ts";
import { packType } from "../../../builder/model/packs.js";
import PackApp from "../../../builder/pages/PackApp.jsx";
import WorkshopWorkspace from "./WorkshopWorkspace";

/* =====================================================================
   One address, two pack editors
   ---------------------------------------------------------------------
   /workshop/:packId/workspace opens whichever editor the pack was made
   for, the way /workspace does for projects: the Blockly workshop for
   block packs (every pack from before DisFuse Builder), or the builder
   pack editor for builder packs.

   The block workshop loads its pack itself and handles anything that
   goes wrong (not found, someone else's), so anything but a builder
   pack the viewer owns is handed to it unchanged.
   ===================================================================== */

export default function PackWorkspaceGate() {
  const { packId } = useParams();
  const [found, setFound] = useState(null);

  useEffect(() => {
    let current = true;
    setFound(null);
    api
      .get(`/workshop/${packId}`)
      .then(data)
      .then((pack) => current && setFound({ pack }))
      .catch(() => current && setFound({ pack: null }));
    return () => {
      current = false;
    };
  }, [packId]);

  if (!found)
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <LoadingAnim />
      </div>
    );

  const { pack } = found;
  if (packType(pack) !== "builder") return <WorkshopWorkspace />;

  /* Someone else's pack: its page, where they can install it. */
  if (pack.owner !== userCache.user?.id) return <Navigate to={`/workshop/${packId}`} replace />;

  return <PackApp key={pack._id} pack={pack} />;
}
