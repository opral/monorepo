import { InlangConfigModule, setupConfig } from "@inlang/core/config"
import { initialize$import, InlangEnvironment } from "@inlang/core/environment"
import fs from "node:fs"
import { log } from "../utilities.js"

export const getConfig = async () => {
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
		log.error("No inlang.config.js file found in the repository.")
		return
	} else {
		log.info("✅ Using inlang config file at `" + filePath + "`")
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

	return config
}
