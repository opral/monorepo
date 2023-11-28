import type { NodeishFilesystem, NodeishStats, FileChangeInfo } from "./NodeishFilesystemApi.js"
import { FilesystemError } from "./errors/FilesystemError.js"
import { normalPath, getBasename, getDirname } from "./utilities/helpers.js"

type Inode = Uint8Array | Set<string>

export function toSnapshot(fs: NodeishFilesystem) {
	return {
		fsMap: Object.fromEntries(
			[...fs._state.fsMap].map(([path, content]) => {
				return [
					path,
					// requires node buffers, but no web standard method exists
					content instanceof Set ? [...content] : content.toString("base64"),
					// this breaks packfile binary data but could be fixed in futurebtoa(unescape(encodeURIComponent(new TextDecoder().decode(content)))),
				]
			})
		),
		fsStats: Object.fromEntries(
			[...fs._state.fsStats].map(([path, fsStat]) => {
				return [
					path,
					{
						...fsStat,
						isFile: undefined,
						isDirectory: undefined,
						isSymbolicLink: undefined,
					},
				]
			})
		),
	}
}

export function fromSnapshot(fs: NodeishFilesystem, snapshot: { fsMap: any; fsStats: any }) {
	fs._state.fsMap = new Map(
		// @ts-ignore FIXME: no idea what ts wants me to do here the error message is ridiculous
		Object.entries(snapshot.fsMap).map(([path, content]) => {
			if (typeof content === "string") {
				// requires node buffers, but no web standard method exists
				const data = Buffer.from(content, "base64")
				// new TextEncoder().encode(decodeURIComponent(escape(atob(content)))) Buffer.from()
				return [path, data]
			}

			return [path, new Set(content as string[])]
		})
	)
	fs._state.fsStats = new Map(
		Object.entries(snapshot.fsStats).map(([path, rawStat]) => {
			const serializedStat = rawStat as Omit<
				NodeishStats,
				"isFile" | "isDirectory" | "isSymbolicLink"
			>

			const statsObj = {
				...serializedStat,
				isFile: () => serializedStat._kind === 0,
				isDirectory: () => serializedStat._kind === 1,
				isSymbolicLink: () => serializedStat._kind === 2,
			} as NodeishStats

			return [path, statsObj]
		})
	)
}

