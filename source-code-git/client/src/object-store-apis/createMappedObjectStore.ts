import type { MappedObjectStore } from "./store/types.js"
import type { NodeishFilesystem } from "@inlang-git/fs"

import {
	_readObject,
	_writeObject,
	GitAnnotatedTag,
	GitCommit,
	FileSystem,
} from "./git-internal/internal-apis.js"

import { stringToOid } from "./util.js"

import addTreeToStore from "./store/addTreeToStore.js"

/*
 * Creates a mapped object store with data from the git object store located in
 * `gitdir`, where `gitdir` is the path to a `.git` directory on `_fs`.
 */
export default async function createMappedGitObjectStore(
	treeOid: string,
	gitdir: string,
	_fs: NodeishFilesystem,
) {
	const fs = new FileSystem(_fs)

	const cache = {}

	const objectStore: MappedObjectStore = {
		fsMap: new Map(),
		fsStats: new Map(),
		readObject: (oid) => _readObject({ fs, cache, gitdir, oid }),
		writeObject: (object, type) => _writeObject({ fs, gitdir, type, object }),
		textEncoder: new TextEncoder(),
		textDecoder: new TextDecoder(),
	}

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
