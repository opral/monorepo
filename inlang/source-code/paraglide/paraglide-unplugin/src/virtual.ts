import { type UnpluginFactory } from "unplugin"
import path from "node:path"

type VirtualConfig = {
	/**
	 * The name of the virtual module
	 * @example `$paraglide`
	 */
	name: string
	/**
	 * Getter function for module code
	 *  @example ("runtime.js") => "export const languageTag = () => ..."
	 */
	getModule: (path: string) => string | undefined
}

/**
 * Serves a virtual directory under a prefix.
 * @example
 * ```ts
 * '$paraglide/runtime.js'
 * '$paraglide/messages/en.js'
 * ```
 */
export const virtual: UnpluginFactory<VirtualConfig> = ({
	name: virtualModuleName,
	getModule,
}: VirtualConfig) => {
	const prefix = virtualModuleName + "/"
	const resolvedPrefix = "\0" + prefix

	return {
		name: "@inlang/paraglide-unpligin:virtual",
		resolveId(id, importer, options) {
			// Handle imports that are virtual modules
			if (id.startsWith(prefix)) return "\0" + id
			// Handle relative imports from a virtual module
			if (importer?.startsWith(resolvedPrefix)) {
				const from = importer.replace(resolvedPrefix, "")
				const to = path.resolve(from, "..", id)
				const resolvedTo = to.slice(process.cwd().length + 1)
				return `${resolvedPrefix}${resolvedTo}`
			}

			// not ours
			return undefined
		},

		load(id) {
			const resolved = "\0" + prefix
			if (!id.startsWith(resolved)) return undefined
			const path = id.slice(resolved.length) // remove the path
			const code = getModule(path)
			return code
		},
	}
}
