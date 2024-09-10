/**
 * This is the build script for the project.
 */

import { context } from "esbuild"
import fs from "node:fs/promises"
import path from "node:path"

// eslint-disable-next-line no-undef
const isDev = process?.env?.DEV !== undefined

const defaultEntryPoints = [{ in: "./src/main.ts", out: "./main" }]
const packagesToCopy = [
	{ src: "node_modules/lit-html/lit-html.js", dest: "./assets/lit-html.js" },
	{
		src: "node_modules/@inlang/settings-component/dist/index.mjs",
		dest: "./assets/settings-component.mjs",
	},
]

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
			// eslint-disable-next-line no-undef
			PUBLIC_POSTHOG_TOKEN: process.env?.PUBLIC_POSTHOG_TOKEN,
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
	await copyDependencies()
	await ctx.watch()
	// eslint-disable-next-line no-undef
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	// eslint-disable-next-line no-undef
	console.info("✅ build complete")
	await ctx.dispose()
}

// Function to copy required files to assets folder
async function copyDependencies() {
	for (const { src, dest } of packagesToCopy) {
		try {
			// Ensure the destination directory exists
			const destDir = path.dirname(dest)
			await fs.mkdir(destDir, { recursive: true })

			// Copy the file, resolving the symlink if necessary
			const resolvedPath = await fs.realpath(src)
			await fs.copyFile(resolvedPath, dest)
		} catch (err) {
			console.error(`Error copying ${src} to ${dest}:`, err) // eslint-disable-line no-undef
		}
	}
}
