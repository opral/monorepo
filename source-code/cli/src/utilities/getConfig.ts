import { InlangConfig, InlangConfigModule, setupConfig } from "@inlang/core/config"
import { initialize$import, InlangEnvironment } from "@inlang/core/environment"
import fs from "node:fs"
import type { Result } from "@inlang/core/utilities"

// in case multiple commands run getConfig in the same process
let configCache: InlangConfig | undefined = undefined

export async function getConfig(): Promise<
	Result<InlangConfig, "No inlang.config.js file found in the repository.">
> {
	if (configCache) return [configCache]
	// Set up the environment functions
	const env: InlangEnvironment = {
		$import: initialize$import({
			fs: fs.promises,
			fetch,
		}),
		$fs: fs.promises,
	}

	const filePath = process.cwd() + "/inlang.config.js"

	if (!fs.existsSync(filePath)) {
		return [undefined, "No inlang.config.js file found in the repository."]
	}

	// Need to manually import the config because CJS projects
	// might fail otherwise. See https://github.com/inlang/inlang/issues/789
	const file = fs.readFileSync(filePath, "utf-8")
	const module: InlangConfigModule = await import(
		"data:application/javascript;base64," + btoa(file.toString())
	)

	const config = await setupConfig({
		module,
		env,
	})

	configCache = config
	return [config]
}
