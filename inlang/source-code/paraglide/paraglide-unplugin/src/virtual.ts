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
	getModule: (path: string) => string | undefined | Promise<string | undefined>
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
	return {
		name: "@inlang/paraglide-unpligin:virtual",
		resolveId(id, importer, options) {
			// Handle imports that are virtual modules
			if (id.startsWith(prefix)) return id
			// Handle relative imports from a virtual module
			if (importer?.startsWith(prefix)) {
				const from = importer.replace(prefix, "")
				const to = path.resolve(from, "..", id)
				const resolvedTo = to.slice(process.cwd().length + 1)
				return `${prefix}${resolvedTo}`
			}

			// not ours
			return undefined
		},

		async load(id) {
			if (!id.startsWith(prefix)) return undefined
			const path = id.slice(prefix.length) // remove the path
			const code = await getModule(path)
			return code
		},
	}
}
