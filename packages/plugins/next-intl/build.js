import { context } from "esbuild";
import { execFileSync } from "node:child_process";

// eslint-disable-next-line no-undef
const isProduction = process.env.NODE_ENV === "production";

const ctx = await context({
	entryPoints: ["./src/index.ts"],
	outdir: "./dist",
	minify: isProduction,
	// ----------------------------------
	// allow top level await
	// https://caniuse.com/mdn-javascript_operators_await_top_level
	target: "es2022",
	// inlang does not support import maps
	bundle: true,
	// esm to work in the browser
	format: "esm",
	platform: "browser",
	// sourcemaps are unused at the moment
	sourcemap: false,
	plugins: [
		{
			// acorn-jsx requires acorn while micromark imports it: bundle one copy, the ES module
			name: "single-acorn",
			setup(build) {
				build.onResolve({ filter: /^acorn$/ }, (args) =>
					args.kind === "require-call"
						? build.resolve("acorn", {
								kind: "import-statement",
								resolveDir: args.resolveDir,
							})
						: undefined
				);
			},
		},
		{
			// micromark's browser build of it needs `document`: the plugin also runs in Node (CLI)
			name: "no-dom",
			setup(build) {
				build.onResolve(
					{ filter: /^decode-named-character-reference$/ },
					async (args) => {
						if (args.pluginData === "no-dom") return undefined;
						const result = await build.resolve(args.path, {
							kind: args.kind,
							resolveDir: args.resolveDir,
							pluginData: "no-dom",
						});
						return { path: result.path.replace(/index\.dom\.js$/, "index.js") };
					}
				);
			},
		},
	],
});

if (isProduction === false) {
	await ctx.watch();
	// eslint-disable-next-line no-undef
	console.info("Watching for changes...");
} else {
	await ctx.rebuild();
	await ctx.dispose();
	execFileSync(
		"tsc",
		[
			"-p",
			"tsconfig.build.json",
			"--emitDeclarationOnly",
			"--declaration",
			"--declarationMap",
			"false",
			"--outDir",
			"dist",
			"--noEmit",
			"false",
		],
		{ stdio: "inherit" }
	);
}
