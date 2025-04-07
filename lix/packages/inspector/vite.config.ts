import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export const plugins = [react(), tailwindcss()];

export default defineConfig({
  plugins,
  build: {
    target: "es2022",
    minify: true,
    outDir: "build",
  },
});
