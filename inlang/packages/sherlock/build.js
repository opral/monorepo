/**
 * This is the build script for the project.
 */

import { context } from "esbuild"
import esbuild from "esbuild"
import fs from "node:fs/promises"
import path from "node:path"

// eslint-disable-next-line no-undef
const isDev = process?.env?.DEV !== undefined

const defaultEntryPoints = [{ in: "./src/main.ts", out: "./main" }]
const packagesToCopy = [
	{
		src: "node_modules/lit-html/lit-html.js",
		dest: "./assets/lit-html.js",
		transpile: false,
	},
	{
		src: "node_modules/@inlang/settings-component/dist/bundled/index.js",
		dest: "./assets/settings-component.js",
		transpile: false,
	},
	{
		src: "node_modules/@inlang/editor-component/dist/bundled/index.js",
		dest: "./assets/editor-component.js",
		transpile: false,
	},
]

// Copy complete directory to assets
const packagesToCopyDir = [
	{
		src: "src/utilities/editor/sherlock-editor-app/build",
		dest: "./assets/sherlock-editor-app",
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
	await copyDirectories()
	await ctx.watch()
	console.info("👀 watching for changes...")
} else {
	await copyDirectories()
	await ctx.rebuild()
	console.info("✅ build complete")
	await ctx.dispose()
}

// Function to copy required files to assets folder
async function copyDependencies() {
	for (const { src, dest, transpile } of packagesToCopy) {
		try {
			// Ensure the destination directory exists
			const destDir = path.dirname(dest)
			await fs.mkdir(destDir, { recursive: true })

			if (transpile) {
				// Transpile from js to mjs
				await esbuild.build({
					entryPoints: [src],
					outfile: dest,
					format: "esm",
					bundle: true,
					platform: "browser",
					sourcemap: false,
					external: [],
				})
			} else {
				// Copy the file, resolving the symlink if necessary
				const resolvedPath = await fs.realpath(src)
				await fs.copyFile(resolvedPath, dest)
			}
		} catch (err) {
			console.error(`Error processing ${src} to ${dest}:`, err)
		}
	}
}

// Function to copy required directories to assets folder
async function copyDirectories() {
	for (const { src, dest } of packagesToCopyDir) {
		try {
			// Check if the source directory exists
			await fs.access(src)

			await fs.mkdir(dest, { recursive: true })
			await copyDir(src, dest)

			console.info(`Copied directory: ${src} -> ${dest}`)
		} catch (err) {
			console.error(`Error copying directory ${src} -> ${dest}:`, err)
		}
	}
}

// Recursive function to copy directories
/**
 * @param {string} src
 * @param {string} dest
 */
async function copyDir(src, dest) {
	await fs.mkdir(dest, { recursive: true })
	const entries = await fs.readdir(src, { withFileTypes: true })
	for (const entry of entries) {
		const srcPath = path.join(src, entry.name)
		const destPath = path.join(dest, entry.name)
		if (entry.isDirectory()) {
			await copyDir(srcPath, destPath)
		} else {
			await fs.copyFile(srcPath, destPath)
		}
	}
}
