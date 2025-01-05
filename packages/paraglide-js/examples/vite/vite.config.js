import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			options: {
				// declutters output for easier debugging
				emitDts: false,
			},
		}),
	],
	build: {
		// eases debugging
		minify: false,
	},
});

