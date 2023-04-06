import { context } from "esbuild"
import { globPlugin } from "esbuild-plugin-glob"
import { dtsPlugin } from "esbuild-plugin-d.ts"
import { validateEnvVariables, isDevelopment } from "./env.js"

await validateEnvVariables()

// @ts-expect-error - esbuild plugin types are wrong
const ctx = await context({
	entryPoints: ["lib/**/*.ts"],
	bundle: false,
	outdir: "./dist",
	sourcemap: isDevelopment,
	platform: "neutral",
	format: "esm",
	plugins: [globPlugin(), dtsPlugin()],
	define: {
		// definining DEV manually to be certain to use the `isDevelopment`
		// variable in the browser
		"process.env.DEV": isDevelopment ? "true" : "false",
		// defining public env variables
		...Object.fromEntries(
			Object.keys(process.env)
				.filter((key) => key.startsWith("PUBLIC_"))
				.map((key) => [`process.env.${key}`, process.env[key]]),
		),
	},
})

if (isDevelopment) {
	await ctx.watch()
	console.info("👀 watching for changes...")
} else {
	await ctx.rebuild()
	await ctx.dispose()
	console.info("✅ build complete")
}
