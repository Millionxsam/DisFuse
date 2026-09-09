import { block, label, shadow } from "../helpers.js";

/** Reading and writing files on the machine the bot runs on. */
export default {
  kind: "category",
  name: "Files",
  colour: "#eb8334",
  contents: [
    label("Files will be created AFTER the bot is run"),
    label("Read data from files ↓"),
    block("fs_readFile", {
      inputs: {
        path: { shadow: shadow("text") }
      }
    }),
    block("fs_readFile_data"),
    block("fs_readdir", {
      inputs: {
        path: { shadow: shadow("text") }
      }
    }),
    block("fs_readdir_name"),
    block("fs_readdir_path"),
    label("Write a file ↓"),
    block("fs_writeFile", {
      inputs: {
        path: { shadow: shadow("text") },
        data: { shadow: shadow("text") }
      }
    }),
    label("File actions ↓"),
    block("fs_deleteFile", {
      inputs: {
        path: { shadow: shadow("text") }
      }
    }),
    block("fs_renameFile", {
      inputs: {
        path: { shadow: shadow("text") },
        newpath: { shadow: shadow("text") }
      }
    })
  ]
};
