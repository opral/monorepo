import { defineConfig } from "vite";
import { paraglideVitePlugin } from "../dist";

export default defineConfig({
	build: {
		minify: false,
		target: "es2024",
		// don't load the module preload to keep the bundle free
		// from side effects that could affect the benchmark
		modulePreload: false,
	},
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
});
