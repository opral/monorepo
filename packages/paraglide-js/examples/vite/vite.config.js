import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			compilerOptions: {
				outputStructure: "locale-modules",
			},
		}),
	],
	build: {
		// eases debugging
		minify: false,
	},
});

