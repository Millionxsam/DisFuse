export const discordUrl = "https://discord.com/api/v6";
export const apiUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:80"
    : "https://api.disfuse.xyz";
export const hostUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:30"
    : "ws://167.253.35.118:3019";
export const authUrl =
  window.location.hostname === "localhost"
    ? "https://discord.com/oauth2/authorize?client_id=1234163623081934889&response_type=token&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fprojects&scope=identify"
    : "https://discord.com/oauth2/authorize?client_id=1234163623081934889&response_type=token&redirect_uri=https%3A%2F%2Fdisfuse.xyz%2Fprojects&scope=identify";
