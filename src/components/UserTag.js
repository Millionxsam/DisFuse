export default function UserTag({ user }) {
  return (
    <div
      className="userTag"
      onClick={() => (window.location = `/@${user?.username}`)}
    >
      <img src={user?.avatar} alt="" />
      <p>{user?.displayName || user?.username || "Loading..."}</p>
    </div>
  );
}
