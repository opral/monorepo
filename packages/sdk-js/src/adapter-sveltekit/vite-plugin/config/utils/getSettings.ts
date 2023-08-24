import type { InlangProject } from "@inlang/app"
import { validateSdkConfig, type SdkConfig, type SdkConfigInput } from "@inlang/sdk-js-plugin"
import { InlangSdkException } from "../../exceptions.js"

export const defaultSdkPluginSettings = {
	"inlang.plugin.sdkJs": {
		languageNegotiation: {
			strategies: [
				{
					type: "localStorage",
				} as any,
			],
		},
	} satisfies SdkConfigInput,
}

export function getSettings(inlang: InlangProject) {
	const settings = inlang.appSpecificApi()["inlang.app.sdkJs"] as SdkConfig | undefined
	if (!settings) {
		// automatically add module if missing
		const config = inlang.config()
		inlang.setConfig({
			...config,
			modules: [...config.modules, "../../../../../sdk-js-plugin/dist/index.js"],
			settings: {
				...config.settings,
				...defaultSdkPluginSettings,
			},
		})

		console.info("Adding missing `inlang.app.sdkJs` module to `inlang.config.json` and applying default settings.")
		return undefined
	}

	try {
		// this already happens in the plugin, but we cannot be sure if any other plugin modifies that
		// to be on the safe side, we check again here
		return validateSdkConfig(settings)
	} catch (error) {
		return new InlangSdkException(`Invalid \`inlang.app.sdkJs\` config`, error as Error)
	}
}
