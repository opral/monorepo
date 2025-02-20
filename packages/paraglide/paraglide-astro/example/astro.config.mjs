import { defineConfig } from "astro/config";
import svelte, { vitePreprocess } from "@astrojs/svelte";
import node from "@astrojs/node";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

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
				strategy: ["url", "baseLocale"],
			}),
		],
	},
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
});
