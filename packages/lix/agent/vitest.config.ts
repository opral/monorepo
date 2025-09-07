import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 120000,
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "**/*.d.ts",
      ".{git,cache,output,idea}/**",
    ],
  },
});

