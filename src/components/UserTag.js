import { Link } from "react-router-dom";

export default function UserTag({ user }) {
  return (
    <Link className="userTag" to={`/@${user?.username}`}>
      <img src={user?.avatar} alt="" />
      <p>@{user?.username}</p>
    </Link>
  );
}
