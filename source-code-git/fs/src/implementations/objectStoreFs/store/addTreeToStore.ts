import type { MappedObjectStore } from "./types.js"
import { normalPath } from "../util.js"
import readTreeEntries from "./trees/readTreeEntries.js"

/*
 * Reads the tree specified by `tree` and adds its entries into `store`. Each
 * entry contains only the filename and not the full path, so `basePath`
 * specifies the path each entry in the tree is relative to.
 *
 * If `basePath` is not specified, paths are considered relative to the root of
 * the git directory.
 */
export default function addTreeToStore(tree: Uint8Array, store: MappedObjectStore, basePath = "") {
	for (const entry of readTreeEntries(tree)) {
		const modeString = store.textDecoder.decode(entry.modeBuffer)
		const pathString = store.textDecoder.decode(entry.pathBuffer)

		if (pathString.includes("\\") || pathString.includes("/")) {
			throw new Error(`Error reading tree: Unsafe filepath: ${pathString}`)
		}

		const fullPath = normalPath(`${basePath}/${pathString}`)

		store.fsMap.set(fullPath, entry.oid)
		store.fsStats.set(fullPath, { mode: modeString })
	}
}