export function createNodeishMemoryFs(): NodeishFilesystem {
	// local state
	const state: {
		fsMap: Map<string, Inode>
		fsStats: Map<string, NodeishStats>
	} = {
		fsMap: new Map(),
		fsStats: new Map(),
	}

	// initialize the root to an empty dir
	state.fsMap.set("/", new Set())
	newStatEntry("/", state.fsStats, 1, 0o755)

	const listeners: Set<(event: FileChangeInfo) => void> = new Set()

	async function stat(path: Parameters<NodeishFilesystem["stat"]>[0]): Promise<NodeishStats> {
		path = normalPath(path)
		const stats: NodeishStats | undefined = state.fsStats.get(path)
		if (stats === undefined) throw new FilesystemError("ENOENT", path, "stat")
		if (stats.symlinkTarget) return stat(stats.symlinkTarget)
		return Object.assign({}, stats)
	}

	async function lstat(path: Parameters<NodeishFilesystem["lstat"]>[0]) {
		path = normalPath(path)
		const stats: NodeishStats | undefined = state.fsStats.get(path)
		if (stats === undefined) throw new FilesystemError("ENOENT", path, "lstat")
		if (!stats.symlinkTarget) return stat(path)
		return Object.assign({}, stats)
	}

	return {
		_state: state,
		writeFile: async function (
			path: Parameters<NodeishFilesystem["writeFile"]>[0],
			data: Parameters<NodeishFilesystem["writeFile"]>[1],
			options?: Parameters<NodeishFilesystem["writeFile"]>[2]
		) {
			path = normalPath(path)
			const dirName = getDirname(path)
			const baseName = getBasename(path)
			const parentDir: Inode | undefined = state.fsMap.get(dirName)

			if (!(parentDir instanceof Set)) throw new FilesystemError("ENOENT", path, "writeFile")

			if (typeof data === "string") {
				data = Buffer.from(new TextEncoder().encode(data))
			} else if (!(data instanceof Uint8Array)) {
				throw new FilesystemError(
					'The "data" argument must be of type string/Uint8Array',
					data,
					"readFile"
				)
			} else if (!Buffer.isBuffer(data)) {
				data = Buffer.from(data)
			}

			parentDir.add(baseName)
			newStatEntry(path, state.fsStats, 0, options?.mode ?? 0o644)
			state.fsMap.set(path, data)
			for (const listener of listeners) {
				listener({ eventType: "rename", filename: dirName + baseName })
			}
		},

		// @ts-expect-error
		//   Typescript can't derive that the return type is either
		//   a string or a Uint8Array based on the options.
		readFile: async function (
			path: Parameters<NodeishFilesystem["readFile"]>[0],
			options?: Parameters<NodeishFilesystem["readFile"]>[1]
		) {
			const decoder = new TextDecoder()

			path = normalPath(path)
			const file: Inode | undefined = state.fsMap.get(path)

			if (file instanceof Set) throw new FilesystemError("EISDIR", path, "readFile")
			if (file === undefined) throw new FilesystemError("ENOENT", path, "readFile")
			if (!(options?.encoding || typeof options === "string")) return file

			return decoder.decode(file)
		},

		readdir: async function (path: Parameters<NodeishFilesystem["readdir"]>[0]) {
			path = normalPath(path)
			const dir: Inode | undefined = state.fsMap.get(path)
			if (dir instanceof Set) return [...dir.keys()]
			if (dir === undefined) throw new FilesystemError("ENOENT", path, "readdir")
			throw new FilesystemError("ENOTDIR", path, "readdir")
		},

		mkdir: async function mkdir(
			path: Parameters<NodeishFilesystem["mkdir"]>[0],
			options: Parameters<NodeishFilesystem["mkdir"]>[1]
		): Promise<string | undefined> {
			path = normalPath(path)
			const dirName = getDirname(path)
			const baseName = getBasename(path)
			const parentDir: Inode | undefined = state.fsMap.get(dirName)

			if (typeof parentDir === "string") throw new FilesystemError("ENOTDIR", path, "mkdir")

			if (parentDir && parentDir instanceof Set) {
				parentDir.add(baseName)
				newStatEntry(path, state.fsStats, 1, 0o755)
				state.fsMap.set(path, new Set())
				for (const listener of listeners) {
					listener({ eventType: "rename", filename: dirName + baseName })
				}
				return path
			}

			if (options?.recursive) {
				const firstPath = await mkdir(getDirname(path), options)
				await mkdir(path, options)
				return firstPath
			}

			throw new FilesystemError("ENOENT", path, "mkdir")
		},

		rm: async function rm(
			path: Parameters<NodeishFilesystem["rm"]>[0],
			options: Parameters<NodeishFilesystem["rm"]>[1]
		) {
			path = normalPath(path)
			const dirName = getDirname(path)
			const baseName = getBasename(path)
			const target: Inode | undefined = state.fsMap.get(path)
			const parentDir: Inode | undefined = state.fsMap.get(dirName)

			if (parentDir === undefined || target === undefined)
				throw new FilesystemError("ENOENT", path, "rm")

			if (parentDir instanceof Uint8Array) throw new FilesystemError("ENOTDIR", path, "rm")

			if (target instanceof Uint8Array) {
				parentDir.delete(baseName)
				state.fsStats.delete(path)
				state.fsMap.delete(path)
				for (const listener of listeners) {
					listener({ eventType: "rename", filename: dirName + baseName })
				}

				return
			}

			if (target instanceof Set && options?.recursive) {
				await Promise.all(
					[...target.keys()].map(async (child) => {
						await rm(`${path}/${child}`, { recursive: true })
					})
				)
				parentDir.delete(baseName)
				state.fsStats.delete(path)
				state.fsMap.delete(path)
				for (const listener of listeners) {
					listener({ eventType: "rename", filename: dirName + baseName })
				}

				return
			}

			throw new FilesystemError("EISDIR", path, "rm")
		},

		/**
		 *
		 * @throws {"ENOENT" | WatchAbortedError} // TODO: move to lix error classes FileDoesNotExistError
		 */
		watch: function (
			path: Parameters<NodeishFilesystem["watch"]>[0],
			options: Parameters<NodeishFilesystem["watch"]>[1]
		) {
			path = normalPath(path)
			const watchName = getBasename(path)
			const watchDir = getDirname(path)
			const watchPath = watchDir + watchName

			// @ts-ignore
			if (options?.persistent || options?.encoding) {
				throw new Error("Some watch opptions not implemented, only 'recursive' allowed")
			}

			const queue: FileChangeInfo[] = []

			let handleNext: (arg: any) => void
			let rejecteNext: (err: Error) => void
			let changeEvent: Promise<Error | undefined> = new Promise((resolve, reject) => {
				handleNext = resolve
				rejecteNext = reject
			})

			const listener = (event: FileChangeInfo) => {
				if (event.filename === null) {
					throw new Error("Internal watcher error: missing filename")
				}
				const changeName = getBasename(event.filename)
				const changeDir = getDirname(event.filename)

				if (event.filename === watchPath) {
					event.filename = changeName
					queue.push(event)
					setTimeout(() => handleNext(undefined), 0)
				} else if (changeDir === watchPath + "/") {
					event.filename = event.filename.replace(watchPath + "/", "") || changeName
					queue.push(event)
					setTimeout(() => handleNext(undefined), 0)
				} else if (options?.recursive && event.filename.startsWith(watchPath)) {
					// console.log(event.filename, { watchPath, changeDir, changeName })
					event.filename = event.filename.replace(watchPath + "/", "") || changeName
					queue.push(event)
					setTimeout(() => handleNext(undefined), 0)
				}
			}

			listeners.add(listener)

			if (options?.signal) {
				options.signal.addEventListener(
					"abort",
					() => {
						listeners.delete(listener)
						try {
							options.signal?.throwIfAborted()
						} catch (err) {
							rejecteNext(err as Error)
						}
					},
					{ once: true }
				)
			}

			return (async function* () {
				while (!options?.signal?.aborted) {
					if (queue.length > 0) {
						yield queue.shift() as FileChangeInfo
					} else {
						await changeEvent
						changeEvent = new Promise((resolve, reject) => {
							handleNext = resolve
							rejecteNext = reject
						})
					}
				}
			})()
		},

		rmdir: async function (path: Parameters<NodeishFilesystem["rmdir"]>[0]) {
			path = normalPath(path)
			const dirName = getDirname(path)
			const baseName = getBasename(path)
			const target: Inode | undefined = state.fsMap.get(path)
			const parentDir: Inode | undefined = state.fsMap.get(dirName)

			if (parentDir === undefined || target === undefined)
				throw new FilesystemError("ENOENT", path, "rmdir")

			if (parentDir instanceof Uint8Array || target instanceof Uint8Array)
				throw new FilesystemError("ENOTDIR", path, "rmdir")

			if (target.size) throw new FilesystemError("ENOTEMPTY", path, "rmdir")

			parentDir.delete(baseName)
			state.fsStats.delete(path)
			state.fsMap.delete(path)

			for (const listener of listeners) {
				listener({ eventType: "rename", filename: dirName + baseName })
			}
		},

		symlink: async function (
			target: Parameters<NodeishFilesystem["symlink"]>[0],
			path: Parameters<NodeishFilesystem["symlink"]>[1]
		) {
			path = normalPath(path)
			target = target.startsWith("/") ? target : `${path}/../${target}`
			const targetInode: Inode | undefined = state.fsMap.get(normalPath(target))
			const parentDir: Inode | undefined = state.fsMap.get(getDirname(path))

			if (state.fsMap.get(path)) throw new FilesystemError("EEXIST", path, "symlink", target)

			if (parentDir instanceof Uint8Array)
				throw new FilesystemError("ENOTDIR", path, "symlink", target)

			if (targetInode === undefined || parentDir === undefined)
				throw new FilesystemError("ENOENT", path, "symlink", target)

			parentDir.add(getBasename(path))
			newStatEntry(path, state.fsStats, 2, 0o777, target)
			state.fsMap.set(path, targetInode)
		},

		unlink: async function (path: Parameters<NodeishFilesystem["unlink"]>[0]) {
			path = normalPath(path)
			const targetStats = state.fsStats.get(path)
			const target: Inode | undefined = state.fsMap.get(path)
			const parentDir: Inode | undefined = state.fsMap.get(getDirname(path))

			if (parentDir === undefined || target === undefined)
				throw new FilesystemError("ENOENT", path, "unlink")

			if (parentDir instanceof Uint8Array) throw new FilesystemError("ENOTDIR", path, "unlink")

			if (targetStats?.isDirectory()) throw new FilesystemError("EISDIR", path, "unlink")

			parentDir.delete(getBasename(path))
			state.fsStats.delete(path)
			state.fsMap.delete(path)
		},
		readlink: async function (path: Parameters<NodeishFilesystem["readlink"]>[0]) {
			path = normalPath(path)
			const linkStats = await lstat(path)

			if (linkStats === undefined) throw new FilesystemError("ENOENT", path, "readlink")

			if (linkStats.symlinkTarget === undefined)
				throw new FilesystemError("EINVAL", path, "readlink")

			return linkStats.symlinkTarget
		},
		stat,
		lstat,
	}
}

/**
 * Creates a new stat entry. 'kind' refers to whether the entry is for a file,
 * directory or symlink:
 * 0 = File
 * 1 = Directory
 * 2 = Symlink
 */
function newStatEntry(
	path: string,
	stats: Map<string, NodeishStats>,
	kind: number,
	modeBits: number,
	target?: string
) {
	const cdateMs: number = Date.now()
	const _kind = kind
	stats.set(normalPath(path), {
		ctimeMs: cdateMs,
		mtimeMs: cdateMs,
		dev: 0,
		ino: stats.size + 1,
		mode: (!kind ? 0o100000 : kind === 1 ? 0o040000 : 0o120000) | modeBits,
		uid: 0,
		gid: 0,
		size: -1,
		isFile: () => kind === 0,
		isDirectory: () => kind === 1,
		isSymbolicLink: () => kind === 2,
		// symlinkTarget is only for symlinks, and is not normalized
		symlinkTarget: target,
		_kind,
	})
}
