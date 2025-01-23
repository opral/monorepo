import { paraglideWebpackPlugin } from "@inlang/paraglide-js";
import { ParaglideNext } from "@inlang/paraglide-next";

/** @type {import("next").NextConfig} */
const nextConfig = {
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	webpack: (config) => {
		config.plugins.push(
			paraglideWebpackPlugin({
				project: "./project.inlang",
				outdir: "./src/paraglide",
				adapter: ParaglideNext(),
			})
		);
		return config;
	},
};

export default nextConfig;
