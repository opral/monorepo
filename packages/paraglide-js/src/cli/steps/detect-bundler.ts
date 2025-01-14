import type { CliStep } from "../utils.js";

export const detectBundler: CliStep<
	{ fs: typeof import("node:fs/promises") },
	| {
			bundler?: undefined;
			configPath?: undefined;
	  }
	| {
			bundler: "vite";
			configPath: string;
	  }
> = async (ctx) => {
	const potentialViteConfigPaths = ["./vite.config.js", "./vite.config.ts"];

	const viteConfigPath = await Promise.all(
		potentialViteConfigPaths.map(async (path) => ({
			path,
			exists: await ctx.fs
				.access(path)
				.then(() => true)
				.catch(() => false),
		}))
	).then((results) => results.find((result) => result.exists)?.path);

	if (!viteConfigPath) {
		return {
			...ctx,
			bundler: undefined,
		};
	}

	return {
		...ctx,
		bundler: "vite",
		configPath: viteConfigPath,
	};
};
