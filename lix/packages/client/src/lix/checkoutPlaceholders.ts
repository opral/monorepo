import type { RepoState, RepoContext } from "../openRepository.js"
import isoGit from "../../vendored/isomorphic-git/index.js"
import { _checkout } from "../git/checkout.js"
import { modeToFileType } from "../git/helpers.js"

export async function checkOutPlaceholders(
	ctx: RepoContext,
	state: RepoState,
	{
		materializeGitignores = true,
		preload = [],
	}: {
		materializeGitignores?: boolean
		preload?: string[]
	} = {}
) {
	const { rawFs, cache, dir } = ctx
	const { branchName, checkedOut, sparseFilter } = state

	await _checkout({
		fs: ctx.rawFs,
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

			if (fullpath.endsWith(".gitignore")) {
				gitignoreFiles.push(fullpath)
			}

			const fileMode = await commit.mode()
			const oid = await commit.oid()

			if (fullpath === ".") {
				rootHash = oid
			}

			const fileType = modeToFileType(fileMode)

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

	// materializeGitignores is only false for testing when opeinging a snapshot and using emptyWorkdir, using lazyFs will hang forewer but we allready have the ignore files in object store
	if (gitignoreFiles.length && materializeGitignores) {
		preload = [...gitignoreFiles, ...preload]
	}

	await state.ensureFirstBatch({ preload })

	return { gitignoreFiles }
}
