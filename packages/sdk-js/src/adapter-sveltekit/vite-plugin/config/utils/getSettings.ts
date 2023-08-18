import type { InlangInstance } from '@inlang/app'
import type { SdkConfig } from '@inlang/sdk-js-plugin'
import { dedent } from 'ts-dedent'
import { InlangSdkException } from '../../exceptions.js'

class InlangSdkConfigException extends InlangSdkException { }

// TODO: automatically add modules if missing ???
export function getSettings(inlang: InlangInstance) {
	const settings = inlang.appSpecificApi()["inlang.app.sdkJs"] as SdkConfig | undefined
	if (!settings) {
		throw new InlangSdkConfigException(dedent`
				Invalid config. Make sure to add the 'inlang.plugin.sdkJs' to your 'inlang.config.json' file.
				See https://inlang.com/documentation/sdk/configuration
			`)
	}

	return settings
}
