import type { InlangProject } from '@inlang/app'
import type { SdkConfig } from '@inlang/sdk-js-plugin'

export function getSettings(inlang: InlangProject) {
	const settings = inlang.appSpecificApi()["inlang.app.sdkJs"] as SdkConfig | undefined
	if (settings) return settings

	// automatically add module if missing
	const config = inlang.config()
	inlang.setConfig({
		...config,
		modules: [...config.modules, "../../../../../sdk-js-plugin/dist/index.js"]
	})

	console.info('Adding missing `inlang.app.sdkJs` module to `inlang.config.json`')

	return undefined
}
