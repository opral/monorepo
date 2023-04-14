import type { Filesystem } from "../schema.js"

type FileData = string
type Directory = Map<string, Inode>
type Inode = FileData | Directory

export class MemoryFs implements Filesystem {
	root: Directory
	specialPaths: string[]

	constructor(root: Directory = new Map()) {
		this.root = root
		this.specialPaths = ["", ".", ".."]
		this.root.set("", this.root) 
		this.root.set(".", this.root) 
		this.root.set("..", this.root) 
	}

	_newDir(parentDir: Directory) {
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

	_followPath(path: string, makeParent: boolean = false): Inode | undefined {
		const pathList: string[] = path.split("/")
		let target: Inode | undefined = this.root
		let parentDir: Directory

		if (makeParent) {
			for (let path of pathList) {

				if (target instanceof Map) {
					parentDir = target
					target = target.get(path) ?? undefined
				} else break

				if (!target) {
					if (!makeParent) return undefined
					parentDir.set(path, this._newDir(parentDir))
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

	dirname = (path: string): string  => path.split("/").slice(0, -1).join("/")
	basename = (path: string): string => path.split("/").slice(-1)[0]

	async writeFile(path: string, content: FileData) {
		const parentDir: Inode | undefined = this._followPath(this.dirname(path), true)
		if (parentDir instanceof Map) parentDir.set(this.basename(path), content)
	}

	async readFile(path: string): Promise<FileData | undefined> {
		const file: Inode | undefined = this._followPath(path)
		return typeof file === "string" ? file : undefined
	}

	async readdir(path: string): Promise<string[] | undefined> {
		const dir: Inode | undefined = this._followPath(path)
		if (dir instanceof Map)
			return [...dir.keys()].filter(x => !(this.specialPaths.includes(x)))
		else return
	}

	async mkdir(path: string) {
		this._followPath(path, true)
	}
	
	_dirToJson(dir: Directory): Record<string,any> {
		const json: Record<string, any> = {}
		for (let kv of dir) {
			if (this.specialPaths.includes(kv[0])) continue
			if (kv[1] instanceof Map) {
				json[kv[0]] = this._dirToJson(kv[1])
			} else if (typeof kv[1] === "string"){
				json[kv[0]] = kv[1]
			}
		}
		return json
	}

	async toJson(args: any): Promise<Record<string, any>> {
		return this._dirToJson(this.root)
	}

	static _dirFromJson(json: Record<string, any>): Directory {
		const dir: Directory = new Map()
		for (let kv of Object.entries(json)) {
			if (typeof kv[1] === "object") {
				dir.set(kv[0], MemoryFs._dirFromJson(kv[1]))
			} else if (typeof kv[1] === "string") {
				dir.set(kv[0], kv[1])
			}
		}
		return dir
	}

	static async fromJson(jsonString: string): Promise<Filesystem> {
		const json: Record<string, any> = JSON.parse(jsonString)
		return new MemoryFs(MemoryFs._dirFromJson(json))
	}
}
