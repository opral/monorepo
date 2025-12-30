import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { pluginReadmeSync } from "./scripts/plugin-readme-sync";

const config = defineConfig({
  plugins: [
    pluginReadmeSync(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
      },
      sitemap: {
        host: "https://lix.dev",
      },
    }),
    viteReact(),
  ],
});

export default config;
