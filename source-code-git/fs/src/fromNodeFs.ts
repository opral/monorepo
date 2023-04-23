import type { NodeishFilesystem, Filesystem, FileData } from "./schema.js"
import type { MemoryFilesystem } from "./schema-internal.js"

/* eslint-env node */
/* eslint-disable-next-line no-restricted-imports */
import * as _fs from "node:fs/promises"

async function dirToArray(dir: string): Promise<string[][]> {
	let pathArray: string[][] = []
	for (const dirent of await _fs.readdir(dir)) {
		try {
			const fileData: string = await _fs.readFile(`${dir}/${dirent}`, "utf8")
			pathArray.push([`${dir}/${dirent}`, fileData])
		} catch (e) {
			pathArray = [...pathArray, ...(await dirToArray(`${dir}/${dirent}`))]
		}
	}
	return pathArray
}

async function filterPath(path: string): Promise<string> {
	return path[0] === "/"
		? "/" +
				path
					.split("/")
					.filter((x) => !["", "/"].includes(x))
					.join("/")
		: path
				.split("/")
				.filter((x) => !["", "/"].includes(x))
				.join("/")
}

export function fromNodeFs(nodeFs: NodeishFilesystem): MemoryFilesystem {
	return {
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
			const parentDir = await this.dirname(path)
			path = await filterPath(path)
			try {
				await nodeFs.readdir(parentDir)
				await nodeFs.writeFile(path, content)
			} catch (e: any) {
				if (e?.code === "ENOENT") {
					await this.mkdir(parentDir)
					await nodeFs.writeFile(path, content)
				}
			}
		},

		readFile: async function (path: string): Promise<FileData> {
			path = await filterPath(path)
			const data = await nodeFs.readFile(path, { encoding: "utf8" })
			if (typeof data !== "string")
				throw new Error("readFile with utf8 encoding did not return string.")

			return data
		},

		readdir: async function (path: string) {
			path = await filterPath(path)
			return nodeFs.readdir(path)
		},

		mkdir: async function (path: string) {
			path = await filterPath(path)
			return nodeFs.mkdir(path, { recursive: true })
		},

		rm: async function (path: string) {
			path = await filterPath(path)
			return nodeFs.rm(path, { recursive: true, force: true })
		},

		toJson: async function (args: any = {}): Promise<Record<string, string>> {
			if (!args.dir && process) args.dir = process.cwd()
			return Object.fromEntries(await dirToArray(args.dir))
		},

		fromJson: async function (json: Record<string, string>): Promise<Filesystem> {
			const dirname = (path: string): string => {
				return (
					"/" +
					path
						.split("/")
						.filter((x) => !this._specialPaths.includes(x))
						.slice(0, -1)
						.join("/")
				)
			}

			for (const kv of Object.entries(json)) {
				await this.mkdir(dirname(kv[0]), { recursive: true })
				await this.writeFile(kv[0], kv[1])
			}
			return this
		},
	} as MemoryFilesystem & NodeishFilesystem
}
