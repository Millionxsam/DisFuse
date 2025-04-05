export default function UserTag({ user }) {
  return (
    <div
      className="userTag"
      onClick={() => (window.location = `/@${user?.username}`)}
    >
      <img
        src={user?.avatar ?? 'https://cdn.discordapp.com/embed/avatars/0.png'}
        alt=""
        onError={(e) => {
          e.preventDefault();
          e.target.onerror = null; 
          e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        }}
      />
      <p>{user?.displayName || user?.username || "Loading..."}</p>
    </div>
  );
}
