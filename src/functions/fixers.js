export function isValidEmoji(emoji = "") {
    if (
        !emoji ||
        emoji === "" ||
        emoji === "null" ||
        emoji === "undefined" ||
        emoji === '"null"' ||
        emoji === "'null'"
    ) return false
    else return true;
}