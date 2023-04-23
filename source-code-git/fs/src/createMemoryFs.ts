import type { Filesystem, FileData } from "./schema.js"
import type { MemoryFilesystem, MemoryDirectory, MemoryInode } from "./schema-internal.js"
import { FilesystemError } from "./FilesystemError.js"

type Directory = MemoryDirectory
type Inode = MemoryInode

function dirToArray(dir: Directory, base: string): Array<Array<string>> {
	const specialPaths = ["", ".", ".."]
	let pathArray: Array<Array<string>> = []
	for (const kv of dir) {
		if (specialPaths.includes(kv[0])) continue
		if (kv[1] instanceof Map) {
			pathArray = [...pathArray, ...dirToArray(kv[1], base + "/" + kv[0])]
		} else if (typeof kv[1] === "string") {
			pathArray.push([base + "/" + kv[0], kv[1]])
		}
	}
	return pathArray
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

export function createMemoryFs(): MemoryFilesystem {
	return {
		_root: initDir(new Map()),

		_specialPaths: ["", ".", ".."],

		dirname: async function (path: string): Promise<string> {
			return path
				.split("/")
				.filter((x) => ![".", ""].includes(x))
				.slice(0, -1)
				.join("/")
		},

		basename: async function (path: string): Promise<string> {
			return path
				.split("/")
				.filter((x) => ![".", ""].includes(x))
				.at(-1)!
		},

		writeFile: async function (path: string, content: FileData) {
			const parentDir: Inode | undefined = followPath(this._root, await this.dirname(path), true)
			if (parentDir instanceof Map) parentDir.set(await this.basename(path), content)
		},

		readFile: async function (path: string): Promise<FileData> {
			const file: Inode | undefined = followPath(this._root, path)
			if (typeof file === "string") return file
			else if (file instanceof Map) throw new FilesystemError("EISDIR", path)
			else throw new FilesystemError("ENOENT", path)
		},

		readdir: async function (path: string): Promise<string[]> {
			const dir: Inode | undefined = followPath(this._root, path)
			if (dir instanceof Map) return [...dir.keys()].filter((x) => !this._specialPaths.includes(x))
			else if (!dir) throw new FilesystemError("ENOENT", path)
			throw new FilesystemError("ENOTDIR", path)
		},

		mkdir: async function (path: string) {
			followPath(this._root, path, true)
		},

		toJson: async function (): Promise<Record<string, string>> {
			return Object.fromEntries(dirToArray(this._root, ""))
		},

		rm: async function (path: string) {
			const parentDir: Inode | undefined = followPath(this._root, await this.dirname(path), true)
			if (parentDir instanceof Map) parentDir.delete(await this.basename(path))
		},

		fromJson: async function (json: Record<string, string>): Promise<Filesystem> {
			for (const kv of Object.entries(json)) {
				this.writeFile(kv[0], kv[1])
			}
			return this
		},
	}
}
