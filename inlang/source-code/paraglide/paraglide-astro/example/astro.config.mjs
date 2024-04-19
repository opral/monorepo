import paraglide from "@inlang/paraglide-astro"
import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import svelte, { vitePreprocess } from "@astrojs/svelte"
import node from "@astrojs/node"

// https://astro.build/config
export default defineConfig({
	//configure this to your domain name
	site: "https://acme.com",
	i18n: {
		defaultLocale: "en",
		locales: [
			"en",
			{
				codes: ["de"],
				path: "deutsch",
			},
		],
	},
	integrations: [
		mdx(),
		sitemap({
			i18n: {
				defaultLocale: "en", // All urls that don't contain `es` or `fr` after `https://stargazers.club/` will be treated as default locale, i.e. `en`
				locales: {
					en: "en-US", // The `defaultLocale` value must present in `locales` keys
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
	//output: "server",
	adapter: node({
		mode: "standalone",
	}),
})
