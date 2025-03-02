import { defineConfig } from "vite";
import { paraglideVitePlugin } from "../dist";

export default defineConfig({
	build: {
		minify: false,
		target: "es2024",
		modulePreload: {
			// don't load the module preload to keep the bundle free
			// from side effects that could affect the benchmark
			polyfill: false,
		},
	},
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
});
