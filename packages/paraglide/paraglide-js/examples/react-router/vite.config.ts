import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
	plugins: [
		reactRouter(),
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./app/paraglide",
			strategy: ["url", "baseLocale"],
		}),
	],
});
