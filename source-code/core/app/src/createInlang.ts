import { InlangConfig } from "@inlang/config"
import type { InlangInstance } from "./api.js"
import { ImportFunction, createImport, resolveModules } from "@inlang/module"
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
	// TODO #1182 the filesystem type is incorrect. manual type casting is required
	const configFile = await args.nodeishFs.readFile(args.configPath, { encoding: "utf-8" })
	const configJson = JSON.parse(configFile)
	const config: InlangConfig = InlangConfig.passthrough().parse(configJson)

	const $import = args._import ?? createImport({ readFile: args.nodeishFs.readFile, fetch })

	const resolvedPluginApi = await resolveModules({
		config,
		$import,
	})

	return {} as any
}
