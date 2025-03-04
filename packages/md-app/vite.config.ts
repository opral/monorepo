import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	envPrefix: "PUBLIC_",
	server: {
		port: 3009,
		headers: {
			"Cross-Origin-Opener-Policy": "*",
			"Cross-Origin-Embedder-Policy": "*",
		},
	},
	preview: {
		port: 3009,
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
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		minify: false,
		target: "esnext",
	},
});
