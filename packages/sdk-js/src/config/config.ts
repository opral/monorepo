import type { NodeishFilesystemSubset } from "@inlang/app"
import type { InlangConfig } from "@inlang/app"
import type { SdkConfig } from "@inlang/sdk-js-plugin"
import { dedent } from "ts-dedent"
import { InlangSdkException } from "../adapter-sveltekit/vite-plugin/exceptions.js"

export type InlangConfigWithSdkProps = InlangConfig & {
	sdk: SdkConfig
}

// @ts-ignore
export const initInlangEnvironment = async (): Promise<InlangEnvironment> => {
	const fs = await import("node:fs/promises").catch(
		() =>
			new Proxy({} as NodeishFilesystemSubset, {
				get: (target, key) => {
					if (key === "then") return Promise.resolve(target)

					return () => {
						throw new InlangSdkException(
							"`node:fs/promises` is not available in the current environment",
						)
					}
				},
			}),
	)

	return {
		$fs: fs,
		// @ts-ignore
		$import: initialize$import({
			fs,
			// @ts-ignore
			fetch: async (...args) =>
				// @ts-ignore
				await fetch(...args).catch((error) => {
					// TODO: create an issue
					if (
						error instanceof TypeError &&
						(error.cause as any)?.code === "UND_ERR_CONNECT_TIMEOUT"
					) {
						throw new InlangSdkException(
							dedent`
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

export const initConfig = async (module: any) => {
	if (!module) {
		throw new InlangSdkException("could not read `inlang.config.js`")
	}
	const env = await initInlangEnvironment()

	// @ts-ignore
	return setupConfig({ module, env })
}
