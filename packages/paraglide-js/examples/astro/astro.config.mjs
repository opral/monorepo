import { defineConfig } from "astro/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

// https://astro.build/config
export default defineConfig({
	i18n: {
		defaultLocale: "en",
		locales: ["en", "de"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	vite: {
		plugins: [
			paraglideVitePlugin({
				project: "./project.inlang",
				outdir: "./src/paraglide",
			}),
		],
	},
});
