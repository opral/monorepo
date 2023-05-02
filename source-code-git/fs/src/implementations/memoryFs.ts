import type { FileData, NodeishFilesystem } from "../interface.js"
import { FilesystemError } from "../errors/FilesystemError.js"

type Directory = Map<string, MemoryInode>
type Inode = FileData | MemoryDirectory

export type MemoryInode = FileData | MemoryDirectory
export type MemoryDirectory = Map<string, MemoryInode>

export function createMemoryFs(): NodeishFilesystem {
	// local state
	const fsRoot = initDir(new Map())
	const specialPaths = ["", ".", ".."]

	return {
		writeFile: async function (
			path: Parameters<NodeishFilesystem["writeFile"]>[0],
			data: Parameters<NodeishFilesystem["writeFile"]>[1],
		) {
			const parentDir: Inode | undefined = followPath(fsRoot, await getDirname(path), false)
			if (parentDir instanceof Map) parentDir.set(await getBasename(path), data)
			else throw new FilesystemError("ENOENT", path)
		},

		readFile: async function (
			path: Parameters<NodeishFilesystem["readFile"]>[0],
			options: Parameters<NodeishFilesystem["readFile"]>[1],
		) {
			const file: Inode | undefined = followPath(fsRoot, path)
			if (typeof file === "string") return file

			if (!file) throw new FilesystemError("ENOENT", path)
			throw new FilesystemError("EISDIR", path)
		},

		readdir: async function (path: Parameters<NodeishFilesystem["readdir"]>[0]) {
			const dir: Inode | undefined = followPath(fsRoot, path)
			if (dir instanceof Map) return [...dir.keys()].filter((x) => !specialPaths.includes(x))
			if (!dir) throw new FilesystemError("ENOENT", path)
			throw new FilesystemError("ENOTDIR", path)
		},

		mkdir: async function (
			path: Parameters<NodeishFilesystem["mkdir"]>[0],
			options: Parameters<NodeishFilesystem["mkdir"]>[1],
		) {
			const parentDir: Inode | undefined = followPath(
				fsRoot,
				await getDirname(path),
				options?.recursive ?? false,
			)

			if (!parentDir) throw new FilesystemError("ENOENT", path)
			else if (parentDir instanceof Map) parentDir.set(await getBasename(path), initDir(parentDir))
			else throw new FilesystemError("ENOTDIR", path)
			return options?.recursive ? "not implemented." : undefined
		},

		rm: async function (
			path: Parameters<NodeishFilesystem["rm"]>[0],
			options: Parameters<NodeishFilesystem["rm"]>[1],
		) {
			const parentDir: Inode | undefined = followPath(fsRoot, await getDirname(path), false)
			if (!parentDir) throw new FilesystemError("ENOENT", path)

			if (parentDir instanceof Map) {
				const basename = await getBasename(path)
				switch (typeof parentDir.get(basename)) {
					case "string":
						parentDir.delete(basename)
						break
					case "object":
						if (options?.recursive) parentDir.delete(basename)
						else throw new FilesystemError("EISDIR", path)
						break
					case "undefined":
						throw new FilesystemError("ENOENT", path)
				}
			} else throw new FilesystemError("ENOTDIR", path)
		},

		rmdir: async function (path: Parameters<NodeishFilesystem["rmdir"]>[0]) {
			const parentDir: Inode | undefined = followPath(fsRoot, await getDirname(path), false)
			if (!parentDir) throw new FilesystemError("ENOENT", path)

			if (parentDir instanceof Map) {
				const basename = await getBasename(path)
				const dir: Inode | undefined = parentDir.get(basename)
				switch (typeof dir) {
					case "string":
						throw new FilesystemError("ENOTDIR", path)
					case "object":
						if (dir instanceof Uint8Array) throw new FilesystemError("ENOTDIR", path)
						if (dir.size === specialPaths.length) parentDir.delete(basename)
						else throw new FilesystemError("ENOTEMPTY", path)
						break
					case "undefined":
						throw new FilesystemError("ENOENT", path)
				}
			} else throw new FilesystemError("ENOTDIR", path)
		},
	}
}

function initDir(parentDir: Directory) {
	// A circular reference allows for simple handling of leading and
	// trailing slashes, as well as "." paths
	//
	// Since these only exist internaly, there shouldn't be issues
	// with serialization
	const dir = new Map()
	dir.set("", dir)
	dir.set(".", dir)
	dir.set("..", parentDir)
	return dir
}

function followPath(
	target: Inode | undefined,
	path: string,
	makeParent = false,
): Inode | undefined {
	const pathList: string[] = path.split("/")
	let parentDir: Directory

	if (makeParent) {
		for (const path of pathList) {
			if (target instanceof Map) {
				parentDir = target
				target = target.get(path) ?? undefined
			} else break

			if (target === undefined) {
				if (!makeParent) return undefined
				parentDir.set(path, initDir(parentDir))
				target = parentDir.get(path) ?? undefined
			}
		}
	} else {
		for (const path of pathList) {
			if (target instanceof Map) target = target.get(path) ?? undefined
			else break

			if (target === undefined) return undefined
		}
	}

	return target
}

async function getDirname(path: string): Promise<string> {
	return path
		.split("/")
		.filter((x) => !["", "."].includes(x))
		.slice(0, -1)
		.join("/")
}

async function getBasename(path: string): Promise<string> {
	return path
		.split("/")
		.filter((x) => !["", ".", ".."].includes(x))
		.at(-1)!
}
