import { InlangConfig, InlangConfigModule, setupConfig } from "@inlang/core/config"
import { initialize$import, InlangEnvironment } from "@inlang/core/environment"
import * as fs from "node:fs"
import type { Result } from "@inlang/core/utilities"
import type { OptionValues } from "commander"
import { dirname, resolve } from "node:path"

// in case multiple commands run getConfig in the same process
let configCache: InlangConfig | undefined = undefined

const fsWrapper = (args: {
	fs: InlangEnvironment["$fs"]
	configPath: string
}): InlangEnvironment["$fs"] => {
	return {
		mkdir: async (..._args: Parameters<InlangEnvironment["$fs"]["mkdir"]>) => {
			// modify args with configPath
			_args[0] = resolve(args.configPath, _args[0])
			return args.fs.mkdir(..._args)
		},
		readFile: async (..._args: Parameters<InlangEnvironment["$fs"]["readFile"]>) => {
			// modify args with configPath
			_args[0] = resolve(args.configPath, _args[0])
			return args.fs.readFile(..._args)
		},
		writeFile: async (..._args: Parameters<InlangEnvironment["$fs"]["writeFile"]>) => {
			// modify args with configPath
			_args[0] = resolve(args.configPath, _args[0])
			return args.fs.writeFile(..._args)
		},
		readdir: async (..._args: Parameters<InlangEnvironment["$fs"]["readdir"]>) => {
			// modify args with configPath
			_args[0] = resolve(args.configPath, _args[0])
			return args.fs.readdir(..._args)
		},
	}
}

export async function getConfig(args: {
	options: OptionValues
}): Promise<Result<InlangConfig, "No inlang.config.js file found in the repository.">> {
	if (configCache) return [configCache]

	const $fs = fsWrapper({
		fs: fs.promises,
		configPath: args.options.config ? dirname(args.options.config) : process.cwd(),
	})

	// Set up the environment functions
	const env: InlangEnvironment = {
		$fs,
		$import: initialize$import({
			fs: $fs,
			fetch,
		}),
	}

	const baseDirectory = process.cwd()
	const filePath = args.options.config
		? resolve(baseDirectory, args.options.config)
		: resolve(baseDirectory, "inlang.config.js")

	if (!fs.existsSync(filePath)) {
		return [undefined, "No inlang.config.js file found in the repository."]
	}

	// Need to manually import the config because CJS projects
	// might fail otherwise. See https://github.com/inlang/inlang/issues/789
	const file = fs.readFileSync(filePath, "utf-8")
	const module: InlangConfigModule = await import(
		"data:application/javascript;base64," + btoa(file.toString())
	)

	const config = await setupConfig({
		module,
		env,
	})

	configCache = config
	return [config]
}
