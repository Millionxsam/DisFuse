import Swal from "sweetalert2";
import WorkshopItem from "../../../components/WorkshopItem";
import modalThemeColor from "../../../functions/modalThemeColor";
import axios from "axios";
import { useEffect, useState } from "react";
import LoadingAnim from "../../../components/LoadingAnim";
import { Link, useNavigate } from "react-router-dom";
import { userCache } from "../../../cache.ts";

const modalColors = modalThemeColor(null, true);

import { apiUrl } from "../../../config/config.js";

export default function Workshop() {
  const [packs, setPacks] = useState([]);
  const [userPacks, setUserPacks] = useState([]);
  const [shownUserPacks, setShownUserPacks] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(true);

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
          <div className="df-btn-group">
            <button className="df-primary-btn" onClick={createPack}>
              <i className="fa-solid fa-plus"></i> Create
            </button>
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
            {shownUserPacks.length ? (
              <div className="df-grid">
                {shownUserPacks.map((pack, index) => (
                  <WorkshopItem pack={pack} editable={true} key={index} />
                ))}
              </div>
            ) : (
              <div className="df-empty">
                <i className="fa-solid fa-cubes-stacked"></i>
                <h3>No packs yet</h3>
                <p>Create a block pack to share your own blocks with the community.</p>
              </div>
            )}
          </div>

          <div className="df-workshop-section">
            <h2>Featured</h2>
            <div className="df-grid">
              {shown.map((pack, index) => (
                <WorkshopItem pack={pack} key={index} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  async function createPack() {
    const blockPackCreation = Swal.mixin({
      title: "Create Block Pack",
      footer: `By creating a block pack, you agree to our <a target="_blank" rel="noopener" href="/tos">TOS</a>`,
      progressSteps: ["1", "2", "3"],
      animation: false,
      ...modalColors,
    });

    const { value: name } = await blockPackCreation.fire({
      currentProgressStep: 0,
      text: "Enter a name for your pack",
      input: "text",
      inputPlaceholder: "My pack",
      confirmButtonText: "Next",
      animation: true,
      showCancelButton: true,
      inputValidator: (i) => {
        if (i.length >= 3) return false;
        else return "The name must be at least 3 characters";
      },
    });

    if (!name) return;

    const { value: description, isConfirmed: descriptionPassed } =
      await blockPackCreation.fire({
        currentProgressStep: 0,
        text: "Enter a description for your pack",
        input: "textarea",
        inputPlaceholder: "Describe the blocks in your pack...",
        confirmButtonText: "Next",
        showCancelButton: true,
        inputValidator: (i) => {
          if (i.length >= 15) return false;
          else return "The description must be at least 15 characters";
        },
      });

    if (!descriptionPassed) return;

    const { value: visibility, isConfirmed: visibilityPassed } =
      await blockPackCreation.fire({
        currentProgressStep: 0,
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
