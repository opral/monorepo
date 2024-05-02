import type { RepoState, RepoContext } from "../openRepository.js"
import isoGit from "../../vendored/isomorphic-git/index.js"
import { doCheckout } from "../git/checkout.js"
import { modeToFileType } from "../git/helpers.js"

export async function checkOutPlaceholders(ctx: RepoContext, state: RepoState) {
	const { rawFs, cache, dir } = ctx
	const { branchName, checkedOut, sparseFilter } = state

	await doCheckout({
		fs: state.nodeishFs,
		cache,
		dir,
		ref: branchName,
		filepaths: [],
	})

	const fs = rawFs
	const gitignoreFiles: string[] = []

	let rootHash: string | undefined
	await isoGit.walk({
		fs,
		dir,
		cache,
		gitdir: ".git",
		trees: [isoGit.TREE({ ref: branchName })],

		map: async function (fullpath, [commit]) {
			if (!commit) {
				return undefined
			}

			const fileMode = await commit.mode()
			const oid = await commit.oid()

			if (fullpath === ".") {
				rootHash = oid
			}

			const fileType = modeToFileType(fileMode)

			if (fullpath.endsWith(".gitignore")) {
				gitignoreFiles.push(fullpath)
				// return undefined
			}

			if (
				sparseFilter &&
				!sparseFilter({
					filename: fullpath,
					type: fileType,
				})
			) {
				return undefined
			}

			if (fileType === "folder" && !checkedOut.has(fullpath)) {
				return fullpath
			}

			if (fileType === "file" && !checkedOut.has(fullpath)) {
				await fs._createPlaceholder(fullpath, { mode: fileMode, oid, rootHash })
				return fullpath
			}

			if (fileType === "symlink" && !checkedOut.has(fullpath)) {
				await fs._createPlaceholder(fullpath, { mode: fileMode, oid, rootHash })
				return fullpath
			}

			console.warn("ignored checkout palcholder path", fullpath, fileType)
			return undefined
		},
	})

	// if (gitignoreFiles.length) {
	// 	// await doCheckout({
	// 	// 	fs: rawFs, // TODO: fix this?
	// 	// 	dir,
	// 	// 	cache,
	// 	// 	ref: branchName,
	// 	// 	filepaths: gitignoreFiles,
	// 	// })
	// 	// gitignoreFiles.map((file) => checkedOut.add(file))
	// }

	state.pending && (await state.pending)

	return { gitignoreFiles }
}
