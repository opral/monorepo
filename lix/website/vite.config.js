import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import vike from "vike/plugin"

export default defineConfig({
	plugins: [tailwindcss(), vike({ prerender: true })],
})
