import type { Result } from "@inlang/core/utilities"
import type { EnvironmentFunctions } from "@inlang/core/config"
import type { CreateChatCompletionRequest } from "openai"

/**
 * The endpoint for the api call shared with the .server.ts file.
 */
export const ENDPOINT = "/shared/openai/generate-config-file"

/**
 * Generates a configuration file for inlang.
 *
 * @example
 * // generate a config file for the current directory
 * const [response, error] = await generateConfigFile({ fs: fs.promises, path: "./" })
 */
export async function generateConfigFile(args: {
	fs: EnvironmentFunctions["$fs"]
	path: string
}): Promise<
	Result<string, { chatGPTMessages?: CreateChatCompletionRequest["messages"]; message: string }>
> {
	try {
		// all files in the project as a json object
		const filesystemAsJson = await readdirRecursive(args)
		const response = await fetch("http://localhost:3000" + ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ filesystemAsJson }),
		})
		const data = (await response.json()) as Result<string, any>
		return data
	} catch (e) {
		return [undefined, { message: (e as Error).message }]
	}
}

/**
 * Recursively reads the contents of a directory.
 */
async function readdirRecursive(args: {
	fs: EnvironmentFunctions["$fs"]
	path: string
}): Promise<Record<string, string>> {
	const { fs, path } = args
	let result: Record<string, string> = {}
	// Read the contents of the current directory
	const files = await fs.readdir(path)
	// Loop through each file/directory
	for (const file of files) {
		// Construct the full path to the file/directory
		const fullPath = normalizePath(`${path}/${file}`)
		// Check if the current item is a directory by trying to read it
		let isDirectory = false
		try {
			await fs.readFile(fullPath)
		} catch (error) {
			isDirectory = true
		}
		// don't include node_modules and dist folders as they are not source code
		if (
			fullPath.includes("node_modules") ||
			fullPath.includes("dist") ||
			fullPath.includes(".git") ||
			fullPath.includes(".Trash")
		) {
			continue
		} else if (isDirectory) {
			// If the item is a directory, recurse into it and add the results to the current list
			const subList = await readdirRecursive({ fs, path: fullPath })
			result = { ...result, ...subList }
		} else {
			const content = await fs.readFile(fullPath, { encoding: "utf-8" })
			result[fullPath] = content as string
		}
	}
	return result
}

/*
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
function normalizePath(path: string) {
	if (typeof path !== "string") {
		throw new TypeError("expected path to be a string")
	}

	if (path === "\\" || path === "/") return "/"

	const len = path.length
	if (len <= 1) return path

	// ensure that win32 namespaces has two leading slashes, so that the path is
	// handled properly by the win32 version of path.parse() after being normalized
	// https://msdn.microsoft.com/library/windows/desktop/aa365247(v=vs.85).aspx#namespaces
	let prefix = ""
	if (len > 4 && path[3] === "\\") {
		const ch = path[2]
		if ((ch === "?" || ch === ".") && path.slice(0, 2) === "\\\\") {
			path = path.slice(2)
			prefix = "//"
		}
	}
	const segs = path.split(/[/\\]+/)
	return prefix + segs.join("/")
}
