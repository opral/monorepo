/**
 * This is the build script for the project.
 *
 * It takes the source code and bundles it into a single file
 * that can be imported into an inlang project.
 */

import { context } from "esbuild"

// eslint-disable-next-line no-undef
const isDev = process?.env?.DEV !== undefined

const ctx = await context({
	entryPoints: ["./src/main.ts"],
	outfile: "./dist/main.cjs",
	bundle: true,
	platform: "node",
	sourcemap: isDev,
	external: ["vscode"],
})

if (isDev) {
	await ctx.watch()
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	console.info("✅ build complete")
	await ctx.dispose()
}
