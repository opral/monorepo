import type { UnpluginFactory } from "unplugin"
import path from "node:path"

const isWindows = typeof process !== "undefined" && process.platform === "win32"

/**
 * During build we always want to use the virtual modules since they have better
 * code splitting than the real files.
 *
 * This plugin intercepts imports to the `outdir` folder & uses the virtal plugin instead
 */
export const build: UnpluginFactory<{
	outdir: string
	getModule: (id: string) => string | undefined
}> = ({ outdir, getModule }) => {
	return {
		name: "unplugin-paraglide-vite-virtual-message-modules",
		vite: {
			apply: "build",
			resolveId(id, importer) {
				// if the id contains a null char ignore it since it should be a rollup virtual module
				// this helps support other vite plugins (like sentry) that make heavy use of these types of file-namings
				if (id.includes("\0")) return undefined
				// resolve relative imports inside the output directory
				// the importer is alwazs normalized
				if (importer?.startsWith(outdir)) {
					const dirname = path.dirname(importer).replaceAll("\\", "/")
					if (id.startsWith(dirname)) return id

					if (isWindows) {
						const resolvedPath = path
							.resolve(dirname.replaceAll("/", "\\"), id.replaceAll("/", "\\"))
							.replaceAll("\\", "/")
						return resolvedPath
					}

					const resolvedPath = path.resolve(dirname, id)
					return resolvedPath
				}
				return undefined
			},

			load(id) {
				id = id.replaceAll("\\", "/")
				//if it starts with the outdir use the paraglideOutput virtual modules instead
				if (id.startsWith(outdir)) {
					const internal = id.slice(outdir.length)
					const resolved = getModule(internal)
					return resolved
				}

				return undefined
			},
		},
	}
}
