import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	envPrefix: "PUBLIC_",
	server: {
		headers: {
			"Cross-Origin-Opener-Policy": "*",
			"Cross-Origin-Embedder-Policy": "*",
		},
	},
	optimizeDeps: {
		exclude: [
			"@lix-js/sdk",
			"@sqlite.org/sqlite-wasm",
			"@eliaspourquoi/sqlite-node-wasm",
		],
	},
});
