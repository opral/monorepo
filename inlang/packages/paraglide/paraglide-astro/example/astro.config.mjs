import paraglideAstro from "@inlang/paraglide-astro";
import { defineConfig } from "astro/config";
import svelte, { vitePreprocess } from "@astrojs/svelte";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
	integrations: [
		svelte({
			preprocess: [vitePreprocess()],
		}),
		paraglideAstro({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			strategy: ["url", "baseLocale"],
		}),
	],
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
});
