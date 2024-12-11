import type { UnpluginFactory } from "unplugin"
import path from "node:path"

const isWindows = typeof process !== "undefined" && process.platform === "win32"
const resolvedVirtualModuleName = "$paraglide-internal-virtual-module:"

/**
 * During build we always want to use the virtual modules since they have better
 * code splitting than the real files.
 *
 * This plugin intercepts imports to the `outdir` folder & uses the virtal plugin instead
 */
export const build: UnpluginFactory<{
	outdir: `${string}/`
	getModule: (id: string) => string | undefined
	buildOnly: boolean
}> = ({ outdir, getModule, buildOnly }) => {
	const normalizedOutdir = isWindows ? outdir.replaceAll("\\", "/") : outdir

	return {
		name: "unplugin-paraglide-vite-virtual-message-modules",
		enforce: "post",
		vite: {
			resolveId(id) {
				// if the id contains a null char ignore it since it should be a rollup virtual module
				// this helps support other vite plugins (like sentry) that make heavy use of these types of file-namings
				if (id.includes("\0")) return undefined

				const normalizedId = isWindows ? id.replaceAll("\\", "/") : id

				// resolve relative imports inside the output directory
				// the importer is alwazs normalized
				if (normalizedId?.startsWith(normalizedOutdir)) {
					/**
					 * The path inside of the outdir. No leading slash.
					 * @example `message.js`
					 */
					const internalPath = normalizedId.replace(normalizedOutdir, "")

					const resolved = resolvedVirtualModuleName + internalPath
					console.log("resolved", resolved)
					return resolved
				}
				return undefined
			},

			load(id) {
				if (!id.startsWith(resolvedVirtualModuleName)) return undefined
				const internalPath = id.slice(resolvedVirtualModuleName.length)
				console.log("loading", id, internalPath)
				return getModule(internalPath)
			},
		},
	}
}
