import type { UnpluginFactory } from "unplugin"
import type { PluginConfig } from "./config.js"
import path from "node:path"

const VITE_BUILD_PLUGIN_NAME = "unplugin-paraglide-vite-virtual-message-modules"
const isWindows = typeof process !== "undefined" && process.platform === "win32"

/**
 * During build we always want to use the virtual modules since they have better
 * code splitting than the real files.
 *
 * This plugin intercepts imports to the `outdir` folder & uses the virtal plugin instead
 */
export const build: UnpluginFactory<Pick<PluginConfig, "outdir">> = (c, ctx) => {
	return {
		name: VITE_BUILD_PLUGIN_NAME,
		vite: {
			apply: "build",
			resolveId(id, importer) {
				if (!c.outdir) return
				// if the id contains a null char ignore it since it should be a rollup virtual module
				// this helps support other vite plugins (like sentry) that make heavy use of these types of file-namings
				if (id.includes("\0")) return undefined
				// resolve relative imports inside the output directory
				// the importer is always normalized
				if (importer?.startsWith(c.outdir)) {
					const dirname = path.dirname(importer).replaceAll("\\", "/")

					//TODO: Return virtual module path instead
					// should get rid of windows dependency aswell
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
		},
	}
}
