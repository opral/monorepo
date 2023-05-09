import { type InlangConfig, type InlangConfigModule, setupConfig } from "@inlang/core/config"
import { initialize$import } from '@inlang/core/environment'
import fs from "node:fs/promises"
import type { SdkConfigInput } from '../plugin/schema.js'

export type InlangConfigWithSdkProps = InlangConfig & {
	sdk?: SdkConfigInput
}

export class InlangError extends Error { }

const setupInlangConfig = async (module: InlangConfigModule) => {
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

	return setupConfig({ module, env })
}

export const initConfig = async (module: InlangConfigModule) => {
	if (!module) {
		throw Error("could not read `inlang.config.js`")
	}

	return setupInlangConfig(module)
}
