import fs from "node:fs";
import type { NextConfig } from "next";
import {
	paraglideWebpackPlugin,
	type CompilerOptions,
} from "@inlang/paraglide-js";

/**
 * Reads a file from the file system and returns it as a string.
 */
const file = (path: string) => ({
	[path]: fs.readFileSync(new URL(path, import.meta.url), "utf-8"),
});

/**
 * Extends a Next.js configuration with Paraglide.
 *
 * @example
 *   // next.config.mjs
 *   import { withParaglideNext } from "@inlang/paraglide-next";
 *   export default withParaglideNext({
 *     paraglide: {
 *       project: "./project.inlang",
 *       outdir: "./src/lib/paraglide",
 *     },
 *     // other Next.js configuration
 *   });
 */
export function withParaglideNext(
	config: NextConfig & {
		paraglide: CompilerOptions;
	}
): NextConfig {
	const extendedConfig: NextConfig = {
		...config,
		webpack: (webpackConfig) => {
			webpackConfig.plugins.push(
				paraglideWebpackPlugin({
					...config.paraglide,
					additionalFiles: {
						...file("adapter.js"),
						...file("adapter.provider.jsx"),
					},
				})
			);
			return webpackConfig;
		},
	};
	delete extendedConfig.paraglide;
	return extendedConfig;
}
