/**
 * This is the build script for the project.
 *
 * It takes the source code and bundles it into a single file
 * that can be imported into an inlang project.
 */

import { context } from "esbuild"

// eslint-disable-next-line no-undef
const isDev = process?.env?.DEV !== undefined
// eslint-disable-next-line no-undef
const isTest = process?.env?.TEST !== undefined

const entryPoints = [{ in: "./src/main.ts", out: "./main" }]
if (isTest) {
	entryPoints.push({ in: "./test/test.ts", out: "./test" });
	entryPoints.push({ in: "./test/suite.ts", out: "./suite" });
}

const ctx = await context({
	entryPoints,
	outdir: "./dist/",
	outExtension: { '.js': '.cjs' },
	bundle: true,
	minify: !isDev && !isTest,
	platform: "node",
	sourcemap: isDev || isTest,
	external: ["vscode", "@vitest/ui", "@vitest/browser", "webdriverio", "safaridriver", "playwright"],
})

if (isDev) {
	await ctx.watch()
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	console.info("✅ build complete")
	await ctx.dispose()
}
