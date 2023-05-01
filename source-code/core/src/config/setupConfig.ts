import type { InlangConfig, InlangConfigModule } from "./schema.js"
import { setupPlugins } from "../plugin/setupPlugins.js"
import { zConfig } from "./zod.js"
import type { InlangEnvironment } from "../environment/types.js"

/**
 * Sets up the inlang config module.
 *
 * @example
 * 	import { setupConfig, type InlangConfigModule } from "@inlang/core/config"
 *
 * 	const module = (await import("./inlang.config.js")) as InlangConfigModule
 * 	const config = await setupConfig({ module, env })
 */
export async function setupConfig(args: {
	module: InlangConfigModule
	env: InlangEnvironment
}): Promise<InlangConfig> {
	if (args.module.defineConfig === undefined) {
		throw new Error(`The "defineConfig" function is missing from the "inlang.config.js" file.`)
	}
	const config = await args.module.defineConfig(args.env)
	await setupPlugins({ config, env: args.env })
	return zConfig.passthrough().parse(config) as InlangConfig
}
