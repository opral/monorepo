import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import vike from "vike/plugin"

export default defineConfig({
  server: {
    port: 3006,
  },
  preview: {
    port: 3006,
  },
  plugins: [tailwindcss(), vike({ prerender: true })],
});