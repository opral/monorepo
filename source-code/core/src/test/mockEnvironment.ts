import { EnvironmentFunctions, initialize$import } from "../config/index.js"
import { fs as memfs } from "memfs"
import dedent from "dedent"

/**
 * Initializes a mock environment.
 *
 * The mock environment uses a virtual file system (memfs). If
 * testing inlang depends on files in the local file system,
 * you can copy directories into the environment by providing
 * the `copyDirectory` argument.
 *
 * @param copyDirectory - if defined, copies directories (paths) into the environment
 */
export async function mockEnvironment(args: {
	copyDirectory?: {
		fs: EnvironmentFunctions["$fs"]
		paths: string[]
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
		for (const path of args.copyDirectory.paths) {
			await copyDirectory({ copyFrom: args.copyDirectory.fs, copyTo: $fs, path })
		}
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
	try {
		await args.copyFrom.readdir(args.path)
	} catch {
		throw new Error(dedent`
The directory specified in \`copyDirectory.path\` "${args.path}" does not exist.

Solution: Make sure that the \`copyDirectory.path\` is relative to the current working directory ${process.cwd()}.

Context: The path is relative to the current working directory, not the file that calls \`mockEnvironment\`.
		`)
	}
	// create directory
	await args.copyTo.mkdir(args.path, { recursive: true })
	const pathsInDirectory = await args.copyFrom.readdir(args.path)
	for (const subpath of pathsInDirectory) {
		let isFile = true
		// check if the path is a file
		try {
			await args.copyFrom.readFile(`${args.path}/${subpath}`)
		} catch {
			isFile = false
		}
		const path = normalizePath(`${args.path}/${subpath}`)
		if (isFile) {
			const file = await args.copyFrom.readFile(path, { encoding: "utf-8" })
			await args.copyTo.writeFile(path, file)
		} else {
			await copyDirectory({ ...args, path })
		}
	}
}

/*
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
function normalizePath(path: string) {
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
