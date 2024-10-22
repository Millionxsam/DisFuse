// alwaysDark is a boolean. If false, it will use the user theme.

export default function modalThemeColor(user, alwaysDark = false) {
  let theme = "";

  if (!alwaysDark) theme = user.settings.workspace.theme || "DFTheme";

  if (
    alwaysDark ||
    theme === "DFTheme" ||
    theme === "DarkerTheme" ||
    theme === "BlueBlackTheme"
  )
    return {
      background: "#282828",
      color: "white",
      customClass: { container: "dark" },
    };
  else return {};
}
