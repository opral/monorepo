import { context } from "esbuild"
import path from "node:path"
import fs from "fs-extra"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// eslint-disable-next-line no-undef
const isProduction = process.env.NODE_ENV === "production"

const ctx = await context({
	entryPoints: ["./src/main.ts"],
	bundle: true,
	outdir: "./dist",
	platform: "node",
	format: "esm",
	target: "node16",
	// for easier debugging production issues, don't minify. KB size is not a concern for a node CLI
	minify: false,
	// https://github.com/evanw/esbuild/issues/1921#issuecomment-1403107887
	banner: {
		js: `
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// ----- polyfilling for module build command -----

import pathPolyfill123 from "node:path"
import { fileURLToPath as fileURLToPathPolyfill123 } from "node:url"
const __filename = fileURLToPathPolyfill123(import.meta.url)
const __dirname = pathPolyfill123.dirname(__filename)

// -------------------------------------------------
`,
	},
	define: {
		// eslint-disable-next-line no-undef
		ENV_DEFINED_IN_BUILD_STEP: JSON.stringify({
			IS_PRODUCTION: isProduction,
			// eslint-disable-next-line no-undef
			PUBLIC_POSTHOG_TOKEN: process.env.PUBLIC_POSTHOG_TOKEN,
		}),
	},
	external: ["esbuild-wasm"],
})

// TODO: #1773 this line crashes NX because it changes the output folder irrespective of nx caching
// copying templates to dist folder to bundle them in the cli and avoid having to install them separately
// eslint-disable-next-line no-undef
fs.copySync(path.join(__dirname, "../templates"), path.join(__dirname, "./dist/templates"), {
	overwrite: true,
	filter: (src) => src.includes("node_modules") === false,
})

if (isProduction === false) {
	await ctx.watch()
	// eslint-disable-next-line no-undef
	console.info("Watching for changes...")
} else {
	await ctx.rebuild()
	await ctx.dispose()
}

