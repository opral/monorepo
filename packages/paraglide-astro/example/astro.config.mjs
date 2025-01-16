import paraglide from "@inlang/paraglide-astro"
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap"
import svelte, { vitePreprocess } from "@astrojs/svelte"
import node from "@astrojs/node"

// https://astro.build/config
export default defineConfig({
	//configure this to your domain name
	//site: "https://acme.com",

	i18n: {
		defaultLocale: "en",
		locales: ["en", "de"],
	},
	integrations: [
		sitemap({
			i18n: {
				defaultLocale: "en",
				locales: {
					en: "en-US",
					de: "de-CH",
				},
			},
		}),
		svelte({
			preprocess: [vitePreprocess()],
		}),
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
});
