import { defineConfig } from "vite";
import { paraglideVite } from "@inlang/paraglide-js";

export default defineConfig({
	plugins: [
		paraglideVite({
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
