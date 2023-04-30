import { InlangConfigModule, setupConfig } from "@inlang/core/config"
import { initialize$import } from "@inlang/core/environment"
import fs from "node:fs/promises"
import { resolve } from "node:path"

// eslint-disable-next-line @typescript-eslint/no-empty-function
async function readInlangConfig() {
	const env = {
		$fs: fs,
		$import: initialize$import({
			fs,
			fetch,
		}),
	}

	const module = (await import(
		/* @vite-ignore */ resolve(process.cwd(), "./inlang.config.js")
	)) as InlangConfigModule

	const config = await setupConfig({ module, env })

	return config
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
