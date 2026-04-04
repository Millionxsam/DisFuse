import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      babel: {
        parserOpts: {
          plugins: ["jsx", "importMeta"],
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    loader: "jsx",
    include: [
      /src\/.*\.jsx?$/,
      /src\/.*\.js$/,
    ],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: "build",
    sourcemap: true,
  },
});
