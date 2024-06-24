import type { NodeishFilesystem } from "@lix-js/fs"
import isoGit, { _worthWalking } from "../../vendored/isomorphic-git/index.js"
import { modeToFileType } from "./helpers.js"
import type { RepoContext, RepoState } from "../openRepository.js"

// TODO: LSTAT is not properly impl. in the memory fs!

const {
	walk, // _walk expects cache to always exist.

	TREE,
	WORKDIR,
	STAGE,

	isIgnored,
} = isoGit

export type OptStatus = "unmodified" | "materialized" | "ignored"

type StatusText =
	| "unmodified"
	// files added but not staged yet
	| "*added"
	// files added, staged, but not all changes staged yet
	| "*added2"
	// added and added to stage
	| "added"
	// files modified but changes not committed to stage
	| "*modified"
	// files modified but changes not committed to stage AND stage has uncommited changes
	| "*modified2"
	// files modified and changes committed to stage
	| "modified"
	// deleted but file still in index
	| "*deleted"
	// deleted and removed from index
	| "deleted"
	// file not present in working dir or HEAD commit, but present in stage
	| "*absent"
	// file was deleted from stage, but is present with modifications in the working dir
	| "*undeletemodified"
	// working dir and HEAD commit match, but stage differs
	| "*unmodified"
	// file was deleted from stage, but is still in the working dir
	| "*undeleted"
	// fallback for permutations without existing isogit named status
	| "unknown"
	| "ignored"

type StatusList = [string, StatusText][]

function isoNormalizePath(path: string) {
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
	return isoNormalizePath(parts.map(isoNormalizePath).join("/"))
}

export type StatusArgs = {
	ensureFirstBatch: () => Promise<void>
	fs: NodeishFilesystem
	/** The [working tree](dir-vs-gitdir.md) directory path */
	dir: string
	/**
	 * The [git directory](dir-vs-gitdir.md) path
	 * @default join(dir, ".git")
	 */
	gitdir?: string
	/**
	 * Optionally specify a different commit to compare against the workdir and stage instead of the HEAD
	 * @default "HEAD"
	 */
	ref?: string
	/**
	 * Limit the query to the given files and directories
	 */
	filepaths?: string[]
	/** Filter the results to only those whose filepath matches a function. */
	filter?: (filepath: string) => boolean
	/** (experimental filter option) TODO document */
	sparseFilter?: (entry: { filename: string; type: "file" | "folder" | "symlink" }) => boolean
	/** an isogit cache object */
	cache?: object
	/**
	 * include normally excluded statuses
	 * @default []
	 **/
	includeStatus?: OptStatus[]
	/**
	 * include hashes of the files for workdir, head and staging
	 * @default false
	 */
	addHashes?: boolean
}

export async function statusList(
	ctx: RepoContext,
	state: RepoState,
	statusArg?: Pick<StatusArgs, "filter" | "filepaths" | "includeStatus">
): ReturnType<typeof _statusList> {
	return await _statusList({
		fs: ctx.rawFs,
		ensureFirstBatch: state.ensureFirstBatch,
		dir: ctx.dir,
		cache: ctx.cache,
		sparseFilter: state.sparseFilter,
		filter: statusArg?.filter,
		filepaths: statusArg?.filepaths,
		includeStatus: statusArg?.includeStatus,
	})
}

/**
 * Efficiently get the status of multiple files at once.
 */
