import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, type PluginOption } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import mdx from "fumadocs-mdx/vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    mdx(await import("./source.config")),
    // Type casts needed due to Vite version mismatch in node_modules
    tailwindcss() as PluginOption,
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }) as PluginOption,
    tanstackStart({
      prerender: {
        enabled: true,
      },
      pages: [
        {
          path: "/docs",
        },
      ],
    }),
    react(),
  ],
});
