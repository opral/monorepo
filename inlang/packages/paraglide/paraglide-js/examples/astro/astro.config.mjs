import { defineConfig } from "astro/config";
import svelte, { vitePreprocess } from "@astrojs/svelte";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
	integrations: [
		svelte({
			preprocess: [vitePreprocess()],
		}),
	],
	vite: {
		plugins: [
			paraglideVitePlugin({
				project: "./project.inlang",
				outdir: "./src/paraglide",
			}),
		],
	},
	output: "server",
	adapter: node({ mode: "standalone" }),
});
