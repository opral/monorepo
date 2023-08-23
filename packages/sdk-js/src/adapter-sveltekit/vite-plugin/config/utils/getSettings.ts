import type { InlangProject } from "@inlang/app"
import { type SdkConfig, validateSdkConfig } from "@inlang/sdk-js-plugin"
import { InlangSdkException } from "../../exceptions.js"

export function getSettings(inlang: InlangProject) {
	const settings = inlang.appSpecificApi()["inlang.app.sdkJs"] as SdkConfig | undefined
	if (!settings) {
		// automatically add module if missing
		const config = inlang.config()
		inlang.setConfig({
			...config,
			modules: [...config.modules, "../../../../../sdk-js-plugin/dist/index.js"],
			// TODO: add default settings too
		})

		console.info("Adding missing `inlang.app.sdkJs` module to `inlang.config.json`")

		return undefined
	}

	try {
		return validateSdkConfig(settings)
	} catch (error) {
		// TODO: better error class
		throw new InlangSdkException(`Invalid \`inlang.app.sdkJs\` config`, error as Error)
	}
}
