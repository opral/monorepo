import { EnvironmentFunctions, initialize$import } from "../config/index.js"
import { fs as memfs } from "memfs"

/**
 * Initializes a mock environment.
 *
 * The mock environment uses a virtual file system (memfs). If
 * testing inlang depends on files in the local file system,
 * you can copy the directory into the environment by providing
 * the `copyDirectory` argument.
 *
 * @param copyDirectory - if defined, copies the directory into the environment
 */
export async function mockEnvironment(args: {
	copyDirectory?: {
		fs: EnvironmentFunctions["$fs"]
		path: string
	}
}): Promise<EnvironmentFunctions> {
	const $fs = memfs.promises as EnvironmentFunctions["$fs"]
	const $import = initialize$import({
		fs: $fs,
		fetch,
	})
	const env = {
		$fs,
		$import,
	}
	if (args.copyDirectory) {
		const { fs, path } = args.copyDirectory
		await copyDirectory({ copyFrom: fs, copyTo: $fs, path })
	}
	return env
}

/**
 * Copies a directory from one fs to another.
 *
 * Useful for mocking the environment.
 */
async function copyDirectory(args: {
	copyFrom: EnvironmentFunctions["$fs"]
	copyTo: EnvironmentFunctions["$fs"]
	path: string
}) {
	// create directory
	await args.copyTo.mkdir(args.path, { recursive: true })
	for (const file of await args.copyFrom.readdir(args.path)) {
		const isFile = (file as string).includes(".")
		const _path = normalizePath(`${args.path}/${file}`)
		if (isFile) {
			await args.copyTo.writeFile(
				_path,
				// @ts-ignore
				(await args.copyFrom.readFile(_path, { encoding: "utf-8" })) as string,
			)
		} else {
			await copyDirectory({ ...args, path: _path })
		}
	}
}

/*
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
export function normalizePath(path: string) {
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
