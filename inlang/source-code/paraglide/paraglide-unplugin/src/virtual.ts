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
export const virtualModules: UnpluginFactory<{
	outdir: `${string}/`
	getModule: (id: string) => string | undefined
	buildOnly: boolean
}> = ({ outdir, getModule, buildOnly }) => {
	const normalizedOutdir = isWindows ? outdir.replaceAll("\\", "/") : outdir

	return {
		name: "unplugin-paraglide-vite-virtual-message-modules",
		enforce: "post",
		vite: {
			apply: buildOnly ? "build" : undefined,
			resolveId(id, importer) {
				// if the id contains a null char ignore it since it should be a rollup virtual module
				// this helps support other vite plugins (like sentry) that make heavy use of these types of file-namings
				if (id.includes("\0")) return undefined

				// if the impoter starts with `resolvedVirtualModuleName` we're looking at
				// a relative import from within the virtual module
				let normalizedId: string

				if (importer?.startsWith(resolvedVirtualModuleName)) {
					const importerPath = importer.replace(resolvedVirtualModuleName, outdir)
					const importerDirname = path.dirname(importerPath)
					normalizedId = path.posix.resolve(importerDirname, id)
				} else {
					// regular import
					normalizedId = isWindows ? id.replaceAll("\\", "/") : id
				}

				// resolve relative imports inside the output directory
				// the importer is alwazs normalized
				if (normalizedId?.startsWith(normalizedOutdir)) {
					/**
					 * The path inside of the outdir. No leading slash.
					 * @example `message.js`
					 */
					const internalPath = normalizedId.replace(normalizedOutdir, "")

					const resolved = resolvedVirtualModuleName + internalPath
					return resolved
				}
				return undefined
			},

			load(id) {
				if (!id.startsWith(resolvedVirtualModuleName)) return undefined
				const internalPath = id.slice(resolvedVirtualModuleName.length)
				return getModule(internalPath)
			},
		},
	}
}
