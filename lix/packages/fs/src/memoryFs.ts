import type { NodeishFilesystem, NodeishStats, FileChangeInfo } from "./NodeishFilesystemApi.js"
import { FilesystemError } from "./errors/FilesystemError.js"
import { normalPath, getBasename, getDirname } from "./utilities/helpers.js"

type Inode = Uint8Array | Set<string> | { placeholder: true }

export type Snapshot = {
	fsMap: {
		[key: string]: string[] | string | { placeholder: true }
	}
	fsStats: {
		[key: string]: {
			ctimeMs: number
			mtimeMs: number
			dev: number
			mode: number
			uid: number
			gid: number
			size: number
			_kind: number
			_oid?: string
			_rootHash?: string
		}
	}
}

export function toSnapshot(fs: NodeishFilesystem) {
	return {
		fsMap: Object.fromEntries(
			[...fs._state.fsMap].map(([path, content]) => {
				let serializedContent
				if (content instanceof Set) {
					serializedContent = [...content].sort()
				} else if (content.placeholder) {
					serializedContent = content
				} else {
					serializedContent = content.toString("base64")
				}
				return [
					path,
					// requires node buffers, but no web standard method exists
					serializedContent,

					// Alternative to try:
					// onst binaryData = new Uint8Array([255, 116, 79, 99 /*...*/]);
					// const base64Encoded = btoa(String.fromCharCode.apply(null, binaryData));
					// // Decode Base64 back to binary
					// const decodedBinaryString = atob(base64Encoded);
					// const decodedBinaryData = new Uint8Array([...decodedBinaryString].map(char => char.charCodeAt(0)));
					// this breaks packfile binary data but could be fixed in future btoa(unescape(encodeURIComponent(new TextDecoder().decode(content)))),
				]
			})
		),
		fsStats: Object.fromEntries(
			[...fs._state.fsStats].map(([path, fsStat]) => {
				return [
					path,
					{
						...fsStat,
						ino: undefined,
						isFile: undefined,
						isDirectory: undefined,
						isSymbolicLink: undefined,
					},
				]
			})
		),
	}
}

export function fromSnapshot(
	fs: NodeishFilesystem,
	snapshot: { fsMap: any; fsStats: any },
	{ pathPrefix = "" } = {}
) {
	// TODO: windows withothout repo will hang tests. fix this with windows vm¯
	fs._state.lastIno = 1
	fs._state.fsMap = new Map(
		// @ts-ignore FIXME: no idea what ts wants me to do here the error message is ridiculous
		Object.entries(snapshot.fsMap).map(([path, content]) => {
			if (typeof content === "string") {
				// requires node buffers, but no web standard method exists
				const data = Buffer.from(content, "base64")
				// new TextEncoder().encode(decodeURIComponent(escape(atob(content)))) Buffer.from()
				return [pathPrefix + path, data]

				// @ts-ignore
			} else if (content?.placeholder) {
				return [pathPrefix + path, content]
			}

			return [pathPrefix + path, new Set(content as string[])]
		})
	)

	fs._state.fsStats = new Map(
		Object.entries(snapshot.fsStats).map(([path, rawStat]) => {
			const serializedStat = rawStat as Omit<
				NodeishStats,
				"isFile" | "isDirectory" | "isSymbolicLink" | "ino"
			>

			const statsObj = {
				...serializedStat,
				ino: fs._state.lastIno++,
				isFile: () => serializedStat._kind === 0,
				isDirectory: () => serializedStat._kind === 1,
				isSymbolicLink: () => serializedStat._kind === 2,
			} as NodeishStats

			return [pathPrefix + path, statsObj]
		})
	)

	if (pathPrefix) {
		const prefixParts = pathPrefix.split("/")
		const rootStat = fs._state.fsStats.get(pathPrefix + "/")

		for (let i = 1; i < prefixParts.length; i++) {
			const path = prefixParts.slice(0, i).join("/") + "/"

			fs._state.fsMap.set(path, new Set([prefixParts[i]]))
			fs._state.fsStats.set(path, rootStat)
		}
	}
}

