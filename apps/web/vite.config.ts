import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// One build, one URL per stakeholder. BASE_PATH is "/attune/" on GitHub Pages.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  // In development, the assistant gateway (`npm run assistant`) answers under the app's own origin.
  server: { proxy: { "/api": process.env.ATTUNE_GATEWAY ?? "http://127.0.0.1:8787" } },
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
        ops: resolve(__dirname, "ops/index.html"),
      },
    },
  },
});
