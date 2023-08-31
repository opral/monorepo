import type { NodeishFilesystem } from "@lix-js/fs"
import { InlangSdkException } from "../../exceptions.js"

/**
 * some runtimes (e.g. vercel edge) throw an error if they see a direct 'node:fs' import statement in
 * the code even if it never get's used. To not run into this issue we can use a proxy to only import
 * the fs module if it is actually used and we can still throw an error if it is not available.
 **/
export const getNodeishFs = (): Promise<NodeishFilesystem> =>
	import("node:fs/promises").catch(
		() =>
			new Proxy({} as NodeishFilesystem, {
				get: (target, key) => {
					if (key === "then") return Promise.resolve(target)

					return () => {
						throw new InlangSdkException(
							"`node:fs/promises` is not available in the current environment",
						)
					}
				},
			}),
	)
