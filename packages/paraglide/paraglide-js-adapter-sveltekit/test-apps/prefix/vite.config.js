import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vitest/config"
import { paraglide } from "@inlang/paraglide-js-adapter-sveltekit"

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			i18n: {
				strategy: {
					name: "prefix",
					prefixDefault: false,
				},

				exclude: [new RegExp("^/not-translated")],
			},
		}),
	],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
})
