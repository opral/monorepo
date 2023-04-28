import type { Filesystem, NodeishFilesystem, FileData } from "./schema.js"
import type { MemoryFilesystem, MemoryDirectory, MemoryInode } from "./schema-internal.js"
import { FilesystemError } from "./FilesystemError.js"

type Directory = MemoryDirectory
type Inode = MemoryInode

function dirToArray(dir: Directory, base: string, specialPaths: string[]): string[][] {
	let pathArray: string[][] = []
	for (const kv of dir) {
		if (specialPaths.includes(kv[0])) continue
		if (kv[1] instanceof Map) {
			pathArray = [...pathArray, ...dirToArray(kv[1], `${base}/${kv[0]}`, specialPaths)]
		} else if (typeof kv[1] === "string") {
			pathArray.push([`${base}/${kv[0]}`, kv[1]])
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

export function toNodeFs(memoryFs: MemoryFilesystem): NodeishFilesystem {
	return {
		_root: memoryFs._root,

		_specialPaths: memoryFs._specialPaths,

		dirname: async function (path: string): Promise<string> {
			return path
				.split("/")
				.filter((x) => !this._specialPaths.includes(x))
				.slice(0, -1)
				.join("/")
		},

		basename: async function (path: string): Promise<string> {
			return path
				.split("/")
				.filter((x) => !this._specialPaths.includes(x))
				.at(-1)!
		},

		writeFile: async function (path: string, content: FileData) {
			const parentDir: Inode | undefined = followPath(this._root, await this.dirname(path), true)
			if (parentDir instanceof Map) parentDir.set(await this.basename(path), content)
		},

		readFile: async function (
			path: string,
			options: { encoding: string } | string,
		): Promise<FileData> {
			const encoding: string | undefined = typeof options === "string" ? options : options?.encoding

			const file: Inode | undefined = followPath(this._root, path)
			if (typeof file === "string") {
				if (["utf8", "utf-8"].includes(encoding?.toLowerCase())) return file
				throw new Error(`Only utf8 encoding is supported in readFile.`)
			}

			if (!file) throw new FilesystemError("ENOENT", path)
			throw new FilesystemError("EISDIR", path)
		},

		readdir: async function (path: string): Promise<string[]> {
			const dir: Inode | undefined = followPath(this._root, path)
			if (dir instanceof Map) return [...dir.keys()].filter((x) => !this._specialPaths.includes(x))
			if (!dir) throw new FilesystemError("ENOENT", path)
			throw new FilesystemError("ENOTDIR", path)
		},

		mkdir: async function (path: string, options: any) {
			const parentDir: Inode | undefined = followPath(
				this._root,
				await this.dirname(path),
				options?.recursive ?? false,
			)

			if (!parentDir) throw new FilesystemError("ENOENT", path)
			else if (parentDir instanceof Map)
				parentDir.set(await this.basename(path), initDir(parentDir))
			else throw new FilesystemError("ENOTDIR", path)
		},

		toJson: async function (): Promise<Record<string, string>> {
			return Object.fromEntries(dirToArray(this._root, "", this._specialPaths))
		},

		rm: async function (path: string, options: any) {
			const parentDir: Inode | undefined = followPath(this._root, await this.dirname(path), false)
			if (!parentDir) throw new FilesystemError("ENOENT", path)

			if (parentDir instanceof Map) {
				const basename = await this.basename(path)
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

		rmdir: async function (path: string, options: any) {
			const parentDir: Inode | undefined = followPath(this._root, await this.dirname(path), false)
			if (!parentDir) throw new FilesystemError("ENOENT", path)

			if (parentDir instanceof Map) {
				const basename = await this.basename(path)
				const dir: Inode | undefined = parentDir.get(basename)
				switch (typeof dir) {
					case "string":
						throw new FilesystemError("ENOTDIR", path)
					case "object":
						if (dir instanceof Uint8Array) throw new FilesystemError("ENOTDIR", path)
						if (options?.recursive || dir.size === this._specialPaths.length)
							parentDir.delete(basename)
						else throw new FilesystemError("ENOTEMPTY", path)
						break
					case "undefined":
						throw new FilesystemError("ENOENT", path)
				}
			} else throw new FilesystemError("ENOTDIR", path)
		},

		fromJson: async function (json: Record<string, string>): Promise<Filesystem> {
			for (const kv of Object.entries(json)) {
				this.writeFile(kv[0], kv[1])
			}
			return this
		},
	} as MemoryFilesystem & NodeishFilesystem
}
