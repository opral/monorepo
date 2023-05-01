import { InlangConfig, InlangConfigModule, setupConfig } from "@inlang/core/config"
import { initialize$import } from '@inlang/core/environment'
import fs from "node:fs/promises"
import { resolve } from "node:path"
import { SdkConfig, validateSdkConfig } from './schema.js'

export type InlangConfigWithSdkProps = InlangConfig & {
	sdk?: SdkConfig
}

class InlangSdkConfigError extends Error { }

class InlangError extends Error { }

const readInlangConfig = async () => {
	const env = {
		$fs: fs,
		$import: initialize$import({
			fs,
			fetch: async (...args) => await fetch(...args)
				.catch(error => {
					// TODO: create an issue
					if (error instanceof TypeError && (error.cause as any)?.code === 'UND_ERR_CONNECT_TIMEOUT') {
						throw new InlangError(`

Node.js failed to resolve the URL. This can happen sometimes during development. Usually restarting the server helps.

	`, { cause: error })
					}

					throw error
				})
		})
	}
	const module = (await import(
		/* @vite-ignore */ resolve(process.cwd(), "./inlang.config.js")
	)) as InlangConfigModule

	return setupConfig({ module, env })
}

function assertConfigWithSdk(config: InlangConfig | undefined): asserts config is InlangConfigWithSdkProps {
	if (!config) {
		throw new InlangSdkConfigError('Could not find `inlang.config.js` in the root of your project.`')
	}

	if (!('sdk' in config)) {
		throw new InlangSdkConfigError('The `sdk` property is missing in your `inlang.config.js` file.`. Make sure to use the sdk plugin in your `inlang.config.js` file.')
	}
}

export const initConfig = async () => {
	const config = await readInlangConfig()
	assertConfigWithSdk(config)

	validateSdkConfig(config.sdk)

	return config
}
