import type { NodeishFilesystem } from "../interface.js"
// @ts-expect-error - outmatch is not updated for export maps
import outmatch from "outmatch"
import { normalizePath } from "./normalizePath.js"
import { assertIsAbsolutePath } from "./assertIsAbsolutePath.js"

/**
 * Serializes the filesystem to a JSON that can be sent over the network.
 *
 * Use `cwd` to define the directory to resolve from.
 *
 * Use `match` to define which files to include. Match uses
 * https://github.com/axtgr/outmatch#syntax for matching.
 *
 * @example
 *   // match everything but node_modules
 *   const result = await toJson(fs, {
 * 		match: [
 * 			"**\/*"
 * 			"!node_modules"
 * 		],
 * 		cwd: "/"
 * 		})
 *
 *   	>> { "file1.txt": "content", "file2.txt": "content" }
 *
 */
export async function toJson(args: {
	fs: NodeishFilesystem
	matchers: string[]
	/**
	 * The path to resolve from.
	 *
	 * TODO: @araknast we should likely drop the cwd in favor of absolute paths everywhere.
	 * TODO: cwd doesn't exist in the browser and will lead to confusion. I named this
	 * TODO: `resolveFrom` now but can we come up with a name like "absolutePath"
	 * TODO: to make it more clear what it does? `resolveFrom` might be ambigous.
	 */
	resolveFrom: string
}): Promise<Record<string, string>> {
	assertIsAbsolutePath(args.resolveFrom)

	let result: Record<string, string> = {}
	const isMatch = outmatch(args.matchers)

	const files = await args.fs.readdir(args.resolveFrom)

	for (const file of files) {
		const fullPath = normalizePath(`${args.resolveFrom}/${file}`)
		let isDirectory = false

		try {
			await args.fs.readFile(fullPath, { encoding: "utf-8" })
		} catch (error) {
			console.log(error)
			isDirectory = true
		}
		if (isDirectory) {
			// If the item is a directory, recurse into it and add the results to the current list
			const subList = await toJson({ ...args, resolveFrom: fullPath })
			result = { ...result, ...subList }
		} else if (isMatch(fullPath) === false) {
			continue
		} else {
			const content = await args.fs.readFile(fullPath, { encoding: "utf-8" })
			if (!content) throw new Error(`${fullPath} does not exist.`)

			// remove the leading slash
			result[fullPath.slice(1)] = content as string
		}
	}
	return result
}
