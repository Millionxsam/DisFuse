import { block, label, shadow } from "../helpers.js";

/** Voice playback. */
export default {
  kind: "category",
  name: "Music",
  colour: "#379e37",
  contents: [
    label("Get lyrics ↓"),
    block("music_findLyrics", {
      inputs: {
        artist: { shadow: shadow("text") },
        song: { shadow: shadow("text") }
      }
    }),
    block("music_findLyrics_lyrics")
  ]
};
