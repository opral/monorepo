import { paraglideWebpackPlugin } from "@inlang/paraglide-js";

/**
 * @type {import('next').NextConfig}
 */
export default {
	webpack: (config) => {
		config.plugins.push(
			paraglideWebpackPlugin({
				outdir: "./src/paraglide",
				project: "./project.inlang",
				strategy: ["url", "cookie", "baseLocale"],
				urlPatterns: [
					{
						pattern:
							":protocol://:domain(.*)::port?/:locale(de|en)?/:path(.*)?",
						deLocalizedNamedGroups: {
							locale: "en",
						},
						localizedNamedGroups: {
							de: { locale: "de" },
							en: { locale: "en" },
						},
					},
				],
			})
		);

		return config;
	},
};
