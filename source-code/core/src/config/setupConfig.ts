import type { Config, DefineConfig, EnvironmentFunctions } from "./schema.js"
import { setupPlugins } from "../plugin/setupPlugins.js"
import { zConfig } from "./zod.js"

export async function setupConfig(args: {
	env: EnvironmentFunctions
	defineConfig: DefineConfig
}): Promise<Config> {
	const config = await args.defineConfig(args.env)
	await setupPlugins({ config, env: args.env })
	return zConfig.parse(config) as Config
}
