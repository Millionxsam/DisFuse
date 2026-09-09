import { label, shadow } from "../helpers.js";

/** Reading and writing the settings a DisFuse Website exposes. */
export default {
  kind: "category",
  name: "Dashboard",
  colour: "#014f98",
  contents: [
    label("Settings people set on your DisFuse Website ↓"),
    label("--------------------------------"),
    label("Per server ↓"),
    {
      kind: "block",
      type: "dashboard_getServer",
      inputs: {
        key: { shadow: shadow("text", { fields: { TEXT: "prefix" } }) },
        id: { shadow: shadow("text") },
      },
    },
    {
      kind: "block",
      type: "dashboard_hasServer",
      inputs: {
        key: { shadow: shadow("text", { fields: { TEXT: "prefix" } }) },
        id: { shadow: shadow("text") },
      },
    },
    {
      kind: "block",
      type: "dashboard_allServer",
      inputs: {
        id: { shadow: shadow("text") },
      },
    },
    {
      kind: "block",
      type: "dashboard_setServer",
      inputs: {
        key: { shadow: shadow("text", { fields: { TEXT: "prefix" } }) },
        value: { shadow: shadow("text") },
        id: { shadow: shadow("text") },
      },
    },
    {
      kind: "block",
      type: "dashboard_deleteServer",
      inputs: {
        key: { shadow: shadow("text", { fields: { TEXT: "prefix" } }) },
        id: { shadow: shadow("text") },
      },
    },
    label("--------------------------------"),
    label("Per user ↓"),
    {
      kind: "block",
      type: "dashboard_getUser",
      inputs: {
        key: {
          shadow: shadow("text", { fields: { TEXT: "notifications" } }),
        },
        id: { shadow: shadow("text") },
      },
    },
    {
      kind: "block",
      type: "dashboard_hasUser",
      inputs: {
        key: {
          shadow: shadow("text", { fields: { TEXT: "notifications" } }),
        },
        id: { shadow: shadow("text") },
      },
    },
    {
      kind: "block",
      type: "dashboard_allUser",
      inputs: {
        id: { shadow: shadow("text") },
      },
    },
    {
      kind: "block",
      type: "dashboard_setUser",
      inputs: {
        key: {
          shadow: shadow("text", { fields: { TEXT: "notifications" } }),
        },
        value: { shadow: shadow("logic_boolean") },
        id: { shadow: shadow("text") },
      },
    },
    {
      kind: "block",
      type: "dashboard_deleteUser",
      inputs: {
        key: {
          shadow: shadow("text", { fields: { TEXT: "notifications" } }),
        },
        id: { shadow: shadow("text") },
      },
    },
  ],
};
