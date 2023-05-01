import { InlangConfigModule, setupConfig } from "@inlang/core/config"
import { initialize$import } from "@inlang/core/environment"
import fs from "node:fs/promises"
import { resolve } from "node:path"

class InlangError extends Error { }

// eslint-disable-next-line @typescript-eslint/no-empty-function
async function readInlangConfig() {
	const env = {
		$fs: fs,
		$import: initialize$import({
			// @ts-ignore TODO: this should be fixed
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

export const initConfig = async () => {
	const config = await readInlangConfig()
	if (!config) return undefined

	// TODO: validate sdk related once we add entries to it

	// set defaults
	// TODO: set defaults for the IDE extension
	// TODO: setting defaults needs to happen inside `defineConfig` so the IDE extension can use them
	config.sdk = {
		...config.sdk,
		languageNegotiation: {
			strict: false,
			...config.sdk?.languageNegotiation,
			strategies: config.sdk?.languageNegotiation?.strategies || [
				{ type: "url" },
				{ type: "accept-language-header" },
				{ type: "navigator" },
			],
		},
	}

	return config
}
