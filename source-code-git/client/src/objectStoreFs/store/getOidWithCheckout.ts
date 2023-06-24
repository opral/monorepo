import type { MappedObjectStore } from "./types.js"
import { oidToString } from "../util.js"

import addTreeToStore from "./addTreeToStore.js"

/**
 * Given a path, return its corresponding object id, checking out any
 * parent objects along the way if necessary.
 *
 * "Checkout" here means adding an entry and its children to the fs map.
 */
export default async function getOidWithCheckout(path: string, store: MappedObjectStore) {
	// Split the path into its components
	const pathList: string[] = path.split("/")
	const currentPath: string[] = []

	// Iterate through the path components
	for (const path of pathList) {
		currentPath.push(path)
		// Continue if we are at the '/' part of a path
		if (!path) continue

		// Continue if the current path is already mapped
		const pathOid = store.fsMap.get(`${currentPath.join("/")}/`)
		if (pathOid) continue

		// Ensure the parent exists
		const parentOid = store.fsMap.get(`${currentPath.slice(0, -1).join("/")}/`)
		if (!parentOid) return

		const parentOidString = oidToString(parentOid)
		const { type, object } = await store.readObject(parentOidString)

		if (type !== "tree")
			throw new Error(`Expected ${parentOidString} to be 'tree', instead got '${type}'`)

		// Parse the parent tree, thus adding its children to the fs map
		addTreeToStore(object, store, currentPath.slice(0, -1).join("/"))
	}
	return store.fsMap.get(path)
}
