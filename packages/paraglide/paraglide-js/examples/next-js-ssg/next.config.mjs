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
						pattern: "/:path(.*)?",
						localized: [
							["en", "/en/:path(.*)?"],
							["de", "/de/:path(.*)?"],
						],
					},
				],
			})
		);

		return config;
	},
};
