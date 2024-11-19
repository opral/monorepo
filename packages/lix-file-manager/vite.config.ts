import { defineConfig } from "vite"
import path from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
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
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
		},
	},
});
