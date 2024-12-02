import { type UnpluginFactory } from "unplugin"

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

	return {
		name: "@inlang/paraglide-unpligin:virtual",
		transformInclude(id) {
			// if the id contains a null char ignore it since it should be a rollup virtual module
			// this helps support other vite plugins (like sentry) that make heavy use of these types of file-namings
			if (id.includes("\0")) return false
			return id.startsWith(prefix)
		},
		load(id) {
			if (!id.startsWith(prefix)) return undefined
			const path = id.slice(prefix.length) // remove the path
			const code = getModule(path)
			return code
		},
	}
}
