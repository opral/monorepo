import type { MappedObjectStore } from "./store/types.js"
import type { NodeishFilesystem } from "@inlang-git/fs"

import { _readObject, _writeObject, FileSystem } from "./git-internal/internal-apis.js"

/*
 * Creates a mapped object store with data from the git object store located in
 * `gitdir`, where `gitdir` is the path to a `.git` directory on `_fs`.
 */
export default async function createMappedObjectStore(
	gitdir: string,
	_fs: NodeishFilesystem,
): Promise<MappedObjectStore> {
	const fs = new FileSystem(_fs)
	const cache = {}

	return {
		fsMap: new Map(),
		fsStats: new Map(),
		readObject: (oid) => _readObject({ fs, cache, gitdir, oid }),
		writeObject: (object, type) => _writeObject({ fs, gitdir, type, object }),
		textEncoder: new TextEncoder(),
		textDecoder: new TextDecoder(),
	}
}
