import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	envPrefix: "PUBLIC_",
	server: {
		port: 3007,
		headers: {
			"Cross-Origin-Opener-Policy": "*",
			"Cross-Origin-Embedder-Policy": "*",
		},
	},
	preview: {
		port: 3007,
	},
	optimizeDeps: {
		exclude: [
			"@lix-js/sdk",
			"@sqlite.org/sqlite-wasm",
			"@eliaspourquoi/sqlite-node-wasm",
		],
	},
	resolve: {
		alias: {
			"@": "/src",
		},
	},
	build: {
		minify: false,
		target: "esnext",
	},
});
