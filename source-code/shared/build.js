import { context } from "esbuild"
import { globPlugin } from "esbuild-plugin-glob"
import { dtsPlugin } from "esbuild-plugin-d.ts"

// eslint-disable-next-line no-undef
const isDevelopment = process.env.DEV ? true : false

/**
 * @type {import("esbuild").BuildOptions}
 */
const commonConfig = {
	bundle: false,
	outdir: "./dist",
	sourcemap: isDevelopment,
	platform: "neutral",
	format: "esm",
	plugins:
		// @ts-ignore
		[globPlugin(), dtsPlugin()],
}

/**
 * Client side build config.
 */
const clientSide = await context({
	...commonConfig,
	entryPoints: ["lib/**/*.ts"],
})

/**
 * Server side build config.
 */
const serverSide = await context({
	...commonConfig,
	entryPoints: ["lib/**/*.server.ts"],
})

// building or watching
if (isDevelopment) {
	await clientSide.watch()
	await serverSide.watch()
	console.info("👀 watching for changes...")
} else {
	await clientSide.rebuild()
	// await serverSide.rebuild()
	await clientSide.dispose()
	await serverSide.dispose()
	console.info("✅ build complete")
}
