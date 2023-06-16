/**
 * This is the build script for the project.
 *
 * It takes the source code and bundles it into a single file
 * that can be imported into an inlang project.
 */

import { context } from "esbuild"
import { pluginBuildConfig } from "@inlang/core/plugin"

const options = await pluginBuildConfig({
	entryPoints: ["./src/index.js"],
	outfile: "./dist/index.js",
	minify: false,
})

const ctx = await context(options)

// eslint-disable-next-line no-undef
if (process.env.DEV) {
	await ctx.watch()
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	console.info("✅ build complete")
	await ctx.dispose()
}
