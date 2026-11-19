import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["packages/*/test/**/*.test.ts", "apps/assistant/test/**/*.test.ts"] },
});
