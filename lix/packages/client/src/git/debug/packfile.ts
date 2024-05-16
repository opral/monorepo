import isoGit, {
	_GitCommit,
	_GitPackIndex,
	_GitTree,
	_collect,
} from "../../../vendored/isomorphic-git/index.js"

/**
 * Use this to intercept your resoponse function to log the pack files interals like:
 *
 * ```
 * ;(async () => {
 *		console.log(await inflatePackResponse(resBody))
 * })()
 * ```
 * @param packResonseBody the body of a pack Response
 * @returns
 */
export async function inflatePackResponse(packResonseBody: any) {
	// parse pack response in the same way iso git does it in fetch
	const bodyResponse = await isoGit._parseUploadPackResponse([packResonseBody])

	// body response now contains:
	// shallows - the commits that do have parents, but not in the shallow repo and therefore grafts are introduced pretending that these commits have no parents.(?)
	// https://git-scm.com/docs/shallow
	// unshallows - TODO check mechanism here
	// @ts-expect-error - TODO how to make Buffer available to TS?
	const packfile = Buffer.from(await _collect(bodyResponse.packfile))
	const packfileSha = packfile.slice(-20).toString("hex")
	// path the packfile will be written to
	const packfilePath = `objects/pack/pack-${packfileSha}.pack`
	console.log("Packfile sha: " + packfileSha)

	bodyResponse.inflatedPack = await inflatePackfile(packfile)
	bodyResponse.inflatedPack.packfilePath = packfilePath

	return bodyResponse
}

export async function inflatePackfile(packfile: any) {
	// TODO check how to deal with external ref deltas here - do we want to try to get them locally?
	const getExternalRefDelta = (oid: string) => console.warn("trying to catch external ref") // readObject({ fs, cache, gitdir, oid })
	const idx = await _GitPackIndex.fromPack({
		pack: packfile,
		getExternalRefDelta: undefined,
		onProgress: undefined, // onProgress,
	})

	const inflatedPack = { allObjects: {} as any, isolatedNodes: {} as any } as any
	// @ts-expect-error
	for (const hash of idx.hashes) {
		const object = await idx.read({ oid: hash })

		if (!inflatedPack[object.type]) {
			inflatedPack[object.type] = {} as any
		}

		if (object.type === "tree") {
			const tree = new _GitTree(object.object)
			inflatedPack[object.type][hash] = tree
		} else if (object.type === "commit") {
			const commit = new _GitCommit(object.object)

			inflatedPack[object.type][hash] = commit.parse() // use parse to extract header informations
		} else {
			inflatedPack[object.type][hash] = object
		}
		inflatedPack.allObjects[hash] = inflatedPack[object.type][hash]
		inflatedPack[object.type][hash].type = object.type
	}
	let object: any
	for (object of Object.values(inflatedPack.allObjects)) {
		if (object.type === "tree") {
			object.children = {} as any
			for (const entry of object.entries()) {
				object.children[entry.path] = inflatedPack.allObjects[entry.oid]
				if (!inflatedPack.allObjects[entry.oid].parentsInPack) {
					inflatedPack.allObjects[entry.oid].parentsInPack = []
				}
				if (!inflatedPack.allObjects[entry.oid].fileNamesInPack) {
					inflatedPack.allObjects[entry.oid].fileNamesInPack = entry.path
				} else if (typeof inflatedPack.allObjects[entry.oid].fileNamesInPack === "string") {
					inflatedPack.allObjects[entry.oid].fileNamesInPack = [
						inflatedPack.allObjects[entry.oid].fileNamesInPack,
						entry.path,
					]
				} else {
					inflatedPack.allObjects[entry.oid].fileNamesInPack.push(entry.path)
				}
			}
		}
	}
	for (const [oid, object] of Object.entries(inflatedPack.allObjects)) {
		if (!(object as any).parentsInPack || (object as any).parentsInPack.length === 0) {
			inflatedPack.isolatedNodes[oid] = object
		}
	}
	return inflatedPack
}
