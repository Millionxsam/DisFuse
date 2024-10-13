import { Link } from 'react-router-dom';

export default function Staff() {
  return (
    <div className="staff-container">
      <h1>DisFuse Staff</h1>
      <div className="staff hidden">
        <Link to="https://github.com/millionxsam">
          <div>
            <img
              src="https://cdn.discordapp.com/avatars/745660092829007932/93962cecd720a5caa4df349120b5565e.png?size=1024&format=webp&quality=lossless&width=0&height=230"
              alt=""
            />
            <h3>Millionxsam</h3>
            <p>Owner</p>
          </div>
        </Link>

        <Link to="https://github.com/ddededodediamante">
          <div>
            <img
              src="https://cdn.discordapp.com/avatars/694587798598058004/89d8a52e4ebdd2b236ac0650172caeac.png?size=1024&format=webp&quality=lossless&width=0&height=230"
              alt=""
            />
            <h3>ddededodediamante</h3>
            <p>Developer & Admin</p>
          </div>
        </Link>

        <Link to="https://www.youtube.com/@tropicgalxy/videos">
          <div>
            <img
              src="https://cdn.discordapp.com/avatars/762076450047131648/b28c7ff6fbb8ba5662067b4c53ca327e.png?size=1024&format=webp&quality=lossless&width=0&height=230"
              alt=""
            />
            <h3>TropicGalxy</h3>
            <p>Admin</p>
          </div>
        </Link>

        <Link to="https://www.youtube.com/channel/UCywiv9YwtbC6Snuo8X6v9Og">
          <div>
            <img
              src="https://cdn.discordapp.com/avatars/1142992462693015663/246e573ec5c6795a7d98aa08a77e25af.png?size=1024&format=webp&quality=lossless&width=0&height=230"
              alt=""
            />
            <h3>WhisPro</h3>
            <p>Moderator</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
