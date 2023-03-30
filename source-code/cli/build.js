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
	minify: isProduction,
	// https://github.com/evanw/esbuild/issues/1921#issuecomment-1403107887
	banner: {
		js: `import { createRequire } from 'node:module';const require = createRequire(import.meta.url);`,
	},
})

if (isProduction === false) {
	await ctx.watch()
	console.log("Watching for changes...")
} else {
	await ctx.rebuild()
	await ctx.dispose()
}
