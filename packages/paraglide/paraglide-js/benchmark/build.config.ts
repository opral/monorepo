import { type UserConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export function createViteConfig(args: {
	outdir: string;
	base: string;
}): UserConfig {
	return {
		logLevel: "error",
		base: args.base,
		build: {
			outDir: args.outdir,
			minify: false,
			target: "es2024",
			// don't load the module preload to keep the bundle free
			// from side effects that could affect the benchmark
			modulePreload: false,
		},
		define: {
			// using process.env to make ssg build work
			"process.env.BASE": JSON.stringify(args.base),
		},
		plugins: [
			paraglideVitePlugin({
				project: "./project.inlang",
				outdir: "./src/paraglide",
				isServer: "false",
			}),
		],
	};
}
