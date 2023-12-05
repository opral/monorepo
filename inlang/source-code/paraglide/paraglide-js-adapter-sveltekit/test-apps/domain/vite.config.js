import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vitest/config"
import { paraglide } from "@inlang/paraglide-js-adapter-sveltekit/plugin"

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",

			routingStrategy: {
				name: "domain",
				domains: {
					de: "site.de",
					en: "side.com",
				},
			},
		}),
	],
})
