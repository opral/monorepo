import type { NodeishFilesystem, NodeishStats, FileChangeInfo } from "../NodeishFilesystemApi.js"
import { FilesystemError } from "../errors/FilesystemError.js"

type Inode = Uint8Array | Set<string>

export function createNodeishMemoryFs(): NodeishFilesystem {
	// local state
	const fsMap: Map<string, Inode> = new Map()
	const fsStats: Map<string, NodeishStats> = new Map()

	// initialize the root to an empty dir
	fsMap.set("/", new Set())
	newStatEntry("/", fsStats, 1, 0o755)

	const listeners: Set<(event: FileChangeInfo) => void> = new Set()

	async function stat(path: Parameters<NodeishFilesystem["stat"]>[0]): Promise<NodeishStats> {
		path = normalPath(path)
		const stats: NodeishStats | undefined = fsStats.get(path)
		if (stats === undefined) throw new FilesystemError("ENOENT", path, "stat")
		if (stats.symlinkTarget) return stat(stats.symlinkTarget)
		return Object.assign({}, stats)
	}

	async function lstat(path: Parameters<NodeishFilesystem["lstat"]>[0]) {
		path = normalPath(path)
		const stats: NodeishStats | undefined = fsStats.get(path)
		if (stats === undefined) throw new FilesystemError("ENOENT", path, "lstat")
		if (!stats.symlinkTarget) return stat(path)
		return Object.assign({}, stats)
	}

	return {
		writeFile: async function (
			path: Parameters<NodeishFilesystem["writeFile"]>[0],
			data: Parameters<NodeishFilesystem["writeFile"]>[1],
			options?: Parameters<NodeishFilesystem["writeFile"]>[2]
		) {
			const encoder = new TextEncoder()

			path = normalPath(path)
			const dirName = getDirname(path)
			const baseName = getBasename(path)
			const parentDir: Inode | undefined = fsMap.get(dirName)

			if (!(parentDir instanceof Set)) throw new FilesystemError("ENOENT", path, "writeFile")

			if (typeof data === "string") {
				data = encoder.encode(data)
			}

			parentDir.add(baseName)
			newStatEntry(path, fsStats, 0, options?.mode ?? 0o644)
			fsMap.set(path, data)
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
			const file: Inode | undefined = fsMap.get(path)

			if (file instanceof Set) throw new FilesystemError("EISDIR", path, "readFile")
			if (file === undefined) throw new FilesystemError("ENOENT", path, "readFile")
			if (!(options?.encoding || typeof options === "string")) return file

			return decoder.decode(file)
		},

		readdir: async function (path: Parameters<NodeishFilesystem["readdir"]>[0]) {
			path = normalPath(path)
			const dir: Inode | undefined = fsMap.get(path)
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
			const parentDir: Inode | undefined = fsMap.get(dirName)

			if (typeof parentDir === "string") throw new FilesystemError("ENOTDIR", path, "mkdir")

			if (parentDir && parentDir instanceof Set) {
				parentDir.add(baseName)
				newStatEntry(path, fsStats, 1, 0o755)
				fsMap.set(path, new Set())
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
			const target: Inode | undefined = fsMap.get(path)
			const parentDir: Inode | undefined = fsMap.get(dirName)

			if (parentDir === undefined || target === undefined)
				throw new FilesystemError("ENOENT", path, "rm")

			if (parentDir instanceof Uint8Array) throw new FilesystemError("ENOTDIR", path, "rm")

			if (target instanceof Uint8Array) {
				parentDir.delete(baseName)
				fsStats.delete(path)
				fsMap.delete(path)
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
				fsStats.delete(path)
				fsMap.delete(path)
				for (const listener of listeners) {
					listener({ eventType: "rename", filename: dirName + baseName })
				}

				return
			}

			throw new FilesystemError("EISDIR", path, "rm")
		},

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
			const target: Inode | undefined = fsMap.get(path)
			const parentDir: Inode | undefined = fsMap.get(dirName)

			if (parentDir === undefined || target === undefined)
				throw new FilesystemError("ENOENT", path, "rmdir")

			if (parentDir instanceof Uint8Array || target instanceof Uint8Array)
				throw new FilesystemError("ENOTDIR", path, "rmdir")

			if (target.size) throw new FilesystemError("ENOTEMPTY", path, "rmdir")

			parentDir.delete(baseName)
			fsStats.delete(path)
			fsMap.delete(path)

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
			const targetInode: Inode | undefined = fsMap.get(normalPath(target))
			const parentDir: Inode | undefined = fsMap.get(getDirname(path))

			if (fsMap.get(path)) throw new FilesystemError("EEXIST", path, "symlink", target)

			if (parentDir instanceof Uint8Array)
				throw new FilesystemError("ENOTDIR", path, "symlink", target)

			if (targetInode === undefined || parentDir === undefined)
				throw new FilesystemError("ENOENT", path, "symlink", target)

			parentDir.add(getBasename(path))
			newStatEntry(path, fsStats, 2, 0o777, target)
			fsMap.set(path, targetInode)
		},

		unlink: async function (path: Parameters<NodeishFilesystem["unlink"]>[0]) {
			path = normalPath(path)
			const targetStats = fsStats.get(path)
			const target: Inode | undefined = fsMap.get(path)
			const parentDir: Inode | undefined = fsMap.get(getDirname(path))

			if (parentDir === undefined || target === undefined)
				throw new FilesystemError("ENOENT", path, "unlink")

			if (parentDir instanceof Uint8Array) throw new FilesystemError("ENOTDIR", path, "unlink")

			if (targetStats?.isDirectory()) throw new FilesystemError("EISDIR", path, "unlink")

			parentDir.delete(getBasename(path))
			fsStats.delete(path)
			fsMap.delete(path)
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
	})
}

function getDirname(path: string): string {
	return normalPath(
		path
			.split("/")
			.filter((x) => x)
			.slice(0, -1)
			.join("/") ?? path
	)
}

function getBasename(path: string): string {
	return (
		path
			.split("/")
			.filter((x) => x)
			.at(-1) ?? path
	)
}

/**
 * Removes extraneous dots and slashes, resolves relative paths and ensures the
 * path begins and ends with '/'
 * FIXME: unify with utilities/normalizePath!
 */
function normalPath(path: string): string {
	const dots = /(\/|^)(\.\/)+/g
	const slashes = /\/+/g

	const upreference = /(?<!\.\.)[^/]+\/\.\.\//

	// Append '/' to the beginning and end
	path = `/${path}/`

	// Handle the edge case where a path begins with '/..'
	path = path.replace(/^\/\.\./, "")

	// Remove extraneous '.' and '/'
	path = path.replace(dots, "/").replace(slashes, "/")

	// Resolve relative paths if they exist
	let match
	while ((match = path.match(upreference)?.[0])) {
		path = path.replace(match, "")
	}

	return path
}
