import type { $fs } from "@inlang/core/environment"
import { type InlangConfig, type InlangConfigModule, setupConfig } from "@inlang/core/config"
import { initialize$import, type InlangEnvironment } from "@inlang/core/environment"
import type { SdkConfig } from "@inlang/sdk-js-plugin"
import { dedent } from "ts-dedent"
import { InlangSdkException } from '../adapter-sveltekit/vite-plugin/exceptions.js'

export type InlangConfigWithSdkProps = InlangConfig & {
	sdk: SdkConfig
}

export const initInlangEnvironment = async (): Promise<InlangEnvironment> => {
	const fs = await import("node:fs/promises").catch(
		() =>
			new Proxy({} as $fs, {
				get: (target, key) => {
					if (key === "then") return Promise.resolve(target)

					return () => {
						throw new InlangSdkException("`node:fs/promises` is not available in the current environment")
					}
				},
			}),
	)

	return {
		$fs: fs,
		$import: initialize$import({
			fs,
			fetch: async (...args) =>
				await fetch(...args).catch((error) => {
					// TODO: create an issue
					if (
						error instanceof TypeError &&
						(error.cause as any)?.code === "UND_ERR_CONNECT_TIMEOUT"
					) {
						throw new InlangSdkException(dedent`
								Node.js failed to resolve the URL. This can happen sometimes during development.
								Usually restarting the server helps.
							`,
							error,
						)
					}

					throw new InlangSdkException(`Failed to fetch from (${args[0]})`, error)
				}),
		}),
	}
}

export const initConfig = async (module: InlangConfigModule) => {
	if (!module) {
		throw new InlangSdkException("could not read `inlang.config.js`")
	}
	const env = await initInlangEnvironment()

	return setupConfig({ module, env })
}
