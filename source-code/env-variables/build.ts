import { context } from "esbuild"
import { globPlugin } from "esbuild-plugin-glob"
import { dtsPlugin } from "esbuild-plugin-d.ts"
import { privateEnv } from "./src/index.js"
import { definePublicEnvVariables } from "./src/definePublicEnvVariables.js"

const isDevelopment = process.env.DEV ? true : false

// @ts-expect-error - esbuild plugin types are wrong
const ctx = await context({
	entryPoints: ["./src/**/*.ts", "env.ts"],
	plugins: [globPlugin({ ignore: ["**/*.test.ts"] }), dtsPlugin()],
	outdir: "./dist",
	bundle: false,
	platform: "neutral",
	format: "esm",
	sourcemap: isDevelopment,
	define: definePublicEnvVariables({
		PUBLIC_IS_DEV: isDevelopment ? "true" : "false",
		...privateEnv,
	}),
})

if (isDevelopment) {
	await ctx.watch()
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	await ctx.dispose()
	console.info("✅ build complete")
}
