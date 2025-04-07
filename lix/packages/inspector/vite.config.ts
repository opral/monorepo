import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export const plugins = [tailwindcss(), react()];

export default defineConfig({
  plugins,
  build: {
    target: "es2022",
    minify: true,
    outDir: "build",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
