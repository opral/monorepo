import type { NodeishFilesystem } from "../interface.js"
// @ts-expect-error - outmatch is not updated for export maps
import outmatch from "outmatch"
import { normalizePath } from "./normalizePath.js"
import { assertIsAbsolutePath } from "./assertIsAbsolutePath.js"
import { encode as encodeBase64 } from "js-base64"

/**
 * Serializes the filesystem to a JSON object that can be sent over the network.
 * File data is base64 encoded.
 *
 * Use `resolveFrom` to define the directory to resolve from.
 *
 * Use `matchers` to define which files to include. Uses
 * https://github.com/axtgr/outmatch#syntax for matching.
 *
 * @example
 *   // match everything but node_modules
 *   const result = await toJson(fs, {
 * 		matchers: [
 * 			"**\/*"
 * 			"!node_modules"
 * 		],
 * 		resolveFrom: "/"
 * 		})
 *
 *   	>> { "file1.txt": "29udGVudDE=", "file2.txt": "Y29udGVudDM="" }
 *
 */
export async function toJson(args: {
	fs: NodeishFilesystem
	matchers: string[]
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
			await args.fs.readFile(fullPath, { encoding: "binary" })
		} catch (error) {
			isDirectory = true
		}
		if (isDirectory) {
			// If the item is a directory, recurse into it and add the results to the current list
			const subList = await toJson({ ...args, resolveFrom: fullPath })
			result = { ...result, ...subList }
		} else if (isMatch(fullPath) === false) {
			continue
		} else {
			const content = await args.fs.readFile(fullPath, { encoding: "binary" })
			if (!content) throw new Error(`${fullPath} does not exist.`)
			if (typeof content !== "string")
				throw new Error(
					`Badly behaved filesystem, expected string from readFile but got'${content.constructor.name}'.`,
				)

			result[fullPath.slice(1)] = encodeBase64(content)
		}
	}
	return result
}