export function createNodeishMemoryFs(): NodeishFilesystem {
	// local state
	const state: {
		lastIno: number
		fsMap: Map<string, Inode>
		fsStats: Map<string, NodeishStats>
	} = {
		lastIno: 1,
		fsMap: new Map(),
		fsStats: new Map(),
	}

	// initialize the root to an empty dir
	state.fsMap.set("/", new Set())
	newStatEntry({
		path: "/",
		stats: state.fsStats,
		kind: 1,
		modeBits: 0o755,
	})

	const listeners: Set<(event: FileChangeInfo) => void> = new Set()

	// MISSING: exists and reddir with recursive option

	async function stat(path: Parameters<NodeishFilesystem["stat"]>[0]): Promise<NodeishStats> {
		path = normalPath(path)
		const stats: NodeishStats | undefined = state.fsStats.get(path)
		if (stats === undefined) throw new FilesystemError("ENOENT", path, "stat")
		if (stats.symlinkTarget) return stat(stats.symlinkTarget)
		return Object.assign({}, stats)
	}

	// lstat is like stat, but does not follow symlinks
	async function lstat(path: Parameters<NodeishFilesystem["lstat"]>[0]) {
		path = normalPath(path)
		const stats: NodeishStats | undefined = state.fsStats.get(path)
		if (stats === undefined) throw new FilesystemError("ENOENT", path, "lstat")
		if (!stats.symlinkTarget) return stat(path)
		return Object.assign({}, stats)
	}

	return {
		_state: state,

		_createPlaceholder: async function (
			path: Parameters<NodeishFilesystem["writeFile"]>[0],
			options: {
				mode: number
				oid: string
				rootHash: string
			}
		) {
			path = normalPath(path)
			const dirName = getDirname(path)
			const baseName = getBasename(path)
			let parentDir: Inode | undefined = state.fsMap.get(dirName)
			if (!(parentDir instanceof Set)) {
				await this.mkdir(dirName, { recursive: true })

				parentDir = state.fsMap.get(dirName)
				if (!(parentDir instanceof Set)) {
					throw new FilesystemError("ENOENT", path, "writeFile")
				}
			}

			parentDir.add(baseName)
			const isSymbolicLink = options.mode === 120000

			newStatEntry({
				path,
				stats: state.fsStats,
				kind: isSymbolicLink ? 2 : 0,
				modeBits: options.mode,
				oid: options.oid,
				rootHash: options.rootHash,
			})

			state.fsMap.set(path, { placeholder: true })
		},

		_isPlaceholder: function (path: Parameters<NodeishFilesystem["writeFile"]>[0]) {
			path = normalPath(path)
			const entry = state.fsMap.get(path)

			if (entry && "placeholder" in entry) {
				return true
			}
			return false
		},

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

			newStatEntry({
				path,
				stats: state.fsStats,
				kind: 0,
				modeBits: options?.mode ?? 0o644,
			})

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
			if ("placeholder" in file) throw new FilesystemError("EPLACEHOLDER", path, "readFile")
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

			if (typeof parentDir === "string" || (parentDir && "palceholder" in parentDir)) {
				throw new FilesystemError("ENOTDIR", path, "mkdir")
			}

			if (parentDir && parentDir instanceof Set) {
				if (state.fsMap.has(path)) {
					if (!options?.recursive) {
						throw new FilesystemError("EEXIST", path, "mkdir")
					} else {
						return undefined
					}
				}

				parentDir.add(baseName)

				newStatEntry({
					path,
					stats: state.fsStats,
					kind: 1,
					modeBits: 0o755,
				})

				state.fsMap.set(path, new Set())

				for (const listener of listeners) {
					listener({ eventType: "rename", filename: dirName + baseName })
				}
				return path
			} else if (options?.recursive) {
				const parent = getDirname(path)
				const parentRes = await mkdir(parent, options)
				await mkdir(path, options)
				return parentRes
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
			const targetStats = state.fsStats.get(path)
			const parentDir: Inode | undefined = state.fsMap.get(dirName)

			if (parentDir === undefined || targetStats === undefined)
				throw new FilesystemError("ENOENT", path, "rm")

			if (parentDir instanceof Uint8Array || "placeholder" in parentDir) {
				throw new FilesystemError("ENOTDIR", path, "rm")
			}

			if (
				target instanceof Uint8Array ||
				(target && "placeholder" in target) ||
				targetStats.isSymbolicLink()
			) {
				parentDir.delete(baseName)
				state.fsStats.delete(path)
				state.fsMap.delete(path)
				// TODO: check if placeholder should skip firing
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
			const watchPath = watchName === "/" ? watchDir : watchDir + watchName

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

			const listener = ({ eventType, filename }: FileChangeInfo) => {
				const event: FileChangeInfo = {
					eventType,
					filename,
				}

				if (event.filename === null) {
					throw new Error("Internal watcher error: missing filename")
				}
				const changeName = getBasename(event.filename)
				const changeDir = getDirname(event.filename)

				if (event.filename === watchPath) {
					event.filename = changeName
					queue.push(event)
					setTimeout(() => handleNext(undefined), 0)
				} else if (changeDir === `${watchPath}/`) {
					event.filename = event.filename.replace(`${watchPath}/`, "") || changeName
					queue.push(event)
					setTimeout(() => handleNext(undefined), 0)
				} else if (options?.recursive && event.filename.startsWith(watchPath)) {
					event.filename = event.filename.replace(`${watchPath}/`, "") || changeName
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

			// inline async definition like "return (async function* () {" are not supported by the figma api
			const asyncIterator = async function* () {
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
			}

			return asyncIterator()
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

			if ("placeholder" in parentDir || "placeholder" in target) {
				throw new FilesystemError("ENOTDIR", path, "rmdir")
			}

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

			if (state.fsMap.get(path)) {
				throw new FilesystemError("EEXIST", path, "symlink", target)
			}

			if (parentDir === undefined) {
				throw new FilesystemError("ENOENT", path, "symlink", target)
			}

			if (parentDir instanceof Uint8Array || "placeholder" in parentDir) {
				throw new FilesystemError("ENOTDIR", path, "symlink", target)
			}

			if (targetInode !== undefined) {
				state.fsMap.set(path, targetInode)
			}

			parentDir.add(getBasename(path))

			newStatEntry({
				path,
				stats: state.fsStats,
				kind: 2,
				modeBits: 0o777,
				target,
			})
		},

		unlink: async function (path: Parameters<NodeishFilesystem["unlink"]>[0]) {
			path = normalPath(path)
			const targetStats = state.fsStats.get(path)
			const target: Inode | undefined = state.fsMap.get(path)
			const parentDir: Inode | undefined = state.fsMap.get(getDirname(path))

			if (parentDir === undefined || target === undefined)
				throw new FilesystemError("ENOENT", path, "unlink")

			if (parentDir instanceof Uint8Array || "placeholder" in parentDir) {
				throw new FilesystemError("ENOTDIR", path, "unlink")
			}

			if (targetStats?.isDirectory()) {
				throw new FilesystemError("EISDIR", path, "unlink")
			}

			parentDir.delete(getBasename(path))
			state.fsStats.delete(path)
			state.fsMap.delete(path)
		},
		readlink: async function (path: Parameters<NodeishFilesystem["readlink"]>[0]) {
			path = normalPath(path)
			const linkStats = await lstat(path)

			if (linkStats === undefined) {
				throw new FilesystemError("ENOENT", path, "readlink")
			}

			if (linkStats.symlinkTarget === undefined) {
				throw new FilesystemError("EINVAL", path, "readlink")
			}

			return linkStats.symlinkTarget
		},
		stat,
		lstat,
	}

	/**
	 * Creates a new stat entry. 'kind' refers to whether the entry is for a file,
	 * directory or symlink:
	 * 0 = File
	 * 1 = Directory
	 * 2 = Symlink
	 */
	function newStatEntry({
		path,
		stats,
		kind,
		modeBits,
		target,
		oid,
		rootHash,
	}: {
		path: string
		stats: Map<string, NodeishStats>
		kind: number
		modeBits: number
		target?: string
		oid?: string
		rootHash?: string
	}) {
		const currentTime: number = Date.now()
		const _kind = kind

		const oldStats = stats.get(normalPath(path))

		// We need to always bump by 1 second in case mtime did not change since last write to trigger iso git 1 second resolution change detection
		const mtimeMs =
			Math.floor(currentTime / 1000) === (oldStats?.mtimeMs && Math.floor(oldStats?.mtimeMs / 1000))
				? currentTime + 1000
				: currentTime

		stats.set(normalPath(path), {
			ctimeMs: oldStats?.ctimeMs || currentTime,
			mtimeMs,
			dev: 0,
			ino: oldStats?.ino || state.lastIno++,
			mode: (!kind ? 0o100000 : kind === 1 ? 0o040000 : 0o120000) | modeBits,
			uid: 0,
			gid: 0,
			size: -1,
			isFile: () => kind === 0,
			isDirectory: () => kind === 1,
			isSymbolicLink: () => kind === 2,
			// symlinkTarget is only for symlinks, and is not normalized
			symlinkTarget: target,
			_oid: oid,
			_rootHash: rootHash,
			_kind,
		})
	}
}
