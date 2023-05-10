import type { $fs } from '@inlang/core/environment'
import { type InlangConfig, type InlangConfigModule, setupConfig } from "@inlang/core/config"
import { initialize$import, InlangEnvironment } from '@inlang/core/environment'
import type { SdkConfigInput } from '@inlang/sdk-js-plugin'
import { dedent } from 'ts-dedent'

export type InlangConfigWithSdkProps = InlangConfig & {
	sdk?: SdkConfigInput
}

export class InlangError extends Error { }

export const initConfig = async (module: InlangConfigModule) => {
	if (!module) {
		throw Error("could not read `inlang.config.js`")
	}

	const fs = await import('node:fs/promises')
		.catch(() => new Proxy({} as $fs, {
			get: () => () => {
				throw new InlangError('`node:fs/promises` is not available in the current environment')
			}
		}))

	const env = {
		$fs: fs,
		$import: initialize$import({
			fs,
			fetch: async (...args) => await fetch(...args)
				.catch(error => {
					// TODO: create an issue
					if (error instanceof TypeError && (error.cause as any)?.code === 'UND_ERR_CONNECT_TIMEOUT') {
						throw new InlangError(dedent`

								Node.js failed to resolve the URL. This can happen sometimes during development. Usually restarting the server helps.

							`,
							{ cause: error }
						)
					}

					throw error
				})
		})
	} satisfies InlangEnvironment

	return setupConfig({ module, env })
}
