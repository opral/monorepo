import isoGit, {
	_GitCommit,
	_GitPackIndex,
	_GitTree,
	_collect,
} from "../../../vendored/isomorphic-git/index.js"

if (window) {
	// @ts-expect-error
	window.isoGit = isoGit
}

/**
 * Use this to intercept your resoponse function to log the pack files interals
 * @param Uint8Array the body of a pack Response
 * @returns
 */
export async function inflatePackResponse(packResonseBody: Uint8Array) {
	// parse pack response in the same way iso git does it in fetch
	const bodyResponse = await isoGit._parseUploadPackResponse([packResonseBody])

	// body response now contains:
	// shallows - the commits that do have parents, but not in the shallow repo and therefore grafts are introduced pretending that these commits have no parents.(?)
	// https://git-scm.com/docs/shallow
	// unshallows - TODO check mechanism here
	const packfile = Buffer.from(await _collect(bodyResponse.packfile))
	const packfileSha = packfile.slice(-20).toString("hex")

	if (!packfileSha) {
		return ""
	}

	return {
		acks: bodyResponse.acks,
		nak: bodyResponse.nak,
		shallows: bodyResponse.shallows,
		unshallows: bodyResponse.unshallows,
		packfilePath: `objects/pack/pack-${packfileSha}.pack`,
		...(await inflatePackfile(packfile)),
	}
}

export async function inflatePackfile(packfile: any, { minimal = false } = {}) {
	// TODO check how to deal with external ref deltas here - do we want to try to get them locally?
	const getExternalRefDelta = (oid: string) => console.warn("trying to catch external ref", oid) // readObject({ fs, cache, gitdir, oid })

	const idx = await _GitPackIndex.fromPack({
		pack: packfile,
		getExternalRefDelta,
		onProgress: undefined,
	})

	const inflatedPack = {} as any
	const trees = {} as any
	// @ts-expect-error
	for (const hash of idx.hashes) {
		const object = await idx.read({ oid: hash })
		const typeKey = object.type + "s"

		if (!inflatedPack[typeKey]) {
			inflatedPack[typeKey] = {} as any
		}
		if (object.type === "tree") {
			trees[hash] = new _GitTree(object.object)
		} else if (object.type === "commit") {
			const commit = new _GitCommit(object.object)
			inflatedPack[typeKey][hash] = commit.parse()
		} else if (object.type === "blob") {
			object.string = object.object.toString()
			if (minimal) {
				delete object.object
			}
			inflatedPack[typeKey][hash] = object
		} else {
			inflatedPack[typeKey][hash] = object
		}
	}

	Object.values(inflatedPack.commits || {}).forEach((commit: any) => {
		if (inflatedPack.trees) {
			inflatedPack.trees[commit.tree] = extractTree(trees, commit.tree)
		}
	})

	// add the remaining trees that are not part of commit trees
	inflatedPack.trees = { ...inflatedPack.trees, ...trees }

	return inflatedPack
}

function extractTree(treeEntries: any, treeHash: string) {
	const tree = treeEntries[treeHash]

	if (!tree) {
		return {}
	}

	const extractedTree: Record<string, any> = {}
	tree._entries.forEach((entry: any) => {
		if (entry.type === "tree") {
			extractedTree[entry.path] = {
				children: extractTree(treeEntries, entry.oid),
				...entry,
			}
		} else {
			extractedTree[entry.path] = entry
		}
	})

	delete treeEntries[treeHash]
	return extractedTree
}
