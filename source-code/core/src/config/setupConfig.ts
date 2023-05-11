import type { InlangConfig, InlangConfigModule } from "./schema.js"
import { setupPlugins } from "../plugin/setupPlugins.js"
import { zConfig } from "./zod.js"
import type { InlangEnvironment } from "../environment/types.js"
import { dedent } from "ts-dedent"

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
	let config = await args.module.defineConfig(args.env)
	const [configWithPlugins, pluginErrors] = await setupPlugins({ config, env: args.env })
	config = configWithPlugins
	const configTest = zConfig.passthrough().safeParse(configWithPlugins)

	// throw an error. the config is broken without a path to recovery
	if (!configTest.success) {
		throw new Error(dedent`
The inlang.config.js is invalid. 

If plugins return errors, chances are high that the plugin errors are the root cause
for the config errors. Try to fix the plugin errors first.

---

# The following errors occured during the setup of plugins:

${pluginErrors ? pluginErrors.map((e) => e.message).join("\n") : "None ✅"}

# The following errors occured during the validation of the config:

${configTest.error.message}
`)
	}

	// plugins returned an error but the config is still usable
	// -> only log the errors
	if (pluginErrors) {
		for (const e of pluginErrors) console.error(e)
	}

	return configTest.data as InlangConfig
}
