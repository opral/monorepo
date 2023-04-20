import { DefineConfig, initialize$import } from "@inlang/core/config"
import fs from "node:fs/promises"
import { resolve } from "node:path"

// eslint-disable-next-line @typescript-eslint/no-empty-function
async function readInlangConfig() {
	const $import = initialize$import({
		// @ts-ignore TODO: this should be fixed
		fs,
		fetch,
	})

	const cwd = process.cwd()

	const module = (await import(/* @vite-ignore */ resolve(cwd, "./inlang.config.js"))) as
		| { defineConfig: DefineConfig }
		| undefined
	if (!module || !module.defineConfig) {
		return undefined
	}

	const config = await module.defineConfig({
		// @ts-ignore TODO: this should be fixed
		$fs: fs,
		$import,
	})

	return config
}

export const initConfig = async () => {
	const config = await readInlangConfig()
	if (!config) return undefined


	// TODO: validate sdk related once we add entries to it
	// set defaults

	config.sdk = {
		...config.sdk,
		languageNegotiation: {
			strict: false,
			...config.sdk?.languageNegotiation,
			strategies: config.sdk?.languageNegotiation?.strategies || [
				{ type: 'url' },
				{ type: 'accept-language-header' },
				{ type: 'navigator' },
			]
		},
	}

	return config
}
