import { ssr } from "vite-plugin-ssr/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";

export default defineConfig({
	plugins: [
		// @ts-ignore
		react(),
		ssr(),
	],
	resolve: {
		alias: {
			// must also be defined in tsconfig!
			"@src": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
