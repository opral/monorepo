import type { NextConfig } from "next";
import { paraglideWebpackPlugin } from "@inlang/paraglide-js";

const nextConfig: NextConfig = {
	webpack: (config, { isServer }) => {
		if (isServer) {
			config.plugins?.push(
				paraglideWebpackPlugin({
					project: "./project.inlang",
					outdir: "./src/app/paraglide",
				})
			);
		}
		return config;
	},
};

export default nextConfig;