export async function _statusList({
	fs,
	ensureFirstBatch,
	dir = "/",
	gitdir = join(dir, ".git"),
	ref = "HEAD",
	filepaths = ["."],
	filter,
	sparseFilter, // experimental, not yet exposed as lix api!
	cache,
	includeStatus = [],
	addHashes = false,
}: StatusArgs): Promise<StatusList> {
	try {
		// this call will materialzie all gitignore files that are queued on lazy cloning
		await ensureFirstBatch()

		const ignoredRes: any[] = []
		const walkRes = await walk({
			fs,
			cache,
			dir,
			gitdir,
			trees: [TREE({ ref }), WORKDIR(), STAGE()],
			/**
			 * Taken from the isomorphic-git documentation of walk's map function:
			 *
			 * This is the function that is called once per entry BEFORE visiting the children of that node.
			 * (1) If you return null for a tree entry, then none of the children of that tree entry will be walked - but the tree entry is still part of the results.
			 * (2) If you do not return a value (or return undefined) that entry will be filtered from the results.
			 */
			map: async function (filepath, [head, workdir, stage]) {
				// Ignore ignored files, but only if they are not already tracked.

				if (!head && !stage && workdir) {
					const ignored = await isIgnored({ fs, dir, filepath })
					if (ignored) {
						// "ignored" file ignored by a .gitignore rule, will not be shown unless explicitly asked for
						if (includeStatus.includes("ignored") || filepaths.includes(filepath)) {
							// we have to add ignored results but need to stop iterating into ignored folders...
							ignoredRes.push([
								filepath,
								"ignored",
								{ headOid: undefined, workdirOid: "ignored", stageOid: undefined },
							])
						}

						// eslint-disable-next-line unicorn/no-null -- return null to skip walking of ignored trees (folders) - compare (1)
						return null
					}
				}
				// match against base paths
				if (!filepaths.some((base) => _worthWalking(filepath, base))) {
					// eslint-disable-next-line unicorn/no-null -- the folder is not worth walking based on the passed filepaths - compare (1)
					return null
				}

				// Late filter against file names
				if (filter && !filter(filepath)) {
					// the given file path does not match the filepaths from filter - retrun undefined to skip it in the results - compare (2)
					return undefined
				}

				if (fs._isPlaceholder && fs._isPlaceholder(filepath)) {
					if (includeStatus.includes("unmodified") || filepaths.includes(filepath)) {
						const headType = head && (await head.type())
						if (headType !== "blob") {
							throw new Error("Placeholder file is not a blob in head: " + filepath)
						}
						const headOid = await head?.oid()

						return [
							filepath,
							"unmodified",
							{ headOid, workdirOid: headOid, stageOid: headOid, placeholder: true },
						]
					}
					// eslint-disable-next-line unicorn/no-null -- the placeholder is not worth walking since its file path is not explicit set in filpath NOR do we want unmodified files - compare (1)
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
					// skip iteration into broken symlinks or broken directories, can probably be removed when memfs supports proper lstat/symlinks
					// eslint-disable-next-line unicorn/no-null -- in case of a broken directory we don't want to travese into it - compare(1)
					return null
				}

				const [headType, workdirType, stageType] = types

				const isBlob = [headType, workdirType, stageType].includes("blob")

				if (sparseFilter) {
					const fileMode = await (head || workdir)?.mode()
					// @ts-ignore -- cannot be undefined
					const fileType: "file" | "folder" | "symlink" = modeToFileType(fileMode)

					if (
						!sparseFilter({
							filename: filepath,
							type: fileType,
						})
					) {
						// eslint-disable-next-line unicorn/no-null -- in case a folder is filtered using sparse - we wan't to skipp traversation of the tree
						return null
					}
				}

				// For now, bail on directories unless the file is also a blob in another tree
				if ((headType === "tree" || headType === "special") && !isBlob) {
					// We don't wan't to include directories in the status list but we still want to walk down there files. - compare (2)
					return undefined
				}

				if (headType === "commit") {
					// eslint-disable-next-line unicorn/no-null -- commit objects should not be walked, and we stop the walk by returning null - compare (1)
					return null
				}

				if ((workdirType === "tree" || workdirType === "special") && !isBlob) {
					// We don't wan't to include directories in the status list but we still want to walk down there files. - compare (2)
					return undefined
				}

				if (stageType === "commit") {
					// eslint-disable-next-line unicorn/no-null -- commit objects should not be walked, and we stop the walk by returning null - compare (1)
					return null
				}

				if ((stageType === "tree" || stageType === "special") && !isBlob) {
					// We don't wan't to include directories in the status list but we still want to walk down there files. - compare (2)
					return undefined
				}

				// Figure out the oids for files, using the staged oid for the working dir oid if the stats match.
				const headOid = headType === "blob" ? await head?.oid() : undefined
				const stageOid = stageType === "blob" ? await stage?.oid() : undefined

				let workdirOid

				if (headType !== "blob" && workdirType === "blob" && stageType !== "blob") {
					workdirOid = addHashes ? await workdir?.oid() : "42" // (use "42" here to avoid hashing of added files - just to realize they are *added - we only expose it for testing purpose)
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
						// the oid is the same and workdir type can not be different from blob (one of the previous if's would have triggered) - filter it out since unchanged
						return undefined
					}
				}

				// [ 0, 2, 0] new, untracked  "*untracked"	file is untracked, not yet staged
				if (!entry.headOid && !entry.stageOid && entry.workdirOid) {
					// we prefix untracked with * to allow to check for the asterix at the beginning to know if a file was not staged
					return [filepath, "*untracked", entry]
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
					return [filepath, "*added2", entry]
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
				// [ 1, 2, 3] modified, staged, with unstaged changes, "*modified2"
				if (
					entry.headOid &&
					entry.workdirOid &&
					entry.stageOid &&
					entry.stageOid !== entry.headOid &&
					entry.stageOid !== entry.workdirOid &&
					entry.headOid !== entry.workdirOid
				) {
					return [filepath, "*modified2", entry]
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

		return [...walkRes, ...ignoredRes]
	} catch (err) {
		// @ts-ignore
		err.caller = "lix.status"
		throw err
	}
}
