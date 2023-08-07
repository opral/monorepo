import { InlangConfig } from "@inlang/config"
import type { InlangInstance } from "./api.js"
import { createImport, ImportFunction, resolveModules } from "@inlang/module"
// @ts-ignore
import { createSignal, createRoot } from "solid-js/dist/solid.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"

/**
 * Creates an inlang instance.
 *
 * - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy modules such as CJS.
 *
 */
export async function createInlang(args: {
	configPath: string
	nodeishFs: NodeishFilesystemSubset
	_import?: ImportFunction
}): Promise<InlangInstance> {
	return createRoot(async () => {
		// just for testing
		if (!args.nodeishFs) return {} as any
		// TODO #1182 the filesystem type is incorrect. manual type casting is required
		const configFile = (await args.nodeishFs.readFile(args.configPath, {
			encoding: "utf-8",
		})) as string
		const configJson = JSON.parse(configFile)

		const parsedConfig: InlangConfig = InlangConfig.passthrough().parse(configJson)

		const $import = args._import ?? createImport({ readFile: args.nodeishFs.readFile, fetch })

		const resolvedModules = await resolveModules({ config: parsedConfig, $import })

		const [config, setConfig] = createSignal<InlangConfig>(parsedConfig)
		const [lintRules, setLintRules] = createSignal<Record<string, any>>({})

		for (const rule of Object.values(resolvedModules.data.lintRules)) {
			console.log(rule)
		}

		return {
			config: {
				get: config,
				set: setConfig,
			},
			lint: {
				rules: {} as any,
				reports: {} as any,
				exceptions: {} as any,
			},
			plugins: {} as any,
			messages: {} as any,
		}
	})
}
