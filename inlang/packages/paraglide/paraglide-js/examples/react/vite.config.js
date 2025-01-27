import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

// https://vite.dev/config/
export default defineConfig({
	build: {
		// eases debugging
		minify: false,
		target: "es2022",
	},
	plugins: [
		react(),
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			strategy: {
				type: "cookie",
				cookieName: "PARAGLIDE_LOCALE",
			},
		}),
	],
});
