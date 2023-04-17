// ------------------------------------------------------
// Client side code that must execute before the server side code.
// ------------------------------------------------------

import type { EnvironmentFunctions } from "@inlang/core/config"
import type { generateConfigFileServer } from "./generateConfigFile.js"
import { rpc } from "../client.js"

/** filter to exclude filesystem directories */
const filters = ["node_modules", "dist", ".git", ".Trash"]

/** Wrapper function to read and filter the filesystem client side. */
export async function generateConfigFileClient(args: {
	fs: EnvironmentFunctions["$fs"]
	path: string
}): ReturnType<typeof generateConfigFileServer> {
	try {
		const filesystemAsJson = await readdirRecursive(args)
		// @ts-ignore - this is a client side function
		return await rpc.generateConfigFileServer({ filesystemAsJson })
	} catch (error) {
		return [undefined, error] as any
	}
}

export function withClientSidePatch(client: typeof rpc) {
	return new Proxy(client, {
		// patching client side routes
		get(target, prop) {
			if (prop === "generateConfigFile") {
				return async (...args: Parameters<typeof generateConfigFileClient>) => {
					const { generateConfigFileClient } = await import("./generateConfigFile.client.js")
					return generateConfigFileClient(...args)
				}
			}
			return (target as any)[prop]
		},
	})
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
		if (filters.some((filter) => fullPath.includes(filter))) {
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
