import { context } from "esbuild"
import { globPlugin } from "esbuild-plugin-glob"
import { dtsPlugin } from "esbuild-plugin-d.ts"
import { buildTimeVariables } from "./src/buildTimeVariables.js"

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
	define: buildTimeVariables(),
})

if (isDevelopment) {
	await ctx.watch()
} else {
	await ctx.rebuild()
	await ctx.dispose()
}
