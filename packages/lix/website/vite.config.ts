import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
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
    base: "/", // Use root-relative paths for URLs
    publicDir: "public", // Copy files from public directory
    build: {
      minify: true,
      target: "esnext",
      outDir: "dist",
      emptyOutDir: true,
      assetsInlineLimit: 0, // Don't inline assets
      rollupOptions: {
        input: {
          main: "index.html",
        },
      },
    },
  };
});