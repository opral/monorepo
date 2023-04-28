import { Config, DefineConfig, initialize$import } from "@inlang/core/config"
import fs from "node:fs/promises"
import { resolve } from "node:path"
import { SdkConfig, validateConfig } from './schema.js'

export type ConfigWithSdk = Config & {
	sdk?: SdkConfig
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const readInlangConfig = async () => {
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

	return config as ConfigWithSdk
}

export const initConfig = async () => {
	const config = await readInlangConfig()
	if (!config) return undefined

	validateConfig(config.sdk)

	return config
}
