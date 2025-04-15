import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const config = {
    envPrefix: "PUBLIC_",
    plugins: [
      react(),
      tsconfigPaths({
        ignoreConfigErrors: true,
      }),
    ],
    server: {
      port: 3006,
    },
    preview: {
      port: 3006,
    },
    base: "/",
    publicDir: "public",
    build: {
      minify: true,
      target: "esnext",
      ssrManifest: !(command === "build" && mode === "ssr"),
      outDir: "dist",
      emptyOutDir: true,
      assetsInlineLimit: 0,
      rollupOptions: {},
    },
  };

  // Specific configurations for SSR build
  if (command === "build" && mode === "ssr") {
    // SSR specific config adjustments
    config.build.rollupOptions = {
      output: {
        format: "es",
      },
    };
  } else {
    // Client build specific settings
    config.build.rollupOptions = {
      input: {
        main: "index.html",
      },
    };
  }

  return config;
});
