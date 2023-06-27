import { context } from "esbuild"

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
		js: `import { createRequire } from 'node:module';const require = createRequire(import.meta.url);`,
	},
	define: {
		// eslint-disable-next-line no-undef
		ENV_DEFINED_IN_BUILD_STEP: JSON.stringify({
			isProduction: isProduction,
		}),
	},
	external: ["vscode"],
})

if (isProduction === false) {
	await ctx.watch()
	console.log("Watching for changes...")
} else {
	await ctx.rebuild()
	await ctx.dispose()
}
