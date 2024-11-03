import { context } from "esbuild"
import { buildStepVariables, rootEnvFilePath } from "./src/build/buildStepVariables.js"
// import { validateEnvVariables } from "./src/validateEnvVariables.js"
import { config } from "dotenv"

const isDevelopment = process.env.DEV ? true : false

// load env files from the root of the project (if exist)
// but never override env variables loaded via process.env!
config({ path: rootEnvFilePath, override: false })

// Not validating for production under any circumstances, because
// this module can't know if a dependency requires all production env variables.
//
// Instead, apps need to validate for production themselves.
// const { error: errors } = validateEnvVariables({ forProduction: false })

// if (errors) {
// 	console.error(
// 		"❗️❗️ Some env variables are not defined or do not pass validation. Please check your doppler setup."
// 	)
// 	console.error(errors)
// 	process.exit(1)
// }

const ctx = await context({
	entryPoints: ["./src/**/*.ts"],
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
