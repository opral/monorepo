import { context } from "esbuild"
import { globPlugin } from "esbuild-plugin-glob"
import { dtsPlugin } from "esbuild-plugin-d.ts"
import { buildStepVariables, rootEnvFilePath } from "./src/build/buildStepVariables.js"
import { validateEnvVariables } from "./src/validateEnvVariables.js"
import { fetchPublicEnv } from "./src/build/fetchPublicEnv.js"
import { config } from "dotenv"

const isDevelopment = process.env.DEV ? true : false

// load env files from the root of the project (if exist)
config({ path: rootEnvFilePath, override: true })

// Not validating for production under any circumstances, because
// this module can't know if a dependency requires all production env variables.
//
// Instead, apps need to validate for production themselves.
const [, errors] = validateEnvVariables({ forProduction: false })

if (errors) {
	console.log("💡 Some env variables are not defined. Fetching public env variables remotely...")
	console.log(errors)
	// some required env variables are missing. fetch public env variables from the server
	await fetchPublicEnv()
	const [, stillErrors] = validateEnvVariables({ forProduction: isDevelopment === false })
	if (stillErrors) {
		console.log("🚨 Some env variables are still not defined, even after fetching. Exiting...")
		console.log(stillErrors)
		process.exit(1)
	}
}

// @ts-expect-error - esbuild plugin types are wrong
const ctx = await context({
	entryPoints: ["./src/**/*.ts", "env.ts"],
	plugins: [globPlugin({ ignore: ["**/*.test.ts"] }), dtsPlugin()],
	outdir: "./dist",
	bundle: false,
	platform: "neutral",
	format: "esm",
	sourcemap: isDevelopment,
	define: buildStepVariables(),
})

if (isDevelopment) {
	await ctx.watch()
} else {
	await ctx.rebuild()
	await ctx.dispose()
}
