/* eslint-disable unicorn/no-null -- required for isogit walk api */
import type { NodeishFilesystem } from "@lix-js/fs"
import isoGit from "../../vendored/isomorphic-git/index.js"
// import { modeToFileType } from "./helpers.js"

// TODO: LSTAT is not properly impl. in the memory fs!

const {
	walk,

	TREE,
	WORKDIR,
	STAGE,

	isIgnored,
} = isoGit

export type OptStatus = "unmodified" | "materialized" | "ignored"

type StatusText =
	| "unmodified"
	| "*added"
	| "added"
	| "*modified"
	| "modified"
	| "*deleted"
	| "deleted"
	| "*absent"
	| "*undeletemodified"
	| "*unmodified"
	| "*undeleted"
	| "unknown"

type StatusList = [string, StatusText][]

const worthWalking = (filepath: string, root: string) => {
	if (
		filepath === "." ||
		root == undefined ||
		root.length === 0 ||
		root === "." ||
		root === filepath
	) {
		return true
	}
	if (root.length > filepath.length) {
		return root.startsWith(filepath + "/")
	} else {
		return filepath.startsWith(root + "/")
	}
}

function normalizePath(path: string) {
	return path
		.replace(/\/\.\//g, "/") // Replace '/./' with '/'
		.replace(/\/{2,}/g, "/") // Replace consecutive '/'
		.replace(/^\/\.$/, "/") // if path === '/.' return '/'
		.replace(/^\.\/$/, ".") // if path === './' return '.'
		.replace(/^\.\//, "") // Remove leading './'
		.replace(/\/\.$/, "") // Remove trailing '/.'
		.replace(/(.+)\/$/, "$1") // Remove trailing '/'
		.replace(/^$/, ".") // if path === '' return '.'
}

function join(...parts: string[]) {
	return normalizePath(parts.map(normalizePath).join("/"))
}

type StatusArgs = {
	fs: NodeishFilesystem
	dir: string // The [working tree](dir-vs-gitdir.md) directory path
	gitdir?: string // The [git directory](dir-vs-gitdir.md) path
	ref?: string // Optionally specify a different commit to compare against the workdir and stage instead of the HEAD
	filepaths?: string[] // Limit the query to the given files and directories
	filter?: (filepath: string) => boolean // Filter the results to only those whose filepath matches a function.
	sparseFilter?: (entry: { filename: string; type: "file" | "folder" }) => boolean // Filter the results to only those whose filepath matches a function.
	cache?: object // an isogit cache object
	includeStatus?: OptStatus[] // include normally excluded statuses
}
// * TODO: support this again
// * ```js live
// * // get the status of all the JSON and Markdown files
// * let status = await git.statusMatrix({
// *   fs,
// *   dir: '/tutorial',
// *   filter: f => f.endsWith('.json') || f.endsWith('.md')
// * })
// * console.log(status)
// * ```

/**
 * Efficiently get the status of multiple files at once.
 */
export async function status({
	fs,
	dir = "/",
	gitdir = join(dir, ".git"),
	ref = "HEAD",
	filepaths = ["."],
	filter,
	sparseFilter,
	cache,
	includeStatus = [],
}: StatusArgs): Promise<StatusList> {
	try {
		return await walk({
			fs,
			cache,
			dir,
			gitdir,
			trees: [TREE({ ref }), WORKDIR(), STAGE()],
			map: async function (filepath, [head, workdir, stage]) {
				// Ignore ignored files, but only if they are not already tracked.

				if (!head && !stage && workdir) {
					const ignored = await isIgnored({ fs, dir, filepath })
					if (ignored) {
						// "ignored" file ignored by a .gitignore rule, will not be shown unless explicitly asked for
						if (includeStatus.includes("ignored") || filepaths.includes(filepath)) {
							return [
								filepath,
								"ignored",
								{ headOid: undefined, workdirOid: "ignored", stageOid: undefined },
							]
						}
						return null
					}
				}
				// match against base paths
				if (!filepaths.some((base) => worthWalking(filepath, base))) {
					return null
				}
				// Late filter against file names
				if (filter && !filter(filepath)) {
					return
				}

				if (fs._isPlaceholder && fs._isPlaceholder(filepath)) {
					if (includeStatus.includes("unmodified") || filepaths.includes(filepath)) {
						const headType = head && (await head.type())
						const headOid = headType === "blob" ? await head?.oid() : undefined

						return [
							filepath,
							"unmodified",
							{ headOid, workdirOid: headOid, stageOid: headOid, placeholder: true },
						]
					}
					return null
				}

				let types
				try {
					types = await Promise.all([
						head && head.type(),
						workdir && workdir.type(),
						stage && stage.type(),
					])
				} catch (error) {
					// skip broken iteration into symlinks or broken directories, can probably be removed when memfs supports proper lstat/symlinks
					return undefined
				}

				const [headType, workdirType, stageType] = types

				const isBlob = [headType, workdirType, stageType].includes("blob")

				if (
					sparseFilter &&
					!sparseFilter({
						filename: filepath,
						type: isBlob ? "file" : "folder",
					})
				) {
					return
				}

				// For now, bail on directories unless the file is also a blob in another tree
				if ((headType === "tree" || headType === "special") && !isBlob) return
				if (headType === "commit") return null

				if ((workdirType === "tree" || workdirType === "special") && !isBlob) return

				if (stageType === "commit") return null
				if ((stageType === "tree" || stageType === "special") && !isBlob) return

				// Figure out the oids for files, using the staged oid for the working dir oid if the stats match.
				const headOid = headType === "blob" ? await head?.oid() : undefined
				const stageOid = stageType === "blob" ? await stage?.oid() : undefined

				let workdirOid

				if (headType !== "blob" && workdirType === "blob" && stageType !== "blob") {
					workdirOid = await workdir?.oid() // (isogit uses "42" here to avoid hashing as its not exposed)
				} else if (workdirType === "blob") {
					workdirOid = await workdir?.oid()
				}

				const entry: {
					headOid: string | undefined
					workdirOid: string | undefined
					stageOid: string | undefined
					placeholder?: boolean
				} = { headOid, workdirOid, stageOid }

				// TODO: 1, 2, 0 > check this meaning? + check if stageid can differ
				// TODO: only if asked for this file "absent"	file not present in HEAD commit, staging area, or working dir

				// [ 1, 1, 1] "unmodified"
				if (entry.headOid === entry.workdirOid && entry.workdirOid === entry.stageOid) {
					if (
						includeStatus.includes("unmodified") ||
						filepaths.includes(filepath) ||
						includeStatus.includes("materialized")
					) {
						return [filepath, "unmodified", entry]
					} else {
						return null
					}
				}

				// [ 0, 2, 0] new, untracked  "*added"	file is untracked, not yet staged
				if (!entry.headOid && !entry.stageOid && entry.workdirOid) {
					return [filepath, "*added", entry]
				}

				// [ 0, 2, 2] added, stage  "added"	previously untracked file, staged
				if (!entry.headOid && entry.workdirOid && entry.workdirOid === entry.stageOid) {
					return [filepath, "added", entry]
				}

				// [ 0, 2, 3] added, staged, (with unstaged changes not exposed in string)
				if (
					!entry.headOid &&
					entry.stageOid &&
					entry.workdirOid &&
					entry.workdirOid !== entry.stageOid
				) {
					return [filepath, "*added", entry]
				}

				// [ 1, 2, 1] modified, unstaged "*modified"	file has modifications, not yet staged
				if (
					entry.headOid &&
					entry.workdirOid &&
					entry.headOid === entry.stageOid &&
					entry.headOid !== entry.workdirOid
				) {
					return [filepath, "*modified", entry]
				}
				// (not exposed as different from above in string)
				// [ 1, 2, 3] modified, staged, with unstaged changes, "*modified"
				if (
					entry.headOid &&
					entry.workdirOid &&
					entry.stageOid &&
					entry.stageOid !== entry.headOid &&
					entry.stageOid !== entry.workdirOid &&
					entry.headOid !== entry.workdirOid
				) {
					return [filepath, "*modified", entry]
				}

				// [ 1, 2, 2] modified, staged "modified"	file has modifications, staged
				if (
					entry.headOid &&
					entry.workdirOid &&
					entry.headOid !== entry.stageOid &&
					entry.stageOid === entry.workdirOid
				) {
					return [filepath, "modified", entry]
				}

				// [ 1, 0, 1] deleted, unstaged "*deleted"	file has been removed, but the removal is not yet staged
				if (entry.headOid && !entry.workdirOid && entry.headOid === entry.stageOid) {
					return [filepath, "*deleted", entry]
				}

				// [ 1, 0, 0] deleted, staged "deleted"	file has been removed, staged
				if (entry.headOid && !entry.workdirOid && !entry.stageOid) {
					return [filepath, "deleted", entry]
				}

				// "*absent"	file not present in working dir or HEAD commit, but present in stage
				if (!entry.headOid && !entry.workdirOid && entry.stageOid) {
					return [filepath, "*absent", entry]
				}

				// "*undeletemodified"	file was deleted from stage, but is present with modifications in the working dir
				if (
					entry.headOid &&
					entry.workdirOid &&
					!entry.stageOid &&
					entry.headOid !== entry.workdirOid
				) {
					return [filepath, "*undeletemodified", entry]
				}

				// "*unmodified" working dir and HEAD commit match, but stage differs
				if (
					entry.headOid &&
					entry.workdirOid &&
					entry.stageOid &&
					entry.stageOid !== entry.headOid &&
					entry.headOid === entry.workdirOid
				) {
					return [filepath, "*unmodified", entry]
				}

				// "*undeleted"	file was deleted from stage, but is still in the working dir
				if (
					entry.headOid &&
					entry.workdirOid &&
					!entry.stageOid &&
					entry.headOid === entry.workdirOid
				) {
					return [filepath, "*undeleted", entry]
				}

				return [filepath, "unknown", entry]
			},
		})
	} catch (err) {
		// @ts-ignore
		err.caller = "lix.status"
		throw err
	}
}
