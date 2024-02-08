/**
 * This is the build script for the project.
 */

import { context } from "esbuild"

// eslint-disable-next-line no-undef
const isDev = process?.env?.DEV !== undefined

const defaultEntryPoints = [{ in: "./src/main.ts", out: "./main" }]

// Production configuration
/** @type {import("esbuild").BuildOptions} */
let buildOptions = {
	entryPoints: defaultEntryPoints,
	outdir: "./dist/",
	outExtension: { ".js": ".cjs" },
	platform: "node",
	bundle: true,
	minify: true,
	sourcemap: false,
	external: ["vscode"],
	define: {
		ENV_DEFINED_IN_BUILD_STEP: JSON.stringify({
			IS_PRODUCTION: !isDev,
		}),
	},
}

// Dev configuration
if (isDev) {
	buildOptions = {
		...buildOptions,
		minify: false,
		sourcemap: true,
	}
}

const ctx = await context(buildOptions)

if (isDev) {
	await ctx.watch()
	// eslint-disable-next-line no-undef
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	// eslint-disable-next-line no-undef
	console.info("✅ build complete")
	await ctx.dispose()
}
