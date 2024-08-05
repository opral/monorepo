/// <reference types="vitest" />
import { defaultInclude, defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    // use vite.config.ts as a default config for all
    // extends: "./vite.config.ts",
    test: {
      name: "node",
      include: ["**/*.test.node.ts"],
    },
  },
  {
    // extends: "./vite.config.ts",
    test: {
      name: "browser",
      include: [...defaultInclude, "**/*.test.ts"],
      browser: {
        enabled: true,
        headless: true,
        name: "chrome",
      },
    },
    optimizeDeps: {
      exclude: ["@eliaspourquoi/sqlite-node-wasm"],
    },
    plugins: [
      {
        enforce: "pre",
        name: "configure-response-headers",
        configureServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            next();
          });
        },
      },
    ],
  },
]);
