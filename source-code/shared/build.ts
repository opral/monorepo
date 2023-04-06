import { context } from "esbuild"
import { globPlugin } from "esbuild-plugin-glob"
import { dtsPlugin } from "esbuild-plugin-d.ts"
import { validateEnvVariables, definePublicEnvVariables, isDevelopment } from "./env.js"

await validateEnvVariables()

// @ts-expect-error - esbuild plugin types are wrong
const ctx = await context({
	entryPoints: ["./lib/**/*.ts", "env.ts"],
	plugins: [globPlugin({ ignore: ["**/*.test.ts"] }), dtsPlugin()],
	outdir: "./dist",
	bundle: false,
	sourcemap: isDevelopment,
	platform: "neutral",
	format: "esm",
	define: await definePublicEnvVariables(),
})

if (isDevelopment) {
	await ctx.watch()
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	await ctx.dispose()
	console.info("✅ build complete")
}
