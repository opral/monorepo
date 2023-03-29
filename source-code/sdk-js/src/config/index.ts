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

	const module = (await import(/* @vite-ignore */ resolve(cwd, "./inlang.config.js")).catch(
		() => undefined,
	)) as { defineConfig: DefineConfig } | undefined
	if (!module || !module.defineConfig) {
		return undefined
	}

	const config = await module
		.defineConfig({
			// @ts-ignore TODO: this should be fixed
			$fs: fs,
			$import,
		})
		.catch(() => undefined)

	return config
}

export const initConfig = () => {
	const config = readInlangConfig()
	if (!config) return undefined

	// TODO: validate sdk related once we add entries to it

	return config
}
