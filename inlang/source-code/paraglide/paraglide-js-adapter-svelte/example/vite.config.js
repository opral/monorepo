import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"

export default defineConfig({
	plugins: [svelte()],
	build: {
		// for easier debugging of e2e tests, don't minify
		minify: false,
	},
})
