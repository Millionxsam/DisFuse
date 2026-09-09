import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { Helmet } from "react-helmet-async";

import LoadingAnim from "../../../components/LoadingAnim";
import WebsiteCard from "../../../components/websites/WebsiteCard";
import { getWebsites } from "../../../api/websites";
import modalThemeColor from "../../../functions/modalThemeColor";
import { userCache } from "../../../cache.ts";

const modalColors = modalThemeColor(null, true);

export default function Websites() {
  const [websites, setWebsites] = useState(userCache.websites || []);
  const [shown, setShown] = useState(userCache.websites || []);
  const [query, setQuery] = useState("");
  const [isLoading, setLoading] = useState(!userCache.websites);

  const fetchWebsites = useCallback(() => {
    getWebsites()
      .then((data) => {
        const sorted = [...(data || [])].sort(
          (a, b) => new Date(b.lastEdited || 0) - new Date(a.lastEdited || 0),
        );

        userCache.websites = sorted;
        setWebsites(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);

        Swal.fire({
          icon: "error",
          title: "Couldn't load your websites",
          text:
            err.response?.data?.error ||
            "An error occurred while loading your websites. Please try again.",
          ...modalColors,
        });
      });
  }, []);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  useEffect(() => {
    const search = query.toLowerCase();

    setShown(
      websites.filter(
        (w) =>
          w?.name?.toLowerCase().includes(search) ||
          w?.botID?.toString().includes(search) ||
          w?.config?.seo?.description?.toLowerCase().includes(search),
      ),
    );
  }, [websites, query]);

  return (
    <div className="df-page">
      <Helmet>
        <title>Websites | DisFuse</title>
      </Helmet>
      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-globe"></i> Websites
        </h1>
        <div className="df-toolbar">
          <input
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search websites"
            className="search"
          />
          <div className="df-btn-group">
            <Link to="/websites/new">
              <button className="df-primary-btn">
                <i className="fa-solid fa-plus"></i> New Website
              </button>
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingAnim />
      ) : shown.length > 0 ? (
        <div className="df-grid">
          {shown.map((website) => (
            <WebsiteCard
              website={website}
              key={website._id}
              onDelete={() => {
                setLoading(true);
                fetchWebsites();
              }}
            />
          ))}
        </div>
      ) : (
        <div className="df-empty">
          <i className="fa-solid fa-globe"></i>
          <h3>
            {websites.length ? "No matching websites" : "No websites yet"}
          </h3>
          <p>
            {websites.length
              ? "Try a different search."
              : "Build an information site or a full dashboard for one of your bots, all without writing code."}
          </p>
          {!websites.length && (
            <Link to="/websites/new">
              <button className="df-primary-btn">
                <i className="fa-solid fa-plus"></i> New Website
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
