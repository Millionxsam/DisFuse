import axios from "axios";
import { useEffect, useState } from "react";

const { apiUrl } = require("../config/config.json");

export default function SecretsView({ project: p }) {
  const [project, setProject] = useState(p);

  useEffect(() => setProject(p), [p]);

  function addSecret() {
    const name = document.querySelector(".secrets-container #secret-key").value;
    const value = document.querySelector(
      ".secrets-container #secret-val"
    ).value;
    const errorEle = document.querySelector(".errors");

    if (!name.length || !value.length)
      return (errorEle.innerHTML = "You must specify a name and value");

    project.secrets.push({ name, value });
    document.querySelector(".secrets-container #secret-key").value = "";
    document.querySelector(".secrets-container #secret-val").value = "";

    axios
      .patch(
        apiUrl + `/projects/${project._id}/secrets`,
        {
          secrets: project.secrets,
        },
        {
          headers: { Authorization: localStorage.getItem("disfuse-token") },
        }
      )
      .then(({ data }) => setProject(data))
      .catch((e) => (errorEle.innerHTML = e.response.data.error));
  }

  function copySecret(index) {
    navigator.clipboard.writeText(project.secrets[index].value);
    document.querySelectorAll(".secrets div.button.copy")[
      index
    ].style.backgroundColor = "green";

    setTimeout(() => {
      document.querySelectorAll(".secrets div.button.copy")[
        index
      ].style.backgroundColor = "";
    }, 1000);
  }

  function delSecret(index) {
    project.secrets.splice(index, 1);

    axios
      .patch(
        apiUrl + `/projects/${project._id}/secrets`,
        {
          secrets: project.secrets,
        },
        {
          headers: { Authorization: localStorage.getItem("disfuse-token") },
        }
      )
      .then(({ data }) => setProject(data));
  }

  return (
    <dialog className="secrets-view">
      <div className="secrets-container">
        <div className="top">
          <h1>Secrets</h1>
          <button id="close" onClick={closeView}>
            Close
          </button>
        </div>
        <div className="secrets">
          <ul>
            {project?.secrets?.map((secret, i) => (
              <>
                <li key={i}>
                  <div>{secret.name}</div>
                  <div>
                    {secret.value
                      .split("")
                      .map(() => "*")
                      .join("")}
                  </div>
                  <div className="button copy" onClick={() => copySecret(i)}>
                    <i className="fa-solid fa-copy"></i>
                  </div>
                  <div className="button delete" onClick={() => delSecret(i)}>
                    <i className="fa-solid fa-trash"></i>
                  </div>
                </li>
              </>
            ))}
          </ul>
          <h2>Add a secret</h2>
          <p className="errors"></p>
          <div>
            <input placeholder="Name" type="text" id="secret-key" />
            <input placeholder="Value" type="text" id="secret-val" />
          </div>
          <button onClick={addSecret} id="secret-add">
            Add Secret
          </button>
        </div>
      </div>
    </dialog>
  );
}

function closeView() {
  document.querySelector(".secrets-view").close();
}
