import { context } from "esbuild"

// eslint-disable-next-line no-undef
const dev = !!process.env.DEV

/** @type {import('esbuild').BuildOptions} */
const options = ({
	entryPoints: ["./src/adapter-sveltekit/index.ts"],
	outfile: "./dist/adapter-sveltekit/index.js",
	bundle: true,
	platform: "node",
	format: "esm",
	target: "es2020",
	sourcemap: !dev,
	minify: !dev,
	splitting: false,
	external: ['svelte/compiler', '@sveltejs/kit/vite'],
})

const ctx = await context(options)

if (dev) {
	await ctx.watch()
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	console.info("✅ build complete")
	await ctx.dispose()
}
