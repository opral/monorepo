import type { Filesystem } from "../schema.js"

type FileData = string
type Directory = Map<string, Inode>
type Inode = FileData | Directory

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
	makeParent: boolean = false
): Inode | undefined {
	const pathList: string[] = path.split("/")
	let parentDir: Directory


	if (makeParent) {
		for (let path of pathList) {

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
		for (let path of pathList) {
			if (target instanceof Map) 
				target = target.get(path) ?? undefined
			else break

			if (!target) return undefined
		}
	}

	return target
}

interface MemoryFilesystem extends Filesystem { 
	_root: Map<string, Inode>
	dirname: (path: string) => string
	basename: (path: string) => string
}

export function createMemoryFs(): Filesystem {
	return {
		_root: initDir(new Map()),

		dirname: (path: string): string  => path.split("/").slice(0, -1).join("/"),
		basename: (path: string): string => path.split("/").slice(-1)[0]!,

		writeFile: async function (path: string, content: FileData) {
			const parentDir: Inode | undefined = followPath(this._root, this.dirname(path), true)
			if (parentDir instanceof Map) parentDir.set(this.basename(path), content)
		},

		readFile: async function (path: string): Promise<FileData | undefined> {
			const file: Inode | undefined = followPath(this._root, path)
			return typeof file === "string" ? file : undefined
		},

		readdir: async function (path: string): Promise<string[] | undefined> {
			const dir: Inode | undefined = followPath(this._root, path)
			const specialPaths: Array<string> = ["", ".", ".."]
			if (dir instanceof Map)
				return [...dir.keys()].filter(x => !(specialPaths.includes(x)))
			else return
		},

		mkdir: async function (path: string) {
			followPath(this._root, path, true)
		},

		toJson: async function(): Promise<Record<string, string>> {
			return Object.fromEntries(dirToArray(this._root, ''))
		},

		rm: async function(path: string) {
			const parentDir: Inode | undefined = followPath(this._root, this.dirname(path), true)
			if (parentDir instanceof Map) parentDir.delete(this.basename(path))
		},

		fromJson: async function (json: Record<string, string>): Promise<Filesystem> {
			for (const kv of Object.entries(json)) {
				this.writeFile(kv[0], kv[1])
			}
			return this
		}
	} as MemoryFilesystem
}
