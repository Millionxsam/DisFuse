import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { sitesUrl } from "../../config/config";
import LoadingAnim from "../LoadingAnim";

/**
 * Published websites used to be served from disfuse.xyz/site/:botID.
 * They now live in their own application at sites.disfuse.xyz, so this
 * route only exists to forward the links that are already out there.
 *
 * The bot ID still resolves on the new host — a custom URL is an
 * addition, never a replacement — so an old link keeps working whether
 * or not the owner has chosen one since.
 */
export default function PublishedSiteRedirect() {
  const { botID, pagePath } = useParams();

  useEffect(() => {
    window.location.replace(
      `${sitesUrl}/${botID}${pagePath ? `/${pagePath}` : ""}${
        window.location.search
      }`,
    );
  }, [botID, pagePath]);

  return (
    <div className="load-container">
      <LoadingAnim />
    </div>
  );
}
