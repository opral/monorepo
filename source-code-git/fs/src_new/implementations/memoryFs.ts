import type { FileData, Filesystem } from "../interface.js"
import { FilesystemError } from "../errors/FilesystemError.js"

type Directory = Map<string, MemoryInode>
type Inode = FileData | MemoryDirectory

export type MemoryInode = FileData | MemoryDirectory
export type MemoryDirectory = Map<string, MemoryInode>

export function createMemoryFs(): Filesystem {
	// local state
	const _root = initDir(new Map())
	const _specialPaths = ["", ".", ".."]

	return {
		writeFile: async function (path: string, content: FileData) {
			console.log("running")
			const parentDir: Inode | undefined = followPath(_root, await dirname(path), true)
			if (parentDir instanceof Map) parentDir.set(await basename(path), content)
		},

		readFile: async function (path: string): Promise<FileData> {
			const file: Inode | undefined = followPath(_root, path)
			if (typeof file === "string") return file
			else if (file instanceof Map) throw new FilesystemError("EISDIR", path)
			else throw new FilesystemError("ENOENT", path)
		},

		readdir: async function (path: string): Promise<string[]> {
			const dir: Inode | undefined = followPath(_root, path)
			if (dir instanceof Map) return [...dir.keys()].filter((x) => !_specialPaths.includes(x))
			else if (!dir) throw new FilesystemError("ENOENT", path)
			throw new FilesystemError("ENOTDIR", path)
		},

		mkdir: async function (path: string) {
			followPath(_root, path, true)
		},

		rm: async function (path: string) {
			const parentDir: Inode | undefined = followPath(_root, await dirname(path), true)
			if (parentDir instanceof Map) parentDir.delete(await basename(path))
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

			if (!target) {
				if (!makeParent) return undefined
				parentDir.set(path, initDir(parentDir))
				target = parentDir.get(path) ?? undefined
			}
		}
	} else {
		for (const path of pathList) {
			if (target instanceof Map) target = target.get(path) ?? undefined
			else break

			if (!target) return undefined
		}
	}

	return target
}

async function dirname(path: string): Promise<string> {
	return path
		.split("/")
		.filter((x) => ![".", ""].includes(x))
		.slice(0, -1)
		.join("/")
}

async function basename(path: string): Promise<string> {
	return path
		.split("/")
		.filter((x) => ![".", ""].includes(x))
		.at(-1)!
}
