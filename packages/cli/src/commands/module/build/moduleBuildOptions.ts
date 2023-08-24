import type { BuildOptions, Plugin } from "esbuild-wasm"

export const moduleBuildOptions = (args: {
	entry: string
	outdir: string
	minify: boolean
	plugins?: Plugin[]
}): BuildOptions => {
	return {
		entryPoints: [args.entry],
		outdir: args.outdir,
		minify: args.minify,
		// ----------------------------------
		// allow top level await
		// https://caniuse.com/mdn-javascript_operators_await_top_level
		target: "es2022",
		// inlang does not support import maps
		bundle: true,
		// esm to work in the browser
		format: "esm",
		//! extremly important to be platform neutral
		//! to ensure that modules run in browser
		//! and server contexts.
		platform: "neutral",
		// sourcemaps are unused at the moment
		sourcemap: false,
		plugins: args.plugins,
	}
}
