import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			// forcing locale modules to detect problems during CI/CD
			// (all other projects use message-modules)
			outputStructure: "locale-modules",
			emitTsDeclarations: true,
		}),
	],
	build: {
		// eases debugging
		minify: false,
	},
});
