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
			})
		);

		return config;
	},
};
