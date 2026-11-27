import Swal from "sweetalert2";
import WorkshopItem from "../../../components/WorkshopItem";
import modalThemeColor from "../../../functions/modalThemeColor";
import axios from "axios";
import { useEffect, useState } from "react";
import LoadingAnim from "../../../components/LoadingAnim";
import { Link, useNavigate } from "react-router-dom";
import { userCache } from "../../../cache.ts";
import { Helmet } from "react-helmet-async";

const modalColors = modalThemeColor(null, true);

import { apiUrl } from "../../../config/config.js";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";
import { PACK_TYPES, packType } from "../../../builder/model/packs.js";

/* Which packs the page shows, by how they were made. Every pack works in
   every project, so this is only a filter. */
const FILTERS = [
  { value: "all", label: "All" },
  { value: "blocks", label: "Made with blocks", icon: PACK_TYPES.blocks.icon },
  { value: "builder", label: "Made with DisFuse Builder", icon: PACK_TYPES.builder.icon },
];

export default function Workshop() {
  const [packs, setPacks] = useState([]);
  const [userPacks, setUserPacks] = useState([]);
  const [shownUserPacks, setShownUserPacks] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const ofFilter = (list) =>
    filter === "all" ? list : list.filter((pack) => packType(pack) === filter);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("disfuse-token");

    async function loadUser() {
      if (userCache.user?.id) return userCache.user.id;

      const { data } = await axios.post(`${apiUrl}/users`, null, {
        headers: { Authorization: token },
      });
      userCache.user = data;
      return data.id;
    }

    loadUser().then((userId) => {
      Promise.all([
        axios.get(`${apiUrl}/users/${userId}/blockPacks`, {
          headers: { Authorization: token },
        }),
        axios.get(`${apiUrl}/workshop`),
      ]).then(([userPacksRes, workshopRes]) => {
        let sortedUserPacks = userPacksRes.data.sort(
          (a, b) =>
            b.likes.length +
            b.users.length -
            (a.likes.length + a.users.length),
        );

        let sortedPacks = workshopRes.data.sort(
          (a, b) =>
            b.likes.length +
            b.users.length -
            (a.likes.length + a.users.length),
        );

        setUserPacks(sortedUserPacks);
        setShownUserPacks(sortedUserPacks);
        setPacks(sortedPacks);
        setShown(sortedPacks);
        setLoading(false);
      });
    });
  }, []);

  return (
    <div className="df-workshop-page">
      <Helmet>
        <title>Workshop | DisFuse</title>
      </Helmet>
      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-screwdriver-wrench"></i> Workshop
        </h1>
        <div className="df-toolbar">
          <input
            type="text"
            placeholder="Search workshop..."
            className="search"
            onChange={(e) => {
              setShown(
                packs.filter((p) =>
                  p.name.toLowerCase().includes(e.target.value.toLowerCase()),
                ),
              );
              setShownUserPacks(
                userPacks.filter((p) =>
                  p.name.toLowerCase().includes(e.target.value.toLowerCase()),
                ),
              );
            }}
          />
          <div className="df-pack-filter" role="radiogroup" aria-label="Show packs for">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={filter === option.value}
                className={filter === option.value ? "active" : ""}
                onClick={() => setFilter(option.value)}
              >
                {option.icon && <i className={option.icon}></i>}
                {option.label}
              </button>
            ))}
          </div>
          <div className="df-btn-group">
            <button className="df-primary-btn" onClick={createPack}>
              <i className="fa-solid fa-plus"></i> Create
            </button>
            <DocsLink page={DOCS.workshop} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingAnim />
      ) : (
        <>
          <Link to="/workshop/library" className="df-library-banner">
            <i className="fa-solid fa-cubes-stacked"></i>
            <span>Your Library</span>
            <i className="fa-solid fa-chevron-right"></i>
          </Link>

          <div className="df-workshop-section">
            <h2>Your Packs</h2>
            {ofFilter(shownUserPacks).length ? (
              <div className="df-grid">
                {ofFilter(shownUserPacks).map((pack) => (
                  <WorkshopItem pack={pack} editable={true} key={pack._id} />
                ))}
              </div>
            ) : (
              <div className="df-empty">
                <i className="fa-solid fa-cubes-stacked"></i>
                <h3>No packs yet</h3>
                <p>
                  Create a pack to share your own blocks, or your own events,
                  steps and values for DisFuse Builder, with the community.
                </p>
              </div>
            )}
          </div>

          <div className="df-workshop-section">
            <h2>Featured</h2>
            {ofFilter(shown).length ? (
              <div className="df-grid">
                {ofFilter(shown).map((pack) => (
                  <WorkshopItem pack={pack} key={pack._id} />
                ))}
              </div>
            ) : (
              <div className="df-empty">
                <i className="fa-solid fa-cubes-stacked"></i>
                <h3>No packs here yet</h3>
                <p>Nobody has published a pack like this yet. Yours could be the first.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  async function createPack() {
    const packCreation = Swal.mixin({
      title: "Create Pack",
      footer: `By creating a pack, you agree to our <a target="_blank" rel="noopener" href="/tos">TOS</a>`,
      progressSteps: ["1", "2", "3", "4"],
      animation: false,
      ...modalColors,
    });

    /* Nothing is picked for the user: it can't be changed afterwards. */
    const { value: type } = await packCreation.fire({
      currentProgressStep: 0,
      animation: true,
      html: `
        <fieldset class="df-template-types df-pack-types">
          <legend>How do you want to build it?</legend>
          ${Object.entries(PACK_TYPES)
            .map(
              ([value, kind]) => `
          <label class="df-template-type df-template-type-${value}">
            <input type="radio" name="df-pack-type" value="${value}" />
            <span class="df-template-type-icon"><i class="${kind.icon}"></i></span>
            <span><strong>${kind.label}</strong>${kind.description}</span>
          </label>`,
            )
            .join("")}
          <p class="df-template-types-note"><i class="fa-solid fa-circle-info"></i> This only changes how you build it. Once it's installed, it works in every project, whether it uses the Block Editor or DisFuse Builder. You can't change this later.</p>
        </fieldset>`,
      confirmButtonText: "Next",
      showCancelButton: true,
      preConfirm: () => {
        const picked = document.querySelector(
          'input[name="df-pack-type"]:checked',
        )?.value;
        if (!picked) {
          Swal.showValidationMessage("Pick how you want to build it");
          return false;
        }
        return picked;
      },
    });

    if (!type) return;

    const { value: name } = await packCreation.fire({
      currentProgressStep: 1,
      text: "Enter a name for your pack",
      input: "text",
      inputPlaceholder: "My pack",
      confirmButtonText: "Next",
      showCancelButton: true,
      inputValidator: (i) => {
        if (i.length >= 3) return false;
        else return "The name must be at least 3 characters";
      },
    });

    if (!name) return;

    const { value: description, isConfirmed: descriptionPassed } =
      await packCreation.fire({
        currentProgressStep: 2,
        text: "Enter a description for your pack",
        input: "textarea",
        inputPlaceholder:
          type === "builder"
            ? "Describe the events, steps and values in your pack..."
            : "Describe the blocks in your pack...",
        confirmButtonText: "Next",
        showCancelButton: true,
        inputValidator: (i) => {
          if (i.length >= 15) return false;
          else return "The description must be at least 15 characters";
        },
      });

    if (!descriptionPassed) return;

    const { value: visibility, isConfirmed: visibilityPassed } =
      await packCreation.fire({
        currentProgressStep: 3,
        text: "Set the visibility of your pack. Private packs are only viewable and usable by you.",
        input: "select",
        confirmButtonText: "Create",
        inputOptions: {
          public: "Public",
          private: "Private",
        },
        showCancelButton: true,
      });

    if (!visibilityPassed) return;

    axios
      .post(
        apiUrl + "/workshop",
        {
          type,
          name,
          private: visibility === "private",
          description,
        },
        {
          headers: { Authorization: localStorage.getItem("disfuse-token") },
        },
      )
      .then((res) => navigate(`/workshop/${res.data._id}/workspace`))
      .catch((e) =>
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e.response.data.error,
        }),
      );
  }
}
