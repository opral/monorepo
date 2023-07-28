import type { MappedObjectStore } from "./store/types.js"

import {
	GitAnnotatedTag,
	GitCommit,
} from "./git-internal/internal-apis.js"

import { stringToOid } from "./util.js"

import addTreeToStore from "./store/addTreeToStore.js"

/*
 * Initializes a given mapped object store, setting its root to be `treeOid`.
 * This allows lazy cloning/checkout to function.
 */
export default async function initMappedObjectStore(
	objectStore: MappedObjectStore,
	treeOid: string,
) {
	let { type, object } = await objectStore.readObject(treeOid)

	if (type === "tag") {
		// @ts-ignore
		treeOid = GitAnnotatedTag.from(object).parse().object
		;({ type, object } = await objectStore.readObject(treeOid))
	}

	if (type === "commit") {
		// @ts-ignore
		treeOid = GitCommit.from(object).parse().tree
		;({ type, object } = await objectStore.readObject(treeOid))
	}

	if (type !== "tree")
		throw new Error(`Object ${treeOid} of type ${type} cannot be resolved to a tree.`)

	const treeOidBuffer = stringToOid(treeOid)
	if (treeOidBuffer.length !== 20) throw new Error(`Invalid object id '${treeOid}'.`)

	addTreeToStore(object, objectStore)

	objectStore.fsMap.set("/", treeOidBuffer)

	return objectStore
}
