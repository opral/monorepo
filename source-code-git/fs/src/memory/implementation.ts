import type { Filesystem } from "../schema.js"
import { FsError } from "../FsError.js"

type FileData = string
type Directory = Map<string, Inode>
type Inode = FileData | Directory

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


interface MemoryFilesystem extends Filesystem {
	_root: Map<string, Inode>
	_specialPaths: string[]
	dirname: (path: string) => string
	basename: (path: string) => string
}

export function createMemoryFs(): Filesystem {
	return {
		_root: initDir(new Map()),
		_specialPaths: ["", ".", ".."],

		dirname: function (path: string): string {
			return path.split("/")
			.filter(x => !this._specialPaths.includes(x))
			.slice(0, -1)
			.join("/")
		},

		basename: function (path: string): string {
			return path.split("/")
			.filter(x => !this._specialPaths.includes(x))
			.at(-1)!
		},

		writeFile: async function (path: string, content: FileData) {
			const parentDir: Inode | undefined = followPath(this._root, this.dirname(path), true)
			if (parentDir instanceof Map) parentDir.set(this.basename(path), content)
		},

		// NOTE: We don't have `Buffer` so we deviate from node behavior here
		// and return a string.
		readFile: async function (path: string, encoding = "utf8"): Promise<FileData> {

			if (! ["utf8", "utf-8"].includes(encoding.toLowerCase()))
				throw new Error("Invalid encoding specified.")

			const file: Inode | undefined = followPath(this._root, path)
			if (typeof file === "string") return file
			if (!file) throw new FsError("ENOENT")
			throw new FsError("EISDIR")
		},

		readdir: async function (path: string): Promise<string[]> {
			const dir: Inode | undefined = followPath(this._root, path)
			if (typeof dir === "string") throw new FsError("ENOTDIR")
			if (!dir) throw new FsError("ENOENT")
			return [...dir.keys()].filter((x) => !this._specialPaths.includes(x))
		},

		mkdir: async function (path: string, options: any) {
			const parentDir: Inode | undefined = followPath(
				this._root,
				this.dirname(path),
				options?.recursive ?? false
			)

			if (!parentDir) throw new FsError("ENOENT")
			else if (parentDir instanceof Map) 
				parentDir.set(this.basename(path), initDir(parentDir))
			else
				throw new FsError("ENOTDIR")
		},

		toJson: async function (): Promise<Record<string, string>> {
			return Object.fromEntries(dirToArray(this._root, "", this._specialPaths))
		},

		rm: async function (path: string, options: any) {
			const parentDir: Inode | undefined = followPath(
				this._root, 
				this.dirname(path), 
				false
			)

			if (!parentDir) throw new FsError("ENOENT")

			if (parentDir instanceof Map) {
				const basename = this.basename(path)
				switch (typeof parentDir.get(basename)) {
					case "string":
						parentDir.delete(basename)
						break
					case "object":
						if (options?.recursive) 
							parentDir.delete(basename)
						else 
							throw new FsError("EISDIR")
						break
					case "undefined":
						throw new FsError("ENOENT")
				}
			} else throw new FsError("ENOTDIR")
		},

		rmdir: async function (path: string, options: any) {
			await this.rm(path, options)
		},

		fromJson: async function (json: Record<string, string>): Promise<Filesystem> {
			for (const kv of Object.entries(json)) {
				this.writeFile(kv[0], kv[1])
			}
			return this
		},
	} as MemoryFilesystem
}
