import { paraglideWebpackPlugin } from "@inlang/paraglide-js";

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	webpack: (config, { isServer }) => {
		config.plugins.push(
			paraglideWebpackPlugin({
				project: "./project.inlang",
				outdir: "./src/app/paraglide",
			})
		);
		return config;
	},
};

export default nextConfig;
