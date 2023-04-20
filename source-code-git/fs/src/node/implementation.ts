import type { Filesystem } from "../schema.js"
// eslint-disable-next-line no-restricted-imports
import * as fs from "node:fs/promises"

async function dirToArray(dir: string): Promise<string[][]> {
	let pathArray: string[][] = []
	for (const dirent of await fs.readdir(dir)) {
		try {
			const fileData: string = await fs.readFile(`${dir}/${dirent}`, "utf8")
			pathArray.push([`${dir}/${dirent}`, fileData])
		} catch (e) {
			pathArray = [...pathArray, ...(await dirToArray(`${dir}/${dirent}`))]
		}
	}
	return pathArray
}

export function fromNodeFs(nodeFs: any): Filesystem {
	return {
		writeFile: nodeFs.writeFile.bind(nodeFs),

		readFile: nodeFs.readFile.bind(nodeFs),

		readdir: nodeFs.readdir.bind(nodeFs),

		mkdir: nodeFs.mkdir.bind(nodeFs),

		rm: nodeFs.rm.bind(nodeFs),

		rmdir: nodeFs.rmdir.bind(nodeFs),

		toJson: async function (args: any = {}): Promise<Record<string, string>> {
			if (!args.dir) args.dir = process.cwd()
			return Object.fromEntries(await dirToArray(args.dir))
		},

		fromJson: async function (json: Record<string, string>): Promise<Filesystem> {
			const specialPaths = ["", ".", ".."]
			const dirname = (path: string): string => {
				return (
					"/" +
					path
						.split("/")
						.filter((x) => !specialPaths.includes(x))
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
	}
}
