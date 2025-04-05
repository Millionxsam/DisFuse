import Swal from "sweetalert2";
import WorkshopItem from "../../../components/WorkshopItem";
import modalThemeColor from "../../../functions/modalThemeColor";
import axios from "axios";
import { useEffect, useState } from "react";
import LoadingAnim from "../../../components/LoadingAnim";
import { Link, useNavigate } from "react-router-dom";

const modalColors = modalThemeColor(null, true);

const { apiUrl, discordUrl } = require("../../../config/config.json");

export default function Workshop() {
  const [packs, setPacks] = useState([]);
  const [userPacks, setUserPacks] = useState([]);
  const [shownUserPacks, setShownUserPacks] = useState([]);
  const [shown, setShown] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        axios
          .get(apiUrl + `/users/${data.id}`, {
            headers: { Authorization: localStorage.getItem("disfuse-token") },
          })
          .then(({ data: u }) => {
            axios
              .get(apiUrl + `/users/${u.id}/blockPacks`, {
                headers: {
                  Authorization: localStorage.getItem("disfuse-token"),
                },
              })
              .then((res) => {
                setUserPacks(res.data);
                setShownUserPacks(res.data);

                axios.get(apiUrl + "/workshop").then(({ data: packs }) => {
                  setPacks(packs);
                  setShown(packs);
                  setLoading(false);
                });
              });
          });
      });
  }, []);

  return (
    <div className="workshop-container">
      <div className="head">
        <i class="fa-solid fa-screwdriver-wrench"></i> Workshop
      </div>
      <div className="buttons">
        <button onClick={createPack}>
          <i class="fa-solid fa-plus"></i> Create
        </button>
        <input
          type="text"
          placeholder="Search workshop..."
          className="search"
          onChange={(e) => {
            setShown(
              packs.filter((p) =>
                p.name.toLowerCase().includes(e.target.value.toLowerCase())
              )
            );
            setShownUserPacks(
              userPacks.filter((p) =>
                p.name.toLowerCase().includes(e.target.value.toLowerCase())
              )
            );
          }}
        />
      </div>
      <div className="workshop">
        {isLoading ? (
          <LoadingAnim />
        ) : (
          <>
            <div className="library">
              <Link to="/workshop/library">
                <i class="fa-solid fa-cubes-stacked"></i>
                <span style={{ textWrap: "nowrap" }}>Your Library</span>
                <i class="fa-solid fa-chevron-right"></i>
              </Link>
            </div>
            <h1 style={{ marginTop: "2rem" }}>Your Packs</h1>
            <div className="content">
              {shownUserPacks.length
                ? shownUserPacks.map((pack) => (
                    <WorkshopItem pack={pack} editable={true} />
                  ))
                : "No packs"}
            </div>
            <h1 style={{ marginTop: "2rem" }}>Featured</h1>
            <div className="content">
              {shown.map((pack) => (
                <WorkshopItem pack={pack} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  async function createPack() {
    const blockPackCreation = Swal.mixin({
      title: "Create Block Pack",
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
        }
      )
      .then((res) => navigate(`/workshop/${res.data._id}/workspace`))
      .catch((e) =>
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e.response.data.error,
        })
      );
  }
}
