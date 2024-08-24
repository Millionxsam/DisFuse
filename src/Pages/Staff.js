import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Staff() {
  useEffect(() => {
    (async () => {
      let elements = Array.from(
        document.getElementsByClassName("contributionsCounter")
      );

      let response = await fetch(
        `https://api.github.com/repos/Millionxsam/DisFuse/contributors`
      );

      if (!response.ok) {
        console.error(`Response was not ok: ${response.status}`);

        return elements.forEach((element) => {
          element.remove();
        });
      }

      let contributors = await response.json();

      elements.forEach((element) => {
        try {
          let username = element.innerText;
          let data = contributors.find((item) => item.login === username);

          if (!data || !username) element.remove();
          element.innerText = `Contributions: ${data.contributions}`;
        } catch (error) {
          element.remove();
        }
      });
    })();
  }, []);

  return (
    <div className="staff-container">
      <h1>DisFuse Staff</h1>
      <div className="staff hidden">
        <Link to="https://github.com/millionxsam">
          <div>
            <img
              src="https://cdn.discordapp.com/avatars/745660092829007932/93962cecd720a5caa4df349120b5565e.webp?size=80"
              alt="Millionxsam's Discord Profile"
            />
            <h3>Millionxsam</h3>
            <p>Owner</p>
            <p className="contributionsCounter">Millionxsam</p>
          </div>
        </Link>

        <Link to="https://github.com/ddededodediamante">
          <div>
            <img
              src="https://cdn.discordapp.com/avatars/694587798598058004/cc4dd2163f7c42384aeb29d933f909d6.webp?size=80"
              alt="ddededodediamante's Discord Profile"
            />
            <h3>ddededodediamante</h3>
            <p>Developer & Admin</p>
            <p className="contributionsCounter">ddededodediamante</p>
          </div>
        </Link>

        <Link to="https://www.youtube.com/@tropicgalxy/videos">
          <div>
            <img
              src="https://cdn.discordapp.com/avatars/762076450047131648/b28c7ff6fbb8ba5662067b4c53ca327e.webp?size=80"
              alt="TropicGalxy's Discord Profile"
            />
            <h3>TropicGalxy</h3>
            <p>Admin</p>
            <p className="contributionsCounter">TropicGalxy</p>
          </div>
        </Link>

        <Link to="https://www.youtube.com/channel/UCywiv9YwtbC6Snuo8X6v9Og">
          <div>
            <img
              src="https://cdn.discordapp.com/avatars/1142992462693015663/613fa252050536f2dedc0519dda9f132.webp?size=80"
              alt="WhisPro's Discord Profile"
            />
            <h3>WhisPro</h3>
            <p>Moderator</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
