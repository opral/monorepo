import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			options: {
				outputStructure: "locale-modules",
				// declutters output for easier debugging
				emitTsDeclarations: false,
			},
		}),
	],
	build: {
		// eases debugging
		minify: false,
	},
});

