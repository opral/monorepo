import type { DefineConfig, InlangConfig } from "@inlang/core/config"
import { initialize$import } from '@inlang/core/environment'
import fs from "node:fs/promises"
import { resolve } from "node:path"
import { SdkConfig, validateConfig } from './schema.js'

export type ConfigWithSdk = InlangConfig & {
	sdk?: SdkConfig
}

const readInlangConfig = async () => {
	const $import = initialize$import({
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
