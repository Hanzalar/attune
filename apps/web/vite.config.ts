import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// One build, one URL per stakeholder. BASE_PATH is "/attune/" on GitHub Pages.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  define: {
    __BUILD_SHA__: JSON.stringify((process.env.GITHUB_SHA ?? "local").slice(0, 7)),
  },
  build: {
    rollupOptions: {
      input: {
        demo: resolve(__dirname, "demo/index.html"),
        patient: resolve(__dirname, "patient/index.html"),
        pcp: resolve(__dirname, "pcp/index.html"),
        specialist: resolve(__dirname, "specialist/index.html"),
        guide: resolve(__dirname, "guide/index.html"),
      },
    },
  },
});
