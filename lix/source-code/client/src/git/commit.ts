import { walk, TREE, STAGE, writeTree, commit as doCommit, type TreeEntry } from "isomorphic-git"
import { getDirname, getBasename } from "@lix-js/fs"

import type { NodeishFilesystem } from "@lix-js/fs"
import type { Author } from "../api.js"

type PartialEntry = {
	mode: string
	path: string
	type: "blob" | "tree" | "commit" | "special"
	oid: string | undefined
}

export async function commit({
	fs,
	dir,
	ref,
	author,
	message,
}: {
	fs: NodeishFilesystem
	dir: string
	ref?: string
	author: Author
	message: string
}) {
	const fileStates: {
		[parentFolder: string]: PartialEntry[]
	} = {}

	async function createTree(
		currentFolder: string,
		fileStates: {
			[parentFolder: string]: PartialEntry[]
		}
	): Promise<string> {
		const entries: TreeEntry[] = []

		const currentFolderStates = fileStates[currentFolder]

		if (!currentFolderStates) {
			throw new Error("couldn't find folder " + currentFolder + " in file states")
		}

		for (const entry of currentFolderStates) {
			if (entry.type === "tree") {
				entries.push({
					mode: "040000",
					path: entry.path,
					type: entry.type,
					oid: await createTree(currentFolder + entry.path + "/", fileStates),
				})
			} else {
				if (!entry.oid) {
					throw new Error("OID should be set for types except tree")
				}

				entries.push({
					mode: entry.mode,
					path: entry.path,
					type: entry.type as "blob" | "commit", // TODO #1459 we cast here to remove special - check cases
					oid: entry.oid,
				})
			}
		}

		return await writeTree({ fs, dir, tree: entries })
	}

	await walk({
		fs,
		dir,
		// cache, gitdir,
		trees: [TREE({ ref }), STAGE()],
		// @ts-ignore FIXME
		map: async function (filepath: string, [refState, stagingState]) {
			if (!refState && !stagingState) {
				// skip unmanaged files (not indexed nor in ref) and skip root
				throw new Error("At least one of the trees should contain an entry")
			}

			//FIXME: >>>  this should be converted to use proper type guard functions
			const refStateType = refState ? await refState.type() : undefined
			const stagingStateType = stagingState ? await stagingState.type() : undefined

			// 'commit' used by TREE to represent submodules
			if (refStateType === "commit" || stagingStateType === "commit") {
				throw new Error("Submodule found in " + filepath + " currently not supported")
			}

			// - `'special'` used by `WORKDIR` to represent irregular files like sockets and FIFOs
			if (refStateType === "special" || stagingStateType === "special") {
				throw new Error("type special should not occure in ref or staging")
			}
			// <<< FiXME

			if (filepath === ".") {
				// skip root folder
				return
			}

			const fileDir = getDirname(filepath)
			if (fileStates[fileDir] === undefined) {
				fileStates[fileDir] = []
			}

			if (!stagingState && refState) {
				if (refStateType === "tree" || (fs._isPlaceholder && fs._isPlaceholder(filepath))) {
					fileStates[fileDir]?.push({
						mode: (await refState.mode()).toString(8),
						path: getBasename(filepath),
						type: refStateType as "tree" | "blob",
						oid: await refState.oid(),
					})
					return
				}

				// file was deleted
				return
			}

			if (stagingState && !refState) {
				// file does not exist in ref - it was added
				const stMode = await stagingState.mode()

				fileStates[fileDir]?.push({
					mode: stMode?.toString(8),
					path: getBasename(filepath),
					type: stagingStateType as "tree" | "blob",
					oid: await stagingState.oid(),
				})

				return
			}

			if (stagingState && refState) {
				// file does exists in both
				const stagingMode = await stagingState.mode()
				const stagingType = await stagingState.type()

				fileStates[fileDir]?.push({
					mode: stagingType === "tree" ? "040000" : stagingMode.toString(8),
					path: getBasename(filepath),
					type: stagingStateType as "tree" | "blob",
					oid: await stagingState.oid(),
				})

				return
			}
		},
		// TODO: use reduce to build datastructure? reduce: async function (parent, children) {},
	})

	const tree = await createTree("/", fileStates)

	return doCommit({
		fs,
		dir,
		author,
		message,
		tree,
	})
}
