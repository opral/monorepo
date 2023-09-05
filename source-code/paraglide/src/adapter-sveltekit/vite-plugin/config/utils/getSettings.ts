import type { InlangProject } from "@inlang/sdk"
import {
	validateSdkConfig,
	type SdkConfig,
	type SdkConfigInput,
} from "../../../../../../plugins/paraglide/dist/index.js"
import { InlangSdkException } from "../../exceptions.js"

export const defaultSdkPluginSettings = {
	"library.inlang.paraglideJs": {
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
	const settings = inlang.customApi()["library.inlang.paraglideJs"] as SdkConfig | undefined
	if (!settings) {
		// automatically add module if missing
		const config = inlang.config()
		inlang.setConfig({
			...config!,
			modules: [...config!.modules, "../../../../../../paraglide/dist/index.js"],
			settings: {
				...config!.settings,
				...defaultSdkPluginSettings,
			},
		})

		console.info(
			"Adding missing `app.sdkJs` module to `project.inlang.json` and applying default settings.",
		)
		return undefined
	}

	try {
		// this already happens in the plugin, but we cannot be sure if any other plugin modifies that
		// to be on the safe side, we check again here
		return validateSdkConfig(settings)
	} catch (error) {
		return new InlangSdkException(`Invalid \`app.inlang.paraglideJs\` config`, error as Error)
	}
}
