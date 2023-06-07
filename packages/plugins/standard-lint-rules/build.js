import { context } from "esbuild"
import { pluginBuildConfig } from "@inlang/core/plugin"

const ctx = await context(
	await pluginBuildConfig({
		entryPoints: ["src/index.ts"],
		outfile: "dist/index.js",
		// minification is disabled in dev mode for better debugging
		// eslint-disable-next-line no-undef
		minify: !process.env.DEV,
	}),
)

// eslint-disable-next-line no-undef
if (process.env.DEV) {
	await ctx.watch()
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	console.info("✅ build complete")
	await ctx.dispose()
}
