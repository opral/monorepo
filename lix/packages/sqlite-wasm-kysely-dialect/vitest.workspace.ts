/// <reference types="vitest" />
import { defaultInclude, defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    // use vite.config.ts as a default config for all
    extends: "./vite.config.ts",
    test: {
      name: "node",
      include: ["**/*.test.node.ts"],
    },
  },
  {
    extends: "./vite.config.ts",
    test: {
      name: "browser",
      include: [...defaultInclude, "**/*.test.ts"],
      // browser: {
      // 	enabled: true,
      // 	headless: true,
      // 	name: 'chrome',
      // },
    },
  },
]);
