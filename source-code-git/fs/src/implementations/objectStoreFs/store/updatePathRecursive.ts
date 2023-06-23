import type { MappedObjectStore } from "./types.js"
import type TreeEntry from "./trees/TreeEntry.js"

import { oidToString, stringToOid, getDirname, getBasename } from "../util.js"

import getOidWithCheckout from "./getOidWithCheckout.js"

import updateEntryInTree from "./trees/updateEntryInTree.js"
import spliceEntryIntoTree from "./trees/spliceEntryIntoTree.js"
import createNewTree from "./trees/createNewTree.js"

/*
 * Update the tree object at `parentPath` with the data contained in `entry`.
 * Updates the entry if it exists, or splices it into the tree if it does not.
 * If the tree does not exist, creates a new tree containing the entry.
 */
async function updateParentObject(entry: TreeEntry, parentPath: string, store: MappedObjectStore) {
	const parentOid: Uint8Array | undefined = await getOidWithCheckout(parentPath, store)

	const oldParent = parentOid ? (await store.readObject(oidToString(parentOid))).object : undefined

	const newParent = oldParent
		? updateEntryInTree(oldParent, entry) ?? spliceEntryIntoTree(oldParent, entry)
		: createNewTree(entry)

	// Write the new parent object to the object store and return its oid
	return stringToOid((await store.writeObject(newParent, "tree")) ?? "")
}

/**
 * Update a path in the store to point to a new object, recursively recomputing
 * its parents if necessary, and creating new objects if they do not exist.
 *
 * Note: `path` is assumed to be normalized.
 */
export default async function updatePathRecursive(
	path: string,
	newObject: TreeEntry,
	store: MappedObjectStore,
) {
	const parentPath = getDirname(path)

	const newParent: TreeEntry = {
		modeBuffer: new Uint8Array([52, 48, 48, 48, 48, 32]), // '40000 '
		pathBuffer: store.textEncoder.encode(getBasename(parentPath) + "\0"),
		oid: await updateParentObject(newObject, parentPath, store),
	}

	const grandParentPath = getDirname(parentPath)
	if (parentPath !== grandParentPath) await updatePathRecursive(parentPath, newParent, store)

	store.fsMap.set(parentPath, newParent.oid)
	store.fsStats.set(parentPath, { mode: "40000" })

	// Note: at this point the old tree still exists in the object store,
	// and will need to be garbage collected if it is no longer referenced.
}
